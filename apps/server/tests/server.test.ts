import { describe, expect, it } from 'vitest';
import { OfficialPixWebStore } from '../../web-store/src/index.js';
import {
  buildServer,
  COLOSSO_RAID_VIGOR_BY_DIFFICULTY,
  REVENGE_PAIR_TTL_SECONDS,
  type Clan,
  type FarmDefenseState,
  type Player,
  type RoosterInstance,
} from '../src/index.js';

function createMockPlayer(id: string, overrides: Partial<Player> = {}): Player {
  return {
    id, displayName: `Jogador_${id}`, uf: 'PE', accountLevel: 30, sedeLevel: 8,
    corn: 100_000, barnProtectedCorn: 20_000, goldenFeathers: 1_600, crowns: 0,
    trophies: 3_000, stamina: 60, pityCounter: 0, guaranteedFeaturedNext: false,
    wildOrbs: 500, astralEssences: 10, piggyBankFeathers: 0, farmerCardActiveUntil: 0,
    orbClubActiveUntil: 0, shieldActiveUntil: 0, vipLevel: 0, totalSpentBrl: 0,
    lastIpHash: `ip_${id}`, deviceFingerprint: `fp_${id}`, clanId: 'clan_1',
    towerProgressFloor: 0, campaignStars: {}, lapidarySlots: 1, primordialGems: {},
    lastLapidaryClaimMs: 0, towerCooldowns: {}, activeBuffs: {}, ...overrides,
  };
}

function createMockRooster(id: string, ownerId: string): RoosterInstance {
  return {
    id, ownerId, speciesId: '#18 Trovão do Sertão', rarity: 'Lendário',
    primaryElement: 'Brasa', secondaryElement: 'Sol', tacticalClass: 'Controle',
    ng: 30, xp: 0, stars: 3, breedCount: 0, orbs: 400, equippedSets: ['Brasa Viva'],
    equipmentRefinement: { penacho: 5, peitoral: 5, anilha: 5, amuleto: 5 }, perks: [],
  };
}

describe('BeakBreaker v5.0 Server, Web-Store & ECA Digital Suite', () => {
  it('1. RevengeGuard: enforces Rules A, B (72h = 259,200s TTL), C (IP/Fingerprint) & +50% Revenge Bonus', async () => {
    const ctx = await buildServer();
    const nowMs = 1_700_000_000_000;
    const attacker = createMockPlayer('p_atk', { corn: 10_000 });
    const defender = createMockPlayer('p_def', { corn: 120_000, barnProtectedCorn: 20_000 });
    ctx.db.players.set(attacker.id, attacker);
    ctx.db.players.set(defender.id, defender);

    const defenses: FarmDefenseState = {
      playerId: defender.id, cercaMandacaruLevel: 2, estilingueSabugoLevel: 2,
      espantalhoAssombradoLevel: 1, cataVentoAlertaLevel: 1, guardianTrioIds: ['r1', 'r2', 'r3'],
    };

    const cloneIpDefender = createMockPlayer('p_clone', { lastIpHash: attacker.lastIpHash });
    expect(() =>
      ctx.revengeGuard.executeTwoWaveLoot(
        attacker, cloneIpDefender, defenses,
        { wave1RuralDefensesCleared: true, wave2GuardianTrioCleared: true }, false, nowMs
      )
    ).toThrow('COLLUSION_BLOCKED');

    const lootRes = ctx.revengeGuard.executeTwoWaveLoot(
      attacker, defender, defenses,
      { wave1RuralDefensesCleared: true, wave2GuardianTrioCleared: true }, false, nowMs
    );
    expect(lootRes.stolenCorn).toBe(20_000);
    expect(defender.corn).toBe(100_000);
    expect(attacker.corn).toBe(30_000);

    const revRes = ctx.revengeGuard.executeRevenge(lootRes.log.id, defender, attacker, nowMs + 1_000);
    expect(revRes.recoveredCorn).toBe(20_000);
    expect(revRes.systemBonusCorn).toBe(10_000);
    expect(revRes.totalAwardedCorn).toBe(30_000);
    expect(defender.corn).toBe(130_000);
    expect(revRes.canCounterRevenge).toBe(false);

    expect(() =>
      ctx.revengeGuard.executeRevenge(revRes.log.id, attacker, defender, nowMs + 2_000)
    ).toThrow('COUNTER_REVENGE_FORBIDDEN_RULE_A');

    expect(revRes.ttlSeconds).toBe(REVENGE_PAIR_TTL_SECONDS);
    expect(() =>
      ctx.revengeGuard.assertAntiCollusion(attacker, defender, nowMs + 3_000)
    ).toThrow('PAIR_COOLDOWN_72H_ACTIVE');
  });

  it('2. Territory War: enforces Road Adjacency and Rooster Fatigue (max 2 attacks & 1 defense)', async () => {
    const ctx = await buildServer();
    ctx.clanService.createDefaultWarMap('war_1', 'clan_a', 'clan_b');

    expect(() =>
      ctx.clanService.attackTerritoryNode('war_1', 'clan_a', 'sede_b', ['g1', 'g2', 'g3'])
    ).toThrow('TERRITORY_NOT_ADJACENT_BY_ROAD');

    ctx.clanService.attackTerritoryNode('war_1', 'clan_a', 'forte_cangaco', ['g1', 'g2', 'g3']);
    ctx.clanService.attackTerritoryNode('war_1', 'clan_a', 'acude_real', ['g1', 'g2', 'g3']);

    expect(() =>
      ctx.clanService.attackTerritoryNode('war_1', 'clan_a', 'vil_b1', ['g1', 'g2', 'g3'])
    ).toThrow('ROOSTER_ATTACK_FATIGUE_MAX_2:g1');

    ctx.clanService.assignTerritoryDefense('war_1', 'clan_a', 'sede_a', ['g1', 'g2', 'g3']);
    expect(() =>
      ctx.clanService.assignTerritoryDefense('war_1', 'clan_a', 'vil_a1', ['g1', 'g2', 'g3'])
    ).toThrow('ROOSTER_DEFENSE_FATIGUE_MAX_1:g1');
  });

  it('3. Colosso Raid Boss: scales to 1.37B Vigor on Difficulty 10 & transitions across 3 Phases', async () => {
    const ctx = await buildServer();
    const clan: Clan = {
      id: 'clan_top', name: 'Cangaceiros do Sertão', level: 10,
      memberIds: ['p1'], medals: 1_000, activeRaidDifficulty: 10,
    };
    ctx.db.clans.set(clan.id, clan);

    const boss = ctx.clanService.spawnColossoRaid(clan, 10);
    expect(boss.maxVigor).toBe(COLOSSO_RAID_VIGOR_BY_DIFFICULTY[10]);
    expect(boss.activePhase).toBe(1);
    expect(boss.activeLineage).toBe('Brasa');

    const phase2 = await ctx.clanService.attackColossoRaid(clan.id, 685_000_000, true);
    expect(phase2.boss.activePhase).toBe(2);
    expect(phase2.boss.activeLineage).toBe('Lua');
    expect(phase2.reflectedCritDamage).toBe(342_500_000);

    const phase3 = await ctx.clanService.attackColossoRaid(clan.id, 450_000_000, false);
    expect(phase3.boss.activePhase).toBe(3);
    expect(phase3.boss.activeLineage).toBe('Fúria Armorial');
    expect(phase3.immuneToStunAndTaunt).toBe(true);
  });

  it('4. Pix Web-Store & Billing: grants +15% bonus Crowns and guarantees txid idempotency', async () => {
    const ctx = await buildServer();
    const nowMs = Date.UTC(2026, 9, 26, 12, 0, 0);
    const player = createMockPlayer('p_pix', { crowns: 0 });
    ctx.db.players.set(player.id, player);

    ctx.ecaService.verifyAge18Plus(
      { playerId: player.id, birthDateIso: '1995-06-24', documentHash: 'CPF_HASH_12345678', acceptZeroCashOutPolicy: true },
      nowMs
    );

    const webStore = new OfficialPixWebStore();
    webStore.registerPlayerAccountForLookup({
      playerId: player.id, displayName: player.displayName, uf: player.uf, ageVerified18Plus: true,
    });

    const invoice = webStore.createPixCheckout(
      { playerId: player.id, packageId: 'WEB_PIX_CROWNS_1000' }, nowMs, 'TXID_UNICO_001'
    );
    expect(invoice.baseCrowns).toBe(1_000);
    expect(invoice.bonusCrowns15Pct).toBe(150);
    expect(invoice.totalCrowns).toBe(1_150);

    const firstCall = await ctx.billingService.processPixWebhook(
      { txid: invoice.txid, playerId: player.id, packageId: invoice.packageId }, nowMs
    );
    expect(firstCall.idempotentDuplicate).toBe(false);
    expect(player.crowns).toBe(1_150);

    const secondCall = await ctx.billingService.processPixWebhook(
      { txid: invoice.txid, playerId: player.id, packageId: invoice.packageId }, nowMs + 5_000
    );
    expect(secondCall.idempotentDuplicate).toBe(true);
    expect(player.crowns).toBe(1_150);
  });

  it('5. ECA Digital (Lei 15.211/2025): blocks <18, enforces monthly spend cap & serves 90-day pull history', async () => {
    const ctx = await buildServer();
    const nowMs = Date.UTC(2026, 9, 26, 12, 0, 0);
    const player = createMockPlayer('p_eca', { goldenFeathers: 10_000, pityCounter: 59 });
    const rooster = createMockRooster('r_eca', player.id);
    ctx.db.players.set(player.id, player);
    ctx.db.roosters.set(rooster.id, rooster);

    expect(() =>
      ctx.ecaService.verifyAge18Plus(
        { playerId: 'kid_15', birthDateIso: '2012-05-10', documentHash: 'DOC_MINOR_123', acceptZeroCashOutPolicy: true },
        nowMs
      )
    ).toThrow('UNDERAGE_18PLUS_BLOCKED');

    ctx.ecaService.verifyAge18Plus(
      { playerId: player.id, birthDateIso: '1998-01-15', documentHash: 'DOC_ADULT_999', acceptZeroCashOutPolicy: true },
      nowMs
    );
    ctx.ecaService.setMonthlySpendLimit(player.id, 50.0, nowMs);

    await ctx.billingService.processPixWebhook(
      { txid: 'TX_LIMIT_1', playerId: player.id, packageId: 'WEB_PIX_CROWNS_1000' }, nowMs
    );
    await expect(
      ctx.billingService.processPixWebhook(
        { txid: 'TX_LIMIT_2', playerId: player.id, packageId: 'WEB_PIX_CROWNS_1000' }, nowMs
      )
    ).rejects.toThrow('MONTHLY_SPEND_LIMIT_EXCEEDED');

    const pullRes = await ctx.gachaService.pullChocadeira(player.id, 'banner_trovao', '#18 Trovão do Sertão', 0.5, 0.5, nowMs);
    expect(pullRes.newPityCounter).toBe(60);
    expect(ctx.ecaService.getPullHistory90Days(player.id, nowMs)).toHaveLength(1);
    expect(ctx.gachaService.extractOrbsFromDuplicate(1)).toBe(40);
    expect(ctx.gachaService.extractOrbsFromDuplicate(30)).toBe(100);
    expect(ctx.liveOps.calculateCumulativeItemsToLap15()).toBe(1_050);
  });
});
