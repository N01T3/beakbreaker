export type DayNightPhase = 'DIA' | 'NOITE';

export interface DayNightFilterState {
  phase: DayNightPhase;
  hourOfDay: number;
  ambientTintHex: string;
  ambientAlpha: number;
  solProductionBonusPct: number;
  luaProductionBonusPct: number;
}

export class DayNightFilter {
  private hourOfDay = 12;

  constructor(initialHour = 12) {
    this.setHour(initialHour);
  }

  public setHour(hour: number): DayNightFilterState {
    const normalized = ((Math.floor(hour) % 24) + 24) % 24;
    this.hourOfDay = normalized;
    return this.getState();
  }

  public advanceMinutes(minutes: number): DayNightFilterState {
    const extraHours = Math.floor(minutes / 60);
    return this.setHour(this.hourOfDay + extraHours);
  }

  public isDaytime(): boolean {
    return this.hourOfDay >= 6 && this.hourOfDay < 18;
  }

  public getElementProductionMultiplier(element: string): number {
    const isDay = this.isDaytime();
    if (isDay && element === 'Sol') return 1.1;
    if (!isDay && element === 'Lua') return 1.1;
    return 1.0;
  }

  public getState(): DayNightFilterState {
    const isDay = this.isDaytime();
    return {
      phase: isDay ? 'DIA' : 'NOITE',
      hourOfDay: this.hourOfDay,
      ambientTintHex: isDay ? '#FFFBEB' : '#1E1B4B',
      ambientAlpha: isDay ? 1.0 : 0.82,
      solProductionBonusPct: isDay ? 10 : 0,
      luaProductionBonusPct: isDay ? 0 : 10,
    };
  }
}
