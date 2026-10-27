import { defineComponent, h, ref, type PropType } from 'vue';
import { cordelAudio } from '../../services/AudioService.js';
import type { WebRuntime } from '../createWebRuntime.js';
import { PlayableVillageCanvas } from '../../canvas/scenes/farm/PlayableVillageCanvas.js';

export type VillageBuildingId = 'sede' | 'milharal' | 'poleiro' | 'torres' | 'treino' | 'enfermaria';

interface BuildingDef {
  id: VillageBuildingId;
  name: string;
  icon: string;
  levelText: string;
  desc: string;
  bubbleText?: string;
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

    const handleSelect = (id: VillageBuildingId | string) => {
      selected.value = id as VillageBuildingId;
      cordelAudio.playZabumbaTabSwitch();
    };

    const handleHarvestCorn = () => {
      props.onHarvest();
    };

    return () => {
      const buildings: BuildingDef[] = [
        { id: 'sede', name: 'Casarão da Sede', icon: '🏛️', levelText: `Nv. ${props.sedeLevel}`, desc: `Teto NG: ${props.sedeLevel * 5} | Sede da Vila` },
        { id: 'milharal', name: 'Milharal Fértil', icon: '🌽', levelText: 'Mina Nv. 12', desc: 'Produção contínua de grãos para alimentar o arraial', bubbleText: `+${props.harvestReadyCorn}` },
        { id: 'poleiro', name: 'Poleiros Rurais', icon: '🪵', levelText: '4 Habitats', desc: 'Alojamento das aves com cofres de grãos' },
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
          padding: '10px', marginBottom: '14px', boxSizing: 'border-box',
        },
      }, [
        h(PlayableVillageCanvas, {
          sedeLevel: props.sedeLevel,
          harvestReadyCorn: props.harvestReadyCorn,
          selectedBuilding: selected.value,
          onSelectBuilding: handleSelect,
          onHarvest: handleHarvestCorn,
        }),
        h('div', {
          class: 'coc-quick-selector',
          style: { display: 'flex', gap: '6px', overflowX: 'auto', padding: '4px 0 8px 0' },
        }, buildings.map((b) => {
          const isSel = selected.value === b.id;
          return h('button', {
            key: b.id, type: 'button', 'data-testid': `coc-building-${b.id}`,
            class: `coc-building-tile ${isSel ? 'is-selected' : ''}`,
            style: {
              flex: '1 0 auto', minWidth: '54px', padding: '5px 4px',
              background: isSel ? 'linear-gradient(180deg, #5A3517 0%, #2E1708 100%)' : 'linear-gradient(180deg, #2D1A10 0%, #150C07 100%)',
              border: isSel ? '2px solid #FFE066' : '1.5px solid #6B3E1A',
              borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
            },
            onClick: () => handleSelect(b.id),
          }, [
            h('div', { style: { fontSize: '18px', lineHeight: 1 } }, b.icon),
            h('div', { style: { fontSize: '9px', fontWeight: 'bold', color: isSel ? '#FFE066' : '#E2E8F0', marginTop: '2px' } }, b.name.split(' ')[0]),
          ]);
        })),
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
