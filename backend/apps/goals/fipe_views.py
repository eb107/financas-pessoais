import re
from decimal import Decimal, InvalidOperation

import requests
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView

from . import fipe

UNAVAILABLE_MESSAGE = "Não foi possível consultar a tabela FIPE agora."


class FipeThrottle(UserRateThrottle):
    scope = "fipe"


def _parse_brl(price_text: str) -> Decimal | None:
    digits_only = re.sub(r"[^\d,]", "", price_text).replace(",", ".")
    try:
        return Decimal(digits_only)
    except InvalidOperation:
        return None


class FipeBrandsView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [FipeThrottle]

    def get(self, request):
        try:
            return Response(fipe.list_brands())
        except requests.RequestException:
            return Response({"detail": UNAVAILABLE_MESSAGE}, status=503)


class FipeModelsView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [FipeThrottle]

    def get(self, request, brand_code):
        try:
            return Response(fipe.list_models(brand_code))
        except requests.RequestException:
            return Response({"detail": UNAVAILABLE_MESSAGE}, status=503)


class FipeYearsView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [FipeThrottle]

    def get(self, request, brand_code, model_code):
        try:
            return Response(fipe.list_years(brand_code, model_code))
        except requests.RequestException:
            return Response({"detail": UNAVAILABLE_MESSAGE}, status=503)


class FipePriceView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [FipeThrottle]

    def get(self, request, brand_code, model_code, year_code):
        try:
            data = fipe.get_price(brand_code, model_code, year_code)
        except requests.RequestException:
            return Response({"detail": UNAVAILABLE_MESSAGE}, status=503)

        if "price" in data:
            data = {**data, "price_value": _parse_brl(data["price"])}
        return Response(data)
