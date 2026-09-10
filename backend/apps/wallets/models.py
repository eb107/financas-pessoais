from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class Wallet(TimeStampedModel):
    class WalletType(models.TextChoices):
        CHECKING = "checking", "Conta corrente"
        SAVINGS = "savings", "Poupança"
        CREDIT_CARD = "credit_card", "Cartão de crédito"
        CASH = "cash", "Dinheiro"
        BENEFIT = "benefit", "Vale/Benefício"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="wallets"
    )
    name = models.CharField(max_length=100)
    type = models.CharField(
        max_length=20, choices=WalletType.choices, default=WalletType.CHECKING
    )
    currency = models.CharField(max_length=3, default="BRL")
    initial_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name
