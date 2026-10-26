import { ElementType } from './schemas/index.js';

export const ELEMENTS: readonly ElementType[] = [
  'Brasa',
  'Correnteza',
  'Mata',
  'Sol',
  'Lua',
  'Armorial',
  'Assombracao',
  'Cangaco',
] as const;

export interface ElementMetadata {
  id: ElementType;
  name: string;
  colorHex: string;
  habitatName: string;
  strongAgainst: readonly ElementType[];
  weakAgainst: readonly ElementType[];
}

export const ELEMENT_METADATA: Record<ElementType, ElementMetadata> = {
  Brasa: {
    id: 'Brasa',
    name: 'Brasa',
    colorHex: '#D7263D',
    habitatName: 'Terreiro de Brasa',
    strongAgainst: ['Mata'],
    weakAgainst: ['Correnteza'],
  },
  Correnteza: {
    id: 'Correnteza',
    name: 'Correnteza',
    colorHex: '#1E3A8A',
    habitatName: 'Açude da Correnteza',
    strongAgainst: ['Brasa'],
    weakAgainst: ['Mata'],
  },
  Mata: {
    id: 'Mata',
    name: 'Mata',
    colorHex: '#2E7D32',
    habitatName: 'Bosque da Mata',
    strongAgainst: ['Correnteza'],
    weakAgainst: ['Brasa', 'Cangaco'],
  },
  Sol: {
    id: 'Sol',
    name: 'Sol',
    colorHex: '#F4B400',
    habitatName: 'Altar do Sol',
    strongAgainst: ['Lua'],
    weakAgainst: ['Lua', 'Assombracao'],
  },
  Lua: {
    id: 'Lua',
    name: 'Lua',
    colorHex: '#4338CA',
    habitatName: 'Recanto da Lua',
    strongAgainst: ['Sol'],
    weakAgainst: ['Sol', 'Assombracao'],
  },
  Armorial: {
    id: 'Armorial',
    name: 'Armorial',
    colorHex: '#C0652E',
    habitatName: 'Poleiro Armorial Universal',
    strongAgainst: [],
    weakAgainst: [],
  },
  Assombracao: {
    id: 'Assombracao',
    name: 'Assombração',
    colorHex: '#6B21A8',
    habitatName: 'Poleiro Armorial Universal',
    strongAgainst: ['Sol', 'Lua'],
    weakAgainst: ['Cangaco'],
  },
  Cangaco: {
    id: 'Cangaco',
    name: 'Cangaço',
    colorHex: '#78350F',
    habitatName: 'Poleiro Armorial Universal',
    strongAgainst: ['Assombracao', 'Mata'],
    weakAgainst: [],
  },
};

/**
 * Calcula o multiplicador elemental em milésimos (ponto fixo) para determinismo:
 * - 1250 = Vantagem (1.25x)
 * - 1000 = Neutro (1.00x)
 * - 800  = Desvantagem (0.80x)
 *
 * Regras oficiais:
 * - Ciclo básico: Brasa > Mata > Correnteza > Brasa
 * - Dualidade: Sol <-> Lua (vantagem mútua 1.25x quando ataca)
 * - Ancestral/Lendário: Assombração > Sol e Lua; Cangaço > Assombração e Mata
 */
export function getElementalMultiplierPermille(
  attacker: ElementType,
  defender: ElementType,
): 800 | 1000 | 1250 {
  if (attacker === 'Brasa') {
    if (defender === 'Mata') return 1250;
    if (defender === 'Correnteza') return 800;
  }
  if (attacker === 'Mata') {
    if (defender === 'Correnteza') return 1250;
    if (defender === 'Brasa' || defender === 'Cangaco') return 800;
  }
  if (attacker === 'Correnteza') {
    if (defender === 'Brasa') return 1250;
    if (defender === 'Mata') return 800;
  }
  if (attacker === 'Sol') {
    if (defender === 'Lua') return 1250;
    if (defender === 'Assombracao') return 800;
  }
  if (attacker === 'Lua') {
    if (defender === 'Sol') return 1250;
    if (defender === 'Assombracao') return 800;
  }
  if (attacker === 'Assombracao') {
    if (defender === 'Sol' || defender === 'Lua') return 1250;
    if (defender === 'Cangaco') return 800;
  }
  if (attacker === 'Cangaco') {
    if (defender === 'Assombracao' || defender === 'Mata') return 1250;
  }
  return 1000;
}

export function getElementalMultiplier(
  attacker: ElementType,
  defender: ElementType,
): 0.8 | 1.0 | 1.25 {
  const permille = getElementalMultiplierPermille(attacker, defender);
  if (permille === 1250) return 1.25;
  if (permille === 800) return 0.8;
  return 1.0;
}
