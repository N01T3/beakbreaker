import {
  ROOSTER_RIG_OFFSETS, defaultPose, type DazeStar, type RigBonePoint,
  type RoosterAnimKey, type RoosterPoseTransforms, type RoosterRigCoordinates, type RoosterSlotKey,
} from './RoosterRigTypes.js';

export function computeProceduralPose(key: RoosterAnimKey, progress: number): RoosterPoseTransforms {
  const pose = defaultPose();
  const prog = Math.max(0, progress);

  if (key === 'IDLE_GINGADA') {
    const p = (prog % 1) * Math.PI * 2, sP = Math.sin(p), cP = Math.cos(p);
    pose.tronco = { x: cP * 1.5, y: sP * 3, rotation: sP * 0.04, scaleX: 1 - sP * 0.02, scaleY: 1 + sP * 0.03 };
    pose.cabeca = { x: cP * 2, y: sP * 2, rotation: cP * 0.06, scaleX: 1, scaleY: 1 };
    pose.crista = { x: Math.sin(p - 0.4) * 1.5, y: Math.cos(p - 0.4) * 1.5, rotation: Math.sin(p - 0.6) * 0.12, scaleX: 1, scaleY: 1 };
    pose.asa_frente = { x: 0, y: sP * 1.2, rotation: Math.sin(p + 0.5) * 0.06, scaleX: 1 + sP * 0.03, scaleY: 1 };
    pose.cauda = { x: -Math.cos(p * 0.8) * 2, y: -sP * 2, rotation: Math.cos(p * 0.8) * 0.15, scaleX: 1, scaleY: 1 };
    pose.canelas = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 - Math.max(0, sP) * 0.03 };
  } else if (key === 'ATTACK_BICADA') {
    const p = Math.min(1, prog);
    if (p < 0.2) {
      const t = p / 0.2;
      pose.tronco = { x: -10 * t, y: 0, rotation: -0.08 * t, scaleX: 1, scaleY: 1 };
      pose.cabeca = { x: -15 * t, y: -4 * t, rotation: -0.12 * t, scaleX: 1, scaleY: 1 };
      pose.asa_frente = { x: 0, y: 0, rotation: -0.25 * t, scaleX: 1 + 0.1 * t, scaleY: 1 };
    } else if (p < 0.5) {
      const t = (p - 0.2) / 0.3;
      pose.tronco = { x: -10 + 35 * t, y: 2 * t, rotation: -0.08 + 0.22 * t, scaleX: 1, scaleY: 1 };
      pose.cabeca = { x: -15 + 65 * t, y: -4 + 18 * t, rotation: -0.12 + 0.48 * t, scaleX: 1.05, scaleY: 1 };
      pose.crista = { x: 2, y: 0, rotation: -0.3 * (1 - t), scaleX: 1, scaleY: 1 };
      pose.asa_frente = { x: -4 * t, y: -6 * t, rotation: -0.65 * t, scaleX: 1 + 0.35 * t, scaleY: 1 + 0.2 * t };
      pose.cauda = { x: -2 * t, y: -3 * t, rotation: 0.25 * t, scaleX: 1, scaleY: 1 };
      pose.canelas = { x: 8 * t, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };
    } else {
      const t = (p - 0.5) / 0.5, decay = 1 - t, elastic = Math.cos(t * Math.PI * 3.5) * decay;
      pose.tronco = { x: 25 * elastic, y: 0, rotation: 0.14 * elastic, scaleX: 1, scaleY: 1 };
      pose.cabeca = { x: 50 * elastic, y: 14 * elastic, rotation: 0.36 * elastic, scaleX: 1, scaleY: 1 };
      pose.crista = { x: 0, y: 0, rotation: -0.15 * elastic, scaleX: 1, scaleY: 1 };
      pose.asa_frente = { x: 0, y: 0, rotation: -0.65 * decay, scaleX: 1 + 0.35 * decay, scaleY: 1 + 0.2 * decay };
      pose.cauda = { x: 0, y: 0, rotation: 0.25 * elastic, scaleX: 1, scaleY: 1 };
      pose.canelas = { x: 8 * elastic, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };
    }
  } else if (key === 'SKILL_CANTO_SUPREMO') {
    const sF = Math.sin(prog * Math.PI * 24);
    pose.tronco = { x: -5, y: -8, rotation: -0.22, scaleX: 1.2, scaleY: 1.25 };
    pose.cabeca = { x: -8, y: -20, rotation: -0.52, scaleX: 1.1, scaleY: 1.15 };
    pose.crista = { x: sF * 1.2, y: -2, rotation: -0.35 + sF * 0.22, scaleX: 1.1 + Math.abs(sF) * 0.15, scaleY: 1.25 + Math.abs(sF) * 0.2 };
    pose.asa_frente = { x: -2, y: -6, rotation: -0.45 + sF * 0.05, scaleX: 1.25, scaleY: 1.2 };
    pose.cauda = { x: -4, y: 0, rotation: 0.32, scaleX: 1.1, scaleY: 1.2 };
    pose.canelas = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1.08 };
  } else if (key === 'HIT_IMPACTO') {
    const p = Math.min(1, prog), decay = 1 - p, elastic = Math.cos(p * Math.PI * 4) * decay;
    pose.tronco = { x: -24 * decay, y: 4 * decay, rotation: 0.28 * elastic, scaleX: 1, scaleY: 1 };
    pose.cabeca = { x: -20 * decay, y: 2 * decay, rotation: 0.38 * elastic, scaleX: 1, scaleY: 1 };
    pose.crista = { x: -2 * decay, y: 0, rotation: 0.45 * decay, scaleX: 1, scaleY: 1 };
    pose.asa_frente = { x: -2 * decay, y: 0, rotation: 0.3 * elastic, scaleX: 0.9, scaleY: 1 };
    pose.cauda = { x: 2 * decay, y: 0, rotation: -0.3 * decay, scaleX: 1, scaleY: 1 };
    pose.canelas = { x: -8 * decay, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };
  } else if (key === 'KO_DERROTADO') {
    pose.tronco = { x: -30, y: 20, rotation: Math.PI * 0.45, scaleX: 1, scaleY: 0.85 };
    pose.cabeca = { x: -16, y: 24, rotation: 0.2, scaleX: 1, scaleY: 0.9 };
    pose.crista = { x: 0, y: 0, rotation: -0.4, scaleX: 0.8, scaleY: 0.7 };
    pose.asa_frente = { x: 0, y: 0, rotation: 0.6, scaleX: 0.9, scaleY: 1 };
    pose.cauda = { x: 0, y: 0, rotation: -0.35, scaleX: 1, scaleY: 1 };
    pose.canelas = { x: -20, y: 4, rotation: -0.5, scaleX: 1, scaleY: 1 };
  }
  return pose;
}

export function computeRigBoneCoordinates(
  pose: RoosterPoseTransforms,
  originX: number,
  originY: number,
  facing = 1,
  progress = 0,
  includeStars = false,
): RoosterRigCoordinates {
  const bones = {} as Record<RoosterSlotKey, RigBonePoint>;
  const f = facing >= 0 ? 1 : -1;

  const bCan = pose.canelas;
  bones.canelas = {
    slot: 'canelas',
    worldX: originX + (ROOSTER_RIG_OFFSETS.canelas.x + bCan.x) * f,
    worldY: originY + ROOSTER_RIG_OFFSETS.canelas.y + bCan.y,
    rotation: bCan.rotation * f,
    scaleX: bCan.scaleX,
    scaleY: bCan.scaleY,
  };

  const bTr = pose.tronco;
  const tX = originX + (ROOSTER_RIG_OFFSETS.tronco.x + bTr.x) * f;
  const tY = originY + ROOSTER_RIG_OFFSETS.tronco.y + bTr.y;
  const tRot = bTr.rotation * f;
  bones.tronco = { slot: 'tronco', worldX: tX, worldY: tY, rotation: tRot, scaleX: bTr.scaleX, scaleY: bTr.scaleY };

  const childTronco = (s: 'cabeca' | 'asa_frente' | 'cauda'): RigBonePoint => {
    const b = pose[s];
    const off = ROOSTER_RIG_OFFSETS[s];
    const dx = (off.x - ROOSTER_RIG_OFFSETS.tronco.x + b.x) * f;
    const dy = off.y - ROOSTER_RIG_OFFSETS.tronco.y + b.y;
    const cosT = Math.cos(tRot);
    const sinT = Math.sin(tRot);
    return {
      slot: s,
      worldX: tX + (dx * cosT - dy * sinT),
      worldY: tY + (dx * sinT + dy * cosT),
      rotation: tRot + b.rotation * f,
      scaleX: b.scaleX,
      scaleY: b.scaleY,
    };
  };

  bones.cabeca = childTronco('cabeca');
  bones.asa_frente = childTronco('asa_frente');
  bones.cauda = childTronco('cauda');

  const bCr = pose.crista, cX = bones.cabeca.worldX, cY = bones.cabeca.worldY, cRot = bones.cabeca.rotation;
  const cdx = (ROOSTER_RIG_OFFSETS.crista.x - ROOSTER_RIG_OFFSETS.cabeca.x + bCr.x) * f;
  const cdy = ROOSTER_RIG_OFFSETS.crista.y - ROOSTER_RIG_OFFSETS.cabeca.y + bCr.y;
  const cosC = Math.cos(cRot), sinC = Math.sin(cRot);
  bones.crista = {
    slot: 'crista', worldX: cX + (cdx * cosC - cdy * sinC), worldY: cY + (cdx * sinC + cdy * cosC),
    rotation: cRot + bCr.rotation * f, scaleX: bCr.scaleX, scaleY: bCr.scaleY,
  };

  const stars: DazeStar[] = [];
  if (includeStars) {
    const starCount = 3, hX = bones.cabeca.worldX, hY = bones.cabeca.worldY;
    const alpha = Math.max(0, Math.min(1, Math.sin(progress * Math.PI) * 1.2));
    for (let i = 0; i < starCount; i++) {
      const angle = progress * Math.PI * 6 + (i * Math.PI * 2) / starCount;
      stars.push({ x: hX + Math.cos(angle) * 22, y: hY - 14 + Math.sin(angle) * 8, alpha, size: 4 + Math.sin(angle) * 1.5 });
    }
  }

  return { originX, originY, facing: f, bones, stars };
}
