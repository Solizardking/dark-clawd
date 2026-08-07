/**
 * Dark Clawd OpenRouter agent harness
 * Inspired by @openrouter/agent / create-agent-tui patterns:
 *  - model call → tool execution loop → stop conditions
 *  - core tools always loaded; specialty via search_tools
 * Uses OpenRouter Chat Completions (no extra SDK required).
 */

import {
  coreTools,
  getToolDef,
  runSolGptTool,
  searchTools,
  SOL_GPT_CORE_COUNT,
  SOL_GPT_TOOL_COUNT,
  type SolGptToolDef,
} from '../tools/index.js';

export type AgentMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
  name?: string;
};

export type AgentEvent =
  | { type: 'text'; text: string }
  | { type: 'tool_start'; name: string; args: Record<string, unknown>; id: string }
  | { type: 'tool_end'; name: string; ok: boolean; summary: string; id: string }
  | { type: 'step'; step: number; maxSteps: number }
  | { type: 'usage'; promptTokens?: number; completionTokens?: number; totalTokens?: number; model?: string }
  | { type: 'error'; error: string }
  | { type: 'done'; text: string };

export interface AgentHarnessOptions {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  maxSteps?: number;
  temperature?: number;
  wallet?: string;
  /** Load full catalog (can be large). Default: core tools + search_tools only. */
  fullCatalog?: boolean;
  systemPrompt?: string;
  onEvent?: (event: AgentEvent) => void;
}

const DEFAULT_MODEL = process.env.OPENROUTER_DEFAULT_MODEL || process.env.OPENROUTER_MODEL || 'poolside/laguna-s-2.1:free';
const DEFAULT_BASE = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

const SYSTEM = `You are DARK CLAWD — autonomous Solana terminal intelligence (non-custodial).
You have ${SOL_GPT_TOOL_COUNT} SOL GPT tools (${SOL_GPT_CORE_COUNT} core always loaded).
Rules:
- Prefer tools for live market / wallet / perps facts; do not invent prices.
- Live spends are user-signed only: prepare_* returns unsigned plans — never ask for private keys.
- Use search_tools when you need a specialty tool not in the core set, then call it by name.
- Be concise, terminal-native, and cite tool results.
Product hub: https://cheshireterminal.ai/dark-clawd`;

function toOpenAiTool(def: SolGptToolDef) {
  return {
    type: 'function' as const,
    function: {
      name: def.name,
      description: `[${def.group}${def.core ? ',core' : ''}${def.custody === 'user-signed' ? ',user-signed' : ''}] ${def.description}`,
      parameters: {
        type: 'object',
        properties: {
          // Generic bag — runner validates per-tool
          mint: { type: 'string', description: 'Token mint / address when relevant' },
          wallet: { type: 'string', description: 'Wallet address when relevant' },
          symbol: { type: 'string', description: 'Market symbol e.g. SOL-PERP' },
          query: { type: 'string', description: 'Search query' },
          amount: { type: 'string', description: 'Amount as string' },
          limit: { type: 'number' },
          timeframe: { type: 'string' },
          side: { type: 'string' },
          inputMint: { type: 'string' },
          outputMint: { type: 'string' },
          token: { type: 'string' },
          address: { type: 'string' },
          ticker: { type: 'string' },
          args_json: {
            type: 'string',
            description: 'Optional JSON object string for additional tool args',
          },
        },
        additionalProperties: true,
      },
    },
  };
}

function buildToolList(fullCatalog: boolean): SolGptToolDef[] {
  if (fullCatalog) {
    // Cap extreme context: full catalog is large; prefer core + platform search
    const core = coreTools();
    return core;
  }
  return coreTools();
}

function parseArgs(raw: string): Record<string, unknown> {
  try {
    const obj = JSON.parse(raw || '{}') as Record<string, unknown>;
    if (typeof obj.args_json === 'string') {
      try {
        Object.assign(obj, JSON.parse(obj.args_json));
      } catch {
        /* ignore */
      }
      delete obj.args_json;
    }
    return obj;
  } catch {
    return {};
  }
}

function summarizeResult(ok: boolean, data: unknown): string {
  const s = JSON.stringify(data);
  if (!s) return ok ? 'ok' : 'fail';
  return s.length > 1200 ? `${s.slice(0, 1200)}…` : s;
}

export class OpenRouterAgentHarness {
  private apiKey: string;
  private model: string;
  private baseUrl: string;
  private maxSteps: number;
  private temperature: number;
  private wallet?: string;
  private fullCatalog: boolean;
  private systemPrompt: string;
  private onEvent?: (e: AgentEvent) => void;
  private messages: AgentMessage[] = [];
  private tools: ReturnType<typeof toOpenAiTool>[] = [];

  constructor(opts: AgentHarnessOptions = {}) {
    this.apiKey = opts.apiKey || process.env.OPENROUTER_API_KEY || '';
    this.model = opts.model || DEFAULT_MODEL;
    this.baseUrl = (opts.baseUrl || DEFAULT_BASE).replace(/\/$/, '');
    this.maxSteps = opts.maxSteps ?? 8;
    this.temperature = opts.temperature ?? 0.4;
    this.wallet = opts.wallet || process.env.SOLANA_WALLET;
    this.fullCatalog = opts.fullCatalog ?? false;
    this.systemPrompt = opts.systemPrompt || SYSTEM;
    this.onEvent = opts.onEvent;
    this.tools = buildToolList(this.fullCatalog).map(toOpenAiTool);
    this.messages = [{ role: 'system', content: this.systemPrompt }];
  }

  get history(): AgentMessage[] {
    return this.messages.slice();
  }

  private emit(e: AgentEvent) {
    this.onEvent?.(e);
  }

  private async chatOnce(): Promise<{
    message: AgentMessage;
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  }> {
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY is required for dark-clawd agent');
    }
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://cheshireterminal.ai/dark-clawd',
        'X-Title': 'Dark Clawd',
      },
      body: JSON.stringify({
        model: this.model,
        messages: this.messages,
        tools: this.tools,
        tool_choice: 'auto',
        temperature: this.temperature,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 500)}`);
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: AgentMessage }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    };
    const message = data.choices?.[0]?.message;
    if (!message) throw new Error('OpenRouter returned empty message');
    return { message, usage: data.usage };
  }

  private async executeToolCall(tc: NonNullable<AgentMessage['tool_calls']>[number]): Promise<string> {
    const name = tc.function?.name || '';
    const args = parseArgs(tc.function?.arguments || '{}');
    if (this.wallet && !args.wallet && !args.walletAddress) {
      args.wallet = this.wallet;
    }
    this.emit({ type: 'tool_start', name, args, id: tc.id });

    // Allow mid-chat specialty discovery: if model invents a known specialty name, still run it
    if (!getToolDef(name) && name !== 'search_tools') {
      const hits = searchTools(name, 5).map((t) => t.name);
      const payload = JSON.stringify({
        ok: false,
        error: `Unknown tool ${name}`,
        suggestions: hits,
        hint: 'Call search_tools then use an exact tool name from the catalog',
      });
      this.emit({ type: 'tool_end', name, ok: false, summary: payload, id: tc.id });
      return payload;
    }

    const result = await runSolGptTool({ tool: name, args, wallet: this.wallet });
    const summary = summarizeResult(result.ok, result);
    this.emit({ type: 'tool_end', name, ok: result.ok, summary, id: tc.id });
    return JSON.stringify(result);
  }

  /** One user turn → multi-step tool loop until final text or maxSteps. */
  async run(userText: string): Promise<string> {
    this.messages.push({ role: 'user', content: userText });
    let finalText = '';

    for (let step = 1; step <= this.maxSteps; step++) {
      this.emit({ type: 'step', step, maxSteps: this.maxSteps });
      let message: AgentMessage;
      let usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined;
      try {
        const once = await this.chatOnce();
        message = once.message;
        usage = once.usage;
      } catch (e) {
        const err = e instanceof Error ? e.message : String(e);
        this.emit({ type: 'error', error: err });
        throw e;
      }

      if (usage) {
        this.emit({
          type: 'usage',
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
          model: this.model,
        });
      }

      this.messages.push({
        role: 'assistant',
        content: message.content ?? null,
        tool_calls: message.tool_calls,
      });

      const calls = message.tool_calls || [];
      if (!calls.length) {
        finalText = message.content || '';
        this.emit({ type: 'text', text: finalText });
        this.emit({ type: 'done', text: finalText });
        return finalText;
      }

      for (const tc of calls) {
        const output = await this.executeToolCall(tc);
        this.messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          name: tc.function?.name,
          content: output,
        });
      }
    }

    finalText =
      finalText ||
      `[agent] Stopped after ${this.maxSteps} steps (maxSteps). Increase with --max-steps.`;
    this.emit({ type: 'done', text: finalText });
    return finalText;
  }
}

export function formatAgentBanner(model: string): string {
  return [
    '🦞 Dark Clawd · OpenRouter agent harness',
    `   model: ${model}`,
    `   tools: ${SOL_GPT_CORE_COUNT} core / ${SOL_GPT_TOOL_COUNT} catalog (search_tools for specialty)`,
    '   custody: prepare_* is user-signed only — never paste private keys',
    '   quit: /exit  ·  help: /help  ·  tools: /tools',
  ].join('\n');
}
