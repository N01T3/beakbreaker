export type FtueStep =
  | 'AGE_GATE_18PLUS'
  | 'VO_TONHO_WELCOME'
  | 'CHOOSE_EGG_1_OF_3'
  | 'FIRST_ARENA_DUEL'
  | 'UPGRADE_SEDE_2'
  | 'COMPLETED';

export type StarterEggSlot = 'OVO_ESQUERDO' | 'OVO_CENTRAL' | 'OVO_DIREITO';

export interface GuaranteedStarterRooster {
  id: 'rooster_05_brisa_do_rio';
  number: 5;
  name: 'Brisa do Rio';
  rarity: 'Raro';
  roosterClass: 'Suporte';
  primaryElement: 'Correnteza';
}

export interface FtueState {
  currentStep: FtueStep;
  ageVerified18Plus: boolean;
  birthYear: number | null;
  selectedEgg: StarterEggSlot | null;
  awardedRooster: GuaranteedStarterRooster | null;
  sedeLevel: number;
  elapsedMinutes: number;
  voTonhoDialogue: string;
}

export class FtueController {
  private state: FtueState = {
    currentStep: 'AGE_GATE_18PLUS',
    ageVerified18Plus: false,
    birthYear: null,
    selectedEgg: null,
    awardedRooster: null,
    sedeLevel: 1,
    elapsedMinutes: 0,
    voTonhoDialogue: 'Verifique sua maioridade (18+) conforme o ECA Digital para entrar no Arraial.',
  };

  public verifyAge18Plus(birthYear: number, referenceYear = 2026): boolean {
    const age = referenceYear - Math.floor(birthYear);
    if (age < 18) {
      this.state.ageVerified18Plus = false;
      return false;
    }
    this.state.birthYear = birthYear;
    this.state.ageVerified18Plus = true;
    this.state.currentStep = 'VO_TONHO_WELCOME';
    this.state.elapsedMinutes = 2;
    this.state.voTonhoDialogue =
      'Achegue-se, meu neto! Eu sou o Vô Tonho e vou lhe ensinar a cuidar da Fazenda Viva!';
    return true;
  }

  public advanceToEggSelection(): boolean {
    if (!this.state.ageVerified18Plus) return false;
    this.state.currentStep = 'CHOOSE_EGG_1_OF_3';
    this.state.elapsedMinutes = 5;
    this.state.voTonhoDialogue =
      'Escolha 1 entre os 3 ovos do Ninhal! O destino já reservou uma ave especial para você.';
    return true;
  }

  public chooseStarterEgg(slot: StarterEggSlot): GuaranteedStarterRooster | null {
    if (this.state.currentStep !== 'CHOOSE_EGG_1_OF_3') return null;
    this.state.selectedEgg = slot;
    // Regra oficial do FTUE (15 min): qualquer um dos 3 ovos garante #5 Brisa do Rio (Raro)
    this.state.awardedRooster = {
      id: 'rooster_05_brisa_do_rio',
      number: 5,
      name: 'Brisa do Rio',
      rarity: 'Raro',
      roosterClass: 'Suporte',
      primaryElement: 'Correnteza',
    };
    this.state.currentStep = 'FIRST_ARENA_DUEL';
    this.state.elapsedMinutes = 10;
    this.state.voTonhoDialogue =
      'Que beleza! Nasceu o #5 Brisa do Rio (Raro)! Vamos testar o Canto dele na Estrada do Sertão!';
    return this.state.awardedRooster;
  }

  public completeFirstArenaDuel(): boolean {
    if (this.state.currentStep !== 'FIRST_ARENA_DUEL') return false;
    this.state.currentStep = 'UPGRADE_SEDE_2';
    this.state.elapsedMinutes = 13;
    this.state.voTonhoDialogue =
      'Vitória limpa! Agora vamos erguer a Sede Nível 2 para destravar o teto NG 10!';
    return true;
  }

  public upgradeToSede2(): boolean {
    if (this.state.currentStep !== 'UPGRADE_SEDE_2') return false;
    this.state.sedeLevel = 2;
    this.state.currentStep = 'COMPLETED';
    this.state.elapsedMinutes = 15;
    this.state.voTonhoDialogue =
      'Sede 2 concluída em 15 minutos! O Sertão inteiro está aberto para sua criação!';
    return true;
  }

  public getState(): Readonly<FtueState> {
    return { ...this.state };
  }
}
