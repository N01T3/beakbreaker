# 02. ESTRUTURA DO MONOREPO E ENGENHARIA ORIENTADA A COMPONENTES

Este documento define a organização física de pastas e o padrão de componentização do **BeakBreaker v5.0**. A arquitetura proíbe acoplamento cruzado e garante que cada arquivo seja pequeno, testável e reutilizável.

---

## 1. Árvore Completa do Monorepo (`Turborepo + pnpm`)

```text
beakbreaker/
├── AGENTS.md                           # Regras mestras do Google Antigravity
├── mcp_config.json                     # Configuração de servidores MCP para o Antigravity
├── package.json                        # Scripts globais do workspace
├── pnpm-workspace.yaml                 # Definição dos pacotes do monorepo
├── turbo.json                          # Pipeline de cache (build, test, lint, typecheck)
├── .agents/                            # Regras e Skills nativas do Antigravity IDE/CLI
│   ├── rules/                          # Regras escopadas (flat directory com frontmatter YAML)
│   │   ├── 01-combat-determinism.md
│   │   ├── 02-component-size-limit.md
│   │   ├── 03-legal-18plus-compliance.md
│   │   └── 04-pixi-vue-separation.md
│   └── skills/                         # Skills executáveis pelo agente (/balance, /new-rooster)
│       ├── run-balance-sim/
│       │   └── SKILL.md
│       ├── create-rooster-spec/
│       │   └── SKILL.md
│       └── audit-db-concurrency/
│           └── SKILL.md
│
├── packages/                           # PACOTES PUROS COMPARTILHADOS (SEM DUPLICAÇÃO)
│   ├── game-data/                      # Tabelas estáticas do GDD v5.0 e Schemas Zod
│   │   ├── src/
│   │   │   ├── roosters/               # Fichas #01 a #40, 6 Primordiais e 39 Sazonais
│   │   │   ├── classes-synergies.ts    # 6 Classes e 7 Sinergias cumulativas
│   │   │   ├── farm-tables.ts          # Sede 1-12, Poleiros 1-8, 4 Torres, 4 Defesas
│   │   │   ├── genetics-recipes.ts     # Pesos do Ninhal, 6 Mutações, 24 Receitas Santuário
│   │   │   ├── gacha-pity.ts           # Curva de Pity (1-80), Corrida (18 Voltas), Passe (40 Nv)
│   │   │   └── schemas/                # Contratos Zod compartilhados Cliente <-> Servidor
│   │   └── package.json
│   │
│   ├── combat-core/                    # MOTOR DETERMINÍSTICO 20 TICKS/S (ZERO DEPENDÊNCIA DE UI)
│   │   ├── src/
│   │   │   ├── math/
│   │   │   │   ├── FixedMath.ts        # Aritmética inteira segura (clamp, floorDiv, pct)
│   │   │   │   └── SeededPRNG.ts       # Gerador determinístico Mulberry32
│   │   │   ├── entities/
│   │   │   │   ├── CombatUnit.ts       # Estado de Vigor, Canto, Fila e Atributos em luta
│   │   │   │   └── StatusEffectManager.ts # Os 11 efeitos de status e imunidades (DR)
│   │   │   ├── systems/
│   │   │   │   ├── SynergyResolver.ts  # Calcula os 7 bônus de trio no tick 0
│   │   │   │   ├── TargetingSystem.ts  # Regra Frente/Trás, Provocado e Furtivo
│   │   │   │   ├── DamageCalculator.ts # Equação oficial de dano, crítico e elemental
│   │   │   │   ├── CantoSystem.ts      # Geração de Canto e conversão de Vel > 360
│   │   │   │   ├── InterruptSystem.ts  # Regra de Corta-Canto no frame de voo
│   │   │   │   └── RaidBossSystem.ts   # As 3 fases do Galo Colosso (Brasa, Lua, Fúria)
│   │   │   ├── simulator/
│   │   │   │   └── BattleEngine.ts     # Loop de 1.800 ticks que emite BattleEvents[]
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── genetics-engine/                # MOTOR GENÉTICO PURO (NINHAL, SANTUÁRIO & ÁRVORE)
│   │   ├── src/
│   │   │   ├── NinhalCalculator.ts     # Piscina de pesos, Barra Dourada (peso 8), Híbrido 35%
│   │   │   ├── MutationResolver.ts     # Sorteio de 5% para pais NG 30+
│   │   │   ├── SanctuaryMatcher.ts     # Validador das 24 receitas determinísticas (Nv 1-8)
│   │   │   └── OrbEconomy.ts           # Extração (40 a 100 Orbes), Happy Hour e 11.200 Orbes
│   │   └── package.json
│   │
│   └── ui-cordel/                      # DESIGN SYSTEM "CORDEL POP" (COMPONENTES ATÔMICOS VUE 3)
│       ├── src/
│       │   ├── tokens/                 # Paleta oficial (#D7263D, #F4B400, #F5E9D3, #1B1B1B)
│       │   ├── atoms/                  # CordelButton, RopeBadge, ResourcePill, StarRow
│       │   ├── molecules/              # RoosterCard, DualStatBar, PityProgressBar, EquipmentSlot
│       │   └── organisms/              # CordelModal, WoodcutHeader, BottomNavHub
│       └── package.json
│
├── apps/
│   ├── client/                         # APLICATIVO DO JOGO (VUE 3 + PIXIJS V8 + CAPACITOR)
│   │   ├── android/                    # Projeto nativo Capacitor Android
│   │   ├── raw-assets/                 # Assets fonte processados pelo @assetpack/core
│   │   ├── src/
│   │   │   ├── canvas/                 # CAMADA PIXIJS V8 (MÁX 150 LINHAS POR ARQUIVO)
│   │   │   │   ├── core/               # PixiAppManager, AssetLoader, SceneRouter
│   │   │   │   ├── spine/              # RoosterSpineAssembler (Rig Mestre de 6 peças)
│   │   │   │   ├── scenes/
│   │   │   │   │   ├── farm/           # IsoFarmScene, PerchNode, RoamingRooster, DayNightFilter
│   │   │   │   │   ├── arena/          # ArenaScene, UnitActor, XiloHitPopup ("PAH! -182")
│   │   │   │   │   └── board/          # HeroRaceTrackScene, LabyrinthBoardScene, WarMapScene
│   │   │   ├── features/               # MÓDULOS DE FUNCIONALIDADE (DOMAIN-DRIVEN)
│   │   │   │   ├── ftue/               # Escolha dos 3 ovos com Vô Tonho e Age Gate 18+
│   │   │   │   ├── farm/               # Painéis de Poleiro, Sede, Torres dos Santos, Feira
│   │   │   │   ├── combat-hud/         # Cartas luminosas, botão Torcida, seletor x1/x2/x3
│   │   │   │   ├── roster/             # Ficha do Galo, Despertar Astral, Oficina +15, Álbum
│   │   │   │   ├── genetics/           # Telas do Ninhal, Evolução Ramificada, Santuário, Árvore
│   │   │   │   ├── pve/                # Estrada do Sertão (90 fases), Torre do Mandacaru (100F)
│   │   │   │   ├── pvp/                # Liga Ranqueada, Supremo 9v9, Saque & Revanche, TV Sertão
│   │   │   │   ├── clan/               # Bando, Raid do Colosso, Guerra de Territórios, Troca
│   │   │   │   ├── liveops/            # Corrida de Heróis, Passe Divino, Labirinto, Roda
│   │   │   │   └── store/              # Loja do Arraial, Cofre, Oferta Relâmpago, Limite ECA
│   │   │   ├── stores/                 # Pinia Stores finas conectadas à API e ao WebSocket
│   │   │   └── services/               # ApiClient, SocketClient, AudioService (Howler)
│   │   └── package.json
│   │
│   ├── server/                         # BACKEND DE ALTA PERFORMANCE (FASTIFY + DRIZZLE + REDIS)
│   │   ├── src/
│   │   │   ├── db/                     # Schema Drizzle PostgreSQL e Migrations
│   │   │   ├── locks/                  # Redlock helpers (idempotência de tiros, colheita, saque)
│   │   │   ├── modules/                # Módulos verticais (auth-18plus, farm, battle, gacha, clan, billing)
│   │   │   ├── jobs/                   # Workers BullMQ (Reset Sazonal, Bolão TV Sertão, Raid)
│   │   │   └── ws/                     # Handlers Socket.IO (Chat UF, Bando, Guerra de Territórios)
│   │   └── package.json
│   │
│   └── web-store/                      # LOJA WEB OFICIAL VIA PIX (+15% COROAS)
│       ├── src/                        # Checkout rápido por ID de Jogador + QR Code Pix dinâmico
│       └── package.json
│
└── tools/                              # HARNESSES DE ENGENHARIA E SIMULADORES
    ├── balance-sim/                    # Simulador Headless de 10.000 lutas (Gate da Etapa 1)
    ├── economy-sim/                    # Simulador Monte Carlo de Pity (2,73%) e Economia F2P
    └── spine-sandbox/                  # Visualizador isolado do Rig Mestre Spine 2D e Híbridos
```

---

## 2. Engenharia de Componentes: Como Evitar Código Monolítico

### 2.1. Padrão de Montagem do Rig Mestre no Spine 2D (`RoosterSpineAssembler.ts`)
Em vez de ter classes gigantes para cada galo, todo galo (seja o `#01 Galo Campina`, o `#18 Trovão do Sertão` ou um filhote híbrido) é montado por composição de **6 Slots Padronizados** sobre o mesmo esqueleto `rooster_master.skel`:

```typescript
// apps/client/src/canvas/spine/RoosterSpineAssembler.ts (< 90 linhas)
import { Spine, Skin } from '@esotericsoftware/spine-pixi-v8';
import type { RoosterVisualDNA } from '@beakbreaker/game-data';

export const ROOSTER_SLOTS = [
  'tronco',
  'cabeca',
  'crista',
  'asa_frente',
  'cauda',
  'canelas',
] as const;

export function assembleRoosterSkin(spineInstance: Spine, dna: RoosterVisualDNA): void {
  const skeletonData = spineInstance.skeleton.data;
  const customSkin = new Skin(`hybrid_${dna.id}`);

  for (const slotKey of ROOSTER_SLOTS) {
    const partSkinName = dna.parts[slotKey]; // ex: 'crista/trovao_sertao' ou 'cauda/asa_branca'
    const sourceSkin = skeletonData.findSkin(partSkinName);
    if (sourceSkin) {
      customSkin.addSkin(sourceSkin);
    }
  }

  // Aplica equipamentos visuais da Oficina (+15) se presentes
  if (dna.equippedSetVisual) {
    const equipSkin = skeletonData.findSkin(`equip/${dna.equippedSetVisual}`);
    if (equipSkin) customSkin.addSkin(equipSkin);
  }

  spineInstance.skeleton.setSkin(customSkin);
  spineInstance.skeleton.setSlotsToSetupPose();
}
```

### 2.2. Padrão de Desacoplamento Motor ↔ Renderizador na Arena (`BattleEventBus`)
O motor de combate (`BattleEngine.ts`) **não sabe que existe tela**. Ele avança tick por tick e emite uma lista enxuta de eventos (`TickEvent`). A cena do PixiJS (`ArenaScene.ts`) apenas consome esses eventos na velocidade selecionada pelo jogador (`×1`, `×2` ou `×3`):

- `BattleEngine.ts` (Puro, ~140 linhas): Calcula matemática e gera eventos `{ tick, type: 'DAMAGE', targetId, value: 182, isCrit: true }`.
- `ArenaDirector.ts` (Cliente, ~110 linhas): Lê a fila de eventos conforme o `deltaTime * speedMultiplier` e dispara métodos nos atores visuais.
- `UnitActor.ts` (Cliente, ~120 linhas): Controla um único esqueleto Spine na arena (toca animação, atualiza barra dupla de Vigor/Canto).
- `XiloHitPopup.ts` (Cliente, ~60 linhas): Pool de objetos (`ObjectPool`) que exibe o balão de xilogravura `"PAH! -182"` sem alocar memória nova no Garbage Collector durante a luta.

### 2.3. Padrão de Componentes do Design System (`packages/ui-cordel`)
Todas as 32 telas utilizam os mesmos tijolos visuais do estilo **Cordel Pop**:
1. **`<CordelWoodFrame title="...">`**: Moldura com contorno preto de xilogravura (`border-2 border-[#1B1B1B]`), textura de papel creme (`#F5E9D3`), corda lateral e bandeirinhas de São João.
2. **`<RoosterAtletaCard :rooster="item" mode="compact | album | battle" />`**: Renderiza qualquer card dos 40 galos base, 6 Primordiais ou 39 Sazonais usando exatamente a mesma estrutura de badges de elemento, classe e estrelas (1★–5★ amarelas e 6★–10★ vermelhas).
3. **`<DualCombatBar :vigor="curVigor" :maxVigor="maxVigor" :canto="curCanto" />`**: Barra dupla reutilizada na Arena 3v3, Duelo 1x1, Raid do Colosso e TV Sertão.
