import { defineComponent, h } from 'vue';
import { CORDEL_BORDERS, CORDEL_PALETTE } from '../tokens/cordelTokens.js';

export interface DualCombatBarProps {
  vigor: number;
  maxVigor: number;
  canto: number;
  maxCanto?: number;
  shield?: number;
}

export interface DualCombatBarModel {
  vigor: number;
  maxVigor: number;
  vigorPercent: number;
  vigorColor: string;
  shield: number;
  shieldPercent: number;
  canto: number;
  maxCanto: number;
  cantoPercent: number;
  cantoColor: string;
  isCantoFull: boolean;
  borderClass: string;
}

export function buildDualCombatBar(props: DualCombatBarProps): DualCombatBarModel {
  const maxVigor = Math.max(1, Math.floor(props.maxVigor));
  const vigor = Math.max(0, Math.min(maxVigor, Math.floor(props.vigor)));
  const vigorPercent = Math.round((vigor / maxVigor) * 100);

  const shield = Math.max(0, Math.floor(props.shield ?? 0));
  const shieldPercent = Math.min(100, Math.round((shield / maxVigor) * 100));

  const maxCanto = Math.max(1, Math.floor(props.maxCanto ?? 1000));
  const canto = Math.max(0, Math.min(maxCanto, Math.floor(props.canto)));
  const cantoPercent = Math.round((canto / maxCanto) * 100);
  const isCantoFull = canto >= maxCanto;

  const vigorColor =
    vigorPercent > 50
      ? CORDEL_PALETTE.verdeMata
      : vigorPercent > 25
        ? CORDEL_PALETTE.amareloMilho
        : CORDEL_PALETTE.vermelhoCrista;

  return {
    vigor,
    maxVigor,
    vigorPercent,
    vigorColor,
    shield,
    shieldPercent,
    canto,
    maxCanto,
    cantoPercent,
    cantoColor: isCantoFull ? CORDEL_PALETTE.vermelhoCrista : CORDEL_PALETTE.amareloMilho,
    isCantoFull,
    borderClass: CORDEL_BORDERS.xiloFrame,
  };
}

export const DualCombatBar = defineComponent({
  name: 'DualCombatBar',
  props: {
    vigor: { type: Number, required: true },
    maxVigor: { type: Number, required: true },
    canto: { type: Number, required: true },
    maxCanto: { type: Number, default: 1000 },
    shield: { type: Number, default: 0 },
  },
  setup(props) {
    return () => {
      const model = buildDualCombatBar(props);
      return h('div', { class: `dual-combat-bar ${model.borderClass}` }, [
        h('div', { class: 'dual-combat-bar__vigor-track' }, [
          h('div', {
            class: 'dual-combat-bar__vigor-fill',
            style: {
              width: `${model.vigorPercent}%`,
              backgroundColor: model.vigorColor,
            },
          }),
          model.shieldPercent > 0
            ? h('div', {
                class: 'dual-combat-bar__shield-fill',
                style: { width: `${model.shieldPercent}%` },
              })
            : null,
        ]),
        h('div', { class: 'dual-combat-bar__canto-track' }, [
          h('div', {
            class: `dual-combat-bar__canto-fill ${model.isCantoFull ? 'is-full' : ''}`,
            style: {
              width: `${model.cantoPercent}%`,
              backgroundColor: model.cantoColor,
            },
          }),
        ]),
      ]);
    };
  },
});
