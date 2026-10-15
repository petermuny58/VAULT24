"""
api/urls/auth.py — URL routes for authentication endpoints.

Prefix: /auth/   (mounted in vault24/urls.py)

  POST /auth/register
  POST /auth/login
  POST /auth/logout
  GET  /auth/me
"""

from django.urls import path
from api.views.auth import register, login, logout, me

urlpatterns = [
    path("register", register, name="auth-register"),
    path("login",    login,    name="auth-login"),
    path("logout",   logout,   name="auth-logout"),
    path("me",       me,       name="auth-me"),
]
