# 05. PLAYBOOK DE EXECUÇÃO NO GOOGLE ANTIGRAVITY (ORDEM DE CONSTRUÇÃO EM 7 ETAPAS)

Para construir o jogo sem sobrecarregar o contexto do agente e garantindo que cada peça funcione na primeira tentativa, execute os prompts no **Google Antigravity** seguindo exatamente a **Ordem de Construção por Dependência (7 Etapas)** definida na Página 28 do GDD v5.0.

---

## Passo 0: Inicialização do Repositório
1. Crie a pasta do projeto, inicialize o Git (`git init -b main`) e coloque os 5 arquivos `.md` gerados (`AGENTS.md` na raiz e os demais em `docs/`).
2. No painel do agente do **Antigravity**, envie o **Prompt 01** abaixo.

---

## Sequência de Prompts Prontos para o Agente Antigravity

### Prompt 01 — Etapa 1A: Bootstrap do Monorepo & Tabelas do GDD (`packages/game-data`)
> **Prompt para o Antigravity:**
> "Siga as regras em `AGENTS.md` e a estrutura em `docs/MONOREPO_AND_COMPONENT_DESIGN.md`. Inicialize o monorepo com `pnpm` e `turborepo`. Crie primeiro o pacote `packages/game-data` com validação `zod` contendo: (1) os 6 elementos e a matriz elemental $\{0.80, 1.00, 1.25\}$; (2) as 6 classes e 7 sinergias de trio; (3) as fichas completas dos 40 galos do lançamento (#01 a #40) e dos 6 Primordiais; (4) a tabela da Sede (Níveis 1 a 12) e Poleiros (Níveis 1 a 8). Mantenha cada arquivo abaixo de 200 linhas e escreva testes unitários validando a integridade das tabelas."

### Prompt 02 — Etapa 1B: Motor Determinístico de Combate (`packages/combat-core`) e Harness
> **Prompt para o Antigravity:**
> "Implemente agora o pacote `packages/combat-core` e o simulador `tools/balance-sim` seguindo estritamente `docs/MODULE_IMPLEMENTATION_SPECS.md` (Módulo 1). Construa `SeededPRNG.ts` (mulberry32), `FixedMath.ts`, `DamageCalculator.ts`, `CantoSystem.ts` (incluindo a regra de excesso de Velocidade $> 360$), `StatusEffectManager.ts` (os 11 efeitos + imunidade de 2s pós-atordoamento), `InterruptSystem.ts` (Corta-Canto no frame de voo) e `BattleEngine.ts` (20 ticks/s, 1.800 ticks). Em seguida, rode o harness de 10.000 sementes para comprovar 100% de determinismo."

### Prompt 03 — Etapa 2: Design System Cordel Pop (`packages/ui-cordel`) & Arena 3v3 (`apps/client`)
> **Prompt para o Antigravity:**
> "Crie o pacote `packages/ui-cordel` com os tokens da paleta Cordel Pop (`#D7263D`, `#F4B400`, `#F5E9D3`, `#1B1B1B`), tipografia `Lilita One` + `Nunito`, e os componentes atômicos (`CordelWoodFrame`, `RoosterAtletaCard`, `DualCombatBar`). Depois, inicialize `apps/client` (Vue 3 + Vite + PixiJS v8 + `@esotericsoftware/spine-pixi-v8`) e implemente o `RoosterSpineAssembler.ts` (Rig Mestre de 6 peças) e a `ArenaScene.ts` consumindo os eventos do `@beakbreaker/combat-core` com seletor de velocidade $\times 1 / \times 2 / \times 3$, botão de Torcida e popups em xilogravura 'PAH! -182'."

### Prompt 04 — Etapa 3: Fazenda Viva 2.0 Isométrica & Motor Genético (`packages/genetics-engine`)
> **Prompt para o Antigravity:**
> "Implemente `packages/genetics-engine` com a Calculadora do Ninhal (pesos por raridade, Barra de Empoderamento Dourada com peso 8 para os 8 Lendários de combinação, 35% de Híbrido e 5% de Mutação Secreta para pais NG 30+). No `apps/client`, construa a cena isométrica da Fazenda Viva 2.0 usando `pixi-viewport`, com os Poleiros Elementais gerando Milho por avaliação preguiçosa de timestamp, Sede 1–12, As 4 Torres dos Santos Padroeiros, Ciclo Dia/Noite e o fluxo de FTUE de 15 minutos com o Vô Tonho."

### Prompt 05 — Etapa 4: Santuário (24 Receitas), Árvore da Vida, Oficina (+15) & Saque Anticonluio
> **Prompt para o Antigravity:**
> "Implemente as telas e endpoints do Santuário Genético da Serra (Níveis 1 a 8 com as 24 receitas determinísticas), da Árvore da Vida (reciclagem entregando 40 Orbes no NG 1 até 100 Orbes no NG 30, Despertar Astral de 11.200 Orbes até $10\star$ e Happy Hour de Orbes Curinga às quartas e sextas), da Oficina da Vila (+1 a +15 com os 8 conjuntos) e do Saque de Fazenda em 2 ondas com as 4 defesas rurais e a trava Redis de 72h na Revanche Anticonluio."

### Prompt 06 — Etapa 5: Bando, Raid do Colosso, Guerra de Territórios, Corrida (18 Voltas) & Torre (100F)
> **Prompt para o Antigravity:**
> "Construa no `apps/server` (Fastify + Drizzle + Redis + Socket.IO) e no `apps/client` os sistemas de Endgame e Eventos: (1) Campanha Estrada do Sertão (90 fases e 6 Chefes) e Torre do Mandacaru (100 andares com os 12 modificadores); (2) Bando (Níveis 1 a 10), Feira de Troca de Orbes, Raid do Galo Colosso (3 fases de Vigor e 10 dificuldades até 1,37B) e Guerra de Territórios (validação de adjacência por estrada e fadiga de 2 ataques / 1 defesa); (3) Corrida de Heróis de 18 Voltas com Pool Cooldown (1.050 itens até a Volta 15 e 640 Orbes na Volta 18)."

### Prompt 07 — Etapa 6: Chocadeira (Pity 2,73%), Loja Web Pix (+15%) & Blindagem 18+ (ECA Digital)
> **Prompt para o Antigravity:**
> "Implemente o motor da Chocadeira com Soft Pity no tiro 61 ($+5\text{ p.p.}$/tiro), Hard Pity no tiro 80, regra 50/50 e gatilho da Oferta Relâmpago (tiros 58–65). Construa a Loja do Arraial (Passe Divino de 40 níveis, Cofre do Galo de Ouro, Cartão do Fazendeiro + Clube de Orbes, VIP 1–15), o app `apps/web-store` com webhook Pix idempotente (+15% Coroas) e o módulo de conformidade ECA Digital (Lei 15.211/2025) com verificação etária 18+, histórico de 90 dias e limite mensal de gastos."
