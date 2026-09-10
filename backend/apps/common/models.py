from django.conf import settings
from django.db import models


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class AuditLog(models.Model):
    """Trilha de auditoria de operações sensíveis sobre dado pessoal
    (exportação, exclusão de conta) — LGPD Art. 6, X (responsabilização):
    precisa dar pra provar o que aconteceu com o dado de alguém, se
    questionado.

    `user` usa SET_NULL (não CASCADE) de propósito: um log sobre a
    exclusão de uma conta não pode desaparecer justamente quando a conta é
    excluída — isso anularia o próprio propósito do log. `username` guarda
    um "retrato" do nome no momento do evento, pra continuar legível mesmo
    depois do `user` virar None.
    """

    class Action(models.TextChoices):
        DATA_EXPORT = "data_export", "Exportação de dados"
        ACCOUNT_DELETION = "account_deletion", "Exclusão de conta"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    username = models.CharField(max_length=150, blank=True)
    action = models.CharField(max_length=50, choices=Action.choices)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        when = self.created_at.strftime("%Y-%m-%d %H:%M")
        return f"{self.get_action_display()} — {self.username} ({when})"
