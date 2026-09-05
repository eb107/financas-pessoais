-- Ranking de categorias por gasto total, com percentual sobre o total geral.
--
-- Contexto: usa duas window functions — RANK() para a posição no ranking
-- (empates recebem a mesma posição) e SUM(...) OVER () sem PARTITION/ORDER
-- (janela sobre o resultado inteiro) para calcular o percentual de cada
-- categoria sobre o total geral de despesas, sem precisar de uma segunda
-- query só para o total.
--
-- Usado como referência para backend/apps/analytics/views.py (ByCategoryView),
-- que implementa a mesma lógica via Django ORM (annotate/aggregate) por
-- simplicidade — esta versão em SQL puro documenta o caminho equivalente.

SELECT
    c.name AS category_name,
    SUM(t.amount) AS total,
    RANK() OVER (ORDER BY SUM(t.amount) DESC) AS rank,
    ROUND(
        100.0 * SUM(t.amount) / SUM(SUM(t.amount)) OVER (), 1
    ) AS pct_of_total
FROM transactions_transaction t
JOIN wallets_wallet w ON w.id = t.wallet_id
LEFT JOIN categories_category c ON c.id = t.category_id
WHERE w.user_id = %(user_id)s
    AND t.type = 'expense'
    AND t.date >= %(date_from)s
GROUP BY c.name
ORDER BY total DESC;
