from django.db import models

from apps.common.models import TimeStampedModel


class Transaction(TimeStampedModel):
    class TransactionType(models.TextChoices):
        INCOME = "income", "Receita"
        EXPENSE = "expense", "Despesa"
        TRANSFER = "transfer", "Transferência"

    wallet = models.ForeignKey(
        "wallets.Wallet", on_delete=models.CASCADE, related_name="transactions"
    )
    category = models.ForeignKey(
        "categories.Category",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="transactions",
    )
    tags = models.ManyToManyField(
        "categories.Tag", blank=True, related_name="transactions"
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    type = models.CharField(max_length=10, choices=TransactionType.choices)
    description = models.CharField(max_length=255, blank=True)
    date = models.DateField()
    is_recurring = models.BooleanField(default=False)
    ai_category_confidence = models.FloatField(
        null=True,
        blank=True,
        help_text="Confiança (0-1) da categorização automática, quando aplicável.",
    )

    class Meta:
        ordering = ["-date", "-created_at"]
        indexes = [
            models.Index(fields=["wallet", "date"]),
            models.Index(fields=["category", "date"]),
        ]

    def __str__(self):
        return f"{self.description or self.type} ({self.amount})"
