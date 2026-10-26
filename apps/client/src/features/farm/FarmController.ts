import { IsoFarmScene, type SaintTowerId } from '../../canvas/scenes/farm/IsoFarmScene.js';

export interface PeaoWorkOrder {
  orderId: string;
  targetBuildingId: string;
  remainingMinutes: number;
}

export class FarmController {
  private peoesTotal = 1;
  private activeOrders: PeaoWorkOrder[] = [];
  private breederLevel = 1;
  private ancestralWorldUnlocked = false;

  constructor(private readonly farmScene = new IsoFarmScene()) {
    this.farmScene.mount();
  }

  public getScene(): IsoFarmScene {
    return this.farmScene;
  }

  public upgradeSede(nextLevel: number): { sedeLevel: number; maxRoosterNg: number } {
    this.farmScene.setSedeLevel(nextLevel);
    return {
      sedeLevel: this.farmScene.getSedeLevel(),
      maxRoosterNg: this.farmScene.getMaxRoosterNgCap(),
    };
  }

  public setBreederLevel(nc: number): boolean {
    this.breederLevel = Math.max(1, Math.min(60, Math.floor(nc)));
    if (this.breederLevel >= 22) {
      this.ancestralWorldUnlocked = true;
    }
    return this.ancestralWorldUnlocked;
  }

  public isSertaoAncestralUnlocked(): boolean {
    return this.ancestralWorldUnlocked;
  }

  public unlockPeao(totalPeoes: number): number {
    this.peoesTotal = Math.max(1, Math.min(4, Math.floor(totalPeoes)));
    return this.peoesTotal;
  }

  public startWorkOrder(order: PeaoWorkOrder): boolean {
    if (this.activeOrders.length >= this.peoesTotal) {
      return false;
    }
    this.activeOrders.push({ ...order });
    return true;
  }

  public getAvailablePeoes(): number {
    return Math.max(0, this.peoesTotal - this.activeOrders.length);
  }

  public activateSaintTower(towerId: SaintTowerId): SaintTowerId[] {
    this.farmScene.unlockSaintTower(towerId);
    return this.farmScene.getUnlockedSaintTowers();
  }

  public setHourOfDay(hour: number) {
    return this.farmScene.dayNight.setHour(hour);
  }

  public harvestAll(): number {
    return this.farmScene.harvestAllPerches();
  }
}
