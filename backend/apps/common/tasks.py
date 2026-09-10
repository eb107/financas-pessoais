from celery import shared_task
from django.core.management import call_command


@shared_task
def purge_old_data_task() -> None:
    """Casca fina em volta do management command `purge_old_data`, chamada
    periodicamente pelo Celery beat (ver CELERY_BEAT_SCHEDULE)."""
    call_command("purge_old_data")
