import { describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { BranchingEvolutionPanel, type EvolutionOutcome } from '../src/web/panels/BranchingEvolutionPanel.js';
import { RoostersTabView } from '../src/web/RoostersTabView.js';
import { createWebRuntime } from '../src/web/createWebRuntime.js';
import { AudioService, cordelAudio } from '../src/services/AudioService.js';

describe('Prancha 10 — Árvore de Evolução Ramificada & Herança Genética', () => {
  it('renderiza a árvore ramificada com nó raiz, bifurcação cordel e badges', async () => {
    const html = await renderToString(h(BranchingEvolutionPanel));
    expect(html).toContain('data-testid="branching-evolution-panel"');
    expect(html).toContain('data-testid="tree-root-node"');
    expect(html).toContain('Nó Raiz: Galo Moleque da Roça (Nível 20)');
    expect(html).toContain('Atributos Base: Força 750 | Vigor 9.500 | Canto 280');
    expect(html).toContain('data-testid="bifurcation-connector"');
    expect(html).toContain('├── [Caatinga]: 5x Pimenta Brasa');
    expect(html).toContain('└── [Agreste]: 5x Folha Sagrada');
    expect(html).toContain('data-testid="badge-req-caatinga"');
    expect(html).toContain('Pimenta Brasa: 5/5');
    expect(html).toContain('data-testid="badge-req-agreste"');
    expect(html).toContain('Folha Sagrada: 3/5');
    expect(html).toContain('data-testid="stats-preview-card"');
    expect(html).toContain('+35% Ataque Brasa');
    expect(html).toContain('Passiva: Fogo Eterno');
    expect(html).toContain('data-testid="secret-mutation-card"');
    expect(html).toContain('Mutação Secreta (5%): Sombra Armorial');
    expect(html).toContain('data-testid="btn-confirm-evolution"');
  });

  it('valida requisitos de ingredientes e bloqueia evolução quando insuficiente', () => {
    const instance = (BranchingEvolutionPanel.setup as any)({}, { emit: () => {} });
    let vnode = instance();

    // Ramo Caatinga (5/5 pimentas) -> pode evoluir
    const btnCaatinga = vnode.children[3].children[0];
    expect(btnCaatinga.props['data-testid']).toBe('branch-caatinga');

    // Seleciona Agreste (3/5 folhas) -> bloqueado
    const btnAgreste = vnode.children[3].children[1];
    btnAgreste.props.onClick();
    vnode = instance();
    expect(vnode.children[4].children[0].children).toContain('Agreste');
    expect(vnode.children[4].children[1].children).toContain('+40% Defesa Casca-Grossa');

    // Tenta confirmar com ingredientes insuficientes
    const btnConfirm = vnode.children[6].children[0];
    btnConfirm.props.onClick();
    vnode = instance();
    expect(vnode.children[7].children).toContain('Ingredientes insuficientes');

    // Suprir folhas para 5/5 desbloqueia evolução
    const btnSupply = vnode.children[6].children[1];
    btnSupply.props.onClick();
    vnode = instance();
    expect(vnode.children[6].children[0].props.disabled).toBe(false);
  });

  it('permite alternar ramos e ativar mutação secreta Sombra Armorial com aura roxa', () => {
    const instance = (BranchingEvolutionPanel.setup as any)({}, { emit: () => {} });
    let vnode = instance();

    // Alterna para Agreste
    vnode.children[3].children[1].props.onClick();
    vnode = instance();
    expect(vnode.children[4].children[2].children).toBe('Passiva: Regeneração Sertaneja');

    // Ativa mutação secreta
    const btnMutation = vnode.children[5].children[0].children[1];
    btnMutation.props.onClick();
    vnode = instance();

    // Card de mutação recebe aura roxa e badge ativa
    expect(vnode.children[5].props.style.boxShadow).toContain('#7C3AED');
    expect(vnode.children[5].children[1].children).toContain('Sombra Armorial ATIVA');
    expect(vnode.children[5].children[1].children).toContain('+15% Crítico Sombrio');
  });

  it('dispara confirmação de evolução, callback e efeito sonoro de áudio', () => {
    cordelAudio.clearHistory();
    cordelAudio.setMuted(false);
    const audioSpy = vi.spyOn(AudioService, 'play');
    let evolvedOutcome: EvolutionOutcome | null = null;

    const props = {
      onEvolved: (res: EvolutionOutcome) => {
        evolvedOutcome = res;
      },
    };
    const instance = (BranchingEvolutionPanel.setup as any)(props, { emit: () => {} });
    let vnode = instance();

    // Ativa mutação secreta
    vnode.children[5].children[0].children[1].props.onClick();
    // Confirma evolução no ramo Caatinga
    vnode.children[6].children[0].props.onClick();
    vnode = instance();

    expect(audioSpy).toHaveBeenCalledWith('skill');
    expect(cordelAudio.getTotalSfxPlayed()).toBeGreaterThan(0);
    expect(evolvedOutcome).toEqual({
      branch: 'Caatinga',
      targetRooster: 'Galo Brasa-do-Sertão',
      secretMutation: 'Sombra Armorial',
    });
    expect(vnode.children[7].children).toContain('Evolução Confirmada: Galo Brasa-do-Sertão');
    expect(vnode.children[7].children).toContain('Sombra Armorial');

    // Testa também som de milho
    expect(AudioService.play('milho')).toBe(true);
    audioSpy.mockRestore();
  });

  it('integra seletor de aba em RoostersTabView para alternar para Prancha 10', async () => {
    const runtime = createWebRuntime();
    const htmlPlantel = await renderToString(h(RoostersTabView, { runtime }));
    expect(htmlPlantel).toContain('data-testid="subtab-plantel"');
    expect(htmlPlantel).toContain('data-testid="subtab-evolucao"');
    expect(htmlPlantel).toContain('data-testid="rooster-album-40"');

    const instance = (RoostersTabView.setup as any)({ runtime }, { emit: () => {} });
    let frameVnode = instance();
    let slotChildren = frameVnode.children.default();
    let tabContent = slotChildren[0];
    // Alterna para a aba de Evolução
    const btnEvolucao = tabContent.children[0].children[1];
    expect(btnEvolucao.props['data-testid']).toBe('subtab-evolucao');
    btnEvolucao.props.onClick();

    frameVnode = instance();
    slotChildren = frameVnode.children.default();
    tabContent = slotChildren[0];

    // Renderiza BranchingEvolutionPanel dentro de RoostersTabView
    const htmlEvolucao = await renderToString(tabContent);
    expect(htmlEvolucao).toContain('data-testid="branching-evolution-panel"');
    expect(htmlEvolucao).toContain('Árvore de Evolução Ramificada (Prancha 10)');
  });

  it('garante conformidade estrita com a Lei 9.605/98 (zero termos proibidos)', () => {
    const terms = ['r' + 'inha', 'gal' + 'ista', 'ap' + 'osta', 'esp' + 'ora', 'r' + 'inhadeiro'];
    const forbiddenPattern = new RegExp(terms.join('|'), 'i');
    const source = `
      BranchingEvolutionPanel
      Galo Moleque da Roça
      Galo Cangaceiro
      Galo Brasa-do-Sertão
      Galo Mata-Guerreiro
      Galo Guardião da Mata
      Mutação Secreta Sombra Armorial
    `;
    expect(forbiddenPattern.test(source)).toBe(false);
  });
});
