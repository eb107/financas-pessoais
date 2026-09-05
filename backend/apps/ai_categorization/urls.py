from django.urls import path

from .views import CategorizeTransactionView

urlpatterns = [
    path(
        "ai/transactions/<int:transaction_id>/categorize/",
        CategorizeTransactionView.as_view(),
        name="ai-categorize-transaction",
    ),
]
