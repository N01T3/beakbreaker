export type Rarity = 'Comum' | 'Raro' | 'Epico' | 'Lendario' | 'Mitico' | 'Heroico' | 'Primordial';
export type ElementType = 'Brasa' | 'Mata' | 'Correnteza' | 'Sol' | 'Lua' | 'Assombracao' | 'Cangaco';
export type SpineSlotName = 'tronco' | 'cabeca' | 'crista' | 'asa_frente' | 'cauda' | 'canelas';

export const SPINE_VISUAL_SLOTS: readonly SpineSlotName[] = [
  'tronco', 'cabeca', 'crista', 'asa_frente', 'cauda', 'canelas',
] as const;

export const RARITY_BREED_WEIGHTS: Record<Rarity, number> = {
  Comum: 40, Raro: 30, Epico: 20, Lendario: 10, Mitico: 0, Heroico: 0, Primordial: 0,
};

export interface LegendaryPairDefinition {
  pair: readonly [ElementType, ElementType];
  speciesId: string;
  name: string;
}

export const LEGENDARY_ELEMENT_PAIRS: readonly LegendaryPairDefinition[] = [
  { pair: ['Brasa', 'Sol'], speciesId: '#18', name: 'Trovão do Sertão' },
  { pair: ['Brasa', 'Lua'], speciesId: '#23', name: 'Mula sem Cabeça' },
  { pair: ['Mata', 'Sol'], speciesId: '#19', name: 'Asa Branca' },
  { pair: ['Lua', 'Mata'], speciesId: '#24', name: 'Cuca do Agreste' },
  { pair: ['Correnteza', 'Lua'], speciesId: '#20', name: 'Rei do Baião' },
  { pair: ['Lua', 'Sol'], speciesId: '#22', name: 'Saci da Ventania' },
  { pair: ['Brasa', 'Correnteza'], speciesId: '#39', name: 'Fogo-Apagou' },
  { pair: ['Correnteza', 'Sol'], speciesId: '#40', name: 'Arco-Íris do Sertão' },
] as const;

export interface BreedingParent {
  roosterId: string;
  speciesId: string;
  rarity: Rarity;
  primaryElement: ElementType;
  secondaryElement?: ElementType;
  ng: number;
  stars: number;
  breedCount: number;
  maxBreedCount?: number;
  hasProcriacaoGem?: boolean;
}

export interface SpeciesPoolEntry {
  speciesId: string;
  rarity: Rarity;
  elements: ElementType[];
  weight: number;
  probability: number;
  percentage: number;
  percentage1Dec: number;
}

export interface NinhalBreedPreview {
  eligible: boolean;
  cornCost: number;
  goldenBarActive: boolean;
  totalWeight: number;
  pool: SpeciesPoolEntry[];
}

export interface NinhalBreedResult {
  offspringSpeciesId: string;
  offspringRarity: Rarity;
  elements: ElementType[];
  isDualLineageHybrid: boolean;
  visualSlots: Record<SpineSlotName, string>;
  cornCost: number;
  goldenBarActive: boolean;
}

export function isParentEligibleForNinhal(parent: BreedingParent): boolean {
  return parent.breedCount < (parent.maxBreedCount ?? 5);
}

export function calculateBreedingCornCost(fatherNg: number, motherNg: number): number {
  return 3000 + 200 * (Math.max(1, fatherNg) + Math.max(1, motherNg));
}

export function isGoldenEmpowermentActive(father: BreedingParent, mother: BreedingParent): boolean {
  return (
    father.stars >= 3 &&
    mother.stars >= 3 &&
    Boolean(father.hasProcriacaoGem) &&
    Boolean(mother.hasProcriacaoGem)
  );
}

export function findLegendaryPairSpecies(elemA: ElementType, elemB: ElementType): LegendaryPairDefinition | null {
  for (const def of LEGENDARY_ELEMENT_PAIRS) {
    const [p1, p2] = def.pair;
    if ((p1 === elemA && p2 === elemB) || (p1 === elemB && p2 === elemA)) return def;
  }
  return null;
}

export function calculateNinhalPool(father: BreedingParent, mother: BreedingParent): NinhalBreedPreview {
  const eligible = isParentEligibleForNinhal(father) && isParentEligibleForNinhal(mother);
  const cornCost = calculateBreedingCornCost(father.ng, mother.ng);
  const goldenBarActive = isGoldenEmpowermentActive(father, mother);
  const rawEntries: Array<{ speciesId: string; rarity: Rarity; elements: ElementType[]; weight: number }> = [];

  for (const p of [father, mother]) {
    const w = RARITY_BREED_WEIGHTS[p.rarity];
    if (w > 0) {
      rawEntries.push({
        speciesId: p.speciesId,
        rarity: p.rarity,
        elements: p.secondaryElement ? [p.primaryElement, p.secondaryElement] : [p.primaryElement],
        weight: w,
      });
    }
  }

  if (goldenBarActive) {
    const leg = findLegendaryPairSpecies(father.primaryElement, mother.primaryElement);
    if (leg) {
      rawEntries.push({ speciesId: leg.speciesId, rarity: 'Lendario', elements: [leg.pair[0], leg.pair[1]], weight: 8 });
    }
  }

  const totalWeight = rawEntries.reduce((acc, item) => acc + item.weight, 0);
  const pool: SpeciesPoolEntry[] = rawEntries.map((item) => {
    const probability = totalWeight > 0 ? item.weight / totalWeight : 0;
    return {
      ...item,
      probability,
      percentage: Number((probability * 100).toFixed(2)),
      percentage1Dec: Number((probability * 100).toFixed(1)),
    };
  });

  return { eligible, cornCost, goldenBarActive, totalWeight, pool };
}

export function assembleHybridVisualSlots(
  fatherSpeciesId: string,
  motherSpeciesId: string,
  rng: () => number = Math.random
): Record<SpineSlotName, string> {
  const slots = {} as Record<SpineSlotName, string>;
  SPINE_VISUAL_SLOTS.forEach((slot, idx) => {
    const pickFather = idx === 0 ? true : idx === 1 ? false : rng() < 0.5;
    slots[slot] = pickFather ? fatherSpeciesId : motherSpeciesId;
  });
  return slots;
}

export function executeNinhalBreeding(
  father: BreedingParent,
  mother: BreedingParent,
  rng: () => number = Math.random
): NinhalBreedResult {
  const preview = calculateNinhalPool(father, mother);
  if (!preview.eligible || preview.totalWeight <= 0) {
    throw new Error('Parents are not eligible for Ninhal breeding');
  }
  const roll = rng() * preview.totalWeight;
  let acc = 0;
  let chosen = preview.pool[preview.pool.length - 1]!;
  for (const entry of preview.pool) {
    acc += entry.weight;
    if (roll < acc) {
      chosen = entry;
      break;
    }
  }

  const distinctElements = father.primaryElement !== mother.primaryElement;
  const isDualLineageHybrid = chosen.elements.length === 1 && distinctElements && rng() < 0.35;
  const secondElem = chosen.elements[0] === father.primaryElement ? mother.primaryElement : father.primaryElement;
  const elements = isDualLineageHybrid ? [chosen.elements[0]!, secondElem] : [...chosen.elements];
  const visualSlots = isDualLineageHybrid
    ? assembleHybridVisualSlots(father.speciesId, mother.speciesId, rng)
    : SPINE_VISUAL_SLOTS.reduce((m, s) => ({ ...m, [s]: chosen.speciesId }), {} as Record<SpineSlotName, string>);

  return {
    offspringSpeciesId: chosen.speciesId,
    offspringRarity: chosen.rarity,
    elements,
    isDualLineageHybrid,
    visualSlots,
    cornCost: preview.cornCost,
    goldenBarActive: preview.goldenBarActive,
  };
}
