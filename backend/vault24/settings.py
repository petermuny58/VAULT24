"""
vault24/settings.py — Django project settings for Vault24 Bank backend.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env sitting next to manage.py
load_dotenv(BASE_DIR / ".env")

# ---------------------------------------------------------------------------
# Security
# ---------------------------------------------------------------------------
SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "dev-only-insecure-key-replace-in-production",
)

DEBUG = os.environ.get("DJANGO_DEBUG", "true").lower() == "true"

ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "127.0.0.1,localhost").split(",")

# ---------------------------------------------------------------------------
# Applications
# ---------------------------------------------------------------------------
INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "api",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "vault24.urls"

WSGI_APPLICATION = "vault24.wsgi.application"

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# ---------------------------------------------------------------------------
# Password hashing — Argon2 is first; Django falls back down the list for
# legacy hashes (none expected here since we never store plain passwords).
# ---------------------------------------------------------------------------
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
]

# ---------------------------------------------------------------------------
# Sessions — server-side DB sessions; ID lives in an httpOnly cookie.
# ---------------------------------------------------------------------------
SESSION_ENGINE = "django.contrib.sessions.backends.db"

# Register the session app explicitly (no auth/admin apps needed).
INSTALLED_APPS += ["django.contrib.sessions"]
MIDDLEWARE += [
    "django.contrib.sessions.middleware.SessionMiddleware",
    # Resolves session user_id -> User ORM object -> request.vault_user
    "api.middleware.VaultSessionMiddleware",
]

SESSION_COOKIE_NAME = "vault24_sid"
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = not DEBUG          # True in production (HTTPS)
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_AGE = 60 * 60 * 8          # 8 hours
SESSION_SAVE_EVERY_REQUEST = False
SESSION_EXPIRE_AT_BROWSER_CLOSE = False

# ---------------------------------------------------------------------------
# CORS — allow the Vite dev server to send credentials
# ---------------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = os.environ.get(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
).split(",")
CORS_ALLOW_CREDENTIALS = True

# ---------------------------------------------------------------------------
# REST Framework
# ---------------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_AUTHENTICATION_CLASSES": [],  # Custom session auth via middleware
    "DEFAULT_PERMISSION_CLASSES": [],
    "EXCEPTION_HANDLER": "api.exceptions.vault24_exception_handler",
}

# ---------------------------------------------------------------------------
# Static files (not really used; kept for Django compat)
# ---------------------------------------------------------------------------
STATIC_URL = "/static/"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
