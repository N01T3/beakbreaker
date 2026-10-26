import type { AssetBundleId } from '../../core/AssetLoader.js';
import type { GameScene } from '../../core/SceneRouter.js';
import { UnitActor, type UnitActorConfig } from './UnitActor.js';
import { XiloHitPopupPool } from './XiloHitPopup.js';

export type BattleSpeedMultiplier = 1 | 2 | 3;

export interface BattleEvent {
  tick: number;
  type: 'DAMAGE' | 'CRIT_DAMAGE' | 'HEAL' | 'CANTO_CHANGE' | 'SPECIAL_START' | 'INTERRUPT' | 'STATUS_APPLIED' | 'KO';
  sourceId?: string;
  targetId: string;
  value?: number;
  statusName?: string;
}

export class ArenaScene implements GameScene {
  public readonly key = 'arena' as const;
  public readonly requiredBundle: AssetBundleId = 'arena-sertaneja';
  public readonly popupPool = new XiloHitPopupPool(48);
  private actors = new Map<string, UnitActor>();
  private eventQueue: BattleEvent[] = [];
  private currentTick = 0;
  private speedMultiplier: BattleSpeedMultiplier = 1;
  private torcidaRemainingUses = 3;
  private torcidaActiveTicks = 0;

  public mount(): void {
    this.currentTick = 0;
    this.popupPool.releaseAll();
  }

  public unmount(): void {
    this.actors.clear();
    this.eventQueue = [];
    this.popupPool.releaseAll();
  }

  public spawnActors(configs: readonly UnitActorConfig[]): void {
    this.actors.clear();
    for (const cfg of configs) {
      if (this.actors.size >= 18) break;
      this.actors.set(cfg.unitId, new UnitActor(cfg));
    }
  }

  public enqueueEvents(events: readonly BattleEvent[]): void {
    this.eventQueue.push(...events);
    this.eventQueue.sort((a, b) => a.tick - b.tick);
  }

  public setSpeed(multiplier: BattleSpeedMultiplier): void {
    this.speedMultiplier = multiplier;
  }

  public getSpeed(): BattleSpeedMultiplier {
    return this.speedMultiplier;
  }

  public triggerTorcida(): boolean {
    if (this.torcidaRemainingUses <= 0) return false;
    this.torcidaRemainingUses -= 1;
    this.torcidaActiveTicks = 100;
    for (const actor of this.actors.values()) {
      if (actor.team === 'A' && actor.isAlive()) {
        actor.updateCanto(actor.currentCanto + 80);
      }
    }
    return true;
  }

  public previewTrioSynergies(classes: readonly string[]): string[] {
    if (classes.length === 3 && classes[0] === classes[1] && classes[1] === classes[2]) {
      return [];
    }
    const set = new Set(classes);
    const active: string[] = [];
    if (set.has('Tanque') && set.has('Suporte')) active.push('Muralha Viva');
    if (set.has('Tanque') && set.has('Bruiser')) active.push('Linha de Frente');
    if (set.has('Assassino') && set.has('Controle')) active.push('Emboscada');
    if (set.has('Atirador') && set.has('Bruiser')) active.push('Fogo Cruzado');
    if (set.has('Assassino') && set.has('Atirador')) active.push('Caçada');
    if (set.has('Suporte') && set.has('Controle')) active.push('Coro do Arraial');
    if (set.size === 3) active.push('Bando Completo');
    return active;
  }

  public update(deltaMs: number): void {
    const baseTicks = Math.max(1, Math.floor(deltaMs / 50));
    const ticksToAdvance = baseTicks * this.speedMultiplier;
    for (let step = 0; step < ticksToAdvance; step++) {
      this.currentTick = Math.min(1800, this.currentTick + 1);
      if (this.torcidaActiveTicks > 0) this.torcidaActiveTicks -= 1;
      this.consumeCurrentTickEvents();
      this.popupPool.tickAll();
    }
  }

  private consumeCurrentTickEvents(): void {
    while (this.eventQueue.length > 0 && this.eventQueue[0]!.tick <= this.currentTick) {
      const ev = this.eventQueue.shift()!;
      const actor = this.actors.get(ev.targetId);
      if (!actor) continue;
      if (ev.type === 'DAMAGE') {
        actor.applyDamage(ev.value ?? 0);
        this.popupPool.spawn('HIT', ev.value ?? 0, actor.x, actor.y);
      } else if (ev.type === 'CRIT_DAMAGE') {
        actor.applyDamage(ev.value ?? 0);
        this.popupPool.spawn('CRIT', ev.value ?? 0, actor.x, actor.y);
      } else if (ev.type === 'HEAL') {
        actor.applyHeal(ev.value ?? 0);
        this.popupPool.spawn('HEAL', ev.value ?? 0, actor.x, actor.y);
      } else if (ev.type === 'CANTO_CHANGE') {
        actor.updateCanto(ev.value ?? 0);
      } else if (ev.type === 'SPECIAL_START') {
        actor.startSpecialFlight();
      } else if (ev.type === 'INTERRUPT') {
        actor.triggerCortaCanto();
        this.popupPool.spawn('INTERRUPT', 0, actor.x, actor.y);
      } else if (ev.type === 'STATUS_APPLIED' && ev.statusName) {
        actor.addStatus(ev.statusName);
        this.popupPool.spawn('STATUS', 0, actor.x, actor.y, ev.statusName);
      }
    }
  }

  public getActor(unitId: string): UnitActor | undefined {
    return this.actors.get(unitId);
  }

  public getActorCount(): number {
    return this.actors.size;
  }

  public getCurrentTick(): number {
    return this.currentTick;
  }

  public getDrawCallEstimate(): number {
    return Math.min(22, 6 + Math.ceil(this.actors.size * 0.6));
  }
}
