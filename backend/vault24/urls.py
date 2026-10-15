"""
vault24/urls.py — Root URL configuration.
"""

from django.urls import path, include

urlpatterns = [
    path("auth/", include("api.urls.auth")),
    path("accounts/", include("api.urls.accounts")),
    path("transfers/", include("api.urls.transfers")),
    path("transactions/", include("api.urls.transactions")),
    path("profile/", include("api.urls.profile")),
    path("admin/", include("api.urls.admin")),
]
