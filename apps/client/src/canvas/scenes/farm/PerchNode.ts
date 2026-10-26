import { RoamingRooster, type RoamingRoosterData } from './RoamingRooster.js';

export type PerchHabitatType =
  | 'Terreiro de Brasa'
  | 'Bosque da Mata'
  | 'Açude da Correnteza'
  | 'Altar do Sol'
  | 'Recanto da Lua'
  | 'Poleiro Armorial Universal';

export const PERCH_ALLOWED_ELEMENTS: Record<PerchHabitatType, readonly string[]> = {
  'Terreiro de Brasa': ['Brasa'],
  'Bosque da Mata': ['Mata'],
  'Açude da Correnteza': ['Correnteza'],
  'Altar do Sol': ['Sol'],
  'Recanto da Lua': ['Lua'],
  'Poleiro Armorial Universal': [
    'Brasa',
    'Mata',
    'Correnteza',
    'Sol',
    'Lua',
    'Armorial',
    'Assombracao',
    'Cangaco',
  ],
};

export interface PerchNodeConfig {
  perchId: string;
  habitatType: PerchHabitatType;
  level: number;
  isoX: number;
  isoY: number;
}

export class PerchNode {
  public readonly perchId: string;
  public readonly habitatType: PerchHabitatType;
  public level: number;
  public readonly isoX: number;
  public readonly isoY: number;
  public storedMilho = 0;
  private roosters: RoamingRooster[] = [];

  constructor(config: PerchNodeConfig) {
    this.perchId = config.perchId;
    this.habitatType = config.habitatType;
    this.level = Math.max(1, Math.min(8, config.level));
    this.isoX = config.isoX;
    this.isoY = config.isoY;
  }

  public getMaxRoosterSlots(): number {
    return Math.min(6, 1 + Math.floor(this.level / 2));
  }

  public getStorageVaultCap(): number {
    return this.level * 12_500;
  }

  public canAcceptElement(element: string): boolean {
    return PERCH_ALLOWED_ELEMENTS[this.habitatType].includes(element);
  }

  public addRooster(data: RoamingRoosterData): boolean {
    if (this.roosters.length >= this.getMaxRoosterSlots()) return false;
    if (!this.canAcceptElement(data.element)) return false;
    const rooster = new RoamingRooster(data, {
      minX: this.isoX - 40,
      maxX: this.isoX + 40,
      minY: this.isoY - 25,
      maxY: this.isoY + 25,
    });
    this.roosters.push(rooster);
    return true;
  }

  public tickProduction(minutesElapsed: number, getMultiplier: (el: string) => number): number {
    let produced = 0;
    for (const r of this.roosters) {
      const mult = getMultiplier(r.element);
      produced += r.computeEffectiveMilhoPerMin(mult) * minutesElapsed;
    }
    this.storedMilho = Math.min(
      this.getStorageVaultCap(),
      Math.floor(this.storedMilho + produced),
    );
    return this.storedMilho;
  }

  public harvestMilho(): number {
    const harvested = this.storedMilho;
    this.storedMilho = 0;
    return harvested;
  }

  public getRoosters(): readonly RoamingRooster[] {
    return this.roosters;
  }
}
