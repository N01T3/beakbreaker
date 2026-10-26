# 01. REGRAS MESTRAS DO AGENTE — BEAKBREAKER v5.0 (`AGENTS.md`)

Este arquivo define as regras arquiteturais, técnicas e legais inegociáveis para o desenvolvimento do **BeakBreaker v5.0**.

---

## 1. Arquitetura & Limites de Tamanho de Arquivo
- **Monorepo (`Turborepo + pnpm`):**
  - `packages/game-data`: Tabelas estáticas do GDD v5.0 e contratos `zod` compartilhados.
  - `packages/combat-core`: Motor determinístico de combate (20 ticks/s, ponto fixo, zero dependência de UI/DOM).
  - `packages/genetics-engine`: Calculadora pura do Ninhal, Mutações Secretas (5%), Híbridos (35%), Santuário (24 receitas) e Árvore da Vida.
  - `packages/ui-cordel`: Design System "Cordel Pop" em Vue 3 (`#D7263D`, `#F4B400`, `#F5E9D3`, `#1B1B1B`, fontes `Lilita One` e `Nunito`).
  - `apps/client`: Aplicativo Vue 3 + Vite + PixiJS v8 + `@esotericsoftware/spine-pixi-v8` + Capacitor.
  - `apps/server`: Backend Fastify + Drizzle ORM (PostgreSQL) + Redis (Redlock/BullMQ) + Socket.IO.
  - `apps/web-store`: Loja Web Oficial via Pix (+15% Coroas).
  - `tools/`: Harnesses `balance-sim`, `economy-sim` e `spine-sandbox`.
- **Teto de Linhas por Arquivo:**
  - Nenhum arquivo `.ts` ou `.vue` pode exceder **200–250 linhas** (arquivos de cena PixiJS v8 em `apps/client/src/canvas/` têm teto de **150 linhas**).
  - Extraia componentes visuais atômicos para `packages/ui-cordel` e lógica reativa para composables `use*.ts`.

## 2. Determinismo Estrito no Combate (`packages/combat-core`)
- **Proibido `Math.random()` e `Date.now()`:** Todo sorteio deve utilizar exclusivamente `SeededPRNG` (algoritmo Mulberry32).
- **Aritmética Inteira em Ponto Fixo (`FixedMath`):** Toda divisão em fórmulas de combate deve utilizar `Math.floor()` e multiplicadores inteiros (base `1.000` ou `10.000`) para garantir 100% de igualdade bit a bit entre arquiteturas ARM (Android) e x86 (Servidor).
- **Desacoplamento Motor ↔ UI:** `combat-core` nunca importa classes do PixiJS, Vue ou APIs de navegador (`window`, `document`). Ele apenas consome um estado inicial + `seed` e emite `BattleEvent[]`.

## 3. Performance Mobile (2 GB RAM Gate & 40 MB APK Gate)
- **Object Pooling Obrigatório:** Popups de dano em xilogravura (`XiloHitPopup`), partículas e projéteis na Arena devem usar `ObjectPool` sem alocar novos objetos durante os 1.800 ticks da luta.
- **Rig Mestre Spine 2D:** Todos os galos utilizam o mesmo esqueleto mestre (`rooster_master.skel`) montado dinamicamente via `RoosterSpineAssembler` com 6 slots padronizados (`tronco`, `cabeca`, `crista`, `asa_frente`, `cauda`, `canelas`).
- **Orçamento de Renderização:** Máximo de `< 25 draw calls` e `< 120 MB VRAM` mesmo no modo Supremo 9v9 (18 galos simultâneos).

## 4. Conformidade Legal Obrigatória (Lei 9.605/98 & ECA Digital Lei 15.211/2025)
- **Vocabulário Esportivo/Fantasia ("Cordel Pop"):** É **estritamente proibido** utilizar no código, UI, textos ou comentários os termos banidos relacionados a maus-tratos ou apostas ilegais (`rinha`, `galista`, `aposta`, `espora`). Utilize sempre a terminologia oficial do GDD: **Atletas de Crista**, **Arena do Arraial**, **Duelo de Canto**, **Vigor**, **Canto**, **Torcida**, **Penas Douradas**, **Coroas**, **Bando** e **Bolão Cultural da TV Sertão**.
- **Blindagem 18+ e Transparência de Sorteio (ECA Digital):**
  - Verificação etária 18+ obrigatória no FTUE/Cadastro.
  - Exibição explícita de probabilidades, contador de Pity (`X/80`), histórico de sorteios dos últimos 90 dias e configuração de limite mensal de gastos.
