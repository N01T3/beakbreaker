import { defineStore } from 'pinia';
import type { HubTabId } from '@beakbreaker/ui-cordel';

export interface PlayerSessionState {
  playerId: string;
  playerName: string;
  ageVerified18Plus: boolean;
  breederLevel: number;
  sedeLevel: number;
  milho: number;
  penasDouradas: number;
  coroas: number;
  folego: number;
  maxFolego: number;
  currentPity: number;
  activeHubTab: HubTabId;
}

export function createInitialGameState(): PlayerSessionState {
  return {
    playerId: 'player_local_01',
    playerName: 'Criador do Sertão',
    ageVerified18Plus: false,
    breederLevel: 1,
    sedeLevel: 1,
    milho: 500,
    penasDouradas: 100,
    coroas: 50,
    folego: 120,
    maxFolego: 120,
    currentPity: 0,
    activeHubTab: 'Fazenda',
  };
}

export const useGameStore = defineStore('beakbreaker-game', {
  state: (): PlayerSessionState => createInitialGameState(),
  getters: {
    maxRoosterNgCap: (state): number => state.sedeLevel * 5,
    isSoftPityWindow: (state): boolean => state.currentPity + 1 >= 61,
    isAncestralUnlocked: (state): boolean => state.breederLevel >= 22,
  },
  actions: {
    setAgeVerified(verified: boolean) {
      this.ageVerified18Plus = verified;
    },
    setActiveTab(tab: HubTabId) {
      this.activeHubTab = tab;
    },
    addMilho(amount: number) {
      this.milho = Math.max(0, this.milho + Math.floor(amount));
    },
    spendFolego(cost: number): boolean {
      const c = Math.max(0, Math.floor(cost));
      if (this.folego < c) return false;
      this.folego -= c;
      return true;
    },
    advancePity(pulls: number, hitLegendary = false) {
      if (hitLegendary) {
        this.currentPity = 0;
      } else {
        this.currentPity = Math.min(80, this.currentPity + Math.max(1, Math.floor(pulls)));
      }
    },
  },
});
