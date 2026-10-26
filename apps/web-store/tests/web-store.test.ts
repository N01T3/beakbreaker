import { describe, expect, it } from 'vitest';
import { OfficialPixWebStore, PIX_WEB_STORE_BONUS_RATIO } from '../src/index.js';

describe('@beakbreaker/web-store Official Pix Web Store (+15% Bonus)', () => {
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
});
