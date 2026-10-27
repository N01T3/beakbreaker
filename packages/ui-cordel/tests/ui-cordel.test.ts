import { describe, expect, it } from 'vitest';
import {
  CORDEL_BORDERS,
  CORDEL_PALETTE,
  CORDEL_SHADOWS,
  CORDEL_TYPOGRAPHY,
  HUB_TABS,
  buildBottomNavHub,
  buildCordelButton,
  buildCordelWoodFrame,
  buildDualCombatBar,
  buildEquipmentSlot,
  buildPityProgressBar,
  buildResourcePill,
  buildRoosterAtletaCard,
  buildRopeBadge,
  buildStarRow,
  buildWoodcutHeader,
} from '../src/index.js';

describe('@beakbreaker/ui-cordel Design System', () => {
  it('exposes official Cordel Pop palette and typography tokens', () => {
    expect(CORDEL_PALETTE).toEqual({
      vermelhoCrista: '#D7263D',
      amareloMilho: '#F4B400',
      terracota: '#C0652E',
      verdeMata: '#2E7D32',
      azulAnil: '#1E3A8A',
      cremePapel: '#F5E9D3',
      tintaXilo: '#1B1B1B',
    });
    expect(CORDEL_TYPOGRAPHY.displayFont).toBe('Lilita One');
    expect(CORDEL_TYPOGRAPHY.bodyFont).toBe('Nunito');
    expect(CORDEL_TYPOGRAPHY.woodcutSerif).toBe('Alfa Slab One');
    expect(CORDEL_SHADOWS.woodcut).toBe('4px 4px 0 #1B1B1B');
    expect(CORDEL_BORDERS.xiloShadow).toBe('4px 4px 0 #1B1B1B');
  });

  it('builds StarRow differentiating 1-5 yellow stars and 6-10 red Astral Awakening stars', () => {
    const fiveStar = buildStarRow({ stars: 5 });
    expect(fiveStar.yellowStars).toBe(5);
    expect(fiveStar.redAstralStars).toBe(0);
    expect(fiveStar.isAstralAwakened).toBe(false);
    expect(fiveStar.statBonusPercent).toBe(75);
    expect(fiveStar.items.every((item) => item.colorHex === '#F4B400')).toBe(true);

    const eightStar = buildStarRow({ stars: 8 });
    expect(eightStar.yellowStars).toBe(5);
    expect(eightStar.redAstralStars).toBe(3);
    expect(eightStar.isAstralAwakened).toBe(true);
    expect(eightStar.statBonusPercent).toBe(120);
    expect(eightStar.items.filter((i) => i.tier === 'astral')).toHaveLength(3);
    expect(eightStar.items[0]?.colorHex).toBe('#D7263D');
  });

  it('builds atoms (CordelButton, RopeBadge, ResourcePill)', () => {
    const btn = buildCordelButton({ label: 'LUTAR', variant: 'danger' });
    expect(btn.backgroundColor).toBe('#D7263D');
    expect(btn.borderClass).toContain('border-2 border-[#1B1B1B]');

    const badge = buildRopeBadge({ text: 'Brasa', kind: 'element', element: 'Brasa' });
    expect(badge.backgroundColor).toBe('#D7263D');

    const pill = buildResourcePill({ currency: 'folego', amount: 90, cap: 120 });
    expect(pill.formattedValue).toBe('90/120');
  });

  it('builds molecules (RoosterAtletaCard, DualCombatBar, PityProgressBar, EquipmentSlot)', () => {
    const card = buildRoosterAtletaCard(
      {
        id: 'r_05',
        number: 5,
        name: 'Brisa do Rio',
        rarity: 'Raro',
        roosterClass: 'Suporte',
        primaryElement: 'Correnteza',
        level: 10,
        stars: 3,
        canto: 1000,
      },
      'battle',
    );
    expect(card.formattedNumber).toBe('#05');
    expect(card.isReadySpecial).toBe(true);

    const bar = buildDualCombatBar({ vigor: 500, maxVigor: 1000, canto: 1000 });
    expect(bar.vigorPercent).toBe(50);
    expect(bar.isCantoFull).toBe(true);

    const pityNormal = buildPityProgressBar({ currentPity: 20 });
    expect(pityNormal.counterLabel).toBe('20/80');
    expect(pityNormal.isSoftPityActive).toBe(false);
    expect(pityNormal.oddsDisclosure.legendaryPct).toBe(2.0);

    const pitySoft = buildPityProgressBar({ currentPity: 60 });
    expect(pitySoft.isSoftPityActive).toBe(true);
    expect(pitySoft.oddsDisclosure.legendaryPct).toBe(7.0);

    const pityHard = buildPityProgressBar({ currentPity: 79 });
    expect(pityHard.oddsDisclosure.legendaryPct).toBe(100.0);

    const slot = buildEquipmentSlot({
      slotIndex: 1,
      setId: 'BrasaViva',
      refineLevel: 15,
    });
    expect(slot.isMaxRefined).toBe(true);
    expect(slot.refineLabel).toBe('+15');
  });

  it('builds organisms (CordelWoodFrame, WoodcutHeader, BottomNavHub)', () => {
    const frame = buildCordelWoodFrame({ title: 'Santuário Genético' });
    expect(frame.borderClass).toBe('border-2 border-[#1B1B1B]');
    expect(frame.backgroundColor).toBe('#F5E9D3');
    expect(frame.buntingFlagColors).toHaveLength(5);

    const header = buildWoodcutHeader({
      playerName: 'Tonho',
      breederLevel: 25,
      sedeLevel: 6,
      milho: 15400,
      penasDouradas: 320,
      coroas: 50,
      folego: 100,
    });
    expect(header.breederBadge).toBe('NC 25');
    expect(header.sedeBadge).toBe('Sede 6');
    expect(header.isMuted).toBe(false);
    expect(header.audioIcon).toBe('🔊');
    expect(header.audioLabel).toBe('Som Ativo');

    const mutedHeader = buildWoodcutHeader({
      playerName: 'Tonho',
      breederLevel: 25,
      sedeLevel: 6,
      milho: 15400,
      penasDouradas: 320,
      coroas: 50,
      folego: 100,
      isMuted: true,
    });
    expect(mutedHeader.isMuted).toBe(true);
    expect(mutedHeader.audioIcon).toBe('🔇');
    expect(mutedHeader.audioLabel).toBe('Mudo');

    const nav = buildBottomNavHub({ activeTab: 'Lutar' });
    expect(HUB_TABS).toEqual(['Fazenda', 'Lutar', 'Galos', 'Bando', 'Loja']);
    expect(nav.tabs.find((t) => t.id === 'Lutar')?.isActive).toBe(true);
  });
});
