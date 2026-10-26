# 04. HARNESSES DE TESTE, PLUGINS/SKILLS DO ANTIGRAVITY & VERSIONAMENTO GIT

Para construir o **BeakBreaker v5.0** com velocidade industrial e zero retrabalho, utilizamos **3 Harnesses Automatizados**, **Skills e Regras Nativas do Google Antigravity** (`.agents/`) e um fluxo **Git + CI/CD** mapeado diretamente para os **7 Gates de Construção** da Página 28 do GDD.

---

## 1. Os 3 Harnesses de Engenharia (`tools/`)

### 1.1. Harness 1: Simulador Headless de Determinismo e Balanceamento (`tools/balance-sim`)
Executa o pacote `@beakbreaker/combat-core` em múltiplos Worker Threads no Node.js (sem abrir navegador) para validar o **Gate Obrigatório da Etapa 1**:
- **Comando:** `pnpm --filter @beakbreaker/balance-sim run verify-gate-1`
- **O que o Harness testa em `< 3 segundos`:**
  1. **Teste de Determinismo (10.000 Sementes):** Roda 10.000 lutas aleatórias duas vezes e compara o hash SHA-256 do log completo de ticks. Exige **$100\%$ de igualdade bit a bit**.
  2. **Teste de Duração Mediana (Calibração Vigor $\times 3$):** Verifica se a duração mediana das lutas 3v3 está entre **$40\text{ s}$ e $75\text{ s}$** (evitando lutas de $10,6\text{ s}$).
  3. **Auditoria de Meta (Win Rate Cap):** Simula torneios todos-contra-todos entre os 40 galos do lançamento e falha o build se qualquer galo ultrapassar **$55\%$ de taxa de vitória global** ou se a classe Suporte cair abaixo de **$45\%$**.

### 1.2. Harness 2: Simulador Monte Carlo de Pity, Genética e Economia (`tools/economy-sim`)
Valida matematicamente o **Gate da Etapa 4 e Etapa 6**:
- **Comando:** `pnpm --filter @beakbreaker/economy-sim run audit-economy`
- **O que o Harness testa:**
  1. Simula **1.000.000 de tiros na Chocadeira** e comprova que a taxa consolidada de Lendários converge para **$2,73\% \pm 0,02\%$** e que nenhum jogador passa do tiro 80 sem Lendário.
  2. Simula **180 dias de um jogador F2P ativo** para validar a chegada exata da Sede 1 à Sede 12 (Dia 1 = Sede 3, Dia 12 = Sede 6, Dia 30 = Sede 8, Dia 150 = Sede 12) e o ganho mensal de **10.500 Penas Douradas**.

### 1.3. Harness 3: Sandbox Visual do Rig Mestre Spine 2D (`tools/spine-sandbox`)
Ambiente isolado em Vite + PixiJS v8 para testar artes e performance sem precisar logar no jogo:
- **Comando:** `pnpm --filter @beakbreaker/spine-sandbox run dev`
- **Funcionalidades:**
  - Permite misturar em tempo real qualquer combinação das 6 peças (`tronco`, `cabeca`, `crista`, `asa_frente`, `cauda`, `canelas`) para inspecionar visualmente os Híbridos de 35% e as 6 Mutações Secretas.
  - **Stress Test 9v9 (2 GB RAM Gate):** Coloca 18 galos animados simultaneamente na tela disparando Especiais e mede FPS, Draw Calls (`< 25 draw calls`) e consumo de VRAM (`< 120 MB`).

---

## 2. Configuração Nativa do Google Antigravity (`.agents/` & `mcp_config.json`)

### 2.1. Servidores MCP Recomendados (`mcp_config.json` na raiz)
Conecte o Antigravity diretamente às ferramentas do projeto para que o agente inspecione bancos, execute testes e processe assets sem sair do IDE:

```json
{
  "mcpServers": {
    "postgres-beakbreaker": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://dev:dev@localhost:5432/beakbreaker"]
    },
    "git-github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"]
    },
    "playwright-e2e": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"]
    }
  }
}
```

### 2.2. Regras de Diretório (`.agents/rules/*.md`)
O Antigravity escaneia arquivos `.md` imediatos dentro de `.agents/rules/`. Crie estes 3 arquivos com YAML frontmatter:

1. **`.agents/rules/combat-determinism.md`**:
   ```yaml
   ---
   trigger: glob
   globs: ["packages/combat-core/**/*.ts"]
   description: Garante determinismo de ponto fixo no motor de combate.
   ---
   - Proibido usar Math.random() ou Date.now(). Use sempre SeededPRNG.
   - Toda divisão deve usar Math.floor().
   - Proibido importar qualquer pacote de UI ou DOM.
   ```

2. **`.agents/rules/component-size-cap.md`**:
   ```yaml
   ---
   trigger: always_on
   description: Impede criação de arquivos monolíticos acima de 200 linhas.
   ---
   - Nenhum arquivo .ts ou .vue pode exceder 200-250 linhas.
   - Extraia subcomponentes para packages/ui-cordel e lógica para composables use*.ts.
   ```

3. **`.agents/rules/eca-digital-legal.md`**:
   ```yaml
   ---
   trigger: always_on
   description: Garante conformidade com a Lei 9.605/98 e ECA Digital 18+ (Lei 15.211/2025).
   ---
   - Bloqueie imediatamente qualquer uso das palavras "rinha", "galista", "aposta" ou "espora".
   - Toda tela de sorteio deve exibir probabilidades explícitas e contador de Pity (X/80).
   ```

### 2.3. Skills Automatizadas do Agente (`.agents/skills/`)
Crie skills acionáveis por comando barra (`/`) no Antigravity:
- **`.agents/skills/run-balance-sim/SKILL.md`**: Acionada quando um galo ou fórmula de combate é alterado; roda `pnpm --filter @beakbreaker/balance-sim run verify-gate-1 --help` e analisa o relatório JSON de win rate.
- **`.agents/skills/create-rooster-spec/SKILL.md`**: Recebe o número e nome de um galo do GDD (ex.: `#18 Trovão do Sertão` ou um Sazonal) e gera automaticamente o schema em `packages/game-data`, o mapeamento de slots Spine e o teste unitário do Especial.

---

## 3. Estratégia de Versionamento no Git & GitHub (Branches, Commits e Gates)

### 3.1. Modelo de Branches (Trunk-Based com Release Gates por Etapa)
Não utilizamos branches de longa duração que geram conflitos gigantescos. O fluxo segue **Short-Lived Feature Branches** integradas via Pull Request:
- **`main`**: Código de produção estável (protegido; só recebe merge de `staging` após passar pelos Gates).
- **`staging` (ou `develop`)**: Branch de integração contínua das 7 Etapas do GDD.
- **Branches de Trabalho (curtas, máx. 1 a 2 dias):**
  - `feat/s1-combat-core` (Etapa 1: Fundação e Motor)
  - `feat/s2-arena-3v3` (Etapa 2: Arena, 6 Classes e 40 Galos)
  - `feat/s3-isometric-farm` (Etapa 3: Fazenda Viva 2.0 e Genética)
  - `feat/s4-sanctuary-raids` (Etapa 4: Árvore da Vida, Oficina +15, Saque)
  - `feat/s5-clan-colosso` (Etapa 5: Bando, Raid, Guerra de Territórios, Corrida)
  - `feat/s6-pix-store-eca18` (Etapa 6: Monetização, Loja Pix e ECA Digital)
  - `balance/season-01` (Ajustes de tabelas em `packages/game-data`)
  - `fix/revenge-lock-ttl` (Correções de bugs)

### 3.2. Padrão de Commits (Conventional Commits + Husky)
Todos os commits são validados por `commitlint` + `husky`:
- `feat(combat): implement corta-canto interrupt on 6-tick windup`
- `feat(genetics): add golden empowerment bar weight-8 legendary rule`
- `perf(canvas): pool xilo hit popups to prevent GC spikes on 2GB Android`
- `law(gacha): add 90-day pull history endpoint for ECA Digital art 20`

### 3.3. Pipeline de CI/CD no GitHub Actions (Os 7 Portões Técnicos)
Todo Pull Request no GitHub executa automaticamente 4 jobs em paralelo via `turbo`:
1. **`lint-and-legal-check`**: Roda ESLint, Biome/Prettier, verifica se algum arquivo `.ts`/`.vue` passou de 250 linhas e roda um script regex que bloqueia palavras proibidas pela Lei 9.605/98.
2. **`typecheck-and-unit`**: Roda `vue-tsc` e `vitest` em todos os pacotes.
3. **`determinism-gate`**: Roda o `tools/balance-sim` com 1.000 sementes no PR (e 10.000 sementes no merge para `staging`).
4. **`apk-bundle-size-gate`**: Compila o bundle de produção do cliente e falha o CI se o pacote exceder o orçamento de **40 MB**.
