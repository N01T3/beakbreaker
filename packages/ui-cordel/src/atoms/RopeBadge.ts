import { defineComponent, h, type PropType } from 'vue';
import {
  CORDEL_BORDERS,
  CORDEL_PALETTE,
  CORDEL_TYPOGRAPHY,
  ELEMENT_COLORS,
  RARITY_COLORS,
  type CordelElementType,
  type CordelRarity,
} from '../tokens/cordelTokens.js';

export type RopeBadgeKind = 'element' | 'rarity' | 'class' | 'custom';

export interface RopeBadgeProps {
  text: string;
  kind?: RopeBadgeKind;
  element?: CordelElementType;
  rarity?: CordelRarity;
  icon?: string;
}

export interface RopeBadgeModel {
  text: string;
  kind: RopeBadgeKind;
  backgroundColor: string;
  textColor: string;
  borderClass: string;
  ropeAccentColor: string;
  fontFamily: string;
  icon?: string;
}

export function buildRopeBadge(props: RopeBadgeProps): RopeBadgeModel {
  const kind = props.kind ?? 'custom';
  let backgroundColor: string = CORDEL_PALETTE.terracota;

  if (kind === 'element' && props.element) {
    backgroundColor = ELEMENT_COLORS[props.element];
  } else if (kind === 'rarity' && props.rarity) {
    backgroundColor = RARITY_COLORS[props.rarity];
  } else if (kind === 'class') {
    backgroundColor = CORDEL_PALETTE.tintaXilo;
  }

  const isLightBg = backgroundColor === CORDEL_PALETTE.amareloMilho;

  return {
    text: props.text,
    kind,
    backgroundColor,
    textColor: isLightBg ? CORDEL_PALETTE.tintaXilo : CORDEL_PALETTE.cremePapel,
    borderClass: CORDEL_BORDERS.xiloFrame,
    ropeAccentColor: CORDEL_PALETTE.terracota,
    fontFamily: CORDEL_TYPOGRAPHY.woodcutSerif,
    icon: props.icon,
  };
}

export const RopeBadge = defineComponent({
  name: 'RopeBadge',
  props: {
    text: { type: String, required: true },
    kind: { type: String as PropType<RopeBadgeKind>, default: 'custom' },
    element: { type: String as PropType<CordelElementType>, default: undefined },
    rarity: { type: String as PropType<CordelRarity>, default: undefined },
    icon: { type: String, default: undefined },
  },
  setup(props) {
    return () => {
      const model = buildRopeBadge(props);
      return h(
        'span',
        {
          class: `rope-badge rope-badge--${model.kind} ${model.borderClass}`,
          style: {
            backgroundColor: model.backgroundColor,
            color: model.textColor,
            fontFamily: model.fontFamily,
            outline: `2px dashed ${model.ropeAccentColor}`,
          },
        },
        [
          model.icon ? h('span', { class: 'rope-badge__icon' }, model.icon) : null,
          h('span', { class: 'rope-badge__text' }, model.text),
        ],
      );
    };
  },
});
