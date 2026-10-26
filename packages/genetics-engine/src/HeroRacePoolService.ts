export const HERO_RACE_TOTAL_LAPS = 18;
export const HERO_RACE_NODES_PER_LAP = 5;
export const HERO_RACE_GUARANTEED_HEROIC_LAP = 15;
export const HERO_RACE_LAP_15_CUMULATIVE_ITEMS = 1050;
export const HERO_RACE_LAP_18_HEROIC_ORBS = 640;
export const HERO_RACE_POOL_COOLDOWN_SEC = 900; // 15 minutes (900s)

export interface HeroRaceNodePoolConfig {
  lap: number;
  nodeIndex: number;
  totalItemsRequired: number;
  immediatePoolItems: number;
  cooldownPoolItems: number;
  regenIntervalSec: number;
  totalCooldownSec: number;
}

export interface HeroRaceNodeProgress {
  lap: number;
  nodeIndex: number;
  itemsCollected: number;
  poolDepletedTimestampMs: number | null;
}

export interface HeroRaceMilestoneReward {
  lapCompleted: number;
  grantsHeroicRooster: boolean;
  heroicSpeciesId: string | null;
  heroicOrbsGranted: number;
  resultingHeroicStars: number;
}

export function getNodeItemRequirement(lap: number): number {
  if (lap < 1 || lap > HERO_RACE_TOTAL_LAPS || !Number.isInteger(lap)) {
    throw new Error(`Invalid Hero Race lap ${lap}. Must be integer 1..18`);
  }
  return 6 + lap;
}

export function getNodePoolConfig(
  lap: number,
  nodeIndex = 1
): HeroRaceNodePoolConfig {
  if (nodeIndex < 1 || nodeIndex > HERO_RACE_NODES_PER_LAP) {
    throw new Error(`Invalid nodeIndex ${nodeIndex}. Must be 1..5`);
  }
  const totalItemsRequired = getNodeItemRequirement(lap);
  const immediatePoolItems = Math.ceil(0.6 * totalItemsRequired);
  const cooldownPoolItems = Math.floor(0.4 * totalItemsRequired);

  return {
    lap,
    nodeIndex,
    totalItemsRequired,
    immediatePoolItems,
    cooldownPoolItems,
    regenIntervalSec: HERO_RACE_POOL_COOLDOWN_SEC,
    totalCooldownSec: cooldownPoolItems * HERO_RACE_POOL_COOLDOWN_SEC,
  };
}

export function getLapTotalItems(lap: number): number {
  return HERO_RACE_NODES_PER_LAP * getNodeItemRequirement(lap);
}

export function getCumulativeItemsForLap(targetLap: number): number {
  if (targetLap < 1 || targetLap > HERO_RACE_TOTAL_LAPS) {
    throw new Error(`Invalid targetLap ${targetLap}. Must be 1..18`);
  }
  let sum = 0;
  for (let v = 1; v <= targetLap; v++) {
    sum += getLapTotalItems(v);
  }
  return sum;
}

export function getAvailablePoolItemsAt(
  progress: HeroRaceNodeProgress,
  nowMs: number
): {
  availableNow: number;
  remainingToFinishNode: number;
  secondsUntilNextItem: number;
} {
  const cfg = getNodePoolConfig(progress.lap, progress.nodeIndex);
  const remainingToFinishNode = Math.max(
    0,
    cfg.totalItemsRequired - progress.itemsCollected
  );
  if (remainingToFinishNode === 0) {
    return { availableNow: 0, remainingToFinishNode: 0, secondsUntilNextItem: 0 };
  }

  if (progress.itemsCollected < cfg.immediatePoolItems) {
    const immediateLeft = cfg.immediatePoolItems - progress.itemsCollected;
    return {
      availableNow: immediateLeft,
      remainingToFinishNode,
      secondsUntilNextItem: 0,
    };
  }

  const depletedAt = progress.poolDepletedTimestampMs ?? nowMs;
  const elapsedSec = Math.max(0, Math.floor((nowMs - depletedAt) / 1000));
  const regeneratedTotal = Math.floor(elapsedSec / HERO_RACE_POOL_COOLDOWN_SEC);
  const cooldownItemsAlreadyTaken =
    progress.itemsCollected - cfg.immediatePoolItems;
  const availableFromRegen = Math.max(
    0,
    Math.min(
      remainingToFinishNode,
      regeneratedTotal - cooldownItemsAlreadyTaken
    )
  );

  const secondsIntoCurrentInterval = elapsedSec % HERO_RACE_POOL_COOLDOWN_SEC;
  const secondsUntilNextItem =
    availableFromRegen >= remainingToFinishNode
      ? 0
      : HERO_RACE_POOL_COOLDOWN_SEC - secondsIntoCurrentInterval;

  return {
    availableNow: availableFromRegen,
    remainingToFinishNode,
    secondsUntilNextItem,
  };
}

export function collectHeroRaceItem(
  progress: HeroRaceNodeProgress,
  nowMs: number
): {
  collected: boolean;
  nodeCompleted: boolean;
  nextProgress: HeroRaceNodeProgress;
} {
  const cfg = getNodePoolConfig(progress.lap, progress.nodeIndex);
  const status = getAvailablePoolItemsAt(progress, nowMs);
  if (status.availableNow <= 0) {
    return { collected: false, nodeCompleted: false, nextProgress: progress };
  }

  const nextCollected = progress.itemsCollected + 1;
  const hitImmediateLimit =
    nextCollected === cfg.immediatePoolItems &&
    progress.poolDepletedTimestampMs === null;

  return {
    collected: true,
    nodeCompleted: nextCollected >= cfg.totalItemsRequired,
    nextProgress: {
      ...progress,
      itemsCollected: nextCollected,
      poolDepletedTimestampMs: hitImmediateLimit
        ? nowMs
        : progress.poolDepletedTimestampMs,
    },
  };
}

export function evaluateHeroRaceMilestone(
  lapCompleted: number,
  heroicSpeciesId = '#30'
): HeroRaceMilestoneReward {
  const grantsHeroicRooster = lapCompleted >= HERO_RACE_GUARANTEED_HEROIC_LAP;
  const heroicOrbsGranted =
    lapCompleted >= HERO_RACE_TOTAL_LAPS ? HERO_RACE_LAP_18_HEROIC_ORBS : 0;
  return {
    lapCompleted,
    grantsHeroicRooster,
    heroicSpeciesId: grantsHeroicRooster ? heroicSpeciesId : null,
    heroicOrbsGranted,
    resultingHeroicStars: lapCompleted >= HERO_RACE_TOTAL_LAPS ? 3 : 0,
  };
}
