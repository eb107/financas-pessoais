from django.conf import settings
from django.db import models

from apps.common.models import TimeStampedModel


class Insight(TimeStampedModel):
    class Severity(models.TextChoices):
        INFO = "info", "Informativo"
        WARNING = "warning", "Atenção"
        CRITICAL = "critical", "Crítico"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="insights"
    )
    type = models.CharField(max_length=50)
    title = models.CharField(max_length=150)
    body = models.TextField()
    severity = models.CharField(max_length=10, choices=Severity.choices)
    data_snapshot = models.JSONField(
        default=dict,
        blank=True,
        help_text="Dados brutos que geraram o insight — auditoria/debug.",
    )
    is_read = models.BooleanField(default=False)
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-generated_at"]

    def __str__(self):
        return self.title
