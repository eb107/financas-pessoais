from datetime import timedelta

from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.ai_insights.models import Insight

DEFAULT_INSIGHT_RETENTION_DAYS = 365


class Command(BaseCommand):
    """Aplica a política de retenção de dados (LGPD Art. 15/16 — dado só
    deve ser mantido pelo tempo necessário à finalidade que o justificou).

    Hoje cobre dois casos concretos:
    - Insights: são alertas pontuais ("orçamento estourou em março"), sem
      valor de longo prazo depois de um tempo — apagados após
      --insights-days (padrão 365) dias.
    - Tokens JWT expirados/revogados: delega pro próprio comando do
      simplejwt (flushexpiredtokens), que já existe pronto no pacote.
    """

    help = "Remove insights antigos e tokens JWT expirados, por retenção."

    def add_arguments(self, parser):
        parser.add_argument(
            "--insights-days",
            type=int,
            default=DEFAULT_INSIGHT_RETENTION_DAYS,
            help="Insights mais antigos que isso (em dias) são apagados.",
        )

    def handle(self, *args, **options):
        cutoff = timezone.now() - timedelta(days=options["insights_days"])
        deleted, _ = Insight.objects.filter(generated_at__lt=cutoff).delete()
        self.stdout.write(
            f"Insights removidos (mais antigos que {options['insights_days']} "
            f"dias): {deleted}"
        )

        call_command("flushexpiredtokens")
        self.stdout.write("Tokens JWT expirados/revogados removidos.")
