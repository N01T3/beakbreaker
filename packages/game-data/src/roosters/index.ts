import { RoosterSpec } from '../schemas/index.js';
import { ROOSTERS_PART_1 } from './part1.js';
import { ROOSTERS_PART_2 } from './part2.js';
import { ROOSTERS_PART_3 } from './part3.js';
import { PRIMORDIAL_ROOSTERS } from './primordiais.js';
import {
  CulturalSeasonSpec,
  SEASONAL_ROOSTERS,
  YEAR_1_CULTURAL_SEASONS,
} from './seasonal.js';

export {
  ROOSTERS_PART_1,
  ROOSTERS_PART_2,
  ROOSTERS_PART_3,
  PRIMORDIAL_ROOSTERS,
  SEASONAL_ROOSTERS,
  YEAR_1_CULTURAL_SEASONS,
};
export type { CulturalSeasonSpec };

export const LAUNCH_ROOSTERS: readonly RoosterSpec[] = [
  ...ROOSTERS_PART_1,
  ...ROOSTERS_PART_2,
  ...ROOSTERS_PART_3,
] as const;

export const ALL_ROOSTERS: readonly RoosterSpec[] = [
  ...LAUNCH_ROOSTERS,
  ...PRIMORDIAL_ROOSTERS,
  ...SEASONAL_ROOSTERS,
] as const;

const ROOSTER_BY_ID_MAP = new Map<string, RoosterSpec>(
  ALL_ROOSTERS.map((rooster) => [rooster.id, rooster]),
);

const ROOSTER_BY_NUMBER_MAP = new Map<number, RoosterSpec>(
  ALL_ROOSTERS.map((rooster) => [rooster.number, rooster]),
);

export function getRoosterById(id: string): RoosterSpec | undefined {
  return ROOSTER_BY_ID_MAP.get(id);
}

export function getRoosterByNumber(number: number): RoosterSpec | undefined {
  return ROOSTER_BY_NUMBER_MAP.get(number);
}
