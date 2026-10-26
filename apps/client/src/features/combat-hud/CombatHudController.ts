import {
  ArenaScene,
  type BattleEvent,
  type BattleSpeedMultiplier,
} from '../../canvas/scenes/arena/ArenaScene.js';

export interface CombatCardHudItem {
  unitId: string;
  name: string;
  roosterClass: string;
  vigor: number;
  maxVigor: number;
  canto: number;
  isGlowingReady: boolean;
  canInterruptFlight: boolean;
}

export class CombatHudController {
  private autoBattleEnabled = false;

  constructor(private readonly arenaScene = new ArenaScene()) {
    this.arenaScene.mount();
  }

  public getArenaScene(): ArenaScene {
    return this.arenaScene;
  }

  public cycleSpeed(): BattleSpeedMultiplier {
    const cur = this.arenaScene.getSpeed();
    const next: BattleSpeedMultiplier = cur === 1 ? 2 : cur === 2 ? 3 : 1;
    this.arenaScene.setSpeed(next);
    return next;
  }

  public setSpeed(speed: BattleSpeedMultiplier): void {
    this.arenaScene.setSpeed(speed);
  }

  public toggleAutoBattle(): boolean {
    this.autoBattleEnabled = !this.autoBattleEnabled;
    return this.autoBattleEnabled;
  }

  public isAutoBattle(): boolean {
    return this.autoBattleEnabled;
  }

  public pressTorcidaButton(): boolean {
    return this.arenaScene.triggerTorcida();
  }

  public computeActiveSynergies(classes: readonly string[]): string[] {
    return this.arenaScene.previewTrioSynergies(classes);
  }

  public dispatchInterrupt(attackerId: string, flyingTargetId: string, tick: number): BattleEvent {
    const ev: BattleEvent = {
      tick,
      type: 'INTERRUPT',
      sourceId: attackerId,
      targetId: flyingTargetId,
    };
    this.arenaScene.enqueueEvents([ev]);
    return ev;
  }

  public buildCardState(
    unitId: string,
    name: string,
    roosterClass: string,
    enemyFlying: boolean,
  ): CombatCardHudItem | null {
    const actor = this.arenaScene.getActor(unitId);
    if (!actor) return null;
    const isGlowingReady = actor.currentCanto >= 1000 && actor.isAlive();
    return {
      unitId,
      name,
      roosterClass,
      vigor: actor.currentVigor,
      maxVigor: actor.maxVigor,
      canto: actor.currentCanto,
      isGlowingReady,
      canInterruptFlight: isGlowingReady && enemyFlying,
    };
  }
}
