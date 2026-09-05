def build_insights_prompt(raw_patterns: list[str]) -> str:
    numbered = "\n".join(f"{i + 1}. {p}" for i, p in enumerate(raw_patterns))
    return (
        "Você escreve alertas financeiros curtos e diretos para um app de "
        "controle de gastos pessoal. Abaixo estão padrões já detectados "
        "(os números já são reais e verificados — não invente nada, só "
        "narre de forma natural e um pouco mais pessoal/conversacional).\n\n"
        f"Padrões detectados:\n{numbered}\n\n"
        f"Responda com exatamente {len(raw_patterns)} linhas, uma frase por "
        "padrão, na MESMA ordem da lista acima, em português, cada uma com "
        "no máximo 25 palavras. Não numere as linhas, não adicione texto "
        "antes ou depois."
    )
