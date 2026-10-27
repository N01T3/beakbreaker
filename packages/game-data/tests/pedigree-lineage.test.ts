import { describe, expect, it } from 'vitest';
import {
  MAX_LINEAGE_GENERATION,
  MIN_LINEAGE_GENERATION,
  buildRoosterLineageTree,
  calculateGeneration,
  calculateMaxWildOrbsAllowed,
  createPedigreeNode,
  determineLineagePurity,
  getGrandparents,
  getLineageTreeDepth,
  isFounderRooster,
  isPureLineage,
  isWildOrbHappyHour,
} from '../src/index.js';

describe('Árvore Genealógica (Pedigree) & Linhagem Genética', () => {
  it('identifica corretamente linhagem pura com selo e bônus de 5% no poleiro', () => {
    const founderPaternalGrandfather = createPedigreeNode({ roosterId: 'r1', roosterNumber: 1, primaryElement: 'Brasa' });
    const founderPaternalGrandmother = createPedigreeNode({ roosterId: 'r2', roosterNumber: 2, primaryElement: 'Brasa' });
    const founderMaternalGrandfather = createPedigreeNode({ roosterId: 'r3', roosterNumber: 3, primaryElement: 'Brasa' });
    const founderMaternalGrandmother = createPedigreeNode({ roosterId: 'r4', roosterNumber: 4, primaryElement: 'Brasa' });

    const father = createPedigreeNode({
      roosterId: 'r_father',
      primaryElement: 'Brasa',
      father: founderPaternalGrandfather,
      mother: founderPaternalGrandmother,
    });
    const mother = createPedigreeNode({
      roosterId: 'r_mother',
      primaryElement: 'Brasa',
      father: founderMaternalGrandfather,
      mother: founderMaternalGrandmother,
    });

    const bird = createPedigreeNode({
      roosterId: 'r_child',
      primaryElement: 'Brasa',
      father,
      mother,
    });

    const tree = buildRoosterLineageTree(bird);
    expect(tree.purityType).toBe('PURITY_100');
    expect(tree.isPureLineage).toBe(true);
    expect(tree.roostBonusPercent).toBe(5);
    expect(tree.seal).toBe('Linhagem Pura');
    expect(isPureLineage(bird)).toBe(true);
    expect(isPureLineage(tree)).toBe(true);

    const grandparents = getGrandparents(bird);
    expect(grandparents.paternalGrandfather?.roosterId).toBe('r1');
    expect(grandparents.paternalGrandmother?.roosterId).toBe('r2');
    expect(grandparents.maternalGrandfather?.roosterId).toBe('r3');
    expect(grandparents.maternalGrandmother?.roosterId).toBe('r4');
  });

  it('classifica híbridos e mutações secretas sem bônus de pureza', () => {
    const father = createPedigreeNode({ roosterId: 'r_brasa', primaryElement: 'Brasa', generation: 1 });
    const mother = createPedigreeNode({ roosterId: 'r_correnteza', primaryElement: 'Correnteza', generation: 1 });
    const hybrid = createPedigreeNode({ roosterId: 'r_hybrid', primaryElement: 'Brasa', father, mother });

    const treeHybrid = buildRoosterLineageTree(hybrid);
    expect(treeHybrid.purityType).toBe('HYBRID_DUAL');
    expect(treeHybrid.isPureLineage).toBe(false);
    expect(treeHybrid.roostBonusPercent).toBe(0);
    expect(treeHybrid.seal).toBeUndefined();

    const mutationNode = createPedigreeNode({
      roosterId: 'mut_sombra',
      primaryElement: 'Lua',
      generation: 2,
      isSecretMutation: true,
      father: createPedigreeNode({ roosterId: 'r_lua1', primaryElement: 'Lua' }),
      mother: createPedigreeNode({ roosterId: 'r_lua2', primaryElement: 'Lua' }),
    });

    expect(determineLineagePurity(mutationNode)).toBe('MUTATION_SECRET');
    const treeMut = buildRoosterLineageTree(mutationNode);
    expect(treeMut.purityType).toBe('MUTATION_SECRET');
    expect(treeMut.isPureLineage).toBe(false);
    expect(treeMut.roostBonusPercent).toBe(0);
  });

  it('valida rastreamento de gerações de 1 a 10 e profundidade da árvore', () => {
    expect(isFounderRooster(1)).toBe(true);
    expect(isFounderRooster(40)).toBe(true);
    expect(isFounderRooster(41)).toBe(false);

    let current = createPedigreeNode({ roosterId: 'g1', primaryElement: 'Sol', generation: 1 });
    expect(current.generation).toBe(MIN_LINEAGE_GENERATION);
    expect(getLineageTreeDepth(current)).toBe(1);

    for (let gen = 2; gen <= 15; gen++) {
      const parent = current;
      current = createPedigreeNode({
        roosterId: `g${gen}`,
        primaryElement: 'Sol',
        father: parent,
        mother: parent,
      });
    }

    expect(current.generation).toBe(MAX_LINEAGE_GENERATION);
    expect(current.generation).toBe(10);
    expect(calculateGeneration(current, current)).toBe(10);
  });
});

describe('Calendário de Happy Hour de Orbes Curinga', () => {
  it('ativa o Happy Hour exclusivamente às quartas e sextas-feiras', () => {
    const sundayUtc = Date.UTC(2026, 9, 25, 12, 0, 0);
    const mondayUtc = Date.UTC(2026, 9, 26, 12, 0, 0);
    const tuesdayUtc = Date.UTC(2026, 9, 27, 12, 0, 0);
    const wednesdayUtc = Date.UTC(2026, 9, 28, 12, 0, 0);
    const thursdayUtc = Date.UTC(2026, 9, 29, 12, 0, 0);
    const fridayUtc = Date.UTC(2026, 9, 30, 12, 0, 0);
    const saturdayUtc = Date.UTC(2026, 9, 31, 12, 0, 0);

    expect(isWildOrbHappyHour(sundayUtc)).toBe(false);
    expect(isWildOrbHappyHour(mondayUtc)).toBe(false);
    expect(isWildOrbHappyHour(tuesdayUtc)).toBe(false);
    expect(isWildOrbHappyHour(wednesdayUtc)).toBe(true);
    expect(isWildOrbHappyHour(thursdayUtc)).toBe(false);
    expect(isWildOrbHappyHour(fridayUtc)).toBe(true);
    expect(isWildOrbHappyHour(saturdayUtc)).toBe(false);
  });

  it('calcula o teto de orbes curinga: 20% em dias comuns e 100% no Happy Hour', () => {
    const wednesdayUtc = Date.UTC(2026, 9, 28, 15, 0, 0);
    const fridayUtc = Date.UTC(2026, 9, 30, 18, 0, 0);
    const thursdayUtc = Date.UTC(2026, 9, 29, 10, 0, 0);

    expect(calculateMaxWildOrbsAllowed(100, wednesdayUtc)).toBe(100);
    expect(calculateMaxWildOrbsAllowed(50, fridayUtc)).toBe(50);
    expect(calculateMaxWildOrbsAllowed(120, fridayUtc)).toBe(120);

    expect(calculateMaxWildOrbsAllowed(100, thursdayUtc)).toBe(20);
    expect(calculateMaxWildOrbsAllowed(50, thursdayUtc)).toBe(10);
    expect(calculateMaxWildOrbsAllowed(45, thursdayUtc)).toBe(9);
    expect(calculateMaxWildOrbsAllowed(0, thursdayUtc)).toBe(0);
    expect(calculateMaxWildOrbsAllowed(-10, wednesdayUtc)).toBe(0);
  });
});
