export const CORDEL_PALETTE = {
  vermelhoCrista: '#D7263D',
  amareloMilho: '#F4B400',
  terracota: '#C0652E',
  verdeMata: '#2E7D32',
  azulAnil: '#1E3A8A',
  cremePapel: '#F5E9D3',
  tintaXilo: '#1B1B1B',
} as const;

export const CORDEL_TYPOGRAPHY = {
  displayFont: 'Lilita One',
  bodyFont: 'Nunito',
  woodcutSerif: 'Alfa Slab One',
  secondaryBodyFont: 'Libre Franklin',
} as const;

export type CordelColorKey = keyof typeof CORDEL_PALETTE;
export type CordelElementType =
  | 'Brasa'
  | 'Correnteza'
  | 'Mata'
  | 'Sol'
  | 'Lua'
  | 'Armorial'
  | 'Assombracao'
  | 'Cangaco';

export type CordelRarity =
  | 'Comum'
  | 'Raro'
  | 'Epico'
  | 'Lendario'
  | 'Mitico'
  | 'Heroico'
  | 'Primordial';

export type CordelRoosterClass =
  | 'Tanque'
  | 'Bruiser'
  | 'Assassino'
  | 'Atirador'
  | 'Suporte'
  | 'Controle';

export const ELEMENT_COLORS: Record<CordelElementType, string> = {
  Brasa: CORDEL_PALETTE.vermelhoCrista,
  Correnteza: CORDEL_PALETTE.azulAnil,
  Mata: CORDEL_PALETTE.verdeMata,
  Sol: CORDEL_PALETTE.amareloMilho,
  Lua: '#4338CA',
  Armorial: CORDEL_PALETTE.terracota,
  Assombracao: '#6B21A8',
  Cangaco: '#78350F',
};

export const RARITY_COLORS: Record<CordelRarity, string> = {
  Comum: '#6B7280',
  Raro: CORDEL_PALETTE.azulAnil,
  Epico: '#7C3AED',
  Lendario: CORDEL_PALETTE.amareloMilho,
  Mitico: CORDEL_PALETTE.vermelhoCrista,
  Heroico: CORDEL_PALETTE.terracota,
  Primordial: '#111827',
};

export const CORDEL_BORDERS = {
  xiloFrame: 'border-2 border-[#1B1B1B]',
  xiloShadow: '4px 4px 0px #1B1B1B',
  paperBackground: CORDEL_PALETTE.cremePapel,
} as const;

export const cordelTokens = {
  palette: CORDEL_PALETTE,
  typography: CORDEL_TYPOGRAPHY,
  elements: ELEMENT_COLORS,
  rarities: RARITY_COLORS,
  borders: CORDEL_BORDERS,
} as const;
