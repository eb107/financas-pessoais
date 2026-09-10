from datetime import date, timedelta

from django.db import connection
from django.db.models import Sum
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.transactions.models import Transaction


def _date_from(request, default_days=180):
    raw = request.query_params.get("date_from")
    if raw:
        return raw
    return (date.today() - timedelta(days=default_days)).isoformat()


class SummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Transaction.objects.filter(wallet__user=request.user)

        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)

        income = qs.filter(type="income").aggregate(total=Sum("amount"))["total"] or 0
        expense = qs.filter(type="expense").aggregate(total=Sum("amount"))["total"] or 0

        return Response(
            {
                "income": income,
                "expense": expense,
                "balance": income - expense,
                "transaction_count": qs.count(),
            }
        )


class ByCategoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Transaction.objects.filter(
            wallet__user=request.user, type="expense"
        ).filter(date__gte=_date_from(request))

        rows = (
            qs.values("category__id", "category__name")
            .annotate(total=Sum("amount"))
            .order_by("-total")
        )

        return Response(
            [
                {
                    "category_id": row["category__id"],
                    "category_name": row["category__name"] or "Sem categoria",
                    "total": row["total"],
                }
                for row in rows
            ]
        )


class CashflowView(APIView):
    """Fluxo de caixa mensal com saldo acumulado.

    Usa a mesma query documentada em analytics/sql/monthly_cashflow.sql —
    uma window function (SUM OVER ORDER BY) empilhada sobre um GROUP BY
    mensal, calculando o saldo acumulado sem precisar de uma segunda
    passada nos dados em Python.
    """

    permission_classes = [IsAuthenticated]

    SQL = """
        SELECT
            date_trunc('month', t.date) AS month,
            SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) AS income,
            SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) AS expense,
            SUM(
                SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END)
            ) OVER (ORDER BY date_trunc('month', t.date)) AS cumulative_balance
        FROM transactions_transaction t
        JOIN wallets_wallet w ON w.id = t.wallet_id
        WHERE w.user_id = %(user_id)s
            AND t.date >= %(date_from)s
        GROUP BY date_trunc('month', t.date)
        ORDER BY month;
    """

    def get(self, request):
        months = int(request.query_params.get("months", 6))
        date_from = date.today().replace(day=1) - timedelta(days=months * 31)

        with connection.cursor() as cursor:
            cursor.execute(
                self.SQL, {"user_id": request.user.id, "date_from": date_from}
            )
            columns = [col[0] for col in cursor.description]
            rows = [dict(zip(columns, row)) for row in cursor.fetchall()]

        return Response(rows)
