from datetime import date

import pytest
from django.test import override_settings

from apps.transactions.models import Transaction
from apps.wallets.models import Wallet

from .context import build_financial_context
from .models import ChatMessage, ChatSession

pytestmark = pytest.mark.django_db


def test_chat_sessions_are_isolated_per_user(auth_client, user, other_user):
    ChatSession.objects.create(user=user, title="Minha conversa")
    ChatSession.objects.create(user=other_user, title="Conversa do bob")

    response = auth_client.get("/api/ai/chat/sessions/")

    titles = [s["title"] for s in response.data["results"]]
    assert titles == ["Minha conversa"]


def test_create_session_assigns_authenticated_user(auth_client, user):
    response = auth_client.post("/api/ai/chat/sessions/", {"title": "Nova conversa"})
    assert response.status_code == 201
    assert ChatSession.objects.get(id=response.data["id"]).user == user


@override_settings(ANTHROPIC_API_KEY="")
def test_message_without_api_key_returns_graceful_reply_and_auto_titles_session(
    auth_client, user
):
    session = ChatSession.objects.create(user=user)

    response = auth_client.post(
        f"/api/ai/chat/sessions/{session.id}/messages/",
        {"content": "Quanto gastei esse mês?"},
    )

    assert response.status_code == 201
    assert "não configurado" in response.data["assistant_message"]["content"]
    session.refresh_from_db()
    assert session.title == "Quanto gastei esse mês?"


@override_settings(ANTHROPIC_API_KEY="fake-key-for-test")
def test_message_with_api_key_uses_mocked_ai_reply(auth_client, user, monkeypatch):
    session = ChatSession.objects.create(user=user)
    monkeypatch.setattr(
        "apps.ai_assistant.views.chat_completion",
        lambda system_prompt, messages: ("Você gastou R$100 este mês.", 42),
    )

    response = auth_client.post(
        f"/api/ai/chat/sessions/{session.id}/messages/",
        {"content": "Quanto gastei esse mês?"},
    )

    assert response.status_code == 201
    assistant_message = response.data["assistant_message"]
    assert assistant_message["content"] == "Você gastou R$100 este mês."
    assert assistant_message["tokens_used"] == 42


def test_cannot_access_another_users_session_messages(auth_client, other_user):
    other_session = ChatSession.objects.create(user=other_user)

    response = auth_client.get(f"/api/ai/chat/sessions/{other_session.id}/messages/")

    assert response.status_code == 404


def test_message_history_persists_and_is_ordered(auth_client, user):
    session = ChatSession.objects.create(user=user)
    ChatMessage.objects.create(session=session, role="user", content="Primeira")
    ChatMessage.objects.create(session=session, role="assistant", content="Segunda")

    response = auth_client.get(f"/api/ai/chat/sessions/{session.id}/messages/")

    assert [m["content"] for m in response.data] == ["Primeira", "Segunda"]


def test_build_financial_context_includes_wallet_and_monthly_totals(user):
    wallet = Wallet.objects.create(user=user, name="Nubank")
    Transaction.objects.create(
        wallet=wallet, amount=1000, type="income", date=date.today()
    )

    context = build_financial_context(user)

    assert "Nubank" in context
    assert "receita" in context.lower()
