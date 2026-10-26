---
name: run-balance-sim
description: >-
  Executa o simulador headless de determinismo (10.000 sementes) e auditoria de balanceamento
  (win rate cap <= 55%, duração mediana 40s-75s) do pacote @beakbreaker/balance-sim.
---

# Run Balance Simulator (`@beakbreaker/balance-sim`)

Acione esta skill sempre que alterar uma fórmula em `packages/combat-core` ou atributos de galos em `packages/game-data`.

## Passos
1. Execute o comando de verificação do Gate 1:
   ```bash
   pnpm --filter @beakbreaker/balance-sim run verify-gate-1
   ```
2. Verifique os 3 critérios obrigatórios no relatório de saída:
   - **Determinismo (10.000 Sementes):** 100% de igualdade bit a bit (SHA-256 idêntico entre execuções).
   - **Duração Mediana 3v3:** Entre `40s` e `75s`.
   - **Auditoria de Meta:** Nenhum galo acima de `55%` de taxa de vitória global e classe Suporte `>= 45%`.
