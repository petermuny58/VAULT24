"""
api/decorators.py — Authorization decorators for Vault24 views.

Usage
─────
    from api.decorators import require_auth, require_role
    from api.models import UserRole

    @require_auth
    def my_view(request):
        user = request.vault_user   # guaranteed non-None here
        ...

    @require_role(UserRole.ADMIN)
    def admin_only(request):
        ...

All failures return a consistent JSON error envelope and write an
entry to the AuditLog so every rejected request is traceable.
"""

import functools
from django.http import JsonResponse
from api.models import AuditLog


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _get_ip(request) -> str:
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    if xff:
        return xff.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "unknown")


def _error(code: str, message: str, status: int) -> JsonResponse:
    return JsonResponse({"error": {"code": code, "message": message}}, status=status)


def _audit(actor: str, action: str, target: str = "", meta: dict = None):
    AuditLog.objects.create(
        actor=actor,
        action=action,
        target=target,
        meta=meta or {},
    )


# ---------------------------------------------------------------------------
# Public decorators
# ---------------------------------------------------------------------------

def require_auth(view_func):
    """
    Reject (401) any request that has no valid session user.
    Sets request.vault_user for the downstream view.
    """
    @functools.wraps(view_func)
    def _wrapper(request, *args, **kwargs):
        if not getattr(request, "vault_user", None):
            _audit(
                actor="anonymous",
                action="auth_required_rejected",
                target=request.path,
                meta={"ip": _get_ip(request), "method": request.method},
            )
            return _error("unauthenticated", "Authentication required.", 401)
        return view_func(request, *args, **kwargs)
    return _wrapper


def require_role(*roles):
    """
    Decorator factory.  Requires an authenticated user whose role is in
    *roles*.  Implicitly applies ``require_auth`` first.

    Example:
        @require_role(UserRole.ADMIN)
        def admin_view(request): ...
    """
    def decorator(view_func):
        @functools.wraps(view_func)
        @require_auth  # ensures vault_user is set before role check
        def _wrapper(request, *args, **kwargs):
            user = request.vault_user
            if user.role not in roles:
                _audit(
                    actor=user.email,
                    action="authorization_denied",
                    target=request.path,
                    meta={
                        "ip": _get_ip(request),
                        "method": request.method,
                        "user_role": user.role,
                        "required_roles": list(roles),
                    },
                )
                return _error(
                    "forbidden",
                    f"Role '{user.role}' is not permitted to access this resource.",
                    403,
                )
            return view_func(request, *args, **kwargs)
        return _wrapper
    return decorator
