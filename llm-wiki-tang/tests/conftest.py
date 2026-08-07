import pytest
from fastapi.testclient import TestClient

from api.main import app
from api.memory import reset_memory
from api.research import reset_state


@pytest.fixture()
def client() -> TestClient:
    reset_state()
    reset_memory()
    return TestClient(app)
