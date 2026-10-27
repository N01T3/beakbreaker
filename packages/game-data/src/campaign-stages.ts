import type { CampaignChapterSpec } from './farm-tables.js';

export interface CampaignStageReward {
  feathers: number;
  milho: number;
  wildOrbs: number;
}

export interface CampaignSweepReward {
  milho: number;
  trainerXp: number;
}

export interface CampaignEnemyUnit {
  roosterSpecId: string;
  level: number;
  row: 'frente' | 'tras';
}

export interface CampaignStageSpec {
  stageNumber: number;
  chapterNumber: number;
  name: string;
  isBossStage: boolean;
  folegoCost: number;
  recommendedNg: number;
  firstClearRewards: CampaignStageReward;
  sweepRewards: CampaignSweepReward;
  enemyTeam: CampaignEnemyUnit[];
}

export interface ChapterBossSpec {
  chapter: number;
  stage: number;
  name: string;
  roosterClass: string;
  element: string;
  row: 'frente' | 'tras';
}

export const CHAPTER_BOSS_SPECS: readonly ChapterBossSpec[] = [
  { chapter: 1, stage: 15, name: 'Valentão do Cariri', roosterClass: 'Bruiser', element: 'Brasa', row: 'frente' },
  { chapter: 2, stage: 30, name: 'Zabumba Gigante', roosterClass: 'Tanque', element: 'Barro', row: 'frente' },
  { chapter: 3, stage: 45, name: 'Barqueira do Rio', roosterClass: 'Controle', element: 'Correnteza', row: 'tras' },
  { chapter: 4, stage: 60, name: 'Caipora Ancestral', roosterClass: 'Assassino', element: 'Mata', row: 'tras' },
  { chapter: 5, stage: 75, name: 'Jangadeiro do Vento', roosterClass: 'Atirador', element: 'Vento', row: 'tras' },
  { chapter: 6, stage: 90, name: 'Galo de Ferro', roosterClass: 'Tanque/Bruiser', element: 'Sol', row: 'frente' },
] as const;

export const CAMPAIGN_CHAPTER_SPECS: readonly CampaignChapterSpec[] = [
  { chapter: 1, regionName: 'Cariri', stageStart: 1, stageEnd: 15, bossName: 'Valentão do Cariri', ngMin: 1, ngMax: 10, staminaCostPerStage: 6, description: 'Vô Tonho entrega a fazenda; Cariri e primeiros desafios.' },
  { chapter: 2, regionName: 'Caruaru', stageStart: 16, stageEnd: 30, bossName: 'Zabumba Gigante', ngMin: 10, ngMax: 20, staminaCostPerStage: 6, description: 'Feira de artesanato e forró; ritmo do Zabumba Gigante.' },
  { chapter: 3, regionName: 'Velho Chico', stageStart: 31, stageEnd: 45, bossName: 'Barqueira do Rio', ngMin: 20, ngMax: 30, staminaCostPerStage: 6, description: 'Margens do Rio São Francisco e as correntezas da Barqueira.' },
  { chapter: 4, regionName: 'Serra da Capivara', stageStart: 46, stageEnd: 60, bossName: 'Caipora Ancestral', ngMin: 30, ngMax: 40, staminaCostPerStage: 6, description: 'Cânions rupestres protegidos pela mítica Caipora Ancestral.' },
  { chapter: 5, regionName: 'Mar de Jangadas', stageStart: 61, stageEnd: 75, bossName: 'Jangadeiro do Vento', ngMin: 40, ngMax: 50, staminaCostPerStage: 6, description: 'Ventos litorâneos velozes sob o comando do Jangadeiro.' },
  { chapter: 6, regionName: 'Raso da Catarina', stageStart: 76, stageEnd: 90, bossName: 'Galo de Ferro', ngMin: 50, ngMax: 65, staminaCostPerStage: 6, description: 'Confronto final contra o temido Galo de Ferro no calor do sertão.' },
] as const;

const CHAPTER_ROOSTER_POOLS: Record<number, string[]> = {
  1: ['rooster_01', 'rooster_04', 'rooster_05', 'rooster_32'],
  2: ['rooster_02', 'rooster_06', 'rooster_07', 'rooster_15'],
  3: ['rooster_05', 'rooster_31', 'rooster_33', 'rooster_34'],
  4: ['rooster_12', 'rooster_13', 'rooster_17', 'rooster_25'],
  5: ['rooster_10', 'rooster_22', 'rooster_35', 'rooster_39'],
  6: ['rooster_11', 'rooster_21', 'rooster_27', 'rooster_28'],
};

function buildEnemyTeam(stage: number, chapter: number, isBoss: boolean, boss: ChapterBossSpec): CampaignEnemyUnit[] {
  const pool = CHAPTER_ROOSTER_POOLS[chapter] ?? ['rooster_01', 'rooster_04', 'rooster_05'];
  const baseLvl = Math.max(1, Math.round(stage * 0.9 + 1));
  if (isBoss) {
    const bossId = `boss_${boss.name.toLowerCase().replace(/[\s-]+/g, '_')}`;
    const minion1 = pool[(stage + 1) % pool.length]!;
    const minion2 = pool[(stage + 2) % pool.length]!;
    return [
      { roosterSpecId: bossId, level: baseLvl + 3, row: boss.row },
      { roosterSpecId: minion1, level: baseLvl, row: boss.row === 'frente' ? 'tras' : 'frente' },
      { roosterSpecId: minion2, level: baseLvl, row: 'tras' },
    ];
  }
  return [
    { roosterSpecId: pool[stage % pool.length]!, level: baseLvl, row: 'frente' },
    { roosterSpecId: pool[(stage + 1) % pool.length]!, level: baseLvl, row: stage % 2 === 0 ? 'frente' : 'tras' },
    { roosterSpecId: pool[(stage + 2) % pool.length]!, level: baseLvl, row: 'tras' },
  ];
}

function createCampaignStage(stage: number): CampaignStageSpec {
  const chapterNumber = Math.ceil(stage / 15);
  const chapter = CAMPAIGN_CHAPTER_SPECS[chapterNumber - 1]!;
  const isBossStage = stage % 15 === 0;
  const boss = CHAPTER_BOSS_SPECS[chapterNumber - 1]!;
  const name = isBossStage ? boss.name : `${chapter.regionName} - Fase ${stage}`;
  const recommendedNg = Math.round(1 + ((stage - 1) * 64) / 89);
  return {
    stageNumber: stage,
    chapterNumber,
    name,
    isBossStage,
    folegoCost: 6,
    recommendedNg,
    firstClearRewards: {
      feathers: isBossStage ? chapterNumber * 50 : chapterNumber * 10,
      milho: isBossStage ? stage * 250 : stage * 80 + 200,
      wildOrbs: isBossStage ? chapterNumber * 5 : stage % 5 === 0 ? 1 : 0,
    },
    sweepRewards: {
      milho: 100 + stage * 15,
      trainerXp: 25 + stage * 5,
    },
    enemyTeam: buildEnemyTeam(stage, chapterNumber, isBossStage, boss),
  };
}

const ALL_CAMPAIGN_STAGES_LIST: readonly CampaignStageSpec[] = Array.from(
  { length: 90 },
  (_, idx) => createCampaignStage(idx + 1),
);

export function getAllCampaignStages(): readonly CampaignStageSpec[] {
  return ALL_CAMPAIGN_STAGES_LIST;
}

export function getCampaignStage(stage: number): CampaignStageSpec {
  if (!Number.isInteger(stage) || stage < 1 || stage > 90) {
    throw new Error(`Fase da campanha inválida: ${stage}. Deve ser entre 1 e 90.`);
  }
  return ALL_CAMPAIGN_STAGES_LIST[stage - 1]!;
}

export function getAllCampaignChapters(): readonly CampaignChapterSpec[] {
  return CAMPAIGN_CHAPTER_SPECS;
}

export function getChapterBoss(chapter: number): ChapterBossSpec | undefined {
  return CHAPTER_BOSS_SPECS.find((b) => b.chapter === chapter);
}
