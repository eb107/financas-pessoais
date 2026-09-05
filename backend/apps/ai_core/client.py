import anthropic
from django.conf import settings

from .prompts.categorize import build_categorize_prompt

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _client


def categorize_transaction(description: str, category_names: list[str]) -> str | None:
    """Pede pro Claude escolher a categoria mais provável para a transação.

    Usa o modelo "rápido" (Haiku, configurado via ANTHROPIC_MODEL_FAST) —
    tarefa de classificação simples, sem necessidade de raciocínio extra.
    Retorna o nome da categoria escolhida, ou None se o modelo não achou
    nenhuma boa correspondência (tratado como "sem sugestão", não como erro).
    """
    if not category_names:
        return None

    client = _get_client()
    prompt = build_categorize_prompt(description, category_names)

    response = client.messages.create(
        model=settings.ANTHROPIC_MODEL_FAST,
        max_tokens=20,
        messages=[{"role": "user", "content": prompt}],
    )

    text = "".join(
        block.text for block in response.content if block.type == "text"
    ).strip()

    for name in category_names:
        if name.lower() == text.lower():
            return name
    return None
