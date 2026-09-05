"""Monta um resumo textual e compacto das finanças do usuário.

Propositalmente NÃO manda o histórico bruto de transações pro Claude — só
um resumo agregado (totais por mês, por categoria, orçamentos). Isso mantém
o prompt pequeno e barato, e evita vazar transação-por-transação num
contexto que não precisa desse nível de detalhe pra responder perguntas
como "quanto gastei com X" ou "como está minha tendência".
"""

from datetime import date, timedelta
from decimal import Decimal

from django.db.models import Sum

from apps.budgets.models import Budget
from apps.transactions.models import Transaction
from apps.wallets.models import Wallet

MONTH_NAMES = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
]


def _month_label(d: date) -> str:
    return f"{MONTH_NAMES[d.month - 1]}/{d.year}"


def build_financial_context(user) -> str:
    lines = ["Resumo financeiro do usuário (use isso para responder):"]

    wallets = Wallet.objects.filter(user=user)
    if wallets:
        wallet_names = ", ".join(f"{w.name} ({w.get_type_display()})" for w in wallets)
        lines.append(f"\nCarteiras: {wallet_names}")

    today = date.today()
    six_months_ago = (today.replace(day=1) - timedelta(days=150)).replace(day=1)
    expense_qs = Transaction.objects.filter(
        wallet__user=user, type="expense", date__gte=six_months_ago
    )
    income_qs = Transaction.objects.filter(
        wallet__user=user, type="income", date__gte=six_months_ago
    )

    lines.append("\nÚltimos meses (receita / despesa):")
    cursor = six_months_ago
    while cursor <= today:
        month_income = income_qs.filter(
            date__year=cursor.year, date__month=cursor.month
        ).aggregate(total=Sum("amount"))["total"] or Decimal(0)
        month_expense = expense_qs.filter(
            date__year=cursor.year, date__month=cursor.month
        ).aggregate(total=Sum("amount"))["total"] or Decimal(0)
        lines.append(
            f"- {_month_label(cursor)}: receita R$ {month_income}, "
            f"despesa R$ {month_expense}"
        )
        cursor = (cursor.replace(day=1) + timedelta(days=31)).replace(day=1)

    current_month_expense_by_category = (
        expense_qs.filter(date__year=today.year, date__month=today.month)
        .values("category__name")
        .annotate(total=Sum("amount"))
        .order_by("-total")
    )
    if current_month_expense_by_category:
        lines.append(f"\nGastos por categoria em {_month_label(today)}:")
        for row in current_month_expense_by_category:
            name = row["category__name"] or "Sem categoria"
            lines.append(f"- {name}: R$ {row['total']}")

    budgets = Budget.objects.filter(
        user=user, month__year=today.year, month__month=today.month
    ).select_related("category")
    if budgets:
        lines.append(f"\nOrçamentos ativos em {_month_label(today)}:")
        for budget in budgets:
            spent = expense_qs.filter(
                category=budget.category,
                date__year=today.year,
                date__month=today.month,
            ).aggregate(total=Sum("amount"))["total"] or Decimal(0)
            pct = (
                round(float(spent) / float(budget.amount_limit) * 100, 1)
                if budget.amount_limit
                else 0
            )
            lines.append(
                f"- {budget.category.name}: limite R$ {budget.amount_limit}, "
                f"gasto R$ {spent} ({pct}%)"
            )

    return "\n".join(lines)
