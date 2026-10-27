import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createPinia, setActivePinia } from 'pinia';
import { FarmMilharalBanner, formatMilharalCorn } from '../src/web/panels/FarmMilharalBanner.js';
import { FarmTabView } from '../src/web/FarmTabView.js';
import { BeakBreakerWebApp } from '../src/web/BeakBreakerWebApp.js';
import { createWebRuntime } from '../src/web/createWebRuntime.js';
import { cordelAudio } from '../src/services/AudioService.js';

function findVNode(vnode: any, testId: string): any {
  if (!vnode) return null;
  if (Array.isArray(vnode)) {
    for (const item of vnode) {
      const found = findVNode(item, testId);
      if (found) return found;
    }
    return null;
  }
  if (vnode.props?.['data-testid'] === testId) return vnode;
  if (Array.isArray(vnode.children)) {
    for (const child of vnode.children) {
      const found = findVNode(child, testId);
      if (found) return found;
    }
  } else if (vnode.children && typeof vnode.children === 'object') {
    for (const key of Object.keys(vnode.children)) {
      const slot = vnode.children[key];
      const found = findVNode(typeof slot === 'function' ? slot() : slot, testId);
      if (found) return found;
    }
  }
  return null;
}

describe('Prancha Oficial 04 — Fazenda Viva 2.0 Visual & FarmMilharalBanner', () => {
  it('formata valores de milho respeitando o padrão sertanejo 1.200', () => {
    expect(formatMilharalCorn(1200)).toBe('1.200');
    expect(formatMilharalCorn(2500)).toBe('2.500');
  });

  it('renderiza FarmMilharalBanner com todos os elementos da Prancha 04', async () => {
    const html = await renderToString(h(FarmMilharalBanner));
    expect(html).toContain('data-testid="farm-milharal-banner"');
    expect(html).toContain('data-testid="card-colheita-pronta"');
    expect(html).toContain('Colheita pronta (+1.200 milho no Milharal)');
    expect(html).toContain('data-testid="badge-milharal-pronto"');
    expect(html).toContain('PRONTO!');
    expect(html).toContain('data-testid="btn-colher-milho-pronto"');
    expect(html).toContain('Colher');
    expect(html).toContain('data-testid="sidebar-btn-missoes"');
    expect(html).toContain('Missões');
    expect(html).toContain('data-testid="sidebar-btn-loja"');
    expect(html).toContain('Loja');
    expect(html).toContain('data-testid="sidebar-btn-cla"');
    expect(html).toContain('Clã');
    expect(html).toContain('data-testid="badge-trainer-level"');
    expect(html).toContain('Nível 12');
    expect(html).toContain('data-testid="badge-recurso-milho"');
    expect(html).toContain('data-testid="badge-recurso-penas"');
    expect(html).toContain('data-testid="badge-recurso-coroas"');
  });

  it('permite customizar recursos e nível do treinador via props', async () => {
    const html = await renderToString(h(FarmMilharalBanner, {
      trainerLevel: 15, cornAmount: 3400, goldFeathers: 990, crowns: 150, harvestReadyCorn: 2500,
    }));
    expect(html).toContain('Nível 15');
    expect(html).toContain('Colheita pronta (+2.500 milho no Milharal)');
    expect(html).toContain('990');
    expect(html).toContain('150');
  });

  it('aciona colheita com 1 toque e dispara som de triângulo', () => {
    cordelAudio.setMuted(false);
    cordelAudio.clearHistory();
    let harvested = false;
    const renderFn = FarmMilharalBanner.setup?.({ onHarvest: () => { harvested = true; } }, { attrs: {}, slots: {}, emit: () => {}, expose: () => {} });
    const vnode = (renderFn as () => any)();
    findVNode(vnode, 'btn-colher-milho-pronto')?.props.onClick();
    expect(harvested).toBe(true);
    expect(cordelAudio.getSfxCountByTrack('sfx_triangulo_reward')).toBe(1);
  });

  it('aciona colheita padrão pelo runtime quando onHarvest não for passado', () => {
    const runtime = createWebRuntime();
    cordelAudio.setMuted(false);
    cordelAudio.clearHistory();
    const renderFn = FarmMilharalBanner.setup?.({ runtime }, { attrs: {}, slots: {}, emit: () => {}, expose: () => {} });
    const vnode = (renderFn as () => any)();
    findVNode(vnode, 'btn-colher-milho-pronto')?.props.onClick();
    expect(cordelAudio.getSfxCountByTrack('sfx_triangulo_reward')).toBe(1);
  });

  it('dispara navegação e áudio nos atalhos da barra lateral', () => {
    cordelAudio.setMuted(false);
    cordelAudio.clearHistory();
    const dests: string[] = [];
    const renderFn = FarmMilharalBanner.setup?.({ onNavigate: (d) => dests.push(d) }, { attrs: {}, slots: {}, emit: () => {}, expose: () => {} });
    const vnode = (renderFn as () => any)();
    findVNode(vnode, 'sidebar-btn-missoes')?.props.onClick();
    findVNode(vnode, 'sidebar-btn-loja')?.props.onClick();
    findVNode(vnode, 'sidebar-btn-cla')?.props.onClick();
    expect(dests).toEqual(['missoes', 'loja', 'cla']);
    expect(cordelAudio.getSfxCountByTrack('sfx_zabumba_tab')).toBe(3);
  });

  it('integra FarmMilharalBanner no topo de FarmTabView e aciona colheita com som de triângulo', async () => {
    const runtime = createWebRuntime();
    cordelAudio.setMuted(false);
    cordelAudio.clearHistory();
    let addedMilho = 0;
    const html = await renderToString(h(FarmTabView, { runtime, onAddMilho: (amt: number) => { addedMilho += amt; }, onUpgradeSede: () => {} }));
    expect(html).toContain('data-testid="farm-milharal-banner"');
    expect(html).toContain('data-testid="btn-colher-milho-pronto"');
    expect(html).toContain('data-testid="badge-milharal-pronto"');
    expect(html).toContain('data-testid="farm-backdrop-hero"');
    expect(html).toContain('/assets/pranchas/fazenda-viva-backdrop.webp');
    expect(html).toContain('data-testid="farm-backdrop-overlay"');
    expect(html).toContain('data-testid="poleiros-section"');
    expect(html).toContain('data-testid="perch-occupancy"');
    expect(html).toContain('data-testid="perch-vault-status"');

    const renderFn = FarmTabView.setup?.({ runtime, onAddMilho: (amt: number) => { addedMilho += amt; }, onUpgradeSede: () => {} }, { attrs: {}, slots: {}, emit: () => {}, expose: () => {} });
    const vnode = (renderFn as () => any)();
    findVNode(vnode, 'farm-milharal-banner')?.props.onHarvest();
    expect(addedMilho).toBeGreaterThan(0);
    expect(cordelAudio.getSfxCountByTrack('sfx_triangulo_reward')).toBeGreaterThanOrEqual(1);
  });

  it('renderiza BeakBreakerWebApp com moldura mobile, Top HUD e 5 abas na bottom nav', async () => {
    setActivePinia(createPinia());
    const html = await renderToString(h(BeakBreakerWebApp));
    expect(html).toContain('data-testid="beakbreaker-web-shell"');
    expect(html).toContain('data-testid="player-leather-hat-avatar"');
    expect(html).toContain('🤠');
    expect(html).toContain('Nível 12');
    expect(html).toContain('data-testid="button-audio-toggle"');
    expect(html).toContain('data-testid="cordel-bottom-nav"');
    expect(html).toContain('data-testid="nav-tab-Fazenda"');
    expect(html).toContain('🌾');
    expect(html).toContain('⚔️');
    expect(html).toContain('🐓');
    expect(html).toContain('🏰');
    expect(html).toContain('🏪');
  });

  it('atende rigorosamente às regras de linhas (< 180) e Lei 9.605/98', () => {
    const bannerPath = resolve(__dirname, '../src/web/panels/FarmMilharalBanner.ts');
    const farmTabPath = resolve(__dirname, '../src/web/FarmTabView.ts');
    const shellPath = resolve(__dirname, '../src/web/BeakBreakerWebApp.ts');
    const thisTestPath = resolve(__dirname, './farm-prancha04-visual.test.ts');
    expect(readFileSync(bannerPath, 'utf-8').split('\n').length).toBeLessThan(180);
    expect(readFileSync(farmTabPath, 'utf-8').split('\n').length).toBeLessThan(180);
    expect(readFileSync(shellPath, 'utf-8').split('\n').length).toBeLessThan(180);
    expect(readFileSync(thisTestPath, 'utf-8').split('\n').length).toBeLessThan(180);

    const bannerContent = readFileSync(bannerPath, 'utf-8').toLowerCase();
    const farmTabContent = readFileSync(farmTabPath, 'utf-8').toLowerCase();
    const shellContent = readFileSync(shellPath, 'utf-8').toLowerCase();
    const forbidden = ['r' + 'inha', 'r' + 'inhadeiro', 'gal' + 'ista', 'esp' + 'ora', 'ap' + 'osta'];
    for (const term of forbidden) {
      expect(bannerContent.includes(term)).toBe(false);
      expect(farmTabContent.includes(term)).toBe(false);
      expect(shellContent.includes(term)).toBe(false);
    }
  });
});
