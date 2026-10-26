import { defineComponent, h, type PropType } from 'vue';
import { CORDEL_BORDERS, CORDEL_PALETTE, CORDEL_TYPOGRAPHY } from '../tokens/cordelTokens.js';

export type CordelButtonVariant = 'primary' | 'secondary' | 'danger' | 'forest' | 'navy';
export type CordelButtonSize = 'sm' | 'md' | 'lg';

export interface CordelButtonProps {
  label: string;
  variant?: CordelButtonVariant;
  size?: CordelButtonSize;
  disabled?: boolean;
  badgeText?: string;
}

export interface CordelButtonModel {
  label: string;
  backgroundColor: string;
  textColor: string;
  borderClass: string;
  boxShadow: string;
  fontFamily: string;
  disabled: boolean;
  size: CordelButtonSize;
  badgeText?: string;
}

const VARIANT_BG: Record<CordelButtonVariant, string> = {
  primary: CORDEL_PALETTE.amareloMilho,
  secondary: CORDEL_PALETTE.cremePapel,
  danger: CORDEL_PALETTE.vermelhoCrista,
  forest: CORDEL_PALETTE.verdeMata,
  navy: CORDEL_PALETTE.azulAnil,
};

const VARIANT_TEXT: Record<CordelButtonVariant, string> = {
  primary: CORDEL_PALETTE.tintaXilo,
  secondary: CORDEL_PALETTE.tintaXilo,
  danger: CORDEL_PALETTE.cremePapel,
  forest: CORDEL_PALETTE.cremePapel,
  navy: CORDEL_PALETTE.cremePapel,
};

export function buildCordelButton(props: CordelButtonProps): CordelButtonModel {
  const variant = props.variant ?? 'primary';
  const size = props.size ?? 'md';
  const disabled = Boolean(props.disabled);

  return {
    label: props.label,
    backgroundColor: disabled ? '#9CA3AF' : VARIANT_BG[variant],
    textColor: disabled ? '#4B5563' : VARIANT_TEXT[variant],
    borderClass: CORDEL_BORDERS.xiloFrame,
    boxShadow: disabled ? 'none' : CORDEL_BORDERS.xiloShadow,
    fontFamily: CORDEL_TYPOGRAPHY.displayFont,
    disabled,
    size,
    badgeText: props.badgeText,
  };
}

export const CordelButton = defineComponent({
  name: 'CordelButton',
  props: {
    label: { type: String, required: true },
    variant: { type: String as PropType<CordelButtonVariant>, default: 'primary' },
    size: { type: String as PropType<CordelButtonSize>, default: 'md' },
    disabled: { type: Boolean, default: false },
    badgeText: { type: String, default: undefined },
  },
  emits: ['press'],
  setup(props, { emit }) {
    return () => {
      const model = buildCordelButton(props);
      return h(
        'button',
        {
          type: 'button',
          disabled: model.disabled,
          class: `cordel-btn cordel-btn--${model.size} ${model.borderClass}`,
          style: {
            backgroundColor: model.backgroundColor,
            color: model.textColor,
            boxShadow: model.boxShadow,
            fontFamily: model.fontFamily,
          },
          onClick: () => {
            if (!model.disabled) emit('press');
          },
        },
        [
          h('span', { class: 'cordel-btn__label' }, model.label),
          model.badgeText
            ? h('span', { class: 'cordel-btn__badge' }, model.badgeText)
            : null,
        ],
      );
    };
  },
});
