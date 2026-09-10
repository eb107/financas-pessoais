import pytest

from .models import Category, Tag

pytestmark = pytest.mark.django_db


def test_create_category_assigns_authenticated_user(auth_client, user):
    response = auth_client.post(
        "/api/categories/", {"name": "Alimentação", "kind": "expense"}
    )
    assert response.status_code == 201
    category = Category.objects.get(id=response.data["id"])
    assert category.user == user


def test_list_includes_own_and_system_default_categories(auth_client, user, other_user):
    Category.objects.create(user=user, name="Minha categoria", kind="expense")
    Category.objects.create(user=None, name="Categoria padrão", kind="expense")
    Category.objects.create(user=other_user, name="Categoria do bob", kind="expense")

    response = auth_client.get("/api/categories/")

    names = {c["name"] for c in response.data["results"]}
    assert names == {"Minha categoria", "Categoria padrão"}


def test_subcategory_references_parent(auth_client, user):
    parent = Category.objects.create(user=user, name="Alimentação", kind="expense")

    response = auth_client.post(
        "/api/categories/",
        {"name": "Restaurante", "kind": "expense", "parent": parent.id},
    )

    assert response.status_code == 201
    assert parent.subcategories.count() == 1


def test_tags_are_isolated_per_user_no_shared_defaults(auth_client, user, other_user):
    Tag.objects.create(user=user, name="viagem")
    Tag.objects.create(user=other_user, name="reembolsável")

    response = auth_client.get("/api/tags/")

    names = [t["name"] for t in response.data["results"]]
    assert names == ["viagem"]
