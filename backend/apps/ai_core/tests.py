from types import SimpleNamespace

from apps.ai_core import client as ai_core_client


def _fake_response(text, input_tokens=10, output_tokens=5):
    return SimpleNamespace(
        content=[SimpleNamespace(type="text", text=text)],
        usage=SimpleNamespace(input_tokens=input_tokens, output_tokens=output_tokens),
    )


def _fake_client(reply_text):
    return SimpleNamespace(
        messages=SimpleNamespace(create=lambda **kwargs: _fake_response(reply_text))
    )


class TestCategorizeTransaction:
    def test_returns_none_without_category_names(self):
        assert ai_core_client.categorize_transaction("Uber", []) is None

    def test_returns_matching_category_name(self, monkeypatch):
        monkeypatch.setattr(
            ai_core_client, "_get_client", lambda: _fake_client("Transporte")
        )

        result = ai_core_client.categorize_transaction(
            "Corrida de app", ["Transporte", "Alimentação"]
        )

        assert result == "Transporte"

    def test_returns_none_when_answer_matches_no_category(self, monkeypatch):
        monkeypatch.setattr(
            ai_core_client, "_get_client", lambda: _fake_client("Lazer")
        )

        result = ai_core_client.categorize_transaction(
            "Corrida de app", ["Transporte", "Alimentação"]
        )

        assert result is None


class TestChatCompletion:
    def test_returns_text_and_total_tokens_used(self, monkeypatch):
        fake_client = SimpleNamespace(
            messages=SimpleNamespace(
                create=lambda **kw: _fake_response(
                    "Você gastou R$100 em Transporte.", 30, 20
                )
            )
        )
        monkeypatch.setattr(ai_core_client, "_get_client", lambda: fake_client)

        text, tokens = ai_core_client.chat_completion(
            "system", [{"role": "user", "content": "oi"}]
        )

        assert "Transporte" in text
        assert tokens == 50


class TestGenerateInsightTexts:
    def test_returns_empty_list_without_patterns(self):
        assert ai_core_client.generate_insight_texts([]) == []

    def test_returns_one_line_per_pattern_when_counts_match(self, monkeypatch):
        monkeypatch.setattr(
            ai_core_client, "_get_client", lambda: _fake_client("Linha 1\nLinha 2")
        )

        result = ai_core_client.generate_insight_texts(["padrao 1", "padrao 2"])

        assert result == ["Linha 1", "Linha 2"]

    def test_falls_back_to_raw_patterns_when_line_count_mismatches(self, monkeypatch):
        monkeypatch.setattr(
            ai_core_client, "_get_client", lambda: _fake_client("Só uma linha")
        )

        result = ai_core_client.generate_insight_texts(["padrao 1", "padrao 2"])

        assert result == ["padrao 1", "padrao 2"]
