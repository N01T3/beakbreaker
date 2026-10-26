import { defineComponent, h, type PropType } from 'vue';
import {
  CORDEL_BORDERS,
  CORDEL_PALETTE,
  ELEMENT_COLORS,
  RARITY_COLORS,
  type CordelElementType,
  type CordelRarity,
  type CordelRoosterClass,
} from '../tokens/cordelTokens.js';
import { buildStarRow, StarRow } from '../atoms/StarRow.js';
import { buildRopeBadge, RopeBadge } from '../atoms/RopeBadge.js';

export type RoosterCardMode = 'compact' | 'album' | 'battle';

export interface RoosterAtletaData {
  id: string;
  number: number;
  name: string;
  rarity: CordelRarity;
  roosterClass: CordelRoosterClass;
  primaryElement: CordelElementType;
  secondaryElement?: CordelElementType;
  level: number;
  stars: number;
  vigor?: number;
  maxVigor?: number;
  canto?: number;
  isDiscovered?: boolean;
  isGoldenPlumage?: boolean;
}

export interface RoosterAtletaCardModel {
  id: string;
  formattedNumber: string;
  title: string;
  mode: RoosterCardMode;
  elementColor: string;
  rarityColor: string;
  borderClass: string;
  backgroundColor: string;
  starModel: ReturnType<typeof buildStarRow>;
  elementBadge: ReturnType<typeof buildRopeBadge>;
  classBadge: ReturnType<typeof buildRopeBadge>;
  levelLabel: string;
  isSilhouette: boolean;
  isReadySpecial: boolean;
}

export function buildRoosterAtletaCard(
  rooster: RoosterAtletaData,
  mode: RoosterCardMode = 'compact',
): RoosterAtletaCardModel {
  const isSilhouette = mode === 'album' && rooster.isDiscovered === false;
  const formattedNumber = `#${String(rooster.number).padStart(2, '0')}`;

  return {
    id: rooster.id,
    formattedNumber,
    title: isSilhouette ? '???' : rooster.name,
    mode,
    elementColor: ELEMENT_COLORS[rooster.primaryElement],
    rarityColor: RARITY_COLORS[rooster.rarity],
    borderClass: CORDEL_BORDERS.xiloFrame,
    backgroundColor: CORDEL_PALETTE.cremePapel,
    starModel: buildStarRow({ stars: rooster.stars }),
    elementBadge: buildRopeBadge({
      text: rooster.primaryElement,
      kind: 'element',
      element: rooster.primaryElement,
    }),
    classBadge: buildRopeBadge({
      text: rooster.roosterClass,
      kind: 'class',
    }),
    levelLabel: `NG ${Math.max(1, Math.min(60, rooster.level))}`,
    isSilhouette,
    isReadySpecial: mode === 'battle' && (rooster.canto ?? 0) >= 1000,
  };
}

export const RoosterAtletaCard = defineComponent({
  name: 'RoosterAtletaCard',
  props: {
    rooster: { type: Object as PropType<RoosterAtletaData>, required: true },
    mode: { type: String as PropType<RoosterCardMode>, default: 'compact' },
  },
  emits: ['select'],
  setup(props, { emit }) {
    return () => {
      const model = buildRoosterAtletaCard(props.rooster, props.mode);
      return h(
        'article',
        {
          class: `rooster-card rooster-card--${model.mode} ${model.borderClass} ${
            model.isReadySpecial ? 'rooster-card--ready-special' : ''
          }`,
          style: {
            backgroundColor: model.backgroundColor,
            borderColor: model.rarityColor,
          },
          onClick: () => emit('select', props.rooster.id),
        },
        [
          h('header', { class: 'rooster-card__header' }, [
            h('span', { class: 'rooster-card__number' }, model.formattedNumber),
            h('strong', { class: 'rooster-card__name' }, model.title),
            h('span', { class: 'rooster-card__level' }, model.levelLabel),
          ]),
          h('div', { class: 'rooster-card__badges' }, [
            h(RopeBadge, {
              text: props.rooster.primaryElement,
              kind: 'element',
              element: props.rooster.primaryElement,
            }),
            h(RopeBadge, {
              text: props.rooster.roosterClass,
              kind: 'class',
            }),
          ]),
          h(StarRow, { stars: props.rooster.stars }),
        ],
      );
    };
  },
});
