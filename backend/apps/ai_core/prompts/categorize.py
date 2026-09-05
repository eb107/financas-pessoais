def build_categorize_prompt(description: str, category_names: list[str]) -> str:
    """Prompt para escolher a categoria de uma transação a partir da descrição.

    Mantido simples de propósito: pede uma resposta de uma linha só, restrita
    ao conjunto de categorias existentes do usuário (ou "Nenhuma"), o que
    dispensa parsing de JSON para uma tarefa de classificação de baixo custo.
    """
    options = "\n".join(f"- {name}" for name in category_names)
    return (
        "Você categoriza transações financeiras. Dada a descrição de uma "
        "transação, escolha a categoria mais provável dentre as opções "
        "abaixo, ou responda \"Nenhuma\" se nenhuma se encaixar bem.\n\n"
        f"Categorias disponíveis:\n{options}\n\n"
        f"Descrição da transação: \"{description}\"\n\n"
        "Responda APENAS com o nome exato de uma categoria da lista acima, "
        "ou \"Nenhuma\". Sem explicação, sem pontuação extra."
    )
