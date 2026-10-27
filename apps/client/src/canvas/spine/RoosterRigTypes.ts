export const ROOSTER_SLOTS = [
  'tronco',
  'cabeca',
  'crista',
  'asa_frente',
  'cauda',
  'canelas',
] as const;

export type RoosterSlotKey = (typeof ROOSTER_SLOTS)[number];

export type RoosterAnimKey =
  | 'IDLE_GINGADA'
  | 'ATTACK_BICADA'
  | 'SKILL_CANTO_SUPREMO'
  | 'HIT_IMPACTO'
  | 'KO_DERROTADO';

export interface BoneTransform {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

export type RoosterPoseTransforms = Record<RoosterSlotKey, BoneTransform>;

export interface DazeStar {
  x: number;
  y: number;
  alpha: number;
  size: number;
}

export interface RigBonePoint {
  slot: RoosterSlotKey;
  worldX: number;
  worldY: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

export interface RoosterRigCoordinates {
  originX: number;
  originY: number;
  facing: number;
  bones: Record<RoosterSlotKey, RigBonePoint>;
  stars: DazeStar[];
}

export const ROOSTER_RIG_OFFSETS: Record<RoosterSlotKey, { x: number; y: number }> = {
  canelas: { x: 0, y: 0 },
  tronco: { x: 0, y: -36 },
  cabeca: { x: 18, y: -64 },
  crista: { x: 20, y: -84 },
  asa_frente: { x: -4, y: -38 },
  cauda: { x: -28, y: -48 },
};

export function defaultPose(): RoosterPoseTransforms {
  const p = {} as RoosterPoseTransforms;
  for (const s of ROOSTER_SLOTS) {
    p[s] = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };
  }
  return p;
}

export function lerpTransform(a: BoneTransform, b: BoneTransform, t: number): BoneTransform {
  const c = Math.max(0, Math.min(1, t));
  return {
    x: a.x + (b.x - a.x) * c,
    y: a.y + (b.y - a.y) * c,
    rotation: a.rotation + (b.rotation - a.rotation) * c,
    scaleX: a.scaleX + (b.scaleX - a.scaleX) * c,
    scaleY: a.scaleY + (b.scaleY - a.scaleY) * c,
  };
}

export function interpolatePoses(
  a: RoosterPoseTransforms,
  b: RoosterPoseTransforms,
  t: number,
): RoosterPoseTransforms {
  const result = {} as RoosterPoseTransforms;
  for (const s of ROOSTER_SLOTS) {
    result[s] = lerpTransform(a[s], b[s], t);
  }
  return result;
}

export interface Canvas2DLineContext {
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  stroke(): void;
  arc(x: number, y: number, r: number, startAngle: number, endAngle: number): void;
  fill(): void;
  fillStyle: string | unknown;
  strokeStyle: string | unknown;
  lineWidth: number;
}

export function drawRigCoordinates2D(
  ctx: Canvas2DLineContext,
  coords: RoosterRigCoordinates,
  colorHex = '#1B1B1B',
): void {
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(coords.bones.canelas.worldX, coords.bones.canelas.worldY);
  ctx.lineTo(coords.bones.tronco.worldX, coords.bones.tronco.worldY);
  ctx.lineTo(coords.bones.cabeca.worldX, coords.bones.cabeca.worldY);
  ctx.lineTo(coords.bones.crista.worldX, coords.bones.crista.worldY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(coords.bones.tronco.worldX, coords.bones.tronco.worldY);
  ctx.lineTo(coords.bones.cauda.worldX, coords.bones.cauda.worldY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(coords.bones.tronco.worldX, coords.bones.tronco.worldY);
  ctx.lineTo(coords.bones.asa_frente.worldX, coords.bones.asa_frente.worldY);
  ctx.stroke();

  for (const star of coords.stars) {
    if (star.alpha <= 0) continue;
    ctx.fillStyle = '#F4B400';
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  }
}
