import { describe, expect, it } from 'vitest';
import { getCordelFolhetos, getCordelFolhetoById } from '@beakbreaker/game-data';
import {
  CORDEL_PUZZLE_FOLEGO_COST,
  executeCordelPuzzle,
  getUnlockedFolhetos,
} from '../src/CordelPuzzleEngine.js';
import {
  PREDATORS,
  canTriggerPredatorIncursion,
  generatePredatorIncursion,
  repelPredator,
  MAX_DAILY_PREDATOR_INCURSIONS,
  type WatchmanAthlete,
} from '../src/FarmPredatorDefenseEngine.js';
import {
  MAX_WEEKLY_LOTTERY_TICKETS,
  addDailyMissionTicket,
  evaluateLotteryTicket,
  evaluateWeeklyLottery,
  isSundayDrawWindow,
  getNextSundayDrawDate,
  validateLotteryNumbers,
  type VillageLotteryTicket,
} from '../src/WeeklyVillageLottery.js';

describe('Desafios de Cordel (Puzzles Táticos)', () => {
  it('contém catálogo com os 6 folhetos temáticos especificados', () => {
    const folhetos = getCordelFolhetos();
    expect(folhetos.length).toBeGreaterThanOrEqual(6);
    const expected = [
      'folheto_revolta_cariri', 'folheto_lendas_lua', 'folheto_cangaco_misterioso',
      'folheto_vento_caatinga', 'folheto_asa_branca_celestial', 'folheto_festa_padroeiro',
    ];
    for (const id of expected) {
      const f = getCordelFolhetoById(id);
      expect(f).toBeDefined();
      expect(f?.rhymeVerse.length).toBeGreaterThanOrEqual(4);
      expect(f?.borrowedTeam).toHaveLength(3);
      expect(f?.opponentTeam).toHaveLength(3);
      expect(f?.firstClearReward.goldenFeathers).toBeGreaterThan(0);
      expect(f?.firstClearReward.wildOrbs).toBeGreaterThan(0);
    }
  });

  it('garante custo zero de fôlego da fazenda para jogar os folhetos', () => {
    expect(CORDEL_PUZZLE_FOLEGO_COST).toBe(0);
    const outcome = executeCordelPuzzle('folheto_revolta_cariri', { seed: 1234 });
    expect(outcome.folegoSpent).toBe(0);
  });

  it('valida conclusão e entrega recompensas de primeira vitória e bônus de temporada', () => {
    const outcome1 = executeCordelPuzzle('folheto_revolta_cariri', {
      seed: 9999, isSeasonActive: true, completedPuzzleIds: [],
    });
    expect(outcome1.folhetoId).toBe('folheto_revolta_cariri');
    if (outcome1.victory) {
      expect(outcome1.isFirstClear).toBe(true);
      expect(outcome1.isSeasonBonus).toBe(true);
      expect(outcome1.rewards?.goldenFeathers).toBe(120 + 40);
      expect(outcome1.rewards?.wildOrbs).toBe(30 + 10);
    }

    const outcomeRepeat = executeCordelPuzzle('folheto_revolta_cariri', {
      seed: 9999, isSeasonActive: false, completedPuzzleIds: ['folheto_revolta_cariri'],
    });
    if (outcomeRepeat.victory) {
      expect(outcomeRepeat.isFirstClear).toBe(false);
      expect(outcomeRepeat.rewards?.goldenFeathers).toBe(10);
    }
  });

  it('gerencia progressão de desbloqueio sequencial dos folhetos', () => {
    const initialUnlocked = getUnlockedFolhetos([]);
    expect(initialUnlocked).toHaveLength(1);
    expect(initialUnlocked[0]?.id).toBe('folheto_revolta_cariri');
    const nextUnlocked = getUnlockedFolhetos(['folheto_revolta_cariri']);
    expect(nextUnlocked).toHaveLength(2);
    expect(nextUnlocked[1]?.id).toBe('folheto_lendas_lua');
  });
});

describe('Defesa da Fazenda contra Predadores', () => {
  it('apresenta os 3 predadores com forças de ameaça e defesas prediletas', () => {
    expect(PREDATORS.gaviao_sertao.name).toBe('Gavião do Sertão');
    expect(PREDATORS.raposa_caatinga.name).toBe('Raposa da Caatinga');
    expect(PREDATORS.teiu_ligeiro.name).toBe('Teiú Ligeiro');
  });

  it('limita incursões a no máximo 2x ao dia', () => {
    expect(MAX_DAILY_PREDATOR_INCURSIONS).toBe(2);
    expect(canTriggerPredatorIncursion(0)).toBe(true);
    expect(canTriggerPredatorIncursion(1)).toBe(true);
    expect(canTriggerPredatorIncursion(2)).toBe(false);
  });

  it('gera incursão diária consistente pelo slot e data', () => {
    const inc1 = generatePredatorIncursion('2026-10-27', 1, 100);
    expect(inc1.slotIndex).toBe(1);
    expect(inc1.predator).toBeDefined();
  });

  it('afugenta predador com defesas e atletas de vigia, entregando drops rurais', () => {
    const watchmen: WatchmanAthlete[] = [
      { roosterId: 'r1', name: 'Atleta Guarda', vigor: 8000, forca: 700, velocidade: 150 },
    ];
    const defenses = { estilingueLevel: 2, espantalhoLevel: 1, cataVentoLevel: 1 };
    const result = repelPredator('gaviao_sertao', defenses, watchmen, 5);

    expect(result.repelled).toBe(true);
    expect(result.efficiencyRatio).toBeGreaterThan(1);
    expect(result.drops.rescuedCorn).toBeGreaterThanOrEqual(15000);
    expect(result.drops.rareSeeds).toBeGreaterThanOrEqual(2);
    expect(result.drops.goldenFeathers).toBeGreaterThanOrEqual(25);
    expect(result.drops.caipiraEggs).toBeGreaterThanOrEqual(1);
  });

  it('falha no afugentamento caso terreiro esteja desprotegido', () => {
    const result = repelPredator('raposa_caatinga', {}, [], 0);
    expect(result.repelled).toBe(false);
    expect(result.drops.rescuedCorn).toBe(0);
    expect(result.drops.rareSeeds).toBe(0);
  });
});

describe('Loteria Semanal da Vila', () => {
  it('valida dezenas escolhidas e proíbe bilhetes fora do padrão', () => {
    expect(validateLotteryNumbers([1, 5, 12, 20, 30])).toEqual([1, 5, 12, 20, 30]);
    expect(() => validateLotteryNumbers([1, 2, 3])).toThrow();
    expect(() => validateLotteryNumbers([1, 1, 3, 4, 5])).toThrow();
    expect(() => validateLotteryNumbers([0, 5, 10, 15, 20])).toThrow();
  });

  it('permite até 7 bilhetes por semana via missões diárias', () => {
    let tickets: readonly VillageLotteryTicket[] = [];
    for (let day = 0; day < 7; day++) {
      tickets = addDailyMissionTicket(tickets, [1, 2, 3, 4, day + 10], `t_${day}`, day);
    }
    expect(tickets).toHaveLength(MAX_WEEKLY_LOTTERY_TICKETS);
    expect(() => addDailyMissionTicket(tickets, [1, 2, 3, 4, 5])).toThrow(/Limite maximo/);
  });

  it('reconhece janela oficial de sorteio no domingo às 20h', () => {
    const sunday20h = new Date(2026, 9, 25, 20, 15);
    expect(isSundayDrawWindow(sunday20h)).toBe(true);
    const monday10h = new Date(2026, 9, 26, 10, 0);
    expect(isSundayDrawWindow(monday10h)).toBe(false);
    const nextSunday = getNextSundayDrawDate(monday10h);
    expect(nextSunday.getDay()).toBe(0);
    expect(nextSunday.getHours()).toBe(20);
  });

  it('sorteia e distribui prêmios pelas faixas de acerto', () => {
    const drawn = [5, 10, 15, 20, 25];
    const jackpot: VillageLotteryTicket = { ticketId: 'jackpot', dayOfWeek: 0, numbers: [5, 10, 15, 20, 25] };
    const resJackpot = evaluateLotteryTicket(jackpot, drawn);
    expect(resJackpot.matchedCount).toBe(5);
    expect(resJackpot.prize.cornReward).toBe(500_000);
    expect(resJackpot.prize.goldenFeathers).toBe(500);
    expect(resJackpot.prize.wildOrbs).toBe(100);

    const ticket3: VillageLotteryTicket = { ticketId: 't3', dayOfWeek: 2, numbers: [5, 10, 15, 2, 3] };
    const res3 = evaluateLotteryTicket(ticket3, drawn);
    expect(res3.matchedCount).toBe(3);
    expect(res3.prize.cornReward).toBe(150_000);
    expect(res3.prize.goldenFeathers).toBe(50);
    expect(res3.prize.wildOrbs).toBe(10);

    const summary = evaluateWeeklyLottery([jackpot, ticket3], drawn);
    expect(summary.totalCornWon).toBe(650_000);
    expect(summary.totalFeathersWon).toBe(550);
    expect(summary.totalOrbsWon).toBe(110);
    expect(summary.bestMatchCount).toBe(5);
  });
});
