import { describe, expect, it } from 'vitest';
import {
  ALL_ROOSTERS,
  ASTRAL_STAR_CURVE,
  CAMPAIGN_CHAPTERS,
  CHOCADEIRA_PITY_CONSTANTS,
  CLASS_PASSIVES,
  DIVINE_PASS_CONSTANTS,
  ELEMENTS,
  EQUIPMENT_SETS,
  F2P_MONTHLY_FEATHERS,
  F2P_MONTHLY_FEATHERS_TOTAL,
  FARM_DEFENSES,
  HERO_RACE_CONSTANTS,
  HERO_RACE_LAPS,
  LAUNCH_ROOSTERS,
  LEGENDARY_BREED_COMBINATIONS,
  NINHAL_RARITY_WEIGHTS,
  PERCH_LEVELS,
  PERK_GEMS,
  PRIMORDIAL_ROOSTERS,
  RARITY_PERCH_BASE,
  RoosterSpecSchema,
  SAINT_TOWERS,
  SANCTUARY_RECIPES,
  SEASONAL_ROOSTERS,
  SECRET_MUTATIONS,
  SEDE_LEVELS,
  TOWER_MODIFIERS,
  TRIO_SYNERGIES,
  YEAR_1_CULTURAL_SEASONS,
  getChocadeiraLegendaryProbability,
  getElementalMultiplier,
  getElementalMultiplierPermille,
  getRoosterById,
  getRoosterByNumber,
} from '../src/index.js';

describe('@beakbreaker/game-data v5.0 Master Encyclopedia Validation', () => {
  it('validates all 8 elements and deterministic elemental multipliers', () => {
    expect(ELEMENTS).toHaveLength(8);
    expect(getElementalMultiplierPermille('Brasa', 'Mata')).toBe(1250);
    expect(getElementalMultiplierPermille('Mata', 'Correnteza')).toBe(1250);
    expect(getElementalMultiplierPermille('Correnteza', 'Brasa')).toBe(1250);
    expect(getElementalMultiplierPermille('Brasa', 'Correnteza')).toBe(800);
    expect(getElementalMultiplier('Sol', 'Lua')).toBe(1.25);
    expect(getElementalMultiplier('Lua', 'Sol')).toBe(1.25);
    expect(getElementalMultiplierPermille('Assombracao', 'Sol')).toBe(1250);
    expect(getElementalMultiplierPermille('Assombracao', 'Lua')).toBe(1250);
    expect(getElementalMultiplierPermille('Cangaco', 'Assombracao')).toBe(1250);
    expect(getElementalMultiplierPermille('Cangaco', 'Mata')).toBe(1250);
  });

  it('validates 6 combat classes, 7 trio synergies, 8 equipment sets, and 3 perk gems', () => {
    expect(Object.keys(CLASS_PASSIVES)).toHaveLength(6);
    expect(TRIO_SYNERGIES).toHaveLength(7);
    expect(Object.keys(EQUIPMENT_SETS)).toHaveLength(8);
    expect(EQUIPMENT_SETS.BrasaViva.critMultiplierPermille).toBe(1950);
    expect(Object.keys(PERK_GEMS)).toHaveLength(3);
  });

  it('validates all 40 Launch Roosters against RoosterSpecSchema and class distribution', () => {
    expect(LAUNCH_ROOSTERS).toHaveLength(40);
    const classCounts: Record<string, number> = {
      Tanque: 0,
      Bruiser: 0,
      Assassino: 0,
      Atirador: 0,
      Suporte: 0,
      Controle: 0,
    };
    const ids = new Set<string>();
    const numbers = new Set<number>();

    for (const rooster of LAUNCH_ROOSTERS) {
      const parsed = RoosterSpecSchema.safeParse(rooster);
      expect(parsed.success, `Failed Zod parse for ${rooster.name}`).toBe(true);
      classCounts[rooster.roosterClass] = (classCounts[rooster.roosterClass] ?? 0) + 1;
      ids.add(rooster.id);
      numbers.add(rooster.number);
      expect(rooster.baseStats.vigor).toBeGreaterThanOrEqual(8500);
      expect(rooster.baseStats.vigor).toBeLessThanOrEqual(13500);
      expect(rooster.baseStats.forca).toBeGreaterThanOrEqual(750);
      expect(rooster.baseStats.forca).toBeLessThanOrEqual(980);
    }

    expect(ids.size).toBe(40);
    expect(numbers.size).toBe(40);
    expect(classCounts).toEqual({
      Tanque: 7,
      Bruiser: 6,
      Assassino: 6,
      Atirador: 7,
      Suporte: 6,
      Controle: 8,
    });
  });

  it('validates 6 Primordial Roosters (NC 22) and 39 Seasonal Roosters (13 Cultural Seasons)', () => {
    expect(PRIMORDIAL_ROOSTERS).toHaveLength(6);
    for (const p of PRIMORDIAL_ROOSTERS) {
      expect(RoosterSpecSchema.safeParse(p).success).toBe(true);
      expect(p.rarity).toBe('Primordial');
    }

    expect(YEAR_1_CULTURAL_SEASONS).toHaveLength(13);
    expect(SEASONAL_ROOSTERS).toHaveLength(39);
    for (const s of SEASONAL_ROOSTERS) {
      expect(RoosterSpecSchema.safeParse(s).success).toBe(true);
    }

    expect(ALL_ROOSTERS).toHaveLength(85);
    expect(getRoosterById('rooster_11')?.name).toBe('Galo Cangaceiro');
    expect(getRoosterByNumber(30)?.name).toBe('Sol do Sertão');
  });

  it('validates Sede 1-12, Perches 1-8, 4 Saint Towers, 4 Defenses, 12 Modifiers, and 6 Chapters', () => {
    expect(SEDE_LEVELS).toHaveLength(12);
    expect(SEDE_LEVELS[0]?.cornCost).toBe(0);
    expect(SEDE_LEVELS[11]?.cornCost).toBe(20_000_000);
    for (const s of SEDE_LEVELS) {
      expect(s.ngMaxBase).toBe(s.level * 5);
    }

    expect(PERCH_LEVELS).toHaveLength(8);
    expect(PERCH_LEVELS[0]?.cornCapacity).toBe(3_000);
    expect(PERCH_LEVELS[7]?.cornCapacity).toBe(50_000);
    expect(RARITY_PERCH_BASE.Comum).toBe(1.5);
    expect(RARITY_PERCH_BASE.Heroico).toBe(7.0);
    expect(SAINT_TOWERS).toHaveLength(4);
    expect(FARM_DEFENSES).toHaveLength(4);
    expect(TOWER_MODIFIERS).toHaveLength(12);
    expect(CAMPAIGN_CHAPTERS).toHaveLength(6);
    expect(CAMPAIGN_CHAPTERS[5]?.stageEnd).toBe(90);
  });

  it('validates Genetics: Ninhal weights, 8 Legendary combos, 6 Secret Mutations, 24 Sanctuary recipes, and 11,200 Orbs curve', () => {
    expect(NINHAL_RARITY_WEIGHTS.Comum).toBe(40);
    expect(NINHAL_RARITY_WEIGHTS.Lendario).toBe(10);
    expect(LEGENDARY_BREED_COMBINATIONS).toHaveLength(8);
    expect(SECRET_MUTATIONS).toHaveLength(6);
    expect(SANCTUARY_RECIPES).toHaveLength(24);

    for (let lvl = 1; lvl <= 8; lvl++) {
      const recipesAtLevel = SANCTUARY_RECIPES.filter((r) => r.sanctuaryLevel === lvl);
      expect(recipesAtLevel).toHaveLength(3);
    }

    expect(ASTRAL_STAR_CURVE).toHaveLength(10);
    const totalOrbs = ASTRAL_STAR_CURVE.reduce((sum, step) => sum + step.orbsRequired, 0);
    const totalEssences = ASTRAL_STAR_CURVE.reduce(
      (sum, step) => sum + step.astralEssencesRequired,
      0,
    );
    expect(totalOrbs).toBe(11_200);
    expect(ASTRAL_STAR_CURVE[9]?.cumulativeOrbs).toBe(11_200);
    expect(totalEssences).toBe(15);
    expect(ASTRAL_STAR_CURVE[9]?.cumulativeAstralEssences).toBe(15);
  });

  it('validates Gacha Pity curve, Hero Race 1,050 items at Lap 15, Divine Pass 36,000 XP, and 10,500 F2P Feathers', () => {
    expect(getChocadeiraLegendaryProbability(1)).toBe(0.02);
    expect(getChocadeiraLegendaryProbability(60)).toBe(0.02);
    expect(getChocadeiraLegendaryProbability(61)).toBe(0.07);
    expect(getChocadeiraLegendaryProbability(65)).toBe(0.27);
    expect(getChocadeiraLegendaryProbability(70)).toBe(0.52);
    expect(getChocadeiraLegendaryProbability(79)).toBe(0.97);
    expect(getChocadeiraLegendaryProbability(80)).toBe(1.0);
    expect(CHOCADEIRA_PITY_CONSTANTS.flashOfferWindowMinPull).toBe(58);
    expect(CHOCADEIRA_PITY_CONSTANTS.flashOfferWindowMaxPull).toBe(65);

    expect(HERO_RACE_LAPS).toHaveLength(18);
    expect(HERO_RACE_LAPS[14]?.cumulativeItems).toBe(1_050);
    expect(HERO_RACE_LAPS[17]?.bonusHeroicOrbs).toBe(640);
    expect(HERO_RACE_CONSTANTS.cumulativeItemsAtLap15).toBe(1_050);
    expect(DIVINE_PASS_CONSTANTS.totalXpRequired).toBe(36_000);

    expect(F2P_MONTHLY_FEATHERS).toHaveLength(8);
    const feathersSum = F2P_MONTHLY_FEATHERS.reduce((sum, f) => sum + f.feathersPerMonth, 0);
    expect(feathersSum).toBe(10_500);
    expect(F2P_MONTHLY_FEATHERS_TOTAL).toBe(10_500);
  });
});
