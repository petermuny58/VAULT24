"""
api/models.py — All database models for Vault24 Bank.

Design decisions
────────────────
• No Django User model — we own the full auth stack with Argon2.
• Passwords are stored exclusively as Argon2 hashes via Django's
  make_password / check_password helpers (which call the first entry in
  PASSWORD_HASHERS, i.e. Argon2PasswordHasher).
• Sessions are handled by Django's built-in session framework (DB backend).
  A random session ID is stored in an httpOnly cookie; the session record
  in the DB maps to the authenticated user.
• AuditLog captures every security-relevant event.
"""

import uuid
from django.db import models


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _uuid_str():
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------

class UserRole(models.TextChoices):
    CUSTOMER = "customer", "Customer"
    ADMIN    = "admin",    "Admin"


class CustomerStatus(models.TextChoices):
    ACTIVE = "active",  "Active"
    LOCKED = "locked",  "Locked"


class User(models.Model):
    """
    Application user.  The password field stores ONLY an Argon2 hash,
    never a plaintext value.  Use api.auth.set_password / check_password.
    """

    id         = models.CharField(primary_key=True, max_length=36, default=_uuid_str, editable=False)
    email      = models.EmailField(unique=True, db_index=True)
    full_name  = models.CharField(max_length=255)
    # Stores: argon2$argon2id$v=19$m=102400,t=2,p=8$<salt>$<hash>
    password   = models.CharField(max_length=255, help_text="Argon2 hash — never plaintext")
    role       = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.CUSTOMER)
    status     = models.CharField(max_length=20, choices=CustomerStatus.choices, default=CustomerStatus.ACTIVE)
    phone      = models.CharField(max_length=50, blank=True, default="")
    address    = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "vault24_users"

    def __str__(self):
        return f"{self.email} ({self.role})"


# ---------------------------------------------------------------------------
# Account
# ---------------------------------------------------------------------------

class Account(models.Model):
    """One bank account per customer.  Amounts are in ngwee (integer)."""

    id             = models.CharField(primary_key=True, max_length=36, default=_uuid_str, editable=False)
    user           = models.OneToOneField(User, on_delete=models.CASCADE, related_name="account")
    account_number = models.CharField(max_length=20, unique=True, db_index=True)
    balance_ngwee  = models.BigIntegerField(default=0)
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "vault24_accounts"

    def __str__(self):
        return f"{self.account_number} ({self.balance_ngwee} ngwee)"


# ---------------------------------------------------------------------------
# Transaction
# ---------------------------------------------------------------------------

class TransactionDirection(models.TextChoices):
    IN  = "in",  "Inbound"
    OUT = "out", "Outbound"


class TransactionStatus(models.TextChoices):
    COMPLETED = "completed", "Completed"
    PENDING   = "pending",   "Pending"
    FAILED    = "failed",    "Failed"


class Transaction(models.Model):
    id                  = models.CharField(primary_key=True, max_length=36, default=_uuid_str, editable=False)
    account             = models.ForeignKey(Account, on_delete=models.CASCADE, related_name="transactions")
    reference           = models.CharField(max_length=36, unique=True, db_index=True)
    direction           = models.CharField(max_length=3, choices=TransactionDirection.choices)
    amount_ngwee        = models.BigIntegerField()
    status              = models.CharField(max_length=20, choices=TransactionStatus.choices, default=TransactionStatus.COMPLETED)
    note                = models.CharField(max_length=255, blank=True, default="")
    counterparty_account = models.CharField(max_length=20, blank=True, default="")
    idempotency_key     = models.CharField(max_length=255, blank=True, default="", db_index=True)
    created_at          = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "vault24_transactions"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.reference} {self.direction} {self.amount_ngwee}"


# ---------------------------------------------------------------------------
# AuditLog — immutable append-only event record
# ---------------------------------------------------------------------------

class AuditLog(models.Model):
    """
    Security event log.  Records are written but never updated or deleted.
    actor   — email of the user who performed the action (or 'system')
    action  — short event code, e.g. 'login_success', 'transfer_completed'
    target  — the affected resource (email, account number, etc.)
    meta    — free-form JSON for extra context (IP, amounts, etc.)
    """

    id         = models.CharField(primary_key=True, max_length=36, default=_uuid_str, editable=False)
    timestamp  = models.DateTimeField(auto_now_add=True, db_index=True)
    actor      = models.CharField(max_length=255, default="system")
    action     = models.CharField(max_length=80, db_index=True)
    target     = models.CharField(max_length=255, blank=True, default="")
    meta       = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table  = "vault24_audit_logs"
        ordering  = ["-timestamp"]
        # Prevent any update/delete at the DB permission level via app logic;
        # the model itself is append-only by convention.

    def __str__(self):
        return f"[{self.timestamp}] {self.actor} → {self.action} ({self.target})"
