import { defineComponent, h, ref, type PropType } from 'vue';
import { CORDEL_PALETTE } from '@beakbreaker/ui-cordel';
import type { WebRuntime } from '../createWebRuntime.js';

const NORDESTE_UFS = ['PB', 'PE', 'BA', 'CE', 'RN', 'AL', 'SE', 'PI', 'MA'] as const;

interface VitrinePedestal { id: number; label: string; name: string; power: number; }
const PEDESTAIS: readonly VitrinePedestal[] = [
  { id: 1, label: 'PODER FAVORITO ⚡ 3000', name: 'Galo Campina Supremo', power: 3000 },
  { id: 2, label: 'Líder Cangaço', name: 'Zabumba do Agreste', power: 2850 },
  { id: 3, label: 'Campeão do Sol', name: 'Faísca Dourada', power: 2790 },
];

interface FolhetoCard { id: string; title: string; stars: string; }
const FOLHETOS: readonly FolhetoCard[] = [
  { id: 'f1', title: 'Revolta do Cariri', stars: '★★★☆☆' },
  { id: 'f2', title: 'Lendas da Lua', stars: '★★★★☆' },
  { id: 'f3', title: 'O Cangaço Misterioso', stars: '★★★★★' },
];

const CONQUISTAS = [
  { icon: '🏅', name: 'Guardião da Caatinga' }, { icon: '🎖️', name: 'Lenda do Velho Chico' },
  { icon: '🎗️', name: 'Ás da Chapada' }, { icon: '🥇', name: 'Supremo Sertão' },
];

export const SocialVitrineCordelPanel = defineComponent({
  name: 'SocialVitrineCordelPanel',
  props: { runtime: { type: Object as PropType<WebRuntime>, required: false } },
  setup() {
    const selectedUf = ref<string>('PB');
    const visitFriendMsg = ref('');
    const challengeMsg = ref('');

    const selectUf = (uf: string) => { selectedUf.value = uf; };
    const handleVisitFriend = () => {
      visitFriendMsg.value = `Rancho do compadre em ${selectedUf.value} visitado! +250 Milho e +20 Penas Douradas.`;
    };
    const handleChallenge = (title: string) => {
      challengeMsg.value = `Desafio aceito no folheto "${title}"! Prepare seu trio para o confronto (0 Fôlego).`;
    };

    return () =>
      h('div', {
        class: 'cordel-card',
        'data-testid': 'social-vitrine-cordel-panel',
        style: {
          marginTop: '10px',
          backgroundImage: "linear-gradient(rgba(245,238,220,0.92), rgba(245,238,220,0.95)), url('/assets/pranchas/vitrine-social-backdrop.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        },
      }, [
        h('div', {
          'data-testid': 'vitrine-social-backdrop-banner',
          style: {
            backgroundImage: "linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.65)), url('/assets/pranchas/vitrine-social-backdrop.webp')",
            backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '6px',
            padding: '10px 14px', marginBottom: '10px', color: '#FFF8E7', border: '2px solid #1B1B1B',
          },
        }, [
          h('h4', { style: { color: '#FFE082', margin: '0 0 2px 0' } }, 'Hub Social: Vitrine de Galos & Folhetos de Desafio'),
          h('p', { style: { margin: 0, fontSize: '12px' } }, 'Prancha 17: Exposição de Campeões, Honras de Cordel & Trilho Interestadual'),
        ]),
        h('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap' } }, [
          h('div', { class: 'cordel-card', 'data-testid': 'uf-rail', style: { minWidth: '70px', padding: '6px' } }, [
            h('strong', { style: { fontSize: '11px', display: 'block', marginBottom: '4px' } }, 'UF Nordeste'),
            h('div', { style: { display: 'flex', flexDirection: 'column', gap: '3px' } },
              NORDESTE_UFS.map((uf) =>
                h('button', {
                  key: uf, type: 'button', 'data-testid': `btn-uf-${uf}`,
                  style: {
                    padding: '3px 6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer',
                    backgroundColor: selectedUf.value === uf ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.cremePapel,
                    border: '1px solid #1B1B1B',
                  },
                  onClick: () => selectUf(uf),
                }, `🚩 ${uf}`),
              ),
            ),
          ]),
          h('div', { style: { flex: '1', minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '8px' } }, [
            h('div', { class: 'cordel-card', 'data-testid': 'profile-card', style: { backgroundColor: CORDEL_PALETTE.cremePapel } }, [
              h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' } }, [
                h('h5', { style: { margin: '0', color: CORDEL_PALETTE.tintaXilo } }, '👑 SUPREMO SERTÃO'),
                h('span', { class: 'cordel-badge', style: { backgroundColor: CORDEL_PALETTE.amareloMilho } }, `Elo Rating: 2.850 (${selectedUf.value})`),
              ]),
              h('div', { style: { marginTop: '6px', fontSize: '13px', display: 'flex', gap: '12px', flexWrap: 'wrap' } }, [
                h('span', 'Avatar: 🤠 Chapéu de Couro / Lampião'),
                h('span', 'Clã: Bando do Lampião'),
              ]),
            ]),
            h('div', { class: 'cordel-card', 'data-testid': 'vitrine-pedestals' }, [
              h('h5', { style: { margin: '0 0 6px 0', color: CORDEL_PALETTE.tintaXilo } }, 'Palco Vitrine de Galos (Top 3 Melhores)'),
              h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'space-around' } },
                PEDESTAIS.map((p) =>
                  h('div', {
                    key: p.id, 'data-testid': `vitrine-pedestal-${p.id}`,
                    style: {
                      border: '2px solid #1B1B1B', padding: '4px 6px',
                      backgroundColor: CORDEL_PALETTE.cremePapel, textAlign: 'center', minWidth: '95px',
                    },
                  }, [
                    h('strong', { style: { fontSize: '11px', display: 'block', color: CORDEL_PALETTE.vermelhoCrista } }, p.label),
                    h('img', {
                      src: p.id === 1 ? '/assets/roosters/card_01.webp' : p.id === 2 ? '/assets/roosters/card_02.webp' : '/assets/roosters/card_04.webp',
                      alt: p.name, style: { width: '40px', height: '50px', objectFit: 'contain', borderRadius: '3px', margin: '2px 0' },
                    }),
                    h('p', { style: { margin: '0', fontSize: '11px', fontWeight: 'bold' } }, p.name),
                    h('span', { style: { fontSize: '10px', color: CORDEL_PALETTE.azulAnil } }, `Poder: ${p.power}`),
                  ]),
                ),
              ),
              h('div', { style: { marginTop: '8px', textAlign: 'center' } }, [
                h('button', {
                  type: 'button', 'data-testid': 'btn-visit-friend-farm',
                  style: {
                    backgroundColor: CORDEL_PALETTE.verdeMata, color: CORDEL_PALETTE.cremePapel,
                    border: '2px solid #1B1B1B', padding: '6px 14px', fontWeight: 'bold', cursor: 'pointer',
                  },
                  onClick: handleVisitFriend,
                }, 'VISITAR FAZENDA DE AMIGO'),
                visitFriendMsg.value ? h('p', {
                  'data-testid': 'visit-friend-status',
                  style: { margin: '6px 0 0 0', fontSize: '12px', fontWeight: 'bold', color: CORDEL_PALETTE.verdeMata },
                }, visitFriendMsg.value) : null,
              ]),
            ]),
          ]),
        ]),
        h('div', { class: 'cordel-card', 'data-testid': 'cordel-folhetos-section', style: { marginTop: '8px' } }, [
          h('h5', { style: { margin: '0 0 6px 0' } }, 'Folhetos de Desafio de Cordel (Pendurados por Cordinhas e Prendedores 🪢📎)'),
          h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
            FOLHETOS.map((f, idx) =>
              h('div', {
                key: f.id, 'data-testid': `folheto-card-${f.id}`,
                style: {
                  flex: '1', minWidth: '150px', border: '2px dashed #1B1B1B',
                  backgroundColor: CORDEL_PALETTE.cremePapel, padding: '8px', textAlign: 'center',
                },
              }, [
                h('strong', { style: { display: 'block', fontSize: '13px' } }, f.title),
                h('p', { style: { margin: '4px 0', fontSize: '12px', color: CORDEL_PALETTE.amareloMilho } }, `Dificuldade: ${f.stars}`),
                h('button', {
                  type: 'button', 'data-testid': `btn-challenge-folheto-${idx + 1}`,
                  style: {
                    backgroundColor: CORDEL_PALETTE.vermelhoCrista, color: CORDEL_PALETTE.cremePapel,
                    border: '2px solid #1B1B1B', padding: '4px 10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                  },
                  onClick: () => handleChallenge(f.title),
                }, 'DESAFIAR'),
              ]),
            ),
          ),
          challengeMsg.value ? h('p', {
            'data-testid': 'challenge-status',
            style: { margin: '6px 0 0 0', fontSize: '12px', fontWeight: 'bold', color: CORDEL_PALETTE.tintaXilo },
          }, challengeMsg.value) : null,
        ]),
        h('div', { class: 'cordel-card', 'data-testid': 'conquests-ribbons-row', style: { marginTop: '8px' } }, [
          h('strong', { style: { fontSize: '12px', display: 'block', marginBottom: '4px' } }, 'Conquistas & Fitas de Honra do Sertão:'),
          h('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap' } },
            CONQUISTAS.map((c, i) =>
              h('span', { key: i, class: 'cordel-badge', style: { backgroundColor: CORDEL_PALETTE.cremePapel, border: '1px solid #1B1B1B' } },
                `${c.icon} ${c.name}`,
              ),
            ),
          ),
        ]),
      ]);
  },
});
