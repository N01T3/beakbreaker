import type { Clan, InMemoryDatabase } from '../db/schema.js';

export interface ClanTechDefinition {
  level: number;
  name: string;
  effect: string;
  effectKey: string;
  bonusValue: number;
  requiredXp: number;
}

export interface ClanTechNode extends ClanTechDefinition {
  unlocked: boolean;
  description: string;
}

export type ClanTechTree = ClanTechNode[] & {
  clanId: string;
  currentLevel: number;
  currentXp: number;
  nodes: ClanTechNode[];
};

export interface OrbRequest {
  id: string;
  playerId: string;
  clanId: string;
  speciesId: string;
  rarity: string;
  createdAtMs: number;
  orbsReceived: number;
  maxOrbs: number;
  donations: Array<{ donorId: string; amount: number; timestampMs: number }>;
  fulfilled: boolean;
}

export const CLAN_ORB_REQUEST_COOLDOWN_MS = 8 * 60 * 60 * 1000;
export const CLAN_MARKET_BASE_DAILY_DONATIONS = 5;

export const CLAN_TECH_DEFINITIONS: ClanTechDefinition[] = [
  { level: 1, name: 'Celeiro Solidário', effect: '+5% capacidade de celeiro para membros', effectKey: 'barn_capacity_bonus', bonusValue: 0.05, requiredXp: 0 },
  { level: 2, name: 'Adubo de Mandacaru', effect: '+5% produção de milho nos poleiros', effectKey: 'corn_production_bonus', bonusValue: 0.05, requiredXp: 1000 },
  { level: 3, name: 'Muralha do Cangaço', effect: '+5% Vigor das defesas rurais', effectKey: 'defense_vigor_bonus', bonusValue: 0.05, requiredXp: 2500 },
  { level: 4, name: 'Ferradura de Prata', effect: '+3% Velocidade em combates PvE', effectKey: 'pve_speed_bonus', bonusValue: 0.03, requiredXp: 5000 },
  { level: 5, name: 'Feira Expandida', effect: '+1 doação diária permitida na feira', effectKey: 'market_daily_donations_bonus', bonusValue: 1, requiredXp: 8500 },
  { level: 6, name: 'Joia da Fênix', effect: 'desbloqueia compra de Joia da Fênix na loja do clã', effectKey: 'unlock_phoenix_gem', bonusValue: 1, requiredXp: 13000 },
  { level: 7, name: 'Canto Coletivo', effect: '+50 de Canto inicial na Guerra de Territórios', effectKey: 'initial_canto_bonus', bonusValue: 50, requiredXp: 19000 },
  { level: 8, name: 'Raid Mestre', effect: 'desbloqueia dificuldade 10 do Colosso 1,37B', effectKey: 'unlock_colosso_diff_10', bonusValue: 10, requiredXp: 27000 },
  { level: 9, name: 'Asas de Aço', effect: '+5% Defesa global para o clã', effectKey: 'global_clan_defense_bonus', bonusValue: 0.05, requiredXp: 37000 },
  { level: 10, name: 'Sertão Soberano', effect: '+10% em todas as recompensas de clã', effectKey: 'all_clan_rewards_bonus', bonusValue: 0.10, requiredXp: 50000 },
];

const KNOWN_SPECIES_RARITIES: Record<string, string> = {
  '#1 Galo Campina': 'Comum', rooster_01: 'Comum', '#2 Zabumba': 'Comum', rooster_02: 'Comum',
  '#3 Caboré': 'Comum', rooster_03: 'Comum', '#4 Faísca': 'Comum', rooster_04: 'Comum',
  '#5 Brisa do Rio': 'Raro', rooster_05: 'Raro', '#11 Galo Cangaceiro': 'Épico', rooster_11: 'Épico',
  '#18 Trovão do Sertão': 'Lendário', rooster_18: 'Lendário', '#19 Asa Branca': 'Lendário', rooster_19: 'Lendário',
};

export function resolveSpeciesRarity(speciesId: string, db?: InMemoryDatabase, overrideRarity?: string): string {
  if (overrideRarity) return overrideRarity;
  if (KNOWN_SPECIES_RARITIES[speciesId]) return KNOWN_SPECIES_RARITIES[speciesId];
  if (db) {
    for (const r of db.roosters.values()) if (r.speciesId === speciesId) return r.rarity;
  }
  const low = speciesId.toLowerCase();
  if (low.includes('comum') || low.includes('common')) return 'Comum';
  if (low.includes('raro') || low.includes('rare')) return 'Raro';
  if (low.includes('epic') || low.includes('épic')) return 'Épico';
  if (low.includes('lend') || low.includes('legen')) return 'Lendário';
  return 'Comum';
}

export class ClanTechAndMarketService {
  private requestSeq = 0;
  private requests = new Map<string, OrbRequest>();
  private playerLastRequestTime = new Map<string, number>();
  private donationsHistory = new Map<string, number[]>();
  private clanXp = new Map<string, number>();

  constructor(private readonly db: InMemoryDatabase) {}

  createOrbRequest(playerId: string, clanId: string, speciesId: string, nowMs = Date.now(), rarityOverride?: string): OrbRequest {
    const clan = this.db.clans.get(clanId);
    if (!clan) throw new Error('CLAN_NOT_FOUND');
    const player = this.db.players.get(playerId);
    if (player?.clanId && player.clanId !== clanId) throw new Error('PLAYER_NOT_IN_CLAN');
    const rarity = resolveSpeciesRarity(speciesId, this.db, rarityOverride);
    if (rarity !== 'Comum' && rarity !== 'Raro') throw new Error('ONLY_COMMON_OR_RARE_ALLOWED');
    const lastTime = this.playerLastRequestTime.get(playerId);
    if (lastTime !== undefined && nowMs - lastTime < CLAN_ORB_REQUEST_COOLDOWN_MS) {
      throw new Error('ORB_REQUEST_COOLDOWN_ACTIVE');
    }

    const req: OrbRequest = {
      id: `req_${++this.requestSeq}_${nowMs}`, playerId, clanId, speciesId, rarity,
      createdAtMs: nowMs, orbsReceived: 0, maxOrbs: 5, donations: [], fulfilled: false,
    };
    this.requests.set(req.id, req);
    this.playerLastRequestTime.set(playerId, nowMs);
    return req;
  }

  donateOrb(donorId: string, clanId: string, requestId: string, nowMs = Date.now()) {
    const clan = this.db.clans.get(clanId);
    if (!clan) throw new Error('CLAN_NOT_FOUND');
    const req = this.requests.get(requestId);
    if (!req) throw new Error('REQUEST_NOT_FOUND');
    if (req.clanId !== clanId) throw new Error('CLAN_MISMATCH');
    if (req.playerId === donorId) throw new Error('CANNOT_DONATE_TO_SELF');
    if (req.fulfilled || req.orbsReceived >= req.maxOrbs) throw new Error('REQUEST_ALREADY_FULFILLED');
    const donor = this.db.players.get(donorId);
    if (donor?.clanId && donor.clanId !== clanId) throw new Error('DONOR_NOT_IN_CLAN');

    const maxDaily = clan.level >= 5 ? 6 : CLAN_MARKET_BASE_DAILY_DONATIONS;
    const history = (this.donationsHistory.get(donorId) ?? []).filter(t => nowMs - t < 86_400_000);
    if (history.length >= maxDaily) throw new Error('DAILY_DONATION_LIMIT_REACHED');

    history.push(nowMs);
    this.donationsHistory.set(donorId, history);
    req.orbsReceived += 1;
    if (req.orbsReceived >= req.maxOrbs) req.fulfilled = true;
    req.donations.push({ donorId, amount: 1, timestampMs: nowMs });
    clan.medals += 50;
    this.addClanXp(clan, 200);

    for (const r of this.db.roosters.values()) {
      if (r.ownerId === req.playerId && r.speciesId === req.speciesId) {
        r.orbs += 1;
        break;
      }
    }
    return { success: true, orbsReceived: req.orbsReceived, medalsAwarded: 50, clanXpAwarded: 200, clanLevel: clan.level, fulfilled: req.fulfilled };
  }

  donateToClanTech(playerId: string, clanId: string, cornAmount: number, medalsAmount: number) {
    const clan = this.db.clans.get(clanId);
    if (!clan) throw new Error('CLAN_NOT_FOUND');
    const player = this.db.players.get(playerId);
    if (!player) throw new Error('PLAYER_NOT_FOUND');
    if (player.clanId && player.clanId !== clanId) throw new Error('PLAYER_NOT_IN_CLAN');
    if (cornAmount < 0 || medalsAmount < 0) throw new Error('INVALID_DONATION_AMOUNT');
    if (cornAmount === 0 && medalsAmount === 0) throw new Error('EMPTY_DONATION');
    if (player.corn < cornAmount) throw new Error('INSUFFICIENT_CORN');

    player.corn -= cornAmount;
    if (medalsAmount > 0 && typeof (player as any).medals === 'number') {
      if ((player as any).medals < medalsAmount) throw new Error('INSUFFICIENT_MEDALS');
      (player as any).medals -= medalsAmount;
    }
    const xpGained = cornAmount + medalsAmount * 10;
    const totalXp = this.addClanXp(clan, xpGained);
    return { success: true, xpGained, totalXp, clanLevel: clan.level };
  }

  getClanTechTree(clanId: string): ClanTechTree {
    const clan = this.db.clans.get(clanId);
    const clanLevel = clan ? clan.level : 1;
    const currentXp = this.clanXp.get(clanId) ?? 0;
    const nodes: ClanTechNode[] = CLAN_TECH_DEFINITIONS.map(def => ({
      ...def, description: def.effect,
      unlocked: clanLevel >= def.level || currentXp >= def.requiredXp,
    }));
    return Object.assign(nodes, { clanId, currentLevel: clanLevel, currentXp, nodes }) as ClanTechTree;
  }

  private addClanXp(clan: Clan, xp: number): number {
    const cur = (this.clanXp.get(clan.id) ?? 0) + xp;
    this.clanXp.set(clan.id, cur);
    for (const def of CLAN_TECH_DEFINITIONS) {
      if (cur >= def.requiredXp && clan.level < def.level) clan.level = def.level;
    }
    return cur;
  }
}
