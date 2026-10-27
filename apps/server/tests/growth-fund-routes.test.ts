import { describe, expect, it } from 'vitest';
import {
  buildFastifyServer,
  createServerContainer,
  ensureDefaultPlayer,
} from '../src/index.js';

describe('Growth Fund & Social UF Fastify Routes (/api/store/growth-fund & /api/social/*)', () => {
  it('GET /api/store/growth-fund retorna progresso e valida sedeLevel do jogador', async () => {
    const container = createServerContainer();
    const app = await buildFastifyServer(container);

    const badRes = await app.inject({ method: 'GET', url: '/api/store/growth-fund' });
    expect(badRes.statusCode).toBe(400);

    const player = ensureDefaultPlayer(container.db, 'p_growth_1');
    player.sedeLevel = 3;

    const res = await app.inject({ method: 'GET', url: '/api/store/growth-fund?playerId=p_growth_1' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.currentSedeLevel).toBe(3);
    expect(body.isPremiumUnlocked).toBe(false);
    expect(body.tiers).toHaveLength(12);
    expect(body.tiers[0].isUnlocked).toBe(true);
    expect(body.tiers[2].isUnlocked).toBe(true);
    expect(body.tiers[3].isUnlocked).toBe(false);
  });

  it('POST /api/store/growth-fund/claim resgata com idempotência e bloqueia sede insuficiente', async () => {
    const container = createServerContainer();
    const app = await buildFastifyServer(container);
    const player = ensureDefaultPlayer(container.db, 'p_growth_claim');
    player.sedeLevel = 2;
    const initialCorn = player.corn;
    const initialFeathers = player.goldenFeathers;

    const unreachedRes = await app.inject({
      method: 'POST', url: '/api/store/growth-fund/claim',
      payload: { playerId: 'p_growth_claim', sedeLevel: 5 },
    });
    expect(unreachedRes.statusCode).toBe(400);
    expect(unreachedRes.json().error).toBe('SEDE_LEVEL_NOT_REACHED');

    const res1 = await app.inject({
      method: 'POST', url: '/api/store/growth-fund/claim',
      payload: { playerId: 'p_growth_claim', sedeLevel: 1, track: 'free' },
    });
    expect(res1.statusCode).toBe(200);
    expect(res1.json().claimedFree).toBe(true);
    expect(player.corn).toBe(initialCorn + 10_000);
    expect(player.goldenFeathers).toBe(initialFeathers + 50);

    const resIdempotent = await app.inject({
      method: 'POST', url: '/api/store/growth-fund/claim',
      payload: { playerId: 'p_growth_claim', sedeLevel: 1, track: 'free' },
    });
    expect(resIdempotent.statusCode).toBe(200);
    expect(resIdempotent.json().alreadyClaimedFree).toBe(true);
    expect(player.corn).toBe(initialCorn + 10_000);

    const lockedPremRes = await app.inject({
      method: 'POST', url: '/api/store/growth-fund/claim',
      payload: { playerId: 'p_growth_claim', sedeLevel: 1, track: 'premium' },
    });
    expect(lockedPremRes.statusCode).toBe(400);
    expect(lockedPremRes.json().error).toBe('PREMIUM_NOT_UNLOCKED');
  });

  it('POST /api/store/growth-fund/unlock-premium ativa a faixa Coronel e libera resgate premium', async () => {
    const container = createServerContainer();
    const app = await buildFastifyServer(container);
    const player = ensureDefaultPlayer(container.db, 'p_growth_prem');
    player.sedeLevel = 4;

    const unlockRes = await app.inject({
      method: 'POST', url: '/api/store/growth-fund/unlock-premium',
      payload: { playerId: 'p_growth_prem' },
    });
    expect(unlockRes.statusCode).toBe(200);
    expect(unlockRes.json().isPremiumUnlocked).toBe(true);
    expect(player.totalSpentBrl).toBe(39.9);

    const initialCrowns = player.crowns;
    const initialOrbs = player.wildOrbs;
    const initialFeathers = player.goldenFeathers;

    const claimPremRes = await app.inject({
      method: 'POST', url: '/api/store/growth-fund/claim',
      payload: { playerId: 'p_growth_prem', sedeLevel: 1, track: 'premium' },
    });
    expect(claimPremRes.statusCode).toBe(200);
    expect(claimPremRes.json().claimedPremium).toBe(true);
    expect(player.goldenFeathers).toBe(initialFeathers + 250);
    expect(player.crowns).toBe(initialCrowns + 20);
    expect(player.wildOrbs).toBe(initialOrbs + 5);

    const repeatUnlock = await app.inject({
      method: 'POST', url: '/api/store/growth-fund/unlock-premium',
      payload: { playerId: 'p_growth_prem' },
    });
    expect(repeatUnlock.statusCode).toBe(200);
    expect(repeatUnlock.json().alreadyUnlocked).toBe(true);
  });

  it('GET /api/social/uf-ranking retorna os 27 estados e lista os líderes regionais', async () => {
    const container = createServerContainer();
    const app = await buildFastifyServer(container);
    const p1 = ensureDefaultPlayer(container.db, 'p_pe_lead');
    p1.uf = 'PE';
    p1.trophies = 3200;

    const res = await app.inject({ method: 'GET', url: '/api/social/uf-ranking' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.states).toHaveLength(27);
    expect(body.states[0].rank).toBe(1);

    const resPe = await app.inject({ method: 'GET', url: '/api/social/uf-ranking?uf=PE' });
    expect(resPe.statusCode).toBe(200);
    expect(resPe.json().topPlayersByUf.PE).toBeDefined();
    expect(resPe.json().topPlayersByUf.PE.length).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/social/profile/:userId exibe vitrine de 3 galos e prestígio de fazenda', async () => {
    const container = createServerContainer();
    const app = await buildFastifyServer(container);
    const player = ensureDefaultPlayer(container.db, 'p_social_profile');
    player.displayName = 'Coronel Bento';
    player.trophies = 2900;
    player.sedeLevel = 9;

    const res = await app.inject({ method: 'GET', url: '/api/social/profile/p_social_profile' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.profile.userId).toBe('p_social_profile');
    expect(body.profile.title).toBe('Supremo Sertão');
    expect(body.profile.showcaseRoosters).toHaveLength(3);
    expect(body.profile.totalTrioPower).toBeGreaterThan(0);
    expect(body.profile.decorationPrestige).toBe(9 * 120 + 80);
  });

  it('POST /api/social/visit-farm/:targetId concede bônus diário e previne auto-visita', async () => {
    const container = createServerContainer();
    const app = await buildFastifyServer(container);
    const visitor = ensureDefaultPlayer(container.db, 'p_visitor');
    ensureDefaultPlayer(container.db, 'p_target');
    const initCorn = visitor.corn;
    const initFeathers = visitor.goldenFeathers;

    const selfRes = await app.inject({
      method: 'POST', url: '/api/social/visit-farm/p_visitor',
      payload: { visitorId: 'p_visitor' },
    });
    expect(selfRes.statusCode).toBe(400);
    expect(selfRes.json().error).toBe('CANNOT_VISIT_SELF');

    const visitRes = await app.inject({
      method: 'POST', url: '/api/social/visit-farm/p_target',
      payload: { visitorId: 'p_visitor' },
    });
    expect(visitRes.statusCode).toBe(200);
    expect(visitRes.json().bonusClaimed).toBe(true);
    expect(visitor.corn).toBe(initCorn + 5_000);
    expect(visitor.goldenFeathers).toBe(initFeathers + 20);

    const repeatRes = await app.inject({
      method: 'POST', url: '/api/social/visit-farm/p_target',
      payload: { visitorId: 'p_visitor' },
    });
    expect(repeatRes.statusCode).toBe(200);
    expect(repeatRes.json().bonusClaimed).toBe(false);
    expect(visitor.corn).toBe(initCorn + 5_000);
  });
});
