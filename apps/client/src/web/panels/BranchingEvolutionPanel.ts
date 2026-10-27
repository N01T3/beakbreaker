import { defineComponent, h, ref, computed, type PropType } from 'vue';
import { CORDEL_PALETTE } from '@beakbreaker/ui-cordel';
import { AudioService } from '../../services/AudioService.js';
import type { WebRuntime } from '../createWebRuntime.js';

export interface EvolutionOutcome {
  branch: 'Caatinga' | 'Agreste';
  targetRooster: string;
  secretMutation: string | null;
}

export const BranchingEvolutionPanel = defineComponent({
  name: 'BranchingEvolutionPanel',
  props: {
    runtime: { type: Object as PropType<WebRuntime>, required: false },
    onEvolved: { type: Function as PropType<(res: EvolutionOutcome) => void>, required: false },
  },
  setup(props) {
    const selectedBranch = ref<'Caatinga' | 'Agreste'>('Caatinga');
    const pimentaCount = ref(5);
    const folhaCount = ref(3);
    const secretMutationActive = ref(false);
    const evolutionResult = ref<string | null>(null);

    const canEvolve = computed(() =>
      selectedBranch.value === 'Caatinga' ? pimentaCount.value >= 5 : folhaCount.value >= 5,
    );

    const toggleSecretMutation = () => {
      secretMutationActive.value = !secretMutationActive.value;
    };

    const toggleFolhaSupply = () => {
      folhaCount.value = folhaCount.value >= 5 ? 3 : 5;
    };

    const handleConfirmEvolution = () => {
      if (!canEvolve.value) {
        evolutionResult.value = `Ingredientes insuficientes para ${selectedBranch.value} (Requer 5x catalisadores).`;
        return;
      }
      AudioService.play('skill');
      const target = selectedBranch.value === 'Caatinga' ? 'Galo Brasa-do-Sertão' : 'Galo Guardião da Mata';
      const mutText = secretMutationActive.value ? ' com Mutação Secreta Sombra Armorial (+15% Crítico Sombrio)!' : '!';
      evolutionResult.value = `Evolução Confirmada: ${target}${mutText}`;
      props.onEvolved?.({
        branch: selectedBranch.value,
        targetRooster: target,
        secretMutation: secretMutationActive.value ? 'Sombra Armorial' : null,
      });
    };

    return () => {
      const isCaatinga = selectedBranch.value === 'Caatinga';
      const cardBorder = isCaatinga ? CORDEL_PALETTE.vermelhoCrista : CORDEL_PALETTE.verdeMata;
      const mutationAura = secretMutationActive.value ? '0 0 14px #7C3AED' : 'none';

      return h('div', {
        class: 'cordel-card', 'data-testid': 'branching-evolution-panel',
        style: {
          border: '3px solid #5C3A21', borderRadius: '8px', padding: '12px',
          backgroundImage: "linear-gradient(rgba(253, 248, 237, 0.88), rgba(253, 248, 237, 0.94)), url('/assets/pranchas/evolucao-backdrop.webp')",
          backgroundSize: 'cover', backgroundPosition: 'center', boxShadow: 'inset 0 0 8px #3E2723, 0 4px 8px rgba(0,0,0,0.15)',
        },
      }, [
        h('h3', { style: { margin: '0 0 8px 0', fontFamily: 'Lilita One' } }, 'Árvore de Evolução Ramificada (Prancha 10)'),
        h('div', { 'data-testid': 'tree-root-node', style: { padding: '8px', border: '2px solid #5C3A21', borderRadius: '6px', backgroundColor: '#FFFDF9', marginBottom: '8px' } }, [
          h('div', { style: { fontWeight: 'bold' } }, 'Nó Raiz: Galo Moleque da Roça (Nível 20)'),
          h('div', { style: { fontSize: '13px', color: '#555' } }, 'Atributos Base: Força 750 | Vigor 9.500 | Canto 280'),
        ]),
        h('div', { 'data-testid': 'bifurcation-connector', style: { fontFamily: 'monospace', fontWeight: 'bold', margin: '4px 0 8px 0', fontSize: '12px' } }, [
          h('div', '├── [Caatinga]: 5x Pimenta Brasa ➔ Galo Cangaceiro (Raro) ➔ Galo Brasa-do-Sertão (Lendário)'),
          h('div', '└── [Agreste]: 5x Folha Sagrada ➔ Galo Mata-Guerreiro (Raro) ➔ Galo Guardião da Mata (Mítico)'),
        ]),
        h('div', { style: { display: 'flex', gap: '8px', margin: '8px 0', flexWrap: 'wrap' } }, [
          h('button', {
            type: 'button', 'data-testid': 'branch-caatinga',
            style: {
              flex: '1', padding: '8px', cursor: 'pointer', fontWeight: 'bold', border: `2px solid ${isCaatinga ? '#1B1B1B' : '#888'}`,
              backgroundColor: isCaatinga ? CORDEL_PALETTE.vermelhoCrista : '#EEE', color: isCaatinga ? '#FFF' : '#333',
            },
            onClick: () => { selectedBranch.value = 'Caatinga'; },
          }, [
            h('div', 'Ramo Caatinga (Fogo)'),
            h('span', { 'data-testid': 'badge-req-caatinga', style: { fontSize: '12px' } }, `Pimenta Brasa: ${pimentaCount.value}/5`),
          ]),
          h('button', {
            type: 'button', 'data-testid': 'branch-agreste',
            style: {
              flex: '1', padding: '8px', cursor: 'pointer', fontWeight: 'bold', border: `2px solid ${!isCaatinga ? '#1B1B1B' : '#888'}`,
              backgroundColor: !isCaatinga ? CORDEL_PALETTE.verdeMata : '#EEE', color: !isCaatinga ? '#FFF' : '#333',
            },
            onClick: () => { selectedBranch.value = 'Agreste'; },
          }, [
            h('div', 'Ramo Agreste (Casca-Grossa)'),
            h('span', { 'data-testid': 'badge-req-agreste', style: { fontSize: '12px' } }, `Folha Sagrada: ${folhaCount.value}/5`),
          ]),
        ]),
        h('div', { 'data-testid': 'stats-preview-card', style: { border: `2px solid ${cardBorder}`, padding: '8px', backgroundColor: '#FFF', margin: '8px 0' } }, [
          h('div', { style: { fontWeight: 'bold' } }, `Preview de Atributos (${selectedBranch.value}):`),
          h('div', { style: { fontSize: '12px' } }, isCaatinga
            ? 'Força: 750 ➔ 1.012 (+35% Ataque Brasa) | Vigor: 9.500 ➔ 11.500 | Canto: 280 ➔ 400'
            : 'Força: 750 ➔ 900 (+150) | Vigor: 9.500 ➔ 13.300 (+40% Defesa Casca-Grossa) | Canto: 280 ➔ 380'),
          h('div', { style: { fontSize: '11px', fontStyle: 'italic', marginTop: '2px' } }, isCaatinga ? 'Passiva: Fogo Eterno' : 'Passiva: Regeneração Sertaneja'),
          h('div', { style: { marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' } }, [
            h('img', {
              src: secretMutationActive.value ? '/assets/roosters/card_26.webp' : (isCaatinga ? '/assets/roosters/card_21.webp' : '/assets/roosters/card_25.webp'),
              alt: 'Preview', style: { width: '48px', height: '60px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #1B1B1B' },
            }),
            h('span', { style: { fontSize: '12px', fontWeight: 'bold' } }, secretMutationActive.value ? 'Galo Sombra Armorial (Mítico)' : (isCaatinga ? 'Galo Cangaceiro Brasa' : 'Galo Mata-Guerreiro')),
          ]),
        ]),
        h('div', {
          'data-testid': 'secret-mutation-card',
          style: { border: '2px dashed #7C3AED', padding: '8px', margin: '8px 0', backgroundColor: '#FDF4FF', boxShadow: mutationAura },
        }, [
          h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
            h('span', { style: { fontWeight: 'bold', color: '#6B21A8' } }, 'Mutação Secreta (5%): Sombra Armorial'),
            h('button', {
              type: 'button', 'data-testid': 'btn-toggle-secret-mutation',
              style: { padding: '4px 8px', fontSize: '12px', cursor: 'pointer', backgroundColor: secretMutationActive.value ? '#7C3AED' : '#DDD', color: secretMutationActive.value ? '#FFF' : '#333' },
              onClick: toggleSecretMutation,
            }, secretMutationActive.value ? 'Desativar Mutação' : 'Ativar Mutação (5%)'),
          ]),
          h('div', { 'data-testid': 'badge-secret-mutation', style: { fontSize: '12px', marginTop: '4px', color: '#6B21A8' } },
            secretMutationActive.value ? 'Sombra Armorial ATIVA (Aura Roxa Mística | +15% Crítico Sombrio)' : 'Inativa (5% de chance ao evoluir)'),
        ]),
        h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' } }, [
          h('button', {
            type: 'button', 'data-testid': 'btn-confirm-evolution', disabled: !canEvolve.value,
            style: {
              flex: '1', padding: '10px', fontWeight: 'bold', fontSize: '14px', cursor: canEvolve.value ? 'pointer' : 'not-allowed',
              backgroundColor: canEvolve.value ? CORDEL_PALETTE.amareloMilho : '#CCC', border: '2px solid #1B1B1B',
            },
            onClick: handleConfirmEvolution,
          }, canEvolve.value ? 'CONFIRMAR EVOLUÇÃO' : 'BLOQUEADO: INGREDIENTES INSUFICIENTES'),
          h('button', {
            type: 'button', 'data-testid': 'btn-toggle-folha-supply',
            style: { padding: '10px', fontSize: '12px', cursor: 'pointer', border: '1px solid #1B1B1B', backgroundColor: '#FFF' },
            onClick: toggleFolhaSupply,
          }, `Estoque Folhas: ${folhaCount.value}/5`),
        ]),
        evolutionResult.value ? h('div', {
          'data-testid': 'evolution-result-text',
          style: { marginTop: '8px', padding: '6px', backgroundColor: '#DCFCE7', border: '1px solid #16A34A', fontSize: '13px', fontWeight: 'bold' },
        }, evolutionResult.value) : null,
      ]);
    };
  },
});
