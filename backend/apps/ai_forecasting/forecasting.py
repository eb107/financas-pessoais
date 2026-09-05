"""Previsão de gastos por regressão linear sobre o histórico mensal.

Abordagem propositalmente simples (em vez de Prophet/ARIMA): com poucos
meses de histórico (o caso comum de um usuário novo), um modelo sazonal
complexo não tem sinal suficiente pra ser confiável — regressão linear sobre
a série mensal captura a tendência (crescendo/caindo/estável) sem overfit,
e é reproduzível em poucos milissegundos. Documentado como ponto de evolução
futura caso o histórico cresça (12+ meses habilitaria sazonalidade real).
"""

from collections import defaultdict
from datetime import date
from decimal import Decimal

import numpy as np
from sklearn.linear_model import LinearRegression

from apps.transactions.models import Transaction

MODEL_NAME = "linear_regression_v1"
MIN_MONTHS_OF_DATA = 3


def _next_month(period: date) -> date:
    if period.month == 12:
        return period.replace(year=period.year + 1, month=1)
    return period.replace(month=period.month + 1)


def _monthly_totals(queryset) -> dict[date, Decimal]:
    """Agrupa um queryset de Transaction em totais por mês (chave = dia 1)."""
    totals: dict[date, Decimal] = defaultdict(lambda: Decimal(0))
    for tx in queryset.values("date", "amount"):
        month_key = tx["date"].replace(day=1)
        totals[month_key] += tx["amount"]
    return dict(totals)


def _predict_next(monthly_totals: dict[date, Decimal]) -> tuple[date, float] | None:
    """Ajusta regressão linear sobre os meses ordenados e prevê o próximo.

    Retorna (mês_previsto, valor_previsto) ou None se não houver meses
    suficientes pra um ajuste minimamente confiável.
    """
    if len(monthly_totals) < MIN_MONTHS_OF_DATA:
        return None

    months = sorted(monthly_totals.keys())
    X = np.arange(len(months)).reshape(-1, 1)
    y = np.array([float(monthly_totals[m]) for m in months])

    model = LinearRegression()
    model.fit(X, y)

    next_index = np.array([[len(months)]])
    predicted = float(model.predict(next_index)[0])

    return _next_month(months[-1]), max(predicted, 0.0)


def generate_forecasts_for_user(user) -> list[dict]:
    """Gera previsões de gasto do próximo mês, por categoria + total geral.

    Retorna a lista de dicts salvos (ou atualizados) como ForecastResult —
    a task do Celery é só uma casca fina em volta desta função.
    """
    from .models import ForecastResult

    results = []

    expense_qs = Transaction.objects.filter(wallet__user=user, type="expense")

    # Total geral (todas as categorias somadas).
    total_prediction = _predict_next(_monthly_totals(expense_qs))
    if total_prediction:
        period, amount = total_prediction
        obj, _ = ForecastResult.objects.update_or_create(
            user=user,
            category=None,
            period=period,
            defaults={
                "predicted_amount": round(amount, 2),
                "model_used": MODEL_NAME,
            },
        )
        results.append(obj)

    # Por categoria de despesa que o usuário já usou.
    # .order_by() (limpa o ordering default de Transaction) é necessário aqui:
    # sem isso, o Postgres inclui as colunas do ORDER BY implícito (date,
    # created_at) no SELECT DISTINCT, e o distinct() deixa de deduplicar por
    # category_id de verdade — vira "uma linha por transação".
    category_ids = (
        expense_qs.order_by().values_list("category_id", flat=True).distinct()
    )
    for category_id in category_ids:
        if category_id is None:
            continue
        category_qs = expense_qs.filter(category_id=category_id)
        prediction = _predict_next(_monthly_totals(category_qs))
        if not prediction:
            continue
        period, amount = prediction
        obj, _ = ForecastResult.objects.update_or_create(
            user=user,
            category_id=category_id,
            period=period,
            defaults={
                "predicted_amount": round(amount, 2),
                "model_used": MODEL_NAME,
            },
        )
        results.append(obj)

    return results
