// ═══════════════════════════════════════════════════════════════════════════════
// DARK CLAWD TUI - Lightweight sandbox HTTP API (Fly / local machine)
// Lets operators inspect agent status, automations, and paper trade plans.
// ═══════════════════════════════════════════════════════════════════════════════

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import {
  buildAutomationKitManifest,
  formatTradePlan,
  globalAutomationRegistry,
  planTrade,
  type TradeChain,
  type TradeSide,
  type TradeMode,
  DARK_CLAWD_PRODUCT_URL,
} from './trade-automation.js';
import { createDarkClawdMpp } from './mpp-payments.js';

export interface SandboxServerOptions {
  port?: number;
  host?: string;
  version?: string;
}

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(Buffer.from(c)));
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function send(res: ServerResponse, status: number, body: unknown, type = 'application/json') {
  const payload = type.includes('json') ? JSON.stringify(body, null, 2) : String(body);
  res.writeHead(status, {
    'Content-Type': `${type}; charset=utf-8`,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store',
  });
  res.end(payload);
}

const startedAt = Date.now();

/** Shared MPP controller for sandbox paid routes (paper by default). */
function getSandboxMpp() {
  const recipient =
    process.env.MPP_RECIPIENT ||
    process.env.CLAWD_MPP_RECIPIENT ||
    'So11111111111111111111111111111111111111112';
  const mode = process.env.MPP_MODE === 'live' ? 'live' : 'paper';
  const network = (process.env.SOLANA_NETWORK as 'mainnet-beta' | 'devnet' | 'testnet' | 'localnet') || 'mainnet-beta';
  return createDarkClawdMpp({
    recipient,
    mode,
    network,
    currency: process.env.MPP_CURRENCY || 'USDC',
    rpcUrl: process.env.SOLANA_RPC_URL,
  });
}

export function createSandboxHandler(opts: SandboxServerOptions = {}) {
  const version = opts.version || '1.0.0';
  const base = `http://${opts.host || '0.0.0.0'}:${opts.port || 18790}`;
  const mpp = getSandboxMpp();

  return async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const method = (req.method || 'GET').toUpperCase();

    if (method === 'OPTIONS') {
      return send(res, 204, '');
    }

    try {
      if (method === 'GET' && (path === '/health' || path === '/api/health')) {
        return send(res, 200, {
          ok: true,
          product: 'dark-clawd',
          status: 'ok',
          uptimeSec: Math.floor((Date.now() - startedAt) / 1000),
          productUrl: DARK_CLAWD_PRODUCT_URL,
        });
      }

      if (method === 'GET' && path === '/api/status') {
        return send(res, 200, {
          ok: true,
          product: 'Dark Clawd Sandbox',
          version,
          mode: process.env.CLAWD_SANDBOX_MODE || 'sandbox',
          uptimeSec: Math.floor((Date.now() - startedAt) / 1000),
          automations: globalAutomationRegistry.list().length,
          agent: {
            name: 'ClawdAgent',
            theme: 'dark-clawd',
            chains: ['solana', 'robinhood'],
          },
          productUrl: DARK_CLAWD_PRODUCT_URL,
          kit: buildAutomationKitManifest({ sandboxBase: base, version }),
        });
      }

      if (method === 'GET' && path === '/api/kit') {
        return send(res, 200, {
          ok: true,
          kit: buildAutomationKitManifest({ sandboxBase: base, version }),
        });
      }

      if (method === 'GET' && path === '/api/automations') {
        return send(res, 200, {
          ok: true,
          automations: globalAutomationRegistry.list(),
        });
      }

      if (method === 'POST' && path === '/api/automations') {
        const body = (await readJson(req)) as Record<string, unknown>;
        const job = globalAutomationRegistry.create({
          name: String(body.name || 'sandbox-job'),
          chain: (String(body.chain || 'solana') as TradeChain) === 'robinhood' ? 'robinhood' : 'solana',
          token: String(body.token || ''),
          side: (String(body.side || 'buy') as TradeSide) === 'sell' ? 'sell' : 'buy',
          amount: Number(body.amount || 0),
          cadence: (body.cadence as 'once' | 'interval' | 'trigger') || 'once',
          intervalMs: body.intervalMs != null ? Number(body.intervalMs) : undefined,
          trigger: body.trigger != null ? String(body.trigger) : undefined,
          mode: (String(body.mode || 'paper') as TradeMode) === 'live' ? 'live' : 'paper',
        });
        return send(res, 201, { ok: true, automation: job });
      }

      if (method === 'POST' && path === '/api/automations/run') {
        const body = (await readJson(req)) as Record<string, unknown>;
        const id = String(body.id || '');
        const plan = globalAutomationRegistry.run(id);
        return send(res, 200, { ok: true, plan, text: formatTradePlan(plan) });
      }

      if (method === 'POST' && path === '/api/trade/plan') {
        const body = (await readJson(req)) as Record<string, unknown>;
        const plan = planTrade({
          chain: (String(body.chain || 'solana') as TradeChain) === 'robinhood' ? 'robinhood' : 'solana',
          token: String(body.token || ''),
          side: (String(body.side || 'buy') as TradeSide) === 'sell' ? 'sell' : 'buy',
          amount: Number(body.amount || 0),
          symbol: body.symbol != null ? String(body.symbol) : undefined,
          slippageBps: body.slippageBps != null ? Number(body.slippageBps) : undefined,
          mode: (String(body.mode || 'paper') as TradeMode) === 'live' ? 'live' : 'paper',
          wallet: body.wallet != null ? String(body.wallet) : undefined,
        });
        return send(res, 200, { ok: true, plan, text: formatTradePlan(plan) });
      }

      // ── Solana MPP (HTTP 402) ──────────────────────────────────────────────
      if (method === 'GET' && path === '/api/mpp') {
        const { rpcUrl: _rpc, ...publicConfig } = mpp.config;
        return send(res, 200, {
          ok: true,
          product: 'Dark Clawd Solana MPP',
          config: {
            ...publicConfig,
            // Never echo RPC URLs (may embed API keys)
            rpcConfigured: Boolean(_rpc),
          },
          docs: DARK_CLAWD_PRODUCT_URL,
          npm: 'npm install solana-mpp mppx',
          endpoints: {
            charge: 'POST /api/mpp/charge',
            sessionOpen: 'POST /api/mpp/session/open',
            sessionUse: 'POST /api/mpp/session/use',
            sessionClose: 'POST /api/mpp/session/close',
            paidTradePlan: 'POST /api/mpp/trade/plan',
          },
        });
      }

      if (method === 'POST' && path === '/api/mpp/charge') {
        const body = (await readJson(req)) as Record<string, unknown>;
        const auth = String(req.headers.authorization || req.headers['x-mpp-credential'] || '');
        const result = await mpp.charge(
          {
            amount: (body.amount as string | number) ?? '0.01',
            description: body.description != null ? String(body.description) : 'Dark Clawd charge',
          },
          { headers: auth ? { authorization: auth } : {} },
        );
        if (result.status === 402) {
          return send(res, 402, {
            ok: false,
            error: 'Payment Required',
            mpp: result.challenge,
          });
        }
        return send(res, 200, { ok: true, receipt: result.receipt });
      }

      if (method === 'POST' && path === '/api/mpp/session/open') {
        const body = (await readJson(req)) as Record<string, unknown>;
        const session = mpp.openSession({
          depositAmount: Number(body.depositAmount ?? body.deposit ?? 1),
          unitCost: Number(body.unitCost ?? body.amount ?? 0.01),
          unitType: body.unitType != null ? String(body.unitType) : 'request',
        });
        return send(res, 201, { ok: true, session });
      }

      if (method === 'POST' && path === '/api/mpp/session/use') {
        const body = (await readJson(req)) as Record<string, unknown>;
        const bearer = String(body.bearer || req.headers.authorization?.replace(/^Bearer\s+/i, '') || '');
        const used = mpp.useSession(bearer);
        if (!used.ok) return send(res, 402, { ok: false, error: used.error });
        return send(res, 200, { ok: true, session: used.session });
      }

      if (method === 'POST' && path === '/api/mpp/session/close') {
        const body = (await readJson(req)) as Record<string, unknown>;
        const closed = mpp.closeSession(String(body.sessionId || ''));
        return send(res, 200, { ok: true, session: closed, refundHuman: closed.refundHuman });
      }

      /** Paid trade plan — requires MPP charge credential (paper or live). */
      if (method === 'POST' && path === '/api/mpp/trade/plan') {
        const body = (await readJson(req)) as Record<string, unknown>;
        const auth = String(req.headers.authorization || req.headers['x-mpp-credential'] || '');
        const pay = await mpp.charge(
          {
            amount: (body.fee as string | number) ?? '0.01',
            description: 'Dark Clawd paid trade plan',
          },
          { headers: auth ? { authorization: auth } : {} },
        );
        if (pay.status === 402) {
          return send(res, 402, {
            ok: false,
            error: 'Payment Required',
            mpp: pay.challenge,
            hint: 'Retry with Authorization: Payment <base64url credential> after paying',
          });
        }
        const plan = planTrade({
          chain: (String(body.chain || 'solana') as TradeChain) === 'robinhood' ? 'robinhood' : 'solana',
          token: String(body.token || ''),
          side: (String(body.side || 'buy') as TradeSide) === 'sell' ? 'sell' : 'buy',
          amount: Number(body.amount || 0),
          symbol: body.symbol != null ? String(body.symbol) : undefined,
          mode: 'paper',
        });
        return send(res, 200, {
          ok: true,
          paid: true,
          receipt: pay.receipt,
          plan,
          text: formatTradePlan(plan),
        });
      }

      if (method === 'GET' && path === '/') {
        return send(
          res,
          200,
          `<!doctype html><html><head><meta charset="utf-8"/><title>Dark Clawd Sandbox</title>
<style>body{font-family:ui-monospace,monospace;background:#0a0a0a;color:#7CFF6B;padding:2rem}
a{color:#5eead4}code{background:#111;padding:.2rem .4rem;border-radius:4px}</style></head>
<body><h1>🦞 Dark Clawd Sandbox</h1>
<p>Fly / local machine API for agent + automation inspection.</p>
<ul>
<li><a href="/health">/health</a></li>
<li><a href="/api/status">/api/status</a></li>
<li><a href="/api/kit">/api/kit</a></li>
<li><a href="/api/automations">/api/automations</a></li>
<li><a href="/api/mpp">/api/mpp</a> (Solana MPP · HTTP 402)</li>
</ul>
<p>Product: <a href="${DARK_CLAWD_PRODUCT_URL}">${DARK_CLAWD_PRODUCT_URL}</a></p>
<p>Install: <code>curl -fsSL https://cheshireterminal.ai/api/dark-clawd/install.sh | bash</code></p>
<p>MPP: <code>npm install solana-mpp mppx</code></p>
</body></html>`,
          'text/html',
        );
      }

      return send(res, 404, { ok: false, error: 'not found', path });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return send(res, 400, { ok: false, error: message });
    }
  };
}

export function startSandboxServer(opts: SandboxServerOptions = {}) {
  const port = opts.port ?? Number(process.env.PORT || process.env.CLAWD_SANDBOX_PORT || 18790);
  const host = opts.host || process.env.HOST || '0.0.0.0';
  const handler = createSandboxHandler({ ...opts, port, host });
  const server = createServer((req, res) => {
    void handler(req, res);
  });
  server.listen(port, host);
  return { server, port, host };
}
