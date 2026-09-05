-- Fluxo de caixa mensal com saldo acumulado (window function).
--
-- Contexto: cada linha é um mês; income/expense somam as transações daquele
-- mês, e cumulative_balance é o saldo acumulado até aquele mês (receitas -
-- despesas de todos os meses anteriores + o atual).
--
-- Ponto de interesse analítico: a window function SUM(...) OVER (ORDER BY ...)
-- roda *depois* do GROUP BY na ordem lógica de execução do SQL, por isso é
-- possível empilhar uma agregação de janela sobre um resultado já agregado
-- por mês — não precisa de subquery/CTE extra pra isso.
--
-- Usado por: backend/apps/analytics/views.py (CashflowView).

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
