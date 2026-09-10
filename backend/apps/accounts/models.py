from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    # Registro de consentimento (LGPD Art. 18, IX) para o processamento de
    # dados por terceiro (API da Anthropic) nas funcionalidades de IA que
    # de fato chamam um LLM externo (categorização, chat, insights — a
    # previsão de gastos não usa IA nenhuma, é regressão linear local).
    ai_consent_given_at = models.DateTimeField(null=True, blank=True)

    def record_ai_consent(self) -> None:
        """Marca o consentimento na primeira vez que o usuário usa alguma
        funcionalidade que envia dado pessoal pra Anthropic. Idempotente —
        chamadas seguintes não sobrescrevem a data original."""
        if self.ai_consent_given_at is None:
            self.ai_consent_given_at = timezone.now()
            self.save(update_fields=["ai_consent_given_at"])
