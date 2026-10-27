import { describe, expect, it } from 'vitest';
import {
  DIVINE_PASS_CONFIG,
  DIVINE_PASS_DAILY_MISSIONS,
  DIVINE_PASS_LEVELS,
  DIVINE_PASS_WEEKLY_MISSIONS,
  LOGIN_CALENDAR_CONFIG,
  LOGIN_CALENDAR_REWARDS,
  calculatePassLevel,
  getDivinePassRewards,
  getLoginCalendarReward,
} from '../src/index.js';

describe('Passe Divino do Sertão (40 Níveis)', () => {
  it('deve possuir configuração oficial de 40 níveis e 36.000 XP total', () => {
    expect(DIVINE_PASS_CONFIG.totalLevels).toBe(40);
    expect(DIVINE_PASS_CONFIG.xpPerLevel).toBe(900);
    expect(DIVINE_PASS_CONFIG.totalXpRequired).toBe(36_000);
    expect(DIVINE_PASS_CONFIG.coronelUnlockCostCoroas).toBe(800);
    expect(DIVINE_PASS_LEVELS).toHaveLength(40);
  });

  it('deve ter XP progressivo de 900 por nível até 36.000 no nível 40', () => {
    DIVINE_PASS_LEVELS.forEach((levelData, idx) => {
      const lvl = idx + 1;
      expect(levelData.level).toBe(lvl);
      expect(levelData.requiredXp).toBe(lvl * 900);
    });
    expect(DIVINE_PASS_LEVELS[39].requiredXp).toBe(36_000);
  });

  it('deve conceder recompensas da Trilha do Retirante e Coronel corretamente', () => {
    const lvl1 = getDivinePassRewards(1);
    expect(lvl1).toBeDefined();
    expect(lvl1?.retirante.milho).toBeGreaterThan(0);
    expect(lvl1?.coronel.milho).toBeGreaterThanOrEqual(lvl1!.retirante.milho);

    const outOfBoundsLow = getDivinePassRewards(0);
    const outOfBoundsHigh = getDivinePassRewards(41);
    expect(outOfBoundsLow).toBeUndefined();
    expect(outOfBoundsHigh).toBeUndefined();
  });

  it('deve garantir o Galo Sazonal do Mês na Trilha do Coronel no Nível 30', () => {
    const lvl30 = getDivinePassRewards(30);
    expect(lvl30).toBeDefined();
    expect(lvl30?.coronel.seasonalRoosterGuaranteed).toBe(true);
    expect(lvl30?.coronel.seasonalRooster).toBe('Galo Sazonal do Mês');
    expect(lvl30?.coronelBonus.seasonalRoosterGuaranteed).toBe(true);
  });

  it('deve conceder moldura exclusiva no nível 40 da Trilha do Coronel', () => {
    const lvl40 = getDivinePassRewards(40);
    expect(lvl40?.coronel.exclusiveFrame).toBeDefined();
  });
});

describe('Cálculo de Nível do Passe Divino', () => {
  it('deve calcular corretamente o nível a partir do XP acumulado', () => {
    expect(calculatePassLevel(-500)).toBe(0);
    expect(calculatePassLevel(0)).toBe(0);
    expect(calculatePassLevel(899)).toBe(0);
    expect(calculatePassLevel(900)).toBe(1);
    expect(calculatePassLevel(1799)).toBe(1);
    expect(calculatePassLevel(1800)).toBe(2);
    expect(calculatePassLevel(27_000)).toBe(30);
    expect(calculatePassLevel(35_999)).toBe(39);
    expect(calculatePassLevel(36_000)).toBe(40);
    expect(calculatePassLevel(50_000)).toBe(40);
  });
});

describe('Missões do Passe Divino', () => {
  it('deve ter exatamente 3 missões diárias rendendo 100 XP cada (300 XP/dia)', () => {
    expect(DIVINE_PASS_DAILY_MISSIONS).toHaveLength(3);
    expect(DIVINE_PASS_CONFIG.dailyMissionsCount).toBe(3);
    const dailyTotal = DIVINE_PASS_DAILY_MISSIONS.reduce((sum, m) => sum + m.xpReward, 0);
    expect(dailyTotal).toBe(300);
    DIVINE_PASS_DAILY_MISSIONS.forEach((m) => {
      expect(m.category).toBe('diaria');
      expect(m.xpReward).toBe(100);
    });
  });

  it('deve ter exatamente 5 missões semanais rendendo 500 XP cada (2.500 XP/semana)', () => {
    expect(DIVINE_PASS_WEEKLY_MISSIONS).toHaveLength(5);
    expect(DIVINE_PASS_CONFIG.weeklyMissionsCount).toBe(5);
    const weeklyTotal = DIVINE_PASS_WEEKLY_MISSIONS.reduce((sum, m) => sum + m.xpReward, 0);
    expect(weeklyTotal).toBe(2500);
    DIVINE_PASS_WEEKLY_MISSIONS.forEach((m) => {
      expect(m.category).toBe('semanal');
      expect(m.xpReward).toBe(500);
    });
  });
});

describe('Calendário de 28 Dias de Login', () => {
  it('deve conter exatamente 28 dias de recompensas progressivas', () => {
    expect(LOGIN_CALENDAR_REWARDS).toHaveLength(28);
    expect(LOGIN_CALENDAR_CONFIG.totalDays).toBe(28);
    for (let day = 1; day <= 28; day++) {
      const reward = getLoginCalendarReward(day);
      expect(reward).toBeDefined();
      expect(reward?.day).toBe(day);
    }
    expect(getLoginCalendarReward(0)).toBeUndefined();
    expect(getLoginCalendarReward(29)).toBeUndefined();
  });

  it('deve conceder 100 Penas Douradas no Dia 7', () => {
    const day7 = getLoginCalendarReward(7);
    expect(day7).toBeDefined();
    expect(day7?.goldenFeathers).toBe(100);
    expect(day7?.description).toContain('100 Penas Douradas');
  });

  it('deve conceder Ovo de Galo Épico no Dia 14', () => {
    const day14 = getLoginCalendarReward(14);
    expect(day14).toBeDefined();
    expect(day14?.epicEggs).toBe(1);
    expect(day14?.description).toContain('Ovo de Galo Épico');
  });

  it('deve conceder 300 Penas Douradas + 50 Orbes Curinga no Dia 21', () => {
    const day21 = getLoginCalendarReward(21);
    expect(day21).toBeDefined();
    expect(day21?.goldenFeathers).toBe(300);
    expect(day21?.wildOrbs).toBe(50);
    expect(day21?.description).toContain('300 Penas Douradas');
    expect(day21?.description).toContain('50 Orbes Curinga');
  });

  it('deve garantir Galo Lendário no Dia 28', () => {
    const day28 = getLoginCalendarReward(28);
    expect(day28).toBeDefined();
    expect(day28?.legendaryRoosterGuaranteed).toBe(true);
    expect(day28?.description).toContain('Galo Lendário Garantido');
  });
});
