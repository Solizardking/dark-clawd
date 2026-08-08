/**
 * Dark Clawd × Solana MPP integration
 *
 * Implements the Machine Payments Protocol (HTTP 402) flow for Dark Clawd
 * automation, trade plans, and sandbox APIs — paper by default, live-ready
 * when a recipient + RPC are configured.
 *
 * Compatible with the solana-mpp charge model:
 *   challenge (amount, recipient, mint, reference) → client pays → retry + credential
 *
 * Full charge methods (broadcast + on-chain verify) live in
 * `@x402solana/solana-mpp/server` via mppx + @solana/kit when peers are installed.
 */

import { createHash, randomBytes } from 'node:crypto';

export const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
export const USDC: Record<string, string> = {
  devnet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  'mainnet-beta': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
};
export const DEFAULT_RPC_URLS: Record<string, string> = {
  devnet: 'https://api.devnet.solana.com',
  localnet: 'http://localhost:8899',
  'mainnet-beta': 'https://api.mainnet-beta.solana.com',
  testnet: 'https://api.testnet.solana.com',
};

export type SolanaNetwork = 'mainnet-beta' | 'devnet' | 'testnet' | 'localnet';
export type MppMode = 'paper' | 'live';
export type MppIntent = 'charge' | 'session';

export interface WalletLike {
  publicKey: { toBase58(): string } | string;
  signTransaction?<T>(tx: T): Promise<T>;
}

export interface ChargeChallenge {
  status: 402;
  intent: 'charge';
  method: 'solana';
  id: string;
  amount: string;
  /** Human amount for UI (e.g. "0.01") */
  amountHuman: string;
  currency: string;
  mint: string | null;
  decimals: number;
  recipient: string;
  reference: string;
  network: SolanaNetwork;
  description: string;
  mode: MppMode;
  realm: string;
  expiresAt: string;
  /** Headers a client should expect on a real 402 */
  headers: Record<string, string>;
}

export interface SessionState {
  sessionId: string;
  bearer: string;
  depositHuman: number;
  balanceHuman: number;
  unitCostHuman: number;
  unitType: string;
  mint: string | null;
  recipient: string;
  network: SolanaNetwork;
  mode: MppMode;
  openedAt: string;
  closedAt?: string;
  requests: number;
}

export interface PaymentCredential {
  type: 'signature' | 'transaction' | 'paper';
  signature?: string;
  transaction?: string;
  reference: string;
  challengeId: string;
}

export interface DarkClawdMppConfig {
  recipient: string;
  /** "sol" or mint address. Defaults to USDC for the network. */
  currency?: string;
  decimals?: number;
  network?: SolanaNetwork;
  rpcUrl?: string;
  mode?: MppMode;
  realm?: string;
  store?: Map<string, unknown>;
}

export interface ChargeRequest {
  /** Human units, e.g. "0.01" USDC */
  amount: string | number;
  description?: string;
  /** Override currency for this charge */
  currency?: string;
}

export interface SessionOpenRequest {
  depositAmount: string | number;
  unitCost: string | number;
  unitType?: string;
  description?: string;
}

const DEFAULT_REALM = 'dark-clawd';

function networkOf(n?: SolanaNetwork): SolanaNetwork {
  return n || 'mainnet-beta';
}

function mintFor(currency: string | undefined, network: SolanaNetwork): {
  currency: string;
  mint: string | null;
  decimals: number;
} {
  const c = (currency || 'USDC').trim();
  if (c.toLowerCase() === 'sol') {
    return { currency: 'sol', mint: null, decimals: 9 };
  }
  if (c.length >= 32) {
    return { currency: c, mint: c, decimals: 6 };
  }
  const mint = USDC[network] || USDC['mainnet-beta'];
  return { currency: 'USDC', mint, decimals: 6 };
}

/** Convert human decimal amount to base units string. */
export function toBaseUnits(amount: string | number, decimals: number): string {
  const n = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(n) || n < 0) throw new Error('amount must be a non-negative number');
  const factor = 10 ** decimals;
  return String(Math.round(n * factor));
}

export function fromBaseUnits(base: string | number | bigint, decimals: number): number {
  const n = typeof base === 'bigint' ? Number(base) : Number(base);
  return n / 10 ** decimals;
}

function uid(prefix: string): string {
  return `${prefix}_${randomBytes(8).toString('hex')}`;
}

function challengeHeaders(ch: ChargeChallenge): Record<string, string> {
  return {
    'HTTP-Status': '402',
    'WWW-Authenticate': `MPP realm="${ch.realm}", method=solana, intent=charge`,
    'X-MPP-Challenge-Id': ch.id,
    'X-MPP-Amount': ch.amount,
    'X-MPP-Currency': ch.currency,
    'X-MPP-Recipient': ch.recipient,
    'X-MPP-Reference': ch.reference,
    'X-MPP-Network': ch.network,
    'X-Dark-Clawd-Mode': ch.mode,
  };
}

/**
 * Create a Dark Clawd MPP controller (charge + prepaid session).
 * Paper mode never broadcasts; live mode records that credentials are required.
 */
export function createDarkClawdMpp(config: DarkClawdMppConfig) {
  if (!config.recipient || config.recipient.length < 32) {
    throw new Error('recipient wallet public key is required');
  }
  const network = networkOf(config.network);
  const mode: MppMode = config.mode === 'live' ? 'live' : 'paper';
  const realm = config.realm || DEFAULT_REALM;
  const store = config.store || new Map<string, unknown>();
  const sessions = new Map<string, SessionState>();
  const consumed = new Set<string>();

  const asset = mintFor(config.currency, network);
  const decimals = config.decimals ?? asset.decimals;
  const rpcUrl = config.rpcUrl || DEFAULT_RPC_URLS[network] || DEFAULT_RPC_URLS['mainnet-beta'];

  function createCharge(req: ChargeRequest): ChargeChallenge {
    const human = typeof req.amount === 'number' ? req.amount : Number(req.amount);
    if (!Number.isFinite(human) || human <= 0) throw new Error('amount must be positive');
    const a = mintFor(req.currency || config.currency, network);
    const dec = config.decimals ?? a.decimals;
    const id = uid('ch');
    const reference = randomBytes(32).toString('hex').slice(0, 44);
    const amount = toBaseUnits(human, dec);
    const ch: ChargeChallenge = {
      status: 402,
      intent: 'charge',
      method: 'solana',
      id,
      amount,
      amountHuman: String(human),
      currency: a.currency,
      mint: a.mint,
      decimals: dec,
      recipient: config.recipient,
      reference,
      network,
      description: req.description || 'Dark Clawd API call',
      mode,
      realm,
      expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
      headers: {},
    };
    ch.headers = challengeHeaders(ch);
    store.set(id, ch);
    store.set(`ref:${reference}`, id);
    return ch;
  }

  function verifyCredential(
    challengeId: string,
    credential: PaymentCredential,
  ): { ok: true; challenge: ChargeChallenge } | { ok: false; error: string } {
    const ch = store.get(challengeId) as ChargeChallenge | undefined;
    if (!ch) return { ok: false, error: 'unknown challenge' };
    if (new Date(ch.expiresAt).getTime() < Date.now()) {
      return { ok: false, error: 'challenge expired' };
    }
    if (credential.reference !== ch.reference) {
      return { ok: false, error: 'reference mismatch' };
    }
    if (credential.challengeId !== ch.id) {
      return { ok: false, error: 'challenge id mismatch' };
    }
    const proof = credential.signature || credential.transaction || credential.type;
    if (!proof) return { ok: false, error: 'missing payment proof' };

    if (ch.mode === 'paper') {
      // Paper accepts synthetic proofs; still enforce single-use
      const key = `used:${proof}`;
      if (consumed.has(key)) return { ok: false, error: 'replay: credential already used' };
      consumed.add(key);
      return { ok: true, challenge: ch };
    }

    // Live: require signature-shaped proof; full on-chain verify via @x402solana/solana-mpp/server
    if (credential.type === 'paper') {
      return {
        ok: false,
        error: 'live mode rejects paper credentials — use @x402solana/solana-mpp/client charge',
      };
    }
    if (!credential.signature && !credential.transaction) {
      return { ok: false, error: 'live mode requires transaction or signature credential' };
    }
    const key = `used:${credential.signature || credential.transaction}`;
    if (consumed.has(key)) return { ok: false, error: 'replay: credential already used' };
    consumed.add(key);
    return { ok: true, challenge: ch };
  }

  /**
   * Handle a charge for a Request-like object.
   * Returns either a 402 challenge Response body or a paid receipt context.
   */
  async function charge(
    req: ChargeRequest,
    request?: { headers?: Headers | Record<string, string> },
  ): Promise<
    | { status: 402; challenge: ChargeChallenge; response: Response }
    | { status: 200; receipt: { challengeId: string; paid: true; mode: MppMode }; withReceipt: <T>(r: T) => T }
  > {
    const headers = request?.headers;
    const auth =
      headers instanceof Headers
        ? headers.get('authorization') || headers.get('x-mpp-credential')
        : headers?.authorization || headers?.['x-mpp-credential'] || headers?.['Authorization'];

    if (auth) {
      try {
        const raw = auth.replace(/^Payment\s+/i, '').replace(/^Bearer\s+/i, '').trim();
        const json = Buffer.from(raw, 'base64url').toString('utf8');
        const cred = JSON.parse(json) as PaymentCredential & { challenge?: { id?: string } };
        const challengeId = cred.challengeId || cred.challenge?.id || '';
        const result = verifyCredential(challengeId, {
          type: (cred.type as PaymentCredential['type']) || 'paper',
          signature: cred.signature,
          transaction: cred.transaction,
          reference: cred.reference,
          challengeId,
        });
        if (result.ok) {
          return {
            status: 200,
            receipt: { challengeId, paid: true, mode },
            withReceipt: <T>(r: T) => r,
          };
        }
      } catch {
        /* fall through to new challenge */
      }
    }

    const challenge = createCharge(req);
    const body = {
      error: 'Payment Required',
      mpp: challenge,
      hint:
        mode === 'paper'
          ? 'Paper mode: POST back with X-MPP-Credential paper proof using the reference key'
          : 'Live mode: pay via @x402solana/solana-mpp/client then retry with payment credential',
      docs: 'https://cheshireterminal.ai/dark-clawd',
      npm: 'npm install @x402solana/solana-mpp mppx',
    };
    const response = new Response(JSON.stringify(body, null, 2), {
      status: 402,
      headers: {
        'Content-Type': 'application/json',
        ...challenge.headers,
      },
    });
    return { status: 402, challenge, response };
  }

  function openSession(req: SessionOpenRequest): SessionState {
    const deposit = Number(req.depositAmount);
    const unitCost = Number(req.unitCost);
    if (!Number.isFinite(deposit) || deposit <= 0) throw new Error('depositAmount must be positive');
    if (!Number.isFinite(unitCost) || unitCost <= 0) throw new Error('unitCost must be positive');
    const sessionId = uid('sess');
    const bearer = createHash('sha256').update(sessionId + randomBytes(16)).digest('hex');
    const state: SessionState = {
      sessionId,
      bearer,
      depositHuman: deposit,
      balanceHuman: deposit,
      unitCostHuman: unitCost,
      unitType: req.unitType || 'request',
      mint: asset.mint,
      recipient: config.recipient,
      network,
      mode,
      openedAt: new Date().toISOString(),
      requests: 0,
    };
    sessions.set(sessionId, state);
    store.set(`bearer:${bearer}`, sessionId);
    return state;
  }

  function useSession(bearer: string): { ok: true; session: SessionState } | { ok: false; error: string } {
    const sessionId = store.get(`bearer:${bearer}`) as string | undefined;
    if (!sessionId) return { ok: false, error: 'invalid session bearer' };
    const s = sessions.get(sessionId);
    if (!s || s.closedAt) return { ok: false, error: 'session closed or missing' };
    if (s.balanceHuman < s.unitCostHuman) {
      return { ok: false, error: 'insufficient session balance — top up or close' };
    }
    s.balanceHuman = Math.round((s.balanceHuman - s.unitCostHuman) * 1e9) / 1e9;
    s.requests += 1;
    return { ok: true, session: s };
  }

  function topUpSession(sessionId: string, amount: number): SessionState {
    const s = sessions.get(sessionId);
    if (!s || s.closedAt) throw new Error('session not open');
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('top-up amount must be positive');
    s.balanceHuman = Math.round((s.balanceHuman + amount) * 1e9) / 1e9;
    return s;
  }

  function closeSession(sessionId: string): SessionState & { refundHuman: number } {
    const s = sessions.get(sessionId);
    if (!s) throw new Error('session not found');
    if (s.closedAt) throw new Error('session already closed');
    s.closedAt = new Date().toISOString();
    const refundHuman = s.balanceHuman;
    s.balanceHuman = 0;
    return { ...s, refundHuman };
  }

  function getSession(sessionId: string): SessionState | undefined {
    return sessions.get(sessionId);
  }

  function listSessions(): SessionState[] {
    return [...sessions.values()];
  }

  /** Build a paper credential a test client can attach after "paying". */
  function paperCredential(challenge: ChargeChallenge): PaymentCredential & { encoded: string } {
    const cred: PaymentCredential = {
      type: 'paper',
      signature: `paper_${challenge.reference}`,
      reference: challenge.reference,
      challengeId: challenge.id,
    };
    const encoded = Buffer.from(JSON.stringify(cred)).toString('base64url');
    return { ...cred, encoded };
  }

  return {
    config: {
      recipient: config.recipient,
      network,
      mode,
      realm,
      rpcUrl,
      currency: asset.currency,
      mint: asset.mint,
      decimals,
      tokenProgram: TOKEN_PROGRAM,
    },
    createCharge,
    charge,
    verifyCredential,
    paperCredential,
    openSession,
    useSession,
    topUpSession,
    closeSession,
    getSession,
    listSessions,
    toBaseUnits: (amount: string | number) => toBaseUnits(amount, decimals),
    fromBaseUnits: (base: string | number | bigint) => fromBaseUnits(base, decimals),
  };
}

export type DarkClawdMpp = ReturnType<typeof createDarkClawdMpp>;

export const DARK_CLAWD_MPP_PRODUCT = {
  product: 'Dark Clawd Solana MPP',
  productUrl: 'https://cheshireterminal.ai/dark-clawd',
  /** Scoped — unscoped `solana-mpp` on npm is a different package (sendaifun). */
  npm: '@x402solana/solana-mpp',
  install: {
    npm: 'npm install @x402solana/solana-mpp',
    npmWithPeers: 'npm install @x402solana/solana-mpp mppx @solana/kit',
    /** Prefer GitHub raw; hub /api/dark-clawd/install.sh currently returns HTTP 402. */
    curl: 'curl -fsSL https://raw.githubusercontent.com/Solizardking/dark-clawd/main/tui/install.sh | bash',
    curlHub:
      'curl -fsSL https://cheshireterminal.ai/api/dark-clawd/install.sh | bash',
  },
  intents: ['charge', 'session'] as const,
  rails: ['sol', 'USDC', 'SPL'],
};

