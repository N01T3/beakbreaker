import { defineComponent, h, ref, type PropType } from 'vue';
import { cordelAudio } from '../../services/AudioService.js';
import type { WebRuntime } from '../createWebRuntime.js';

export type VillageBuildingId = 'sede' | 'milharal' | 'poleiro' | 'torres' | 'treino' | 'enfermaria';

interface BuildingDef {
  id: VillageBuildingId;
  name: string;
  icon: string;
  levelText: string;
  desc: string;
  hasBubble?: boolean;
  bubbleText?: string;
  bubbleIcon?: string;
}

export const InteractiveVillageMap = defineComponent({
  name: 'InteractiveVillageMap',
  props: {
    runtime: { type: Object as PropType<WebRuntime>, required: true },
    sedeLevel: { type: Number, default: 12 },
    harvestReadyCorn: { type: Number, default: 1200 },
    onHarvest: { type: Function as PropType<() => void>, required: true },
    onUpgradeSede: { type: Function as PropType<() => void>, required: true },
  },
  setup(props) {
    const selected = ref<VillageBuildingId>('milharal');
    const harvestAnim = ref(false);

    const handleSelect = (id: VillageBuildingId) => {
      selected.value = id;
      cordelAudio.playZabumbaTabSwitch();
    };

    const handleHarvestCorn = () => {
      harvestAnim.value = true;
      props.onHarvest();
      setTimeout(() => { harvestAnim.value = false; }, 800);
    };

    return () => {
      const buildings: BuildingDef[] = [
        { id: 'sede', name: 'Casarão da Sede', icon: '🏛️', levelText: `Nv. ${props.sedeLevel}`, desc: `Teto NG: ${props.sedeLevel * 5} | Sede da Vila`, hasBubble: true, bubbleIcon: '👑', bubbleText: 'Vila Pronta' },
        { id: 'milharal', name: 'Milharal Fértil', icon: '🌽', levelText: 'Mina Nv. 12', desc: 'Produção contínua de grãos para alimentar o arraial', hasBubble: true, bubbleIcon: '🌽', bubbleText: `+${props.harvestReadyCorn} Milho` },
        { id: 'poleiro', name: 'Poleiros Elementais', icon: '🪵', levelText: '4 Habitats', desc: 'Alojamento das aves com cofres de grãos', hasBubble: true, bubbleIcon: '🐓', bubbleText: 'Aves Vivas' },
        { id: 'torres', name: 'Torres dos Santos', icon: '⛪', levelText: '4 Padroeiros', desc: 'Defesa rural espiritual contra invasores' },
        { id: 'treino', name: 'Centro de Treino', icon: '🏋️', levelText: 'Arena Rural', desc: 'Treino de agilidade, postura e força no terreiro' },
        { id: 'enfermaria', name: 'Enfermaria do Sertão', icon: '🧪', levelText: '6 Poções', desc: 'Recuperação com garrafadas e ervas medicinais' },
      ];
      const activeDef = buildings.find((b) => b.id === selected.value) ?? buildings[0];

      return h('div', {
        class: 'coc-village-container', 'data-testid': 'coc-village-container',
        style: {
          position: 'relative', width: '100%', borderRadius: '16px', overflow: 'hidden',
          border: '3px solid #854D0E', boxShadow: '0 8px 24px rgba(0,0,0,0.85)',
          background: 'radial-gradient(ellipse at 50% 40%, #446C2B 0%, #284417 60%, #172A0D 100%)',
          padding: '12px', marginBottom: '14px', boxSizing: 'border-box',
        },
      }, [
        h('div', {
          class: 'coc-terrain-grid',
          style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', position: 'relative', minHeight: '220px', alignItems: 'center' },
        }, buildings.map((b) => {
          const isSel = selected.value === b.id;
          return h('div', {
            key: b.id, 'data-testid': `coc-building-${b.id}`,
            class: `coc-building-tile ${isSel ? 'is-selected' : ''}`,
            style: {
              background: isSel ? 'linear-gradient(180deg, #5A3517 0%, #2E1708 100%)' : 'linear-gradient(180deg, #3A2213 0%, #1C0F06 100%)',
              border: isSel ? '2px solid #FFE066' : '2px solid #6B3E1A',
              boxShadow: isSel ? '0 0 14px rgba(255, 224, 102, 0.7), 0 4px 8px rgba(0,0,0,0.6)' : '0 4px 6px rgba(0,0,0,0.5)',
              borderRadius: '14px', padding: '10px 4px', textAlign: 'center', cursor: 'pointer',
              position: 'relative', transition: 'all 0.15s ease', transform: isSel ? 'translateY(-4px) scale(1.04)' : 'none',
            },
            onClick: () => handleSelect(b.id),
          }, [
            b.hasBubble ? h('div', {
              class: 'coc-floating-bubble pulse-badge',
              style: {
                position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                background: 'linear-gradient(180deg, #5BE139 0%, #15803D 100%)',
                border: '1.5px solid #86EFAC', borderRadius: '12px', padding: '2px 6px',
                color: '#FFF', fontSize: '10px', fontWeight: '900', whiteSpace: 'nowrap',
                boxShadow: '0 3px 6px rgba(0,0,0,0.5)', zIndex: 10,
              },
              onClick: (e: MouseEvent) => {
                e.stopPropagation();
                if (b.id === 'milharal') handleHarvestCorn();
                else handleSelect(b.id);
              },
            }, `${b.bubbleIcon} ${b.bubbleText}`) : null,
            h('div', { style: { fontSize: '32px', marginBottom: '2px', filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.6))' } }, b.icon),
            h('div', { style: { fontSize: '11px', fontWeight: '900', color: isSel ? '#FFE066' : '#FFF', textShadow: '0 1px 2px #000', lineHeight: 1.2 } }, b.name),
            h('span', { style: { display: 'inline-block', marginTop: '4px', background: 'rgba(0,0,0,0.6)', border: '1px solid #78350F', borderRadius: '6px', padding: '1px 5px', color: '#FDE047', fontSize: '9px', fontWeight: '700' } }, b.levelText),
          ]);
        })),
        h('div', {
          class: 'coc-roaming-lane',
          style: { margin: '8px 0', padding: '4px 8px', background: 'rgba(0,0,0,0.4)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px dashed #78350F' },
        }, [
          h('div', { style: { display: 'flex', alignItems: 'center', gap: '6px' } }, [
            h('img', { src: '/assets/roosters/trovao_sprite_transparent.png', alt: 'Galo Passeando', style: { width: '30px', height: '30px', objectFit: 'contain', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.7))' } }),
            h('span', { style: { fontSize: '11px', color: '#FEF08A', fontWeight: 'bold' } }, '🐓 Galo Trovão ciscando no terreiro'),
          ]),
          h('span', { style: { fontSize: '10px', color: '#86EFAC', fontWeight: 'bold' } }, '🌾 Clima Ensolarado'),
        ]),
        h('div', {
          class: 'coc-action-bar',
          style: {
            background: 'linear-gradient(180deg, #2D1A10 0%, #150C07 100%)',
            border: '2px solid #854D0E', borderRadius: '12px', padding: '8px 12px',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 10px rgba(0,0,0,0.7)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px',
          },
        }, [
          h('div', { style: { flex: '1' } }, [
            h('div', { style: { fontWeight: '900', fontSize: '13px', color: '#FFE066', textShadow: '0 1px 2px #000' } }, `${activeDef.icon} ${activeDef.name} (${activeDef.levelText})`),
            h('div', { style: { fontSize: '11px', color: '#D1B89D', marginTop: '1px' } }, activeDef.desc),
          ]),
          h('div', { style: { display: 'flex', gap: '6px' } }, [
            activeDef.id === 'milharal' || activeDef.id === 'poleiro' ? h('button', {
              type: 'button', class: 'game-btn btn-green', style: { padding: '8px 14px', fontSize: '12px' },
              onClick: handleHarvestCorn,
            }, '🌽 Colher') : null,
            activeDef.id === 'sede' ? h('button', {
              type: 'button', class: 'game-btn btn-gold', style: { padding: '8px 14px', fontSize: '12px' },
              onClick: props.onUpgradeSede,
            }, '⬆️ Evoluir Sede') : null,
          ]),
        ]),
      ]);
    };
  },
});
