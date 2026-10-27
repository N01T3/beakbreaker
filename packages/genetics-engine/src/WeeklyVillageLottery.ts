export const MAX_WEEKLY_LOTTERY_TICKETS = 7;
export const LOTTERY_NUMBER_MIN = 1;
export const LOTTERY_NUMBER_MAX = 30;
export const LOTTERY_NUMBERS_COUNT = 5;

export interface VillageLotteryTicket {
  readonly ticketId: string;
  readonly dayOfWeek: number; // 0 (Domingo) a 6 (Sabado)
  readonly numbers: readonly number[]; // 5 numeros unicos ordenados
}

export interface VillageLotteryPrizeTier {
  readonly matches: number;
  readonly tierName: string;
  readonly cornReward: number;
  readonly goldenFeathers: number;
  readonly wildOrbs: number;
}

export const LOTTERY_PRIZE_TIERS: Record<number, VillageLotteryPrizeTier> = {
  5: { matches: 5, tierName: 'Prêmio Máximo da Vila', cornReward: 500_000, goldenFeathers: 500, wildOrbs: 100 },
  4: { matches: 4, tierName: 'Quatro Dezenas do Arraial', cornReward: 300_000, goldenFeathers: 150, wildOrbs: 40 },
  3: { matches: 3, tierName: 'Terno da Sorte', cornReward: 150_000, goldenFeathers: 50, wildOrbs: 10 },
  2: { matches: 2, tierName: 'Duque do Terreiro', cornReward: 50_000, goldenFeathers: 10, wildOrbs: 0 },
  1: { matches: 1, tierName: 'Consolação Sertaneja', cornReward: 10_000, goldenFeathers: 0, wildOrbs: 0 },
  0: { matches: 0, tierName: 'Sem Premiação', cornReward: 0, goldenFeathers: 0, wildOrbs: 0 },
};

export interface VillageLotteryTicketResult {
  readonly ticketId: string;
  readonly matchedCount: number;
  readonly matchedNumbers: readonly number[];
  readonly prize: VillageLotteryPrizeTier;
}

export interface WeeklyLotteryDrawResult {
  readonly drawnNumbers: readonly number[];
  readonly ticketResults: readonly VillageLotteryTicketResult[];
  readonly totalCornWon: number;
  readonly totalFeathersWon: number;
  readonly totalOrbsWon: number;
  readonly bestMatchCount: number;
}

export function validateLotteryNumbers(numbers: readonly number[]): readonly number[] {
  if (numbers.length !== LOTTERY_NUMBERS_COUNT) {
    throw new Error(`O bilhete precisa ter exatamente ${LOTTERY_NUMBERS_COUNT} dezenas.`);
  }
  const unique = Array.from(new Set(numbers)).sort((a, b) => a - b);
  if (unique.length !== LOTTERY_NUMBERS_COUNT) {
    throw new Error('As dezenas do bilhete nao podem ser repetidas.');
  }
  for (const n of unique) {
    if (n < LOTTERY_NUMBER_MIN || n > LOTTERY_NUMBER_MAX) {
      throw new Error(`As dezenas devem estar entre ${LOTTERY_NUMBER_MIN} e ${LOTTERY_NUMBER_MAX}.`);
    }
  }
  return unique;
}

export function addDailyMissionTicket(
  existingTickets: readonly VillageLotteryTicket[],
  numbers: readonly number[],
  ticketId = `ticket_${existingTickets.length + 1}`,
  dayOfWeek = new Date().getDay(),
): readonly VillageLotteryTicket[] {
  if (existingTickets.length >= MAX_WEEKLY_LOTTERY_TICKETS) {
    throw new Error(`Limite maximo de ${MAX_WEEKLY_LOTTERY_TICKETS} bilhetes por semana atingido.`);
  }
  const validNumbers = validateLotteryNumbers(numbers);
  const newTicket: VillageLotteryTicket = {
    ticketId,
    dayOfWeek,
    numbers: validNumbers,
  };
  return [...existingTickets, newTicket];
}

export function drawWeeklyLotteryNumbers(seed = 777): readonly number[] {
  let s = Math.abs(seed) || 12345;
  const picked = new Set<number>();
  while (picked.size < LOTTERY_NUMBERS_COUNT) {
    s = (s * 16807 + 11) % 2147483647;
    const num = (s % LOTTERY_NUMBER_MAX) + 1;
    picked.add(num);
  }
  return Array.from(picked).sort((a, b) => a - b);
}

export function isSundayDrawWindow(date: Date): boolean {
  // Domingo (0) as 20h (janela entre 20h00 e 20h59)
  return date.getDay() === 0 && date.getHours() === 20;
}

export function getNextSundayDrawDate(fromDate: Date): Date {
  const result = new Date(fromDate);
  const day = result.getDay();
  const diff = (7 - day) % 7;
  result.setDate(result.getDate() + diff);
  result.setHours(20, 0, 0, 0);
  if (result.getTime() <= fromDate.getTime()) {
    result.setDate(result.getDate() + 7);
  }
  return result;
}

export function evaluateLotteryTicket(
  ticket: VillageLotteryTicket,
  drawnNumbers: readonly number[],
): VillageLotteryTicketResult {
  const drawnSet = new Set(drawnNumbers);
  const matched = ticket.numbers.filter((n) => drawnSet.has(n));
  const matchedCount = matched.length;
  const prize = LOTTERY_PRIZE_TIERS[matchedCount] ?? LOTTERY_PRIZE_TIERS[0]!;

  return {
    ticketId: ticket.ticketId,
    matchedCount,
    matchedNumbers: matched,
    prize,
  };
}

export function evaluateWeeklyLottery(
  tickets: readonly VillageLotteryTicket[],
  drawnNumbers: readonly number[],
): WeeklyLotteryDrawResult {
  const ticketResults = tickets.map((t) => evaluateLotteryTicket(t, drawnNumbers));
  let totalCornWon = 0;
  let totalFeathersWon = 0;
  let totalOrbsWon = 0;
  let bestMatchCount = 0;

  for (const r of ticketResults) {
    totalCornWon += r.prize.cornReward;
    totalFeathersWon += r.prize.goldenFeathers;
    totalOrbsWon += r.prize.wildOrbs;
    if (r.matchedCount > bestMatchCount) {
      bestMatchCount = r.matchedCount;
    }
  }

  return {
    drawnNumbers,
    ticketResults,
    totalCornWon,
    totalFeathersWon,
    totalOrbsWon,
    bestMatchCount,
  };
}
