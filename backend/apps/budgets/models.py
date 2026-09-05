from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class Budget(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="budgets"
    )
    category = models.ForeignKey(
        "categories.Category", on_delete=models.CASCADE, related_name="budgets"
    )
    month = models.DateField(help_text="Sempre o primeiro dia do mês do orçamento.")
    amount_limit = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "category", "month"],
                name="unique_budget_per_category_month",
            )
        ]
        ordering = ["-month"]

    def __str__(self):
        return f"{self.category.name} — {self.month:%Y-%m}"
