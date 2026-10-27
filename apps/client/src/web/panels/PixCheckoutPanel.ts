import { defineComponent, h, ref, type PropType } from 'vue';
import { CORDEL_PALETTE } from '@beakbreaker/ui-cordel';
import type { WebRuntime } from '../createWebRuntime.js';
import { buildPixEmvPayload, buildWoodcutQrSvg, pickSummonedRooster } from './pixPayload.js';

interface PixBundle {
  id: 'mestre' | 'cordel';
  name: string;
  baseCoroas: number;
  totalCoroas: number;
  amountBrlCents: number;
  priceLabel: string;
}

export const PIX_BUNDLES: readonly PixBundle[] = [
  { id: 'mestre', name: 'Baú Mestre', baseCoroas: 1_000, totalCoroas: 1_150, amountBrlCents: 8_990, priceLabel: 'R$ 89,90' },
  { id: 'cordel', name: 'Pacote Cordel', baseCoroas: 300, totalCoroas: 345, amountBrlCents: 2_990, priceLabel: 'R$ 29,90' },
];

interface PendingPixOrder {
  txId: string;
  bundle: PixBundle;
  payload: string;
  svg: string;
}

const btnStyle = (bg: string, active = false) => ({
  backgroundColor: bg, color: CORDEL_PALETTE.cremePapel,
  border: active ? '3px double #1B1B1B' : '2px solid #1B1B1B', padding: '8px 14px', fontWeight: 'bold',
});

export const PixCheckoutPanel = defineComponent({
  name: 'PixCheckoutPanel',
  props: {
    runtime: { type: Object as PropType<WebRuntime>, required: true },
    currentPity: { type: Number, required: true },
    onGrantCoroas: { type: Function as PropType<(coroas: number) => void>, required: true },
  },
  setup(props) {
    const selectedId = ref<PixBundle['id']>('cordel');
    const pending = ref<PendingPixOrder | null>(null);
    const lastPayload = ref('');
    const lastSvg = ref('');
    const webhookStatus = ref('Selecione um pacote e gere o QR Pix.');
    let orderSeq = 0;

    const selectedBundle = (): PixBundle =>
      PIX_BUNDLES.find((b) => b.id === selectedId.value) ?? PIX_BUNDLES[1]!;

    const handleSelect = (id: PixBundle['id']) => {
      selectedId.value = id;
      pending.value = null;
      webhookStatus.value = `Pacote selecionado: ${selectedBundle().name}. Gere o QR Pix.`;
    };

    const handleGenerate = () => {
      orderSeq += 1;
      const bundle = selectedBundle();
      const txId = `BBPIX${Date.now().toString(36).toUpperCase()}${orderSeq}`;
      const payload = buildPixEmvPayload({
        txId,
        amountBrlCents: bundle.amountBrlCents,
        merchantName: 'BeakBreaker Cordel',
        city: 'Sao Paulo',
      });
      const svg = buildWoodcutQrSvg(payload);
      pending.value = { txId, bundle, payload, svg };
      lastPayload.value = payload;
      lastSvg.value = svg;
      webhookStatus.value = `QR Pix gerado (${bundle.priceLabel}). Aguardando confirmação do webhook...`;
    };

    const handleWebhook = () => {
      const order = pending.value;
      if (!order) {
        webhookStatus.value = 'Nenhum pedido pendente: gere o QR Pix primeiro.';
        return;
      }
      const store = props.runtime.storeCtrl;
      const res = store.purchaseCoroasPackage(
        order.txId,
        `${order.bundle.name} Pix (+15% Coroas)`,
        order.bundle.amountBrlCents,
        order.bundle.baseCoroas,
        true,
      );
      if (res.ok && res.record) {
        props.onGrantCoroas(res.record.coroasGranted);
        webhookStatus.value = `Pix confirmado (${order.txId}): +${res.record.coroasGranted} Coroas creditadas!`;
      } else {
        webhookStatus.value = `Pix bloqueado pelo Limite Mensal ECA Digital (${res.reason ?? 'limite'})`;
      }
      pending.value = null;
      props.runtime.state.remainingBudgetCents = store.getRemainingMonthlyBudgetBrlCents();
      props.runtime.state.transactionsCount = store.getTransactionsLast90Days().length;
    };

    return () => {
      const summoned = pickSummonedRooster(props.runtime.roosters40, props.currentPity, 'chocadeira');
      const summonText = summoned
        ? `Último ovo: #${String(summoned.number).padStart(2, '0')} ${summoned.name} (${summoned.rarity})`
        : 'Último ovo: nenhuma ave disponível';
      const bundleBtn = (b: PixBundle, bg: string) =>
        h(
          'button',
          {
            type: 'button',
            'data-testid': `btn-select-bundle-${b.id}`,
            style: btnStyle(bg, selectedId.value === b.id),
            onClick: () => handleSelect(b.id),
          },
          `${b.name} (${b.totalCoroas.toLocaleString('pt-BR')} Coroas) — ${b.priceLabel}`,
        );

      return h('div', {
        class: 'cordel-card',
        'data-testid': 'pix-checkout-panel',
        style: {
          backgroundImage: "linear-gradient(rgba(245,238,220,0.92), rgba(245,238,220,0.95)), url('/assets/pranchas/loja-arraial-backdrop.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: '3px solid #1B1B1B',
        },
      }, [
        h('h3', 'Checkout Pix Web — Feira Sertaneja & QR em Xilogravura'),
        h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } }, [
          bundleBtn(PIX_BUNDLES[0]!, CORDEL_PALETTE.vermelhoCrista),
          bundleBtn(PIX_BUNDLES[1]!, CORDEL_PALETTE.verdeMata),
        ]),
        h('div', { style: { display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' } }, [
          h(
            'button',
            { type: 'button', 'data-testid': 'btn-generate-pix-qr', style: btnStyle('#1B1B1B'), onClick: handleGenerate },
            `Gerar QR Pix (${selectedBundle().priceLabel})`,
          ),
          h(
            'button',
            { type: 'button', 'data-testid': 'btn-simulate-pix-webhook', style: btnStyle(CORDEL_PALETTE.verdeMata), onClick: handleWebhook },
            'Simular Webhook Pix (pagamento confirmado)',
          ),
        ]),
        h('div', {
          'data-testid': 'pix-qr-preview',
          style: { marginTop: '8px', minHeight: '24px' },
          innerHTML: lastSvg.value,
        }),
        h(
          'code',
          { 'data-testid': 'pix-emv-code', style: { display: 'block', wordBreak: 'break-all', fontSize: '11px' } },
          lastPayload.value,
        ),
        h('p', { 'data-testid': 'pix-webhook-status' }, webhookStatus.value),
        h(
          'p',
          { 'data-testid': 'chocadeira-summon-log' },
          `${summonText} | Pity ${props.currentPity}/80`,
        ),
      ]);
    };
  },
});
