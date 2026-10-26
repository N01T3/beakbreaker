import { defineComponent, h } from 'vue';
import { CORDEL_PALETTE } from '../tokens/cordelTokens.js';

export interface StarItem {
  index: number;
  tier: 'normal' | 'astral';
  colorHex: string;
  symbol: string;
}

export interface StarRowProps {
  stars: number;
  maxStars?: number;
}

export interface StarRowModel {
  totalStars: number;
  yellowStars: number;
  redAstralStars: number;
  isAstralAwakened: boolean;
  statBonusPercent: number;
  items: StarItem[];
}

/**
 * Diferencia 1★-5★ amarelas (#F4B400) e 6★-10★ vermelhas (#D7263D) do Despertar Astral.
 * Cada estrela concede +15% de bônus (1★ = +15%, 5★ = +75%, 10★ = +150%).
 */
export function buildStarRow(props: StarRowProps): StarRowModel {
  const maxStars = Math.min(10, Math.max(1, props.maxStars ?? 10));
  const clampedStars = Math.min(maxStars, Math.max(0, Math.floor(props.stars)));
  const yellowStars = Math.min(5, clampedStars);
  const redAstralStars = Math.max(0, clampedStars - 5);
  const isAstralAwakened = redAstralStars > 0;

  const items: StarItem[] = [];
  if ( !isAstralAwakened ) {
    for (let i = 1; i <= yellowStars; i++) {
      items.push({
        index: i,
        tier: 'normal',
        colorHex: CORDEL_PALETTE.amareloMilho,
        symbol: '★',
      });
    }
  } else {
    for (let i = 1; i <= 5; i++) {
      const isRed = i <= redAstralStars;
      items.push({
        index: isRed ? i + 5 : i,
        tier: isRed ? 'astral' : 'normal',
        colorHex: isRed ? CORDEL_PALETTE.vermelhoCrista : CORDEL_PALETTE.amareloMilho,
        symbol: isRed ? '★' : '★',
      });
    }
  }

  return {
    totalStars: clampedStars,
    yellowStars,
    redAstralStars,
    isAstralAwakened,
    statBonusPercent: clampedStars * 15,
    items,
  };
}

export const StarRow = defineComponent({
  name: 'StarRow',
  props: {
    stars: { type: Number, required: true },
    maxStars: { type: Number, default: 10 },
  },
  setup(props) {
    return () => {
      const model = buildStarRow(props);
      return h(
        'div',
        {
          class: `star-row ${model.isAstralAwakened ? 'star-row--astral' : 'star-row--normal'}`,
          'data-stars': model.totalStars,
          'data-bonus-pct': model.statBonusPercent,
        },
        model.items.map((item) =>
          h(
            'span',
            {
              key: `${item.tier}-${item.index}`,
              class: `star-row__star star-row__star--${item.tier}`,
              style: { color: item.colorHex },
            },
            item.symbol,
          ),
        ),
      );
    };
  },
});
