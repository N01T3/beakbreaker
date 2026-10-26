---
name: audit-db-concurrency
description: >-
  Audita endpoints Fastify, transações Drizzle e locks Redis (Redlock) para garantir
  idempotência em tiros da Chocadeira, colheita de Poleiros, Saque/Revanche 72h e webhooks Pix.
---

# Audit DB & Redis Concurrency

Use esta skill ao implementar ou revisar módulos em `apps/server/src/modules/`.

## Checklist de Auditoria
1. **Idempotência de Recursos:** Toda mutação de saldo (Milho, Penas Douradas, Coroas, Orbes) deve ocorrer dentro de transação PostgreSQL + chave Redlock por jogador.
2. **Trava Anticonluio de Revanche (72h):** Verifique as 3 regras em `RevengeGuard.ts`:
   - `isRevenge = true` nunca gera contra-revanche.
   - Chave Redis `revenge:pair:{minId}:{maxId}` com TTL `259200s` (72h).
   - Bloqueio por coincidência de `lastIpHash` ou `deviceFingerprint`.
3. **Webhook Pix Idempotente:** Verifique chave única `txid` antes de creditar Coroas (+15% bônus).
