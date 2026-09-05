from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class ForecastResult(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="forecasts"
    )
    category = models.ForeignKey(
        "categories.Category",
        on_delete=models.CASCADE,
        related_name="forecasts",
        null=True,
        blank=True,
        help_text="Nulo para a previsão de total geral (todas as categorias).",
    )
    period = models.DateField(help_text="Primeiro dia do mês previsto.")
    predicted_amount = models.DecimalField(max_digits=12, decimal_places=2)
    model_used = models.CharField(max_length=50)
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "category", "period"],
                name="unique_forecast_per_category_period",
            )
        ]
        ordering = ["-period"]

    def __str__(self):
        label = self.category.name if self.category else "Total"
        return f"{label} — {self.period:%Y-%m}: {self.predicted_amount}"
