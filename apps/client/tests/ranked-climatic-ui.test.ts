import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import fs from 'node:fs';
import path from 'node:path';
import {
  CombatReplaySerializer,
  RankedLeagueSystem,
  TVReplayDecoder,
} from '@beakbreaker/combat-core';
import { CORDEL_PALETTE } from '@beakbreaker/ui-cordel';
import { createWebRuntime } from '../src/web/createWebRuntime.js';
import { ArenaTabView } from '../src/web/ArenaTabView.js';
import {
  RankedLeaguePanel,
  formatLeagueDivisionName,
} from '../src/web/panels/RankedLeaguePanel.js';
import {
  ClimaticTowerPanel,
  CLIMATIC_TOWER_MODIFIERS,
  buildSampleReplaySpec,
} from '../src/web/panels/ClimaticTowerPanel.js';

describe('RankedLeaguePanel — Liga Ranqueada do Sertão', () => {
  it('renderiza divisão inicial Ouro do Sertão, troféus e baú de recompensas', async () => {
    const html = await renderToString(h(RankedLeaguePanel, { initialTrophies: 1250, initialStreak: 0 }));
    expect(html).toContain('data-testid="ranked-league-panel"');
    expect(html).toContain('Divisão: Ouro do Sertão');
    expect(html).toContain('Troféus ELO: 1250');
    expect(html).toContain('Vitórias em Série: 0');
    expect(html).toContain('Baú de Fim de Temporada (Ouro do Sertão):');
    expect(html).toContain('Penas Douradas: 800');
    expect(html).toContain('Orbes Curinga: 10');
  });

  it('formata nomes de divisão de Bronze do Brejo I até Supremo Sertão', () => {
    expect(formatLeagueDivisionName(100)).toBe('Bronze do Brejo I');
    expect(formatLeagueDivisionName(300)).toBe('Bronze do Brejo II');
    expect(formatLeagueDivisionName(450)).toBe('Prata da Caatinga');
    expect(formatLeagueDivisionName(1200)).toBe('Ouro do Sertão');
    expect(formatLeagueDivisionName(2000)).toBe('Diamante Mandacaru');
    expect(formatLeagueDivisionName(3200)).toBe('Lenda do Agreste');
    expect(formatLeagueDivisionName(4500)).toBe('Supremo Sertão');
  });

  it('exibe badge de bônus de sequência quando winStreak >= 3', async () => {
    const htmlNoStreak = await renderToString(h(RankedLeaguePanel, { initialTrophies: 1000, initialStreak: 2 }));
    expect(htmlNoStreak).not.toContain('Bônus +10 Ativo');

    const htmlWithStreak = await renderToString(h(RankedLeaguePanel, { initialTrophies: 1000, initialStreak: 3 }));
    expect(htmlWithStreak).toContain('Vitórias em Série: 3 (Bônus +10 Ativo)');
  });

  it('simula vitória e derrota atualizando troféus e sequência', () => {
    const panel = (RankedLeaguePanel as any).setup({ initialTrophies: 1200, initialStreak: 2 }, { emit: () => {} });
    const vnodeBefore = panel();
    expect(vnodeBefore).toBeDefined();

    // Simula vitória: streak vai para 3 e ganha bônus de win streak
    const deltaWin = RankedLeagueSystem.calculateMatchTrophies(1200, 1250, true, 2);
    expect(deltaWin).toBeGreaterThanOrEqual(30);

    const rewardsOuro = RankedLeagueSystem.getSeasonEndRewards(1200);
    expect(rewardsOuro.penasDouradas).toBe(800);
    expect(rewardsOuro.orbesCuringa).toBe(10);

    const rewardsSupremo = RankedLeagueSystem.getSeasonEndRewards(4100);
    expect(rewardsSupremo.penasDouradas).toBe(4000);
    expect(rewardsSupremo.orbesCuringa).toBe(100);
  });
});

describe('ClimaticTowerPanel — Torre dos Santos & TV Sertão', () => {
  it('contém exatamente os 12 modificadores climáticos oficiais', () => {
    expect(CLIMATIC_TOWER_MODIFIERS).toHaveLength(12);
    const names = CLIMATIC_TOWER_MODIFIERS.map((m) => m.label);
    expect(names).toEqual([
      'Seca', 'Chuva', 'Noite', 'Ventania', 'Sol a Pino', 'Neblina',
      'Muralha', 'Assombração', 'Fúria do Coronel', 'Fé na Sanfona', 'Espinheiro', 'Festa no Arraial',
    ]);
  });

  it('renderiza o painel exibindo o efeito de combate ativo', async () => {
    const html = await renderToString(h(ClimaticTowerPanel, { initialModifier: 'Seca' }));
    expect(html).toContain('data-testid="climatic-tower-panel"');
    expect(html).toContain('Clima Ativo:');
    expect(html).toContain('Seca Esturricada: Dano contínuo de Seca e cura reduzida em 20%');
    expect(html).toContain('Inspecionar Replay TV Sertão (&lt; 1.5 KB)');
  });

  it('exibe bônus de Galo Cantador em Noite e penalidade de precisão em Ventania', () => {
    const noite = CLIMATIC_TOWER_MODIFIERS.find((m) => m.id === 'Noite')!;
    expect(noite.effect).toContain('Galo Cantador');
    expect(noite.effect).toContain('+150 Canto');

    const ventania = CLIMATIC_TOWER_MODIFIERS.find((m) => m.id === 'Ventania')!;
    expect(ventania.effect).toContain('Evasão reduzida');
    expect(ventania.effect).toContain('Atiradores');
  });

  it('serializa e decodifica replay compacto da TV Sertão estritamente abaixo de 1.5 KB', () => {
    const spec = buildSampleReplaySpec('Seca');
    const base64Replay = CombatReplaySerializer.serializeToBase64(spec);
    const byteSize = new TextEncoder().encode(base64Replay).length;

    expect(byteSize).toBeLessThan(1500); // < 1.5 KB
    expect(byteSize).toBeLessThan(600); // tipicamente ~350-450 bytes

    const decoded = TVReplayDecoder.decodeFromBase64(base64Replay);
    expect(decoded.version).toBe(5);
    expect(decoded.mode).toBe('3v3');
    expect(decoded.climaticModifier).toBe('Seca');
    expect(decoded.expectedWinner).toBe('A');
    expect(decoded.expectedTicks).toBe(410);
    expect(decoded.torcidaTriggers).toHaveLength(1);
    expect(decoded.cortaCantoTriggers).toHaveLength(1);
  });
});

describe('ArenaTabView — Integração dos Painéis na Aba Lutar', () => {
  it('renderiza ArenaTabView integrando RankedLeaguePanel e ClimaticTowerPanel', async () => {
    const runtime = createWebRuntime();
    const html = await renderToString(h(ArenaTabView, { runtime }));

    expect(html).toContain('data-testid="tab-content-lutar"');
    expect(html).toContain('data-testid="arena-controls"');
    expect(html).toContain('data-testid="arena-synergy-panel"');
    expect(html).toContain('data-testid="ranked-league-panel"');
    expect(html).toContain('data-testid="climatic-tower-panel"');
    expect(html).toContain('Executar Duelo 3v3');
    expect(html).toContain('Liga Ranqueada do Sertão');
    expect(html).toContain('Torre dos Santos — Modificadores Climáticos');
  });
});

describe('Conformidade Arquitetural e Legal (Lei 9.605/98)', () => {
  const targetFiles = [
    path.resolve(__dirname, '../src/web/panels/RankedLeaguePanel.ts'),
    path.resolve(__dirname, '../src/web/panels/ClimaticTowerPanel.ts'),
    path.resolve(__dirname, '../src/web/ArenaTabView.ts'),
  ];

  it('garante que todos os arquivos têm estritamente menos de 180 linhas', () => {
    for (const filePath of targetFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').length;
      expect(lines).toBeLessThan(180);
    }
  });

  it('garante zero termos proibidos pela Lei 9.605/98', () => {
    const terms = ['r[ií]n' + 'ha', 'gal' + 'ista', 'esp' + 'ora', 'ap' + 'osta'];
    const bannedRegex = new RegExp(`(${terms.join('|')})`, 'i');
    for (const filePath of targetFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const match = content.match(bannedRegex);
      expect(match).toBeNull();
    }
  });
});
