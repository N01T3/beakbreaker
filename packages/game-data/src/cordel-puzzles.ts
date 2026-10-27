export type PuzzleVictoryCondition = 'defeat_all' | 'survive_time' | 'no_ally_defeated';

export interface CordelRoosterUnit {
  roosterSpecId: string;
  name: string;
  level: number;
  row: 'frente' | 'tras';
}

export interface CordelPuzzleReward {
  goldenFeathers: number;
  wildOrbs: number;
}

export interface CordelPuzzleFolheto {
  id: string;
  title: string;
  theme: string;
  rhymeVerse: readonly string[];
  borrowedTeam: readonly [CordelRoosterUnit, CordelRoosterUnit, CordelRoosterUnit];
  opponentTeam: readonly [CordelRoosterUnit, CordelRoosterUnit, CordelRoosterUnit];
  victoryCondition: PuzzleVictoryCondition;
  targetTicks?: number;
  firstClearReward: CordelPuzzleReward;
  seasonBonusReward: CordelPuzzleReward;
}

export const CORDEL_PUZZLE_FOLHETOS: readonly CordelPuzzleFolheto[] = [
  {
    id: 'folheto_revolta_cariri',
    title: 'Revolta do Cariri',
    theme: 'Resistência no Sertão do Cariri',
    rhymeVerse: [
      'No Cariri de sol quente', 'Três bravos atletas vão',
      'Defender nosso terreiro', 'Com técnica e precisão',
      'Pois a honra sertaneja', 'Nunca cai pelo chão',
    ],
    borrowedTeam: [
      { roosterSpecId: 'rooster_01', name: 'Galo Campina', level: 20, row: 'frente' },
      { roosterSpecId: 'rooster_02', name: 'Zabumba', level: 20, row: 'frente' },
      { roosterSpecId: 'rooster_04', name: 'Faísca', level: 20, row: 'tras' },
    ],
    opponentTeam: [
      { roosterSpecId: 'rooster_08', name: 'Mandacaru', level: 22, row: 'frente' },
      { roosterSpecId: 'rooster_06', name: 'Rendeira', level: 21, row: 'tras' },
      { roosterSpecId: 'rooster_10', name: 'Cascavel', level: 22, row: 'tras' },
    ],
    victoryCondition: 'defeat_all',
    firstClearReward: { goldenFeathers: 120, wildOrbs: 30 },
    seasonBonusReward: { goldenFeathers: 40, wildOrbs: 10 },
  },
  {
    id: 'folheto_lendas_lua',
    title: 'Lendas da Lua',
    theme: 'Mistérios e Sombras do Sertão Noturno',
    rhymeVerse: [
      'Quando a lua prateada', 'Ilumina o mandacaru',
      'Três atletas velozes', 'Cantam de norte a sul',
      'Desfazendo o mistério', 'Sob o céu límpido e azul',
    ],
    borrowedTeam: [
      { roosterSpecId: 'rooster_03', name: 'Caboré', level: 25, row: 'tras' },
      { roosterSpecId: 'rooster_07', name: 'Sanfoneiro', level: 25, row: 'tras' },
      { roosterSpecId: 'rooster_11', name: 'Xique-Xique', level: 25, row: 'frente' },
    ],
    opponentTeam: [
      { roosterSpecId: 'rooster_05', name: 'Brisa do Rio', level: 26, row: 'tras' },
      { roosterSpecId: 'rooster_09', name: 'Repentista', level: 26, row: 'tras' },
      { roosterSpecId: 'rooster_01', name: 'Galo Campina', level: 27, row: 'frente' },
    ],
    victoryCondition: 'no_ally_defeated',
    firstClearReward: { goldenFeathers: 150, wildOrbs: 40 },
    seasonBonusReward: { goldenFeathers: 50, wildOrbs: 15 },
  },
  {
    id: 'folheto_cangaco_misterioso',
    title: 'O Cangaço Misterioso',
    theme: 'Trilhas Ocultas dos Valentes',
    rhymeVerse: [
      'Pelos trilhos da caatinga', 'Vem o bando destemido',
      'De gibão e de chapéu', 'Mostrando porte altivo',
      'Vencem qualquer desafio', 'Pelo povo protegido',
    ],
    borrowedTeam: [
      { roosterSpecId: 'rooster_13', name: 'Lampião', level: 30, row: 'frente' },
      { roosterSpecId: 'rooster_14', name: 'Maria Bonita', level: 30, row: 'tras' },
      { roosterSpecId: 'rooster_08', name: 'Mandacaru', level: 30, row: 'frente' },
    ],
    opponentTeam: [
      { roosterSpecId: 'rooster_12', name: 'Gavião Asa-de-Telha', level: 32, row: 'tras' },
      { roosterSpecId: 'rooster_02', name: 'Zabumba', level: 32, row: 'frente' },
      { roosterSpecId: 'rooster_04', name: 'Faísca', level: 31, row: 'tras' },
    ],
    victoryCondition: 'defeat_all',
    firstClearReward: { goldenFeathers: 200, wildOrbs: 50 },
    seasonBonusReward: { goldenFeathers: 60, wildOrbs: 20 },
  },
  {
    id: 'folheto_vento_caatinga',
    title: 'Vento da Caatinga',
    theme: 'Resistência ao Redemoinho',
    rhymeVerse: [
      'Vento sopra ligeiro', 'Levantando o poeirão',
      'Três passadas certeiras', 'Agitam o coração',
      'Com esquiva elegante', 'Consagram o campeão',
    ],
    borrowedTeam: [
      { roosterSpecId: 'rooster_35', name: 'Baladeira', level: 28, row: 'tras' },
      { roosterSpecId: 'rooster_37', name: 'Capoeira', level: 28, row: 'frente' },
      { roosterSpecId: 'rooster_38', name: 'Pífano', level: 28, row: 'tras' },
    ],
    opponentTeam: [
      { roosterSpecId: 'rooster_32', name: 'Taipa', level: 30, row: 'frente' },
      { roosterSpecId: 'rooster_33', name: 'Carranca', level: 29, row: 'tras' },
      { roosterSpecId: 'rooster_03', name: 'Caboré', level: 29, row: 'tras' },
    ],
    victoryCondition: 'survive_time',
    targetTicks: 500,
    firstClearReward: { goldenFeathers: 160, wildOrbs: 45 },
    seasonBonusReward: { goldenFeathers: 45, wildOrbs: 15 },
  },
  {
    id: 'folheto_asa_branca_celestial',
    title: 'Asa Branca Celestial',
    theme: 'Harmonia e Bênção nos Céus',
    rhymeVerse: [
      'Asa Branca no céu bate', 'Sua asa de esperança',
      'Cura e protege os irmãos', 'Em ritmo de contradança',
      'No cantar harmonioso', 'A glória logo se alcança',
    ],
    borrowedTeam: [
      { roosterSpecId: 'rooster_19', name: 'Asa Branca', level: 35, row: 'tras' },
      { roosterSpecId: 'rooster_37', name: 'Capoeira', level: 35, row: 'frente' },
      { roosterSpecId: 'rooster_08', name: 'Mandacaru', level: 35, row: 'frente' },
    ],
    opponentTeam: [
      { roosterSpecId: 'rooster_13', name: 'Lampião', level: 37, row: 'frente' },
      { roosterSpecId: 'rooster_04', name: 'Faísca', level: 36, row: 'tras' },
      { roosterSpecId: 'rooster_10', name: 'Cascavel', level: 36, row: 'tras' },
    ],
    victoryCondition: 'no_ally_defeated',
    firstClearReward: { goldenFeathers: 250, wildOrbs: 60 },
    seasonBonusReward: { goldenFeathers: 80, wildOrbs: 25 },
  },
  {
    id: 'folheto_festa_padroeiro',
    title: 'Festa do Padroeiro',
    theme: 'Quermesse e Alegria no Terreiro da Vila',
    rhymeVerse: [
      'Toca o fole da sanfona', 'Na quermesse do sertão',
      'O terreiro enfeitado', 'Celebra a união',
      'Três atletas do povo', 'Fazem a festa do chão',
    ],
    borrowedTeam: [
      { roosterSpecId: 'rooster_07', name: 'Sanfoneiro', level: 32, row: 'tras' },
      { roosterSpecId: 'rooster_36', name: 'Mamulengo', level: 32, row: 'tras' },
      { roosterSpecId: 'rooster_01', name: 'Galo Campina', level: 32, row: 'frente' },
    ],
    opponentTeam: [
      { roosterSpecId: 'rooster_02', name: 'Zabumba', level: 33, row: 'frente' },
      { roosterSpecId: 'rooster_09', name: 'Repentista', level: 33, row: 'tras' },
      { roosterSpecId: 'rooster_35', name: 'Baladeira', level: 33, row: 'tras' },
    ],
    victoryCondition: 'defeat_all',
    firstClearReward: { goldenFeathers: 180, wildOrbs: 45 },
    seasonBonusReward: { goldenFeathers: 50, wildOrbs: 20 },
  },
] as const;

export const getCordelFolhetos = (): readonly CordelPuzzleFolheto[] => CORDEL_PUZZLE_FOLHETOS;
export const getCordelFolhetoById = (id: string): CordelPuzzleFolheto | undefined =>
  CORDEL_PUZZLE_FOLHETOS.find((folheto) => folheto.id === id);
