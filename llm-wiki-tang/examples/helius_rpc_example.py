#!/usr/bin/env python3
"""Example usage of the local Helius RPC client.

Set HELIUS_API_KEY in the environment or in ../.env before running.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - optional convenience dependency
    load_dotenv = None

ROOT = Path(__file__).resolve().parents[1]
if load_dotenv:
    load_dotenv(ROOT / ".env")
    load_dotenv(ROOT / "env")

sys.path.insert(0, str(ROOT / "src"))

from dexter.tools.helius import HeliusClient, HeliusError


def asset_name(asset) -> str:
    metadata = getattr(getattr(asset, "content", None), "metadata", None)
    return getattr(metadata, "name", None) or "Unknown"


def main() -> int:
    if not os.getenv("HELIUS_API_KEY"):
        print("Missing HELIUS_API_KEY. Add it to llm-wiki-tang/.env or export it.")
        return 2

    client = HeliusClient()

    print("=" * 80)
    print("Helius RPC API Examples")
    print("=" * 80)

    print("\n1. Getting specific NFT asset...")
    try:
        asset_id = "F9Lw3ki3hJ7PF9HQXsBzoY8GyE6sPoEZZdXJBsTTD2rk"
        asset = client.get_asset(asset_id)
        print(f"   Asset ID: {asset.id}")
        print(f"   Interface: {getattr(asset, 'interface', 'unknown')}")
        print(f"   Name: {asset_name(asset)}")
        ownership = getattr(asset, "ownership", None)
        if ownership:
            print(f"   Owner: {getattr(ownership, 'owner', 'unknown')}")
            print(f"   Frozen: {getattr(ownership, 'frozen', False)}")
    except Exception as exc:
        print(f"   Error: {exc}")

    print("\n2. Getting assets by owner...")
    try:
        owner = "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY"
        result = client.get_assets_by_owner(owner_address=owner, limit=5, show_fungible=True)
        items = result.get("items", [])
        print(f"   Total assets: {result.get('total', len(items))}")
        print(f"   Showing: {len(items)}")
        for idx, raw_asset in enumerate(items[:3], 1):
            asset = client.get_asset(raw_asset["id"]) if isinstance(raw_asset, dict) and raw_asset.get("id") else raw_asset
            print(f"   {idx}. {asset_name(asset)} ({getattr(asset, 'interface', 'unknown')})")
    except Exception as exc:
        print(f"   Error: {exc}")

    print("\n3. Getting compressed NFT proof...")
    try:
        compressed_nft_id = "Bu1DEKeawy7txbnCEJE4BU3BKLXaNAKCYcHR4XhndGss"
        proof = client.get_asset_proof(compressed_nft_id)
        print(f"   Tree ID: {getattr(proof, 'tree_id', 'unknown')}")
        print(f"   Node Index: {getattr(proof, 'node_index', 'unknown')}")
        print(f"   Proof hashes: {len(getattr(proof, 'proof', []) or [])}")
        print(f"   Root: {getattr(proof, 'root', 'unknown')}")
    except Exception as exc:
        print(f"   Error: {exc}")

    print("\n4. Searching compressed NFTs...")
    try:
        owner = "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY"
        result = client.search_assets(owner_address=owner, token_type="compressedNft", limit=3)
        print(f"   Found {result.get('total', len(result.get('items', [])))} compressed NFTs")
        for idx, raw_asset in enumerate(result.get("items", []), 1):
            asset = raw_asset if not isinstance(raw_asset, dict) else client.get_asset(raw_asset.get("id", ""))
            compressed = getattr(getattr(asset, "compression", None), "compressed", False)
            print(f"   {idx}. {asset_name(asset)} (Compressed: {compressed})")
    except Exception as exc:
        print(f"   Error: {exc}")

    print("\n5. Getting priority fee estimates...")
    try:
        fee_estimate = client.get_priority_fee_estimate(
            account_keys=["2CiBfRKcERi2GgYn83UaGo1wFaYHHrXGGfnDaa2hxdEA"],
            include_all_priority_fee_levels=True,
        )
        levels = getattr(fee_estimate, "priority_fee_levels", None)
        if levels:
            print(f"   Min: {getattr(levels, 'min', 0):,.0f} microlamports")
            print(f"   Low: {getattr(levels, 'low', 0):,.0f} microlamports")
            print(f"   Medium: {getattr(levels, 'medium', 0):,.0f} microlamports")
            print(f"   High: {getattr(levels, 'high', 0):,.0f} microlamports")
            print(f"   Very High: {getattr(levels, 'very_high', 0):,.0f} microlamports")
    except Exception as exc:
        print(f"   Error: {exc}")

    print("\n6. Batch getting multiple assets...")
    try:
        assets = client.get_asset_batch(["F9Lw3ki3hJ7PF9HQXsBzoY8GyE6sPoEZZdXJBsTTD2rk"])
        print(f"   Retrieved {len(assets)} assets")
        for asset in assets:
            print(f"   - {asset_name(asset)} ({getattr(asset, 'interface', 'unknown')})")
    except Exception as exc:
        print(f"   Error: {exc}")

    print("\n" + "=" * 80)
    print("Examples completed.")
    print("=" * 80)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except HeliusError as exc:
        print(f"Helius error: {exc}")
        raise SystemExit(1)
