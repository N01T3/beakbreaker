import { describe, expect, it } from 'vitest';
import {
  OfficialPixWebStore,
  PIX_WEB_STORE_BONUS_RATIO,
  renderPixStorePortalHtml,
} from '../src/index.js';

describe('@beakbreaker/web-store Official Pix Web Store (+15% Bonus & Cordel Pop Portal)', () => {
  it('applies exact +15% Pix bonus crowns and enforces ECA Digital 18+ lookup', () => {
    const store = new OfficialPixWebStore('secret-key-test');
    store.registerPlayerAccountForLookup({
      playerId: 'player_pe_01',
      displayName: 'Mestre Carcará',
      uf: 'PE',
      ageVerified18Plus: true,
    });

    const packages = store.listPackagesWith15PctBonus();
    expect(packages.length).toBeGreaterThanOrEqual(10);
    expect(PIX_WEB_STORE_BONUS_RATIO).toBe(0.15);

    const invoice = store.createPixCheckout(
      { playerId: 'player_pe_01', packageId: 'WEB_PIX_CROWNS_1000' },
      1_700_000_000_000,
      'BBPIXTEST1000',
    );
    expect(invoice.baseCrowns).toBe(1000);
    expect(invoice.bonusCrowns15Pct).toBe(150);
    expect(invoice.totalCrowns).toBe(1150);
    expect(invoice.pixCopiaEColaPayload).toContain('BR.GOV.BCB.PIX');
  });

  it('blocks underage accounts on lookup and renders Cordel Pop HTML portal with QR & EMV', () => {
    const store = new OfficialPixWebStore('secret-key-test');
    store.registerPlayerAccountForLookup({
      playerId: 'adult_ce_01',
      displayName: 'Lampião das Estrelas',
      uf: 'CE',
      ageVerified18Plus: true,
    });
    store.registerPlayerAccountForLookup({
      playerId: 'minor_sp_01',
      displayName: 'Aprendiz Jovem',
      uf: 'SP',
      ageVerified18Plus: false,
    });

    expect(() => store.lookupPlayerById('minor_sp_01')).toThrow(
      'ECA_DIGITAL_18PLUS_REQUIRED_FOR_WEB_STORE',
    );

    const invoice = store.createPixCheckout(
      { playerId: 'adult_ce_01', packageId: 'DIVINE_PASS_ELITE' },
      1_700_000_000_000,
      'TXIDCORDEL777',
    );

    const html = renderPixStorePortalHtml(store, 'adult_ce_01', invoice);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('+15% Bônus Pix');
    expect(html).toContain('Lampião das Estrelas');
    expect(html).toContain('ECA Digital 18+ (Lei 15.211/2025)');
    expect(html).toContain('TXIDCORDEL777');
    expect(html).toContain('BR.GOV.BCB.PIX');
    expect(html).toContain('data:image/svg+xml;utf8,');
  });
});
