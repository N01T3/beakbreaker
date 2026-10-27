# 🐓 BeakBreaker v5.0 — O Sertão dos Galos Lendários

> **Game 3v3 de Atletas de Terreiro, Genética Ancestral e Fazenda Viva na Estética Cordel Pop**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-ef4444.svg)](https://turbo.build/)
[![Vitest](https://img.shields.io/badge/Vitest-100%25_Passing-brightgreen.svg)](https://vitest.dev/)
[![Compliance](https://img.shields.io/badge/Lei_9.605%2F98-100%25_Conforme-success.svg)](https://www.planalto.gov.br/)

---

## 🌵 Visão Geral do Jogo

**BeakBreaker** é uma homenagem lírica e lúdica à cultura do Sertão Nordestino. O jogador assume o papel de um treinador de atletas de terreiro, construindo sua Fazenda Viva, cultivando milho, combinando linhagens no Santuário Genético e competindo em festivais de arena 3v3 com ritmo, rimas de cordel e trilha instrumental procedural.

> [!IMPORTANT]
> **Conformidade Legal & Proteção Animal (Lei Federal 9.605/98)**:
> O projeto adota temática 100% esportiva, mágica e festiva, sem violência ou maus-tratos. Zero tolerância a termos ou alusões a práticas ilegais.

---

## 🏗️ Arquitetura do Monorepo

```
beakbreaker/
├── apps/
│   ├── client/       # PixiJS Canvas + Vue 3 Reactivity + WebAudio Synth + Capacitor
│   ├── server/       # Fastify + Drizzle ORM + WebSocket + HMAC Pix Gateway
│   └── web-store/    # Loja Web integrada e Checkout Seguro
├── packages/
│   ├── combat-core/  # Motor de batalha 20 ticks/s determinístico, sinergias e replay
│   ├── game-data/    # Catálogo de atletas, 6 capítulos de cordel, receitas e balanceamento
│   ├── genetics-engine/ # Ninhal, 24 receitas do santuário, orbes e árvores de herança
│   └── ui-cordel/    # Design System em xilogravura, tipografia e componentes táteis
└── tools/
    ├── balance-sim/  # Simulador de Monte Carlo para 10.000 duelos
    ├── economy-sim/  # Modelagem de inflação, milho e orbes
    └── spine-sandbox/# Visualizador e montador de rigs Spine 2D procedurais
```

---

## 🎨 Sistemas em Destaque (GDD v5.0)

1. **Arena 3v3 & Combate Tático**: Motor determinístico a 20 ticks/s, mecânica de Corta-Canto (6 ticks), 11 status de combate e sinergias elementais (Brasa, Mata, Correnteza, Vento, etc.).
2. **Fazenda Viva 2.0**: Sede 1 a 12, Milharal preguiçoso com colheitas acumulativas, ciclo dia/noite e defesas contra predadores (Gavião, Raposa, Teiú).
3. **Modo História em Sextilhas de Cordel**: 6 capítulos narrativos pela Estrada do Sertão com diálogos rimados (A-B-C-B-D-B) e chefes icônicos.
4. **Santuário Genético & Árvore da Vida**: 24 receitas de acasalamento ancestral e reciclagem de orbes curinga.
5. **Oficina Sertaneja +15**: 8 conjuntos de equipamentos em xilogravura com refino progressivo e proteção da Ferradura da Sorte.
6. **TV Sertão & Replay Player**: Transmissão simulada, bolão comunitário, emotes sonoros e linha do tempo interativa.
7. **Chocadeira Sagrada & Corrida de Heróis**: Sistema gacha com pity transparente 80/80 (ECA Digital) e tabuleiro de 18 voltas.

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js >= 20.x
- pnpm >= 9.x

### Instalação & Desenvolvimento
```bash
# Instalar dependências em todos os pacotes
pnpm install

# Iniciar ambiente de desenvolvimento
pnpm dev

# Executar a suíte de testes completa (Turborepo)
pnpm turbo run test

# Verificar tipos TypeScript
pnpm turbo run typecheck

# Validar conformidade legal e tamanho de componentes
node scripts/check-legal-and-size.mjs
```

---

## 📄 Licença

Distribuído sob a licença MIT. Consulte `LICENSE` para mais informações.
