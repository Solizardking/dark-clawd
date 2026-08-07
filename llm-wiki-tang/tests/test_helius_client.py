import json
import urllib.error

import pytest

from dexter.tools.helius import HeliusClient, HeliusError


def test_requires_api_key(monkeypatch):
    monkeypatch.delenv("HELIUS_API_KEY", raising=False)

    with pytest.raises(HeliusError, match="Missing HELIUS_API_KEY"):
        HeliusClient()


def test_builds_default_rpc_url(monkeypatch):
    monkeypatch.setenv("HELIUS_API_KEY", "test-key")

    client = HeliusClient()

    assert client.rpc_url == "https://mainnet.helius-rpc.com/?api-key=test-key"


def test_rpc_returns_result(monkeypatch):
    class FakeResponse:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def read(self):
            return json.dumps({"result": {"id": "asset-1"}}).encode()

    def fake_urlopen(request, timeout):
        assert request.method == "POST"
        assert timeout == 20.0
        return FakeResponse()

    monkeypatch.setattr("urllib.request.urlopen", fake_urlopen)
    client = HeliusClient(api_key="test-key")

    assert client.rpc("getAsset", {"id": "asset-1"}) == {"id": "asset-1"}


def test_rpc_raises_on_json_rpc_error(monkeypatch):
    class FakeResponse:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def read(self):
            return json.dumps({"error": {"message": "bad request"}}).encode()

    monkeypatch.setattr("urllib.request.urlopen", lambda *_args, **_kwargs: FakeResponse())
    client = HeliusClient(api_key="test-key")

    with pytest.raises(HeliusError, match="bad request"):
        client.rpc("getAsset", {"id": "asset-1"})
