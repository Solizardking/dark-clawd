import { describe, expect, test } from 'bun:test';
import { formatAgentBanner, OpenRouterAgentHarness } from './openrouter-harness.js';
import { SOL_GPT_CORE_COUNT, SOL_GPT_TOOL_COUNT } from '../tools/index.js';

describe('OpenRouter agent harness', () => {
  test('banner mentions catalog sizes', () => {
    const b = formatAgentBanner('poolside/laguna-s-2.1:free');
    expect(b).toContain('Dark Clawd');
    expect(b).toContain(String(SOL_GPT_CORE_COUNT));
    expect(b).toContain(String(SOL_GPT_TOOL_COUNT));
    expect(b).toContain('user-signed');
  });

  test('harness constructs with core tools without API key until run', () => {
    const h = new OpenRouterAgentHarness({ apiKey: '', model: 'test/model' });
    expect(h.history[0]?.role).toBe('system');
    expect(h.history[0]?.content || '').toContain('DARK CLAWD');
  });

  test('run without key fails closed', async () => {
    const h = new OpenRouterAgentHarness({ apiKey: '' });
    await expect(h.run('hello')).rejects.toThrow(/OPENROUTER_API_KEY/);
  });
});
