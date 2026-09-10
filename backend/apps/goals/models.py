from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class Goal(TimeStampedModel):
    """Meta de aquisição/poupança (ex: "Comprar um carro", "Reserva de
    emergência") — um valor alvo até uma data, com o progresso acompanhado
    automaticamente pelo saldo de uma carteira dedicada (soma de receitas
    menos despesas naquela carteira, mesmo cálculo usado no resumo do
    Dashboard)."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="goals"
    )
    name = models.CharField(max_length=150)
    target_amount = models.DecimalField(max_digits=12, decimal_places=2)
    target_date = models.DateField()
    wallet = models.ForeignKey(
        "wallets.Wallet",
        on_delete=models.CASCADE,
        related_name="goals",
        help_text="Carteira usada pra acompanhar o progresso automaticamente.",
    )

    class Meta:
        ordering = ["target_date"]

    def __str__(self):
        return f"{self.name} — {self.target_date:%Y-%m}"
