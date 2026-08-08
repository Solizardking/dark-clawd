# Solana MPP (`@x402solana/solana-mpp`)

**Solana Payment Integration for the Machine Payments Protocol (HTTP 402)**  
SPL token payments · high-throughput · low-cost · on-chain verification  

Used by **Dark Clawd** automation kit at [cheshireterminal.ai/dark-clawd](https://cheshireterminal.ai/dark-clawd).

> **Name collision:** Unscoped [`solana-mpp`](https://www.npmjs.com/package/solana-mpp) on npm is a **different** package (sendaifun / mppx `^0.3`).  
> Install **this** package as **`@x402solana/solana-mpp`**.  
> Do **not** run `npm install solana-mpp` — that pulls 0.1.x and conflicts with modern mppx (`ERESOLVE`).

```
# Correct (scoped)
npm install @x402solana/solana-mpp
# optional peers for full on-chain charge methods:
npm install mppx @solana/kit

# From this monorepo (local):
#   cd mpp && npm install && npm run build
#   npm install ./mpp   # from repo root
```

Local tarballs: `solana-mpp-0.5.0.tgz` (charge build input), `solana-mpp-0.2.0.tgz` (session-era reference under `vendor/`).

---

## Why Solana for machine payments?

| Feature | Detail |
| --- | --- |
| ~400ms | Block times with fast finality — settles before HTTP timeouts |
| ~$0.00025 | Average fee — viable for micropayments |
| Any SPL | USDC, USDT, custom mints — not locked to one currency |
| DeFi | Deep Solana liquidity + wallet infrastructure |
| On-chain | Reference keys verify payment without external processors |

---

## How payment works

```
Client                              Server
  │                                    │
  ├── GET /api/resource ──────────────►│
  │◄── 402 Payment Required ──────────┤
  │    (amount, recipient, mint,       │
  │     reference key)                 │
  │  Signs & submits SPL transfer      │
  ├── GET /api/resource ──────────────►│
  │    + payment credential            │
  │    Server verifies on-chain        │
  │◄── 200 OK + receipt ──────────────┤
```

### Charge (one-time)
Pay-per-call APIs, one-time data, single inference.

### Session (prepaid)
Deposit once → metered requests → top-up → close with refund.

---

## Dark Clawd quick start (paper MPP)

Works without on-chain keys or mppx — perfect for sandbox + CI:

```ts
import { createDarkClawdMpp } from '@x402solana/solana-mpp/dark-clawd'

const mpp = createDarkClawdMpp({
  recipient: 'YOUR_WALLET_BASE58',
  network: 'devnet',
  mode: 'paper',        // 'live' requires real signatures
  currency: 'USDC',
})

// Issue 402
const first = await mpp.charge({ amount: '0.01', description: 'trade plan' })
if (first.status === 402) {
  const paper = mpp.paperCredential(first.challenge)
  // Client "pays" then retries:
  const paid = await mpp.charge(
    { amount: '0.01' },
    { headers: { authorization: `Payment ${paper.encoded}` } },
  )
  // paid.status === 200
}

// Prepaid session
const session = mpp.openSession({ depositAmount: 1, unitCost: 0.01 })
mpp.useSession(session.bearer)
mpp.closeSession(session.sessionId)
```

### Full charge methods (mppx + @solana/kit)

When peers are installed:

```ts
import { Mppx, Store, solana } from '@x402solana/solana-mpp/server'

const mppx = Mppx.create({
  methods: [
    solana.charge({
      recipient: 'YOUR_WALLET_BASE58',
      currency: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC mainnet
      decimals: 6,
      network: 'mainnet-beta',
      store: Store.memory(),
      html: true,
    }),
  ],
})

async function handler(request: Request): Promise<Response> {
  const result = await mppx.charge({
    amount: '10000', // base units (0.01 USDC @ 6 decimals)
    description: 'Dark Clawd API call',
  })(request)

  if (result.status === 402) return result.challenge
  return result.withReceipt(Response.json({ ok: true }))
}
```

Client auto-pay:

```ts
import { Mppx, solana } from '@x402solana/solana-mpp/client'

const mppx = Mppx.create({
  methods: [solana.charge({ /* wallet / signer */ })],
})

const response = await mppx.fetch('https://api.example.com/api/data')
```

---

## Dark Clawd endpoints

### Local sandbox (`dark-clawd sandbox`)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/mpp` | MPP config + endpoint map |
| POST | `/api/mpp/charge` | Charge → 402 or receipt |
| POST | `/api/mpp/session/open` | Open prepaid session |
| POST | `/api/mpp/session/use` | Meter one unit |
| POST | `/api/mpp/session/close` | Close + refund remaining |
| POST | `/api/mpp/trade/plan` | **Paid** trade plan (402 until paid) |

### Cheshire Terminal

| Method | Path |
| --- | --- |
| GET | `https://cheshireterminal.ai/api/dark-clawd/mpp` |
| POST | `https://cheshireterminal.ai/api/dark-clawd/mpp/charge` |
| POST | `https://cheshireterminal.ai/api/dark-clawd/mpp/trade/plan` |

One-shot Dark Clawd CLI install:

```bash
# Preferred (GitHub raw — free)
curl -fsSL https://raw.githubusercontent.com/Solizardking/dark-clawd/main/tui/install.sh | bash
# or
npm install -g @x402solana/dark-clawd

# Hub proxy may return HTTP 402 until the route is free:
# curl -fsSL https://cheshireterminal.ai/api/dark-clawd/install.sh | bash
```

---

## Package layout

```
mpp/
├── dist/                 # charge (from vendored 0.5.0) + dark-clawd build
├── scripts/
│   └── unpack-charge.mjs # restores server/client/root dist from .tgz
├── src/
│   ├── constants.ts
│   ├── Methods.ts
│   ├── index.ts
│   └── dark-clawd/       # Dark Clawd charge + session (paper/live)
├── bin/info.mjs
├── solana-mpp-0.5.0.tgz  # vendored charge release (build input)
├── solana-mpp-0.2.0.tgz  # session-era reference
└── vendor/session-0.2/   # extracted 0.2 session types (reference)
```

```bash
cd mpp && npm install && npm test && npm run build
```

### Exports

| Import | Contents | Peers |
| --- | --- | --- |
| `@x402solana/solana-mpp` | Shared charge schema helpers | **mppx** at runtime |
| `@x402solana/solana-mpp/server` | `solana.charge`, `Mppx`, `Store` | **mppx** + **@solana/kit** |
| `@x402solana/solana-mpp/client` | Client `solana.charge`, `Mppx` | **mppx** |
| `@x402solana/solana-mpp/dark-clawd` | `createDarkClawdMpp`, sessions, paper credentials | **none** (paper CI path) |

---

## Verification model

1. **Reference key** — unique id in the challenge; client includes it in the transfer context  
2. **Credential** — signature or serialized transaction  
3. **Server verify** — amount, mint, recipient ATA, success status  
4. **Replay protection** — consumed credentials rejected  

Paper mode simulates 1–3 for local sandbox without broadcasting.

---

## Networks

| Network | RPC |
| --- | --- |
| mainnet-beta | `https://api.mainnet-beta.solana.com` |
| devnet | `https://api.devnet.solana.com` |
| testnet | `https://api.testnet.solana.com` |
| localnet | `http://localhost:8899` |

---

## Env (Dark Clawd)

```bash
MPP_RECIPIENT=YourWalletBase58
MPP_MODE=paper          # or live
MPP_CURRENCY=USDC
SOLANA_NETWORK=mainnet-beta
SOLANA_RPC_URL=https://…
```

---

## License

ISC — see `LICENSE`.

Upstream Solana MPP methods: Solana Foundation [mpp-sdk](https://github.com/solana-foundation/mpp-sdk) / npm `@solana/mpp`.  
Dark Clawd integration: OpenClawd / Cheshire Terminal.
