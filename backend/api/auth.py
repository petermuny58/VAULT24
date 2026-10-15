"""
api/auth.py — Password hashing utilities.

All password operations go through Django's built-in helpers so that
the first PASSWORD_HASHER (Argon2PasswordHasher) is always used.
Plaintext passwords are never stored or logged.
"""

from django.contrib.auth.hashers import make_password, check_password as _check


def hash_password(raw_password: str) -> str:
    """
    Return the Argon2id hash of *raw_password*.

    Django's Argon2PasswordHasher produces a string in the form:
        argon2$argon2id$v=19$m=102400,t=2,p=8$<salt>$<hash>

    The returned string is safe to store in User.password.
    The raw password is not retained after this call.
    """
    return make_password(raw_password)


def verify_password(raw_password: str, encoded: str) -> bool:
    """
    Return True if *raw_password* matches the stored Argon2 *encoded* hash.

    Uses Django's constant-time comparison to prevent timing attacks.
    """
    return _check(raw_password, encoded)
