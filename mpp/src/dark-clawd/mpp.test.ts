import { describe, expect, test } from 'bun:test';
import {
  createDarkClawdMpp,
  toBaseUnits,
  fromBaseUnits,
  DARK_CLAWD_MPP_PRODUCT,
} from './index.ts';

const RECIPIENT = 'DarkClawdTreasury1111111111111111111111111';
// use a plausible base58 length string
const WALLET = 'So11111111111111111111111111111111111111112';

describe('solana-mpp dark-clawd', () => {
  test('base unit conversion', () => {
    expect(toBaseUnits('0.01', 6)).toBe('10000');
    expect(toBaseUnits(1, 9)).toBe('1000000000');
    expect(fromBaseUnits('10000', 6)).toBe(0.01);
  });

  test('charge issues 402 challenge with reference + recipient', async () => {
    const mpp = createDarkClawdMpp({
      recipient: WALLET,
      network: 'devnet',
      mode: 'paper',
      currency: 'USDC',
    });
    const result = await mpp.charge({ amount: '0.01', description: 'trade plan' });
    expect(result.status).toBe(402);
    if (result.status !== 402) throw new Error('expected 402');
    expect(result.challenge.amount).toBe('10000');
    expect(result.challenge.recipient).toBe(WALLET);
    expect(result.challenge.reference.length).toBeGreaterThan(8);
    expect(result.challenge.headers['X-MPP-Reference']).toBe(result.challenge.reference);
    expect(result.response.status).toBe(402);
  });

  test('paper credential unlocks paid path and blocks replay', async () => {
    const mpp = createDarkClawdMpp({ recipient: WALLET, mode: 'paper', network: 'devnet' });
    const first = await mpp.charge({ amount: 0.05 });
    if (first.status !== 402) throw new Error('expected 402');
    const paper = mpp.paperCredential(first.challenge);

    // Direct verify first (single-use)
    const v = mpp.verifyCredential(first.challenge.id, paper);
    expect(v.ok).toBe(true);

    const replay = mpp.verifyCredential(first.challenge.id, paper);
    expect(replay.ok).toBe(false);
    if (replay.ok) throw new Error('expected fail');
    expect(replay.error).toMatch(/replay/i);

    // Fresh challenge + Payment header path
    const second = await mpp.charge({ amount: 0.02 });
    if (second.status !== 402) throw new Error('expected 402');
    const paper2 = mpp.paperCredential(second.challenge);
    const paid = await mpp.charge(
      { amount: 0.02 },
      { headers: { authorization: `Payment ${paper2.encoded}` } },
    );
    expect(paid.status).toBe(200);
    if (paid.status !== 200) throw new Error('expected paid');
    expect(paid.receipt.paid).toBe(true);
  });

  test('session open → use → top-up → close with refund', () => {
    const mpp = createDarkClawdMpp({ recipient: WALLET, mode: 'paper' });
    const s = mpp.openSession({ depositAmount: 1, unitCost: 0.25, unitType: 'request' });
    expect(s.balanceHuman).toBe(1);
    expect(s.bearer.length).toBeGreaterThan(16);

    const u1 = mpp.useSession(s.bearer);
    expect(u1.ok).toBe(true);
    if (!u1.ok) throw new Error('use failed');
    expect(u1.session.balanceHuman).toBe(0.75);
    expect(u1.session.requests).toBe(1);

    mpp.useSession(s.bearer);
    mpp.useSession(s.bearer);
    const u4 = mpp.useSession(s.bearer);
    expect(u4.ok).toBe(true);
    if (!u4.ok) throw new Error('u4');
    expect(u4.session.balanceHuman).toBe(0);

    const empty = mpp.useSession(s.bearer);
    expect(empty.ok).toBe(false);

    mpp.topUpSession(s.sessionId, 0.5);
    const afterTop = mpp.useSession(s.bearer);
    expect(afterTop.ok).toBe(true);

    const closed = mpp.closeSession(s.sessionId);
    expect(closed.closedAt).toBeTruthy();
    expect(closed.refundHuman).toBeGreaterThanOrEqual(0);
  });

  test('product metadata points at dark-clawd hub', () => {
    expect(DARK_CLAWD_MPP_PRODUCT.productUrl).toContain('dark-clawd');
    expect(DARK_CLAWD_MPP_PRODUCT.npm).toBe('solana-mpp');
    expect(DARK_CLAWD_MPP_PRODUCT.intents).toContain('charge');
    expect(DARK_CLAWD_MPP_PRODUCT.intents).toContain('session');
  });

  test('live mode rejects paper credentials', () => {
    const mpp = createDarkClawdMpp({ recipient: WALLET, mode: 'live' });
    const ch = mpp.createCharge({ amount: '0.1' });
    expect(ch.mode).toBe('live');
    const paper = mpp.paperCredential(ch);
    const v = mpp.verifyCredential(ch.id, paper);
    expect(v.ok).toBe(false);
  });
});
