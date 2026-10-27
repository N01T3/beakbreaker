export const SEDE_BASE_NG_MULTIPLIER = 5;
export const ASTRAL_STAR_THRESHOLD = 5;
export const ASTRAL_BONUS_PER_STAR = 2;
export const TRAINING_CORN_PER_MINUTE_FACTOR = 10;
export const TRAINING_MINUTES_PER_NG_FACTOR = 12;

export function calculateAstralNgBonus(stars: number = 0): number {
  const clampedStars = Math.max(0, Math.min(10, Math.floor(stars)));
  const astralStars = Math.max(0, clampedStars - ASTRAL_STAR_THRESHOLD);
  return astralStars * ASTRAL_BONUS_PER_STAR;
}

export function calculateMaxNg(sedeLevel: number, stars: number = 0): number {
  if (sedeLevel < 1 || sedeLevel > 12 || !Number.isInteger(sedeLevel)) {
    throw new Error(
      `Invalid Sede level: ${sedeLevel}. Must be an integer between 1 and 12.`
    );
  }
  const astralBonus = calculateAstralNgBonus(stars);
  return sedeLevel * SEDE_BASE_NG_MULTIPLIER + astralBonus;
}

export function calculateCornPerMinute(currentNg: number): number {
  const ng = Math.max(1, Math.floor(currentNg));
  return TRAINING_CORN_PER_MINUTE_FACTOR * ng;
}

export function calculateMinutesToLevelUp(currentNg: number): number {
  const ng = Math.max(1, Math.floor(currentNg));
  return ng * TRAINING_MINUTES_PER_NG_FACTOR;
}

export function calculateCornToLevelUp(currentNg: number): number {
  return calculateCornPerMinute(currentNg) * calculateMinutesToLevelUp(currentNg);
}

export type TrainingStoppedReason = 'COMPLETED_CAP' | 'OUT_OF_TIME' | 'OUT_OF_CORN';

export interface TrainingProgressInput {
  currentNg: number;
  stars?: number;
  sedeLevel: number;
  startTimeMs: number;
  nowMs: number;
  availableCorn: number;
  currentProgressMinutes?: number;
  elapsedMinutes?: number;
}

export interface TrainingProgressResult {
  initialNg: number;
  finalNg: number;
  levelsGained: number;
  maxNg: number;
  cornConsumed: number;
  remainingCorn: number;
  totalMinutesTrained: number;
  currentProgressMinutes: number;
  minutesToNextLevel: number;
  isCapped: boolean;
  stoppedReason: TrainingStoppedReason;
}

export function calculateTrainingProgress(
  input: TrainingProgressInput
): TrainingProgressResult {
  const maxNg = calculateMaxNg(input.sedeLevel, input.stars ?? 0);
  let currentNg = Math.max(1, Math.floor(input.currentNg));
  const initialNg = currentNg;
  let remainingCorn = Math.max(0, Math.floor(input.availableCorn));
  let progressMinutes = Math.max(0, Math.floor(input.currentProgressMinutes ?? 0));
  let cornConsumed = 0;
  let totalMinutesTrained = 0;

  const totalAvailableMinutes =
    input.elapsedMinutes !== undefined
      ? Math.max(0, Math.floor(input.elapsedMinutes))
      : Math.max(0, Math.floor((input.nowMs - input.startTimeMs) / 60_000));

  let minutesLeft = totalAvailableMinutes;

  if (currentNg >= maxNg) {
    return {
      initialNg,
      finalNg: currentNg,
      levelsGained: 0,
      maxNg,
      cornConsumed: 0,
      remainingCorn,
      totalMinutesTrained: 0,
      currentProgressMinutes: 0,
      minutesToNextLevel: calculateMinutesToLevelUp(currentNg),
      isCapped: true,
      stoppedReason: 'COMPLETED_CAP',
    };
  }

  let stoppedReason: TrainingStoppedReason = 'OUT_OF_TIME';

  while (currentNg < maxNg && minutesLeft > 0) {
    const rate = calculateCornPerMinute(currentNg);
    const neededForLevel = calculateMinutesToLevelUp(currentNg);
    const minutesRemainingForLevel = neededForLevel - progressMinutes;

    const affordableMinutes = Math.floor(remainingCorn / rate);
    if (affordableMinutes === 0) {
      stoppedReason = 'OUT_OF_CORN';
      break;
    }

    const minutesToAdvance = Math.min(
      minutesLeft,
      minutesRemainingForLevel,
      affordableMinutes
    );

    const cost = minutesToAdvance * rate;
    remainingCorn -= cost;
    cornConsumed += cost;
    progressMinutes += minutesToAdvance;
    minutesLeft -= minutesToAdvance;
    totalMinutesTrained += minutesToAdvance;

    if (progressMinutes >= neededForLevel) {
      currentNg += 1;
      progressMinutes = 0;
      if (currentNg >= maxNg) {
        stoppedReason = 'COMPLETED_CAP';
        break;
      }
    } else {
      if (affordableMinutes <= minutesRemainingForLevel && minutesLeft > 0) {
        stoppedReason = 'OUT_OF_CORN';
      } else {
        stoppedReason = 'OUT_OF_TIME';
      }
      break;
    }
  }

  if (currentNg >= maxNg) {
    stoppedReason = 'COMPLETED_CAP';
  } else if (minutesLeft === 0 && stoppedReason !== 'OUT_OF_CORN') {
    stoppedReason = 'OUT_OF_TIME';
  }

  return {
    initialNg,
    finalNg: currentNg,
    levelsGained: currentNg - initialNg,
    maxNg,
    cornConsumed,
    remainingCorn,
    totalMinutesTrained,
    currentProgressMinutes: progressMinutes,
    minutesToNextLevel: calculateMinutesToLevelUp(currentNg),
    isCapped: currentNg >= maxNg,
    stoppedReason,
  };
}
