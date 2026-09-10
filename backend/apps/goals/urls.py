from django.urls import path
from rest_framework.routers import DefaultRouter

from .fipe_views import FipeBrandsView, FipeModelsView, FipePriceView, FipeYearsView
from .views import GoalViewSet

router = DefaultRouter()
router.register("goals", GoalViewSet, basename="goal")

urlpatterns = router.urls + [
    path("fipe/brands/", FipeBrandsView.as_view(), name="fipe-brands"),
    path(
        "fipe/brands/<str:brand_code>/models/",
        FipeModelsView.as_view(),
        name="fipe-models",
    ),
    path(
        "fipe/brands/<str:brand_code>/models/<str:model_code>/years/",
        FipeYearsView.as_view(),
        name="fipe-years",
    ),
    path(
        "fipe/brands/<str:brand_code>/models/<str:model_code>/years/<str:year_code>/",
        FipePriceView.as_view(),
        name="fipe-price",
    ),
]
