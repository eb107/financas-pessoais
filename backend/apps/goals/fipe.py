"""Cliente pra tabela FIPE (preços de referência de veículos no Brasil),
via a API pública gratuita parallelum.com.br/fipe — sem necessidade de
chave. Usado só como atalho pra pré-preencher o valor de uma meta de
"comprar um carro"; os valores são de referência, não preço de mercado.

Respostas em cache local (a tabela FIPE só é atualizada mensalmente, então
não faz sentido bater na API externa a cada requisição)."""

import requests
from django.core.cache import cache

FIPE_BASE_URL = "https://parallelum.com.br/fipe/api/v2/cars"
CACHE_TTL = 60 * 60 * 24
REQUEST_TIMEOUT = 8


def _cached_get(url: str, cache_key: str):
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    response = requests.get(url, timeout=REQUEST_TIMEOUT)
    response.raise_for_status()
    data = response.json()
    cache.set(cache_key, data, CACHE_TTL)
    return data


def list_brands():
    return _cached_get(f"{FIPE_BASE_URL}/brands", "fipe:brands")


def list_models(brand_code: str):
    return _cached_get(
        f"{FIPE_BASE_URL}/brands/{brand_code}/models", f"fipe:models:{brand_code}"
    )


def list_years(brand_code: str, model_code: str):
    return _cached_get(
        f"{FIPE_BASE_URL}/brands/{brand_code}/models/{model_code}/years",
        f"fipe:years:{brand_code}:{model_code}",
    )


def get_price(brand_code: str, model_code: str, year_code: str):
    return _cached_get(
        f"{FIPE_BASE_URL}/brands/{brand_code}/models/{model_code}/years/{year_code}",
        f"fipe:price:{brand_code}:{model_code}:{year_code}",
    )
