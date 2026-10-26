import type { OfficialPixWebStore, PixCheckoutInvoice, WebStorePackage } from './index.js';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderPackageCardHtml(pkg: WebStorePackage): string {
  return `<article class="cordel-card" data-package-id="${escapeHtml(pkg.packageId)}">
    <div class="cordel-badge">+15% Bônus Pix</div>
    <h3>${escapeHtml(pkg.title)}</h3>
    <p class="crowns-total">
      <strong>${pkg.totalCrownsWithBonus} Coroas</strong>
      <span>(${pkg.baseCrowns} base + ${pkg.pixBonusCrowns15Pct} bônus Pix)</span>
    </p>
    <p class="price-tag">R$ ${pkg.priceBrl.toFixed(2).replace('.', ',')}</p>
    <small class="fee-note">Taxa Pix ~${pkg.gatewayFeeEstimatedPct}% (economia direta ao jogador)</small>
  </article>`;
}

function renderActiveInvoiceHtml(invoice: PixCheckoutInvoice): string {
  return `<section class="pix-checkout-panel" data-txid="${escapeHtml(invoice.txid)}">
    <h2>Cobrança Pix Gerada — +15% Coroas</h2>
    <div class="pix-grid">
      <div class="qr-box">
        <img src="${invoice.qrCodeSvgDataUri}" alt="QR Code Pix ${escapeHtml(invoice.txid)}" width="160" height="160" />
        <p>TXID: <code>${escapeHtml(invoice.txid)}</code></p>
      </div>
      <div class="emv-box">
        <label for="pix-copia-cola">Pix Copia e Cola (EMV):</label>
        <textarea id="pix-copia-cola" readonly rows="4">${escapeHtml(invoice.pixCopiaEColaPayload)}</textarea>
        <p class="invoice-summary">
          Pacote: <strong>${escapeHtml(invoice.packageId)}</strong> |
          Valor: <strong>R$ ${invoice.amountBrl.toFixed(2)}</strong> |
          Crédito: <strong>${invoice.totalCrowns} Coroas</strong> (${invoice.baseCrowns} + ${invoice.bonusCrowns15Pct} bônus)
        </p>
        <p class="expires-at">Expira em: ${escapeHtml(invoice.expiresAtIso)}</p>
      </div>
    </div>
  </section>`;
}

/**
 * Renderiza o Portal HTML Cordel Pop da Loja Web Oficial via Pix (+15% de Coroas,
 * grade de pacotes, EMV Copia-e-Cola & QR Code SVG, e selo ECA Digital 18+).
 */
export function renderPixStorePortalHtml(
  store: OfficialPixWebStore,
  selectedPlayerId?: string,
  activeInvoice?: PixCheckoutInvoice
): string {
  const packages = store.listPackagesWith15PctBonus();
  let playerBannerHtml = '<p class="player-status">Informe seu ID de Criador (18+ verificado) para gerar Pix.</p>';

  if (selectedPlayerId) {
    try {
      const account = store.lookupPlayerById(selectedPlayerId);
      playerBannerHtml = `<div class="player-verified" data-player-id="${escapeHtml(account.playerId)}">
        <span>Criador: <strong>${escapeHtml(account.displayName)}</strong> (${escapeHtml(account.uf)})</span>
        <span class="eca-badge">ECA Digital 18+ Verificado | Zero Cash-Out</span>
      </div>`;
    } catch (err) {
      playerBannerHtml = `<div class="player-error" role="alert">Erro de verificação: ${escapeHtml((err as Error).message)}</div>`;
    }
  }

  const cardsHtml = packages.map(renderPackageCardHtml).join('\n');
  const invoiceHtml = activeInvoice ? renderActiveInvoiceHtml(activeInvoice) : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>BeakBreaker v5.0 — Loja Web Oficial Pix (+15% Coroas)</title>
  <style>
    :root {
      --ochre: #D9822B;
      --parchment: #F5E9D3;
      --ink: #1B1B1B;
      --emerald: #1E7E48;
    }
    body {
      margin: 0;
      font-family: 'Georgia', serif;
      background: var(--parchment);
      color: var(--ink);
    }
    header.cordel-header {
      border-bottom: 4px solid var(--ink);
      background: var(--ochre);
      padding: 1.25rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .eca-compliance-pill {
      background: var(--ink);
      color: var(--parchment);
      padding: 0.4rem 0.8rem;
      font-weight: bold;
      font-size: 0.85rem;
    }
    main { max-width: 1080px; margin: 0 auto; padding: 1.5rem; }
    .package-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }
    .cordel-card {
      border: 3px solid var(--ink);
      background: #FFFDF8;
      padding: 1rem;
      box-shadow: 4px 4px 0 var(--ink);
    }
    .cordel-badge {
      display: inline-block;
      background: var(--emerald);
      color: #fff;
      padding: 0.2rem 0.5rem;
      font-size: 0.75rem;
      font-weight: bold;
    }
    .pix-checkout-panel {
      border: 3px solid var(--ink);
      background: #FFF8EA;
      padding: 1.25rem;
      margin: 1.25rem 0;
    }
  </style>
</head>
<body>
  <header class="cordel-header">
    <div>
      <h1>Galo de Briga: O Torneio — Loja Web Pix (+15% Coroas)</h1>
      <p>Estética Cordel Pop &amp; Xilogravura Digital — Entrega Instantânea via Webhook</p>
    </div>
    <div class="eca-compliance-pill">ECA Digital 18+ (Lei 15.211/2025) • Lei 9.605/98 • Zero Saque</div>
  </header>
  <main>
    ${playerBannerHtml}
    ${invoiceHtml}
    <section>
      <h2>Pacotes Oficiais com +15% de Bônus no Pix</h2>
      <div class="package-grid">
        ${cardsHtml}
      </div>
    </section>
  </main>
</body>
</html>`;
}
