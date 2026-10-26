import { z } from 'zod';

export const BrazilianStateUFSchema = z.enum([
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]);
export type BrazilianStateUF = z.infer<typeof BrazilianStateUFSchema>;

export interface EcaComplianceSettings {
  playerId: string;
  ageVerified18Plus: boolean;
  verifiedAtIso: string | null;
  documentHash: string | null;
  monthlySpendLimitBrl: number | null;
  currentMonthSpendBrl: number;
  currentMonthKey: string; // YYYY-MM
  zeroCashOutAccepted: boolean;
  lgpdDeletedAtIso: string | null;
}

export interface Player {
  id: string;
  displayName: string;
  uf: BrazilianStateUF;
  accountLevel: number; // NC
  sedeLevel: number; // 1..12
  corn: number;
  barnProtectedCorn: number;
  goldenFeathers: number; // Penas Douradas (ganha)
  crowns: number; // Coroas (paga)
  trophies: number;
  stamina: number;
  pityCounter: number; // 0..80
  guaranteedFeaturedNext: boolean;
  wildOrbs: number;
  astralEssences: number;
  piggyBankFeathers: number; // max 1200
  farmerCardActiveUntil: number;
  orbClubActiveUntil: number;
  shieldActiveUntil: number;
  vipLevel: number; // 0..15
  totalSpentBrl: number;
  lastIpHash: string;
  deviceFingerprint: string;
  clanId: string | null;
  towerProgressFloor: number; // 0..100
  campaignStars: Record<number, number>; // stage 1..90 -> 1..3 stars
  lapidarySlots: number; // 1 or 2
  primordialGems: Record<string, number>;
  lastLapidaryClaimMs: number;
  towerCooldowns: Record<string, number>;
  activeBuffs: Record<string, number>;
}

export interface RoosterInstance {
  id: string;
  ownerId: string;
  speciesId: string;
  rarity: 'Comum' | 'Raro' | 'Épico' | 'Lendário' | 'Mítico' | 'Heróico';
  primaryElement: string;
  secondaryElement?: string | null;
  tacticalClass: 'Tanque' | 'Bruiser' | 'Assassino' | 'Atirador' | 'Suporte' | 'Controle';
  ng: number; // 1..70
  xp: number;
  stars: number; // 0..10 (1-5 yellow, 6-10 red astral)
  breedCount: number; // 0..5
  orbs: number;
  equippedSets: string[];
  equipmentRefinement: Record<'penacho' | 'peitoral' | 'anilha' | 'amuleto', number>; // 0..15
  perks: ('fenix' | 'ceifador' | 'procriacao')[];
}

export interface PerchState {
  id: string;
  playerId: string;
  element: string;
  level: number; // 1..8
  roosterIds: string[];
  hasAdjacentTotem: boolean;
  lastHarvestTimestampMs: number;
}

export interface FarmDefenseState {
  playerId: string;
  cercaMandacaruLevel: number;
  estilingueSabugoLevel: number;
  espantalhoAssombradoLevel: number;
  cataVentoAlertaLevel: number;
  guardianTrioIds: [string, string, string];
}

export interface RevengeLog {
  id: string;
  attackerId: string;
  defenderId: string;
  stolenCorn: number;
  isRevenge: boolean;
  canCounterRevenge: boolean;
  revengeClaimed: boolean;
  timestampMs: number;
}

export interface Clan {
  id: string;
  name: string;
  level: number; // 1..10
  memberIds: string[];
  medals: number;
  activeRaidDifficulty: number; // 1..10
}

export interface RaidBossState {
  clanId: string;
  difficulty: number; // 1..10
  maxVigor: number; // 20M .. 1.37B
  currentVigor: number;
  activePhase: 1 | 2 | 3;
  activeLineage: 'Brasa' | 'Lua' | 'Fúria Armorial';
  stacksFuria: number;
}

export interface TerritoryNode {
  id: string;
  name: string;
  type: 'Sede' | 'Vilarejo' | 'Forte do Cangaço' | 'Açude Real';
  points: 100 | 200 | 300;
  ownerClanId: string | null;
  connectedNodeIds: string[];
}

export interface TerritoryWarMap {
  warId: string;
  clanAId: string;
  clanBId: string;
  nodes: Record<string, TerritoryNode>;
  roosterFatigue: Record<string, { attacks: number; defenses: number }>;
  endsAtMs: number;
}

export interface HeroRaceRoom {
  roomId: string;
  playerProgress: Record<
    string,
    {
      lap: number; // 1..18
      node: number; // 1..5
      collectedInNode: number;
      poolAvailable: number;
      lastPoolUpdateMs: number;
    }
  >;
}

export interface GachaPullHistory90d {
  pullId: string;
  playerId: string;
  bannerId: string;
  pityAtPull: number;
  probabilityDisplayed: number;
  obtainedSpeciesId: string;
  obtainedRarity: RoosterInstance['rarity'];
  wasFeaturedGuarantee: boolean;
  timestampMs: number;
}

export interface PixOrder {
  txid: string;
  playerId: string;
  packageId: string;
  amountBrl: number;
  baseCrowns: number;
  bonusCrowns15Pct: number;
  totalCrownsCredited: number;
  status: 'PENDING' | 'PAID' | 'REJECTED_LIMIT';
  createdAtMs: number;
  processedAtMs: number | null;
}

export class InMemoryDatabase {
  players = new Map<string, Player>();
  ecaSettings = new Map<string, EcaComplianceSettings>();
  roosters = new Map<string, RoosterInstance>();
  perches = new Map<string, PerchState>();
  farmDefenses = new Map<string, FarmDefenseState>();
  revengeLogs = new Map<string, RevengeLog>();
  clans = new Map<string, Clan>();
  raidBosses = new Map<string, RaidBossState>();
  territoryWars = new Map<string, TerritoryWarMap>();
  heroRaceRooms = new Map<string, HeroRaceRoom>();
  gachaHistory90d: GachaPullHistory90d[] = [];
  pixOrders = new Map<string, PixOrder>();
}
