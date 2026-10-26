import { defineComponent, h } from 'vue';
import { CORDEL_BORDERS, CORDEL_PALETTE, CORDEL_TYPOGRAPHY } from '../tokens/cordelTokens.js';
import { buildResourcePill, ResourcePill } from '../atoms/ResourcePill.js';

export interface WoodcutHeaderProps {
  playerName: string;
  breederLevel: number;
  sedeLevel: number;
  milho: number;
  penasDouradas: number;
  coroas: number;
  folego: number;
  maxFolego?: number;
}

export interface WoodcutHeaderModel {
  playerName: string;
  breederBadge: string;
  sedeBadge: string;
  borderClass: string;
  backgroundColor: string;
  fontFamily: string;
  resources: {
    milho: ReturnType<typeof buildResourcePill>;
    penasDouradas: ReturnType<typeof buildResourcePill>;
    coroas: ReturnType<typeof buildResourcePill>;
    folego: ReturnType<typeof buildResourcePill>;
  };
}

export function buildWoodcutHeader(props: WoodcutHeaderProps): WoodcutHeaderModel {
  const nc = Math.max(1, Math.min(60, Math.floor(props.breederLevel)));
  const sede = Math.max(1, Math.min(12, Math.floor(props.sedeLevel)));

  return {
    playerName: props.playerName,
    breederBadge: `NC ${nc}`,
    sedeBadge: `Sede ${sede}`,
    borderClass: CORDEL_BORDERS.xiloFrame,
    backgroundColor: CORDEL_PALETTE.tintaXilo,
    fontFamily: CORDEL_TYPOGRAPHY.displayFont,
    resources: {
      milho: buildResourcePill({ currency: 'milho', amount: props.milho }),
      penasDouradas: buildResourcePill({
        currency: 'penasDouradas',
        amount: props.penasDouradas,
      }),
      coroas: buildResourcePill({
        currency: 'coroas',
        amount: props.coroas,
        showPlusButton: true,
      }),
      folego: buildResourcePill({
        currency: 'folego',
        amount: props.folego,
        cap: props.maxFolego ?? 120,
      }),
    },
  };
}

export const WoodcutHeader = defineComponent({
  name: 'WoodcutHeader',
  props: {
    playerName: { type: String, required: true },
    breederLevel: { type: Number, required: true },
    sedeLevel: { type: Number, required: true },
    milho: { type: Number, required: true },
    penasDouradas: { type: Number, required: true },
    coroas: { type: Number, required: true },
    folego: { type: Number, required: true },
    maxFolego: { type: Number, default: 120 },
  },
  emits: ['openStore'],
  setup(props, { emit }) {
    return () => {
      const model = buildWoodcutHeader(props);
      return h(
        'header',
        {
          class: `woodcut-header ${model.borderClass}`,
          style: {
            backgroundColor: model.backgroundColor,
            color: CORDEL_PALETTE.cremePapel,
          },
        },
        [
          h('div', { class: 'woodcut-header__identity' }, [
            h(
              'strong',
              {
                class: 'woodcut-header__name',
                style: { fontFamily: model.fontFamily },
              },
              model.playerName,
            ),
            h('span', { class: 'woodcut-header__nc' }, model.breederBadge),
            h('span', { class: 'woodcut-header__sede' }, model.sedeBadge),
          ]),
          h('div', { class: 'woodcut-header__resources' }, [
            h(ResourcePill, { currency: 'milho', amount: props.milho }),
            h(ResourcePill, { currency: 'penasDouradas', amount: props.penasDouradas }),
            h(ResourcePill, {
              currency: 'coroas',
              amount: props.coroas,
              showPlusButton: true,
              onAdd: () => emit('openStore'),
            }),
            h(ResourcePill, {
              currency: 'folego',
              amount: props.folego,
              cap: props.maxFolego,
            }),
          ]),
        ],
      );
    };
  },
});
