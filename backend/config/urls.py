from django.contrib import admin
from django.urls import include, path

from apps.common.views import health_check

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/", include("apps.wallets.urls")),
    path("api/", include("apps.categories.urls")),
    path("api/", include("apps.transactions.urls")),
]
