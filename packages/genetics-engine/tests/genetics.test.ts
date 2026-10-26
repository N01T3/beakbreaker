import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CHOCADEIRA_BANNER,
  SANCTUARY_RECIPES,
  SPINE_VISUAL_SLOTS,
  TOTAL_ASTRAL_ESSENCES_TO_MAX,
  TOTAL_ORBS_TO_MAX_STARS,
  calculateBreedingCornCost,
  calculateMaxNgCap,
  calculateNinhalPool,
  calculateOrbExtraction,
  calculateRoosterCornPerMin,
  canExecuteSanctuaryRecipe,
  collectHeroRaceItem,
  evaluateHeroRaceMilestone,
  evaluatePerchHarvestLazy,
  executeNinhalBreeding,
  executeSanctuaryRecipe,
  executeSinglePull,
  executeTenPull,
  getAvailablePoolItemsAt,
  getCumulativeItemsForLap,
  getLegendaryPullProbability,
  getNodePoolConfig,
  getStarRequirement,
  resolveBranchedEvolution,
  resolveBreedingMutation,
  shouldTriggerFlashPityOffer,
  validateStarEmpowerment,
  type BreedingParent,
  type GachaPlayerState,
} from '../src/index.js';

describe('Genetics Engine v5.0 Suite', () => {
  it('calculates Ninhal pool weights (51.3% / 38.5% / 10.3%) and corn cost', () => {
    const father: BreedingParent = {
      roosterId: 'r1', speciesId: '#4', rarity: 'Comum', primaryElement: 'Brasa',
      ng: 30, stars: 3, breedCount: 0, hasProcriacaoGem: true,
    };
    const mother: BreedingParent = {
      roosterId: 'r2', speciesId: '#7', rarity: 'Raro', primaryElement: 'Sol',
      ng: 30, stars: 3, breedCount: 2, hasProcriacaoGem: true,
    };

    expect(calculateBreedingCornCost(30, 30)).toBe(15000);
    const preview = calculateNinhalPool(father, mother);
    expect(preview.eligible).toBe(true);
    expect(preview.goldenBarActive).toBe(true);
    expect(preview.totalWeight).toBe(78);
    expect(preview.pool.map((p) => p.percentage1Dec)).toEqual([51.3, 38.5, 10.3]);
    expect(preview.pool.map((p) => p.percentage)).toEqual([51.28, 38.46, 10.26]);
    expect(preview.pool[2]?.speciesId).toBe('#18');
  });

  it('resolves 35% Dual Lineage Hybrid and merges 6 Spine visual slots', () => {
    const father: BreedingParent = {
      roosterId: 'f1', speciesId: '#4', rarity: 'Comum', primaryElement: 'Brasa', ng: 10, stars: 0, breedCount: 0,
    };
    const mother: BreedingParent = {
      roosterId: 'm1', speciesId: '#7', rarity: 'Raro', primaryElement: 'Sol', ng: 10, stars: 0, breedCount: 0,
    };
    const rolls = [0.1, 0.2, 0.4, 0.6, 0.2, 0.8];
    let idx = 0;
    const res = executeNinhalBreeding(father, mother, () => rolls[idx++ % rolls.length]!);
    expect(res.isDualLineageHybrid).toBe(true);
    expect(res.elements).toEqual(['Brasa', 'Sol']);
    expect(Object.keys(res.visualSlots)).toEqual([...SPINE_VISUAL_SLOTS]);
    expect(res.visualSlots.tronco).toBe('#4');
    expect(res.visualSlots.cabeca).toBe('#7');
  });

  it('handles 5% (and 10%) Secret Mutations and NG 20/40 Branched Evolutions', () => {
    const mutLua = resolveBreedingMutation(
      { ng: 30, primaryElement: 'Lua' },
      { ng: 30, primaryElement: 'Lua' },
      { currentSeason: 1, rollValue: 0.04 }
    );
    expect(mutLua.triggered).toBe(true);
    expect(mutLua.secretMutation?.speciesId).toBe('#26');

    const mutGold = resolveBreedingMutation(
      { ng: 30, primaryElement: 'Brasa' },
      { ng: 30, primaryElement: 'Brasa' },
      { currentSeason: 1, hasTorreDoCangacoBuff: true, rollValue: 0.08 }
    );
    expect(mutGold.mutationChance).toBe(0.1);
    expect(mutGold.isGoldenPlumage).toBe(true);
    expect(mutGold.rarePassiveGranted).toBe(true);

    expect(resolveBranchedEvolution('r1', 20, 'Caatinga', 'PimentaBrasa').targetSpeciesId).toBe('#11');
    expect(resolveBranchedEvolution('r1', 20, 'Agreste', 'FolhaSagrada').targetSpeciesId).toBe('#12');
    expect(resolveBranchedEvolution('r1', 40, 'Caatinga', 'PimentaBrasa').targetSpeciesId).toBe('#21');
    expect(resolveBranchedEvolution('r1', 40, 'Agreste', 'FolhaSagrada').targetSpeciesId).toBe('#25');
  });

  it('validates and executes all 24 Sanctuary recipes across Levels 1..8 (Sede 6..12)', () => {
    expect(SANCTUARY_RECIPES.length).toBe(24);
    for (const r of SANCTUARY_RECIPES) {
      expect(canExecuteSanctuaryRecipe({
        recipeIdOrCode: r.recipeId, playerSanctuaryLevel: r.sanctuaryLevel, playerSedeLevel: r.requiredSedeLevel - 1,
      }).allowed).toBe(false);

      const res = executeSanctuaryRecipe({
        recipeIdOrCode: r.recipeId, playerSanctuaryLevel: r.sanctuaryLevel, playerSedeLevel: r.requiredSedeLevel,
        fatherElement: r.requiredElements?.[0], motherElement: r.requiredElements?.[1],
      });
      expect(res.recipe.recipeId).toBe(r.recipeId);
    }
  });

  it('validates Tree of Life Orbs (40..100, 11.200 total, 15 Essences, Happy Hour)', () => {
    expect(calculateOrbExtraction(1)).toBe(40);
    expect(calculateOrbExtraction(30)).toBe(100);
    const star10 = getStarRequirement(10);
    expect(star10.cumulativeOrbs).toBe(TOTAL_ORBS_TO_MAX_STARS);
    expect(star10.cumulativeAstralEssences).toBe(TOTAL_ASTRAL_ESSENCES_TO_MAX);
    expect(calculateMaxNgCap(12, 10)).toBe(70);

    expect(validateStarEmpowerment({
      targetStar: 1, speciesOrbsAvailable: 50, jokerOrbsAvailable: 100, astralEssencesAvailable: 0, isHappyHourActive: false,
    }).canEmpower).toBe(false);

    const happyHourOk = validateStarEmpowerment({
      targetStar: 1, speciesOrbsAvailable: 0, jokerOrbsAvailable: 120, astralEssencesAvailable: 0, isHappyHourActive: true,
    });
    expect(happyHourOk.canEmpower).toBe(true);
    expect(happyHourOk.jokerOrbsToSpend).toBe(120);
  });

  it('enforces Chocadeira Pity curve, 50/50 rule, and Flash Pity Offer [58, 65]', () => {
    expect([1, 60, 61, 65, 70, 79, 80].map(getLegendaryPullProbability)).toEqual([0.02, 0.02, 0.07, 0.27, 0.52, 0.97, 1.0]);
    expect(shouldTriggerFlashPityOffer(58, 120)).toBe(true);
    expect(shouldTriggerFlashPityOffer(65, 0)).toBe(true);
    expect(shouldTriggerFlashPityOffer(58, 160)).toBe(false);

    const state: GachaPlayerState = { pityCounter: 79, epicPityCounter: 0, guaranteedFeaturedNext: false, goldenFeathers: 320 };
    const out1 = executeSinglePull(state, DEFAULT_CHOCADEIRA_BANNER, () => 0.8);
    expect(out1.rarity).toBe('Lendario');
    expect(out1.isFeaturedLegendary).toBe(false);
    expect(out1.stateAfter.guaranteedFeaturedNext).toBe(true);

    const out2 = executeSinglePull({ ...out1.stateAfter, pityCounter: 79 }, DEFAULT_CHOCADEIRA_BANNER, () => 0.9);
    expect(out2.isFeaturedLegendary).toBe(true);
    expect(out2.speciesId).toBe('#18');

    const tenOut = executeTenPull({ pityCounter: 0, epicPityCounter: 0, guaranteedFeaturedNext: false, goldenFeathers: 1600 }, DEFAULT_CHOCADEIRA_BANNER, () => 0.99);
    expect(tenOut.some((o) => o.rarity === 'Epico' || o.rarity === 'Lendario')).toBe(true);
  });

  it('verifies Hero Race 1.050 items at Lap 15, 640 Orbs at Lap 18, and Perch 278/min', () => {
    expect(getCumulativeItemsForLap(15)).toBe(1050);
    expect(evaluateHeroRaceMilestone(15).grantsHeroicRooster).toBe(true);
    expect(evaluateHeroRaceMilestone(18).heroicOrbsGranted).toBe(640);

    const pool1 = getNodePoolConfig(1, 1);
    expect([pool1.totalItemsRequired, pool1.immediatePoolItems, pool1.cooldownPoolItems]).toEqual([7, 5, 2]);

    let prog = { lap: 1, nodeIndex: 1, itemsCollected: 0, poolDepletedTimestampMs: null as number | null };
    for (let i = 0; i < 5; i++) prog = collectHeroRaceItem(prog, 1000).nextProgress;
    expect(getAvailablePoolItemsAt(prog, 1000).availableNow).toBe(0);
    expect(getAvailablePoolItemsAt(prog, 1000 + 900_000).availableNow).toBe(1);

    expect(calculateRoosterCornPerMin('Comum', 10, 0)).toBe(15);
    expect(calculateRoosterCornPerMin('Lendario', 40, 3)).toBe(278);
    const lazy = evaluatePerchHarvestLazy({
      perchLevel: 1, roosters: [{ roosterId: 'r1', rarity: 'Lendario', ng: 40, stars: 3 }], lastCollectedAtMs: 0, nowMs: 3_600_000,
    });
    expect(lazy.collectibleCorn).toBe(3000);
    expect(lazy.isCapped).toBe(true);
  });
});
