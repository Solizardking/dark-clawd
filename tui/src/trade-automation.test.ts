import { describe, expect, test } from 'bun:test';
import {
  AutomationRegistry,
  buildAutomationKitManifest,
  formatTradePlan,
  planTrade,
  DARK_CLAWD_INSTALL_CURL,
  DARK_CLAWD_PRODUCT_URL,
} from './services/trade-automation.js';
import { createSandboxHandler } from './services/sandbox-server.js';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';

const SOL_MINT = 'So11111111111111111111111111111111111111112';
const RH_TOKEN = '0x1234567890abcdef1234567890abcdef12345678';

describe('trade automation kit', () => {
  test('plans solana and robinhood paper trades via real planTrade', () => {
    const sol = planTrade({
      chain: 'solana',
      token: SOL_MINT,
      side: 'buy',
      amount: 0.25,
      symbol: 'SOL',
    });
    expect(sol.chain).toBe('solana');
    expect(sol.mode).toBe('paper');
    expect(sol.status).toBe('planned');
    expect(sol.legs.length).toBeGreaterThan(0);
    expect(sol.legs.some((l) => l.venue === 'Jupiter')).toBe(true);
    expect(formatTradePlan(sol)).toContain('TRADE PLAN');
    expect(formatTradePlan(sol).toLowerCase()).not.toContain('broadcast complete');

    const rh = planTrade({
      chain: 'robinhood',
      token: RH_TOKEN,
      side: 'sell',
      amount: 10,
      symbol: 'RHX',
    });
    expect(rh.chain).toBe('robinhood');
    expect(rh.legs.some((l) => /Robinhood/i.test(l.venue))).toBe(true);
  });

  test('live mode is blocked without keys', () => {
    const plan = planTrade({
      chain: 'solana',
      token: SOL_MINT,
      side: 'buy',
      amount: 1,
      mode: 'live',
    });
    expect(plan.status).toBe('blocked');
    expect(plan.warnings.some((w) => /live/i.test(w))).toBe(true);
  });

  test('rejects bad addresses', () => {
    expect(() => planTrade({ chain: 'solana', token: 'nope', side: 'buy', amount: 1 })).toThrow();
    expect(() =>
      planTrade({ chain: 'robinhood', token: 'not-hex', side: 'buy', amount: 1 }),
    ).toThrow();
  });

  test('automation registry create + run uses planTrade path', () => {
    const reg = new AutomationRegistry();
    const job = reg.create({
      name: 'dca-sol',
      chain: 'solana',
      token: SOL_MINT,
      side: 'buy',
      amount: 0.05,
    });
    expect(job.id).toMatch(/^auto_/);
    const plan = reg.run(job.id);
    expect(plan.automationId).toBe(job.id);
    expect(reg.get(job.id)?.runs).toBe(1);
    expect(reg.list()).toHaveLength(1);
  });

  test('kit manifest points at cheshire install + product', () => {
    const kit = buildAutomationKitManifest({ sandboxBase: 'http://127.0.0.1:18790' });
    expect(kit.productUrl).toBe(DARK_CLAWD_PRODUCT_URL);
    expect(kit.install.curl).toBe(DARK_CLAWD_INSTALL_CURL);
    expect(kit.sandbox.health).toContain('/health');
    expect(kit.chains).toContain('solana');
    expect(kit.chains).toContain('robinhood');
  });

  test('sandbox HTTP serves health/status/trade plan on real handler', async () => {
    const handler = createSandboxHandler({ port: 0, host: '127.0.0.1' });
    const server = createServer((req, res) => {
      void handler(req, res);
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
    const port = (server.address() as AddressInfo).port;
    try {
      const health = await fetch(`http://127.0.0.1:${port}/health`);
      expect(health.status).toBe(200);
      const hj = (await health.json()) as { ok?: boolean; product?: string };
      expect(hj.ok).toBe(true);
      expect(hj.product).toBe('dark-clawd');

      const status = await fetch(`http://127.0.0.1:${port}/api/status`);
      const sj = (await status.json()) as { ok?: boolean; kit?: { install?: { curl?: string } } };
      expect(sj.ok).toBe(true);
      expect(String(sj.kit?.install?.curl || '')).toContain('dark-clawd/install.sh');

      const trade = await fetch(`http://127.0.0.1:${port}/api/trade/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chain: 'solana',
          token: SOL_MINT,
          side: 'buy',
          amount: 0.1,
          symbol: 'WSOL',
        }),
      });
      expect(trade.status).toBe(200);
      const tj = (await trade.json()) as { ok?: boolean; plan?: { chain?: string; status?: string } };
      expect(tj.ok).toBe(true);
      expect(tj.plan?.chain).toBe('solana');
      expect(tj.plan?.status).toBe('planned');
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
