import { describe, expect, test } from 'bun:test';
import {
  SOL_GPT_TOOL_DEFS,
  SOL_GPT_TOOL_GROUPS,
  SOL_GPT_TOOL_COUNT,
  SOL_GPT_CORE_COUNT,
  getSolGptShippedToolCatalog,
  availableSolGptTools,
  searchTools,
  getToolDef,
  coreTools,
  toolsByGroup,
} from './catalog.js';
import { runSolGptTool } from './runner.js';

const EXPECTED_GROUP_COUNTS: Record<string, number> = {
  phoenix: 23,
  imperial: 32,
  market: 18,
  ohlcv: 10,
  wallet: 4,
  helius: 8,
  solanatracker: 60,
  trading: 5,
  prediction: 3,
  browser: 4,
  agents: 2,
  platform: 2,
};

describe('SOL GPT tool catalog (Dark Clawd)', () => {
  test('ships exactly 171 tools with 122 core', () => {
    expect(SOL_GPT_TOOL_COUNT).toBe(171);
    expect(SOL_GPT_CORE_COUNT).toBe(122);
    expect(SOL_GPT_TOOL_DEFS).toHaveLength(171);
    expect(coreTools()).toHaveLength(122);
    expect(availableSolGptTools()).toHaveLength(171);
  });

  test('group counts match SOL GPT totals', () => {
    expect(SOL_GPT_TOOL_GROUPS).toHaveLength(12);
    for (const [id, count] of Object.entries(EXPECTED_GROUP_COUNTS)) {
      expect(toolsByGroup(id as keyof typeof EXPECTED_GROUP_COUNTS).length).toBe(count);
    }
    const sum = Object.values(EXPECTED_GROUP_COUNTS).reduce((a, b) => a + b, 0);
    expect(sum).toBe(171);
  });

  test('unique names and required prepare_* user-signed custody', () => {
    const names = SOL_GPT_TOOL_DEFS.map((t) => t.name);
    expect(new Set(names).size).toBe(171);
    for (const must of [
      'prepare_user_swap',
      'prepare_user_transfer',
      'prepare_phoenix_market_order',
      'prepare_phoenix_limit_order',
      'prepare_phoenix_deposit',
      'prepare_phoenix_withdraw',
      'prepare_phoenix_register_trader',
      'prepare_phoenix_cancel_all',
      'search_tools',
      'get_price',
      'list_phoenix_markets',
      'get_imperial_status',
      'st_get_wallet',
      'browse_web',
    ]) {
      expect(getToolDef(must)).toBeDefined();
    }
    expect(getToolDef('prepare_user_swap')?.custody).toBe('user-signed');
    expect(getToolDef('get_price')?.custody).toBe('read-only');
  });

  test('getSolGptShippedToolCatalog + search_tools', () => {
    const cat = getSolGptShippedToolCatalog();
    expect(cat.total).toBe(171);
    expect(cat.core).toBe(122);
    expect(cat.specialty).toBe(49);
    expect(cat.product).toBe('Dark Clawd');
    const hits = searchTools('phoenix market', 20);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((t) => t.name.includes('phoenix'))).toBe(true);
  });

  test('runSolGptTool search_tools works without network', async () => {
    const result = await runSolGptTool({
      tool: 'search_tools',
      args: { query: 'wallet', limit: 10 },
    });
    expect(result.ok).toBe(true);
    expect(result.tool).toBe('search_tools');
    const tools = (result.result as { tools?: unknown[] })?.tools;
    expect(Array.isArray(tools)).toBe(true);
    expect((tools || []).length).toBeGreaterThan(0);
  });

  test('prepare_* is non-custodial (unsigned plan, no signing)', async () => {
    const result = await runSolGptTool({
      tool: 'prepare_user_swap',
      args: { inputMint: 'So11111111111111111111111111111111111111112', outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', amount: '1000' },
      wallet: '11111111111111111111111111111111',
    });
    expect(result.ok).toBe(true);
    expect(result.custody).toBe('user-signed');
    const body = result.result as { status?: string; custody?: string };
    expect(body.status).toBe('unsigned_plan');
    expect(body.custody).toBe('user-signed');
  });

  test('unknown tool returns suggestions', async () => {
    const result = await runSolGptTool({ tool: 'get_pricee' });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/Unknown tool/);
  });
});
