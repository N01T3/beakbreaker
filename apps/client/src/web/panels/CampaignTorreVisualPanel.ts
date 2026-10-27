import { defineComponent, h, ref, type PropType } from 'vue';
import { CORDEL_PALETTE } from '@beakbreaker/ui-cordel';
import type { WebRuntime } from '../createWebRuntime.js';

interface ChapterSpec { num: number; name: string; boss: string; fases: string; }
const CHAPTERS: readonly ChapterSpec[] = [
  { num: 1, name: 'Chapada do Araripe', boss: 'Valentão da Chapada', fases: '1–15' },
  { num: 2, name: 'Vale do Cariri', boss: 'Zabumba Gigante', fases: '16–30' },
  { num: 3, name: 'Sertão dos Inhamuns', boss: 'Barqueira do Rio', fases: '31–45' },
  { num: 4, name: 'Raso da Catarina', boss: 'Caipora Ancestral', fases: '46–60' },
  { num: 5, name: 'Caatinga Alta', boss: 'Jangadeiro do Vento', fases: '61–75' },
  { num: 6, name: 'Fortaleza do Coronel Ferrabrás', boss: 'Galo de Ferro do Coronel', fases: '76–90' },
];

interface ModSpec { id: string; name: string; icon: string; effect: string; }
const CLIMATIC_MODS: readonly ModSpec[] = [
  { id: 'seca_extrema', name: 'Seca Extrema', icon: '☀️', effect: 'Calor severo: dano contínuo e cura reduzida' },
  { id: 'chuva_pedra', name: 'Chuva de Pedra', icon: '🌧️', effect: 'Granizo pesado: reduz velocidade e atordoa' },
  { id: 'ventania_brava', name: 'Ventania Brava', icon: '🌪️', effect: 'Ventos fortes: desvia trajetórias e reduz mira' },
  { id: 'festa_arraial', name: 'Festa no Arraial', icon: '🪗', effect: 'Sanfona animada: ganho de Canto acelerado (+5%)' },
];

const VO_TONHO_SABEDORIAS = [
  'A coragem do sertanejo dobra na adversidade, meu fi! Cuide bem das tuas aves e suba a torre com fé.',
  'O galo que madruga firme no terreiro não teme sombra de carcará nem sol a pino.',
  'Contra a máquina do Coronel Ferrabrás, só a força do bando e a honra sertaneja podem vencer!',
];

export const CampaignTorreVisualPanel = defineComponent({
  name: 'CampaignTorreVisualPanel',
  props: { runtime: { type: Object as PropType<WebRuntime>, required: false } },
  setup() {
    const selectedChapter = ref(1);
    const selectedFloor = ref(42);
    const selectedModifier = ref('Seca Extrema');
    const wisdomIdx = ref(0);
    const challengeStatus = ref('');

    const selectChapter = (ch: ChapterSpec) => { selectedChapter.value = ch.num; };
    const cycleWisdom = () => { wisdomIdx.value = (wisdomIdx.value + 1) % VO_TONHO_SABEDORIAS.length; };
    const setFloor = (f: number) => { selectedFloor.value = Math.max(1, Math.min(100, f)); };
    const handleChallengeTower = () => {
      challengeStatus.value = `Desafio aceito no Andar ${selectedFloor.value}! Clima: ${selectedModifier.value} (0 Fôlego). Subindo a Torre do Mandacaru!`;
    };

    return () =>
      h('div', { class: 'cordel-card', 'data-testid': 'campaign-torre-visual-panel', style: { marginTop: '10px' } }, [
        h('div', {
          'data-testid': 'campaign-torre-backdrop-container',
          style: {
            position: 'relative', borderRadius: '6px', overflow: 'hidden', border: '2px solid #1B1B1B',
            marginBottom: '8px', minHeight: '110px',
            backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.55)), url('/assets/pranchas/estrada-torre-backdrop.webp')`,
            backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center', color: '#F5E9D3', padding: '10px', textAlign: 'center',
          },
        }, [
          h('img', { src: '/assets/pranchas/estrada-torre-backdrop.webp', alt: 'Estrada do Sertão & Torre', 'data-testid': 'estrada-torre-backdrop', style: { display: 'none' } }),
          h('h4', { style: { color: CORDEL_PALETTE.amareloMilho, margin: '0 0 2px 0', textShadow: '2px 2px 0 #000' } }, 'Campanha Estrada do Sertão & Torre do Mandacaru (Prancha 18)'),
          h('p', { style: { margin: 0, fontSize: '11px', textShadow: '1px 1px 2px #000' } }, 'Jornada pelos 6 Capítulos e Torre Espiral de 100 Andares • 0 Fôlego'),
        ]),
        h('div', {
          class: 'cordel-card', 'data-testid': 'vo-tonho-speech-balloon',
          style: { backgroundColor: '#FFFDF0', border: '2px solid #D4A373', marginBottom: '8px', cursor: 'pointer' },
          onClick: cycleWisdom,
        }, [
          h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
            h('strong', { style: { color: CORDEL_PALETTE.vermelhoCrista, fontSize: '13px' } }, '👴 Vô Tonho (Mentor do Sertão)'),
            h('span', { class: 'cordel-badge', style: { fontSize: '11px', backgroundColor: CORDEL_PALETTE.amareloMilho } }, 'Clique para ouvir mais'),
          ]),
          h('p', {
            'data-testid': 'vo-tonho-wisdom-text',
            style: { margin: '4px 0 0 0', fontStyle: 'italic', fontSize: '12px', color: CORDEL_PALETTE.tintaXilo },
          }, `"${VO_TONHO_SABEDORIAS[wisdomIdx.value]}"`),
        ]),
        h('div', { class: 'cordel-card', 'data-testid': 'campaign-map-chapters', style: { marginBottom: '8px' } }, [
          h('h5', { style: { margin: '0 0 6px 0', color: CORDEL_PALETTE.tintaXilo } }, 'Mapa da Estrada do Sertão (6 Capítulos de Jornada)'),
          h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } },
            CHAPTERS.map((ch) =>
              h('button', {
                key: ch.num, type: 'button', 'data-testid': `btn-chapter-${ch.num}`,
                style: {
                  flex: '1', minWidth: '130px', padding: '6px', textAlign: 'left', cursor: 'pointer',
                  backgroundColor: selectedChapter.value === ch.num ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.cremePapel,
                  border: selectedChapter.value === ch.num ? '2px solid #8B4513' : '1px solid #1B1B1B',
                },
                onClick: () => selectChapter(ch),
              }, [
                h('strong', { style: { display: 'block', fontSize: '12px' } }, `Cap. ${ch.num}: ${ch.name}`),
                h('span', { style: { fontSize: '11px', display: 'block', color: '#555' } }, `Fases: ${ch.fases} | Chefe: ${ch.boss}`),
              ]),
            ),
          ),
        ]),
        h('div', { class: 'cordel-card', 'data-testid': 'torre-mandacaru-panel' }, [
          h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '6px' } }, [
            h('h5', { style: { margin: '0', color: CORDEL_PALETTE.tintaXilo } }, 'Torre do Mandacaru (100 Andares em Espiral — 0 Fôlego)'),
            h('span', { class: 'cordel-badge', style: { backgroundColor: CORDEL_PALETTE.verdeMata, color: '#FFF' } }, 'Temporada Mensal: 600 Penas'),
          ]),
          h('div', {
            'data-testid': 'floor-selector',
            style: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' },
          }, [
            h('strong', { style: { fontSize: '13px' } }, `Andar Selecionado: ${selectedFloor.value}/100`),
            h('button', { type: 'button', 'data-testid': 'btn-floor-prev', style: { padding: '3px 8px', fontWeight: 'bold', cursor: 'pointer' }, onClick: () => setFloor(selectedFloor.value - 1) }, '◀ -1'),
            h('button', { type: 'button', 'data-testid': 'btn-floor-next', style: { padding: '3px 8px', fontWeight: 'bold', cursor: 'pointer' }, onClick: () => setFloor(selectedFloor.value + 1) }, '+1 ▶'),
            h('button', {
              type: 'button', 'data-testid': 'btn-floor-42',
              style: { padding: '3px 8px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: selectedFloor.value === 42 ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.cremePapel },
              onClick: () => setFloor(42),
            }, 'Andar 42'),
          ]),
          h('div', { 'data-testid': 'climate-medallions', style: { marginBottom: '8px' } }, [
            h('strong', { style: { fontSize: '12px', display: 'block', marginBottom: '4px' } }, 'Medalhões de Modificadores Climáticos:'),
            h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } },
              CLIMATIC_MODS.map((m) =>
                h('button', {
                  key: m.id, type: 'button', 'data-testid': `medallion-${m.id}`,
                  style: {
                    flex: '1', minWidth: '120px', padding: '4px 8px', textAlign: 'left', cursor: 'pointer',
                    backgroundColor: selectedModifier.value === m.name ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.cremePapel,
                    border: '1px solid #1B1B1B',
                  },
                  onClick: () => { selectedModifier.value = m.name; },
                }, [
                  h('strong', { style: { display: 'block', fontSize: '12px' } }, `${m.icon} ${m.name}`),
                  h('span', { style: { fontSize: '10px', color: '#444' } }, m.effect),
                ]),
              ),
            ),
          ]),
          h('div', { style: { textAlign: 'center', marginTop: '6px' } }, [
            h('button', {
              type: 'button', 'data-testid': 'btn-challenge-tower-floor',
              style: {
                backgroundColor: CORDEL_PALETTE.vermelhoCrista, color: CORDEL_PALETTE.cremePapel,
                border: '2px solid #1B1B1B', padding: '8px 18px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer',
              },
              onClick: handleChallengeTower,
            }, `DESAFIAR ANDAR ${selectedFloor.value}!`),
            challengeStatus.value ? h('p', {
              'data-testid': 'tower-challenge-status',
              style: { margin: '6px 0 0 0', fontWeight: 'bold', fontSize: '12px', color: CORDEL_PALETTE.verdeMata },
            }, challengeStatus.value) : null,
          ]),
        ]),
      ]);
  },
});
