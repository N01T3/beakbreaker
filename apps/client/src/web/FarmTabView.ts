import { defineComponent, h, type PropType } from 'vue';
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
    const handleHarvestAll = () => {
      cordelAudio.playTrianguloReward();
      if (props.runtime.state.storedPerchMilho <= 0) props.runtime.refillPerches();
      const harvested = props.runtime.harvestFarm();
      props.onAddMilho(harvested);
    };

    const handleUpgradeSede = () => {
      const next = Math.min(12, props.runtime.farm.getScene().getSedeLevel() + 1);
      const res = props.runtime.farm.upgradeSede(next);
      props.onUpgradeSede(res.sedeLevel);
    };

    return () => {
      const perches = props.runtime.farm.getScene().getAllPerches();
      const sedeLevel = props.runtime.farm.getScene().getSedeLevel();
      const maxNg = props.runtime.farm.getScene().getMaxRoosterNgCap();

      return h(CordelWoodFrame, {
        title: 'Fazenda Viva 2.0 — Arraial Sertanejo',
        subtitle: `Sede Nível ${sedeLevel} (Teto NG ${maxNg}) | Poleiros Elementais & 4 Torres dos Santos Padroeiros`,
      }, {
        default: () => [
          h('div', { 'data-testid': 'tab-content-fazenda' }, [
            h('div', {
              class: 'cordel-card farm-backdrop-hero',
              'data-testid': 'farm-backdrop-hero',
              style: {
                position: 'relative', padding: '0', overflow: 'hidden',
                border: '3px solid #1B1B1B', boxShadow: '4px 4px 0 #1B1B1B',
                borderRadius: '6px', marginBottom: '12px', backgroundColor: CORDEL_PALETTE.tintaXilo,
              },
            }, [
              h('img', {
                src: '/assets/pranchas/fazenda-viva-backdrop.webp',
                alt: 'Fazenda Viva 2.0 Sertaneja',
                'data-testid': 'farm-backdrop-img',
                style: { width: '100%', height: '170px', objectFit: 'cover', display: 'block' },
              }),
              h('div', {
                class: 'farm-backdrop-overlay',
                'data-testid': 'farm-backdrop-overlay',
                style: {
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(27,27,27,0.85) 0%, rgba(27,27,27,0.15) 60%)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                  padding: '10px 12px', color: CORDEL_PALETTE.cremePapel,
                },
              }, [
                h('span', { style: { fontWeight: '900', fontSize: '15px', color: CORDEL_PALETTE.amareloMilho } }, '🌾 Fazenda Viva 2.0 — Vila Sertaneja'),
                h('span', { class: 'cordel-badge', style: { backgroundColor: CORDEL_PALETTE.vermelhoCrista, color: CORDEL_PALETTE.cremePapel } }, `Sede Nv. ${sedeLevel}`),
              ]),
            ]),
            h(InteractiveVillageMap, {
              runtime: props.runtime,
              sedeLevel,
              harvestReadyCorn: props.runtime.state.storedPerchMilho > 0 ? props.runtime.state.storedPerchMilho : 1200,
              onHarvest: handleHarvestAll,
              onUpgradeSede: handleUpgradeSede,
            }),
            h(FarmMilharalBanner, {
              'data-testid': 'farm-milharal-banner',
              runtime: props.runtime,
              trainerLevel: 12,
              cornAmount: props.runtime.state.storedPerchMilho > 0 ? props.runtime.state.storedPerchMilho : 1200,
              harvestReadyCorn: props.runtime.state.storedPerchMilho > 0 ? props.runtime.state.storedPerchMilho : 1200,
              onHarvest: handleHarvestAll,
            }),
            h('div', { class: 'cordel-card', 'data-testid': 'sede-panel' }, [
              h('h3', { 'data-testid': 'sede-level-display' }, `Sede da Fazenda: Nível ${sedeLevel} | Teto NG ${maxNg}`),
              h('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap' } }, [
                h('button', {
                  type: 'button', 'data-testid': 'btn-harvest-all',
                  style: { backgroundColor: CORDEL_PALETTE.amareloMilho, border: '2px solid #1B1B1B', padding: '10px 16px', fontWeight: 'bold' },
                  onClick: handleHarvestAll,
                }, `Colher Tudo (${props.runtime.state.storedPerchMilho} Milho nos Poleiros)`),
                h('button', {
                  type: 'button', 'data-testid': 'btn-upgrade-sede',
                  style: { backgroundColor: CORDEL_PALETTE.verdeMata, color: CORDEL_PALETTE.cremePapel, border: '2px solid #1B1B1B', padding: '10px 16px', fontWeight: 'bold' },
                  onClick: handleUpgradeSede,
                }, 'Evoluir Sede (+5 Teto NG)'),
              ]),
              props.runtime.state.lastHarvestedMilho > 0
                ? h('p', { 'data-testid': 'harvest-feedback', style: { fontWeight: 'bold' } }, `Colheita realizada: +${props.runtime.state.lastHarvestedMilho} Milho!`)
                : null,
            ]),
            h('div', { class: 'cordel-card', 'data-testid': 'poleiros-section' }, [
              h('h3', { style: { margin: '0 0 10px 0' } }, '🐓 Poleiros Elementais & Cofres'),
              h('div', { class: 'cordel-grid' }, perches.map((perch) => {
                const occ = perch.getRoosters().length;
                const max = perch.getMaxRoosterSlots();
                const cap = perch.getStorageVaultCap();
                return h('div', {
                  key: perch.perchId,
                  'data-testid': `perch-card-${perch.perchId}`,
                  class: 'cordel-card',
                  style: { margin: 0, padding: '8px' },
                }, [
                  h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
                    h('strong', `${perch.habitatType} (Nv. ${perch.level})`),
                    h('span', { class: 'cordel-badge', style: { fontSize: '10px', padding: '1px 4px' } }, occ >= max ? 'Lotado' : `${max - occ} vagas`),
                  ]),
                  h('p', { 'data-testid': 'perch-occupancy', style: { margin: '4px 0', fontSize: '12px' } },
                    `Aves alojadas: ${occ}/${max} | Cofre: ${cap} Milho`),
                  h('div', { 'data-testid': 'perch-vault-status', style: { fontSize: '11px', color: CORDEL_PALETTE.terracota, fontWeight: 'bold' } },
                    `🌽 Milho acumulado: ${perch.storedMilho}/${cap}`),
                ]);
              })),
            ]),
            h('div', { class: 'cordel-card', 'data-testid': 'saint-towers-panel' }, [
              h('h3', '4 Torres dos Santos Padroeiros'),
              h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
                SAINT_TOWERS.map((tower, idx) => {
                  const active = props.runtime.state.unlockedTowers.includes(tower);
                  return h('button', {
                    key: tower, type: 'button', 'data-testid': `btn-saint-tower-${idx + 1}`,
                    style: {
                      backgroundColor: active ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.cremePapel,
                      border: '2px solid #1B1B1B', padding: '6px 12px', fontWeight: 'bold',
                    },
                    onClick: () => props.runtime.unlockTower(tower),
                  }, `${tower} ${active ? '(Ativa)' : '(Erguer)'}`);
                }),
              ),
            ]),
            h(BarnTrainingPanel, { runtime: props.runtime }),
            h(InfirmaryPotionsPanel, { runtime: props.runtime }),
            h(PvpRaidDefensePanel, { runtime: props.runtime }),
            h(CordelChallengesPredatorsPanel, { runtime: props.runtime }),
          ]),
        ],
      });
    };
  },
});