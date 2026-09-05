from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import InsightViewSet, TriggerInsightsView

router = DefaultRouter()
router.register("ai/insights", InsightViewSet, basename="insight")

urlpatterns = [
    # Precisa vir antes do router: a rota de detalhe do router
    # (ai/insights/<pk>/) casaria com "generate" como se fosse um pk.
    path(
        "ai/insights/generate/",
        TriggerInsightsView.as_view(),
        name="ai-insights-generate",
    ),
] + router.urls
