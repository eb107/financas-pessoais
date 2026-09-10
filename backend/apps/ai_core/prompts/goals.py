def build_goal_suggestion_prompt(
    goal_name: str,
    target_amount: float,
    target_date: str,
    current_amount: float,
    monthly_required: float,
    months_remaining: int,
    financial_context: str,
) -> str:
    """Prompt pra sugerir como o usuário pode atingir uma meta de poupança,
    combinando os números da meta com o resumo financeiro agregado dele
    (o mesmo usado no chat) — a IA vê tendência de gastos real, não só os
    números da meta isolados."""
    return (
        "Você é um assistente financeiro. Um usuário tem a seguinte meta de "
        f'poupança: "{goal_name}", valor alvo R$ {target_amount:.2f}, prazo '
        f"{target_date}. Ele já tem R$ {current_amount:.2f} guardados "
        f"(faltam {months_remaining} meses). Pra bater a meta no prazo, "
        f"precisaria guardar cerca de R$ {monthly_required:.2f} por mês.\n\n"
        f"Contexto financeiro do usuário:\n{financial_context}\n\n"
        "Em até 4 frases curtas, dê sugestões concretas e realistas de como "
        "essa pessoa pode chegar nesse valor mensal — de onde cortar gasto, "
        "ou avise se o prazo parece pouco realista dado o histórico dela. "
        "Seja direto, sem introdução nem saudação."
    )
