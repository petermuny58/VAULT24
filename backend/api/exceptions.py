"""
api/exceptions.py — Custom exception handler for Vault24.

Maps Django/DRF exceptions to consistent JSON error envelopes:
  { "error": { "code": "...", "message": "..." } }
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def vault24_exception_handler(exc, context):
    """
    DRF custom exception handler.

    Wraps every error response in a standard envelope so the frontend
    always receives the same shape regardless of which layer raised.
    """
    response = exception_handler(exc, context)

    if response is not None:
        # DRF already handled it — re-wrap
        data = response.data
        if isinstance(data, dict) and "error" in data:
            # Already wrapped (e.g. from our own views)
            return response
        response.data = {
            "error": {
                "code": _http_code(response.status_code),
                "message": _flatten(data),
            }
        }
        return response

    # Unhandled Python exception — return 500
    return Response(
        {"error": {"code": "internal_error", "message": "An unexpected error occurred."}},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_CODE_MAP = {
    400: "bad_request",
    401: "unauthenticated",
    403: "forbidden",
    404: "not_found",
    405: "method_not_allowed",
    409: "conflict",
    422: "unprocessable_entity",
    429: "rate_limited",
    500: "internal_error",
}


def _http_code(status_code: int) -> str:
    return _CODE_MAP.get(status_code, f"http_{status_code}")


def _flatten(data) -> str:
    """Turn DRF's nested error structures into a single readable string."""
    if isinstance(data, str):
        return data
    if isinstance(data, list):
        return " ".join(str(item) for item in data)
    if isinstance(data, dict):
        parts = []
        for key, value in data.items():
            if key in ("detail",):
                parts.append(str(value))
            else:
                parts.append(f"{key}: {_flatten(value)}")
        return "; ".join(parts)
    return str(data)
