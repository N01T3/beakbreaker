import { defineComponent, h, type PropType } from 'vue';
import { CORDEL_BORDERS, CORDEL_PALETTE, CORDEL_TYPOGRAPHY } from '../tokens/cordelTokens.js';

export type ResourceCurrencyType =
  | 'milho'
  | 'penasDouradas'
  | 'coroas'
  | 'folego'
  | 'orbes'
  | 'poDeAco';

export interface ResourcePillProps {
  currency: ResourceCurrencyType;
  amount: number;
  cap?: number;
  showPlusButton?: boolean;
}

export interface ResourcePillModel {
  currency: ResourceCurrencyType;
  label: string;
  formattedValue: string;
  accentColor: string;
  backgroundColor: string;
  borderClass: string;
  fontFamily: string;
  showPlusButton: boolean;
}

const CURRENCY_LABELS: Record<ResourceCurrencyType, string> = {
  milho: 'Milho',
  penasDouradas: 'Penas Douradas',
  coroas: 'Coroas',
  folego: 'Fôlego',
  orbes: 'Orbes',
  poDeAco: 'Pó de Aço',
};

const CURRENCY_ACCENTS: Record<ResourceCurrencyType, string> = {
  milho: CORDEL_PALETTE.amareloMilho,
  penasDouradas: '#F59E0B',
  coroas: CORDEL_PALETTE.vermelhoCrista,
  folego: CORDEL_PALETTE.verdeMata,
  orbes: CORDEL_PALETTE.azulAnil,
  poDeAco: CORDEL_PALETTE.terracota,
};

export function formatCordelNumber(val: number): string {
  const safe = Math.max(0, Math.floor(val));
  if (safe >= 1_000_000) {
    return `${(safe / 1_000_000).toFixed(1)}M`;
  }
  if (safe >= 10_000) {
    return `${(safe / 1_000).toFixed(1)}K`;
  }
  return safe.toString();
}

export function buildResourcePill(props: ResourcePillProps): ResourcePillModel {
  const baseText = formatCordelNumber(props.amount);
  const formattedValue =
    props.cap !== undefined ? `${baseText}/${formatCordelNumber(props.cap)}` : baseText;

  return {
    currency: props.currency,
    label: CURRENCY_LABELS[props.currency],
    formattedValue,
    accentColor: CURRENCY_ACCENTS[props.currency],
    backgroundColor: CORDEL_PALETTE.cremePapel,
    borderClass: CORDEL_BORDERS.xiloFrame,
    fontFamily: CORDEL_TYPOGRAPHY.bodyFont,
    showPlusButton: Boolean(props.showPlusButton),
  };
}

export const ResourcePill = defineComponent({
  name: 'ResourcePill',
  props: {
    currency: { type: String as PropType<ResourceCurrencyType>, required: true },
    amount: { type: Number, required: true },
    cap: { type: Number, default: undefined },
    showPlusButton: { type: Boolean, default: false },
  },
  emits: ['add'],
  setup(props, { emit }) {
    return () => {
      const model = buildResourcePill(props);
      return h(
        'div',
        {
          class: `resource-pill resource-pill--${model.currency} ${model.borderClass}`,
          style: {
            backgroundColor: model.backgroundColor,
            fontFamily: model.fontFamily,
          },
        },
        [
          h('span', {
            class: 'resource-pill__dot',
            style: { backgroundColor: model.accentColor },
          }),
          h('span', { class: 'resource-pill__label' }, model.label),
          h('strong', { class: 'resource-pill__value' }, model.formattedValue),
          model.showPlusButton
            ? h(
                'button',
                {
                  type: 'button',
                  class: 'resource-pill__plus',
                  onClick: () => emit('add', model.currency),
                },
                '+',
              )
            : null,
        ],
      );
    };
  },
});
