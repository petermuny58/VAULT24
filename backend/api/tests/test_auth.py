"""
api/tests/test_auth.py — Integration tests for the authentication layer.

Tests cover:
  • Registration  (success, duplicate email, validation, password hashing)
  • Login         (success, bad password, unknown email, locked account)
  • Logout        (session is destroyed)
  • /auth/me      (requires session, returns profile)
  • Decorators    (require_auth 401, require_role 403)
  • AuditLog      (security events recorded)

Run with:
    python manage.py test api.tests.test_auth
"""

import json
from django.test import TestCase, Client
from api.models import User, UserRole, CustomerStatus, AuditLog
from api.auth import hash_password


class AuthRegisterTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.url = "/auth/register"

    def _post(self, data: dict):
        return self.client.post(
            self.url,
            data=json.dumps(data),
            content_type="application/json",
        )

    def test_register_success(self):
        resp = self._post({
            "email": "alice@example.com",
            "password": "Str0ngPass!",
            "full_name": "Alice Example",
        })
        self.assertEqual(resp.status_code, 201)
        body = resp.json()
        self.assertIn("data", body)
        self.assertEqual(body["data"]["email"], "alice@example.com")
        # Password must never be in the response
        self.assertNotIn("password", body["data"])

    def test_register_stores_hash_not_plaintext(self):
        self._post({
            "email": "bob@example.com",
            "password": "S3cr3tWord",
            "full_name": "Bob",
        })
        user = User.objects.get(email="bob@example.com")
        # Django's Argon2PasswordHasher stores as "argon2$argon2id$v=..."
        self.assertTrue(user.password.startswith("argon2$"))
        self.assertIn("argon2id", user.password)
        self.assertNotEqual(user.password, "S3cr3tWord")

    def test_register_duplicate_email(self):
        User.objects.create(
            email="dup@example.com",
            full_name="Dup",
            password=hash_password("pass1234"),
        )
        resp = self._post({
            "email": "dup@example.com",
            "password": "anotherpass",
            "full_name": "Dup2",
        })
        self.assertEqual(resp.status_code, 409)
        self.assertEqual(resp.json()["error"]["code"], "conflict")

    def test_register_missing_fields(self):
        resp = self._post({"email": "x@x.com"})  # no password, no name
        self.assertEqual(resp.status_code, 400)

    def test_register_short_password(self):
        resp = self._post({
            "email": "short@x.com",
            "password": "abc",
            "full_name": "Short",
        })
        self.assertEqual(resp.status_code, 400)
        self.assertIn("password", resp.json()["error"]["message"])

    def test_register_emits_audit_log(self):
        self._post({
            "email": "audit@example.com",
            "password": "AuditPass1!",
            "full_name": "Audit User",
        })
        self.assertTrue(
            AuditLog.objects.filter(action="register_success", target__icontains="audit").exists()
            or AuditLog.objects.filter(action="register_success").exists()
        )


class AuthLoginTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create(
            email="carol@example.com",
            full_name="Carol",
            password=hash_password("CarolPass99"),
            role=UserRole.CUSTOMER,
            status=CustomerStatus.ACTIVE,
        )

    def _login(self, email="carol@example.com", password="CarolPass99"):
        return self.client.post(
            "/auth/login",
            data=json.dumps({"email": email, "password": password}),
            content_type="application/json",
        )

    def test_login_success(self):
        resp = self._login()
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertEqual(body["data"]["email"], "carol@example.com")
        self.assertNotIn("password", body["data"])

    def test_login_sets_session_cookie(self):
        resp = self._login()
        self.assertIn("vault24_sid", resp.cookies)

    def test_login_bad_password(self):
        resp = self._login(password="wrong!")
        self.assertEqual(resp.status_code, 401)
        self.assertEqual(resp.json()["error"]["code"], "unauthenticated")

    def test_login_unknown_email(self):
        resp = self._login(email="nobody@example.com")
        self.assertEqual(resp.status_code, 401)
        # Must use same generic message (no enumeration)
        self.assertEqual(resp.json()["error"]["message"], "Invalid email or password.")

    def test_login_locked_account(self):
        self.user.status = CustomerStatus.LOCKED
        self.user.save()
        resp = self._login()
        self.assertEqual(resp.status_code, 401)

    def test_login_success_audit(self):
        self._login()
        self.assertTrue(
            AuditLog.objects.filter(
                action="login_success",
                actor="carol@example.com",
            ).exists()
        )

    def test_login_failure_audit(self):
        self._login(password="wrong!")
        self.assertTrue(
            AuditLog.objects.filter(
                action="login_failed_bad_password",
                actor="carol@example.com",
            ).exists()
        )


class AuthLogoutTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create(
            email="dave@example.com",
            full_name="Dave",
            password=hash_password("DavePass99"),
        )
        # Log in to get a session
        self.client.post(
            "/auth/login",
            data=json.dumps({"email": "dave@example.com", "password": "DavePass99"}),
            content_type="application/json",
        )

    def test_logout_success(self):
        resp = self.client.post("/auth/logout", content_type="application/json")
        self.assertEqual(resp.status_code, 200)

    def test_logout_destroys_session(self):
        self.client.post("/auth/logout", content_type="application/json")
        # /auth/me should now return 401
        resp = self.client.get("/auth/me")
        self.assertEqual(resp.status_code, 401)

    def test_logout_while_unauthenticated(self):
        fresh = Client()
        resp = fresh.post("/auth/logout", content_type="application/json")
        self.assertEqual(resp.status_code, 200)  # Idempotent


class AuthMeTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create(
            email="eve@example.com",
            full_name="Eve",
            password=hash_password("EvePass99"),
            role=UserRole.CUSTOMER,
        )
        self.client.post(
            "/auth/login",
            data=json.dumps({"email": "eve@example.com", "password": "EvePass99"}),
            content_type="application/json",
        )

    def test_me_returns_profile(self):
        resp = self.client.get("/auth/me")
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertEqual(body["data"]["email"], "eve@example.com")

    def test_me_no_password_in_response(self):
        resp = self.client.get("/auth/me")
        self.assertNotIn("password", resp.json()["data"])

    def test_me_unauthenticated(self):
        fresh = Client()
        resp = fresh.get("/auth/me")
        self.assertEqual(resp.status_code, 401)
        self.assertEqual(resp.json()["error"]["code"], "unauthenticated")
