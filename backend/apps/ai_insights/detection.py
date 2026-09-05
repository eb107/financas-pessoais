"""Detecção de padrões financeiros — determinística, sem chamar IA.

Cada regra retorna uma lista de "padrões brutos" (dict com os números que
embasam o alerta). A narração em texto humano desses padrões é feita depois,
numa chamada só ao Claude Haiku (ver tasks.py) — a detecção em si não gasta
nenhum token.
"""

from datetime import date, timedelta
from decimal import Decimal

from django.db.models import Sum

from apps.budgets.models import Budget
from apps.transactions.models import Transaction

CATEGORY_SPIKE_THRESHOLD_PCT = 30
CATEGORY_SPIKE_MIN_PREVIOUS = Decimal(50)


def _previous_month(d: date) -> date:
    first_of_month = d.replace(day=1)
    return (first_of_month - timedelta(days=1)).replace(day=1)


def detect_budget_exceeded(user, today: date) -> list[dict]:
    patterns = []
    budgets = Budget.objects.filter(
        user=user, month__year=today.year, month__month=today.month
    ).select_related("category")

    for budget in budgets:
        spent = Transaction.objects.filter(
            wallet__user=user,
            type="expense",
            category=budget.category,
            date__year=today.year,
            date__month=today.month,
        ).aggregate(total=Sum("amount"))["total"] or Decimal(0)

        if spent > budget.amount_limit:
            pct = round(float(spent) / float(budget.amount_limit) * 100, 1)
            patterns.append(
                {
                    "type": "budget_exceeded",
                    "severity": "critical" if pct >= 120 else "warning",
                    "category": budget.category.name,
                    "limit": float(budget.amount_limit),
                    "spent": float(spent),
                    "percentage": pct,
                    "raw": (
                        f"Orçamento de {budget.category.name} estourado: "
                        f"gasto R$ {spent} de um limite de R$ "
                        f"{budget.amount_limit} ({pct}% do limite)."
                    ),
                }
            )
    return patterns


def detect_category_spikes(user, today: date) -> list[dict]:
    patterns = []
    prev_month = _previous_month(today)

    current_totals = (
        Transaction.objects.filter(
            wallet__user=user,
            type="expense",
            date__year=today.year,
            date__month=today.month,
        )
        .exclude(category__isnull=True)
        .values("category__id", "category__name")
        .annotate(total=Sum("amount"))
    )

    for row in current_totals:
        prev_total = Transaction.objects.filter(
            wallet__user=user,
            type="expense",
            category_id=row["category__id"],
            date__year=prev_month.year,
            date__month=prev_month.month,
        ).aggregate(total=Sum("amount"))["total"] or Decimal(0)

        if prev_total < CATEGORY_SPIKE_MIN_PREVIOUS:
            continue

        current_total = row["total"]
        change_pct = round(
            (float(current_total) - float(prev_total)) / float(prev_total) * 100, 1
        )

        if change_pct >= CATEGORY_SPIKE_THRESHOLD_PCT:
            patterns.append(
                {
                    "type": "category_spike",
                    "severity": "warning",
                    "category": row["category__name"],
                    "previous": float(prev_total),
                    "current": float(current_total),
                    "change_pct": change_pct,
                    "raw": (
                        f"Gastos com {row['category__name']} subiram "
                        f"{change_pct}% em relação ao mês anterior "
                        f"(de R$ {prev_total} para R$ {current_total})."
                    ),
                }
            )
    return patterns


def detect_all(user) -> list[dict]:
    today = date.today()
    return detect_budget_exceeded(user, today) + detect_category_spikes(user, today)
