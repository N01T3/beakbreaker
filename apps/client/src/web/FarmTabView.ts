import { defineComponent, h, ref, type PropType } from 'vue';
import { CORDEL_PALETTE, CordelWoodFrame } from '@beakbreaker/ui-cordel';
import type { WebRuntime } from './createWebRuntime.js';
import type { SaintTowerId } from '../canvas/scenes/farm/IsoFarmScene.js';
import { cordelAudio } from '../services/AudioService.js';
import { FarmMilharalBanner } from './panels/FarmMilharalBanner.js';
import { InteractiveVillageMap } from './panels/InteractiveVillageMap.js';
import { PvpRaidDefensePanel } from './panels/PvpRaidDefensePanel.js';
import { BarnTrainingPanel } from './panels/BarnTrainingPanel.js';
import { InfirmaryPotionsPanel } from './panels/InfirmaryPotionsPanel.js';
import { CordelChallengesPredatorsPanel } from './panels/CordelChallengesPredatorsPanel.js';

const SAINT_TOWERS: readonly SaintTowerId[] = [
  'Torre de São Jorge', 'Torre de Padre Cícero', 'Torre de São João', 'Torre de Santa Luzia',
] as const;

export const FarmTabView = defineComponent({
  name: 'FarmTabView',
  props: {
    runtime: { type: Object as PropType<WebRuntime>, required: true },
    onAddMilho: { type: Function as PropType<(amount: number) => void>, required: true },
    onUpgradeSede: { type: Function as PropType<(level: number) => void>, required: true },
  },
  setup(props) {
    const activeSubTab = ref<'vila' | 'estruturas' | 'defesa'>('vila');

    const handleHarvestAll = () => {
      cordelAudio.playTrianguloReward();
      if (props.runtime.state.storedPerchMilho <= 0) props.runtime.refillPerches();
      props.onAddMilho(props.runtime.harvestFarm());
    };
    const handleUpgradeSede = () => {
      const next = Math.min(12, props.runtime.farm.getScene().getSedeLevel() + 1);
      props.onUpgradeSede(props.runtime.farm.upgradeSede(next).sedeLevel);
    };

    return () => {
      const perches = props.runtime.farm.getScene().getAllPerches();
      const sedeLevel = props.runtime.farm.getScene().getSedeLevel();
      const maxNg = props.runtime.farm.getScene().getMaxRoosterNgCap();
      const cornReady = props.runtime.state.storedPerchMilho > 0 ? props.runtime.state.storedPerchMilho : 1200;

      return h(CordelWoodFrame, {
        title: 'Fazenda Viva 2.0 — Arraial Sertanejo',
        subtitle: `Sede Nível ${sedeLevel} (Teto NG ${maxNg}) | Poleiros Elementais & 4 Torres dos Santos`,
      }, {
        default: () => [
          h('div', { 'data-testid': 'tab-content-fazenda' }, [
            h('div', { style: { display: 'flex', gap: '6px', marginBottom: '10px', overflowX: 'auto' } }, [
              { id: 'vila', label: '🌾 Vila & Milharal' },
              { id: 'estruturas', label: '🏋️ Treino & Botica' },
              { id: 'defesa', label: '🛡️ Defesa & Predadores' },
            ].map((st) => h('button', {
              key: st.id, type: 'button', 'data-testid': `farm-subtab-${st.id}`,
              class: `game-btn ${activeSubTab.value === st.id ? 'btn-gold' : ''}`,
              style: {
                flex: '1 0 auto', padding: '6px 10px', fontSize: '11px',
                backgroundColor: activeSubTab.value === st.id ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.cremePapel,
                color: CORDEL_PALETTE.tintaXilo, border: '2px solid #1B1B1B',
              },
              onClick: () => { activeSubTab.value = st.id as any; cordelAudio.playZabumbaTabSwitch(); },
            }, st.label))),
            h('div', { style: { display: activeSubTab.value === 'vila' ? 'block' : 'none' } }, [
              h('div', {
                class: 'cordel-card farm-backdrop-hero', 'data-testid': 'farm-backdrop-hero',
                style: { position: 'relative', padding: '0', overflow: 'hidden', border: '3px solid #1B1B1B', borderRadius: '6px', marginBottom: '10px' },
              }, [
                h('img', { src: '/assets/pranchas/fazenda-viva-backdrop.webp', alt: 'Fazenda Backdrop', 'data-testid': 'farm-backdrop-img', style: { width: '100%', height: '140px', objectFit: 'cover', display: 'block' } }),
                h('div', { class: 'farm-backdrop-overlay', 'data-testid': 'farm-backdrop-overlay', style: { position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(27,27,27,0.85) 0%, transparent 60%)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '8px 10px' } }, [
                  h('span', { style: { fontWeight: '900', fontSize: '14px', color: CORDEL_PALETTE.amareloMilho } }, '🌾 Arraial Sertanejo 2.5D'),
                  h('span', { class: 'cordel-badge', style: { backgroundColor: CORDEL_PALETTE.vermelhoCrista, color: '#FFF' } }, `Sede Nv. ${sedeLevel}`),
                ]),
              ]),
              h(InteractiveVillageMap, { runtime: props.runtime, sedeLevel, harvestReadyCorn: cornReady, onHarvest: handleHarvestAll, onUpgradeSede: handleUpgradeSede }),
              h(FarmMilharalBanner, { 'data-testid': 'farm-milharal-banner', runtime: props.runtime, trainerLevel: 12, cornAmount: cornReady, harvestReadyCorn: cornReady, onHarvest: handleHarvestAll }),
              h('div', { class: 'cordel-card', 'data-testid': 'sede-panel' }, [
                h('h3', { 'data-testid': 'sede-level-display' }, `Sede da Fazenda: Nível ${sedeLevel} | Teto NG ${maxNg}`),
                h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } }, [
                  h('button', { type: 'button', 'data-testid': 'btn-harvest-all', class: 'game-btn btn-green', style: { padding: '8px 12px' }, onClick: handleHarvestAll }, `Colher Tudo (${props.runtime.state.storedPerchMilho} Milho)`),
                  h('button', { type: 'button', 'data-testid': 'btn-upgrade-sede', class: 'game-btn btn-gold', style: { padding: '8px 12px' }, onClick: handleUpgradeSede }, 'Evoluir Sede (+5 NG)'),
                ]),
                props.runtime.state.lastHarvestedMilho > 0 ? h('p', { 'data-testid': 'harvest-feedback', style: { fontWeight: 'bold' } }, `+${props.runtime.state.lastHarvestedMilho} Milho!`) : null,
              ]),
              h('div', { class: 'cordel-card', 'data-testid': 'poleiros-section' }, [
                h('h3', { style: { margin: '0 0 8px 0' } }, '🐓 Poleiros Elementais & Cofres'),
                h('div', { class: 'cordel-grid' }, perches.map((perch) => {
                  const occ = perch.getRoosters().length;
                  const max = perch.getMaxRoosterSlots();
                  const cap = perch.getStorageVaultCap();
                  return h('div', { key: perch.perchId, 'data-testid': `perch-card-${perch.perchId}`, class: 'cordel-card', style: { padding: '8px' } }, [
                    h('strong', `${perch.habitatType} (Nv. ${perch.level})`),
                    h('p', { 'data-testid': 'perch-occupancy', style: { margin: '2px 0', fontSize: '12px' } }, `Aves: ${occ}/${max} | Cofre: ${cap}`),
                    h('div', { 'data-testid': 'perch-vault-status', style: { fontSize: '11px', color: CORDEL_PALETTE.terracota, fontWeight: 'bold' } }, `🌽 ${perch.storedMilho}/${cap} Milho`),
                  ]);
                })),
              ]),
              h('div', { class: 'cordel-card', 'data-testid': 'saint-towers-panel' }, [
                h('h3', '4 Torres dos Santos Padroeiros'),
                h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } },
                  SAINT_TOWERS.map((tower, idx) => {
                    const active = props.runtime.state.unlockedTowers.includes(tower);
                    return h('button', { key: tower, type: 'button', 'data-testid': `btn-saint-tower-${idx + 1}`, class: `game-btn ${active ? 'btn-gold' : ''}`, style: { padding: '6px 10px' }, onClick: () => props.runtime.unlockTower(tower) }, `${tower} ${active ? '✓' : '+'}`);
                  }),
                ),
              ]),
            ]),
            h('div', { style: { display: activeSubTab.value === 'estruturas' ? 'block' : 'none' } }, [
              h(BarnTrainingPanel, { runtime: props.runtime }),
              h(InfirmaryPotionsPanel, { runtime: props.runtime }),
            ]),
            h('div', { style: { display: activeSubTab.value === 'defesa' ? 'block' : 'none' } }, [
              h(PvpRaidDefensePanel, { runtime: props.runtime }),
              h(CordelChallengesPredatorsPanel, { runtime: props.runtime }),
            ]),
          ]),
        ],
      });
    };
  },
});
