import { describe, expect, it } from 'vitest';
import {
  buildFastifyServer,
  createServerContainer,
  ensureDefaultPlayer,
} from '../src/index.js';

describe('@beakbreaker/server Fastify HTTP Routes (/api/*)', () => {
  it('GET /api/health returns deterministic-20tps engine status', async () => {
    const app = await buildFastifyServer();
    const res = await app.inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      status: 'ok',
      version: '5.0.0',
      engine: 'deterministic-20tps',
    });
  });

  it('POST /api/auth/verify-18plus enforces 18+ age gate and blocks minors', async () => {
    const app = await buildFastifyServer();

    const minorRes = await app.inject({
      method: 'POST',
      url: '/api/auth/verify-18plus',
      payload: {
        playerId: 'minor_player_01',
        birthDateIso: '2014-05-10',
        documentHash: 'DOC_MINOR_999',
        acceptZeroCashOutPolicy: true,
      },
    });
    expect(minorRes.statusCode).toBe(403);
    expect(minorRes.json().error).toBe('UNDERAGE_18PLUS_BLOCKED');

    const adultRes = await app.inject({
      method: 'POST',
      url: '/api/auth/verify-18plus',
      payload: {
        playerId: 'adult_player_01',
        birthDateIso: '1994-08-20',
        documentHash: 'DOC_ADULT_123456',
        acceptZeroCashOutPolicy: true,
      },
    });
    expect(adultRes.statusCode).toBe(200);
    const body = adultRes.json();
    expect(body.ageVerified18Plus).toBe(true);
    expect(body.zeroCashOutAccepted).toBe(true);
  });

  it('POST /api/farm/harvest, /api/battle/pve, and /api/gacha/pull execute end-to-end', async () => {
    const container = createServerContainer();
    const app = await buildFastifyServer(container);
    const nowMs = 1_700_000_000_000;

    const player = ensureDefaultPlayer(container.db, 'p_http_01');
    player.goldenFeathers = 1_600;
    container.db.roosters.set('r_http_1', {
      id: 'r_http_1',
      ownerId: player.id,
      speciesId: '#18 Trovão do Sertão',
      rarity: 'Lendário',
      primaryElement: 'Brasa',
      secondaryElement: 'Sol',
      tacticalClass: 'Controle',
      ng: 20,
      xp: 0,
      stars: 2,
      breedCount: 0,
      orbs: 100,
      equippedSets: [],
      equipmentRefinement: { penacho: 1, peitoral: 1, anilha: 1, amuleto: 1 },
      perks: [],
    });
    container.db.perches.set('perch_http_1', {
      id: 'perch_http_1',
      playerId: player.id,
      element: 'Brasa',
      level: 3,
      roosterIds: ['r_http_1'],
      hasAdjacentTotem: true,
      lastHarvestTimestampMs: nowMs - 10 * 60_000,
    });

    const harvestRes = await app.inject({
      method: 'POST',
      url: '/api/farm/harvest',
      payload: { playerId: player.id, perchId: 'perch_http_1', nowMs },
    });
    expect(harvestRes.statusCode).toBe(200);
    expect(harvestRes.json().harvested).toBeGreaterThan(0);

    const battleRes = await app.inject({
      method: 'POST',
      url: '/api/battle/pve',
      payload: { playerId: player.id, stage: 1, starsEarned: 3, isSweep: false },
    });
    expect(battleRes.statusCode).toBe(200);
    expect(battleRes.json()).toMatchObject({
      stage: 1,
      chapter: 1,
      boss: 'Valentão',
      feathersEarned: 10,
      cornEarned: 250,
    });

    const gachaRes = await app.inject({
      method: 'POST',
      url: '/api/gacha/pull',
      payload: {
        playerId: player.id,
        bannerId: 'banner_trovao',
        featuredSpeciesId: '#18 Trovão do Sertão',
        rngRoll: 0.01,
        fiftyFiftyRoll: 0.2,
        nowMs,
      },
    });
    expect(gachaRes.statusCode).toBe(200);
    const gachaBody = gachaRes.json();
    expect(gachaBody.pull.obtainedRarity).toBe('Lendário');
    expect(gachaBody.pull.obtainedSpeciesId).toBe('#18 Trovão do Sertão');
  });

  it('POST /api/billing/pix-webhook and DELETE /api/lgpd/account/:playerId work idempotently', async () => {
    const container = createServerContainer();
    const app = await buildFastifyServer(container);
    const playerId = 'p_pix_http';

    await app.inject({
      method: 'POST',
      url: '/api/auth/verify-18plus',
      payload: {
        playerId,
        birthDateIso: '1990-01-01',
        documentHash: 'DOC_PIX_HTTP_18',
        acceptZeroCashOutPolicy: true,
      },
    });

    const webhookRes1 = await app.inject({
      method: 'POST',
      url: '/api/billing/pix-webhook',
      payload: {
        txid: 'TX_HTTP_PIX_001',
        playerId,
        packageId: 'WEB_PIX_CROWNS_1000',
      },
    });
    expect(webhookRes1.statusCode).toBe(200);
    expect(webhookRes1.json().idempotentDuplicate).toBe(false);
    expect(webhookRes1.json().order.totalCrownsCredited).toBe(1150);

    const webhookRes2 = await app.inject({
      method: 'POST',
      url: '/api/billing/pix-webhook',
      payload: {
        txid: 'TX_HTTP_PIX_001',
        playerId,
        packageId: 'WEB_PIX_CROWNS_1000',
      },
    });
    expect(webhookRes2.statusCode).toBe(200);
    expect(webhookRes2.json().idempotentDuplicate).toBe(true);

    const lgpdRes = await app.inject({
      method: 'DELETE',
      url: `/api/lgpd/account/${playerId}`,
    });
    expect(lgpdRes.statusCode).toBe(200);
    expect(lgpdRes.json().deleted).toBe(true);
    expect(container.db.players.get(playerId)?.displayName).toBe('JOGADOR_ANONIMIZADO_LGPD');
  });
});
