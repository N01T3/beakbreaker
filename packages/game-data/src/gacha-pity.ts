export const CHOCADEIRA_PITY_CONSTANTS = {
  featherCostPerPull: 160,
  tenPullFeatherCost: 1_600,
  baseLegendaryProb: 0.02,
  baseLegendaryPermille: 20,
  softPityStartPull: 61,
  softPityEndPull: 79,
  softPityStepProb: 0.05,
  softPityStepPermille: 50,
  hardPityPull: 80,
  consolidatedEffectiveRate: 0.0273,
  fiftyFiftyFeaturedRule: true,
  flashOfferWindowMinPull: 58,
  flashOfferWindowMaxPull: 65,
  flashOfferMaxFeatherBalance: 160,
  flashOfferPullsIncluded: 20,
  flashOfferPriceBrl: 34.9,
  flashOfferDurationHours: 2,
} as const;

export function getChocadeiraLegendaryProbability(pullNumber: number): number {
  if (pullNumber <= 0) return 0;
  if (pullNumber <= 60) return CHOCADEIRA_PITY_CONSTANTS.baseLegendaryProb;
  if (pullNumber >= 80) return 1.0;
  return Number(
    (
      CHOCADEIRA_PITY_CONSTANTS.baseLegendaryProb +
      CHOCADEIRA_PITY_CONSTANTS.softPityStepProb * (pullNumber - 60)
    ).toFixed(4),
  );
}

export interface HeroRaceLapSpec {
  lap: number;
  nodesCount: 5;
  itemsPerNode: number;
  immediatePoolPerNode: number;
  cooldownPoolPerNode: number;
  lapTotalItems: number;
  cumulativeItems: number;
  guaranteesHeroicRooster?: boolean;
  bonusHeroicOrbs?: number;
}

export const HERO_RACE_CONSTANTS = {
  totalLaps: 18,
  nodesPerLap: 5,
  baseItemsOffset: 6,
  immediatePoolRatio: 0.6,
  cooldownMinutesPerItem: 15,
  guaranteedHeroicLap: 15,
  cumulativeItemsAtLap15: 1_050,
  lap18BonusOrbs: 640,
  durationDays: 10,
  cycleDays: 15,
  playersPerTrack: 8,
} as const;

export const HERO_RACE_LAPS: readonly HeroRaceLapSpec[] = Array.from(
  { length: 18 },
  (_, idx) => {
    const lap = idx + 1;
    const itemsPerNode = 6 + lap;
    const immediatePoolPerNode = Math.ceil(0.6 * itemsPerNode);
    const cooldownPoolPerNode = Math.floor(0.4 * itemsPerNode);
    const lapTotalItems = itemsPerNode * 5;
    const cumulativeItems = Array.from({ length: lap }, (__, i) => (6 + i + 1) * 5).reduce(
      (a, b) => a + b,
      0,
    );
    return {
      lap,
      nodesCount: 5,
      itemsPerNode,
      immediatePoolPerNode,
      cooldownPoolPerNode,
      lapTotalItems,
      cumulativeItems,
      ...(lap === 15 ? { guaranteesHeroicRooster: true } : {}),
      ...(lap === 18 ? { bonusHeroicOrbs: 640 } : {}),
    };
  },
);

export const DIVINE_PASS_CONSTANTS = {
  totalLevels: 40,
  xpPerLevel: 900,
  totalXpRequired: 36_000,
  maxDailyMissionXp: 1_200,
  maxWeeklyMissionXp: 1_500,
  seasonDurationDays: 28,
  basePassPriceBrl: 29.9,
  elitePassPriceBrl: 59.9,
  basePassVipOrbs: 320,
  elitePassVipOrbs: 760,
  elitePassInstantLevels: 15,
  freeTrackFeathers: 400,
} as const;

export interface F2pFeatherSourceSpec {
  id: string;
  name: string;
  feathersPerMonth: number;
  sharePercent: number;
  routineDescription: string;
}

export const F2P_MONTHLY_FEATHERS: readonly F2pFeatherSourceSpec[] = [
  { id: 'missoes_diarias', name: 'Missões Diárias', feathersPerMonth: 4_800, sharePercent: 45.7, routineDescription: '160 Penas/dia (1 tiro diário garantido ao fechar as tarefas do dia).' },
  { id: 'missoes_semanais', name: 'Missões Semanais', feathersPerMonth: 2_000, sharePercent: 19.0, routineDescription: '500 Penas por semana concluída no quadro de metas.' },
  { id: 'bau_epico_bando', name: 'Baú Épico do Bando', feathersPerMonth: 1_000, sharePercent: 9.5, routineDescription: 'Participação ativa nas metas coletivas de 72h do Clã.' },
  { id: 'liga_ranqueada_ouro', name: 'Liga Ranqueada (Faixa Ouro)', feathersPerMonth: 800, sharePercent: 7.6, routineDescription: 'Recompensa de encerramento de temporada de 28 dias (sobe até 4.000 no Supremo).' },
  { id: 'torre_do_mandacaru', name: 'Torre do Mandacaru', feathersPerMonth: 600, sharePercent: 5.7, routineDescription: 'Escalada mensal dos 100 andares (custo zero de Fôlego).' },
  { id: 'corrida_de_herois', name: 'Corrida de Heróis', feathersPerMonth: 600, sharePercent: 5.7, routineDescription: 'Recompensas intermediárias de Volta nas duas corridas do mês.' },
  { id: 'conquistas_livro_cordel', name: 'Conquistas & Livro de Cordel', feathersPerMonth: 400, sharePercent: 3.8, routineDescription: 'Marcos de coleção, Desafios de Cordel e progressão de conta.' },
  { id: 'eventos_roda_loteria', name: 'Eventos, Roda do Arraial e Outros', feathersPerMonth: 300, sharePercent: 2.9, routineDescription: 'Giros a cada 2h na Roda, Loteria Semanal e caça a predadores.' },
] as const;

export const F2P_MONTHLY_FEATHERS_TOTAL = 10_500;
