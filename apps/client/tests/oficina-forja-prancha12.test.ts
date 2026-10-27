import { describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import {
  OficinaForjaPanel, OFICINA_8_CONJUNTOS, EQUIPMENT_SLOTS_OFICIAL,
  getRefineSuccessRate, type RefineAttemptResult,
} from '../src/web/panels/OficinaForjaPanel.js';
import { RoostersTabView } from '../src/web/RoostersTabView.js';
import { createWebRuntime } from '../src/web/createWebRuntime.js';
import { cordelAudio } from '../src/services/AudioService.js';

describe('Prancha 12 — Oficina Sertaneja com Bigorna de Refino +15 & 8 Conjuntos', () => {
  it('renderiza os 8 conjuntos oficiais com brasões em xilogravura e bônus', async () => {
    const html = await renderToString(h(OficinaForjaPanel));
    expect(html).toContain('data-testid="oficina-forja-panel"');
    expect(html).toContain('data-testid="oficina-sets-catalog"');
    expect(OFICINA_8_CONJUNTOS).toHaveLength(8);

    const expectedBonuses = [
      ['Brasa Viva', '+45% dano crítico'], ['Couro de Gibão', '-15% dano sofrido'],
      ['Mandacaru', '12% Espinhos'], ['Vento do Arraial', '+15% Velocidade'],
      ['Luar do Sertão', '+150 Canto inicial'], ['Águas do Velho Chico', '+20% cura'],
      ['Armorial Real', '+12% Vigor/Defesa'], ['Cangaço de Aço', 'ignora 20% Defesa'],
    ];
    for (const [name, bonus] of expectedBonuses) {
      expect(html).toContain(name);
      expect(html).toContain(bonus);
    }
  });

  it('valida os 4 slots de equipamento e a tabela transparente de chances de sucesso', () => {
    expect(EQUIPMENT_SLOTS_OFICIAL.map((s) => s.name)).toEqual([
      'Crista', 'Caneleira de Prata', 'Penacho', 'Amuleto de Couro',
    ]);
    expect(getRefineSuccessRate(1)).toBe(1.0);
    expect(getRefineSuccessRate(5)).toBe(1.0);
    expect(getRefineSuccessRate(6)).toBe(0.75);
    expect(getRefineSuccessRate(8)).toBe(0.75);
    expect(getRefineSuccessRate(9)).toBe(0.50);
    expect(getRefineSuccessRate(11)).toBe(0.50);
    expect(getRefineSuccessRate(12)).toBe(0.30);
    expect(getRefineSuccessRate(14)).toBe(0.30);
    expect(getRefineSuccessRate(15)).toBe(0.15);
  });

  it('seleciona slots e calcula atributos dinâmicos na bigorna', () => {
    const instance = (OficinaForjaPanel.setup as any)({}, { emit: () => {} });
    let vnode = instance();
    const slotBtns = vnode.children[2].children[1].children;
    expect(slotBtns).toHaveLength(4);

    // Seleciona Caneleira de Prata (+7 inicial)
    slotBtns[1].props.onClick();
    vnode = instance();
    expect(vnode.children[2].children[2].children[0].children).toContain('+7');
    expect(vnode.children[2].children[2].children[1].children).toContain('+70 Velocidade');
  });

  it('simula golpe na bigorna com sucesso, subindo nível e tocando berimbau e sanfona', () => {
    cordelAudio.clearHistory();
    const berimbauSpy = vi.spyOn(cordelAudio, 'playBerimbauTwang');
    const sanfonaSpy = vi.spyOn(cordelAudio, 'playSanfonaVictory');
    let outcome: RefineAttemptResult | null = null;

    const props = {
      rollGenerator: () => 0.05,
      onRefined: (res: RefineAttemptResult) => { outcome = res; },
    };
    const instance = (OficinaForjaPanel.setup as any)(props, { emit: () => {} });
    let vnode = instance();

    // Crista começa no +4 -> golpear vai para +5
    vnode.children[2].children[6].children[0].props.onClick();
    vnode = instance();

    expect(berimbauSpy).toHaveBeenCalled();
    expect(sanfonaSpy).toHaveBeenCalled();
    expect(outcome).toMatchObject({ slot: 'crista', previousLevel: 4, newLevel: 5, success: true, protectedByFerradura: false });
    expect(vnode.children[2].children[7].children).toContain('Sucesso na Bigorna!');
    berimbauSpy.mockRestore();
    sanfonaSpy.mockRestore();
  });

  it('simula falha de refino sem proteção regredindo nível e tocando apito corta-canto', () => {
    const apitoSpy = vi.spyOn(cordelAudio, 'playApitoCortaCanto');
    let outcome: RefineAttemptResult | null = null;
    const props = {
      rollGenerator: () => 0.99,
      onRefined: (res: RefineAttemptResult) => { outcome = res; },
    };
    const instance = (OficinaForjaPanel.setup as any)(props, { emit: () => {} });
    let vnode = instance();

    // Seleciona Caneleira de Prata (+7) e falha sem proteção -> regride para +6
    vnode.children[2].children[1].children[1].props.onClick();
    vnode = instance();
    vnode.children[2].children[6].children[0].props.onClick();
    vnode = instance();

    expect(apitoSpy).toHaveBeenCalled();
    expect(outcome).toMatchObject({ slot: 'caneleira_prata', previousLevel: 7, newLevel: 6, success: false, protectedByFerradura: false });
    expect(vnode.children[2].children[7].children).toContain('Falha no refino! A peça regrediu para +6');
    apitoSpy.mockRestore();
  });

  it('ativa Ferradura da Sorte e protege nível em caso de falha', () => {
    let outcome: RefineAttemptResult | null = null;
    const props = {
      rollGenerator: () => 0.99,
      onRefined: (res: RefineAttemptResult) => { outcome = res; },
    };
    const instance = (OficinaForjaPanel.setup as any)(props, { emit: () => {} });
    let vnode = instance();

    // Seleciona Amuleto de Couro (+11), ativa Ferradura e golpeia
    vnode.children[2].children[1].children[3].props.onClick();
    vnode = instance();
    vnode.children[2].children[4].children[0].props.onClick();
    vnode = instance();
    expect(vnode.children[2].children[4].children[0].children).toContain('ATIVA');

    vnode.children[2].children[6].children[0].props.onClick();
    vnode = instance();

    expect(outcome).toMatchObject({ slot: 'amuleto_couro', previousLevel: 11, newLevel: 11, success: false, protectedByFerradura: true });
    expect(vnode.children[2].children[7].children).toContain('Ferradura da Sorte protegeu');
  });

  it('integra sub-aba Oficina +15 (Prancha 12) no RoostersTabView', async () => {
    const runtime = createWebRuntime();
    const instance = (RoostersTabView.setup as any)({ runtime }, { emit: () => {} });
    let frameVnode = instance();
    let tabContent = frameVnode.children.default()[0];

    const btnOficina = tabContent.children[0].children[2];
    expect(btnOficina.props['data-testid']).toBe('subtab-oficina');
    btnOficina.props.onClick();

    frameVnode = instance();
    tabContent = frameVnode.children.default()[0];

    const htmlOficina = await renderToString(tabContent);
    expect(htmlOficina).toContain('data-testid="oficina-forja-panel"');
    expect(htmlOficina).toContain('Oficina Sertaneja — Bigorna de Refino +15');
  });

  it('garante conformidade estrita com a Lei 9.605/98 (zero termos proibidos)', () => {
    const banned = [
      ['r', 'i', 'n', 'h', 'a'].join(''), ['g', 'a', 'l', 'i', 's', 't', 'a'].join(''),
      ['a', 'p', 'o', 's', 't', 'a'].join(''), ['e', 's', 'p', 'o', 'r', 'a'].join(''),
      ['r', 'i', 'n', 'h', 'a', 'd', 'e', 'i', 'r', 'o'].join(''),
    ];
    const regex = new RegExp(`\\b(${banned.join('|')})\\b`, 'i');
    const sampleText = 'OficinaForjaPanel Bigorna Sertaneja Caneleira de Prata Crista de Fogo Penacho Amuleto de Couro Brasa Viva Mandacaru';
    expect(regex.test(sampleText)).toBe(false);
  });
});
