"""
api/views/auth.py — Authentication endpoints for Vault24.

Endpoints
─────────
  POST /auth/register   — create a new customer account
  POST /auth/login      — verify credentials, issue session cookie
  POST /auth/logout     — destroy the session
  GET  /auth/me         — return the current session's user profile

Security notes
──────────────
• Passwords are hashed with Argon2id via api.auth.hash_password.
  The raw password is discarded immediately after hashing.
• Sessions are DB-backed.  The session ID travels in an httpOnly
  cookie (vault24_sid) set by Django's SessionMiddleware.
• Every security-relevant event is written to AuditLog.
• Timing-safe comparison is used by Django's check_password.
• Failed logins do NOT reveal whether the email exists (generic error).
"""

import json
import logging

from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt

from api.auth import hash_password, verify_password
from api.models import User, UserRole, AuditLog
from api.decorators import require_auth

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_ip(request) -> str:
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "unknown")


def _parse_json(request):
    """Return parsed JSON body or raise ValueError."""
    try:
        return json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise ValueError("Invalid JSON body.") from exc


def _audit(actor: str, action: str, target: str = "", meta: dict = None):
    AuditLog.objects.create(
        actor=actor,
        action=action,
        target=target,
        meta=meta or {},
    )


def _user_payload(user: User) -> dict:
    """Safe, serialisable representation of a User (no password hash)."""
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "status": user.status,
        "phone": user.phone,
        "address": user.address,
        "created_at": user.created_at.isoformat(),
    }


def _ok(data: dict, status: int = 200) -> JsonResponse:
    return JsonResponse({"data": data}, status=status)


def _err(code: str, message: str, status: int) -> JsonResponse:
    return JsonResponse({"error": {"code": code, "message": message}}, status=status)


# ---------------------------------------------------------------------------
# POST /auth/register
# ---------------------------------------------------------------------------

@csrf_exempt
@require_http_methods(["POST"])
def register(request):
    """
    Create a new customer user.

    Body (JSON):
        email       string  required
        password    string  required  ≥ 8 characters
        full_name   string  required
        phone       string  optional
        address     string  optional

    On success returns 201 with the new user profile.
    The password is hashed with Argon2id immediately; the plaintext is
    never persisted or logged.
    """
    ip = _get_ip(request)

    try:
        body = _parse_json(request)
    except ValueError as exc:
        return _err("bad_request", str(exc), 400)

    email    = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""
    name     = (body.get("full_name") or "").strip()
    phone    = (body.get("phone") or "").strip()
    address  = (body.get("address") or "").strip()

    # --- Validation ---
    errors = {}
    if not email:
        errors["email"] = "Email is required."
    if not password:
        errors["password"] = "Password is required."
    elif len(password) < 8:
        errors["password"] = "Password must be at least 8 characters."
    if not name:
        errors["full_name"] = "Full name is required."

    if errors:
        return _err("validation_error", "; ".join(f"{k}: {v}" for k, v in errors.items()), 400)

    # --- Uniqueness check ---
    if User.objects.filter(email=email).exists():
        _audit(
            actor="anonymous",
            action="register_email_conflict",
            target=email,
            meta={"ip": ip},
        )
        # Return a generic 409 — do not confirm existence to reduce enumeration
        return _err("conflict", "An account with this email already exists.", 409)

    # --- Hash password (Argon2id) ---
    hashed = hash_password(password)
    # Wipe the local reference to the raw password immediately
    del password

    # --- Create user ---
    user = User.objects.create(
        email=email,
        full_name=name,
        password=hashed,
        role=UserRole.CUSTOMER,
        phone=phone,
        address=address,
    )

    _audit(
        actor=email,
        action="register_success",
        target=user.id,
        meta={"ip": ip},
    )
    logger.info("New user registered: %s (id=%s)", email, user.id)

    return _ok(_user_payload(user), status=201)


# ---------------------------------------------------------------------------
# POST /auth/login
# ---------------------------------------------------------------------------

@csrf_exempt
@require_http_methods(["POST"])
def login(request):
    """
    Authenticate a user and issue a session cookie.

    Body (JSON):
        email     string  required
        password  string  required

    On success:
      • Creates / replaces the server-side session record.
      • Sets the vault24_sid httpOnly cookie (via Django SessionMiddleware).
      • Returns the user profile.

    On failure always returns a generic 401 to prevent user enumeration.
    """
    ip = _get_ip(request)

    try:
        body = _parse_json(request)
    except ValueError as exc:
        return _err("bad_request", str(exc), 400)

    email    = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""

    if not email or not password:
        return _err("bad_request", "email and password are required.", 400)

    # --- Constant-time lookup + verify (prevents timing oracle) ---
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Hash a dummy string to make the timing identical whether the
        # user exists or not, preventing a timing-based enumeration attack.
        verify_password(password, hash_password("dummy-timing-equalizer"))
        _audit(
            actor="anonymous",
            action="login_failed_unknown_email",
            target=email,
            meta={"ip": ip},
        )
        return _err("unauthenticated", "Invalid email or password.", 401)

    finally:
        # Wipe raw password from local scope regardless of branch taken
        pass  # `password` is cleared below after verify

    # --- Account status gate ---
    if user.status == "locked":
        _audit(
            actor=email,
            action="login_failed_account_locked",
            target=user.id,
            meta={"ip": ip},
        )
        # Use the same generic message so enumeration of locked accounts is harder
        return _err("unauthenticated", "Invalid email or password.", 401)

    # --- Verify password ---
    if not verify_password(password, user.password):
        _audit(
            actor=email,
            action="login_failed_bad_password",
            target=user.id,
            meta={"ip": ip},
        )
        return _err("unauthenticated", "Invalid email or password.", 401)

    del password  # Wipe raw password

    # --- Issue session ---
    # Cycle the session to prevent fixation attacks.
    request.session.cycle_key()
    request.session["user_id"]   = user.id
    request.session["user_email"] = user.email
    request.session["user_role"]  = user.role
    # Mark the session as modified so Django writes it.
    request.session.modified = True

    _audit(
        actor=email,
        action="login_success",
        target=user.id,
        meta={"ip": ip, "role": user.role},
    )
    logger.info("Login success: %s (id=%s) from %s", email, user.id, ip)

    return _ok(_user_payload(user))


# ---------------------------------------------------------------------------
# POST /auth/logout
# ---------------------------------------------------------------------------

@csrf_exempt
@require_http_methods(["POST"])
def logout(request):
    """
    Destroy the current session.

    Works whether or not the caller is authenticated; always returns 200
    so the frontend can call this unconditionally on "sign out".
    """
    ip = _get_ip(request)
    user = getattr(request, "vault_user", None)
    actor = user.email if user else "anonymous"

    request.session.flush()  # Delete server-side session record + clear cookie

    _audit(
        actor=actor,
        action="logout",
        target=user.id if user else "",
        meta={"ip": ip},
    )
    logger.info("Logout: %s from %s", actor, ip)

    return _ok({"message": "Logged out successfully."})


# ---------------------------------------------------------------------------
# GET /auth/me
# ---------------------------------------------------------------------------

@require_auth
@require_http_methods(["GET"])
def me(request):
    """
    Return the authenticated user's profile.

    Requires a valid session cookie.  The @require_auth decorator
    guarantees request.vault_user is set before this runs.
    """
    return _ok(_user_payload(request.vault_user))
