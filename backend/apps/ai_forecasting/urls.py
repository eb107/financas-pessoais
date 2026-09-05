from django.urls import path

from .views import ForecastListView, TriggerForecastView

urlpatterns = [
    path("ai/forecast/", ForecastListView.as_view(), name="ai-forecast-list"),
    path(
        "ai/forecast/generate/",
        TriggerForecastView.as_view(),
        name="ai-forecast-generate",
    ),
]
