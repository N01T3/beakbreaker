import { describe, expect, it } from 'vitest';
import {
  ClanTechAndMarketService,
  InMemoryDatabase,
  type Clan,
  type Player,
  type RoosterInstance,
} from '../src/index.js';

function createPlayer(id: string, clanId: string, corn = 100_000): Player {
  return {
    id, displayName: `Player_${id}`, uf: 'PE', accountLevel: 25, sedeLevel: 6,
    corn, barnProtectedCorn: 10_000, goldenFeathers: 500, crowns: 0,
    trophies: 1200, stamina: 50, pityCounter: 0, guaranteedFeaturedNext: false,
    wildOrbs: 50, astralEssences: 5, piggyBankFeathers: 0, farmerCardActiveUntil: 0,
    orbClubActiveUntil: 0, shieldActiveUntil: 0, vipLevel: 0, totalSpentBrl: 0,
    lastIpHash: `ip_${id}`, deviceFingerprint: `fp_${id}`, clanId,
    towerProgressFloor: 0, campaignStars: {}, lapidarySlots: 1, primordialGems: {},
    lastLapidaryClaimMs: 0, towerCooldowns: {}, activeBuffs: {},
  };
}

function createClan(id: string, level = 1, medals = 0): Clan {
  return { id, name: `Bando_${id}`, level, memberIds: [], medals, activeRaidDifficulty: 1 };
}

describe('ClanTechAndMarketService - Feira de Orbes & Tecnologias de Clã', () => {
  it('gerencia pedidos de orbes com restrição de raridade e cooldown de 8h', () => {
    const db = new InMemoryDatabase();
    const service = new ClanTechAndMarketService(db);
    const clan = createClan('clan_1');
    db.clans.set(clan.id, clan);
    const p1 = createPlayer('p1', clan.id);
    db.players.set(p1.id, p1);

    expect(() => service.createOrbRequest(p1.id, clan.id, '#18 Trovão do Sertão', 1000)).toThrow('ONLY_COMMON_OR_RARE_ALLOWED');

    const req = service.createOrbRequest(p1.id, clan.id, '#1 Galo Campina', 1000);
    expect(req.speciesId).toBe('#1 Galo Campina');
    expect(req.rarity).toBe('Comum');
    expect(req.orbsReceived).toBe(0);

    expect(() => service.createOrbRequest(p1.id, clan.id, '#5 Brisa do Rio', 1000 + 4 * 3600 * 1000)).toThrow('ORB_REQUEST_COOLDOWN_ACTIVE');

    const req2 = service.createOrbRequest(p1.id, clan.id, '#5 Brisa do Rio', 1000 + 8 * 3600 * 1000);
    expect(req2.speciesId).toBe('#5 Brisa do Rio');
    expect(req2.rarity).toBe('Raro');
  });

  it('processa doações de orbes, recompensa de medalhas, xp de clã e teto diário de 5 orbes', () => {
    const db = new InMemoryDatabase();
    const service = new ClanTechAndMarketService(db);
    const clan = createClan('clan_1', 1, 0);
    db.clans.set(clan.id, clan);
    const requester = createPlayer('p_req', clan.id);
    const donor = createPlayer('p_don', clan.id);
    db.players.set(requester.id, requester);
    db.players.set(donor.id, donor);

    const rooster: RoosterInstance = {
      id: 'r_req', ownerId: requester.id, speciesId: '#1 Galo Campina', rarity: 'Comum',
      primaryElement: 'Brasa', tacticalClass: 'Bruiser', ng: 10, xp: 0, stars: 1, breedCount: 0,
      orbs: 10, equippedSets: [], equipmentRefinement: { penacho: 0, peitoral: 0, anilha: 0, amuleto: 0 }, perks: [],
    };
    db.roosters.set(rooster.id, rooster);

    const now = 2_000_000_000;
    const req = service.createOrbRequest(requester.id, clan.id, '#1 Galo Campina', now);

    expect(() => service.donateOrb(requester.id, clan.id, req.id, now)).toThrow('CANNOT_DONATE_TO_SELF');

    const res1 = service.donateOrb(donor.id, clan.id, req.id, now);
    expect(res1.orbsReceived).toBe(1);
    expect(res1.medalsAwarded).toBe(50);
    expect(res1.clanXpAwarded).toBe(200);
    expect(clan.medals).toBe(50);
    expect(rooster.orbs).toBe(11);

    for (let i = 2; i <= 5; i++) {
      service.donateOrb(donor.id, clan.id, req.id, now + i * 100);
    }
    expect(req.fulfilled).toBe(true);

    const req2 = service.createOrbRequest(requester.id, clan.id, '#1 Galo Campina', now + 9 * 3600 * 1000);
    expect(() => service.donateOrb(donor.id, clan.id, req2.id, now + 9 * 3600 * 1000)).toThrow('DAILY_DONATION_LIMIT_REACHED');

    const nextDay = now + 25 * 3600 * 1000;
    const resNextDay = service.donateOrb(donor.id, clan.id, req2.id, nextDay);
    expect(resNextDay.success).toBe(true);
  });

  it('Árvore de Tecnologias: lista 10 níveis, consome doação e expande feira no nível 5', () => {
    const db = new InMemoryDatabase();
    const service = new ClanTechAndMarketService(db);
    const clan = createClan('clan_tech', 1, 100);
    db.clans.set(clan.id, clan);
    const player = createPlayer('p_tech', clan.id, 50_000);
    db.players.set(player.id, player);

    const tree = service.getClanTechTree(clan.id);
    expect(tree).toHaveLength(10);
    expect(tree[0].name).toBe('Celeiro Solidário');
    expect(tree[0].unlocked).toBe(true);
    expect(tree[1].name).toBe('Adubo de Mandacaru');
    expect(tree[1].unlocked).toBe(false);
    expect(tree[4].name).toBe('Feira Expandida');
    expect(tree[9].name).toBe('Sertão Soberano');

    service.donateToClanTech(player.id, clan.id, 1000, 0);
    expect(clan.level).toBe(2);
    expect(service.getClanTechTree(clan.id)[1].unlocked).toBe(true);

    service.donateToClanTech(player.id, clan.id, 7500, 0);
    expect(clan.level).toBe(5);
    expect(service.getClanTechTree(clan.id)[4].unlocked).toBe(true);

    const req = service.createOrbRequest(player.id, clan.id, '#1 Galo Campina', 3_000_000);
    const donor = createPlayer('p_don2', clan.id);
    db.players.set(donor.id, donor);

    for (let i = 1; i <= 5; i++) {
      service.donateOrb(donor.id, clan.id, req.id, 3_000_000 + i * 10);
    }
    const reqB = service.createOrbRequest(player.id, clan.id, '#1 Galo Campina', 3_000_000 + 9 * 3600 * 1000);
    const don6 = service.donateOrb(donor.id, clan.id, reqB.id, 3_000_000 + 9 * 3600 * 1000);
    expect(don6.success).toBe(true);
    expect(() => service.donateOrb(donor.id, clan.id, reqB.id, 3_000_000 + 9 * 3600 * 1000 + 10)).toThrow('DAILY_DONATION_LIMIT_REACHED');
  });

  it('desbloqueia todas as tecnologias até o nível 10 com doação suficiente', () => {
    const db = new InMemoryDatabase();
    const service = new ClanTechAndMarketService(db);
    const clan = createClan('clan_max', 1, 0);
    db.clans.set(clan.id, clan);
    const player = createPlayer('p_rich', clan.id, 100_000);
    db.players.set(player.id, player);

    service.donateToClanTech(player.id, clan.id, 50_000, 0);
    expect(clan.level).toBe(10);
    const tree = service.getClanTechTree(clan.id);
    expect(tree.every((node) => node.unlocked)).toBe(true);
  });
});
