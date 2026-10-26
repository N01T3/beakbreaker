import type { AssetBundleId } from '../../core/AssetLoader.js';
import type { GameScene } from '../../core/SceneRouter.js';
import { DayNightFilter } from './DayNightFilter.js';
import { PerchNode, type PerchNodeConfig } from './PerchNode.js';

export type SaintTowerId =
  | 'Torre de São Jorge'
  | 'Torre de Padre Cícero'
  | 'Torre de São João'
  | 'Torre de Santa Luzia';

export interface PredatorSpawn {
  id: string;
  species: 'Raposa do Mato' | 'Carcará' | 'Cobra Coral' | 'Jaguatirica';
  isoX: number;
  isoY: number;
  rewardMilho: number;
}

export class IsoFarmScene implements GameScene {
  public readonly key = 'farm' as const;
  public readonly requiredBundle: AssetBundleId = 'iso-farm';
  public readonly dayNight = new DayNightFilter(10);
  private sedeLevel = 1;
  private perches = new Map<string, PerchNode>();
  private unlockedSaintTowers = new Set<SaintTowerId>();
  private activePredators = new Map<string, PredatorSpawn>();

  public mount(): void {
    if (this.perches.size === 0) {
      this.registerPerch({
        perchId: 'perch_brasa_1',
        habitatType: 'Terreiro de Brasa',
        level: 1,
        isoX: 200,
        isoY: 160,
      });
    }
  }

  public unmount(): void {
    this.activePredators.clear();
  }

  public setSedeLevel(level: number): void {
    this.sedeLevel = Math.max(1, Math.min(12, Math.floor(level)));
  }

  public getSedeLevel(): number {
    return this.sedeLevel;
  }

  public getMaxRoosterNgCap(): number {
    return this.sedeLevel * 5;
  }

  public registerPerch(config: PerchNodeConfig): PerchNode {
    const node = new PerchNode(config);
    this.perches.set(config.perchId, node);
    return node;
  }

  public getPerch(perchId: string): PerchNode | undefined {
    return this.perches.get(perchId);
  }

  public getAllPerches(): PerchNode[] {
    return Array.from(this.perches.values());
  }

  public unlockSaintTower(towerId: SaintTowerId): void {
    this.unlockedSaintTowers.add(towerId);
  }

  public getUnlockedSaintTowers(): SaintTowerId[] {
    return Array.from(this.unlockedSaintTowers);
  }

  public spawnPredator(predator: PredatorSpawn): void {
    this.activePredators.set(predator.id, predator);
  }

  public repelPredator(predatorId: string): number {
    const pred = this.activePredators.get(predatorId);
    if (!pred) return 0;
    this.activePredators.delete(predatorId);
    return pred.rewardMilho;
  }

  public harvestAllPerches(): number {
    let total = 0;
    const ciceroBonus = this.unlockedSaintTowers.has('Torre de Padre Cícero') ? 1.15 : 1.0;
    for (const perch of this.perches.values()) {
      total += Math.floor(perch.harvestMilho() * ciceroBonus);
    }
    return total;
  }

  public update(deltaMs: number): void {
    for (const perch of this.perches.values()) {
      for (const rooster of perch.getRoosters()) {
        rooster.update(deltaMs);
      }
    }
  }

  public getDrawCallEstimate(): number {
    return Math.min(20, 7 + this.perches.size);
  }
}
