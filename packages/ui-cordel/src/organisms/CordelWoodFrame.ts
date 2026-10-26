import { defineComponent, h } from 'vue';
import { CORDEL_BORDERS, CORDEL_PALETTE, CORDEL_TYPOGRAPHY } from '../tokens/cordelTokens.js';

export interface CordelWoodFrameProps {
  title: string;
  subtitle?: string;
  showBuntingFlags?: boolean;
  showSideRope?: boolean;
  closable?: boolean;
}

export interface CordelWoodFrameModel {
  title: string;
  subtitle?: string;
  borderClass: string;
  backgroundColor: string;
  inkColor: string;
  ropeColor: string;
  titleFontFamily: string;
  showBuntingFlags: boolean;
  showSideRope: boolean;
  closable: boolean;
  buntingFlagColors: readonly string[];
}

export const SAO_JOAO_FLAG_COLORS = [
  CORDEL_PALETTE.vermelhoCrista,
  CORDEL_PALETTE.amareloMilho,
  CORDEL_PALETTE.verdeMata,
  CORDEL_PALETTE.azulAnil,
  CORDEL_PALETTE.terracota,
] as const;

export function buildCordelWoodFrame(props: CordelWoodFrameProps): CordelWoodFrameModel {
  return {
    title: props.title,
    subtitle: props.subtitle,
    borderClass: CORDEL_BORDERS.xiloFrame,
    backgroundColor: CORDEL_PALETTE.cremePapel,
    inkColor: CORDEL_PALETTE.tintaXilo,
    ropeColor: CORDEL_PALETTE.terracota,
    titleFontFamily: CORDEL_TYPOGRAPHY.woodcutSerif,
    showBuntingFlags: props.showBuntingFlags ?? true,
    showSideRope: props.showSideRope ?? true,
    closable: Boolean(props.closable),
    buntingFlagColors: SAO_JOAO_FLAG_COLORS,
  };
}

export const CordelWoodFrame = defineComponent({
  name: 'CordelWoodFrame',
  props: {
    title: { type: String, required: true },
    subtitle: { type: String, default: undefined },
    showBuntingFlags: { type: Boolean, default: true },
    showSideRope: { type: Boolean, default: true },
    closable: { type: Boolean, default: false },
  },
  emits: ['close'],
  setup(props, { slots, emit }) {
    return () => {
      const model = buildCordelWoodFrame(props);
      return h(
        'section',
        {
          class: `cordel-wood-frame ${model.borderClass}`,
          style: {
            backgroundColor: model.backgroundColor,
            color: model.inkColor,
            boxShadow: CORDEL_BORDERS.xiloShadow,
          },
        },
        [
          model.showBuntingFlags
            ? h(
                'div',
                { class: 'cordel-wood-frame__flags' },
                model.buntingFlagColors.map((flagColor, idx) =>
                  h('span', {
                    key: idx,
                    class: 'cordel-wood-frame__flag',
                    style: { backgroundColor: flagColor },
                  }),
                ),
              )
            : null,
          model.showSideRope
            ? h('div', {
                class: 'cordel-wood-frame__side-rope',
                style: { borderColor: model.ropeColor },
              })
            : null,
          h('header', { class: 'cordel-wood-frame__header' }, [
            h(
              'h2',
              {
                class: 'cordel-wood-frame__title',
                style: { fontFamily: model.titleFontFamily },
              },
              model.title,
            ),
            model.subtitle
              ? h('p', { class: 'cordel-wood-frame__subtitle' }, model.subtitle)
              : null,
            model.closable
              ? h(
                  'button',
                  {
                    type: 'button',
                    class: 'cordel-wood-frame__close',
                    onClick: () => emit('close'),
                  },
                  'X',
                )
              : null,
          ]),
          h('div', { class: 'cordel-wood-frame__body' }, slots.default ? slots.default() : []),
        ],
      );
    };
  },
});
