import { ElementType } from './schemas/index.js';

export type LineagePurityType = 'PURITY_100' | 'HYBRID_DUAL' | 'MUTATION_SECRET';

export interface PedigreeNode {
  roosterId: string;
  roosterNumber?: number;
  name?: string;
  primaryElement: ElementType;
  secondaryElement?: ElementType;
  generation: number;
  father?: PedigreeNode;
  mother?: PedigreeNode;
  pai?: PedigreeNode;
  mae?: PedigreeNode;
  isSecretMutation?: boolean;
}

export interface Grandparents {
  paternalGrandfather?: PedigreeNode;
  paternalGrandmother?: PedigreeNode;
  maternalGrandfather?: PedigreeNode;
  maternalGrandmother?: PedigreeNode;
}

export interface RoosterLineageTree {
  root: PedigreeNode;
  generation: number;
  purityType: LineagePurityType;
  isPureLineage: boolean;
  roostBonusPercent: number;
  roostProductionBonusPercent: number;
  seal?: string;
}

export const MIN_LINEAGE_GENERATION = 1;
export const MAX_LINEAGE_GENERATION = 10;
export const FOUNDER_ROOSTER_MAX_NUMBER = 40;
export const PURE_LINEAGE_ROOST_BONUS_PERCENT = 5;
export const PURE_LINEAGE_SEAL = 'Linhagem Pura';
export const NORMAL_DAY_WILD_ORB_RATIO = 0.2;
export const HAPPY_HOUR_WILD_ORB_RATIO = 1.0;
export const HAPPY_HOUR_DAYS_OF_WEEK = [3, 5] as const;

export function isFounderRooster(roosterNumber?: number): boolean {
  return typeof roosterNumber === 'number' && roosterNumber >= 1 && roosterNumber <= FOUNDER_ROOSTER_MAX_NUMBER;
}

export function calculateGeneration(father?: PedigreeNode, mother?: PedigreeNode): number {
  if (!father && !mother) return MIN_LINEAGE_GENERATION;
  const fGen = father?.generation ?? MIN_LINEAGE_GENERATION;
  const mGen = mother?.generation ?? MIN_LINEAGE_GENERATION;
  return Math.min(MAX_LINEAGE_GENERATION, Math.max(MIN_LINEAGE_GENERATION, Math.max(fGen, mGen) + 1));
}

export function createPedigreeNode(params: {
  roosterId: string;
  roosterNumber?: number;
  name?: string;
  primaryElement: ElementType;
  secondaryElement?: ElementType;
  generation?: number;
  father?: PedigreeNode;
  mother?: PedigreeNode;
  pai?: PedigreeNode;
  mae?: PedigreeNode;
  isSecretMutation?: boolean;
}): PedigreeNode {
  const f = params.father ?? params.pai;
  const m = params.mother ?? params.mae;
  const gen = params.generation ?? calculateGeneration(f, m);
  return {
    roosterId: params.roosterId,
    roosterNumber: params.roosterNumber,
    name: params.name,
    primaryElement: params.primaryElement,
    secondaryElement: params.secondaryElement,
    generation: Math.min(MAX_LINEAGE_GENERATION, Math.max(MIN_LINEAGE_GENERATION, gen)),
    father: f,
    mother: m,
    pai: f,
    mae: m,
    isSecretMutation: params.isSecretMutation ?? false,
  };
}

export function getGrandparents(node: PedigreeNode): Grandparents {
  const f = node.father ?? node.pai;
  const m = node.mother ?? node.mae;
  return {
    paternalGrandfather: f?.father ?? f?.pai,
    paternalGrandmother: f?.mother ?? f?.mae,
    maternalGrandfather: m?.father ?? m?.pai,
    maternalGrandmother: m?.mother ?? m?.mae,
  };
}

export function collectAncestors(node: PedigreeNode): PedigreeNode[] {
  const ancestors: PedigreeNode[] = [];
  const visited = new Set<PedigreeNode>();
  const queue: PedigreeNode[] = [];
  const f = node.father ?? node.pai;
  const m = node.mother ?? node.mae;
  if (f) queue.push(f);
  if (m) queue.push(m);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    ancestors.push(current);
    const curF = current.father ?? current.pai;
    const curM = current.mother ?? current.mae;
    if (curF && !visited.has(curF)) queue.push(curF);
    if (curM && !visited.has(curM)) queue.push(curM);
  }
  return ancestors;
}

export function determineLineagePurity(node: PedigreeNode): LineagePurityType {
  if (node.isSecretMutation) return 'MUTATION_SECRET';
  if (node.secondaryElement && node.secondaryElement !== node.primaryElement) return 'HYBRID_DUAL';
  const ancestors = collectAncestors(node);
  if (ancestors.some((a) => a.isSecretMutation)) return 'MUTATION_SECRET';
  const isPure = ancestors.every(
    (a) => a.primaryElement === node.primaryElement && (!a.secondaryElement || a.secondaryElement === node.primaryElement),
  );
  return isPure ? 'PURITY_100' : 'HYBRID_DUAL';
}

export function isPureLineage(target: PedigreeNode | RoosterLineageTree): boolean {
  if ('purityType' in target && typeof target.purityType === 'string') {
    return target.purityType === 'PURITY_100';
  }
  return determineLineagePurity(target as PedigreeNode) === 'PURITY_100';
}

export function getLineageTreeDepth(node: PedigreeNode): number {
  const f = node.father ?? node.pai;
  const m = node.mother ?? node.mae;
  if (!f && !m) return 1;
  return 1 + Math.max(f ? getLineageTreeDepth(f) : 0, m ? getLineageTreeDepth(m) : 0);
}

export function buildRoosterLineageTree(root: PedigreeNode): RoosterLineageTree {
  const purityType = determineLineagePurity(root);
  const isPure = purityType === 'PURITY_100';
  const bonus = isPure ? PURE_LINEAGE_ROOST_BONUS_PERCENT : 0;
  return {
    root,
    generation: root.generation,
    purityType,
    isPureLineage: isPure,
    roostBonusPercent: bonus,
    roostProductionBonusPercent: bonus,
    seal: isPure ? PURE_LINEAGE_SEAL : undefined,
  };
}

export function isWildOrbHappyHour(timestampMs: number): boolean {
  const day = new Date(timestampMs).getUTCDay();
  return day === 3 || day === 5;
}

export function calculateMaxWildOrbsAllowed(totalCost: number, timestampMs: number): number {
  if (totalCost <= 0) return 0;
  const ratio = isWildOrbHappyHour(timestampMs) ? HAPPY_HOUR_WILD_ORB_RATIO : NORMAL_DAY_WILD_ORB_RATIO;
  return Math.floor(totalCost * ratio);
}
