import { describe, expect, it } from 'vitest';
import { InMemoryDatabase, type Player } from '../src/db/schema.js';
import {
  calculateVipLevel,
  FARMER_CARD_HARVEST_BONUS,
  StoreMonetizationService,
  VAULT_MAX_CROWNS,
  VIP_TIERS,
} from '../src/modules/store-monetization.js';

function makePlayer(id: string): Player {
  return {
    id, displayName: `Player_${id}`, uf: 'PE', accountLevel: 20, sedeLevel: 5,
    corn: 5000, barnProtectedCorn: 1000, goldenFeathers: 0, crowns: 0,
    trophies: 1000, stamina: 40, pityCounter: 0, guaranteedFeaturedNext: false,
    wildOrbs: 0, astralEssences: 0, piggyBankFeathers: 0, farmerCardActiveUntil: 0,
    orbClubActiveUntil: 0, shieldActiveUntil: 0, vipLevel: 0, totalSpentBrl: 0,
    lastIpHash: `ip_${id}`, deviceFingerprint: `fp_${id}`, clanId: null,
    towerProgressFloor: 0, campaignStars: {}, lapidarySlots: 1, primordialGems: {},
    lastLapidaryClaimMs: 0, towerCooldowns: {}, activeBuffs: {},
  };
}

describe('StoreMonetizationService - Servicos Comerciais', () => {
  it('Cofre do Galo de Ouro: acumula 10 Coroas por vitoria ate teto 500 e quebra por R$ 9,90', () => {
    const db = new InMemoryDatabase();
    const service = new StoreMonetizationService(db);
    const player = makePlayer('p1');
    db.players.set(player.id, player);

    for (let i = 0; i < 49; i++) {
      const res = service.recordArenaVictory(player.id);
      expect(res.crowns).toBe((i + 1) * 10);
      expect(res.isFull).toBe(false);
    }
    expect(() => service.breakVault(player.id)).toThrow('VAULT_NOT_FULL');

    const fullRes = service.recordArenaVictory(player.id);
    expect(fullRes.crowns).toBe(VAULT_MAX_CROWNS);
    expect(fullRes.isFull).toBe(true);

    const overRes = service.recordArenaVictory(player.id);
    expect(overRes.crowns).toBe(VAULT_MAX_CROWNS);

    const breakRes = service.breakVault(player.id);
    expect(breakRes.creditedCrowns).toBe(500);
    expect(breakRes.totalCrowns).toBe(500);
    expect(breakRes.priceBrl).toBe(9.9);
    expect(service.getVaultCrowns(player.id)).toBe(0);
    expect(player.totalSpentBrl).toBe(9.9);
  });

  it('Cartao do Fazendeiro: concede 300 penas imediatas, 100 diarias e 20% bonus colheita', () => {
    const db = new InMemoryDatabase();
    const service = new StoreMonetizationService(db);
    const player = makePlayer('p2');
    db.players.set(player.id, player);

    const baseMs = 1_000_000_000;
    const sub = service.subscribeFarmerCard(player.id, baseMs);
    expect(sub.goldenFeathers).toBe(300);
    expect(service.getFarmerHarvestBonus(player.id, baseMs)).toBe(FARMER_CARD_HARVEST_BONUS);

    const claim1 = service.claimFarmerCardDaily(player.id, baseMs);
    expect(claim1.claimedFeathers).toBe(100);
    expect(claim1.totalFeathers).toBe(400);

    expect(() => service.claimFarmerCardDaily(player.id, baseMs + 3600_000)).toThrow('ALREADY_CLAIMED_TODAY');

    const nextDayMs = baseMs + 86_400_000;
    const claim2 = service.claimFarmerCardDaily(player.id, nextDayMs);
    expect(claim2.totalFeathers).toBe(500);

    const expiredMs = baseMs + 31 * 86_400_000;
    expect(service.getFarmerHarvestBonus(player.id, expiredMs)).toBe(0);
    expect(() => service.claimFarmerCardDaily(player.id, expiredMs)).toThrow('FARMER_CARD_NOT_ACTIVE');
  });

  it('Clube de Orbes: concede 20 orbes imediatos e 10 orbes diarios com claim unico ao dia', () => {
    const db = new InMemoryDatabase();
    const service = new StoreMonetizationService(db);
    const player = makePlayer('p3');
    db.players.set(player.id, player);

    const baseMs = 2_000_000_000;
    const sub = service.subscribeOrbClub(player.id, baseMs);
    expect(sub.wildOrbs).toBe(20);

    const claim1 = service.claimOrbClubDaily(player.id, baseMs);
    expect(claim1.claimedOrbs).toBe(10);
    expect(claim1.totalOrbs).toBe(30);

    expect(() => service.claimOrbClubDaily(player.id, baseMs + 1000)).toThrow('ALREADY_CLAIMED_TODAY');

    const claim2 = service.claimOrbClubDaily(player.id, baseMs + 86_400_000);
    expect(claim2.claimedOrbs).toBe(10);
    expect(claim2.totalOrbs).toBe(40);
  });

  it('Escala VIP: 10 pts por R$ 1, validando niveis VIP 1, VIP 5, VIP 10 e VIP 15', () => {
    const db = new InMemoryDatabase();
    const service = new StoreMonetizationService(db);
    const player = makePlayer('p4');
    db.players.set(player.id, player);

    expect(calculateVipLevel(99)).toBe(0);
    expect(calculateVipLevel(100)).toBe(1);
    expect(calculateVipLevel(1000)).toBe(5);
    expect(calculateVipLevel(5000)).toBe(10);
    expect(calculateVipLevel(20000)).toBe(15);
    expect(calculateVipLevel(50000)).toBe(15);

    service.recordPixPayment(player, 10.0);
    expect(player.vipLevel).toBe(1);

    service.recordPixPayment(player, 90.0); // Total R$ 100 -> 1000 pts
    expect(player.vipLevel).toBe(5);

    service.recordPixPayment(player, 400.0); // Total R$ 500 -> 5000 pts
    expect(player.vipLevel).toBe(10);

    service.recordPixPayment(player, 1500.0); // Total R$ 2000 -> 20000 pts
    expect(player.vipLevel).toBe(15);

    expect(VIP_TIERS[0].perk).toBe('+5% velocidade de colheita');
    expect(VIP_TIERS[4].perk).toBe('+1 slot no ninhal');
    expect(VIP_TIERS[9].perk).toBe('Varredura instantânea da Torre');
    expect(VIP_TIERS[14].perk).toBe('Teto VIP com benefícios máximos');
  });

  it('Gatilho Comercial Oferta Relampago: pity entre 58-65 e penas < 160 dispara oferta de 20 tiros', () => {
    const db = new InMemoryDatabase();
    const service = new StoreMonetizationService(db);
    const player = makePlayer('p5');
    db.players.set(player.id, player);

    player.pityCounter = 50;
    player.goldenFeathers = 100;
    expect(service.checkFlashOffer(player.id)).toBeNull();

    player.pityCounter = 60;
    player.goldenFeathers = 200;
    expect(service.checkFlashOffer(player.id)).toBeNull();

    player.goldenFeathers = 120;
    const nowMs = 10_000_000;
    const offer = service.checkFlashOffer(player.id, nowMs);
    expect(offer).not.toBeNull();
    expect(offer?.pulls).toBe(20);
    expect(offer?.priceBrl).toBe(34.9);
    expect(offer?.discountPercent).toBe(60);
    expect(offer?.durationSeconds).toBe(7200);

    const expiredMs = nowMs + 7201 * 1000;
    expect(() => service.purchaseFlashOffer(player.id, expiredMs)).toThrow('FLASH_OFFER_EXPIRED');

    const purchase = service.purchaseFlashOffer(player.id, nowMs + 1000);
    expect(purchase.pullsCredited).toBe(20);
    expect(purchase.goldenFeathers).toBe(120 + 20 * 160);
    expect(player.totalSpentBrl).toBe(34.9);
  });
});
