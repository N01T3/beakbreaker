import { describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import fs from 'node:fs';
import path from 'node:path';
import { ArvoreDaVidaOrbesPanel } from '../src/web/panels/ArvoreDaVidaOrbesPanel.js';
import { RoostersTabView } from '../src/web/RoostersTabView.js';
import { createWebRuntime } from '../src/web/createWebRuntime.js';
import { cordelAudio } from '../src/services/AudioService.js';

describe('Prancha 11 — Árvore da Vida, Reciclagem de Repetidos & Orbes Curinga', () => {
  it('renderiza o painel com regras do GDD, seletor de repetidos e banner', async () => {
    const html = await renderToString(h(ArvoreDaVidaOrbesPanel));
    expect(html).toContain('data-testid="arvore-da-vida-orbes-panel"');
    expect(html).toContain('data-testid="happy-hour-banner"');
    expect(html).toContain('data-testid="arvore-reciclagem-card"');
    expect(html).toContain('data-testid="convocacao-mistica-card"');
    expect(html).toContain('reciclar galo repetido no NG 1 entrega 40 Orbes');
    expect(html).toContain('alimentar com Milho até NG 30 entrega 100 Orbes');
    expect(html).toContain('data-testid="btn-recycle-ng1"');
    expect(html).toContain('data-testid="btn-recycle-ng30"');
    expect(html).toContain('data-testid="btn-summon-rooster"');
    expect(html).toContain('data-testid="toggle-happy-hour"');
  });

  it('recicla galos repetidos no NG 1 (+40) e NG 30 (+100) com áudio e atualização de saldo', () => {
    cordelAudio.clearHistory();
    const harvestSpy = vi.spyOn(cordelAudio, 'playHarvestMilho');
    let recycledPayload: any = null;
    const runtime = createWebRuntime();
    const props = {
      runtime,
      initialOrbs: 0,
      initialWildcards: 0,
      onRecycled: (info: any) => { recycledPayload = info; },
    };
    const instance = (ArvoreDaVidaOrbesPanel.setup as any)(props, { emit: () => {} });
    let vnode = instance();

    // Reciclar NG 1 (+40 Orbes)
    const btnNg1 = vnode.children[2].children[3].children[0];
    btnNg1.props.onClick();
    vnode = instance();

    expect(harvestSpy).toHaveBeenCalledTimes(1);
    expect(recycledPayload).toEqual({ roosterId: 'rooster_01', ng: 1, orbs: 40 });
    expect(vnode.children[3].children[1].children).toContain('Saldo: 40 Orbes');

    // Reciclar NG 30 (+100 Orbes)
    const btnNg30 = vnode.children[2].children[3].children[1];
    btnNg30.props.onClick();
    vnode = instance();

    expect(harvestSpy).toHaveBeenCalledTimes(2);
    expect(recycledPayload).toEqual({ roosterId: 'rooster_01', ng: 30, orbs: 100 });
    expect(vnode.children[3].children[1].children).toContain('Saldo: 140 Orbes');
    harvestSpy.mockRestore();
  });

  it('convoca galo inédito com 100 orbes, debita saldo e dispara canto supremo', () => {
    cordelAudio.clearHistory();
    const cantoSpy = vi.spyOn(cordelAudio, 'playGaloCantoSupreme');
    let summonedRooster: string | null = null;
    const props = {
      initialOrbs: 120,
      initialWildcards: 0,
      onSummoned: (name: string) => { summonedRooster = name; },
    };
    const instance = (ArvoreDaVidaOrbesPanel.setup as any)(props, { emit: () => {} });
    let vnode = instance();

    const btnSummon = vnode.children[3].children[3];
    expect(btnSummon.props.disabled).toBe(false);
    btnSummon.props.onClick();
    vnode = instance();

    expect(cantoSpy).toHaveBeenCalledTimes(1);
    expect(summonedRooster).toContain('Trovão do Sertão');
    expect(vnode.children[3].children[1].children).toContain('Saldo: 20 Orbes');
    expect(vnode.children[3].children[4].children).toContain('Convocação Mística Concluída');
    cantoSpy.mockRestore();
  });

  it('valida regras de Happy Hour de Orbes Curinga (80/20 vs 100% Curinga)', () => {
    cordelAudio.clearHistory();
    const sanfonaSpy = vi.spyOn(cordelAudio, 'playSanfonaVictory');
    const runtime = createWebRuntime();
    const props = {
      runtime,
      initialOrbs: 10,
      initialWildcards: 90,
    };
    const instance = (ArvoreDaVidaOrbesPanel.setup as any)(props, { emit: () => {} });
    let vnode = instance();

    // Sem Happy Hour: 10 específicos e 90 curingas não atingem o mínimo de 80% do próprio galo
    expect(vnode.children[3].children[3].props.disabled).toBe(true);

    // Ativa a Happy Hour (Quarta e Sexta)
    const btnToggle = vnode.children[1].children[0].children[1];
    btnToggle.props.onClick();
    vnode = instance();

    expect(sanfonaSpy).toHaveBeenCalledTimes(1);
    expect(vnode.children[1].children[0].children[0].children).toContain('100% Curingas Liberado');
    expect(vnode.children[3].children[3].props.disabled).toBe(false);

    // Realiza a convocação com 100% de flexibilidade curinga
    vnode.children[3].children[3].props.onClick();
    vnode = instance();

    expect(vnode.children[3].children[1].children).toContain('Saldo: 0 Orbes da Ave | 0 Orbes Curinga');
    sanfonaSpy.mockRestore();
  });

  it('integra sub-aba Árvore da Vida (Orbes) em RoostersTabView', async () => {
    const runtime = createWebRuntime();
    const instance = (RoostersTabView.setup as any)({ runtime }, { emit: () => {} });
    let frameVnode = instance();
    let slotChildren = frameVnode.children.default();
    let tabContent = slotChildren[0];

    // Verifica presença da subaba e clica nela
    const btnArvore = tabContent.children[0].children[3];
    expect(btnArvore.props['data-testid']).toBe('subtab-arvore');
    expect(btnArvore.children).toBe('Árvore da Vida (Orbes)');
    btnArvore.props.onClick();

    frameVnode = instance();
    slotChildren = frameVnode.children.default();
    tabContent = slotChildren[0];

    const htmlArvore = await renderToString(tabContent);
    expect(htmlArvore).toContain('data-testid="arvore-da-vida-orbes-panel"');
    expect(htmlArvore).toContain('Árvore da Vida — Reciclagem &amp; Orbes Curinga (Prancha 11)');
  });

  it('garante conformidade com Lei 9.605/98 e limite de linhas', () => {
    const terms = ['r' + 'inha', 'gal' + 'ista', 'ap' + 'osta', 'esp' + 'ora', 'r' + 'inhadeiro'];
    const forbidden = new RegExp(terms.join('|'), 'i');

    const panelPath = path.resolve(__dirname, '../src/web/panels/ArvoreDaVidaOrbesPanel.ts');
    const panelContent = fs.readFileSync(panelPath, 'utf8');
    expect(forbidden.test(panelContent)).toBe(false);
    expect(panelContent.split('\n').length).toBeLessThanOrEqual(180);

    const testPath = path.resolve(__dirname, './arvore-da-vida-orbes.test.ts');
    const testContent = fs.readFileSync(testPath, 'utf8');
    expect(testContent.split('\n').length).toBeLessThanOrEqual(180);
  });
});
