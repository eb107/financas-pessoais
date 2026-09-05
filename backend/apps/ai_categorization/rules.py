"""Categorização por palavra-chave — roda antes de chamar a IA.

A ideia: a maioria das transações do dia a dia bate com um punhado de
palavras-chave óbvias (nome do estabelecimento, tipo de serviço). Resolver
essas por regra simples evita a maior parte das chamadas ao Claude, reduzindo
custo e latência — a IA só entra quando nenhuma regra reconhece a descrição.
"""

KEYWORD_TO_CATEGORY = {
    "UBER": "Transporte",
    "99": "Transporte",
    "TAXI": "Transporte",
    "POSTO": "Transporte",
    "COMBUSTIVEL": "Transporte",
    "ESTACIONAMENTO": "Transporte",
    "IFOOD": "Alimentação",
    "RAPPI": "Alimentação",
    "SUPERMERCADO": "Alimentação",
    "MERCADO": "Alimentação",
    "PADARIA": "Alimentação",
    "RESTAURANTE": "Alimentação",
    "ALUGUEL": "Moradia",
    "CONDOMINIO": "Moradia",
    "LUZ": "Moradia",
    "ENERGIA": "Moradia",
    "AGUA": "Moradia",
    "INTERNET": "Moradia",
    "NETFLIX": "Lazer",
    "SPOTIFY": "Lazer",
    "CINEMA": "Lazer",
    "STREAMING": "Lazer",
    "FARMACIA": "Saúde",
    "DROGARIA": "Saúde",
    "ACADEMIA": "Saúde",
    "CONSULTA": "Saúde",
    "SALARIO": "Salário",
    "FREELANCE": "Freelance",
}


def categorize_by_rules(description: str) -> str | None:
    normalized = description.upper()
    for keyword, category in KEYWORD_TO_CATEGORY.items():
        if keyword in normalized:
            return category
    return None
