import { defineComponent, h } from 'vue';
import { CORDEL_BORDERS, CORDEL_PALETTE } from '../tokens/cordelTokens.js';

export const PITY_CONSTANTS = {
  HARD_PITY_PULL: 80,
  SOFT_PITY_START: 61,
  BASE_LEGENDARY_PCT: 2.0,
  SOFT_PITY_STEP_PCT: 5.0,
  BASE_EPIC_PCT: 12.0,
  BASE_RARE_PCT: 36.0,
  BASE_COMMON_PCT: 50.0,
} as const;

export interface ExplicitOddsDisclosure {
  legendaryPct: number;
  epicPct: number;
  rarePct: number;
  commonPct: number;
  ecaComplianceText: string;
}

export interface PityProgressBarProps {
  currentPity: number;
  guaranteedFeaturedNext?: boolean;
}

export interface PityProgressBarModel {
  currentPity: number;
  maxPity: 80;
  counterLabel: string;
  progressPercent: number;
  softPityStart: 61;
  isSoftPityActive: boolean;
  pullsUntilSoftPity: number;
  pullsUntilHardPity: number;
  barColor: string;
  borderClass: string;
  guaranteedFeaturedNext: boolean;
  oddsDisclosure: ExplicitOddsDisclosure;
}

export function calculateExplicitPullOdds(currentPity: number): ExplicitOddsDisclosure {
  const nextPullNumber = Math.min(80, Math.max(1, Math.floor(currentPity) + 1));
  let legendaryPct: number = PITY_CONSTANTS.BASE_LEGENDARY_PCT;

  if (nextPullNumber >= PITY_CONSTANTS.HARD_PITY_PULL) {
    legendaryPct = 100.0;
  } else if (nextPullNumber >= PITY_CONSTANTS.SOFT_PITY_START) {
    const steps = nextPullNumber - PITY_CONSTANTS.SOFT_PITY_START + 1;
    legendaryPct = Math.min(
      100.0,
      PITY_CONSTANTS.BASE_LEGENDARY_PCT + steps * PITY_CONSTANTS.SOFT_PITY_STEP_PCT,
    );
  }

  const remaining = Math.max(0, 100.0 - legendaryPct);
  const baseNonLeg =
    PITY_CONSTANTS.BASE_EPIC_PCT +
    PITY_CONSTANTS.BASE_RARE_PCT +
    PITY_CONSTANTS.BASE_COMMON_PCT;

  const epicPct = Number(((remaining * PITY_CONSTANTS.BASE_EPIC_PCT) / baseNonLeg).toFixed(2));
  const rarePct = Number(((remaining * PITY_CONSTANTS.BASE_RARE_PCT) / baseNonLeg).toFixed(2));
  const commonPct = Number(Math.max(0, 100 - legendaryPct - epicPct - rarePct).toFixed(2));

  return {
    legendaryPct,
    epicPct,
    rarePct,
    commonPct,
    ecaComplianceText: `Transparência ECA Digital (18+): Lendário ${legendaryPct.toFixed(2)}% | Épico ${epicPct.toFixed(2)}% | Raro ${rarePct.toFixed(2)}% | Comum ${commonPct.toFixed(2)}% (Soft Pity no 61, Garantido no 80/80)`,
  };
}

export function buildPityProgressBar(props: PityProgressBarProps): PityProgressBarModel {
  const currentPity = Math.min(80, Math.max(0, Math.floor(props.currentPity)));
  const nextPull = currentPity + 1;
  const isSoftPityActive = nextPull >= PITY_CONSTANTS.SOFT_PITY_START;
  const oddsDisclosure = calculateExplicitPullOdds(currentPity);

  return {
    currentPity,
    maxPity: 80,
    counterLabel: `${currentPity}/80`,
    progressPercent: Math.round((currentPity / 80) * 100),
    softPityStart: 61,
    isSoftPityActive,
    pullsUntilSoftPity: Math.max(0, PITY_CONSTANTS.SOFT_PITY_START - nextPull),
    pullsUntilHardPity: Math.max(0, PITY_CONSTANTS.HARD_PITY_PULL - currentPity),
    barColor: isSoftPityActive
      ? CORDEL_PALETTE.vermelhoCrista
      : CORDEL_PALETTE.amareloMilho,
    borderClass: CORDEL_BORDERS.xiloFrame,
    guaranteedFeaturedNext: Boolean(props.guaranteedFeaturedNext),
    oddsDisclosure,
  };
}

export const PityProgressBar = defineComponent({
  name: 'PityProgressBar',
  props: {
    currentPity: { type: Number, required: true },
    guaranteedFeaturedNext: { type: Boolean, default: false },
  },
  setup(props) {
    return () => {
      const model = buildPityProgressBar(props);
      return h('section', { class: `pity-bar ${model.borderClass}` }, [
        h('div', { class: 'pity-bar__header' }, [
          h('strong', { class: 'pity-bar__counter' }, `Pity: ${model.counterLabel}`),
          h(
            'span',
            { class: 'pity-bar__soft-marker' },
            model.isSoftPityActive ? 'SOFT PITY ATIVO (61+)' : 'Soft Pity: 61/80',
          ),
        ]),
        h('div', { class: 'pity-bar__track' }, [
          h('div', {
            class: 'pity-bar__fill',
            style: {
              width: `${model.progressPercent}%`,
              backgroundColor: model.barColor,
            },
          }),
        ]),
        h('p', { class: 'pity-bar__disclosure' }, model.oddsDisclosure.ecaComplianceText),
      ]);
    };
  },
});
