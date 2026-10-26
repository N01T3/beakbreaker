import { z } from 'zod';

export const ElementTypeSchema = z.enum([
  'Brasa',
  'Correnteza',
  'Mata',
  'Sol',
  'Lua',
  'Armorial',
  'Assombracao',
  'Cangaco',
]);
export type ElementType = z.infer<typeof ElementTypeSchema>;

export const RoosterClassSchema = z.enum([
  'Tanque',
  'Bruiser',
  'Assassino',
  'Atirador',
  'Suporte',
  'Controle',
]);
export type RoosterClass = z.infer<typeof RoosterClassSchema>;

export const RaritySchema = z.enum([
  'Comum',
  'Raro',
  'Epico',
  'Lendario',
  'Mitico',
  'Heroico',
  'Primordial',
]);
export type Rarity = z.infer<typeof RaritySchema>;

export const RowPositionSchema = z.enum(['Frente', 'Tras']);
export type RowPosition = z.infer<typeof RowPositionSchema>;

export const StatusEffectTypeSchema = z.enum([
  'Atordoado',
  'Cego',
  'Silenciado',
  'Lento',
  'Queimadura',
  'Provocado',
  'Escudo',
  'Espinhos',
  'Furtivo',
  'Regeneracao',
  'RouboDeVida',
]);
export type StatusEffectType = z.infer<typeof StatusEffectTypeSchema>;

export const EquipmentSetIdSchema = z.enum([
  'BrasaViva',
  'CouroDeGibao',
  'Mandacaru',
  'VentoDoArraial',
  'LuarDoSertao',
  'AguasDoVelhoChico',
  'ArmorialReal',
  'CangacoDeAco',
]);
export type EquipmentSetId = z.infer<typeof EquipmentSetIdSchema>;

export const PerkGemIdSchema = z.enum([
  'FenixSertaneja',
  'Ceifador',
  'Procriacao',
]);
export type PerkGemId = z.infer<typeof PerkGemIdSchema>;

export const TowerModifierIdSchema = z.enum([
  'Seca',
  'Chuva',
  'Noite',
  'Ventania',
  'SolAPino',
  'NeblinaDaSerra',
  'Muralha',
  'Assombracao',
  'FuriaDoCoronel',
  'FeNaSanfona',
  'Espinheiro',
  'FestaNoArraial',
]);
export type TowerModifierId = z.infer<typeof TowerModifierIdSchema>;

export const RoosterVisualDNASchema = z.object({
  id: z.string(),
  parts: z.object({
    tronco: z.string(),
    cabeca: z.string(),
    crista: z.string(),
    asa_frente: z.string(),
    cauda: z.string(),
    canelas: z.string(),
  }),
  equippedSetVisual: z.string().optional(),
  isGoldenPlumage: z.boolean().optional(),
});
export type RoosterVisualDNA = z.infer<typeof RoosterVisualDNASchema>;

export const RoosterSpecSchema = z.object({
  id: z.string(),
  number: z.number().int().min(1).max(200),
  name: z.string(),
  rarity: RaritySchema,
  roosterClass: RoosterClassSchema,
  primaryElement: ElementTypeSchema,
  secondaryElement: ElementTypeSchema.optional(),
  preferredRow: RowPositionSchema,
  traitPositive: z.string(),
  traitNegative: z.string(),
  baseStats: z.object({
    forca: z.number().int().positive(),
    vigor: z.number().int().positive(),
    defesa: z.number().int().positive(),
    velocidade: z.number().int().positive(),
    tecnica: z.number().int().min(0).max(100),
    garra: z.number().int().min(0),
    esquiva: z.number().int().min(0).max(60).default(0),
  }),
  specialAbility: z.object({
    name: z.string(),
    multiplierPermille: z.number().int().min(0),
    targetScope: z.enum([
      'CurrentTarget',
      'LowestVigorEnemy',
      'HighestForcaEnemy',
      'LowestDefBackEnemy',
      'EnemyFrontRow',
      'EnemyBackRow',
      'AllEnemies',
      'Top2CantoEnemies',
      'Top2ForcaEnemies',
      'RandomEnemies',
      'Self',
      'MostWoundedAlly',
      'Lowest2VigorAllies',
      'AllAllies',
    ]),
    hitCount: z.number().int().min(1).default(1),
    effectApplied: StatusEffectTypeSchema.optional(),
    effectDurationTicks: z.number().int().min(0).default(0),
    shieldPermille: z.number().int().min(0).default(0),
    healPermille: z.number().int().min(0).default(0),
    cantoBonus: z.number().int().default(0),
    cleanseDebuffs: z.boolean().default(false),
    ignoreDefensePermille: z.number().int().min(0).max(1000).default(0),
    ignoreShield: z.boolean().default(false),
    description: z.string(),
  }),
  geneticPassive: z.object({
    name: z.string(),
    description: z.string(),
  }),
  source: z.string(),
  defaultVisualDNA: RoosterVisualDNASchema,
});
export type RoosterSpec = z.infer<typeof RoosterSpecSchema>;
