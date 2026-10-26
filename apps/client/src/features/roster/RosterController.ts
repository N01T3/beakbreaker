import type { CordelEquipmentSetId } from '@beakbreaker/ui-cordel';

export const STAR_ORB_COSTS: readonly number[] = [
  120,  // 1★
  200,  // 2★
  320,  // 3★
  560,  // 4★
  800,  // 5★ (Subtotal 1★-5★ = 2.000 Orbes)
  1100, // 6★ (Despertar Astral Vermelho)
  1400, // 7★
  1800, // 8★
  2200, // 9★
  2700, // 10★ (Subtotal 6★-10★ = 9.200 Orbes; Total 1★-10★ = 11.200 Orbes)
] as const;

export const TOTAL_ORBS_TO_10_STARS = 11_200;

export interface RosterRoosterEntry {
  id: string;
  number: number;
  name: string;
  level: number;
  stars: number;
  orbsOwned: number;
  equippedSet?: CordelEquipmentSetId;
  refineLevel: number;
}

export class RosterController {
  private roster = new Map<string, RosterRoosterEntry>();
  private discoveredNumbers = new Set<number>();

  public registerRooster(entry: RosterRoosterEntry): void {
    this.roster.set(entry.id, { ...entry });
    this.discoveredNumbers.add(entry.number);
  }

  public getOrbCostForNextStar(currentStars: number): number | null {
    if (currentStars < 0 || currentStars >= 10) return null;
    return STAR_ORB_COSTS[currentStars] ?? null;
  }

  public getTotalOrbCostRange(fromStar: number, toStar: number): number {
    let sum = 0;
    for (let s = Math.max(0, fromStar); s < Math.min(10, toStar); s++) {
      sum += STAR_ORB_COSTS[s] ?? 0;
    }
    return sum;
  }

  public empowerStar(roosterId: string): { ok: boolean; newStars: number; isAstral: boolean } {
    const r = this.roster.get(roosterId);
    if (!r || r.stars >= 10) return { ok: false, newStars: r?.stars ?? 0, isAstral: false };
    const cost = this.getOrbCostForNextStar(r.stars);
    if (cost === null || r.orbsOwned < cost) {
      return { ok: false, newStars: r.stars, isAstral: r.stars > 5 };
    }
    r.orbsOwned -= cost;
    r.stars += 1;
    return { ok: true, newStars: r.stars, isAstral: r.stars >= 6 };
  }

  public refineEquipment(
    roosterId: string,
    setId: CordelEquipmentSetId,
    targetRefine: number,
  ): { refineLevel: number; visualUnlocked15: boolean } {
    const r = this.roster.get(roosterId);
    const clamped = Math.max(1, Math.min(15, Math.floor(targetRefine)));
    if (r) {
      r.equippedSet = setId;
      r.refineLevel = clamped;
    }
    return {
      refineLevel: clamped,
      visualUnlocked15: clamped === 15,
    };
  }

  public getAlbumProgress(totalBaseRoosters = 40): {
    discovered: number;
    total: number;
    completionPct: number;
  } {
    const discovered = this.discoveredNumbers.size;
    return {
      discovered,
      total: totalBaseRoosters,
      completionPct: Math.round((discovered / totalBaseRoosters) * 100),
    };
  }
}
