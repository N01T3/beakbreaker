import type { BrazilianStateUF } from '@beakbreaker/game-data';
import type { InMemoryDatabase, Player, RoosterInstance } from '../../db/schema.js';

export const ALLOWED_ANIMATED_TITLES = [
  'Supremo Sertão', 'Coronel do Arraial', 'Lampião Dourado',
  'Mestre de Canto', 'Lenda do Mandacaru', 'Guerreiro da Caatinga',
] as const;
export type AnimatedTitle = (typeof ALLOWED_ANIMATED_TITLES)[number];

export const ALLOWED_ACHIEVEMENT_FRAMES = [
  'frame_xilogravura', 'frame_prata_sertao', 'frame_ouro_cangaco',
  'frame_primordial', 'frame_campeao_uf',
] as const;
export type AchievementFrame = (typeof ALLOWED_ACHIEVEMENT_FRAMES)[number];

export interface FavoriteRoosterCard {
  id: string; speciesId: string; rarity: RoosterInstance['rarity'];
  ng: number; stars: number; primaryElement: string;
  tacticalClass: string; power: number;
}

export interface DecorationPrestigeMetrics {
  totalPrestige: number; tier: 'Bronze' | 'Prata' | 'Ouro' | 'Diamante' | 'Sertão Supremo';
  breakdown: { sede: number; perches: number; defenses: number; totems: number; trophies: number };
}

export interface PlayerProfileShowcaseData {
  playerId: string; displayName: string; uf: BrazilianStateUF;
  accountLevel: number; sedeLevel: number; clanName: string | null;
  activeTitle: string; activeFrame: string;
  favoriteRoosters: FavoriteRoosterCard[]; totalTrioPower: number;
  decorationPrestige: DecorationPrestigeMetrics;
}

const RARITY_BASE_POWER: Record<RoosterInstance['rarity'], number> = {
  Comum: 1000, Raro: 1500, Épico: 2200, Lendário: 3200, Mítico: 4500, Heróico: 6000,
};

export class PlayerProfileShowcaseService {
  private customSettings = new Map<string, { favorites: string[]; title: string; frame: string }>();

  constructor(private readonly db: InMemoryDatabase) {}

  calculateRoosterPower(rooster: RoosterInstance): number {
    const base = RARITY_BASE_POWER[rooster.rarity] ?? 1000;
    const ngMult = 1 + (Math.max(1, rooster.ng) - 1) * 0.05;
    const starMult = 1 + Math.max(0, rooster.stars) * 0.10;
    const refBonus = Object.values(rooster.equipmentRefinement ?? {}).reduce((a, b) => a + b, 0) * 50;
    const perkBonus = (rooster.perks?.length ?? 0) * 200;
    return Math.floor(base * ngMult * starMult) + refBonus + perkBonus;
  }

  calculateDecorationPrestige(player: Player): DecorationPrestigeMetrics {
    const sede = player.sedeLevel * 100;
    const playerPerches = Array.from(this.db.perches.values()).filter((p) => p.playerId === player.id);
    const perches = playerPerches.reduce((acc, p) => acc + p.level * 40, 0);
    const totems = playerPerches.filter((p) => p.hasAdjacentTotem).length * 120;
    const def = this.db.farmDefenses.get(player.id);
    const defenses = def ? (def.cercaMandacaruLevel + def.estilingueSabugoLevel + def.espantalhoAssombradoLevel + def.cataVentoAlertaLevel) * 50 : 0;
    const trophies = Math.floor(Math.max(0, player.trophies) * 0.15);
    const total = sede + perches + totems + defenses + trophies;

    let tier: DecorationPrestigeMetrics['tier'] = 'Bronze';
    if (total >= 10000) tier = 'Sertão Supremo';
    else if (total >= 5000) tier = 'Diamante';
    else if (total >= 2500) tier = 'Ouro';
    else if (total >= 1000) tier = 'Prata';

    return { totalPrestige: total, tier, breakdown: { sede, perches, defenses, totems, trophies } };
  }

  setFavoriteRoosters(playerId: string, roosterIds: string[]): { ok: boolean; totalTrioPower: number; error?: string } {
    if (roosterIds.length > 3) return { ok: false, totalTrioPower: 0, error: 'A vitrine permite no máximo 3 atletas favoritos.' };
    const player = this.db.players.get(playerId);
    if (!player) return { ok: false, totalTrioPower: 0, error: 'Jogador não encontrado.' };

    for (const rId of roosterIds) {
      const rooster = this.db.roosters.get(rId);
      if (!rooster || rooster.ownerId !== playerId) return { ok: false, totalTrioPower: 0, error: `Atleta ${rId} não pertence ao jogador.` };
    }

    const current = this.customSettings.get(playerId) ?? { favorites: [], title: 'Supremo Sertão', frame: 'frame_xilogravura' };
    current.favorites = [...roosterIds];
    this.customSettings.set(playerId, current);

    const cards = roosterIds.map((id) => this.db.roosters.get(id)!);
    const totalTrioPower = cards.reduce((acc, r) => acc + this.calculateRoosterPower(r), 0);
    return { ok: true, totalTrioPower };
  }

  equipTitle(playerId: string, title: AnimatedTitle): { ok: boolean; error?: string } {
    if (!ALLOWED_ANIMATED_TITLES.includes(title)) return { ok: false, error: 'Título animado inválido.' };
    const current = this.customSettings.get(playerId) ?? { favorites: [], title, frame: 'frame_xilogravura' };
    current.title = title;
    this.customSettings.set(playerId, current);
    return { ok: true };
  }

  equipAchievementFrame(playerId: string, frame: AchievementFrame): { ok: boolean; error?: string } {
    if (!ALLOWED_ACHIEVEMENT_FRAMES.includes(frame)) return { ok: false, error: 'Moldura de conquistas inválida.' };
    const current = this.customSettings.get(playerId) ?? { favorites: [], title: 'Supremo Sertão', frame };
    current.frame = frame;
    this.customSettings.set(playerId, current);
    return { ok: true };
  }

  getShowcase(playerId: string): PlayerProfileShowcaseData {
    const player = this.db.players.get(playerId);
    if (!player) throw new Error(`Jogador ${playerId} não encontrado.`);
    const custom = this.customSettings.get(playerId) ?? { favorites: [], title: 'Supremo Sertão', frame: 'frame_xilogravura' };
    const clan = player.clanId ? this.db.clans.get(player.clanId) : null;

    let favoriteRoosters: FavoriteRoosterCard[] = [];
    if (custom.favorites.length > 0) {
      favoriteRoosters = custom.favorites
        .map((id) => this.db.roosters.get(id))
        .filter((r): r is RoosterInstance => Boolean(r))
        .map((r) => ({
          id: r.id, speciesId: r.speciesId, rarity: r.rarity, ng: r.ng, stars: r.stars,
          primaryElement: r.primaryElement, tacticalClass: r.tacticalClass, power: this.calculateRoosterPower(r),
        }));
    } else {
      // Auto-pick top 3 roosters by power
      const owned = Array.from(this.db.roosters.values()).filter((r) => r.ownerId === playerId);
      owned.sort((a, b) => this.calculateRoosterPower(b) - this.calculateRoosterPower(a));
      favoriteRoosters = owned.slice(0, 3).map((r) => ({
        id: r.id, speciesId: r.speciesId, rarity: r.rarity, ng: r.ng, stars: r.stars,
        primaryElement: r.primaryElement, tacticalClass: r.tacticalClass, power: this.calculateRoosterPower(r),
      }));
    }

    const totalTrioPower = favoriteRoosters.reduce((acc, c) => acc + c.power, 0);
    const decorationPrestige = this.calculateDecorationPrestige(player);

    return {
      playerId: player.id, displayName: player.displayName, uf: player.uf,
      accountLevel: player.accountLevel, sedeLevel: player.sedeLevel, clanName: clan ? clan.name : null,
      activeTitle: custom.title, activeFrame: custom.frame, favoriteRoosters, totalTrioPower, decorationPrestige,
    };
  }
}
