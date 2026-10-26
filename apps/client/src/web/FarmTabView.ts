import { defineComponent, h, type PropType } from 'vue';
import { CORDEL_PALETTE, CordelWoodFrame } from '@beakbreaker/ui-cordel';
import type { WebRuntime } from './createWebRuntime.js';
import type { SaintTowerId } from '../canvas/scenes/farm/IsoFarmScene.js';
import { PvpRaidDefensePanel } from './panels/PvpRaidDefensePanel.js';

const SAINT_TOWERS: readonly SaintTowerId[] = [
  'Torre de São Jorge',
  'Torre de Padre Cícero',
  'Torre de São João',
  'Torre de Santa Luzia',
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
      if (props.runtime.state.storedPerchMilho <= 0) {
        props.runtime.refillPerches();
      }
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

      return h(
        CordelWoodFrame,
        {
          title: 'Fazenda Viva 2.0 — Arraial Sertanejo',
          subtitle: `Sede Nível ${sedeLevel} (Teto NG ${maxNg}) | Poleiros Elementais & 4 Torres dos Santos Padroeiros`,
        },
        {
          default: () => [
            h('div', { 'data-testid': 'tab-content-fazenda' }, [
              h('div', { class: 'cordel-card', 'data-testid': 'sede-panel' }, [
                h(
                  'h3',
                  { 'data-testid': 'sede-level-display' },
                  `Sede da Fazenda: Nível ${sedeLevel} | Teto NG ${maxNg}`,
                ),
                h(
                  'div',
                  { style: { display: 'flex', gap: '10px', flexWrap: 'wrap' } },
                  [
                    h(
                      'button',
                      {
                        type: 'button',
                        'data-testid': 'btn-harvest-all',
                        style: {
                          backgroundColor: CORDEL_PALETTE.amareloMilho,
                          border: '2px solid #1B1B1B',
                          padding: '10px 16px',
                          fontWeight: 'bold',
                        },
                        onClick: handleHarvestAll,
                      },
                      `Colher Tudo (${props.runtime.state.storedPerchMilho} Milho nos Poleiros)`,
                    ),
                    h(
                      'button',
                      {
                        type: 'button',
                        'data-testid': 'btn-upgrade-sede',
                        style: {
                          backgroundColor: CORDEL_PALETTE.verdeMata,
                          color: CORDEL_PALETTE.cremePapel,
                          border: '2px solid #1B1B1B',
                          padding: '10px 16px',
                          fontWeight: 'bold',
                        },
                        onClick: handleUpgradeSede,
                      },
                      'Evoluir Sede (+5 Teto NG)',
                    ),
                  ],
                ),
                props.runtime.state.lastHarvestedMilho > 0
                  ? h(
                      'p',
                      { 'data-testid': 'harvest-feedback', style: { fontWeight: 'bold' } },
                      `Colheita realizada: +${props.runtime.state.lastHarvestedMilho} Milho!`,
                    )
                  : null,
              ]),
              h('div', { class: 'cordel-grid' }, [
                ...perches.map((perch) =>
                  h('div', { key: perch.perchId, class: 'cordel-card' }, [
                    h('strong', `${perch.habitatType} (Nv. ${perch.level})`),
                    h(
                      'p',
                      `Aves alojadas: ${perch.getRoosters().length}/${perch.getMaxRoosterSlots()} | Cofre: ${perch.getStorageVaultCap()} Milho`,
                    ),
                  ]),
                ),
              ]),
              h('div', { class: 'cordel-card', 'data-testid': 'saint-towers-panel' }, [
                h('h3', '4 Torres dos Santos Padroeiros'),
                h(
                  'div',
                  { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
                  SAINT_TOWERS.map((tower, idx) => {
                    const active = props.runtime.state.unlockedTowers.includes(tower);
                    return h(
                      'button',
                      {
                        key: tower,
                        type: 'button',
                        'data-testid': `btn-saint-tower-${idx + 1}`,
                        style: {
                          backgroundColor: active
                            ? CORDEL_PALETTE.amareloMilho
                            : CORDEL_PALETTE.cremePapel,
                          border: '2px solid #1B1B1B',
                          padding: '6px 12px',
                          fontWeight: 'bold',
                        },
                        onClick: () => props.runtime.unlockTower(tower),
                      },
                      `${tower} ${active ? '(Ativa)' : '(Erguer)'}`,
                    );
                  }),
                ),
              ]),
              h(PvpRaidDefensePanel, { runtime: props.runtime }),
            ]),
          ],
        },
      );
    };
  },
});
