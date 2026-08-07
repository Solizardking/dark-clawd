"""Small Helius JSON-RPC client used by examples.

The client intentionally uses only the Python standard library so the example
can run in minimal environments. Set HELIUS_API_KEY, and optionally
HELIUS_RPC_URL, before calling live endpoints.
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from dataclasses import dataclass
from types import SimpleNamespace
from typing import Any


DEFAULT_RPC_BASE = "https://mainnet.helius-rpc.com"


class HeliusError(RuntimeError):
    """Raised when Helius RPC returns an error response."""


def _to_object(value: Any) -> Any:
    if isinstance(value, dict):
        return SimpleNamespace(**{key: _to_object(item) for key, item in value.items()})
    if isinstance(value, list):
        return [_to_object(item) for item in value]
    return value


@dataclass(frozen=True)
class HeliusClient:
    api_key: str | None = None
    rpc_url: str | None = None
    timeout_seconds: float = 20.0

    def __post_init__(self) -> None:
        api_key = self.api_key or os.getenv("HELIUS_API_KEY", "").strip()
        if not api_key:
            raise HeliusError("Missing HELIUS_API_KEY")
        object.__setattr__(self, "api_key", api_key)

        configured_rpc = self.rpc_url or os.getenv("HELIUS_RPC_URL", "").strip()
        if configured_rpc:
            rpc_url = configured_rpc
        else:
            rpc_url = f"{DEFAULT_RPC_BASE}/?api-key={api_key}"
        if "api-key=" not in rpc_url:
            separator = "&" if "?" in rpc_url else "?"
            rpc_url = f"{rpc_url}{separator}api-key={api_key}"
        object.__setattr__(self, "rpc_url", rpc_url)

    def rpc(self, method: str, params: Any) -> Any:
        body = json.dumps({"jsonrpc": "2.0", "id": "openclawd-example", "method": method, "params": params}).encode()
        request = urllib.request.Request(
            self.rpc_url or "",
            data=body,
            headers={"Content-Type": "application/json", "Accept": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=self.timeout_seconds) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise HeliusError(f"HTTP {exc.code}: {detail}") from exc
        except urllib.error.URLError as exc:
            raise HeliusError(f"RPC request failed: {exc.reason}") from exc

        if "error" in payload:
            error = payload["error"]
            message = error.get("message", "unknown Helius RPC error") if isinstance(error, dict) else str(error)
            raise HeliusError(message)
        return payload.get("result")

    def get_asset(self, asset_id: str) -> Any:
        return _to_object(self.rpc("getAsset", {"id": asset_id}))

    def get_asset_batch(self, asset_ids: list[str]) -> list[Any]:
        return _to_object(self.rpc("getAssetBatch", {"ids": asset_ids}))

    def get_assets_by_owner(self, owner_address: str, limit: int = 100, page: int = 1, show_fungible: bool = False) -> dict:
        return self.rpc(
            "getAssetsByOwner",
            {
                "ownerAddress": owner_address,
                "page": page,
                "limit": limit,
                "displayOptions": {"showFungible": show_fungible, "showNativeBalance": True},
            },
        )

    def search_assets(
        self,
        *,
        owner_address: str | None = None,
        token_type: str | None = None,
        compressed: bool | None = None,
        limit: int = 10,
        page: int = 1,
    ) -> dict:
        params: dict[str, Any] = {"page": page, "limit": limit}
        if owner_address:
            params["ownerAddress"] = owner_address
        if token_type:
            params["tokenType"] = token_type
        if compressed is not None:
            params["compressed"] = compressed
        return self.rpc("searchAssets", params)

    def get_asset_proof(self, asset_id: str) -> Any:
        return _to_object(self.rpc("getAssetProof", {"id": asset_id}))

    def get_priority_fee_estimate(
        self,
        *,
        account_keys: list[str],
        include_all_priority_fee_levels: bool = True,
    ) -> Any:
        return _to_object(
            self.rpc(
                "getPriorityFeeEstimate",
                {
                    "accountKeys": account_keys,
                    "options": {"includeAllPriorityFeeLevels": include_all_priority_fee_levels},
                },
            )
        )
