/**
 * Small fetch helpers for tool backends (no secrets logged).
 */

export type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

export async function httpJson(
  url: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<{ ok: boolean; status: number; data: Json; error?: string }> {
  const timeoutMs = init?.timeoutMs ?? 20_000;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: {
        accept: 'application/json',
        ...(init?.headers || {}),
      },
    });
    const text = await res.text();
    let data: Json = null;
    try {
      data = text ? (JSON.parse(text) as Json) : null;
    } catch {
      data = { raw: text.slice(0, 4000) };
    }
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data,
        error: `HTTP ${res.status} for ${url.split('?')[0]}`,
      };
    }
    return { ok: true, status: res.status, data };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: e instanceof Error ? e.message : String(e),
    };
  } finally {
    clearTimeout(timer);
  }
}

export function env(name: string, fallback = ''): string {
  return (process.env[name] || fallback).trim();
}

export function heliusRpcUrl(): string {
  const key = env('HELIUS_API_KEY');
  if (env('HELIUS_RPC_URL')) return env('HELIUS_RPC_URL');
  if (key) return `https://mainnet.helius-rpc.com/?api-key=${key}`;
  return env('SOLANA_RPC_URL', 'https://api.mainnet-beta.solana.com');
}

export function imperialBase(): string {
  return env('IMPERIAL_API_BASE', 'https://api.imperial.space/api/v1').replace(/\/$/, '');
}

export function phoenixApiBase(): string {
  return env('PHOENIX_API_URL', 'https://perp-api.phoenix.trade').replace(/\/$/, '');
}

export function birdeyeKey(): string {
  return env('BIRDEYE_API_KEY');
}

export function solanaTrackerKey(): string {
  return env('SOLANA_TRACKER_API_KEY') || env('SOLANA_TRACKER_DATA_API_KEY');
}

export function solanaTrackerRpcUrl(): string {
  return env('SOLANA_TRACKER_RPC_URL') || env('SOLANA_TRACKER_DAS_URL');
}

export function solanaTrackerRpcKey(): string {
  return env('SOLANA_TRACKER_RPC_API_KEY') || solanaTrackerKey();
}
