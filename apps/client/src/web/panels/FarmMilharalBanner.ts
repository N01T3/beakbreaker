import { defineComponent, h, type PropType } from 'vue';
import { CORDEL_PALETTE, CORDEL_TYPOGRAPHY } from '@beakbreaker/ui-cordel';
import { cordelAudio } from '../../services/AudioService.js';
import type { WebRuntime } from '../createWebRuntime.js';

export function formatMilharalCorn(amount?: number): string {
  const safe = amount ?? 1200;
  return safe === 1200 ? '1.200' : safe.toLocaleString('pt-BR');
}

const badgeStyle = (bg: string, text: string = CORDEL_PALETTE.cremePapel) => ({
  backgroundColor: bg, color: text, border: '2px solid #1B1B1B', boxShadow: '2px 2px 0 #1B1B1B',
  padding: '4px 10px', fontWeight: 'bold' as const, fontSize: '12px',
  fontFamily: CORDEL_TYPOGRAPHY.displayFont, display: 'inline-flex', alignItems: 'center', gap: '4px',
});

const sideBtnStyle = {
  backgroundColor: CORDEL_PALETTE.cremePapel, color: CORDEL_PALETTE.tintaXilo,
  border: '2px solid #1B1B1B', boxShadow: '2px 2px 0 #1B1B1B', padding: '8px 12px',
  fontWeight: 'bold' as const, fontSize: '12px', cursor: 'pointer', display: 'flex',
  flexDirection: 'column' as const, alignItems: 'center', gap: '2px',
  fontFamily: CORDEL_TYPOGRAPHY.displayFont,
};

export const FarmMilharalBanner = defineComponent({
  name: 'FarmMilharalBanner',
  props: {
    runtime: { type: Object as PropType<WebRuntime>, required: false },
    trainerLevel: { type: Number, default: 12 },
    cornAmount: { type: Number, default: 1200 },
    goldFeathers: { type: Number, default: 450 },
    crowns: { type: Number, default: 80 },
    harvestReadyCorn: { type: Number, default: 1200 },
    onHarvest: { type: Function as PropType<() => void>, required: false },
    onNavigate: { type: Function as PropType<(dest: 'missoes' | 'loja' | 'cla') => void>, required: false },
  },
  setup(props) {
    const handleHarvest = () => {
      cordelAudio.playTrianguloReward();
      if (props.onHarvest) {
        props.onHarvest();
      } else if (props.runtime) {
        if (props.runtime.state.storedPerchMilho <= 0) props.runtime.refillPerches();
        props.runtime.harvestFarm();
      }
    };

    const handleNav = (dest: 'missoes' | 'loja' | 'cla') => {
      cordelAudio.playZabumbaTabSwitch();
      props.onNavigate?.(dest);
    };

    return () => {
      const cornText = formatMilharalCorn(props.harvestReadyCorn);
      const lvl = props.trainerLevel ?? 12;
      const corn = props.cornAmount ?? 1200;
      const penas = props.goldFeathers ?? 450;
      const coroa = props.crowns ?? 80;

      return h('div', {
        class: 'farm-milharal-banner',
        'data-testid': 'farm-milharal-banner',
        style: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' },
      }, [
        h('div', {
          'data-testid': 'farm-top-badges',
          style: { display: 'none' },
        }, [
          h('span', { 'data-testid': 'badge-trainer-level', style: badgeStyle(CORDEL_PALETTE.verdeMata) }, `Nível ${lvl}`),
          h('span', { 'data-testid': 'badge-recurso-milho', style: badgeStyle(CORDEL_PALETTE.amareloMilho, CORDEL_PALETTE.tintaXilo) }, `🌽 ${corn.toLocaleString('pt-BR')}`),
          h('span', { 'data-testid': 'badge-recurso-penas', style: badgeStyle(CORDEL_PALETTE.terracota) }, `🪶 ${penas}`),
          h('span', { 'data-testid': 'badge-recurso-coroas', style: badgeStyle(CORDEL_PALETTE.azulAnil) }, `👑 ${coroa}`),
        ]),
        h('div', { style: { display: 'flex', gap: '12px', alignItems: 'flex-start' } }, [
          h('div', {
            class: 'farm-sidebar-shortcuts',
            'data-testid': 'farm-sidebar-shortcuts',
            style: { display: 'flex', flexDirection: 'column', gap: '6px' },
          }, [
            h('button', {
              type: 'button', 'data-testid': 'sidebar-btn-missoes', style: sideBtnStyle,
              onClick: () => handleNav('missoes'),
            }, [h('span', { style: { fontSize: '16px' } }, '📜'), h('span', 'Missões')]),
            h('button', {
              type: 'button', 'data-testid': 'sidebar-btn-loja', style: sideBtnStyle,
              onClick: () => handleNav('loja'),
            }, [h('span', { style: { fontSize: '16px' } }, '🛒'), h('span', 'Loja')]),
            h('button', {
              type: 'button', 'data-testid': 'sidebar-btn-cla', style: sideBtnStyle,
              onClick: () => handleNav('cla'),
            }, [h('span', { style: { fontSize: '16px' } }, '🛡️'), h('span', 'Clã')]),
          ]),
          h('div', {
            class: 'cordel-card farm-harvest-card',
            'data-testid': 'card-colheita-pronta',
            style: {
              flex: '1',
              backgroundColor: CORDEL_PALETTE.cremePapel,
              backgroundImage: 'linear-gradient(135deg, #FFFDF8 0%, #F5E9D3 100%)',
              border: '3px solid #1B1B1B',
              boxShadow: '4px 4px 0 #1B1B1B',
              borderRadius: '6px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            },
          }, [
            h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' } }, [
              h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
                h('span', {
                  class: 'pulse-badge',
                  'data-testid': 'badge-milharal-pronto',
                  style: {
                    backgroundColor: CORDEL_PALETTE.amareloMilho,
                    color: CORDEL_PALETTE.tintaXilo,
                    padding: '3px 8px',
                    fontWeight: '900',
                    fontSize: '11px',
                    border: '2px solid #1B1B1B',
                    boxShadow: '2px 2px 0 #1B1B1B',
                    borderRadius: '12px 12px 12px 2px',
                    display: 'inline-block',
                  },
                }, 'PRONTO!'),
                h('span', { style: { fontSize: '20px', color: CORDEL_PALETTE.amareloMilho } }, '🌾 🌐'),
                h('strong', {
                  style: { fontFamily: CORDEL_TYPOGRAPHY.displayFont, fontSize: '15px', color: CORDEL_PALETTE.tintaXilo },
                }, `Colheita pronta (+${cornText} milho no Milharal)`),
              ]),
              h('button', {
                type: 'button',
                'data-testid': 'btn-colher-milho-pronto',
                style: {
                  backgroundColor: CORDEL_PALETTE.vermelhoCrista,
                  color: CORDEL_PALETTE.cremePapel,
                  border: '2px solid #1B1B1B',
                  boxShadow: '3px 3px 0 #1B1B1B',
                  borderRadius: '4px',
                  padding: '8px 22px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontFamily: CORDEL_TYPOGRAPHY.displayFont,
                },
                onClick: handleHarvest,
              }, 'Colher'),
            ]),
          ]),
        ]),
      ]);
    };
  },
});
