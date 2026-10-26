import { Rarity, TowerModifierId } from './schemas/index.js';

export interface SedeLevelSpec {
  level: number;
  requiredNc: number;
  cornCost: number;
  buildTimeSeconds: number;
  buildTimeLabel: string;
  expectedF2pDay: number;
  expectedF2pLabel: string;
  ngMaxBase: number;
  unlocks: readonly string[];
}

export const SEDE_LEVELS: readonly SedeLevelSpec[] = [
  { level: 1, requiredNc: 1, cornCost: 0, buildTimeSeconds: 0, buildTimeLabel: 'Imediato', expectedF2pDay: 0, expectedF2pLabel: 'Início', ngMaxBase: 5, unlocks: ['Poleiros Nv. 1', 'Milharal', 'Celeiro', 'Chocadeira'] },
  { level: 2, requiredNc: 2, cornCost: 2_000, buildTimeSeconds: 60, buildTimeLabel: '1 min', expectedF2pDay: 0, expectedF2pLabel: 'Tutorial', ngMaxBase: 10, unlocks: ['Ninhal (1ª vaga)', 'Enfermaria', 'Bosque da Mata', 'Poleiro Nv. 2'] },
  { level: 3, requiredNc: 4, cornCost: 10_000, buildTimeSeconds: 900, buildTimeLabel: '15 min', expectedF2pDay: 1, expectedF2pLabel: 'Dia 1', ngMaxBase: 15, unlocks: ['Centro de Treino', 'Altar do Sol', 'Recanto da Lua', 'Cerca de Mandacaru', 'Poleiro Nv. 3'] },
  { level: 4, requiredNc: 7, cornCost: 40_000, buildTimeSeconds: 3_600, buildTimeLabel: '1 h', expectedF2pDay: 3, expectedF2pLabel: 'Dia 3', ngMaxBase: 20, unlocks: ['Oficina da Vila', 'Árvore da Vida', 'Estilingue de Sabugo', 'NG 20 (1ª Evolução Ramificada)'] },
  { level: 5, requiredNc: 10, cornCost: 120_000, buildTimeSeconds: 10_800, buildTimeLabel: '3 h', expectedF2pDay: 6, expectedF2pLabel: 'Dia 6', ngMaxBase: 25, unlocks: ['Poleiro Nv. 4', '2ª vaga do Ninhal'] },
  { level: 6, requiredNc: 14, cornCost: 350_000, buildTimeSeconds: 21_600, buildTimeLabel: '6 h', expectedF2pDay: 12, expectedF2pLabel: 'Dia 12', ngMaxBase: 30, unlocks: ['Santuário Genético Nv. 1', 'Espantalho Assombrado', 'Poleiro Nv. 5'] },
  { level: 7, requiredNc: 18, cornCost: 900_000, buildTimeSeconds: 36_000, buildTimeLabel: '10 h', expectedF2pDay: 20, expectedF2pLabel: 'Dia 20', ngMaxBase: 35, unlocks: ['Santuário Genético Nv. 2'] },
  { level: 8, requiredNc: 22, cornCost: 2_000_000, buildTimeSeconds: 57_600, buildTimeLabel: '16 h', expectedF2pDay: 30, expectedF2pLabel: 'Dia 30', ngMaxBase: 40, unlocks: ['NG 40 (2ª Evolução Ramificada)', 'Cata-Vento de Alerta', '3º Peão grátis', 'Santuário Nv. 3 e 4'] },
  { level: 9, requiredNc: 27, cornCost: 4_000_000, buildTimeSeconds: 86_400, buildTimeLabel: '24 h', expectedF2pDay: 50, expectedF2pLabel: 'Dia 50', ngMaxBase: 45, unlocks: ['3ª vaga do Ninhal', 'Santuário Genético Nv. 5'] },
  { level: 10, requiredNc: 32, cornCost: 7_500_000, buildTimeSeconds: 129_600, buildTimeLabel: '36 h', expectedF2pDay: 75, expectedF2pLabel: 'Dia 75', ngMaxBase: 50, unlocks: ['Poleiro Nv. 7', '2ª vaga do Lapidário (Sertão Ancestral)', 'Santuário Nv. 6'] },
  { level: 11, requiredNc: 38, cornCost: 12_000_000, buildTimeSeconds: 172_800, buildTimeLabel: '48 h', expectedF2pDay: 105, expectedF2pLabel: 'Dia 105', ngMaxBase: 55, unlocks: ['Santuário Genético Nv. 7'] },
  { level: 12, requiredNc: 45, cornCost: 20_000_000, buildTimeSeconds: 259_200, buildTimeLabel: '72 h', expectedF2pDay: 150, expectedF2pLabel: 'Dia 150', ngMaxBase: 60, unlocks: ['NG 60 (Teto Base)', 'Poleiro Nv. 8 (50k Milho)', 'Santuário Genético Nv. 8'] },
] as const;

export interface PerchLevelSpec {
  level: number;
  roosterSlots: number;
  cornCapacity: number;
  minSedeLevel: number;
}

export const PERCH_LEVELS: readonly PerchLevelSpec[] = [
  { level: 1, roosterSlots: 2, cornCapacity: 3_000, minSedeLevel: 1 },
  { level: 2, roosterSlots: 2, cornCapacity: 5_000, minSedeLevel: 2 },
  { level: 3, roosterSlots: 3, cornCapacity: 8_000, minSedeLevel: 3 },
  { level: 4, roosterSlots: 3, cornCapacity: 12_000, minSedeLevel: 5 },
  { level: 5, roosterSlots: 4, cornCapacity: 18_000, minSedeLevel: 6 },
  { level: 6, roosterSlots: 4, cornCapacity: 26_000, minSedeLevel: 8 },
  { level: 7, roosterSlots: 5, cornCapacity: 36_000, minSedeLevel: 10 },
  { level: 8, roosterSlots: 5, cornCapacity: 50_000, minSedeLevel: 12 },
] as const;

export const RARITY_PERCH_BASE: Record<Rarity, number> = {
  Comum: 1.5,
  Raro: 2.2,
  Epico: 3.2,
  Lendario: 4.8,
  Mitico: 6.5,
  Heroico: 7.0,
  Primordial: 7.5,
};

export interface SaintTowerSpec {
  id: string;
  name: string;
  cooldownHours: number;
  durationMinutes: number;
  effectDescription: string;
}

export const SAINT_TOWERS: readonly SaintTowerSpec[] = [
  { id: 'torre_da_fartura', name: 'Torre da Fartura', cooldownHours: 24, durationMinutes: 0, effectDescription: 'Credita imediatamente no Celeiro 360 minutos (6h) da produção total de todos os Poleiros (recarga: 24h).' },
  { id: 'torre_de_sao_jorge', name: 'Torre de São Jorge', cooldownHours: 24, durationMinutes: 60, effectDescription: '+15% Força e Vigor na Arena por 1h.' },
  { id: 'torre_da_parteira', name: 'Torre da Parteira', cooldownHours: 24, durationMinutes: 0, effectDescription: 'Reduz em 4h os timers da Chocadeira e do Ninhal.' },
  { id: 'torre_do_cangaco', name: 'Torre do Cangaço', cooldownHours: 24, durationMinutes: 30, effectDescription: 'Dobra a chance de mutação genética por 30 min.' },
] as const;

export interface FarmDefenseSpec {
  id: string;
  name: string;
  unlockSedeLevel: number;
  description: string;
}

export const FARM_DEFENSES: readonly FarmDefenseSpec[] = [
  { id: 'cerca_de_mandacaru', name: 'Cerca de Mandacaru', unlockSedeLevel: 3, description: 'Barreira espinhosa na Onda 1 do Saque que reflete dano físico nos invasores.' },
  { id: 'estilingue_de_sabugo', name: 'Estilingue de Sabugo', unlockSedeLevel: 4, description: 'Torreta rural que dispara sabugos contra a retaguarda do trio invasor.' },
  { id: 'espantalho_assombrado', name: 'Espantalho Assombrado', unlockSedeLevel: 6, description: 'Estrutura que aplica Cego e reduz o Canto inicial do trio invasor.' },
  { id: 'cata_vento_de_alerta', name: 'Cata-Vento de Alerta', unlockSedeLevel: 8, description: 'Acelera a Velocidade de ataque do Trio Guardião e concede Escudo inicial.' },
] as const;

export interface TowerModifierSpec {
  id: TowerModifierId;
  number: number;
  name: string;
  description: string;
}

export const TOWER_MODIFIERS: readonly TowerModifierSpec[] = [
  { id: 'Seca', number: 1, name: 'Seca', description: 'Galos de Brasa e Sol ganham +20% Força; curas caem em -30%.' },
  { id: 'Chuva', number: 2, name: 'Chuva', description: 'Galos de Correnteza e Mata ganham +20% Vigor e Regeneração.' },
  { id: 'Noite', number: 3, name: 'Noite', description: 'Galos de Lua ganham +15 p.p. de Esquiva e +20% Dano Crítico.' },
  { id: 'Ventania', number: 4, name: 'Ventania', description: 'Aumenta em +25% a Velocidade de Assassinos e Atiradores.' },
  { id: 'SolAPino', number: 5, name: 'Sol a Pino', description: 'Galos de Sol começam com +300 Canto; Escudos duram -1 s.' },
  { id: 'NeblinaDaSerra', number: 6, name: 'Neblina da Serra', description: 'Ataques básicos da Fila de Trás têm 20% de chance de errar.' },
  { id: 'Muralha', number: 7, name: 'Muralha', description: 'Fila da Frente recebe +35% Defesa e começa com Escudo de 20%.' },
  { id: 'Assombracao', number: 8, name: 'Assombração', description: 'Nocautes drenam 200 de Canto dos sobreviventes inimigos.' },
  { id: 'FuriaDoCoronel', number: 9, name: 'Fúria do Coronel', description: 'Todos os galos em campo ganham +5% Força a cada 10 segundos.' },
  { id: 'FeNaSanfona', number: 10, name: 'Fé na Sanfona', description: 'A geração de Canto por golpe é dobrada para ambos os lados.' },
  { id: 'Espinheiro', number: 11, name: 'Espinheiro', description: 'Todos em campo refletem 10% do dano básico recebido.' },
  { id: 'FestaNoArraial', number: 12, name: 'Festa no Arraial', description: 'Andares Chefes (10F, 20F... 100F): +15% status e Torcida 2x.' },
] as const;

export interface CampaignChapterSpec {
  chapter: number;
  regionName: string;
  stageStart: number;
  stageEnd: number;
  bossName: string;
  ngMin: number;
  ngMax: number;
  staminaCostPerStage: number;
  description: string;
}

export const CAMPAIGN_CHAPTERS: readonly CampaignChapterSpec[] = [
  { chapter: 1, regionName: 'Cariri', stageStart: 1, stageEnd: 15, bossName: 'Valentão', ngMin: 1, ngMax: 10, staminaCostPerStage: 6, description: 'Vô Tonho entrega a fazenda; desbloqueia #1 Galo Campina, #4 Faísca, #5 Brisa do Rio e #32 Barro Vermelho.' },
  { chapter: 2, regionName: 'Caruaru', stageStart: 16, stageEnd: 30, bossName: 'Zabumba Gigante', ngMin: 10, ngMax: 20, staminaCostPerStage: 6, description: 'Feira de artesanato e forró; libera #2 Zabumba e primeiros catalisadores de evolução ramificada.' },
  { chapter: 3, regionName: 'Velho Chico', stageStart: 31, stageEnd: 45, bossName: 'Barqueira do Rio', ngMin: 20, ngMax: 30, staminaCostPerStage: 6, description: 'Margens do Rio São Francisco; libera #31 Bacurau e #33 Carranca + peças das Torres dos Santos.' },
  { chapter: 4, regionName: 'Serra da Capivara', stageStart: 46, stageEnd: 60, bossName: 'Caipora Ancestral', ngMin: 30, ngMax: 40, staminaCostPerStage: 6, description: 'Cânions rupestres; prepara o jogador para o Santuário Genético e evoluções de NG 40.' },
  { chapter: 5, regionName: 'Mar de Jangadas', stageStart: 61, stageEnd: 75, bossName: 'Jangadeiro do Vento', ngMin: 40, ngMax: 50, staminaCostPerStage: 6, description: 'Litoral nordestino; exige domínio de sinergias de trio e equipamentos +12 da Oficina.' },
  { chapter: 6, regionName: 'Raso da Catarina', stageStart: 76, stageEnd: 90, bossName: 'Galo de Ferro', ngMin: 50, ngMax: 60, staminaCostPerStage: 6, description: 'Confronto final contra a máquina do Coronel Ferrabrás; premia Penas, Orbes Curinga e Título.' },
] as const;
