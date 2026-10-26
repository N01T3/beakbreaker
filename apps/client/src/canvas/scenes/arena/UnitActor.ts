import {
  assembleRoosterSkin,
  createMockSkeletonAdapter,
  type AssembledRoosterSkinResult,
  type RoosterVisualDNA,
} from '../../spine/RoosterSpineAssembler.js';

export type ActorAnimState =
  | 'idle'
  | 'basic_attack'
  | 'special_windup_flight'
  | 'special_cast'
  | 'hit'
  | 'interrupted'
  | 'ko';

export interface UnitActorConfig {
  unitId: string;
  team: 'A' | 'B';
  row: 'Frente' | 'Tras';
  roosterClass: string;
  maxVigor: number;
  x: number;
  y: number;
  visualDNA: RoosterVisualDNA;
}

export class UnitActor {
  public readonly unitId: string;
  public readonly team: 'A' | 'B';
  public readonly row: 'Frente' | 'Tras';
  public readonly roosterClass: string;
  public readonly x: number;
  public readonly y: number;
  public maxVigor: number;
  public currentVigor: number;
  public currentCanto = 0;
  public shield = 0;
  public animState: ActorAnimState = 'idle';
  public activeStatuses = new Set<string>();
  public readonly assembledSkin: AssembledRoosterSkinResult;

  constructor(config: UnitActorConfig) {
    this.unitId = config.unitId;
    this.team = config.team;
    this.row = config.row;
    this.roosterClass = config.roosterClass;
    this.maxVigor = Math.max(1, config.maxVigor);
    this.currentVigor = this.maxVigor;
    this.x = config.x;
    this.y = config.y;
    const skeleton = createMockSkeletonAdapter();
    this.assembledSkin = assembleRoosterSkin(skeleton, config.visualDNA);
  }

  public applyDamage(amount: number): void {
    const dmg = Math.max(0, Math.floor(amount));
    if (this.shield > 0) {
      const absorbed = Math.min(this.shield, dmg);
      this.shield -= absorbed;
      this.currentVigor = Math.max(0, this.currentVigor - (dmg - absorbed));
    } else {
      this.currentVigor = Math.max(0, this.currentVigor - dmg);
    }
    this.animState = this.currentVigor === 0 ? 'ko' : 'hit';
  }

  public applyHeal(amount: number): void {
    if (this.currentVigor <= 0) return;
    this.currentVigor = Math.min(
      this.maxVigor,
      this.currentVigor + Math.max(0, Math.floor(amount)),
    );
  }

  public updateCanto(newCanto: number): void {
    this.currentCanto = Math.max(0, Math.min(1000, Math.floor(newCanto)));
  }

  public startSpecialFlight(): void {
    if (this.currentVigor <= 0) return;
    this.animState = 'special_windup_flight';
  }

  public triggerCortaCanto(): void {
    this.animState = 'interrupted';
    this.currentCanto = 500;
  }

  public completeSpecialCast(): void {
    this.animState = 'special_cast';
    this.currentCanto = 0;
  }

  public addStatus(effect: string): void {
    this.activeStatuses.add(effect);
  }

  public removeStatus(effect: string): void {
    this.activeStatuses.delete(effect);
  }

  public isAlive(): boolean {
    return this.currentVigor > 0;
  }
}
