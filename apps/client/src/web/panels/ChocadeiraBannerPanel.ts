import { defineComponent, h, ref, type PropType } from 'vue';
import { CORDEL_PALETTE } from '@beakbreaker/ui-cordel';
import { cordelAudio } from '../../services/AudioService.js';
import type { WebRuntime } from '../createWebRuntime.js';

export const CHOCADEIRA_DROP_RATES = { legendary: 2, epic: 10, rare: 33, common: 55 } as const;

export const ChocadeiraBannerPanel = defineComponent({
  name: 'ChocadeiraBannerPanel',
  props: {
    runtime: { type: Object as PropType<WebRuntime>, required: false },
    currentPity: { type: Number, default: 57 },
    onPullChocadeira: { type: Function as PropType<(pulls: number) => void>, required: false },
  },
  setup(props) {
    const pity = ref(props.currentPity ?? 57);
    const feathersBalance = ref(2400);
    const lastResult = ref('Ninho sagrado pronto. Invoque seu campeão do sertão!');

    const handlePull = (count: number, cost: number) => {
      if (feathersBalance.value < cost) {
        lastResult.value = `Penas insuficientes (${feathersBalance.value}/${cost})!`;
        return;
      }
      feathersBalance.value -= cost;
      const nextPity = pity.value + count;
      props.onPullChocadeira?.(count);

      if (nextPity >= 80) {
        pity.value = nextPity - 80;
        cordelAudio.playGaloCantoSupreme();
        lastResult.value = '★ LENDÁRIO GARANTIDO! Galo Trovão do Sertão chocado com sucesso no Pity 80!';
      } else {
        pity.value = nextPity;
        cordelAudio.playTrianguloReward();
        const drop = count === 1
          ? 'Galo Asa de Prata (Raro)'
          : '10 Ovos chocados: 1 Épico, 3 Raros, 6 Comuns';
        lastResult.value = `Ovo chocado com sucesso: ${drop} (+${count} Pity)!`;
      }
    };

    return () => {
      const pityPct = Math.min(100, Math.round((pity.value / 80) * 100));
      const isSoftPity = pity.value >= 61;
      const legRate = isSoftPity ? Math.min(100, 2 + (pity.value - 60) * 5) : 2;

      return h('div', {
        class: 'cordel-card',
        'data-testid': 'chocadeira-banner-panel',
        style: {
          border: '3px solid #1B1B1B', padding: '14px',
          backgroundImage: "linear-gradient(rgba(245,238,220,0.91), rgba(245,238,220,0.94)), url('/assets/pranchas/chocadeira-corrida-backdrop.webp')",
          backgroundSize: 'cover', backgroundPosition: 'center',
        },
      }, [
        h('div', {
          style: {
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: '2px dashed #1B1B1B', paddingBottom: '6px',
          },
        }, [
          h('h3', {
            'data-testid': 'chocadeira-banner-title',
            style: { margin: 0, color: CORDEL_PALETTE.tintaXilo },
          }, 'Banner Sagrado: Trovão do Sertão'),
          h('span', {
            'data-testid': 'chocadeira-feathers-balance',
            class: 'cordel-badge',
            style: { backgroundColor: CORDEL_PALETTE.amareloMilho, padding: '4px 8px', fontWeight: 'bold' },
          }, `Saldo: ${feathersBalance.value} Penas`),
        ]),
        h('div', {
          'data-testid': 'chocadeira-egg-nest',
          style: {
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '14px', margin: '10px 0', border: '2px solid #1B1B1B',
            background: 'radial-gradient(circle, #FFF8DC 25%, #E8D8B8 100%)',
          },
        }, [
          h('div', {
            style: { position: 'relative', width: '120px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
          }, [
            h('div', {
              style: {
                position: 'absolute', width: '85px', height: '85px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(230,175,46,0.85) 0%, rgba(184,51,42,0.2) 70%, transparent 100%)',
              },
            }),
            h('span', { style: { fontSize: '46px', zIndex: 2 } }, '🪺'),
            h('span', { style: { position: 'absolute', top: '10px', fontSize: '30px', zIndex: 3 } }, '✨🥚✨'),
          ]),
          h('p', {
            style: { margin: '4px 0 0 0', fontWeight: 'bold', fontSize: '12px', color: CORDEL_PALETTE.terracota },
          }, 'Ninho Mítico com Ovo Mítico & Aura Mística em Xilogravura'),
        ]),
        h('div', { 'data-testid': 'chocadeira-pity-progress', style: { margin: '10px 0' } }, [
          h('div', {
            style: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' },
          }, [
            h('span', { 'data-testid': 'chocadeira-pity-label' }, `${pity.value}/80 (Garantido no 80)`),
            h('span', {
              style: { color: isSoftPity ? CORDEL_PALETTE.vermelhoCrista : CORDEL_PALETTE.tintaXilo },
            }, isSoftPity ? `Soft Pity Ativo (${legRate}% Lendário)` : 'Soft Pity no tiro 61 (+5%/tiro)'),
          ]),
          h('div', {
            style: { height: '14px', width: '100%', backgroundColor: '#E0D4BA', border: '2px solid #1B1B1B', borderRadius: '4px', overflow: 'hidden' },
          }, [
            h('div', {
              'data-testid': 'chocadeira-pity-bar-fill',
              style: {
                width: `${pityPct}%`, height: '100%',
                backgroundColor: isSoftPity ? CORDEL_PALETTE.vermelhoCrista : CORDEL_PALETTE.amareloMilho,
                transition: 'width 0.3s ease',
              },
            }),
          ]),
        ]),
        h('div', {
          'data-testid': 'chocadeira-drop-rates',
          style: {
            display: 'flex', justifyContent: 'space-around', padding: '6px', margin: '8px 0',
            backgroundColor: '#F5EEDB', border: '1px dashed #1B1B1B', fontSize: '12px', fontWeight: 'bold',
          },
        }, [
          h('span', { style: { color: CORDEL_PALETTE.vermelhoCrista } }, `Lendário ${CHOCADEIRA_DROP_RATES.legendary}%`),
          h('span', { style: { color: CORDEL_PALETTE.terracota } }, `Épico ${CHOCADEIRA_DROP_RATES.epic}%`),
          h('span', { style: { color: '#2B547E' } }, `Raro ${CHOCADEIRA_DROP_RATES.rare}%`),
          h('span', { style: { color: '#555555' } }, `Comum ${CHOCADEIRA_DROP_RATES.common}%`),
        ]),
        h('div', { style: { display: 'flex', gap: '10px', marginTop: '10px' } }, [
          h('button', {
            type: 'button',
            'data-testid': 'btn-chocar-1',
            style: {
              flex: 1, backgroundColor: CORDEL_PALETTE.amareloMilho, color: CORDEL_PALETTE.tintaXilo,
              border: '2px solid #1B1B1B', padding: '10px', fontWeight: 'bold', cursor: 'pointer',
            },
            onClick: () => handlePull(1, 100),
          }, 'CHOCAR 1 (100 Penas)'),
          h('button', {
            type: 'button',
            'data-testid': 'btn-chocar-10',
            style: {
              flex: 1, backgroundColor: CORDEL_PALETTE.vermelhoCrista, color: CORDEL_PALETTE.cremePapel,
              border: '2px solid #1B1B1B', padding: '10px', fontWeight: 'bold', cursor: 'pointer',
            },
            onClick: () => handlePull(10, 900),
          }, 'CHOCAR 10 (900 Penas)'),
        ]),
        h('p', {
          'data-testid': 'chocadeira-pull-result',
          style: {
            margin: '10px 0 0 0', fontSize: '13px', fontWeight: 'bold', textAlign: 'center',
            color: CORDEL_PALETTE.tintaXilo,
          },
        }, lastResult.value),
      ]);
    };
  },
});
