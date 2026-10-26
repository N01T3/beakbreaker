export type TowerWeatherModifier =
  | 'Seca'
  | 'Chuva'
  | 'Noite'
  | 'Ventania'
  | 'SolAPino'
  | 'NeblinaDaSerra'
  | 'Muralha'
  | 'Assombracao'
  | 'FuriaDoCoronel'
  | 'FeNaSanfona'
  | 'Espinheiro'
  | 'FestaNoArraial';

export const TOWER_MODIFIERS_12: readonly TowerWeatherModifier[] = [
  'Seca',
  'Chuva',
  'Noite',
  'Ventania',
  'SolAPino',
  'NeblinaDaSerra',
  'Muralha',
  'Assombracao',
  'FuriaDoCoronel',
  'FeNaSanfona',
  'Espinheiro',
  'FestaNoArraial',
] as const;

export interface CampaignStageState {
  stageNumber: number; // 1..90
  chapterNumber: number; // 1..6 (15 fases por capítulo)
  starsEarned: 0 | 1 | 2 | 3;
  folegoCost: number;
}

export class PveController {
  public readonly maxCampaignStages = 90;
  public readonly maxTowerFloors = 100;
  private stageStars = new Map<number, 0 | 1 | 2 | 3>();
  private currentTowerFloor = 1;

  public getCampaignStageInfo(stageNumber: number): CampaignStageState {
    const clamped = Math.max(1, Math.min(this.maxCampaignStages, Math.floor(stageNumber)));
    const chapterNumber = Math.ceil(clamped / 15);
    const starsEarned = this.stageStars.get(clamped) ?? 0;
    return {
      stageNumber: clamped,
      chapterNumber,
      starsEarned,
      folegoCost: 6,
    };
  }

  public recordCampaignClear(stageNumber: number, survivorsCount: number): 1 | 2 | 3 {
    const clamped = Math.max(1, Math.min(this.maxCampaignStages, Math.floor(stageNumber)));
    const stars: 1 | 2 | 3 = survivorsCount >= 3 ? 3 : survivorsCount === 2 ? 2 : 1;
    const prev = this.stageStars.get(clamped) ?? 0;
    if (stars > prev) {
      this.stageStars.set(clamped, stars);
    }
    return stars;
  }

  public canSweepCampaignStage(stageNumber: number): boolean {
    return (this.stageStars.get(stageNumber) ?? 0) === 3;
  }

  public getTowerFloorSpec(floor: number): {
    floor: number;
    folegoCost: 0;
    modifier: TowerWeatherModifier;
    isBossMilestone: boolean;
  } {
    const clamped = Math.max(1, Math.min(this.maxTowerFloors, Math.floor(floor)));
    const modifier = TOWER_MODIFIERS_12[(clamped - 1) % TOWER_MODIFIERS_12.length]!;
    return {
      floor: clamped,
      folegoCost: 0, // A Torre do Mandacaru não consome Fôlego!
      modifier,
      isBossMilestone: clamped % 10 === 0,
    };
  }

  public advanceTowerFloor(): number {
    this.currentTowerFloor = Math.min(this.maxTowerFloors, this.currentTowerFloor + 1);
    return this.currentTowerFloor;
  }

  public getCurrentTowerFloor(): number {
    return this.currentTowerFloor;
  }
}
