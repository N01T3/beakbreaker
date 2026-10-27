import { defineComponent, h, onMounted, onUnmounted, ref, type PropType } from 'vue';
import {
  drawBuildingShadowAndCursor, drawHarvestBubble,
  drawRoamingRooster, drawVectorBuilding, drawVillageTerrain,
  type RoamingRoosterRenderData, type VillageBuildingRenderData,
} from './VillageRenderer.js';
import { cordelAudio } from '../../../services/AudioService.js';

export const PlayableVillageCanvas = defineComponent({
  name: 'PlayableVillageCanvas',
  props: {
    sedeLevel: { type: Number, default: 12 },
    harvestReadyCorn: { type: Number, default: 1200 },
    selectedBuilding: { type: String, default: 'milharal' },
  },
  emits: ['selectBuilding', 'harvest'],
  setup(props, { emit }) {
    const canvasRef = ref<HTMLCanvasElement | null>(null);
    let animId: number | null = null;
    let roosterImg: HTMLImageElement | null = null;

    const buildings: VillageBuildingRenderData[] = [
      { id: 'sede', name: 'Sede Principal', isoX: 200, isoY: 80, width: 78, height: 78, level: props.sedeLevel, icon: '🏛️' },
      { id: 'milharal', name: 'Milharal Fértil', isoX: 75, isoY: 160, width: 72, height: 72, level: 12, icon: '🌽' },
      { id: 'poleiro', name: 'Poleiros Rurais', isoX: 325, isoY: 160, width: 70, height: 70, level: 4, icon: '🪵' },
      { id: 'torres', name: 'Torre de São Jorge', isoX: 330, isoY: 70, width: 54, height: 72, level: 8, icon: '⛪' },
      { id: 'treino', name: 'Centro de Treino', isoX: 200, isoY: 220, width: 74, height: 70, level: 6, icon: '🏋️' },
    ];

    const roosters: RoamingRoosterRenderData[] = [
      { id: 'r1', x: 150, y: 150, facing: 'right' },
      { id: 'r2', x: 250, y: 170, facing: 'left' },
    ];

    const handleCanvasClick = (e: MouseEvent) => {
      const el = canvasRef.value;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scaleX = el.width / rect.width;
      const scaleY = el.height / rect.height;
      const cx = (e.clientX - rect.left) * scaleX;
      const cy = (e.clientY - rect.top) * scaleY;

      // Clique na bolha flutuante do milharal
      const bubbleX = 75;
      const bubbleY = 160 - 45;
      if (Math.hypot(cx - bubbleX, cy - bubbleY) < 35) {
        cordelAudio.playTrianguloReward();
        emit('harvest');
        return;
      }

      // Clique em edificações
      for (const b of buildings) {
        if (Math.hypot(cx - b.isoX, cy - b.isoY) < b.width * 0.55) {
          cordelAudio.playZabumbaTabSwitch();
          emit('selectBuilding', b.id);
          return;
        }
      }
    };

    onMounted(() => {
      const buildingImages: Record<string, HTMLImageElement> = {};
      if (typeof Image !== 'undefined') {
        roosterImg = new Image();
        roosterImg.src = '/assets/roosters/trovao_sprite_transparent.png';
        const paths: Record<string, string> = {
          sede: '/assets/buildings/sede_town_hall.webp',
          milharal: '/assets/buildings/milharal_mine.webp',
          poleiro: '/assets/buildings/paiol_storage.webp',
          torres: '/assets/buildings/torre_santos.webp',
          treino: '/assets/buildings/centro_treino.webp',
        };
        for (const [k, p] of Object.entries(paths)) {
          const img = new Image();
          img.src = p;
          buildingImages[k] = img;
        }
      }
      const canvas = canvasRef.value;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const loop = (t: number) => {
        roosters[0].x = 150 + Math.sin(t * 0.001) * 30;
        roosters[0].facing = Math.cos(t * 0.001) > 0 ? 'right' : 'left';
        roosters[1].x = 250 + Math.cos(t * 0.0012) * 25;
        roosters[1].facing = Math.sin(t * 0.0012) > 0 ? 'left' : 'right';

        drawVillageTerrain(ctx, canvas.width, canvas.height, t);

        for (const b of buildings) {
          b.level = b.id === 'sede' ? props.sedeLevel : b.level;
          b.isSelected = b.id === props.selectedBuilding;
          drawBuildingShadowAndCursor(ctx, b);
          drawVectorBuilding(ctx, b, buildingImages[b.id] ?? null);
        }

        for (const r of roosters) {
          drawRoamingRooster(ctx, r, t, roosterImg);
        }

        drawHarvestBubble(ctx, 75, 160 - 45, `🌽 +${props.harvestReadyCorn}`, t);
        animId = requestAnimationFrame(loop);
      };

      animId = requestAnimationFrame(loop);
    });

    onUnmounted(() => {
      if (animId) cancelAnimationFrame(animId);
    });

    return () =>
      h('div', {
        class: 'playable-village-canvas-wrapper',
        'data-testid': 'playable-village-canvas-wrapper',
        style: {
          width: '100%', borderRadius: '16px', overflow: 'hidden',
          border: '3px solid #854D0E', boxShadow: '0 8px 24px rgba(0,0,0,0.85)',
          marginBottom: '10px', background: '#12210A',
        },
      }, [
        h('canvas', {
          ref: canvasRef,
          width: 400,
          height: 280,
          'data-testid': 'playable-village-canvas',
          style: { width: '100%', height: 'auto', display: 'block', cursor: 'pointer' },
          onClick: handleCanvasClick,
        }),
      ]);
  },
});
