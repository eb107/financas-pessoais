import random
from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction as db_transaction

from apps.categories.models import Category
from apps.transactions.models import Transaction
from apps.wallets.models import Wallet

User = get_user_model()

DEFAULT_CATEGORIES = [
    ("Salário", "income"),
    ("Freelance", "income"),
    ("Alimentação", "expense"),
    ("Transporte", "expense"),
    ("Moradia", "expense"),
    ("Lazer", "expense"),
    ("Saúde", "expense"),
    ("Compras", "expense"),
]

EXPENSE_DESCRIPTIONS = {
    "Alimentação": ["Supermercado", "Restaurante", "iFood", "Padaria"],
    "Transporte": ["Uber", "Combustível", "Estacionamento", "Ônibus"],
    "Moradia": ["Aluguel", "Conta de luz", "Conta de água", "Internet"],
    "Lazer": ["Cinema", "Streaming", "Show", "Bar com amigos"],
    "Saúde": ["Farmácia", "Consulta médica", "Academia"],
    "Compras": ["Roupas", "Eletrônicos", "Livraria"],
}


class Command(BaseCommand):
    help = (
        "Gera dados sintéticos (carteiras, categorias e transações) para um "
        "usuário existente, cobrindo os últimos N meses — útil para testar "
        "dashboards e gráficos com dados realistas."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--username", required=True, help="Username do usuário a popular."
        )
        parser.add_argument(
            "--months", type=int, default=6, help="Quantos meses gerar (padrão: 6)."
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Remove transações existentes do usuário antes de gerar novas.",
        )

    def handle(self, *args, **options):
        username = options["username"]
        months = options["months"]

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist as exc:
            raise CommandError(f"Usuário '{username}' não encontrado.") from exc

        with db_transaction.atomic():
            if options["clear"]:
                deleted, _ = Transaction.objects.filter(wallet__user=user).delete()
                self.stdout.write(f"Removidas {deleted} transações existentes.")

            wallet = self._ensure_wallet(user)
            categories = self._ensure_categories(user)
            count = self._generate_transactions(wallet, categories, months)

        self.stdout.write(
            self.style.SUCCESS(
                f"Gerado {count} transações para '{username}' nos últimos "
                f"{months} meses (carteira: {wallet.name})."
            )
        )

    def _ensure_wallet(self, user):
        wallet, created = Wallet.objects.get_or_create(
            user=user,
            name="Conta Principal",
            defaults={"type": "checking", "currency": "BRL", "initial_balance": 0},
        )
        if created:
            self.stdout.write("Criada carteira 'Conta Principal'.")
        return wallet

    def _ensure_categories(self, user):
        categories = {}
        for name, kind in DEFAULT_CATEGORIES:
            category, _ = Category.objects.get_or_create(
                user=user, name=name, defaults={"kind": kind}
            )
            categories[name] = category
        return categories

    def _generate_transactions(self, wallet, categories, months):
        expense_categories = [
            c
            for name, kind in DEFAULT_CATEGORIES
            if kind == "expense"
            for c in [categories[name]]
        ]

        today = date.today()
        months_back = timedelta(days=(months - 1) * 31)
        start_month = (today.replace(day=1) - months_back).replace(day=1)

        transactions = []
        cursor = start_month
        while cursor <= today:
            # Salário todo mês, no dia 5.
            salary_day = min(5, 28)
            transactions.append(
                Transaction(
                    wallet=wallet,
                    category=categories["Salário"],
                    amount=Decimal(random.randint(4200, 5800)),
                    type="income",
                    description="Salário mensal",
                    date=cursor.replace(day=salary_day),
                )
            )

            # Freelance ocasional (60% de chance no mês).
            if random.random() < 0.6:
                transactions.append(
                    Transaction(
                        wallet=wallet,
                        category=categories["Freelance"],
                        amount=Decimal(random.randint(300, 1500)),
                        type="income",
                        description="Projeto freelance",
                        date=cursor.replace(day=random.randint(1, 28)),
                    )
                )

            # Entre 15 e 25 despesas espalhadas pelo mês.
            for _ in range(random.randint(15, 25)):
                category = random.choice(expense_categories)
                description = random.choice(EXPENSE_DESCRIPTIONS[category.name])
                day = random.randint(1, 28)
                transactions.append(
                    Transaction(
                        wallet=wallet,
                        category=category,
                        amount=Decimal(random.randint(15, 400)),
                        type="expense",
                        description=description,
                        date=cursor.replace(day=day),
                    )
                )

            cursor = (cursor.replace(day=1) + timedelta(days=31)).replace(day=1)

        Transaction.objects.bulk_create(transactions)
        return len(transactions)
