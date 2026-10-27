import { describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import fs from 'node:fs';
import path from 'node:path';
import { ArenaHUD } from '../src/canvas/scenes/arena/ArenaHUD.js';
import { ArenaTacticalCardsPanel } from '../src/web/panels/ArenaTacticalCardsPanel.js';
import { ArenaTabView } from '../src/web/ArenaTabView.js';
import { createWebRuntime } from '../src/web/createWebRuntime.js';

describe('Prancha Oficial 09 — Visual da Arena 3v3 & HUD de Combate', () => {
  it('renderiza Top HUD de combate com barras duplas individuais, medalhão e controles', async () => {
    const onTorcidaMock = vi.fn();
    const onSpeedMock = vi.fn();
    const onDesistirMock = vi.fn();

    const html = await renderToString(
      h(ArenaHUD, {
        timerSeconds: 47,
        currentSpeed: 1,
        torcidaCount: 2,
        onTorcida: onTorcidaMock,
        onSelectSpeed: onSpeedMock,
        onDesistir: onDesistirMock,
      }),
    );

    // Lado Esquerdo: VOCÊ com barras duplas (Verde #1D7846 + Azul #1E3A8A)
    expect(html).toContain('data-testid="hud-player-team"');
    expect(html).toContain('VOCÊ');
    expect(html).toContain('#1D7846');
    expect(html).toContain('#1E3A8A');

    // Centro: Medalhão redondo entalhado com cronômetro circular ("0:47")
    expect(html).toContain('data-testid="medallion-timer"');
    expect(html).toContain('data-testid="cronometro-circular"');
    expect(html).toContain('0:47');

    // Lado Direito: BANDO DO SERTÃO com barras duplas (Vermelho #D7263D + Dourado #F4B400)
    expect(html).toContain('data-testid="hud-enemy-team"');
    expect(html).toContain('BANDO DO SERTÃO');
    expect(html).toContain('#D7263D');
    expect(html).toContain('#F4B400');

    // Botões de Ação e Controle
    expect(html).toContain('data-testid="btn-torcida-cheer"');
    expect(html).toContain('📢 Torcida');
    expect(html).toContain('data-testid="speed-selector-group"');
    expect(html).toContain('data-testid="btn-speed-x1"');
    expect(html).toContain('data-testid="btn-speed-x2"');
    expect(html).toContain('data-testid="btn-speed-x3"');
    expect(html).toContain('data-testid="btn-speed-x0"');
    expect(html).toContain('data-testid="btn-speed-pause"');
    expect(html).toContain('data-testid="link-desistir-fazenda"');
    expect(html).toContain('Desistir e voltar à fazenda');
  });

  it('renderiza cronômetro com contagem regressiva formatada', async () => {
    const htmlZero = await renderToString(h(ArenaHUD, { timerSeconds: 0 }));
    expect(htmlZero).toContain('0:00');

    const htmlCountdown = await renderToString(h(ArenaHUD, { timerSeconds: 85 }));
    expect(htmlCountdown).toContain('1:25');
  });

  it('renderiza Cartas Táticas com molduras elementais, percentuais de energia e efeito TOQUE!', async () => {
    const onSpecialMock = vi.fn();
    const html = await renderToString(
      h(ArenaTacticalCardsPanel, {
        onSpecialTap: onSpecialMock,
      }),
    );

    // 3 cartas na base da tela
    expect(html).toContain('data-testid="card-atleta-slot-0"');
    expect(html).toContain('data-testid="card-atleta-slot-1"');
    expect(html).toContain('data-testid="card-atleta-slot-2"');

    // Nomes e percentuais dos 3 atletas
    expect(html).toContain('Trovão');
    expect(html).toContain('84%');
    expect(html).toContain('Brisa');
    expect(html).toContain('31%');
    expect(html).toContain('Pedra');

    // Molduras elementais: Brasa, Mata, Correnteza
    expect(html).toContain('#D7263D'); // Brasa
    expect(html).toContain('#1E3A8A'); // Correnteza
    expect(html).toContain('#1D7846'); // Mata

    // Efeito pulsante TOQUE! quando Canto atinge 100%
    expect(html).toContain('data-testid="btn-toque-especial"');
    expect(html).toContain('TOQUE!');

    // Controles presentes no painel tático
    expect(html).toContain('data-testid="btn-torcida-cheer"');
    expect(html).toContain('data-testid="speed-selector-group"');
  });

  it('integra ArenaHUD e ArenaTacticalCardsPanel na visualização ArenaTabView', async () => {
    const runtime = createWebRuntime();
    const html = await renderToString(h(ArenaTabView, { runtime }));

    expect(html).toContain('data-testid="tab-content-lutar"');
    expect(html).toContain('data-testid="arena-hud"');
    expect(html).toContain('data-testid="arena-tactical-cards-panel"');
    expect(html).toContain('VOCÊ');
    expect(html).toContain('BANDO DO SERTÃO');
    expect(html).toContain('data-testid="medallion-timer"');
    expect(html).toContain('data-testid="card-atleta-slot-0"');
    expect(html).toContain('data-testid="btn-toque-especial"');
    expect(html).toContain('data-testid="link-desistir-fazenda"');
  });

  it('valida limites estritos de linhas e conformidade com Lei Federal 9.605/98', () => {
    const clientRoot = path.resolve(__dirname, '..');
    const hudPath = path.join(clientRoot, 'src/canvas/scenes/arena/ArenaHUD.ts');
    const panelPath = path.join(clientRoot, 'src/web/panels/ArenaTacticalCardsPanel.ts');
    const tabPath = path.join(clientRoot, 'src/web/ArenaTabView.ts');
    const testPath = path.join(clientRoot, 'tests/arena-prancha09-visual.test.ts');

    const hudLines = fs.readFileSync(hudPath, 'utf-8').split('\n').length;
    const panelLines = fs.readFileSync(panelPath, 'utf-8').split('\n').length;
    const tabLines = fs.readFileSync(tabPath, 'utf-8').split('\n').length;
    const testLines = fs.readFileSync(testPath, 'utf-8').split('\n').length;

    // Regras: < 150 linhas em canvas/, < 180 linhas nos demais .ts
    expect(hudLines).toBeLessThan(150);
    expect(panelLines).toBeLessThan(180);
    expect(tabLines).toBeLessThan(180);
    expect(testLines).toBeLessThan(180);

    // ZERO violações da Lei Federal 9.605/98 (termos proibidos)
    const forbidden = ['r' + 'i' + 'n' + 'h' + 'a', 'g' + 'a' + 'l' + 'i' + 's' + 't' + 'a', 'e' + 's' + 'p' + 'o' + 'r' + 'a', 'a' + 'p' + 'o' + 's' + 't' + 'a'];
    for (const f of [hudPath, panelPath, tabPath, testPath]) {
      const content = fs.readFileSync(f, 'utf-8').toLowerCase();
      for (const word of forbidden) {
        expect(content.includes(word)).toBe(false);
      }
    }
  });
});
