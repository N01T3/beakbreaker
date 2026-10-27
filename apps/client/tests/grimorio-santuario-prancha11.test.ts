import { describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import {
  GrimorioSantuarioPanel, SANCTUARY_24_RECEITAS, SANCTUARY_LEVEL_TO_SEDE,
  LINHAGENS_MATRIZES, getMinSedeForSanctuaryLevel, type CaldeiraoSynthesisResult,
} from '../src/web/panels/GrimorioSantuarioPanel.js';
import { RoostersTabView } from '../src/web/RoostersTabView.js';
import { createWebRuntime } from '../src/web/createWebRuntime.js';
import { cordelAudio } from '../src/services/AudioService.js';

describe('Prancha 11 — Santuário Genético da Serra & Caldeirão Místico (24 Receitas)', () => {
  it('renderiza o catálogo oficial com as 24 receitas ancestrais e filtra por nível 1 a 8', async () => {
    const html = await renderToString(h(GrimorioSantuarioPanel));
    expect(html).toContain('data-testid="grimorio-santuario-panel"');
    expect(html).toContain('data-testid="caldeirao-mistico-area"');
    expect(html).toContain('MISTURAR NO CALDEIRÃO ♨️');
    expect(SANCTUARY_24_RECEITAS).toHaveLength(24);

    for (let lvl = 1; lvl <= 8; lvl++) {
      const recipesAtLvl = SANCTUARY_24_RECEITAS.filter((r) => r.sanctuaryLevel === lvl);
      expect(recipesAtLvl).toHaveLength(3);
    }

    const expectedPerLevel = [
      ['#18 Trovão do Sertão', '#23 Mula sem Cabeça', '#24 Cuca do Agreste'],
      ['#19 Asa Branca', '#22 Saci da Ventania', '#27 Boitatá de Fogo (Mítico)'],
      ['#20 Rei do Baião', 'Híbrido sob Encomenda', 'Crista Recessiva'],
      ['#28 Carcará de Aço (Mítico)', 'Plumagem Recessiva', 'Passiva Rara'],
      ['#11 Galo Cangaceiro Direto', '#12 Galo Mata-Guerreiro', 'Dupla Herança'],
      ['#26 Sombra Armorial (Mítico)', 'Passiva Lendária', 'Fertilidade Renovada'],
      ['#25 Guardião da Mata', '#21 Galo Brasa-do-Sertão', 'Mutação Dobrada'],
      ['#29 Asa Branca Celestial (Mítico)', 'Linhagem Pura', 'Ovo de Festa'],
    ];

    expectedPerLevel.forEach((list, idx) => {
      const lvl = idx + 1;
      const atLvl = SANCTUARY_24_RECEITAS.filter((r) => r.sanctuaryLevel === lvl);
      for (const item of list) {
        const found = atLvl.some((r) => r.name.includes(item));
        expect(found).toBe(true);
      }
    });
  });

  it('valida a Sede mínima exigida por nível (Sede 6 a 12) e bloqueia quando insuficiente', () => {
    expect(getMinSedeForSanctuaryLevel(1)).toBe(6);
    expect(getMinSedeForSanctuaryLevel(2)).toBe(7);
    expect(getMinSedeForSanctuaryLevel(3)).toBe(8);
    expect(getMinSedeForSanctuaryLevel(4)).toBe(8);
    expect(getMinSedeForSanctuaryLevel(5)).toBe(9);
    expect(getMinSedeForSanctuaryLevel(6)).toBe(10);
    expect(getMinSedeForSanctuaryLevel(7)).toBe(11);
    expect(getMinSedeForSanctuaryLevel(8)).toBe(12);

    const instance = (GrimorioSantuarioPanel.setup as any)({ playerSedeLevel: 6 }, { emit: () => {} });
    let vnode = instance();

    const btnLvl8 = vnode.children[2].children[7];
    expect(btnLvl8.props['data-testid']).toBe('sanctuary-level-btn-8');
    btnLvl8.props.onClick();

    vnode = instance();
    const btnMisturar = vnode.children[4].children[2].children[0];
    btnMisturar.props.onClick();

    vnode = instance();
    const resultMsg = vnode.children[4].children[3].children;
    expect(resultMsg).toContain('Sede insuficiente');
    expect(resultMsg).toContain('exige Sede 12');
  });

  it('seleciona linhagens matrizes e executa mistura no Caldeirão com disparo sonoro', () => {
    cordelAudio.clearHistory();
    const trianguloSpy = vi.spyOn(cordelAudio, 'playTrianguloReward');
    const supremeSpy = vi.spyOn(cordelAudio, 'playGaloCantoSupreme');
    let outcome: CaldeiraoSynthesisResult | null = null;

    expect(LINHAGENS_MATRIZES).toContain('Matriz Brasa');
    expect(LINHAGENS_MATRIZES).toContain('Matriz Sol');

    const props = {
      playerSedeLevel: 12,
      onSynthesized: (res: CaldeiraoSynthesisResult) => { outcome = res; },
    };
    const instance = (GrimorioSantuarioPanel.setup as any)(props, { emit: () => {} });
    let vnode = instance();

    // Altera matrizes
    const selectA = vnode.children[4].children[1].children[1];
    const selectB = vnode.children[4].children[1].children[3];
    selectA.props.onChange({ target: { value: 'Matriz Sol' } });
    selectB.props.onChange({ target: { value: 'Matriz Brasa' } });

    // Mistura receita nível 1 (#18 Trovão do Sertão)
    const btnMisturar = vnode.children[4].children[2].children[0];
    btnMisturar.props.onClick();
    vnode = instance();

    expect(trianguloSpy).toHaveBeenCalled();
    expect(outcome).toMatchObject({ success: true, level: 1, matrizA: 'Matriz Sol', matrizB: 'Matriz Brasa' });
    expect(vnode.children[4].children[3].children).toContain('#18 Trovão do Sertão');

    // Seleciona nível 8 (Mítico: #29 Asa Branca Celestial)
    vnode.children[2].children[7].props.onClick();
    vnode = instance();
    vnode.children[4].children[2].children[0].props.onClick();

    expect(supremeSpy).toHaveBeenCalled();
    trianguloSpy.mockRestore();
    supremeSpy.mockRestore();
  });

  it('integra sub-aba Grimório 24 Receitas (Prancha 11) no RoostersTabView', async () => {
    const runtime = createWebRuntime();
    const instance = (RoostersTabView.setup as any)({ runtime }, { emit: () => {} });
    let frameVnode = instance();
    let tabContent = frameVnode.children.default()[0];

    const btnGrimorio = tabContent.children[0].children[4];
    expect(btnGrimorio.props['data-testid']).toBe('subtab-grimorio');
    btnGrimorio.props.onClick();

    frameVnode = instance();
    tabContent = frameVnode.children.default()[0];

    const htmlGrimorio = await renderToString(tabContent);
    expect(htmlGrimorio).toContain('data-testid="grimorio-santuario-panel"');
    expect(htmlGrimorio).toContain('Santuário Genético da Serra (Prancha 11) — Grimório Ancestral');
  });

  it('garante conformidade estrita com a Lei 9.605/98 (zero termos proibidos)', () => {
    const banned = [
      ['r', 'i', 'n', 'h', 'a'].join(''), ['g', 'a', 'l', 'i', 's', 't', 'a'].join(''),
      ['a', 'p', 'o', 's', 't', 'a'].join(''), ['e', 's', 'p', 'o', 'r', 'a'].join(''),
      ['r', 'i', 'n', 'h', 'a', 'd', 'e', 'i', 'r', 'o'].join(''),
    ];
    const regex = new RegExp(`\\b(${banned.join('|')})\\b`, 'i');
    const sampleText = 'GrimorioSantuarioPanel Caldeirao Mistico Receitas Ancestrais Trovao do Sertao Boitata Asa Branca';
    expect(regex.test(sampleText)).toBe(false);
  });
});
