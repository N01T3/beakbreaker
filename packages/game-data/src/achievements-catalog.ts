export type CordelAchievementCategory = 'CRIACAO' | 'COMBATE' | 'FAZENDA' | 'COLECAO';

export interface CordelAchievementReward {
  goldenFeathers: number;
  breederXp: number;
  title?: string;
}

export interface CordelAchievementSpec {
  id: string;
  name: string;
  category: CordelAchievementCategory;
  description: string;
  targetValue: number;
  reward: CordelAchievementReward;
}

const spec = (
  category: CordelAchievementCategory,
  id: string,
  name: string,
  description: string,
  targetValue: number,
  goldenFeathers: number,
  breederXp: number,
  title?: string
): CordelAchievementSpec => ({
  id,
  name,
  category,
  description,
  targetValue,
  reward: { goldenFeathers, breederXp, ...(title ? { title } : {}) },
});

const cri = (id: string, name: string, desc: string, target: number, feathers: number, xp: number, title?: string) =>
  spec('CRIACAO', id, name, desc, target, feathers, xp, title);
const com = (id: string, name: string, desc: string, target: number, feathers: number, xp: number, title?: string) =>
  spec('COMBATE', id, name, desc, target, feathers, xp, title);
const faz = (id: string, name: string, desc: string, target: number, feathers: number, xp: number, title?: string) =>
  spec('FAZENDA', id, name, desc, target, feathers, xp, title);
const col = (id: string, name: string, desc: string, target: number, feathers: number, xp: number, title?: string) =>
  spec('COLECAO', id, name, desc, target, feathers, xp, title);

export const CORDEL_ACHIEVEMENTS: readonly CordelAchievementSpec[] = Object.freeze([
  // CRIACAO (12 conquistas)
  cri('ach_cri_01', 'Primeiro Galeto', 'Choque seu primeiro ovo no ninhal.', 1, 50, 100, 'Iniciante do Sertão'),
  cri('ach_cri_02', 'Mestre do Ninhal', 'Choque 50 ovos no galinheiro.', 50, 100, 300),
  cri('ach_cri_03', 'Genética Pura', 'Obtenha um galo com linhagem 100% pura.', 1, 150, 400, 'Mestre de Linhagem'),
  cri('ach_cri_04', 'Herdeiro Astral', 'Desperte a primeira mutação secreta em cruzamento.', 1, 200, 500, 'Astrônomo Rural'),
  cri('ach_cri_05', 'Lenda de Ouro', 'Crie um galo de raridade Lendária ou superior.', 1, 250, 600, 'Criador Lendário'),
  cri('ach_cri_06', 'Pai de Família', 'Atinja a 5ª geração de linhagem comprovada.', 5, 120, 350),
  cri('ach_cri_07', 'Árvore Genealógica', 'Atinja a 10ª geração máxima de linhagem.', 10, 300, 800, 'Guardião Ancestral'),
  cri('ach_cri_08', 'Bico de Prata', 'Evolua 10 galos até a maturidade adulta.', 10, 80, 250),
  cri('ach_cri_09', 'Cruzamento Perfeito', 'Combine dois progenitores com sinergia elemental máxima.', 1, 150, 400),
  cri('ach_cri_10', 'Horto dos Ovos', 'Mantenha 6 ninhos ativos simultaneamente.', 6, 100, 300),
  cri('ach_cri_11', 'Casal Produtivo', 'Realize 25 cruzamentos bem-sucedidos.', 25, 120, 350),
  cri('ach_cri_12', 'Alquimia das Penas', 'Sintetize 5 orbes de fusão genética.', 5, 180, 450),
  // COMBATE (15 conquistas)
  com('ach_com_01', 'Primeiro Canto', 'Vença seu primeiro duelo na campanha.', 1, 50, 100, 'Pé de Serra'),
  com('ach_com_02', 'Corta-Canto Perfeito', 'Execute uma interrupção de habilidade adversária perfeitamente.', 1, 100, 250),
  com('ach_com_03', 'Vencedor do Cariri', 'Conclua todos os desafios da região do Cariri.', 1, 150, 350, 'Valente do Cariri'),
  com('ach_com_04', 'Derrubador de Colosso', 'Derrote o chefe da Torre da Serra da Borborema.', 1, 200, 500, 'Derrubador de Gigantes'),
  com('ach_com_05', 'Fúria da Torre', 'Vença 50 andares na Torre Infinita.', 50, 300, 700, 'Senhor da Torre'),
  com('ach_com_06', 'Supremo Campeão', 'Alcance a patente máxima no Torneio dos Ventos.', 1, 500, 1000, 'Soberano do Sertão'),
  com('ach_com_07', 'Bicada Certeira', 'Cause 1000 de dano crítico em um único golpe.', 1000, 120, 300),
  com('ach_com_08', 'Defesa de Mandacaru', 'Vença um combate sem sofrer nenhum atordoamento.', 1, 100, 250),
  com('ach_com_09', 'Sequência Triunfal', 'Vença 10 combates consecutivos sem derrotas.', 10, 180, 400, 'Invicto'),
  com('ach_com_10', 'Resistência Sertaneja', 'Sobreviva a um combate com menos de 5% de vida restante.', 1, 120, 300),
  com('ach_com_11', 'Fogo Cruzado', 'Aplique queimadura e sangramento simultaneamente num rival.', 1, 100, 250),
  com('ach_com_12', 'Canto da Alvorada', 'Vença um combate em menos de 3 turnos.', 3, 150, 350, 'Relâmpago'),
  com('ach_com_13', 'Marcha do Agreste', 'Vença 100 combates em qualquer modo.', 100, 250, 600),
  com('ach_com_14', 'Impacto Elemental', 'Ative 3 reações elementais numa mesma partida.', 3, 120, 300),
  com('ach_com_15', 'Mestre da Formação', 'Vença com uma equipe de 4 galos da mesma classe.', 1, 160, 400),
  // FAZENDA (12 conquistas)
  faz('ach_faz_01', 'Celeiro Cheio', 'Armazene 10.000 grãos de milho no celeiro.', 10000, 80, 200, 'Celeiro Farto'),
  faz('ach_faz_02', 'Sede de Ouro', 'Produza 50.000 moedas de ouro na fazenda.', 50000, 150, 400),
  faz('ach_faz_03', 'Rei do Milho', 'Colha 100 plantios de milho dourado.', 100, 120, 300, 'Rei da Roça'),
  faz('ach_faz_04', 'Guardião Rural', 'Atinja o nível 20 da Fazenda.', 20, 200, 500, 'Patrão da Terra'),
  faz('ach_faz_05', 'Terra Adubada', 'Aprimore todos os canteiros da horta ao nível 5.', 5, 100, 250),
  faz('ach_faz_06', 'Santo Protetor', 'Instale e consagre o oratório de São Bento na fazenda.', 1, 150, 350, 'Abençoado'),
  faz('ach_faz_07', 'Enfermaria Modelo', 'Recupere a energia de 50 galos na enfermaria.', 50, 100, 250),
  faz('ach_faz_08', 'Moenda a Todo Vapor', 'Mantenha a moenda moendo ração por 24 horas acumuladas.', 24, 120, 300),
  faz('ach_faz_09', 'Cisterna Farta', 'Atinja capacidade máxima de água na cisterna de pedra.', 1, 80, 200),
  faz('ach_faz_10', 'Empório Sertanejo', 'Negocie 30 remessas com o mascate ambulante.', 30, 140, 350),
  faz('ach_faz_11', 'Silo Moderno', 'Expanda o silo de ração para capacidade 5000.', 5000, 110, 280),
  faz('ach_faz_12', 'Rancho Iluminado', 'Instale lampiões em todos os setores da propriedade.', 1, 90, 220),
  // COLECAO (11 conquistas)
  col('ach_col_01', 'Álbum Completo 40', 'Registre os 40 galos fundadores no almanaque do cordel.', 40, 400, 1000, 'Historiador do Cordel'),
  col('ach_col_02', 'Seis Primordiais', 'Reúna todos os 6 galos da raridade Primordial.', 6, 500, 1200, 'Senhor dos Mitos'),
  col('ach_col_03', 'Conjunto Brasa Viva +15', 'Equipe e fortaleça um conjunto Brasa Viva ao nível +15.', 15, 250, 600, 'Mestre Armeiro'),
  col('ach_col_04', 'Plumagem Dourada', 'Desbloqueie 10 visuais cosméticos de cordel.', 10, 150, 400, 'Elegância Sertaneja'),
  col('ach_col_05', 'Amigo do Vô Tonho', 'Complete todas as histórias narradas pelo Vô Tonho.', 1, 200, 500, 'Cumpadre Honrado'),
  col('ach_col_06', 'Trovador de Xilogravura', 'Colete 20 gravuras raras no acervo do cordel.', 20, 150, 350),
  col('ach_col_07', 'Arsenal do Vaqueiro', 'Colete 30 peças distintas de equipamento de couro e prata.', 30, 180, 450),
  col('ach_col_08', 'Canto dos Oito Elementos', 'Possua pelo menos um galo de cada um dos 8 elementos.', 8, 220, 550, 'Equilíbrio da Caatinga'),
  col('ach_col_09', 'Relíquias do Cangaço', 'Colete 5 artefatos históricos da expedição.', 5, 200, 500),
  col('ach_col_10', 'Museu das Plumagens', 'Cadastre 100 espécimes únicos no compêndio zoológico.', 100, 300, 750),
  col('ach_col_11', 'Lira de Prata', 'Conclua a coleção completa de folhetos de repente.', 1, 250, 600, 'Mestre Poeta'),
]);

export const CORDEL_ACHIEVEMENTS_50 = CORDEL_ACHIEVEMENTS;

const ACHIEVEMENTS_BY_ID = new Map<string, CordelAchievementSpec>(
  CORDEL_ACHIEVEMENTS.map((ach) => [ach.id, ach])
);

export function getAllCordelAchievements(): readonly CordelAchievementSpec[] {
  return CORDEL_ACHIEVEMENTS;
}

export function getAchievementsByCategory(
  category: CordelAchievementCategory
): readonly CordelAchievementSpec[] {
  return CORDEL_ACHIEVEMENTS.filter((ach) => ach.category === category);
}

export function getAchievementById(id: string): CordelAchievementSpec | undefined {
  return ACHIEVEMENTS_BY_ID.get(id);
}

export function calculateTotalAchievementFeathers(): number {
  return CORDEL_ACHIEVEMENTS.reduce((sum, ach) => sum + ach.reward.goldenFeathers, 0);
}
