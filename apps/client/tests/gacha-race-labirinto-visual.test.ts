import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import path from 'node:path';
import fs from 'node:fs';
import { createWebRuntime } from '../src/web/createWebRuntime.js';
import { ChocadeiraBannerPanel } from '../src/web/panels/ChocadeiraBannerPanel.js';
import { HeroRaceTrackPanel } from '../src/web/panels/HeroRaceTrackPanel.js';
import { LabirintoRodaVisualPanel } from '../src/web/panels/LabirintoRodaVisualPanel.js';
import { StoreTabView } from '../src/web/StoreTabView.js';
import { ClanTabView } from '../src/web/ClanTabView.js';
import { cordelAudio } from '../src/services/AudioService.js';

function findVNode(node: any, testId: string): any {
  if (!node) return null;
  if (Array.isArray(node)) {
    for (const item of node) { const r = findVNode(item, testId); if (r) return r; }
    return null;
  }
  if (typeof node !== 'object') return null;
  if (node.props?.['data-testid'] === testId) return node;
  if (Array.isArray(node.children)) {
    for (const c of node.children) { const r = findVNode(c, testId); if (r) return r; }
  } else if (node.children && typeof node.children === 'object') {
    for (const k of Object.keys(node.children)) {
      const val = typeof node.children[k] === 'function' ? node.children[k]() : node.children[k];
      const r = findVNode(val, testId);
      if (r) return r;
    }
  }
  return null;
}

describe('Prancha 20 & 21: Chocadeira, Corrida de Heróis & Labirinto de São João', () => {
  it('Prancha 20: ChocadeiraBannerPanel renderiza ninho mítico, pity 57/80 e chances transparentes', async () => {
    cordelAudio.clearHistory();
    const pulls: number[] = [];
    const html = await renderToString(h(ChocadeiraBannerPanel, {
      currentPity: 57, onPullChocadeira: (n: number) => pulls.push(n),
    }));
    expect(html).toContain('data-testid="chocadeira-banner-panel"');
    expect(html).toContain('Banner Sagrado: Trovão do Sertão');
    expect(html).toContain('data-testid="chocadeira-egg-nest"');
    expect(html).toContain('Ninho Mítico com Ovo Mítico &amp; Aura Mística em Xilogravura');
    expect(html).toContain('57/80 (Garantido no 80)');
    expect(html).toContain('Lendário 2%');
    expect(html).toContain('Épico 10%');
    expect(html).toContain('Raro 33%');
    expect(html).toContain('Comum 55%');
    expect(html).toContain('CHOCAR 1 (100 Penas)');
    expect(html).toContain('CHOCAR 10 (900 Penas)');

    const render = (ChocadeiraBannerPanel as any).setup({
      currentPity: 57, onPullChocadeira: (n: number) => pulls.push(n),
    }, { emit: () => {} });
    let vnode = render();
    await findVNode(vnode, 'btn-chocar-1')?.props?.onClick();
    expect(pulls).toContain(1);
    expect(cordelAudio.getSfxCountByTrack('sfx_triangulo_reward')).toBeGreaterThanOrEqual(1);

    vnode = render();
    await findVNode(vnode, 'btn-chocar-10')?.props?.onClick();
    expect(pulls).toContain(10);
  });

  it('Prancha 20: ChocadeiraBannerPanel atinge pity 80 e toca canto supremo do lendário', async () => {
    cordelAudio.clearHistory();
    const render = (ChocadeiraBannerPanel as any).setup({ currentPity: 79 }, { emit: () => {} });
    const vnode = render();
    await findVNode(vnode, 'btn-chocar-1')?.props?.onClick();
    expect(cordelAudio.getSfxCountByTrack('sfx_galo_supreme')).toBe(1);
  });

  it('Prancha 20: HeroRaceTrackPanel renderiza Volta 7/18, pista de terra e avança com dado', async () => {
    cordelAudio.clearHistory();
    const runtime = createWebRuntime();
    const html = await renderToString(h(HeroRaceTrackPanel, { runtime, initialLap: 7 }));
    expect(html).toContain('data-testid="hero-race-track-panel"');
    expect(html).toContain('Corrida de Heróis: Pista Sertaneja');
    expect(html).toContain('Volta 7/18');
    expect(html).toContain('data-testid="race-circuit-view"');
    expect(html).toContain('data-testid="race-runner-rooster"');
    expect(html).toContain('AVANÇAR COM DADO 🎲');
    expect(html).toContain('BAÚ VIP DO SERTÃO');

    const render = (HeroRaceTrackPanel as any).setup({ runtime, initialLap: 7 }, { emit: () => {} });
    const vnode = render();
    await findVNode(vnode, 'btn-roll-dice-race')?.props?.onClick();
    expect(cordelAudio.getSfxCountByTrack('sfx_berimbau_twang')).toBe(1);

    await findVNode(vnode, 'btn-claim-vip-chest')?.props?.onClick();
    expect(cordelAudio.getSfxCountByTrack('sfx_triangulo_reward')).toBe(1);
  });

  it('Prancha 21: LabirintoRodaVisualPanel renderiza grade de pedras, fogueiras e roda 8 fatias', async () => {
    cordelAudio.clearHistory();
    const html = await renderToString(h(LabirintoRodaVisualPanel));
    expect(html).toContain('data-testid="labirinto-roda-visual-panel"');
    expect(html).toContain('data-testid="stone-grid-labyrinth"');
    expect(html).toContain('Fogueira de São João acesa');
    expect(html).toContain('JOGAR LABIRINTO');
    expect(html).toContain('MOVER PASSO 🧭');
    expect(html).toContain('data-testid="wheel-slices-grid"');
    expect(html).toContain('Bilheteria: 3 Ingressos');
    expect(html).toContain('GIRAR RODA (1 Ingresso)');
    expect(html).toContain('data-testid="recent-wheel-prizes"');

    const render = (LabirintoRodaVisualPanel as any).setup({}, { emit: () => {} });
    const vnode = render();
    await findVNode(vnode, 'btn-jogar-labirinto')?.props?.onClick();
    expect(cordelAudio.getSfxCountByTrack('sfx_zabumba_tab')).toBeGreaterThanOrEqual(1);

    await findVNode(vnode, 'btn-mover-passo')?.props?.onClick();
    expect(cordelAudio.getTotalSfxPlayed()).toBeGreaterThanOrEqual(2);

    await findVNode(vnode, 'btn-girar-roda')?.props?.onClick();
    expect(cordelAudio.getSfxCountByTrack('sfx_sanfona_victory')).toBe(1);
  });

  it('Integração: StoreTabView alterna abas para Chocadeira e Corrida de Heróis', async () => {
    cordelAudio.clearHistory();
    const runtime = createWebRuntime();
    const render = (StoreTabView as any).setup({
      runtime, currentPity: 57, onPullChocadeira: () => {}, onGrantCoroas: () => {},
    }, { emit: () => {} });

    let vnode = render();
    expect(findVNode(vnode, 'chocadeira-panel')).not.toBeNull();

    await findVNode(vnode, 'tab-btn-chocadeira')?.props?.onClick();
    vnode = render();
    expect(findVNode(vnode, 'chocadeira-banner-panel')).not.toBeNull();

    await findVNode(vnode, 'tab-btn-corrida')?.props?.onClick();
    vnode = render();
    expect(findVNode(vnode, 'hero-race-track-panel')).not.toBeNull();
    expect(cordelAudio.getSfxCountByTrack('sfx_zabumba_tab')).toBeGreaterThanOrEqual(2);
  });

  it('Integração: ClanTabView renderiza LabirintoRodaVisualPanel', async () => {
    const runtime = createWebRuntime();
    const html = await renderToString(h(ClanTabView, { runtime }));
    expect(html).toContain('data-testid="labirinto-roda-visual-panel"');
  });

  it('Conformidade Lei 9.605/98 e Limite de Linhas (< 180 linhas por arquivo)', () => {
    const files = [
      'apps/client/src/web/panels/ChocadeiraBannerPanel.ts',
      'apps/client/src/web/panels/HeroRaceTrackPanel.ts',
      'apps/client/src/web/panels/LabirintoRodaVisualPanel.ts',
      'apps/client/src/web/StoreTabView.ts',
      'apps/client/src/web/ClanTabView.ts',
      'apps/client/tests/gacha-race-labirinto-visual.test.ts',
    ];
    const root = path.resolve(__dirname, '../../..');
    const terms = ['r' + 'inha', 'gal' + 'ista', 'ap' + 'osta', 'esp' + 'ora', 'r' + 'inhadeiro'];
    const banned = new RegExp(`\\b(${terms.join('|')})\\b`, 'i');

    for (const f of files) {
      const full = path.join(root, f);
      const text = fs.readFileSync(full, 'utf8');
      const lines = text.split('\n').length;
      expect(lines).toBeLessThanOrEqual(180);
      expect(text.match(banned)).toBeNull();
    }
  });
});
