import {
  ElementType,
  Rarity,
  RoosterClass,
  RoosterSpec,
  RowPosition,
} from '../schemas/index.js';

export interface CulturalSeasonSpec {
  seasonNumber: number;
  monthLabel: string;
  themeName: string;
  vipRoosterName: string;
  heroicRoosterName: string;
  bannerRoosterName: string;
  secretMutationReleased?: string;
}

export const YEAR_1_CULTURAL_SEASONS: readonly CulturalSeasonSpec[] = [
  { seasonNumber: 1, monthLabel: 'Janeiro', themeName: 'Ano Novo no Sertão', vipRoosterName: 'Galo Fogueteiro', heroicRoosterName: 'Senhor do Ano Novo', bannerRoosterName: 'Galo Esperança' },
  { seasonNumber: 2, monthLabel: 'Fevereiro', themeName: 'Carnaval do Sertão', vipRoosterName: 'Galo Frevo', heroicRoosterName: 'Mestre-Sala', bannerRoosterName: 'Passista' },
  { seasonNumber: 3, monthLabel: 'Março', themeName: 'Tempo das Águas', vipRoosterName: 'Galo Açudeiro', heroicRoosterName: 'Senhor das Chuvas', bannerRoosterName: 'Galo Cururu', secretMutationReleased: 'Galo de Vapor' },
  { seasonNumber: 4, monthLabel: 'Abril', themeName: 'Festa da Colheita', vipRoosterName: 'Galo Debulhador', heroicRoosterName: 'Rei do Milho', bannerRoosterName: 'Galo Roceiro' },
  { seasonNumber: 5, monthLabel: 'Maio', themeName: 'Noites de Forró', vipRoosterName: 'Galo Triângulo', heroicRoosterName: 'Rainha do Xote', bannerRoosterName: 'Galo Rabequeiro', secretMutationReleased: 'Galo Queimada' },
  { seasonNumber: 6, monthLabel: 'Junho', themeName: 'São João', vipRoosterName: 'Galo Balão', heroicRoosterName: 'Marcador da Quadrilha', bannerRoosterName: 'Galo Quadrilheiro' },
  { seasonNumber: 7, monthLabel: 'Julho', themeName: 'Festa do Vaqueiro', vipRoosterName: 'Galo Aboiador', heroicRoosterName: 'Vaqueiro Encourado', bannerRoosterName: 'Galo Boiadeiro', secretMutationReleased: 'Galo Maré Alta' },
  { seasonNumber: 8, monthLabel: 'Agosto', themeName: 'Mês do Folclore', vipRoosterName: 'Galo Matinta', heroicRoosterName: 'Guardião do Folclore', bannerRoosterName: 'Galo Bumba' },
  { seasonNumber: 9, monthLabel: 'Setembro', themeName: 'Primavera na Caatinga', vipRoosterName: 'Galo Ipê', heroicRoosterName: 'Florada', bannerRoosterName: 'Galo Florado', secretMutationReleased: 'Galo do Mangue' },
  { seasonNumber: 10, monthLabel: 'Outubro', themeName: 'Noite das Assombrações', vipRoosterName: 'Galo Lamparina', heroicRoosterName: 'Galo Visagento', bannerRoosterName: 'Galo Coruja' },
  { seasonNumber: 11, monthLabel: 'Novembro', themeName: 'Feira de Cordel', vipRoosterName: 'Galo Cordelista', heroicRoosterName: 'Cantador de Ouro', bannerRoosterName: 'Galo Feirante', secretMutationReleased: 'Galo Eclipse' },
  { seasonNumber: 12, monthLabel: 'Dezembro', themeName: 'Natal Sertanejo', vipRoosterName: 'Galo Pastorinha', heroicRoosterName: 'Estrela Guia', bannerRoosterName: 'Galo Lapinha' },
  { seasonNumber: 13, monthLabel: '13ª Temp.', themeName: 'Um Ano de Arraial', vipRoosterName: 'Galo do Arraial', heroicRoosterName: 'Velho Campeão', bannerRoosterName: 'Galo Pé-de-Serra' },
] as const;

interface RawSeasonalSeed {
  num: number;
  name: string;
  rarity: Rarity;
  cls: RoosterClass;
  el1: ElementType;
  el2: ElementType;
  row: RowPosition;
  special: string;
  passive: string;
  source: string;
}

const SEEDS: readonly RawSeasonalSeed[] = [
  { num: 47, name: 'Galo Fogueteiro', rarity: 'Lendario', cls: 'Atirador', el1: 'Brasa', el2: 'Sol', row: 'Tras', special: 'Chuva de Rojões', passive: 'Pólvora de Ano Novo', source: 'Passe Divino Temp. 1' },
  { num: 48, name: 'Senhor do Ano Novo', rarity: 'Heroico', cls: 'Suporte', el1: 'Sol', el2: 'Armorial', row: 'Tras', special: 'Bênção da Virada', passive: 'Recomeço Dourado', source: 'Corrida de Heróis Temp. 1' },
  { num: 49, name: 'Galo Esperança', rarity: 'Lendario', cls: 'Controle', el1: 'Mata', el2: 'Sol', row: 'Tras', special: 'Brisa da Manhã', passive: 'Semente de Fé', source: 'Chocadeira Temp. 1' },
  { num: 50, name: 'Galo Frevo', rarity: 'Lendario', cls: 'Assassino', el1: 'Sol', el2: 'Brasa', row: 'Tras', special: 'Passo da Sombrinha', passive: 'Fervura de Olinda', source: 'Passe Divino Temp. 2' },
  { num: 51, name: 'Mestre-Sala', rarity: 'Heroico', cls: 'Controle', el1: 'Sol', el2: 'Lua', row: 'Frente', special: 'Estandarte Real', passive: 'Cadência do Desfile', source: 'Corrida de Heróis Temp. 2' },
  { num: 52, name: 'Passista', rarity: 'Lendario', cls: 'Bruiser', el1: 'Brasa', el2: 'Correnteza', row: 'Frente', special: 'Giro de Carnaval', passive: 'Fôlego na Avenida', source: 'Chocadeira Temp. 2' },
  { num: 53, name: 'Galo Açudeiro', rarity: 'Lendario', cls: 'Tanque', el1: 'Correnteza', el2: 'Mata', row: 'Frente', special: 'Comporta Cheia', passive: 'Parede do Açude', source: 'Passe Divino Temp. 3' },
  { num: 54, name: 'Senhor das Chuvas', rarity: 'Heroico', cls: 'Controle', el1: 'Correnteza', el2: 'Sol', row: 'Tras', special: 'Toró de Março', passive: 'Inverno Farto', source: 'Corrida de Heróis Temp. 3' },
  { num: 55, name: 'Galo Cururu', rarity: 'Lendario', cls: 'Suporte', el1: 'Correnteza', el2: 'Lua', row: 'Tras', special: 'Canto daLagoa Cheia', passive: 'Pele Úmida', source: 'Chocadeira Temp. 3' },
  { num: 56, name: 'Galo Debulhador', rarity: 'Lendario', cls: 'Bruiser', el1: 'Mata', el2: 'Brasa', row: 'Frente', special: 'Debulha de Sabugo', passive: 'Safra Cheia', source: 'Passe Divino Temp. 4' },
  { num: 57, name: 'Rei do Milho', rarity: 'Heroico', cls: 'Tanque', el1: 'Sol', el2: 'Mata', row: 'Frente', special: 'Coroa da Fartura', passive: 'Celeiro Real', source: 'Corrida de Heróis Temp. 4' },
  { num: 58, name: 'Galo Roceiro', rarity: 'Lendario', cls: 'Tanque', el1: 'Mata', el2: 'Correnteza', row: 'Frente', special: 'Enxada de Aço', passive: 'Lida no Campo', source: 'Chocadeira Temp. 4' },
  { num: 59, name: 'Galo Triângulo', rarity: 'Lendario', cls: 'Suporte', el1: 'Sol', el2: 'Lua', row: 'Tras', special: 'Tinido Cristalino', passive: 'Compasso Certo', source: 'Passe Divino Temp. 5' },
  { num: 60, name: 'Rainha do Xote', rarity: 'Heroico', cls: 'Assassino', el1: 'Lua', el2: 'Brasa', row: 'Tras', special: 'Dois Pra Lá Dois Pra Cá', passive: 'Giro de Salão', source: 'Corrida de Heróis Temp. 5' },
  { num: 61, name: 'Galo Rabequeiro', rarity: 'Lendario', cls: 'Controle', el1: 'Mata', el2: 'Lua', row: 'Tras', special: 'Arco de Rabeca', passive: 'Melodia Agreste', source: 'Chocadeira Temp. 5' },
  { num: 62, name: 'Galo Balão', rarity: 'Lendario', cls: 'Atirador', el1: 'Brasa', el2: 'Lua', row: 'Tras', special: 'Lanterna de São João', passive: 'Céu de Fogueira', source: 'Passe Divino Temp. 6' },
  { num: 63, name: 'Marcador da Quadrilha', rarity: 'Heroico', cls: 'Suporte', el1: 'Sol', el2: 'Brasa', row: 'Tras', special: 'Olha a Chuva! É Mentira!', passive: 'Comando do Arraial', source: 'Corrida de Heróis Temp. 6' },
  { num: 64, name: 'Galo Quadrilheiro', rarity: 'Lendario', cls: 'Bruiser', el1: 'Brasa', el2: 'Sol', row: 'Frente', special: 'Grande Roda', passive: 'Chapéu de Palha', source: 'Chocadeira Temp. 6' },
  { num: 65, name: 'Galo Aboiador', rarity: 'Lendario', cls: 'Controle', el1: 'Sol', el2: 'Cangaco', row: 'Tras', special: 'Aboio da Caatinga', passive: 'Eco da Serra', source: 'Passe Divino Temp. 7' },
  { num: 66, name: 'Vaqueiro Encourado', rarity: 'Heroico', cls: 'Tanque', el1: 'Brasa', el2: 'Cangaco', row: 'Frente', special: 'Pega de Boi no Mato', passive: 'Gibão Impenetrável', source: 'Corrida de Heróis Temp. 7' },
  { num: 67, name: 'Galo Boiadeiro', rarity: 'Lendario', cls: 'Bruiser', el1: 'Mata', el2: 'Cangaco', row: 'Frente', special: 'Berrante de Chifre', passive: 'Poeira da Estrada', source: 'Chocadeira Temp. 7' },
  { num: 68, name: 'Galo Matinta', rarity: 'Lendario', cls: 'Controle', el1: 'Assombracao', el2: 'Lua', row: 'Tras', special: 'Assobio da Meia-Noite', passive: 'Asa Misteriosa', source: 'Passe Divino Temp. 8' },
  { num: 69, name: 'Guardião do Folclore', rarity: 'Heroico', cls: 'Bruiser', el1: 'Armorial', el2: 'Mata', row: 'Frente', special: 'Lenda Viva', passive: 'Memória Ancestral', source: 'Corrida de Heróis Temp. 8' },
  { num: 70, name: 'Galo Bumba', rarity: 'Lendario', cls: 'Tanque', el1: 'Sol', el2: 'Armorial', row: 'Frente', special: 'Auto do Boi Estrela', passive: 'Bordado de Veludo', source: 'Chocadeira Temp. 8' },
  { num: 71, name: 'Galo Ipê', rarity: 'Lendario', cls: 'Suporte', el1: 'Mata', el2: 'Sol', row: 'Tras', special: 'Chuva de Pétalas Douradas', passive: 'Flor da Seca', source: 'Passe Divino Temp. 9' },
  { num: 72, name: 'Florada', rarity: 'Heroico', cls: 'Suporte', el1: 'Mata', el2: 'Correnteza', row: 'Tras', special: 'Milagre da Caatinga', passive: 'Orvalho da Manhã', source: 'Corrida de Heróis Temp. 9' },
  { num: 73, name: 'Galo Florado', rarity: 'Lendario', cls: 'Atirador', el1: 'Mata', el2: 'Sol', row: 'Tras', special: 'Espinho Perfumado', passive: 'Broto Novo', source: 'Chocadeira Temp. 9' },
  { num: 74, name: 'Galo Lamparina', rarity: 'Lendario', cls: 'Atirador', el1: 'Brasa', el2: 'Assombracao', row: 'Tras', special: 'Chama de Querosene', passive: 'Pavilhão Acesa', source: 'Passe Divino Temp. 10' },
  { num: 75, name: 'Galo Visagento', rarity: 'Heroico', cls: 'Assassino', el1: 'Assombracao', el2: 'Lua', row: 'Tras', special: 'Aparição da Estrada', passive: 'Vulto Intangível', source: 'Corrida de Heróis Temp. 10' },
  { num: 76, name: 'Galo Coruja', rarity: 'Lendario', cls: 'Controle', el1: 'Lua', el2: 'Assombracao', row: 'Tras', special: 'Rasante Silencioso', passive: 'Sentinela Noturna', source: 'Chocadeira Temp. 10' },
  { num: 77, name: 'Galo Cordelista', rarity: 'Lendario', cls: 'Controle', el1: 'Armorial', el2: 'Sol', row: 'Tras', special: 'Sextilha de Xilogravura', passive: 'Folheto no Barbante', source: 'Passe Divino Temp. 11' },
  { num: 78, name: 'Cantador de Ouro', rarity: 'Heroico', cls: 'Atirador', el1: 'Sol', el2: 'Armorial', row: 'Tras', special: 'Martelo Agalopado', passive: 'Voz Inesquecível', source: 'Corrida de Heróis Temp. 11' },
  { num: 79, name: 'Galo Feirante', rarity: 'Lendario', cls: 'Bruiser', el1: 'Correnteza', el2: 'Brasa', row: 'Frente', special: 'Banca de Temperos', passive: 'Pechincha Boa', source: 'Chocadeira Temp. 11' },
  { num: 80, name: 'Galo Pastorinha', rarity: 'Lendario', cls: 'Suporte', el1: 'Lua', el2: 'Sol', row: 'Tras', special: 'Jornada do Cordão Azul', passive: 'Maracá de Prata', source: 'Passe Divino Temp. 12' },
  { num: 81, name: 'Estrela Guia', rarity: 'Heroico', cls: 'Atirador', el1: 'Sol', el2: 'Lua', row: 'Tras', special: 'Clarão de Belém do Sertão', passive: 'Luz do Oriente', source: 'Corrida de Heróis Temp. 12' },
  { num: 82, name: 'Galo Lapinha', rarity: 'Lendario', cls: 'Tanque', el1: 'Mata', el2: 'Sol', row: 'Frente', special: 'Presépio de Barro', passive: 'Noite Feliz', source: 'Chocadeira Temp. 12' },
  { num: 83, name: 'Galo do Arraial', rarity: 'Lendario', cls: 'Bruiser', el1: 'Brasa', el2: 'Armorial', row: 'Frente', special: 'Festa de Aniversário', passive: 'Bandeirinha Colorida', source: 'Passe Divino Temp. 13' },
  { num: 84, name: 'Velho Campeão', rarity: 'Heroico', cls: 'Bruiser', el1: 'Armorial', el2: 'Cangaco', row: 'Frente', special: 'Cinturão Lendário', passive: 'Veterano Invicto', source: 'Corrida de Heróis Temp. 13' },
  { num: 85, name: 'Galo Pé-de-Serra', rarity: 'Lendario', cls: 'Suporte', el1: 'Sol', el2: 'Correnteza', row: 'Tras', special: 'Sanfona Até o Amanhecer', passive: 'Poeira Levantada', source: 'Chocadeira Temp. 13' },
];

export const SEASONAL_ROOSTERS: readonly RoosterSpec[] = SEEDS.map((s) => {
  const isHeroic = s.rarity === 'Heroico';
  return {
    id: `seasonal_${s.num}`,
    number: s.num,
    name: s.name,
    rarity: s.rarity,
    roosterClass: s.cls,
    primaryElement: s.el1,
    secondaryElement: s.el2,
    preferredRow: s.row,
    traitPositive: s.row === 'Frente' ? '+Vigor' : '+Velocidade',
    traitNegative: s.row === 'Frente' ? '-Velocidade' : '-Defesa',
    baseStats: {
      forca: isHeroic ? 965 : 915,
      vigor: s.row === 'Frente' ? (isHeroic ? 12800 : 11900) : (isHeroic ? 9900 : 9400),
      defesa: s.row === 'Frente' ? 390 : 295,
      velocidade: s.row === 'Frente' ? 168 : 210,
      tecnica: isHeroic ? 25 : 21,
      garra: isHeroic ? 150 : 138,
      esquiva: s.cls === 'Assassino' ? 10 : 0,
    },
    specialAbility: {
      name: s.special,
      multiplierPermille: s.cls === 'Suporte' ? 0 : isHeroic ? 2250 : 1850,
      targetScope: s.cls === 'Suporte' ? 'AllAllies' : s.row === 'Frente' ? 'EnemyFrontRow' : 'AllEnemies',
      hitCount: 1,
      effectDurationTicks: 40,
      shieldPermille: s.cls === 'Tanque' || s.cls === 'Suporte' ? 200 : 0,
      healPermille: s.cls === 'Suporte' ? 300 : 0,
      cantoBonus: s.cls === 'Suporte' ? 150 : 0,
      cleanseDebuffs: s.cls === 'Suporte',
      ignoreDefensePermille: s.cls === 'Atirador' ? 200 : 0,
      ignoreShield: false,
      description: `${s.special}: Habilidade sazonal exclusiva de ${s.name}.`,
    },
    geneticPassive: {
      name: s.passive,
      description: `${s.passive}: Bônus passivo sazonal da ${s.source}.`,
    },
    source: s.source,
    defaultVisualDNA: {
      id: `dna_seasonal_${s.num}`,
      parts: {
        tronco: `s_${s.num}_tronco`,
        cabeca: `s_${s.num}_cabeca`,
        crista: `s_${s.num}_crista`,
        asa_frente: `s_${s.num}_asa`,
        cauda: `s_${s.num}_cauda`,
        canelas: `s_${s.num}_canelas`,
      },
    },
  };
});
