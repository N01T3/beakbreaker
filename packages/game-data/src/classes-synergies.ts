import {
  EquipmentSetId,
  PerkGemId,
  RoosterClass,
  RowPosition,
} from './schemas/index.js';

export interface ClassPassiveSpec {
  roosterClass: RoosterClass;
  preferredRow: RowPosition | 'FrenteOuTras';
  launchRosterCount: number;
  roleDescription: string;
  passiveName: string;
  passiveDescription: string;
  specialDamageReductionPermille?: number;
  immuneToProvocado?: boolean;
  forcaPer10PctMissingVigorPermille?: number;
  maxForcaBonusPermille?: number;
  guaranteedFirstHitCrit?: boolean;
  basicAttackIgnoreDefPermille?: number;
  healAndShieldBonusPermille?: number;
  extraControlDurationTicks?: number;
}

export const CLASS_PASSIVES: Record<RoosterClass, ClassPassiveSpec> = {
  Tanque: {
    roosterClass: 'Tanque',
    preferredRow: 'Frente',
    launchRosterCount: 7,
    roleDescription: 'Segura o foco e protege a fila de trás.',
    passiveName: 'Couraça',
    passiveDescription: '-10% de dano recebido de especiais; imune a Provocado.',
    specialDamageReductionPermille: 100,
    immuneToProvocado: true,
  },
  Bruiser: {
    roosterClass: 'Bruiser',
    preferredRow: 'Frente',
    launchRosterCount: 6,
    roleDescription: 'Dano e resistência ao mesmo tempo.',
    passiveName: 'Raça',
    passiveDescription: 'Ganha +1% de Força a cada 10% de Vigor perdido, até +8%.',
    forcaPer10PctMissingVigorPermille: 10,
    maxForcaBonusPermille: 80,
  },
  Assassino: {
    roosterClass: 'Assassino',
    preferredRow: 'Tras',
    launchRosterCount: 6,
    roleDescription: 'Elimina alvos frágeis da fila de trás.',
    passiveName: 'Bote',
    passiveDescription: 'O primeiro golpe da luta é garantidamente crítico.',
    guaranteedFirstHitCrit: true,
  },
  Atirador: {
    roosterClass: 'Atirador',
    preferredRow: 'Tras',
    launchRosterCount: 7,
    roleDescription: 'Dano constante e previsível.',
    passiveName: 'Mira Firme',
    passiveDescription: 'Ataques básicos ignoram 15% da Defesa do alvo.',
    basicAttackIgnoreDefPermille: 150,
  },
  Suporte: {
    roosterClass: 'Suporte',
    preferredRow: 'Tras',
    launchRosterCount: 6,
    roleDescription: 'Cura, Escudo e Canto para o trio.',
    passiveName: 'Cuidado',
    passiveDescription: 'Todas as curas e Escudos aplicados valem +15%.',
    healAndShieldBonusPermille: 150,
  },
  Controle: {
    roosterClass: 'Controle',
    preferredRow: 'FrenteOuTras',
    launchRosterCount: 8,
    roleDescription: 'Atordoa, cega, silencia e atrasa.',
    passiveName: 'Pulso',
    passiveDescription: 'Efeitos de controle aplicados duram +0,5 segundo extra.',
    extraControlDurationTicks: 10,
  },
};

export interface TrioSynergySpec {
  id: string;
  name: string;
  requiredClasses: readonly RoosterClass[];
  requiresThreeDistinctClasses?: boolean;
  description: string;
  bonuses: {
    maxVigorPermille?: number;
    frontRowDefesaPermille?: number;
    damageVsControlledPermille?: number;
    velocidadePermille?: number;
    tecnicaFlatBonus?: number;
    startingCantoBonus?: number;
    allStatsPermille?: number;
  };
}

export const ANTI_MONOCLASS_RULE = true;

export const TRIO_SYNERGIES: readonly TrioSynergySpec[] = [
  {
    id: 'muralha_viva',
    name: 'Muralha Viva',
    requiredClasses: ['Tanque', 'Suporte'],
    description: 'Concede +10% de Vigor máximo a todo o trio.',
    bonuses: { maxVigorPermille: 100 },
  },
  {
    id: 'linha_de_frente',
    name: 'Linha de Frente',
    requiredClasses: ['Tanque', 'Bruiser'],
    description: 'Concede +10% de Defesa na fila da frente.',
    bonuses: { frontRowDefesaPermille: 100 },
  },
  {
    id: 'emboscada',
    name: 'Emboscada',
    requiredClasses: ['Assassino', 'Controle'],
    description: 'Causa +15% de dano em alvos Atordoados ou Cegos.',
    bonuses: { damageVsControlledPermille: 150 },
  },
  {
    id: 'fogo_cruzado',
    name: 'Fogo Cruzado',
    requiredClasses: ['Atirador', 'Bruiser'],
    description: 'Concede +8% de Velocidade a todo o trio.',
    bonuses: { velocidadePermille: 80 },
  },
  {
    id: 'cacada',
    name: 'Caçada',
    requiredClasses: ['Assassino', 'Atirador'],
    description: 'Soma +5 p.p. de Técnica (chance de crítico).',
    bonuses: { tecnicaFlatBonus: 5 },
  },
  {
    id: 'coro_do_arraial',
    name: 'Coro do Arraial',
    requiredClasses: ['Suporte', 'Controle'],
    description: 'Todos os aliados começam a luta com +100 de Canto inicial.',
    bonuses: { startingCantoBonus: 100 },
  },
  {
    id: 'bando_completo',
    name: 'Bando Completo',
    requiredClasses: [],
    requiresThreeDistinctClasses: true,
    description: 'Concede +5% em Força, Vigor e Defesa (soma com qualquer par acima!).',
    bonuses: { allStatsPermille: 50 },
  },
] as const;

export interface EquipmentSetSpec {
  id: EquipmentSetId;
  name: string;
  maxRefineLevel: 15;
  description: string;
  critMultiplierPermille?: number;
  critDamageTakenReductionPermille?: number;
  thornsPermille?: number;
  velocidadeBonusPermille?: number;
  startingCantoBonus?: number;
  healingBonusPermille?: number;
  vigorAndDefesaBonusPermille?: number;
  ignoreDefensePermille?: number;
}

export const EQUIPMENT_SETS: Record<EquipmentSetId, EquipmentSetSpec> = {
  BrasaViva: { id: 'BrasaViva', name: 'Brasa Viva', maxRefineLevel: 15, description: 'Eleva o multiplicador crítico de 1,50× para 1,95×.', critMultiplierPermille: 1950 },
  CouroDeGibao: { id: 'CouroDeGibao', name: 'Couro de Gibão', maxRefineLevel: 15, description: '-15% dano crítico sofrido.', critDamageTakenReductionPermille: 150 },
  Mandacaru: { id: 'Mandacaru', name: 'Mandacaru', maxRefineLevel: 15, description: '12% Espinhos.', thornsPermille: 120 },
  VentoDoArraial: { id: 'VentoDoArraial', name: 'Vento do Arraial', maxRefineLevel: 15, description: '+15% Velocidade.', velocidadeBonusPermille: 150 },
  LuarDoSertao: { id: 'LuarDoSertao', name: 'Luar do Sertão', maxRefineLevel: 15, description: '+150 Canto inicial.', startingCantoBonus: 150 },
  AguasDoVelhoChico: { id: 'AguasDoVelhoChico', name: 'Águas do Velho Chico', maxRefineLevel: 15, description: '+20% cura.', healingBonusPermille: 200 },
  ArmorialReal: { id: 'ArmorialReal', name: 'Armorial Real', maxRefineLevel: 15, description: '+12% Vigor/Defesa.', vigorAndDefesaBonusPermille: 120 },
  CangacoDeAco: { id: 'CangacoDeAco', name: 'Cangaço de Aço', maxRefineLevel: 15, description: 'Ignora 20% da Defesa.', ignoreDefensePermille: 200 },
};

export interface PerkGemSpec {
  id: PerkGemId;
  name: string;
  description: string;
}

export const PERK_GEMS: Record<PerkGemId, PerkGemSpec> = {
  FenixSertaneja: { id: 'FenixSertaneja', name: 'Joia da Fênix Sertaneja', description: 'Renasce 1x por luta com 30% de Vigor e 500 de Canto.' },
  Ceifador: { id: 'Ceifador', name: 'Joia do Ceifador', description: '+25% dano abaixo de 20% Vigor e bloqueia reviver.' },
  Procriacao: { id: 'Procriacao', name: 'Joia de Procriação', description: 'Ativa a Barra de Empoderamento Dourada no Ninhal.' },
};
