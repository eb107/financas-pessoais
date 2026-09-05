from django.urls import path

from .views import ByCategoryView, CashflowView, SummaryView

urlpatterns = [
    path("analytics/summary/", SummaryView.as_view(), name="analytics-summary"),
    path(
        "analytics/by-category/",
        ByCategoryView.as_view(),
        name="analytics-by-category",
    ),
    path("analytics/cashflow/", CashflowView.as_view(), name="analytics-cashflow"),
]
