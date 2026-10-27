import { defineComponent, h, ref, type PropType } from 'vue';
import { CORDEL_PALETTE } from '@beakbreaker/ui-cordel';
import { BRAZILIAN_FEDERATION_LIST, type BrazilianStateUF } from '@beakbreaker/game-data';
import type { WebRuntime } from '../createWebRuntime.js';

interface TopStateDisplay {
  rank: number;
  uf: BrazilianStateUF;
  name: string;
  region: string;
  trophies: number;
  multiplier: number;
}

const DEFAULT_TOP_UFS: TopStateDisplay[] = [
  { rank: 1, uf: 'PE', name: 'Pernambuco', region: 'Nordeste', trophies: 15625, multiplier: 1.25 },
  { rank: 2, uf: 'CE', name: 'Ceará', region: 'Nordeste', trophies: 14160, multiplier: 1.20 },
  { rank: 3, uf: 'BA', name: 'Bahia', region: 'Nordeste', trophies: 13440, multiplier: 1.20 },
  { rank: 4, uf: 'PB', name: 'Paraíba', region: 'Nordeste', trophies: 11400, multiplier: 1.20 },
  { rank: 5, uf: 'SP', name: 'São Paulo', region: 'Sudeste', trophies: 10900, multiplier: 1.05 },
];

export const UFRankingProfilePanel = defineComponent({
  name: 'UFRankingProfilePanel',
  props: { runtime: { type: Object as PropType<WebRuntime>, required: false } },
  setup() {
    const friendBonusCollected = ref(false);
    const bonusMessage = ref('Visite ranchos de companheiros do sertão para recolher o Bônus de Amizade diário.');

    const handleVisitFriend = () => {
      friendBonusCollected.value = true;
      bonusMessage.value = 'Bônus de Amizade Coletado na Fazenda do Compadre Zé (PE): +350 Milho e +5 Sementes Raras (1/10 hoje)!';
    };

    return () =>
      h('div', { class: 'cordel-card', 'data-testid': 'uf-ranking-profile-panel', style: { marginTop: '10px' } }, [
        h('h4', { style: { color: CORDEL_PALETTE.terracota, margin: '0 0 8px 0' } }, 'Federação dos 27 Estados & Vitrine do Jogador'),
        h('div', { class: 'cordel-card', 'data-testid': 'player-showcase-trio', style: { backgroundColor: CORDEL_PALETTE.cremePapel, marginBottom: '10px' } }, [
          h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '6px' } }, [
            h('span', { class: 'cordel-badge', style: { backgroundColor: CORDEL_PALETTE.amareloMilho, fontWeight: 'bold' } }, 'Título: Supremo Sertão'),
            h('span', { class: 'cordel-badge', style: { backgroundColor: CORDEL_PALETTE.terracota, color: CORDEL_PALETTE.cremePapel } }, 'Moldura: Ouro Cangaço'),
            h('strong', { style: { color: CORDEL_PALETTE.verdeMata } }, 'Poder Total do Trio: 16.800'),
          ]),
          h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } }, [
            h('span', { style: { padding: '4px 8px', border: '1px solid #1B1B1B', backgroundColor: '#FFF' } }, '⭐ #1 Galo Campina (Brasa - Nv 25)'),
            h('span', { style: { padding: '4px 8px', border: '1px solid #1B1B1B', backgroundColor: '#FFF' } }, '⭐ #2 Zabumba (Estrondo - Nv 25)'),
            h('span', { style: { padding: '4px 8px', border: '1px solid #1B1B1B', backgroundColor: '#FFF' } }, '⭐ #4 Faísca (Correnteza - Nv 25)'),
          ]),
        ]),
        h('div', { 'data-testid': 'uf-ranking-table', style: { overflowX: 'auto', marginBottom: '10px' } }, [
          h('h5', { style: { margin: '4px 0' } }, `Ranking Nacional das Federações (${BRAZILIAN_FEDERATION_LIST.length} UFs):`),
          h('table', { style: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' } }, [
            h('thead', [
              h('tr', { style: { backgroundColor: CORDEL_PALETTE.tintaXilo, color: CORDEL_PALETTE.cremePapel } }, [
                h('th', { style: { padding: '4px 8px' } }, 'Pos.'),
                h('th', { style: { padding: '4px 8px' } }, 'UF'),
                h('th', { style: { padding: '4px 8px' } }, 'Estado'),
                h('th', { style: { padding: '4px 8px' } }, 'Região'),
                h('th', { style: { padding: '4px 8px' } }, 'Pontos'),
                h('th', { style: { padding: '4px 8px' } }, 'Bônus Orgulho'),
              ]),
            ]),
            h('tbody', DEFAULT_TOP_UFS.map((s) =>
              h('tr', { key: s.uf, style: { borderBottom: '1px solid #ccc' } }, [
                h('td', { style: { padding: '4px 8px', fontWeight: 'bold' } }, `${s.rank}º`),
                h('td', { style: { padding: '4px 8px' } }, s.uf),
                h('td', { style: { padding: '4px 8px' } }, s.name),
                h('td', { style: { padding: '4px 8px' } }, s.region),
                h('td', { style: { padding: '4px 8px' } }, s.trophies.toLocaleString('pt-BR')),
                h('td', { style: { padding: '4px 8px' } }, `+${Math.round((s.multiplier - 1) * 100)}%`),
              ]),
            )),
          ]),
        ]),
        h('div', { class: 'cordel-card', style: { backgroundColor: '#FDFBF7' } }, [
          h('button', {
            type: 'button', 'data-testid': 'button-visit-friend-farm',
            style: {
              backgroundColor: CORDEL_PALETTE.verdeMata, color: CORDEL_PALETTE.cremePapel,
              border: '2px solid #1B1B1B', padding: '8px 12px', fontWeight: 'bold', cursor: 'pointer',
            },
            onClick: handleVisitFriend,
          }, 'Visitar Fazenda do Compadre Zé (PE)'),
          h('p', {
            'data-testid': 'friendship-bonus-result',
            style: { fontWeight: 'bold', color: CORDEL_PALETTE.tintaXilo, marginTop: '6px' },
          }, bonusMessage.value),
        ]),
      ]);
  },
});
