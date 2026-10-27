import Fastify from 'fastify';
import { describe, expect, it } from 'vitest';
import { createServerContainer, ensureDefaultPlayer } from '../src/index.js';
import { registerStoreRoutes, setPlayerVault } from '../src/routes/storeRoutes.js';

describe('Fastify Commercial API & Monetization Routes (/api/store/*)', () => {
  it('POST /api/store/golden-vault/accumulate acumula coroas e respeita teto de 500', async () => {
    const container = createServerContainer();
    const app = Fastify();
    await registerStoreRoutes(app, container);

    const badRes = await app.inject({ method: 'POST', url: '/api/store/golden-vault/accumulate', payload: { won: true } });
    expect(badRes.statusCode).toBe(400);

    const res1 = await app.inject({
      method: 'POST', url: '/api/store/golden-vault/accumulate',
      payload: { playerId: 'p_vault_test', won: true },
    });
    expect(res1.statusCode).toBe(200);
    expect(res1.json().accumulated).toBe(10);
    expect(res1.json().isFull).toBe(false);

    const res2 = await app.inject({
      method: 'POST', url: '/api/store/golden-vault/accumulate',
      payload: { playerId: 'p_vault_test', won: false },
    });
    expect(res2.statusCode).toBe(200);
    expect(res2.json().accumulated).toBe(10);

    const player = ensureDefaultPlayer(container.db, 'p_vault_test');
    setPlayerVault(player.id, player, 495);

    const resCap = await app.inject({
      method: 'POST', url: '/api/store/golden-vault/accumulate',
      payload: { playerId: 'p_vault_test', won: true },
    });
    expect(resCap.statusCode).toBe(200);
    expect(resCap.json().accumulated).toBe(500);
    expect(resCap.json().isFull).toBe(true);
  });

  it('POST /api/store/golden-vault/smash exige 500 coroas e pagamento confirmado', async () => {
    const container = createServerContainer();
    const app = Fastify();
    await registerStoreRoutes(app, container);
    const player = ensureDefaultPlayer(container.db, 'p_smash_test');

    setPlayerVault(player.id, player, 300);
    const resNotFull = await app.inject({
      method: 'POST', url: '/api/store/golden-vault/smash',
      payload: { playerId: player.id, paymentConfirmed: true },
    });
    expect(resNotFull.statusCode).toBe(400);
    expect(resNotFull.json().error).toBe('VAULT_NOT_FULL');

    setPlayerVault(player.id, player, 500);
    const resNoPay = await app.inject({
      method: 'POST', url: '/api/store/golden-vault/smash',
      payload: { playerId: player.id, paymentConfirmed: false },
    });
    expect(resNoPay.statusCode).toBe(400);
    expect(resNoPay.json().error).toBe('PAYMENT_NOT_CONFIRMED');

    const crownsBefore = player.crowns;
    const resSmash = await app.inject({
      method: 'POST', url: '/api/store/golden-vault/smash',
      payload: { playerId: player.id, paymentConfirmed: true },
    });
    expect(resSmash.statusCode).toBe(200);
    expect(resSmash.json().creditedCrowns).toBe(500);
    expect(player.crowns).toBe(crownsBefore + 500);

    const resEmpty = await app.inject({
      method: 'POST', url: '/api/store/golden-vault/smash',
      payload: { playerId: player.id, paymentConfirmed: true },
    });
    expect(resEmpty.statusCode).toBe(400);
    expect(resEmpty.json().error).toBe('VAULT_NOT_FULL');
  });

  it('POST /api/store/farmer-card/claim-daily entrega 100 penas dentro da janela de 24h', async () => {
    const container = createServerContainer();
    const app = Fastify();
    await registerStoreRoutes(app, container);
    const player = ensureDefaultPlayer(container.db, 'p_farmer_test');
    const nowMs = 1_700_000_000_000;

    player.farmerCardActiveUntil = nowMs - 1_000;
    const resInactive = await app.inject({
      method: 'POST', url: '/api/store/farmer-card/claim-daily',
      payload: { playerId: player.id, nowMs },
    });
    expect(resInactive.statusCode).toBe(400);
    expect(resInactive.json().error).toBe('FARMER_CARD_NOT_ACTIVE');

    player.farmerCardActiveUntil = nowMs + 30 * 86_400_000;
    const initialFeathers = player.goldenFeathers;

    const resClaim1 = await app.inject({
      method: 'POST', url: '/api/store/farmer-card/claim-daily',
      payload: { playerId: player.id, nowMs },
    });
    expect(resClaim1.statusCode).toBe(200);
    expect(resClaim1.json().claimedFeathers).toBe(100);
    expect(player.goldenFeathers).toBe(initialFeathers + 100);

    const resCooldown = await app.inject({
      method: 'POST', url: '/api/store/farmer-card/claim-daily',
      payload: { playerId: player.id, nowMs: nowMs + 2 * 3600_000 },
    });
    expect(resCooldown.statusCode).toBe(400);
    expect(resCooldown.json().error).toBe('DAILY_REWARD_ALREADY_CLAIMED');

    const resClaim2 = await app.inject({
      method: 'POST', url: '/api/store/farmer-card/claim-daily',
      payload: { playerId: player.id, nowMs: nowMs + 25 * 3600_000 },
    });
    expect(resClaim2.statusCode).toBe(200);
    expect(player.goldenFeathers).toBe(initialFeathers + 200);
  });

  it('GET /api/store/vip-status/:playerId retorna nível VIP e meta do próximo tier', async () => {
    const container = createServerContainer();
    const app = Fastify();
    await registerStoreRoutes(app, container);
    const player = ensureDefaultPlayer(container.db, 'p_vip_test');

    const res0 = await app.inject({ method: 'GET', url: `/api/store/vip-status/${player.id}` });
    expect(res0.statusCode).toBe(200);
    expect(res0.json()).toEqual({ vipLevel: 0, totalSpentBrl: 0, vipPoints: 0, nextTierPoints: 15 });

    player.totalSpentBrl = 120;
    const resTier = await app.inject({ method: 'GET', url: `/api/store/vip-status/${player.id}` });
    expect(resTier.statusCode).toBe(200);
    expect(resTier.json()).toEqual({ vipLevel: 3, totalSpentBrl: 120, vipPoints: 120, nextTierPoints: 200 });

    player.totalSpentBrl = 5_000;
    const resMax = await app.inject({ method: 'GET', url: `/api/store/vip-status/${player.id}` });
    expect(resMax.statusCode).toBe(200);
    expect(resMax.json()).toEqual({ vipLevel: 14, totalSpentBrl: 5_000, vipPoints: 5_000, nextTierPoints: 5_000 });
  });

  it('GET /api/store/flash-offer/:playerId avalia elegibilidade por pity e penas', async () => {
    const container = createServerContainer();
    const app = Fastify();
    await registerStoreRoutes(app, container);
    const player = ensureDefaultPlayer(container.db, 'p_flash_test');

    player.pityCounter = 30;
    player.goldenFeathers = 50;
    const resLowPity = await app.inject({ method: 'GET', url: `/api/store/flash-offer/${player.id}` });
    expect(resLowPity.json().eligible).toBe(false);

    player.pityCounter = 60;
    player.goldenFeathers = 500;
    const resHighFeathers = await app.inject({ method: 'GET', url: `/api/store/flash-offer/${player.id}` });
    expect(resHighFeathers.json().eligible).toBe(false);

    player.goldenFeathers = 100;
    const resEligible = await app.inject({ method: 'GET', url: `/api/store/flash-offer/${player.id}` });
    expect(resEligible.statusCode).toBe(200);
    expect(resEligible.json().eligible).toBe(true);
    expect(resEligible.json().offer).toMatchObject({ id: 'FLASH_PITY_OFFER', pulls: 20, priceBrl: 34.9 });

    player.pityCounter = 70;
    const resPastPity = await app.inject({ method: 'GET', url: `/api/store/flash-offer/${player.id}` });
    expect(resPastPity.json().eligible).toBe(false);
  });
});
