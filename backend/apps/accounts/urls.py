from django.urls import path

from .views import (
    AIConsentView,
    LoginView,
    LogoutView,
    MeExportView,
    MeView,
    RefreshView,
    RegisterView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("token/", LoginView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", RefreshView.as_view(), name="token_refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/export/", MeExportView.as_view(), name="me-export"),
    path("ai-consent/", AIConsentView.as_view(), name="ai-consent"),
    path("me/", MeView.as_view(), name="me"),
]
