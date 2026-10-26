import { RoosterSpec } from '../schemas/index.js';

export const PRIMORDIAL_ROOSTERS: readonly RoosterSpec[] = [
  {
    id: 'primordial_01', number: 41, name: 'Curupira', rarity: 'Primordial', roosterClass: 'Controle',
    primaryElement: 'Mata', secondaryElement: 'Assombracao', preferredRow: 'Tras', traitPositive: '+Velocidade', traitNegative: '-Força',
    baseStats: { forca: 910, vigor: 11800, defesa: 365, velocidade: 225, tecnica: 24, garra: 158, esquiva: 10 },
    specialAbility: {
      name: 'Pegadas Invertidas', multiplierPermille: 1450, targetScope: 'AllEnemies', hitCount: 1,
      effectApplied: 'Cego', effectDurationTicks: 50, shieldPermille: 200, healPermille: 0, cantoBonus: 0,
      cleanseDebuffs: false, ignoreDefensePermille: 0, ignoreShield: false, description: 'Pegadas Invertidas: M 1,45 em todos, Cega por 2,5 s e protege aliados com Escudo de 20%.',
    },
    geneticPassive: { name: 'Guardião Ancestral da Mata', description: 'Protetor das matas com crista de fogo; confunde a mira adversária e protege aliados de Mata.' },
    source: 'Sertão Ancestral (NC 22 — Lapidário)',
    defaultVisualDNA: { id: 'dna_prim_01', parts: { tronco: 'curupira_01', cabeca: 'fogo_mata_01', crista: 'labareda_verde_01', asa_frente: 'folha_ancestral_01', cauda: 'raizes_01', canelas: 'invertida_ancestral_01' } },
  },
  {
    id: 'primordial_02', number: 42, name: 'Boto Encantado', rarity: 'Primordial', roosterClass: 'Suporte',
    primaryElement: 'Correnteza', secondaryElement: 'Lua', preferredRow: 'Tras', traitPositive: '+Garra', traitNegative: '-Defesa',
    baseStats: { forca: 860, vigor: 12000, defesa: 350, velocidade: 220, tecnica: 22, garra: 160, esquiva: 8 },
    specialAbility: {
      name: 'Serenata das Águas', multiplierPermille: 0, targetScope: 'AllAllies', hitCount: 1,
      effectApplied: 'Regeneracao', effectDurationTicks: 80, shieldPermille: 180, healPermille: 360, cantoBonus: 250,
      cleanseDebuffs: true, ignoreDefensePermille: 0, ignoreShield: false, description: 'Serenata das Águas: cura 36% de todos, aplica Escudo de 18%, limpa debuffs e soma +250 Canto.',
    },
    geneticPassive: { name: 'Encanto do Rio', description: 'Plumagem rosa-prateada e chapéu de linho; aplica cura encantada e acelera o Canto do trio.' },
    source: 'Sertão Ancestral (NC 22 — Lapidário)',
    defaultVisualDNA: { id: 'dna_prim_02', parts: { tronco: 'rosa_prata_02', cabeca: 'chapeu_linho_02', crista: 'onda_lunar_02', asa_frente: 'encanto_02', cauda: 'rio_prata_02', canelas: 'perola_rio_02' } },
  },
  {
    id: 'primordial_03', number: 43, name: 'Mapinguari', rarity: 'Primordial', roosterClass: 'Tanque',
    primaryElement: 'Mata', secondaryElement: 'Cangaco', preferredRow: 'Frente', traitPositive: '+Vigor', traitNegative: '-Velocidade',
    baseStats: { forca: 880, vigor: 13500, defesa: 420, velocidade: 150, tecnica: 16, garra: 140, esquiva: 0 },
    specialAbility: {
      name: 'Urro da Couraça', multiplierPermille: 1600, targetScope: 'AllEnemies', hitCount: 1,
      effectApplied: 'Provocado', effectDurationTicks: 60, shieldPermille: 350, healPermille: 0, cantoBonus: 0,
      cleanseDebuffs: false, ignoreDefensePermille: 0, ignoreShield: false, description: 'Urro da Couraça: M 1,6 em todos, Provoca por 3 s e ativa Escudo colossal de 35%.',
    },
    geneticPassive: { name: 'Colosso Blindado', description: 'Colosso amazônico/sertanejo blindado; absorve dano massivo na Fila da Frente.' },
    source: 'Sertão Ancestral (NC 22 — Lapidário)',
    defaultVisualDNA: { id: 'dna_prim_03', parts: { tronco: 'couraca_colosso_03', cabeca: 'mapinguari_03', crista: 'espinho_ferro_03', asa_frente: 'muralha_verde_03', cauda: 'pesada_03', canelas: 'pilar_rocha_03' } },
  },
  {
    id: 'primordial_04', number: 44, name: 'Lobisomem do Cariri', rarity: 'Primordial', roosterClass: 'Bruiser',
    primaryElement: 'Lua', secondaryElement: 'Brasa', preferredRow: 'Frente', traitPositive: '+Força', traitNegative: '-Técnica',
    baseStats: { forca: 970, vigor: 12500, defesa: 375, velocidade: 205, tecnica: 22, garra: 150, esquiva: 5 },
    specialAbility: {
      name: 'Uivo da Encruzilhada', multiplierPermille: 2350, targetScope: 'EnemyFrontRow', hitCount: 1,
      effectApplied: 'RouboDeVida', effectDurationTicks: 80, shieldPermille: 0, healPermille: 200, cantoBonus: 0,
      cleanseDebuffs: false, ignoreDefensePermille: 200, ignoreShield: false, description: 'Uivo da Encruzilhada: M 2,35 na frente inimiga, ignora 20% Def e ativa 30% Roubo de Vida.',
    },
    geneticPassive: { name: 'Fera da Lua Cheia', description: 'Fera das encruzilhadas de lua cheia; escala Força e Roubo de Vida conforme perde Vigor.' },
    source: 'Sertão Ancestral (NC 22 — Lapidário)',
    defaultVisualDNA: { id: 'dna_prim_04', parts: { tronco: 'pelagem_negra_04', cabeca: 'lobo_cariri_04', crista: 'lua_sangue_04', asa_frente: 'garra_brasa_04', cauda: 'noturna_04', canelas: 'fera_04' } },
  },
  {
    id: 'primordial_05', number: 45, name: 'Corpo-Seco', rarity: 'Primordial', roosterClass: 'Assassino',
    primaryElement: 'Assombracao', secondaryElement: 'Sol', preferredRow: 'Tras', traitPositive: '+Técnica', traitNegative: '-Vigor',
    baseStats: { forca: 980, vigor: 9500, defesa: 295, velocidade: 238, tecnica: 28, garra: 155, esquiva: 12 },
    specialAbility: {
      name: 'Toque da Terra Rejeitada', multiplierPermille: 3000, targetScope: 'LowestVigorEnemy', hitCount: 1,
      effectApplied: 'Silenciado', effectDurationTicks: 40, shieldPermille: 0, healPermille: 250, cantoBonus: 0,
      cleanseDebuffs: false, ignoreDefensePermille: 300, ignoreShield: true, description: 'Toque da Terra Rejeitada: salta na retaguarda com M 3,0, ignora Escudo e drena 25% de Vigor.',
    },
    geneticPassive: { name: 'Rejeitado pela Terra', description: 'Entidade assombrada que a terra rejeitou; salta direto na retaguarda drenando Vigor e Escudo.' },
    source: 'Sertão Ancestral (NC 22 — Lapidário)',
    defaultVisualDNA: { id: 'dna_prim_05', parts: { tronco: 'casca_seca_05', cabeca: 'caveira_sol_05', crista: 'fogo_fatuo_05', asa_frente: 'espectro_05', cauda: 'poeira_assombrada_05', canelas: 'raiz_seca_05' } },
  },
  {
    id: 'primordial_06', number: 46, name: 'Pisadeira', rarity: 'Primordial', roosterClass: 'Atirador',
    primaryElement: 'Lua', secondaryElement: 'Assombracao', preferredRow: 'Tras', traitPositive: '+Velocidade', traitNegative: '-Defesa',
    baseStats: { forca: 965, vigor: 9800, defesa: 290, velocidade: 232, tecnica: 27, garra: 156, esquiva: 10 },
    specialAbility: {
      name: 'Peso do Telhado', multiplierPermille: 1850, targetScope: 'Top2CantoEnemies', hitCount: 2,
      effectApplied: 'Lento', effectDurationTicks: 60, shieldPermille: 0, healPermille: 0, cantoBonus: 0,
      cleanseDebuffs: false, ignoreDefensePermille: 250, ignoreShield: false, description: 'Peso do Telhado: 2 golpes de M 1,85 nos 2 inimigos com mais Canto, aplica Lento 3 s e sufoca Canto.',
    },
    geneticPassive: { name: 'Sombra dos Telhados', description: 'Sombra noturna dos telhados; sufoca a barra de Canto e reduz a Velocidade inimiga.' },
    source: 'Sertão Ancestral (NC 22 — Lapidário)',
    defaultVisualDNA: { id: 'dna_prim_06', parts: { tronco: 'telha_noite_06', cabeca: 'pisadeira_06', crista: 'vulto_lunar_06', asa_frente: 'sombra_pesada_06', cauda: 'telhado_06', canelas: 'garra_longa_06' } },
  },
] as const;
