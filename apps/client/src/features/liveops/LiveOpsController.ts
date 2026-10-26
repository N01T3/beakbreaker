import { HeroRaceTrackScene } from '../../canvas/scenes/board/HeroRaceTrackScene.js';
import { LabyrinthBoardScene } from '../../canvas/scenes/board/LabyrinthBoardScene.js';

export const CULTURAL_SEASONS_13: readonly string[] = [
  'T01: Verão no Sertão',
  'T02: Folia de Reis & Carnaval Armorial',
  'T03: Águas de Março no Velho Chico',
  'T04: Romaria de Padre Cícero',
  'T05: Colheita do Milho Novo',
  'T06: Arraial de São João',
  'T07: Ventos da Borborema',
  'T08: Lendas do Folclore & Assombração',
  'T09: Primavera da Caatinga',
  'T10: Feira de Caruaru & Xilogravura',
  'T11: Solstício do Cangaço',
  'T12: Natal de Reisado',
  'T13: Virada do Galo de Ouro',
] as const;

export class LiveOpsController {
  public readonly seasonDurationDays = 28;
  public readonly maxDivinePassLevels = 40;
  public readonly wheelCooldownMinutes = 120;
  private divinePassLevel = 1;
  private hasGoldenPass = false;
  private activeSeasonIndex = 0;
  private fridayLotteryTickets: string[] = [];

  constructor(
    public readonly heroRaceScene = new HeroRaceTrackScene(),
    public readonly labyrinthScene = new LabyrinthBoardScene(),
  ) {
    this.heroRaceScene.mount();
    this.labyrinthScene.mount();
  }

  public setActiveSeason(index: number): string {
    this.activeSeasonIndex = ((Math.floor(index) % 13) + 13) % 13;
    return CULTURAL_SEASONS_13[this.activeSeasonIndex]!;
  }

  public getActiveSeasonName(): string {
    return CULTURAL_SEASONS_13[this.activeSeasonIndex]!;
  }

  public advanceDivinePass(levels = 1): number {
    this.divinePassLevel = Math.max(
      1,
      Math.min(this.maxDivinePassLevels, this.divinePassLevel + Math.floor(levels)),
    );
    return this.divinePassLevel;
  }

  public getDivinePassLevel(): number {
    return this.divinePassLevel;
  }

  public unlockGoldenPass(): void {
    this.hasGoldenPass = true;
  }

  public isGoldenPassActive(): boolean {
    return this.hasGoldenPass;
  }

  public spinSaoJoaoWheel(minutesSinceLastSpin: number): {
    allowed: boolean;
    rewardType?: 'MILHO' | 'PENAS_DOURADAS' | 'ORBES' | 'FICHA_LABIRINTO';
    amount?: number;
  } {
    if (minutesSinceLastSpin < this.wheelCooldownMinutes) {
      return { allowed: false };
    }
    return {
      allowed: true,
      rewardType: 'PENAS_DOURADAS',
      amount: 25,
    };
  }

  public claimFridayLotteryTicket(dayIndex: number): string[] {
    if (dayIndex >= 1 && dayIndex <= 5 && this.fridayLotteryTickets.length < 5) {
      this.fridayLotteryTickets.push(`BILHETE_SEXTA_${dayIndex}`);
    }
    return [...this.fridayLotteryTickets];
  }
}
