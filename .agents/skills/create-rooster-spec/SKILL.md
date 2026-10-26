---
name: create-rooster-spec
description: >-
  Gera o schema em packages/game-data, o mapeamento de 6 slots do Rig Mestre Spine 2D
  e o teste unitário do Especial para um galo do GDD v5.0.
---

# Create Rooster Spec

Use esta skill para adicionar ou atualizar fichas de galos (#01 a #40, 6 Primordiais ou 39 Sazonais).

## Passos
1. Valide o elemento primário/secundário, classe, raridade, atributos base e habilidade Especial no schema Zod de `packages/game-data`.
2. Configure o mapeamento dos 6 slots visuais (`tronco`, `cabeca`, `crista`, `asa_frente`, `cauda`, `canelas`) compatível com `RoosterSpineAssembler.ts`.
3. Crie ou atualize o teste unitário validando o disparo do Especial em `packages/combat-core`.
