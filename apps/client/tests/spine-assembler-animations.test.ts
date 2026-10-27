import { describe, expect, it } from 'vitest';
import {
  ROOSTER_SLOTS,
  ROOSTER_RIG_OFFSETS,
  computeProceduralPose,
  computeRigBoneCoordinates,
  interpolatePoses,
  applyPoseToSkeletonAdapter,
  createMockSkeletonAdapter,
  drawRigCoordinates2D,
  type Canvas2DLineContext,
} from '../src/canvas/spine/RoosterSpineAssembler.js';
import { UnitActor, mapAnimStateToClip } from '../src/canvas/scenes/arena/UnitActor.js';

describe('RoosterSpineAssembler & Procedural Rig Animations', () => {
  it('validates 6-part modular master rig hierarchy and setup offsets', () => {
    expect(ROOSTER_SLOTS).toEqual(['tronco', 'cabeca', 'crista', 'asa_frente', 'cauda', 'canelas']);
    expect(ROOSTER_RIG_OFFSETS.canelas.y).toBe(0);
    expect(ROOSTER_RIG_OFFSETS.tronco.y).toBeLessThan(0);
    expect(ROOSTER_RIG_OFFSETS.cabeca.y).toBeLessThan(ROOSTER_RIG_OFFSETS.tronco.y);
    expect(ROOSTER_RIG_OFFSETS.crista.y).toBeLessThan(ROOSTER_RIG_OFFSETS.cabeca.y);
  });

  it('computes IDLE_GINGADA with sinusoidal breathing, comb sway and tail swing', () => {
    const p0 = computeProceduralPose('IDLE_GINGADA', 0);
    const p25 = computeProceduralPose('IDLE_GINGADA', 0.25);
    const p50 = computeProceduralPose('IDLE_GINGADA', 0.5);

    expect(p25.tronco.y).toBeGreaterThan(p0.tronco.y);
    expect(p25.tronco.scaleY).toBeGreaterThan(1);
    expect(p0.cauda.rotation).not.toBe(p25.cauda.rotation);
    expect(p25.crista.rotation).not.toBe(p50.crista.rotation);
    expect(p25.canelas.scaleY).toBeLessThanOrEqual(1);
  });

  it('computes ATTACK_BICADA with windup, forward lunge and elastic recoil', () => {
    const windup = computeProceduralPose('ATTACK_BICADA', 0.1);
    expect(windup.cabeca.x).toBeLessThan(0);

    const strike = computeProceduralPose('ATTACK_BICADA', 0.45);
    expect(strike.cabeca.x).toBeGreaterThan(30);
    expect(strike.cabeca.rotation).toBeGreaterThan(0.2);
    expect(strike.asa_frente.scaleX).toBeGreaterThan(1.2);

    const recoil = computeProceduralPose('ATTACK_BICADA', 0.85);
    expect(recoil.cabeca.x).toBeLessThan(strike.cabeca.x);
    expect(Math.abs(recoil.tronco.rotation)).toBeLessThanOrEqual(0.3);
  });

  it('computes SKILL_CANTO_SUPREMO with puffed chest, upward head and vibrating comb', () => {
    const poseA = computeProceduralPose('SKILL_CANTO_SUPREMO', 0.1);
    const poseB = computeProceduralPose('SKILL_CANTO_SUPREMO', 0.15);

    expect(poseA.tronco.scaleX).toBeGreaterThanOrEqual(1.18);
    expect(poseA.tronco.scaleY).toBeGreaterThanOrEqual(1.2);
    expect(poseA.cabeca.rotation).toBeLessThan(-0.4);
    expect(poseA.crista.rotation).not.toBe(poseB.crista.rotation);
    expect(poseA.asa_frente.rotation).toBeLessThan(0);
  });

  it('computes HIT_IMPACTO with elastic recoil and daze stars', () => {
    const hit = computeProceduralPose('HIT_IMPACTO', 0.2);
    expect(hit.tronco.x).toBeLessThan(0);
    expect(hit.cabeca.rotation).not.toBe(0);

    const coords = computeRigBoneCoordinates(hit, 100, 200, 1, 0.2, true);
    expect(coords.stars.length).toBe(3);
    expect(coords.stars.some((s) => s.alpha > 0)).toBe(true);
    expect(coords.bones.cabeca.worldX).toBeDefined();
  });

  it('interpolates poses smoothly and calculates 2D rig coordinates for Spine and Canvas', () => {
    const pA = computeProceduralPose('IDLE_GINGADA', 0);
    const pB = computeProceduralPose('ATTACK_BICADA', 0.4);
    const blended = interpolatePoses(pA, pB, 0.5);
    expect(blended.cabeca.x).toBeCloseTo((pA.cabeca.x + pB.cabeca.x) / 2, 4);

    const cA = computeRigBoneCoordinates(blended, 200, 300, 1);
    const cB = computeRigBoneCoordinates(blended, 200, 300, -1);
    expect(cA.facing).toBe(1);
    expect(cB.facing).toBe(-1);
    expect(cA.bones.cabeca.worldX).toBeGreaterThan(cB.bones.cabeca.worldX);

    const adapter = createMockSkeletonAdapter();
    applyPoseToSkeletonAdapter(adapter, blended);
    expect(adapter.currentPose).toBe(blended);

    const lines: string[] = [];
    const mockCtx: Canvas2DLineContext = {
      beginPath() { lines.push('begin'); },
      moveTo(x, y) { lines.push(`move:${Math.round(x)},${Math.round(y)}`); },
      lineTo(x, y) { lines.push(`line:${Math.round(x)},${Math.round(y)}`); },
      stroke() { lines.push('stroke'); },
      arc(x, y, r) { lines.push(`arc:${Math.round(x)},${Math.round(y)},${Math.round(r)}`); },
      fill() { lines.push('fill'); },
      fillStyle: '', strokeStyle: '', lineWidth: 0,
    };
    drawRigCoordinates2D(mockCtx, cA);
    expect(lines.length).toBeGreaterThan(5);
  });
});

describe('UnitActor Combat Animation State Machine', () => {
  function makeActor(team: 'A' | 'B' = 'A'): UnitActor {
    return new UnitActor({
      unitId: 'galo_teste', team, row: 'Frente', roosterClass: 'Tanque',
      maxVigor: 1000, x: 100, y: 150,
      visualDNA: {
        id: 'dna_1',
        parts: {
          tronco: 't_1', cabeca: 'h_1', crista: 'c_1',
          asa_frente: 'w_1', cauda: 'tl_1', canelas: 'l_1',
        },
      },
    });
  }

  it('maps combat animation states to procedural clips', () => {
    expect(mapAnimStateToClip('idle')).toBe('IDLE_GINGADA');
    expect(mapAnimStateToClip('attacking')).toBe('ATTACK_BICADA');
    expect(mapAnimStateToClip('basic_attack')).toBe('ATTACK_BICADA');
    expect(mapAnimStateToClip('crowing')).toBe('SKILL_CANTO_SUPREMO');
    expect(mapAnimStateToClip('special_cast')).toBe('SKILL_CANTO_SUPREMO');
    expect(mapAnimStateToClip('hit')).toBe('HIT_IMPACTO');
    expect(mapAnimStateToClip('ko')).toBe('KO_DERROTADO');
  });

  it('transitions smoothly with cross-fade interpolation across combat ticks', () => {
    const actor = makeActor('A');
    expect(actor.animState).toBe('idle');

    actor.startAttack();
    expect(actor.animState).toBe('attacking');
    expect(actor.getTransitionProgress()).toBe(0);

    actor.update(60, 10);
    expect(actor.currentTick).toBe(10);
    expect(actor.getTransitionProgress()).toBeCloseTo(0.5, 1);

    actor.update(60, 12);
    expect(actor.getTransitionProgress()).toBe(1);

    actor.update(300, 18);
    expect(actor.animState).toBe('idle');
  });

  it('triggers hit reaction and ko upon damage', () => {
    const actor = makeActor('B');
    actor.applyDamage(200);
    expect(actor.animState).toBe('hit');
    expect(actor.currentVigor).toBe(800);

    actor.update(360, 25);
    expect(actor.animState).toBe('idle');

    actor.applyDamage(9999);
    expect(actor.currentVigor).toBe(0);
    expect(actor.animState).toBe('ko');
    expect(actor.isAlive()).toBe(false);

    actor.update(500, 35);
    expect(actor.animState).toBe('ko');

    const rig = actor.getRigCoordinates();
    expect(rig.facing).toBe(-1);
    expect(rig.bones.canelas.worldX).toBeDefined();
  });
});
