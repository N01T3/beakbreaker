import { computed, defineComponent, h, ref, type PropType } from 'vue';
import { CORDEL_PALETTE } from '@beakbreaker/ui-cordel';
import { ApiClient } from '../../services/ApiClient.js';
import type { WebRuntime } from '../createWebRuntime.js';

export const VIP_PERKS: Record<number, string> = {
  1: 'Moldura Cordel Bronze', 2: 'Emote Chapéu de Couro', 3: 'Efeito Poeira do Sertão',
  4: 'Título Criador Notável', 5: 'Moldura Xilo Prata', 6: 'Emote Canto Festivo',
  7: 'Cenário Rancho Rústico', 8: 'Moldura Entalhada Ouro', 9: 'Efeito Brilho do Arraial',
  10: 'Título Patrão Ilustre', 11: 'Skin de Xilogravura', 12: 'Moldura Mandacaru Diamante',
  13: 'Efeito Pegada Flamejante', 14: 'Emote Troféu de Barro', 15: 'Teto VIP: Trono Lendário & Ícone de Mestre',
};

const cordelBtn = (bg: string) => ({
  backgroundColor: bg, color: CORDEL_PALETTE.cremePapel, border: '2px solid #1B1B1B',
  padding: '6px 12px', fontWeight: 'bold' as const, cursor: 'pointer', marginRight: '6px', marginBottom: '6px',
});

const sectionCard = (extraStyle?: Record<string, string>) => ({
  backgroundColor: CORDEL_PALETTE.cremePapel, border: '2px solid #1B1B1B', padding: '10px', marginBottom: '10px', ...extraStyle,
});

export const StoreMonetizationOffersPanel = defineComponent({
  name: 'StoreMonetizationOffersPanel',
  props: {
    runtime: { type: Object as PropType<WebRuntime>, required: false },
    currentPity: { type: Number, default: 0 },
    playerId: { type: String, default: 'jogador_cordel' },
    apiClient: { type: Object as PropType<ApiClient>, required: false },
    onGrantCoroas: { type: Function as PropType<(n: number) => void>, required: false },
  },
  setup(props) {
    const api = props.apiClient ?? new ApiClient();
    const vault = ref(0);
    const farmerActive = ref(false);
    const orbClubActive = ref(false);
    const vipLevel = ref(1);
    const msg = ref('Ofertas Éticas & Clube do Arraial');
    const isFlash = computed(() => props.currentPity >= 58 && props.currentPity <= 65);

    const accumulateVault = async () => {
      vault.value = Math.min(500, vault.value + 50);
      await api.request('/api/store/golden-vault/accumulate', { accumulated: vault.value }, {
        method: 'POST', body: { playerId: props.playerId, won: true },
      });
      msg.value = `Cofre Dourado: ${vault.value}/500 Coroas acumuladas no jogo!`;
    };

    const smashVault = async () => {
      if (vault.value < 500) {
        msg.value = 'Cofre Dourado precisa de 500 Coroas para quebrar!';
        return;
      }
      await api.request('/api/store/golden-vault/smash', { creditedCrowns: 500 }, {
        method: 'POST', body: { playerId: props.playerId, paymentConfirmed: true },
      });
      props.onGrantCoroas?.(500);
      vault.value = 0;
      msg.value = 'Cofre quebrado por R$ 9,90 via Pix! +500 Coroas creditadas.';
    };

    const buyFarmer = () => {
      farmerActive.value = true;
      props.onGrantCoroas?.(300);
      msg.value = 'Cartão do Fazendeiro ativado (R$ 24,90): +300 Coroas imediatas!';
    };

    const claimFarmer = async () => {
      if (!farmerActive.value) {
        msg.value = 'Ative o Cartão do Fazendeiro primeiro!';
        return;
      }
      props.onGrantCoroas?.(60);
      await api.request('/api/store/farmer-card/claim-daily', { claimedFeathers: 60 }, {
        method: 'POST', body: { playerId: props.playerId },
      });
      msg.value = 'Diária do Fazendeiro coletada: +60 Coroas!';
    };

    const buyOrbClub = () => {
      orbClubActive.value = true;
      msg.value = 'Clube dos Orbes ativado: 15 orbes diários por 30 dias!';
    };

    const claimOrbClub = () => {
      if (!orbClubActive.value) {
        msg.value = 'Ative o Clube dos Orbes primeiro!';
        return;
      }
      msg.value = 'Coletado: +15 orbes diários do Clube dos Orbes!';
    };

    const setVip = (lvl: number) => {
      vipLevel.value = Math.max(1, Math.min(15, lvl));
    };

    const buyFlash = async () => {
      if (!isFlash.value) return;
      await api.request(`/api/store/flash-offer/${props.playerId}`, { success: true });
      msg.value = 'Oferta Relâmpago resgatada: 10 ovos com 40% de desconto!';
    };

    return () => h('div', {
      class: 'cordel-card', 'data-testid': 'store-monetization-offers-panel',
      style: {
        backgroundImage: "linear-gradient(rgba(245,238,220,0.92), rgba(245,238,220,0.95)), url('/assets/pranchas/loja-arraial-backdrop.webp')",
        backgroundSize: 'cover', backgroundPosition: 'center',
      },
    }, [
      h('h3', { style: { color: CORDEL_PALETTE.vermelhoCrista, marginTop: '0' } }, '🎪 Feira Sertaneja: Ofertas Éticas & Clube do Arraial'),
      h('p', { 'data-testid': 'offer-status-message', style: { fontStyle: 'italic', color: CORDEL_PALETTE.azulAnil } }, msg.value),

      h('div', { 'data-testid': 'golden-vault-card', style: sectionCard() }, [
        h('strong', 'Cofre Dourado (Acumule até 500 Coroas): '),
        h('span', { 'data-testid': 'vault-crowns-display' }, `${vault.value}/500 Coroas`),
        h('div', { style: { marginTop: '8px' } }, [
          h('button', { type: 'button', 'data-testid': 'btn-accumulate-vault', style: cordelBtn(CORDEL_PALETTE.amareloMilho), onClick: accumulateVault }, '+50 Coroas (Jogando)'),
          h('button', { type: 'button', 'data-testid': 'btn-break-vault', style: cordelBtn(CORDEL_PALETTE.verdeMata), onClick: smashVault }, 'Quebrar Cofre (R$ 9,90 Pix)'),
        ]),
      ]),

      h('div', { 'data-testid': 'farmer-card', style: sectionCard() }, [
        h('strong', 'Cartão do Fazendeiro (30 dias — R$ 24,90): '),
        h('span', { 'data-testid': 'farmer-status-display' }, farmerActive.value ? 'Ativo (300 instantâneas + 60 diárias)' : 'Inativo'),
        h('div', { style: { marginTop: '8px' } }, [
          h('button', { type: 'button', 'data-testid': 'btn-subscribe-farmer', style: cordelBtn(CORDEL_PALETTE.azulAnil), onClick: buyFarmer }, 'Assinar Cartão (R$ 24,90)'),
          h('button', { type: 'button', 'data-testid': 'btn-claim-farmer-daily', style: cordelBtn(CORDEL_PALETTE.amareloMilho), onClick: claimFarmer }, 'Coletar 60 Coroas Diárias'),
        ]),
      ]),

      h('div', { 'data-testid': 'orb-club-card', style: sectionCard() }, [
        h('strong', 'Clube dos Orbes (30 dias): '),
        h('span', { 'data-testid': 'orb-club-status-display' }, orbClubActive.value ? 'Ativo (15 orbes/dia)' : 'Inativo'),
        h('div', { style: { marginTop: '8px' } }, [
          h('button', { type: 'button', 'data-testid': 'btn-subscribe-orb-club', style: cordelBtn(CORDEL_PALETTE.azulAnil), onClick: buyOrbClub }, 'Entrar no Clube dos Orbes'),
          h('button', { type: 'button', 'data-testid': 'btn-claim-orb-daily', style: cordelBtn(CORDEL_PALETTE.amareloMilho), onClick: claimOrbClub }, 'Coletar 15 Orbes Diários'),
        ]),
      ]),

      h('div', { 'data-testid': 'vip-panel', style: sectionCard() }, [
        h('strong', 'Níveis VIP Cosméticos & Conveniência: '),
        h('span', { 'data-testid': 'vip-level-display' }, `VIP ${vipLevel.value}/15 — `),
        h('span', { 'data-testid': 'vip-perk-display' }, VIP_PERKS[vipLevel.value] ?? 'Teto VIP'),
        h('div', { style: { marginTop: '8px' } }, [
          h('button', { type: 'button', 'data-testid': 'btn-prev-vip', style: cordelBtn('#1B1B1B'), onClick: () => setVip(vipLevel.value - 1) }, 'VIP Anterior'),
          h('button', { type: 'button', 'data-testid': 'btn-next-vip', style: cordelBtn('#1B1B1B'), onClick: () => setVip(vipLevel.value + 1) }, 'Próximo VIP'),
        ]),
      ]),

      h('div', { 'data-testid': 'flash-pity-offer-card', style: sectionCard({ backgroundColor: isFlash.value ? '#FFFBEA' : CORDEL_PALETTE.cremePapel }) }, [
        h('strong', 'Oferta Relâmpago de Pity (Tiro 58–65 na Chocadeira): '),
        isFlash.value
          ? h('div', { 'data-testid': 'flash-offer-active', style: { marginTop: '6px' } }, [
              h('p', { style: { color: CORDEL_PALETTE.vermelhoCrista, fontWeight: 'bold' } }, '⚡ ATIVA! 10 ovos com 40% de desconto (Duração: 1 hora)!'),
              h('button', { type: 'button', 'data-testid': 'btn-buy-flash-offer', style: cordelBtn(CORDEL_PALETTE.vermelhoCrista), onClick: buyFlash }, 'Garantir 10 Ovos (-40%)'),
            ])
          : h('p', { 'data-testid': 'flash-offer-inactive' }, `Disponível apenas entre 58 e 65 de Pity (Atual: ${props.currentPity}/80)`),
      ]),
    ]);
  },
});
