import { reactive } from 'vue';
import { LAUNCH_ROOSTERS, SANCTUARY_RECIPES } from '@beakbreaker/game-data';
import { BattleEngine, createCombatUnitFromSpec } from '@beakbreaker/combat-core';
import { FtueController, type StarterEggSlot } from '../features/ftue/FtueController.js';
import { FarmController } from '../features/farm/FarmController.js';
import { CombatHudController } from '../features/combat-hud/CombatHudController.js';
import { RosterController, TOTAL_ORBS_TO_10_STARS } from '../features/roster/RosterController.js';
import { GeneticsController } from '../features/genetics/GeneticsController.js';
import { PveController } from '../features/pve/PveController.js';
import { ClanController } from '../features/clan/ClanController.js';
import { LiveOpsController } from '../features/liveops/LiveOpsController.js';
import { StoreController } from '../features/store/StoreController.js';
import type { SaintTowerId } from '../canvas/scenes/farm/IsoFarmScene.js';

export function createWebRuntime() {
  const ftue = new FtueController();
  const farm = new FarmController();
  farm.getScene().setSedeLevel(12);
  const combatHud = new CombatHudController();
  const roster = new RosterController();
  const genetics = new GeneticsController();
  const pve = new PveController();
  const clan = new ClanController();
  const liveOps = new LiveOpsController();
  const storeCtrl = new StoreController();

  const brasaPerch = farm.getScene().getPerch('perch_brasa_1')!;
  brasaPerch.addRooster({
    roosterId: 'rooster_01', name: 'Galo de Lata', element: 'Brasa', level: 5, stars: 2, baseMilhoPerMin: 25,
  });
  brasaPerch.tickProduction(12, () => 1.2);

  const correntezaPerch = farm.getScene().registerPerch({
    perchId: 'perch_correnteza_1', habitatType: 'Açude da Correnteza', level: 2, isoX: 340, isoY: 210,
  });
  correntezaPerch.addRooster({
    roosterId: 'rooster_05', name: 'Brisa do Rio', element: 'Correnteza', level: 5, stars: 3, baseMilhoPerMin: 30,
  });
  correntezaPerch.tickProduction(10, () => 1.25);

  for (const r of LAUNCH_ROOSTERS.slice(0, 6)) {
    roster.registerRooster({
      id: r.id, number: r.number, name: r.name, level: 10, stars: 3, orbsOwned: 600, equippedSet: 'BrasaViva', refineLevel: 12,
    });
  }

  const teamASpecs = [LAUNCH_ROOSTERS[0]!, LAUNCH_ROOSTERS[4]!, LAUNCH_ROOSTERS[8]!];
  const teamBSpecs = [LAUNCH_ROOSTERS[1]!, LAUNCH_ROOSTERS[5]!, LAUNCH_ROOSTERS[9]!];
  const parts = { tronco: 'base', cabeca: 'base', crista: 'base', asa_frente: 'base', cauda: 'base', canelas: 'base' };
  combatHud.getArenaScene().spawnActors([
    ...teamASpecs.map((s, i) => ({
      unitId: `A_${i}`, team: 'A' as const, row: s.preferredRow, roosterClass: s.roosterClass,
      maxVigor: s.baseStats.vigor, x: 150, y: 120 + i * 70, visualDNA: { id: s.id, parts },
    })),
    ...teamBSpecs.map((s, i) => ({
      unitId: `B_${i}`, team: 'B' as const, row: s.preferredRow, roosterClass: s.roosterClass,
      maxVigor: s.baseStats.vigor, x: 520, y: 120 + i * 70, visualDNA: { id: s.id, parts },
    })),
  ]);

  const state = reactive({
    ftue: ftue.getState(),
    storedPerchMilho: brasaPerch.storedMilho + correntezaPerch.storedMilho,
    lastHarvestedMilho: 0,
    unlockedTowers: farm.getScene().getUnlockedSaintTowers() as SaintTowerId[],
    battleSpeed: combatHud.getArenaScene().getSpeed(),
    torcidaTriggeredCount: 0,
    activePopups: ['PAH! -145'] as string[],
    lastBattleWinner: null as 'A' | 'B' | 'DRAW' | null,
    lastBattleTicks: 0,
    unitBars: teamASpecs.map((s, i) => ({
      id: `A_${i}`, name: s.name, roosterClass: s.roosterClass, vigor: s.baseStats.vigor, maxVigor: s.baseStats.vigor, canto: 350,
    })),
    sanctuaryLevel: 8,
    refineLevel: 15,
    colossusHp: 20_000_000,
    colossusPhase: clan.getColossusPhase(),
    heroRaceLap: 1,
    remainingBudgetCents: storeCtrl.getRemainingMonthlyBudgetBrlCents(),
    monthlyLimitCents: 50_000,
    lastStoreStatus: 'Pronto para transação transparente (ECA Digital 18+)',
    transactionsCount: 0,
  });

  return {
    state, ftue, farm, combatHud, roster, genetics, pve, clan, liveOps, storeCtrl,
    roosters40: LAUNCH_ROOSTERS,
    sanctuaryRecipes: SANCTUARY_RECIPES,
    totalOrbsTo10Stars: TOTAL_ORBS_TO_10_STARS,
    verifyAge(birthYear: number) {
      const ok = ftue.verifyAge18Plus(birthYear, 2026);
      if (ok) ftue.advanceToEggSelection();
      state.ftue = ftue.getState();
      return ok;
    },
    chooseEgg(slot: StarterEggSlot) {
      const awarded = ftue.chooseStarterEgg(slot);
      state.ftue = ftue.getState();
      return awarded;
    },
    harvestFarm(): number {
      const harvested = farm.harvestAll();
      state.lastHarvestedMilho = harvested;
      state.storedPerchMilho = 0;
      return harvested;
    },
    refillPerches() {
      brasaPerch.tickProduction(10, () => 1.2);
      correntezaPerch.tickProduction(10, () => 1.2);
      state.storedPerchMilho = brasaPerch.storedMilho + correntezaPerch.storedMilho;
    },
    unlockTower(tower: SaintTowerId) {
      state.unlockedTowers = [...farm.activateSaintTower(tower)];
    },
    setBattleSpeed(mult: 1 | 2 | 3) {
      combatHud.setSpeed(mult);
      state.battleSpeed = combatHud.getArenaScene().getSpeed();
    },
    cycleBattleSpeed() {
      state.battleSpeed = combatHud.cycleSpeed();
      return state.battleSpeed;
    },
    triggerTorcida() {
      const ok = combatHud.pressTorcidaButton();
      if (ok) {
        state.torcidaTriggeredCount += 1;
        for (const bar of state.unitBars) bar.canto = Math.min(1000, bar.canto + 200);
        if (!state.activePopups.some((p) => p.includes('PAH!'))) state.activePopups.unshift('PAH! -220');
      }
      return ok;
    },
    runArenaBattle3v3() {
      const teamA = teamASpecs.map((s, i) => createCombatUnitFromSpec(s, { id: `A_${i}`, team: 'A', slotIndex: i as 0 | 1 | 2 }));
      const teamB = teamBSpecs.map((s, i) => createCombatUnitFromSpec(s, { id: `B_${i}`, team: 'B', slotIndex: i as 0 | 1 | 2 }));
      const res = BattleEngine.simulate({ seed: 202610, teamA, teamB, mode: '3v3', torcidaTriggers: [{ tick: 5, team: 'A' }] });
      state.lastBattleWinner = res.winner;
      state.lastBattleTicks = res.durationTicks;
      const arena = combatHud.getArenaScene();
      arena.enqueueEvents([{ tick: arena.getCurrentTick() + 1, type: 'DAMAGE', targetId: 'B_0', value: 185 }]);
      arena.update(50);
      const popups = arena.popupPool.getActivePopups().map((p) => p.text);
      state.activePopups = popups.length > 0 ? popups : ['PAH! -185', 'CRÍTICO! -310'];
      return res;
    },
  };
}

export type WebRuntime = ReturnType<typeof createWebRuntime>;
