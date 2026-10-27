export type LapidaryType = 'lapidacao_rapida' | 'lapidacao_profunda' | 'lapidacao_ancestral';

export interface LapidaryRecipe {
  readonly type: LapidaryType;
  readonly name: string;
  readonly durationMinutes: number;
  readonly durationMs: number;
  readonly cornCost: number;
  readonly guaranteedReward: string;
  readonly astralEssenceChance: number;
}

export const LAPIDARY_RECIPES: Record<LapidaryType, LapidaryRecipe> = {
  lapidacao_rapida: {
    type: 'lapidacao_rapida',
    name: 'Lapidação Rápida',
    durationMinutes: 240,
    durationMs: 240 * 60 * 1000,
    cornCost: 50_000,
    guaranteedReward: 'joia_elemental_rara',
    astralEssenceChance: 0.1,
  },
  lapidacao_profunda: {
    type: 'lapidacao_profunda',
    name: 'Lapidação Profunda',
    durationMinutes: 480,
    durationMs: 480 * 60 * 1000,
    cornCost: 120_000,
    guaranteedReward: 'joia_elemental_epica',
    astralEssenceChance: 0.35,
  },
  lapidacao_ancestral: {
    type: 'lapidacao_ancestral',
    name: 'Lapidação Ancestral',
    durationMinutes: 1440,
    durationMs: 1440 * 60 * 1000,
    cornCost: 300_000,
    guaranteedReward: 'joia_primordial_lendaria',
    astralEssenceChance: 1.0,
  },
} as const;

export const LAPIDARY_UNLOCK_SEDE = 8;
export const LAPIDARY_UNLOCK_NC = 22;
export const SLOT_UNLOCK_SEDE: Record<number, number> = { 1: 8, 2: 10, 3: 12 };

export function isLapidaryUnlocked(sedeLevel: number): boolean {
  return sedeLevel >= LAPIDARY_UNLOCK_SEDE;
}

export function getUnlockedSlots(sedeLevel: number): number[] {
  const slots: number[] = [];
  if (sedeLevel >= 8) slots.push(1);
  if (sedeLevel >= 10) slots.push(2);
  if (sedeLevel >= 12) slots.push(3);
  return slots;
}

export function isSlotUnlocked(slotId: number, sedeLevel: number): boolean {
  const req = SLOT_UNLOCK_SEDE[slotId];
  return req !== undefined && sedeLevel >= req;
}

export interface LapidaryJob {
  readonly slotId: number;
  readonly type: LapidaryType;
  readonly startTimeMs: number;
  readonly durationMs: number;
  readonly cornCost: number;
}

export interface StartLapidaryJobParams {
  slotId: number;
  type: LapidaryType;
  sedeLevel: number;
  nowMs?: number;
  availableCorn?: number;
  activeJobs?: readonly LapidaryJob[];
}

export interface StartLapidaryJobResult {
  job: LapidaryJob;
  remainingCorn?: number;
}

export function startLapidaryJob(params: StartLapidaryJobParams): StartLapidaryJobResult {
  const { slotId, type, sedeLevel } = params;
  if (!isLapidaryUnlocked(sedeLevel)) {
    throw new Error(`Lapidary locked. Requires Sede level ${LAPIDARY_UNLOCK_SEDE} (NC ${LAPIDARY_UNLOCK_NC}).`);
  }
  if (!isSlotUnlocked(slotId, sedeLevel)) {
    throw new Error(`Slot ${slotId} is locked. Requires Sede level ${SLOT_UNLOCK_SEDE[slotId] ?? 'N/A'}.`);
  }
  if (params.activeJobs?.some((j) => j.slotId === slotId)) {
    throw new Error(`Slot ${slotId} is already occupied.`);
  }
  const recipe = LAPIDARY_RECIPES[type];
  if (!recipe) throw new Error(`Invalid lapidary type: ${type}`);

  let remainingCorn: number | undefined;
  if (params.availableCorn !== undefined) {
    if (params.availableCorn < recipe.cornCost) {
      throw new Error(`Insufficient corn: requires ${recipe.cornCost}, but has ${params.availableCorn}.`);
    }
    remainingCorn = params.availableCorn - recipe.cornCost;
  }

  return {
    job: { slotId, type, startTimeMs: params.nowMs ?? Date.now(), durationMs: recipe.durationMs, cornCost: recipe.cornCost },
    remainingCorn,
  };
}

export interface LapidaryProgressResult {
  readonly slotId: number;
  readonly type: LapidaryType;
  readonly elapsedMs: number;
  readonly durationMs: number;
  readonly remainingMs: number;
  readonly progressPct: number;
  readonly isCompleted: boolean;
}

export function calculateLapidaryProgress(job: LapidaryJob, nowMs: number = Date.now()): LapidaryProgressResult {
  const elapsedMs = Math.max(0, nowMs - job.startTimeMs);
  const remainingMs = Math.max(0, job.durationMs - elapsedMs);
  const progressPct = Math.min(100, Math.max(0, (elapsedMs / job.durationMs) * 100));
  return { slotId: job.slotId, type: job.type, elapsedMs, durationMs: job.durationMs, remainingMs, progressPct, isCompleted: elapsedMs >= job.durationMs };
}

export interface LapidaryRewardResult {
  readonly slotId: number;
  readonly type: LapidaryType;
  readonly guaranteedItem: string;
  readonly astralEssenceCount: number;
  readonly gotAstralEssence: boolean;
}

export function claimLapidaryReward(
  job: LapidaryJob,
  nowMs: number = Date.now(),
  randomFn: () => number = Math.random
): LapidaryRewardResult {
  const progress = calculateLapidaryProgress(job, nowMs);
  if (!progress.isCompleted) {
    throw new Error(`Job in slot ${job.slotId} is still in progress (${progress.remainingMs}ms remaining).`);
  }
  const recipe = LAPIDARY_RECIPES[job.type];
  const roll = randomFn();
  const gotAstralEssence = recipe.astralEssenceChance >= 1.0 || roll < recipe.astralEssenceChance;
  return {
    slotId: job.slotId,
    type: job.type,
    guaranteedItem: recipe.guaranteedReward,
    astralEssenceCount: gotAstralEssence ? 1 : 0,
    gotAstralEssence,
  };
}
