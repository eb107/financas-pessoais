import pytest
from rest_framework.test import APIClient

from apps.accounts.models import User

TEST_PASSWORD = "s3nhaSegura!23"  # noqa: S105 — senha fixa só para fixtures de teste


@pytest.fixture
def user(db):
    return User.objects.create_user(
        username="alice", email="alice@example.com", password=TEST_PASSWORD
    )


@pytest.fixture
def other_user(db):
    return User.objects.create_user(
        username="bob", email="bob@example.com", password=TEST_PASSWORD
    )


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def auth_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def other_auth_client(other_user):
    client = APIClient()
    client.force_authenticate(user=other_user)
    return client
