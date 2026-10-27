import { describe, expect, it } from 'vitest';
import {
  BRAZILIAN_FEDERATION_LIST, getAllStateFederations, getStateFederation,
  getStatesByRegion, StateFederationSchema,
} from '@beakbreaker/game-data';
import {
  FriendFarmVisitService, InMemoryDatabase, MAX_DAILY_FRIEND_COLLECTIONS,
  PlayerProfileShowcaseService, SEASON_DURATION_DAYS, UFRankingService,
  type Player, type RoosterInstance,
} from '../src/index.js';

function mkPlayer(id: string, uf: any, trophies = 1000, sedeLevel = 4, clanId: string | null = null): Player {
  return {
    id, displayName: `Treinador_${id}`, uf, accountLevel: 20, sedeLevel, corn: 10_000,
    barnProtectedCorn: 2_000, goldenFeathers: 100, crowns: 0, trophies, stamina: 60,
    pityCounter: 0, guaranteedFeaturedNext: false, wildOrbs: 0, astralEssences: 0,
    piggyBankFeathers: 0, farmerCardActiveUntil: 0, orbClubActiveUntil: 0, shieldActiveUntil: 0,
    vipLevel: 0, totalSpentBrl: 0, lastIpHash: `ip_${id}`, deviceFingerprint: `fp_${id}`, clanId,
    towerProgressFloor: 10, campaignStars: {}, lapidarySlots: 1, primordialGems: {},
    lastLapidaryClaimMs: 0, towerCooldowns: {}, activeBuffs: {},
  };
}

function mkRooster(id: string, ownerId: string, rarity: any = 'Comum', ng = 10, stars = 2): RoosterInstance {
  return {
    id, ownerId, speciesId: `rooster_${id}`, rarity, primaryElement: 'Brasa', tacticalClass: 'Bruiser',
    ng, xp: 0, stars, breedCount: 0, orbs: 0, equippedSets: [],
    equipmentRefinement: { penacho: 2, peitoral: 2, anilha: 2, amuleto: 2 }, perks: ['fenix'],
  };
}

describe('Federação Estadual & Ranking por UF (GDD v5.0 Master)', () => {
  it('valida federação com 27 estados, 5 regiões e esquemas zod', () => {
    expect(BRAZILIAN_FEDERATION_LIST.length).toBe(27);
    expect(getAllStateFederations().length).toBe(27);
    expect(getStatesByRegion('Nordeste').length).toBe(9);
    const pe = getStateFederation('PE');
    expect(pe.name).toBe('Pernambuco');
    expect(pe.capital).toBe('Recife');
    expect(pe.regionalPrideMultiplier).toBe(1.25);
    expect(StateFederationSchema.safeParse(pe).success).toBe(true);
    expect(() => getStateFederation('XX' as any)).toThrow();
  });

  it('calcula ranking nacional e estadual com multiplicador de orgulho', () => {
    const db = new InMemoryDatabase();
    const service = new UFRankingService(db, 1, 1_000_000);
    expect(service.getCurrentSeason().seasonId).toBe(1);
    expect(service.getTimeRemainingMs(1_000_000 + 1000)).toBe(SEASON_DURATION_DAYS * 86400 * 1000 - 1000);

    const pPe1 = mkPlayer('p_pe_1', 'PE', 3000); const pPe2 = mkPlayer('p_pe_2', 'PE', 2000); const pSp1 = mkPlayer('p_sp_1', 'SP', 4000);
    [pPe1, pPe2, pSp1].forEach((p) => db.players.set(p.id, p));

    const national = service.getNationalUFRanking();
    expect(national[0].uf).toBe('PE'); // (3000+2000)*1.25 = 6250 vs SP: 4000*1.05 = 4200
    expect(national[0].weightedScore).toBe(6250);
    expect(national[0].rank).toBe(1);

    const pePlayers = service.getStatePlayerRanking('PE');
    expect(pePlayers.length).toBe(2);
    expect(pePlayers[0].playerId).toBe('p_pe_1');
    expect(pePlayers[0].rank).toBe(1);
  });

  it('fecha temporada distribuindo medalha de honra e penas douradas ao estado campeão', () => {
    const db = new InMemoryDatabase();
    const service = new UFRankingService(db, 1, 1_000_000);
    const p1 = mkPlayer('p1', 'CE', 5000);
    const p2 = mkPlayer('p2', 'CE', 3000);
    [p1, p2].forEach((p) => db.players.set(p.id, p));

    const res = service.closeSeason(2_000_000, true);
    expect(res.championUF).toBe('CE');
    expect(p1.goldenFeathers).toBe(100 + 500 + 500); // 100 base + 500 campeão + 500 pódio #1
    expect(p2.goldenFeathers).toBe(100 + 500 + 300); // 100 base + 500 campeão + 300 pódio #2
    expect(res.playerRewards[0].honorMedalGranted).toContain('Medalha de Honra Estadual');
    expect(() => service.closeSeason(2_000_000, false)).toThrow();
  });
});

describe('Vitrine de Perfil do Jogador & Prestígio de Decoração', () => {
  it('exibe trio favorito, poder do trio, moldura e títulos animados', () => {
    const db = new InMemoryDatabase();
    const service = new PlayerProfileShowcaseService(db);
    const p = mkPlayer('p_showcase', 'BA', 1500, 5);
    db.players.set(p.id, p);

    const r1 = mkRooster('r1', p.id, 'Comum', 10, 2);
    const r2 = mkRooster('r2', p.id, 'Raro', 15, 3);
    const r3 = mkRooster('r3', p.id, 'Lendário', 25, 5);
    [r1, r2, r3].forEach((r) => db.roosters.set(r.id, r));

    const equipRes = service.setFavoriteRoosters(p.id, [r1.id, r2.id, r3.id]);
    expect(equipRes.ok).toBe(true);
    expect(equipRes.totalTrioPower).toBeGreaterThan(5000);

    expect(service.equipTitle(p.id, 'Supremo Sertão').ok).toBe(true);
    expect(service.equipTitle(p.id, 'Coronel do Arraial').ok).toBe(true);
    expect(service.equipAchievementFrame(p.id, 'frame_campeao_uf').ok).toBe(true);

    const showcase = service.getShowcase(p.id);
    expect(showcase.favoriteRoosters.length).toBe(3);
    expect(showcase.activeTitle).toBe('Coronel do Arraial');
    expect(showcase.activeFrame).toBe('frame_campeao_uf');
    expect(showcase.decorationPrestige.tier).toBeDefined();
  });

  it('calcula métricas de prestígio por sede, poleiros, totens e defesas', () => {
    const db = new InMemoryDatabase();
    const service = new PlayerProfileShowcaseService(db);
    const p = mkPlayer('p_prestige', 'PB', 2000, 8);
    db.players.set(p.id, p);
    db.perches.set('perch_1', { id: 'perch_1', playerId: p.id, element: 'Brasa', level: 4, roosterIds: [], hasAdjacentTotem: true, lastHarvestTimestampMs: 0 });
    db.farmDefenses.set(p.id, { playerId: p.id, cercaMandacaruLevel: 3, estilingueSabugoLevel: 3, espantalhoAssombradoLevel: 3, cataVentoAlertaLevel: 3, guardianTrioIds: ['', '', ''] });

    const prestige = service.calculateDecorationPrestige(p);
    expect(prestige.breakdown.sede).toBe(800);
    expect(prestige.breakdown.perches).toBe(160);
    expect(prestige.breakdown.totems).toBe(120);
    expect(prestige.breakdown.defenses).toBe(600);
    expect(prestige.totalPrestige).toBe(800 + 160 + 120 + 600 + Math.floor(2000 * 0.15));
    expect(['Bronze', 'Prata', 'Ouro', 'Diamante', 'Sertão Supremo']).toContain(prestige.tier);
  });
});

describe('Visitas Sociais à Fazenda & Coleta de Amizade', () => {
  it('inspeciona galinheiro e coleta bônus diário limitado com sinergia de bando', () => {
    const db = new InMemoryDatabase();
    const service = new FriendFarmVisitService(db);
    const host = mkPlayer('host_1', 'RN', 2000, 6, 'bando_sol');
    const friend = mkPlayer('friend_1', 'RN', 1500, 4, 'bando_sol');
    db.players.set(host.id, host);
    db.players.set(friend.id, friend);
    db.clans.set('bando_sol', { id: 'bando_sol', name: 'Bando do Sol', level: 3, memberIds: [host.id, friend.id], medals: 50, activeRaidDifficulty: 1 });

    const r = mkRooster('r_coop', host.id, 'Épico', 20, 3);
    db.roosters.set(r.id, r);
    db.perches.set('perch_host', { id: 'perch_host', playerId: host.id, element: 'Brasa', level: 3, roosterIds: [r.id], hasAdjacentTotem: true, lastHarvestTimestampMs: 0 });

    const report = service.inspectFarm(friend.id, host.id);
    expect(report.isBandoMember).toBe(true);
    expect(report.totalRestingRoosters).toBe(1);
    expect(report.canClaimBonusToday).toBe(true);

    const initialCorn = friend.corn;
    const claimRes = service.claimFriendshipBonus(friend.id, host.id);
    expect(claimRes.success).toBe(true);
    expect(claimRes.isBandoBonus).toBe(true);
    expect(claimRes.collectedCorn).toBeGreaterThan(350);
    expect(claimRes.collectedSeeds).toBeGreaterThan(5);
    expect(friend.corn).toBe(initialCorn + claimRes.collectedCorn);

    expect(service.claimFriendshipBonus(friend.id, host.id).success).toBe(false);
    expect(service.claimFriendshipBonus(friend.id, friend.id).success).toBe(false);
  });

  it('bloqueia exceder 10 coletas diárias de amigos', () => {
    const db = new InMemoryDatabase();
    const service = new FriendFarmVisitService(db);
    const visitor = mkPlayer('visitor_busy', 'AL', 1000, 3);
    db.players.set(visitor.id, visitor);

    for (let i = 1; i <= MAX_DAILY_FRIEND_COLLECTIONS; i++) {
      const h = mkPlayer(`host_${i}`, 'AL', 500, 2);
      db.players.set(h.id, h);
      expect(service.claimFriendshipBonus(visitor.id, h.id).success).toBe(true);
    }

    const host11 = mkPlayer('host_11', 'AL', 500, 2);
    db.players.set(host11.id, host11);
    const excessRes = service.claimFriendshipBonus(visitor.id, host11.id);
    expect(excessRes.success).toBe(false);
    expect(excessRes.error).toContain('Limite diário de 10 coletas');
  });
});
