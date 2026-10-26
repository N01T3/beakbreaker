import {
  DEFAULT_CHOCADEIRA_BANNER,
  executeSinglePull,
  type GachaPlayerState,
} from '@beakbreaker/genetics-engine';

export interface SedeMilestone {
  sedeLevel: number;
  requiredAccountLevel: number;
  cornCost: number;
  buildTimeHours: number;
  targetDayF2P: number;
}

export const SEDE_PROGRESSION_TABLE: readonly SedeMilestone[] = [
  { sedeLevel: 1, requiredAccountLevel: 1, cornCost: 0, buildTimeHours: 0, targetDayF2P: 0 },
  { sedeLevel: 2, requiredAccountLevel: 2, cornCost: 2_000, buildTimeHours: 1 / 60, targetDayF2P: 0 },
  { sedeLevel: 3, requiredAccountLevel: 4, cornCost: 10_000, buildTimeHours: 0.25, targetDayF2P: 1 },
  { sedeLevel: 4, requiredAccountLevel: 7, cornCost: 40_000, buildTimeHours: 1, targetDayF2P: 3 },
  { sedeLevel: 5, requiredAccountLevel: 10, cornCost: 120_000, buildTimeHours: 3, targetDayF2P: 6 },
  { sedeLevel: 6, requiredAccountLevel: 14, cornCost: 350_000, buildTimeHours: 6, targetDayF2P: 12 },
  { sedeLevel: 7, requiredAccountLevel: 18, cornCost: 900_000, buildTimeHours: 10, targetDayF2P: 20 },
  { sedeLevel: 8, requiredAccountLevel: 22, cornCost: 2_000_000, buildTimeHours: 16, targetDayF2P: 30 },
  { sedeLevel: 9, requiredAccountLevel: 27, cornCost: 4_000_000, buildTimeHours: 24, targetDayF2P: 50 },
  { sedeLevel: 10, requiredAccountLevel: 32, cornCost: 7_500_000, buildTimeHours: 36, targetDayF2P: 75 },
  { sedeLevel: 11, requiredAccountLevel: 38, cornCost: 12_000_000, buildTimeHours: 48, targetDayF2P: 105 },
  { sedeLevel: 12, requiredAccountLevel: 45, cornCost: 20_000_000, buildTimeHours: 72, targetDayF2P: 150 },
] as const;

export const MONTHLY_F2P_FEATHER_SOURCES = {
  dailyMissions: 4_800,     // 160 Penas/dia × 30 dias (45,7%)
  weeklyMissions: 2_000,    // 500 Penas/semana × 4 semanas (19,0%)
  clanEpicChest: 1_000,     // Metas coletivas de 72h do Bando (9,5%)
  rankedLeagueGold: 800,    // Faixa Ouro de fim de temporada (7,6%)
  mandacaruTower100F: 600,  // Escalada mensal 100 andares (5,7%)
  heroRaceMilestones: 600,  // 2 corridas mensais (5,7%)
  cordelBookAndQuests: 400, // Álbum e Desafios de Cordel (3,8%)
  liveOpsWheelLottery: 300, // Roda do Arraial, Loteria e Predadores (2,9%)
} as const;

function createMulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x9e3779b9) >>> 0;
    let z = a;
    z = Math.imul(z ^ (z >>> 16), 0x21f0aaad);
    z = Math.imul(z ^ (z >>> 15), 0x735a2d97);
    return ((z ^ (z >>> 15)) >>> 0) / 4294967296;
  };
}

export function runChocadeiraMonteCarlo(totalPulls = 1_000_000, seed = 101) {
  const rng = createMulberry32(seed);
  let state: GachaPlayerState = {
    pityCounter: 0,
    epicPityCounter: 0,
    guaranteedFeaturedNext: false,
    goldenFeathers: Number.MAX_SAFE_INTEGER,
  };

  let legendaries = 0;
  let featuredLegendaries = 0;
  let epics = 0;
  let maxPullsWithoutLegendary = 0;
  let currentStreak = 0;

  for (let i = 0; i < totalPulls; i++) {
    currentStreak++;
    const out = executeSinglePull(state, DEFAULT_CHOCADEIRA_BANNER, rng, false);
    state = out.stateAfter;
    if (out.rarity === 'Lendario') {
      legendaries++;
      if (out.isFeaturedLegendary) featuredLegendaries++;
      if (currentStreak > maxPullsWithoutLegendary) {
        maxPullsWithoutLegendary = currentStreak;
      }
      currentStreak = 0;
    } else if (out.rarity === 'Epico') {
      epics++;
    }
  }

  const consolidatedRatePercent = (legendaries / totalPulls) * 100;
  return {
    totalPulls,
    legendaries,
    featuredLegendaries,
    epics,
    consolidatedRatePercent: Number(consolidatedRatePercent.toFixed(4)),
    maxPullsWithoutLegendary,
  };
}

export function simulate180DaysF2P() {
  const monthlyFeathers = Object.values(MONTHLY_F2P_FEATHER_SOURCES).reduce((a, b) => a + b, 0);
  const dailyFeathersAvg = monthlyFeathers / 30;
  const sedeArrivalByDay = new Map<number, number>();
  let currentSede = 2;

  for (let day = 1; day <= 180; day++) {
    for (const milestone of SEDE_PROGRESSION_TABLE) {
      if (milestone.sedeLevel > currentSede && day >= milestone.targetDayF2P) {
        currentSede = milestone.sedeLevel;
      }
    }
    sedeArrivalByDay.set(day, currentSede);
  }

  return {
    daysSimulated: 180,
    monthlyFeathersF2P: monthlyFeathers,
    totalFeathers180Days: Math.round(dailyFeathersAvg * 180),
    sedeAtDay1: sedeArrivalByDay.get(1)!,
    sedeAtDay12: sedeArrivalByDay.get(12)!,
    sedeAtDay30: sedeArrivalByDay.get(30)!,
    sedeAtDay150: sedeArrivalByDay.get(150)!,
    sedeAtDay180: sedeArrivalByDay.get(180)!,
  };
}

export function main() {
  const gachaAudit = runChocadeiraMonteCarlo(1_000_000, 101);
  const f2pAudit = simulate180DaysF2P();

  const rateOk =
    Math.abs(gachaAudit.consolidatedRatePercent - 2.73) <= 0.02 &&
    gachaAudit.maxPullsWithoutLegendary <= 80;
  const f2pOk =
    f2pAudit.monthlyFeathersF2P === 10_500 &&
    f2pAudit.sedeAtDay1 === 3 &&
    f2pAudit.sedeAtDay12 === 6 &&
    f2pAudit.sedeAtDay30 === 8 &&
    f2pAudit.sedeAtDay150 === 12;

  console.log(JSON.stringify({ gachaAudit, f2pAudit, passed: rateOk && f2pOk }, null, 2));
  if (!rateOk || !f2pOk) {
    process.exit(1);
  }
}

main();
