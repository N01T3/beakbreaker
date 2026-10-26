import { createPinia, setActivePinia } from 'pinia';
import { describe, expect, it } from 'vitest';
import {
  ArenaScene,
  AssetLoader,
  ClanController,
  CombatHudController,
  FarmController,
  FtueController,
  GeneticsController,
  LiveOpsController,
  PixiAppManager,
  PveController,
  PvpController,
  ROOSTER_SLOTS,
  RosterController,
  SceneRouter,
  StoreController,
  TOTAL_ORBS_TO_10_STARS,
  XiloHitPopupPool,
  assembleRoosterSkin,
  createMockSkeletonAdapter,
  useGameStore,
} from '../src/index.js';

describe('@beakbreaker/client Canvas, Spine & Feature Controllers', () => {
  it('manages WebGPU/WebGL lifecycle within < 25 draw calls and < 120 MB VRAM', async () => {
    const app = new PixiAppManager();
    await app.init({ width: 1280, height: 720, preferWebGPU: true });
    const loader = new AssetLoader(app);
    const router = new SceneRouter(app, loader);

    const farm = new FarmController().getScene();
    const arena = new ArenaScene();
    router.registerScene(farm);
    router.registerScene(arena);

    await router.transitionTo('farm');
    expect(app.getTelemetry().isWithinDrawCallBudget).toBe(true);
    expect(app.getTelemetry().isWithinVramBudget).toBe(true);

    await router.transitionTo('arena');
    expect(app.getTelemetry().isWithinDrawCallBudget).toBe(true);
    expect(app.getTelemetry().isWithinVramBudget).toBe(true);

    router.disposeAll();
    app.destroy();
    expect(app.isInitialized()).toBe(false);
  });

  it('assembles 6 modular slots on rooster_master.skel with +15 equipment and golden plumage', () => {
    expect(ROOSTER_SLOTS).toEqual([
      'tronco',
      'cabeca',
      'crista',
      'asa_frente',
      'cauda',
      'canelas',
    ]);
    const adapter = createMockSkeletonAdapter();
    const res = assembleRoosterSkin(adapter, {
      id: 'hybrid_trovao_brisa',
      parts: {
        tronco: 'tronco/trovao',
        cabeca: 'cabeca/trovao',
        crista: 'crista/brisa',
        asa_frente: 'asa_frente/trovao',
        cauda: 'cauda/brisa',
        canelas: 'canelas/trovao',
      },
      equippedSetVisual: 'BrasaViva',
      isGoldenPlumage: true,
    });
    expect(res.masterRig).toBe('rooster_master.skel');
    expect(res.appliedEquipmentSkin).toBe('equip/BrasaViva');
    expect(res.isGoldenPlumage).toBe(true);
    expect(res.tintHex).toBe('#F4B400');
  });

  it('recycles XiloHitPopup instances across 1,800 ticks with 0 GC allocations', () => {
    const pool = new XiloHitPopupPool(16);
    for (let tick = 1; tick <= 1800; tick++) {
      const p = pool.spawn(tick % 10 === 0 ? 'INTERRUPT' : 'CRIT', 355, 100, 120);
      if (tick === 10) expect(p.text).toBe('CORTA-CANTO!');
      if (tick === 11) expect(p.text).toBe('CRÍTICO! -355');
      pool.tickAll();
    }
    expect(pool.getGcAllocationsCount()).toBe(0);
  });

  it('executes FTUE 15-min flow with 18+ age gate, #5 Brisa do Rio guaranteed and Sede 2', () => {
    const ftue = new FtueController();
    expect(ftue.verifyAge18Plus(2015, 2026)).toBe(false);
    expect(ftue.verifyAge18Plus(2000, 2026)).toBe(true);
    expect(ftue.advanceToEggSelection()).toBe(true);
    const hatched = ftue.chooseStarterEgg('OVO_CENTRAL');
    expect(hatched?.number).toBe(5);
    expect(hatched?.name).toBe('Brisa do Rio');
    expect(hatched?.rarity).toBe('Raro');
    expect(ftue.completeFirstArenaDuel()).toBe(true);
    expect(ftue.upgradeToSede2()).toBe(true);
    expect(ftue.getState().sedeLevel).toBe(2);
    expect(ftue.getState().elapsedMinutes).toBe(15);
  });

  it('validates Farm, Roster (11,200 Orbs), Genetics, PvE, PvP, Clan, LiveOps and Store', () => {
    const farm = new FarmController();
    expect(farm.upgradeSede(4).maxRoosterNg).toBe(20);
    expect(farm.setBreederLevel(22)).toBe(true);

    const hud = new CombatHudController();
    expect(hud.computeActiveSynergies(['Tanque', 'Tanque', 'Tanque'])).toEqual([]);
    expect(hud.computeActiveSynergies(['Tanque', 'Suporte', 'Atirador'])).toContain(
      'Muralha Viva',
    );
    expect(hud.computeActiveSynergies(['Tanque', 'Suporte', 'Atirador'])).toContain(
      'Bando Completo',
    );

    const roster = new RosterController();
    expect(roster.getTotalOrbCostRange(0, 5)).toBe(2_000);
    expect(roster.getTotalOrbCostRange(5, 10)).toBe(9_200);
    expect(roster.getTotalOrbCostRange(0, 10)).toBe(TOTAL_ORBS_TO_10_STARS);

    const genetics = new GeneticsController();
    expect(genetics.previewNinhalCross(30, 35, true).mutationChancePct).toBe(5);
    expect(genetics.setSanctuaryLevel(8) * 3).toBe(24);
    expect(genetics.calculateTreeOfLifeExtractionOrbs(1)).toBe(40);
    expect(genetics.calculateTreeOfLifeExtractionOrbs(30)).toBe(100);

    const pve = new PveController();
    expect(pve.getCampaignStageInfo(90).chapterNumber).toBe(6);
    expect(pve.getTowerFloorSpec(100).folegoCost).toBe(0);

    const pvp = new PvpController();
    pvp.setRating(2500);
    expect(pvp.isSupremo9v9Unlocked()).toBe(true);
    pvp.registerIncomingSaque('raid_1', 'enemy_99', 1000);
    expect(pvp.executeRevenge72h('raid_1').recoveredMilhoWithBonus).toBe(1500);
    expect(pvp.resolveTvSertaoBolaoPrediction('A', 'A')).toBe(500);

    const clan = new ClanController();
    expect(clan.startColossusRaid(10).maxHp).toBe(1_370_000_000);
    expect(clan.getWarMap().getVillageCount()).toBe(12);

    const liveops = new LiveOpsController();
    liveops.heroRaceScene.advanceNode('p_1', 75);
    expect(liveops.heroRaceScene.qualifiesForHeroicRooster('p_1')).toBe(true);

    const store = new StoreController();
    expect(store.evaluateFlashOffer(60).active).toBe(true);
    const tx = store.purchaseCoroasPackage('tx_1', 'Pacote Arraial', 5000, 1000, true);
    expect(tx.ok).toBe(true);
    expect(tx.record?.coroasGranted).toBe(1150);

    setActivePinia(createPinia());
    const gameStore = useGameStore();
    gameStore.advancePity(61);
    expect(gameStore.isSoftPityWindow).toBe(true);
  });
});
