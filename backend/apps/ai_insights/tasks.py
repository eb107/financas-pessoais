import anthropic
from celery import shared_task
from django.conf import settings

from apps.ai_core.client import generate_insight_texts

from .detection import detect_all
from .models import Insight

TITLES = {
    "budget_exceeded": "Orçamento estourado: {category}",
    "category_spike": "Alta de gastos: {category}",
}


@shared_task
def generate_insights_task(user_id: int) -> int:
    from apps.accounts.models import User

    user = User.objects.get(id=user_id)
    patterns = detect_all(user)
    if not patterns:
        return 0

    texts = [p["raw"] for p in patterns]
    if settings.ANTHROPIC_API_KEY:
        try:
            texts = generate_insight_texts([p["raw"] for p in patterns])
        except anthropic.APIError:
            pass  # mantém o texto cru da regra em vez de perder o insight

    created = 0
    for pattern, body in zip(patterns, texts):
        title = TITLES.get(pattern["type"], "Insight financeiro").format(
            category=pattern.get("category", "")
        )
        Insight.objects.create(
            user=user,
            type=pattern["type"],
            title=title,
            body=body,
            severity=pattern["severity"],
            data_snapshot=pattern,
        )
        created += 1
    return created


@shared_task
def generate_insights_for_all_users() -> int:
    """Task periódica (Celery beat, 1x/dia) — roda a detecção pra cada
    usuário. Dispara uma task por usuário em vez de processar tudo numa só,
    pra um usuário com erro não travar os outros."""
    from apps.accounts.models import User

    user_ids = list(User.objects.values_list("id", flat=True))
    for user_id in user_ids:
        generate_insights_task.delay(user_id)
    return len(user_ids)
