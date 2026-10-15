"""
api/middleware.py — Request-level session resolution.

Attaches the authenticated User (or None) to every request as
``request.vault_user`` so that views and decorators can read it
without touching the database again.

Flow
────
1. SessionMiddleware (Django built-in) already parsed the cookie and
   loaded ``request.session`` before this runs.
2. We look up ``request.session["user_id"]``; if present, fetch the User.
3. We store the result in ``request.vault_user``.

Views should use the ``@require_auth`` / ``@require_role`` decorators
in api.decorators rather than inspecting request.vault_user directly.
"""

from django.utils.deprecation import MiddlewareMixin
from api.models import User


class VaultSessionMiddleware(MiddlewareMixin):
    """
    Resolves the session's user_id into a User object and attaches it to
    the request.  Always sets request.vault_user (None if not logged in).
    """

    def process_request(self, request):
        user_id = request.session.get("user_id")
        if user_id:
            try:
                request.vault_user = User.objects.get(pk=user_id, status="active")
            except User.DoesNotExist:
                # Session references a deleted / locked account — clear it.
                request.session.flush()
                request.vault_user = None
        else:
            request.vault_user = None
