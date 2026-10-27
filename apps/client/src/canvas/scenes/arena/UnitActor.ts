import {
  assembleRoosterSkin, computeProceduralPose, computeRigBoneCoordinates,
  createMockSkeletonAdapter, defaultPose, interpolatePoses,
  type AssembledRoosterSkinResult, type RoosterAnimKey, type RoosterPoseTransforms,
  type RoosterRigCoordinates, type RoosterVisualDNA,
} from '../../spine/RoosterSpineAssembler.js';

export type ProceduralAnimState = 'idle' | 'attacking' | 'crowing' | 'hit' | 'ko';
export type ActorAnimState = ProceduralAnimState | 'basic_attack' | 'special_windup_flight' | 'special_cast' | 'interrupted';

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

export function mapAnimStateToClip(state: ActorAnimState): RoosterAnimKey {
  if (state === 'attacking' || state === 'basic_attack') return 'ATTACK_BICADA';
  if (state === 'crowing' || state === 'special_cast' || state === 'special_windup_flight') return 'SKILL_CANTO_SUPREMO';
  if (state === 'hit' || state === 'interrupted') return 'HIT_IMPACTO';
  if (state === 'ko') return 'KO_DERROTADO';
  return 'IDLE_GINGADA';
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
  public activeStatuses = new Set<string>();
  public readonly assembledSkin: AssembledRoosterSkinResult;
  public currentTick = 0;

  private _animState: ActorAnimState = 'idle';
  private animElapsedMs = 0;
  private stateDurationMs = 0;
  private transitionProgress = 1;
  private transitionDurationMs = 120;
  private previousPose: RoosterPoseTransforms = defaultPose();
  private currentPose: RoosterPoseTransforms = defaultPose();

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
    this.currentPose = computeProceduralPose('IDLE_GINGADA', 0);
  }

  public get animState(): ActorAnimState { return this._animState; }
  public set animState(value: ActorAnimState) {
    if (this._animState !== value) this.setAnimState(value);
  }

  public setAnimState(newState: ActorAnimState, durationMs = 0): void {
    if (this._animState === newState && this.stateDurationMs > 0) return;
    this.previousPose = { ...this.currentPose };
    this.transitionProgress = 0;
    this._animState = newState;
    this.animElapsedMs = 0;
    this.stateDurationMs = durationMs;
  }

  public update(deltaMs: number, currentTick?: number): void {
    if (currentTick !== undefined) this.currentTick = currentTick;
    this.animElapsedMs += deltaMs;
    if (this.transitionProgress < 1) {
      this.transitionProgress = Math.min(1, this.transitionProgress + deltaMs / this.transitionDurationMs);
    }
    if (this.stateDurationMs > 0 && this.animElapsedMs >= this.stateDurationMs && this._animState !== 'ko') {
      this.setAnimState('idle');
    }
    const clip = mapAnimStateToClip(this._animState);
    const progress = clip === 'IDLE_GINGADA'
      ? (this.animElapsedMs / 1000) % 1
      : this.stateDurationMs > 0
        ? Math.min(1, this.animElapsedMs / this.stateDurationMs)
        : Math.min(1, this.animElapsedMs / 400);
    const targetPose = computeProceduralPose(clip, progress);
    this.currentPose = this.transitionProgress < 1
      ? interpolatePoses(this.previousPose, targetPose, this.transitionProgress)
      : targetPose;
  }

  public getRigCoordinates(): RoosterRigCoordinates {
    const facing = this.team === 'A' ? 1 : -1;
    const isHit = this._animState === 'hit' || this._animState === 'interrupted';
    const progress = this.stateDurationMs > 0 ? Math.min(1, this.animElapsedMs / this.stateDurationMs) : 0;
    return computeRigBoneCoordinates(this.currentPose, this.x, this.y, facing, progress, isHit);
  }

  public getCurrentPose(): RoosterPoseTransforms { return this.currentPose; }
  public getTransitionProgress(): number { return this.transitionProgress; }
  public applyDamage(amount: number): void {
    const dmg = Math.max(0, Math.floor(amount));
    const absorbed = this.shield > 0 ? Math.min(this.shield, dmg) : 0;
    this.shield -= absorbed;
    this.currentVigor = Math.max(0, this.currentVigor - (dmg - absorbed));
    this.setAnimState(this.currentVigor === 0 ? 'ko' : 'hit', this.currentVigor === 0 ? 0 : 350);
  }
  public applyHeal(amount: number): void {
    if (this.currentVigor <= 0) return;
    this.currentVigor = Math.min(this.maxVigor, this.currentVigor + Math.max(0, Math.floor(amount)));
  }
  public updateCanto(newCanto: number): void {
    this.currentCanto = Math.max(0, Math.min(1000, Math.floor(newCanto)));
  }
  public startAttack(): void { if (this.currentVigor > 0) this.setAnimState('attacking', 350); }
  public startSpecialFlight(): void { if (this.currentVigor > 0) this.setAnimState('crowing', 600); }
  public triggerCortaCanto(): void { this.setAnimState('hit', 300); this.currentCanto = 500; }
  public completeSpecialCast(): void { this.setAnimState('crowing', 450); this.currentCanto = 0; }
  public addStatus(effect: string): void { this.activeStatuses.add(effect); }
  public removeStatus(effect: string): void { this.activeStatuses.delete(effect); }
  public isAlive(): boolean { return this.currentVigor > 0; }
}
