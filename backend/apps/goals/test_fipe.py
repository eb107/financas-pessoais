from decimal import Decimal

import pytest
import requests

pytestmark = pytest.mark.django_db


def test_list_brands_proxies_fipe_api(auth_client, monkeypatch):
    monkeypatch.setattr(
        "apps.goals.fipe_views.fipe.list_brands",
        lambda: [{"code": "21", "name": "Fiat"}],
    )

    response = auth_client.get("/api/fipe/brands/")

    assert response.status_code == 200
    assert response.data == [{"code": "21", "name": "Fiat"}]


def test_list_models_proxies_fipe_api(auth_client, monkeypatch):
    monkeypatch.setattr(
        "apps.goals.fipe_views.fipe.list_models",
        lambda brand_code: [{"code": "437", "name": "147 C/ CL"}],
    )

    response = auth_client.get("/api/fipe/brands/21/models/")

    assert response.status_code == 200
    assert response.data == [{"code": "437", "name": "147 C/ CL"}]


def test_list_years_proxies_fipe_api(auth_client, monkeypatch):
    monkeypatch.setattr(
        "apps.goals.fipe_views.fipe.list_years",
        lambda brand_code, model_code: [{"code": "1987-1", "name": "1987 Gasolina"}],
    )

    response = auth_client.get("/api/fipe/brands/21/models/437/years/")

    assert response.status_code == 200
    assert response.data == [{"code": "1987-1", "name": "1987 Gasolina"}]


def test_price_endpoint_parses_brl_string_into_numeric_value(auth_client, monkeypatch):
    monkeypatch.setattr(
        "apps.goals.fipe_views.fipe.get_price",
        lambda brand_code, model_code, year_code: {
            "price": "R$ 6.136,00",
            "brand": "Fiat",
            "model": "147 C/ CL",
            "modelYear": 1987,
        },
    )

    response = auth_client.get("/api/fipe/brands/21/models/437/years/1987-1/")

    assert response.status_code == 200
    assert response.data["price"] == "R$ 6.136,00"
    assert response.data["price_value"] == Decimal("6136.00")


def test_fipe_unavailable_returns_graceful_503(auth_client, monkeypatch):
    def raise_error():
        raise requests.ConnectionError("boom")

    monkeypatch.setattr("apps.goals.fipe_views.fipe.list_brands", raise_error)

    response = auth_client.get("/api/fipe/brands/")

    assert response.status_code == 503
