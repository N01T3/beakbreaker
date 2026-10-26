import { defineComponent, h, ref } from 'vue';
import { CORDEL_PALETTE } from '@beakbreaker/ui-cordel';
import { useGameStore } from '../stores/useGameStore.js';
import { capacitorBridge } from '../services/CapacitorBridgeService.js';

const buttonStyle = {
  backgroundColor: CORDEL_PALETTE.cremePapel,
  color: CORDEL_PALETTE.tintaXilo,
  border: '2px solid #1B1B1B',
  padding: '4px 10px',
  fontWeight: 'bold',
  marginRight: '6px',
};

export const PlatformBridgeBar = defineComponent({
  name: 'PlatformBridgeBar',
  setup() {
    const store = useGameStore();
    const status = ref('');

    const handleSave = () => {
      const saved = capacitorBridge.saveProgressSnapshot({
        milho: store.milho,
        coroas: store.coroas,
        sedeLevel: store.sedeLevel,
        currentPity: store.currentPity,
        ageVerified: store.ageVerified18Plus,
      });
      capacitorBridge.triggerWoodcutHaptic('medium');
      status.value = `Progresso salvo (${saved.milho} milho, ${saved.coroas} coroas)`;
    };

    const handleLoad = () => {
      const snapshot = capacitorBridge.loadProgressSnapshot();
      if (!snapshot) {
        status.value = 'Nenhum progresso local encontrado';
        return;
      }
      store.milho = snapshot.milho;
      store.coroas = snapshot.coroas;
      store.sedeLevel = snapshot.sedeLevel;
      capacitorBridge.triggerWoodcutHaptic('light');
      status.value = `Progresso restaurado (${snapshot.milho} milho)`;
    };

    return () =>
      h(
        'div',
        {
          'data-testid': 'platform-bridge-bar',
          style: {
            marginTop: '6px',
            padding: '4px 8px',
            border: '2px dashed #1B1B1B',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
          },
        },
        [
          h('span', { style: { fontWeight: 'bold' } }, `Plataforma: ${capacitorBridge.getPlatformLabel()}`),
          h(
            'button',
            { type: 'button', 'data-testid': 'btn-save-snapshot', style: buttonStyle, onClick: handleSave },
            'Salvar Progresso Local',
          ),
          h(
            'button',
            { type: 'button', 'data-testid': 'btn-load-snapshot', style: buttonStyle, onClick: handleLoad },
            'Restaurar Progresso',
          ),
          status.value ? h('span', { 'data-testid': 'snapshot-save-status' }, status.value) : null,
        ],
      );
  },
});
