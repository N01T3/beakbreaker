import { defineComponent, h, onMounted, ref, watch, type PropType } from 'vue';
import {
  drawArena3v3Stage,
  drawClanBoardStage,
  drawIsoFarmStage,
  drawWoodcutBackdrop,
  type ArenaStageUnit,
  type CordelSkyPhase,
  type WoodcutCanvasContext2D,
} from './WoodcutCarver.js';

const SKY_CYCLE: CordelSkyPhase[] = ['SOL_PLENO', 'CREPUSCULO', 'LUAR_DO_SERTAO'];

const DEFAULT_UNITS: ArenaStageUnit[] = [
  { name: 'Trovao', vigor: 1200, maxVigor: 1500, canto: 80, team: 'A' },
  { name: 'Brisa', vigor: 980, maxVigor: 1100, canto: 60, team: 'A' },
  { name: 'Brasa', vigor: 1100, maxVigor: 1300, canto: 100, team: 'A' },
  { name: 'Carcara', vigor: 1050, maxVigor: 1400, canto: 50, team: 'B' },
  { name: 'Sereno', vigor: 890, maxVigor: 1200, canto: 40, team: 'B' },
  { name: 'Mandacaru', vigor: 1150, maxVigor: 1350, canto: 70, team: 'B' },
];

export const CordelStageCanvas = defineComponent({
  name: 'CordelStageCanvas',
  props: {
    activeTab: { type: String, default: 'Fazenda' },
    sedeLevel: { type: Number, default: 2 },
    storedMilho: { type: Number, default: 320 },
    activeTowers: { type: Number, default: 2 },
    roosterCount: { type: Number, default: 4 },
    unitBars: { type: Array as PropType<ArenaStageUnit[]>, default: () => DEFAULT_UNITS },
    popups: { type: Array as PropType<string[]>, default: () => ['CRITICO! -355'] },
    heroRaceLap: { type: Number, default: 4 },
    controlledTerritories: { type: Number, default: 3 },
  },
  setup(props) {
    const canvasRef = ref<HTMLCanvasElement | null>(null);
    const dayNightPhase = ref<CordelSkyPhase>('SOL_PLENO');
    const frameStep = ref(0);

    const redrawStage = (): void => {
      const el = canvasRef.value;
      if (!el || typeof el.getContext !== 'function') return;
      const ctx = el.getContext('2d') as unknown as WoodcutCanvasContext2D | null;
      if (!ctx) return;
      drawWoodcutBackdrop(ctx, 880, 240, dayNightPhase.value);
      if (props.activeTab === 'Lutar') {
        drawArena3v3Stage(ctx, props.unitBars.length ? props.unitBars : DEFAULT_UNITS, props.popups);
      } else if (props.activeTab === 'Bando') {
        drawClanBoardStage(ctx, props.heroRaceLap, props.controlledTerritories);
      } else {
        drawIsoFarmStage(ctx, {
          sedeLevel: props.sedeLevel,
          storedMilho: props.storedMilho,
          activeTowers: props.activeTowers,
          roosterCount: props.roosterCount,
        });
      }
    };

    const cycleDayNight = (): void => {
      const idx = SKY_CYCLE.indexOf(dayNightPhase.value);
      dayNightPhase.value = SKY_CYCLE[(idx + 1) % SKY_CYCLE.length] ?? 'SOL_PLENO';
    };

    const advanceFrame = (): void => {
      frameStep.value += 1;
    };

    onMounted(redrawStage);
    watch(
      () => [
        props.activeTab,
        props.sedeLevel,
        props.storedMilho,
        props.activeTowers,
        props.roosterCount,
        props.unitBars,
        props.popups,
        props.heroRaceLap,
        props.controlledTerritories,
        dayNightPhase.value,
        frameStep.value,
      ],
      redrawStage,
      { deep: true },
    );

    return () =>
      h(
        'div',
        {
          'data-testid': 'cordel-stage-wrapper',
          style: { border: '3px solid #1B1B1B', backgroundColor: '#F5E9D3', padding: '8px', marginBottom: '12px' },
        },
        [
          h('canvas', {
            ref: canvasRef,
            'data-testid': 'cordel-stage-canvas',
            width: 880,
            height: 240,
            style: { width: '100%', maxWidth: '880px', height: 'auto', display: 'block' },
          }),
          h(
            'div',
            { style: { display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap' } },
            [
              h('button', { 'data-testid': 'btn-cycle-daynight', type: 'button', onClick: cycleDayNight }, `Ciclo: ${dayNightPhase.value}`),
              h('button', { 'data-testid': 'btn-canvas-step', type: 'button', onClick: advanceFrame }, 'Passo Xilo'),
              h(
                'span',
                { 'data-testid': 'canvas-scene-label', style: { fontWeight: 'bold' } },
                `Cena: ${props.activeTab} | Clima: ${dayNightPhase.value} | Quadro: ${frameStep.value}`,
              ),
            ],
          ),
        ],
      );
  },
});
