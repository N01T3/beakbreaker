import { defineComponent, h, ref, type PropType } from 'vue';
import { CORDEL_PALETTE } from '@beakbreaker/ui-cordel';
import type { WebRuntime } from '../createWebRuntime.js';

export interface ClanTechNode {
  level: number;
  name: string;
  effect: string;
  requiredXp: number;
  unlocked?: boolean;
}

export const CLAN_ORB_COOLDOWN_MS = 8 * 60 * 60 * 1000;
export const CLAN_DAILY_DONATIONS_LIMIT = 5;

export const CLAN_TECH_TREE: readonly ClanTechNode[] = [
  { level: 1, name: 'Celeiro Solidário', effect: '+5% capacidade de celeiro', requiredXp: 0 },
  { level: 2, name: 'Adubo de Mandacaru', effect: '+5% produção de milho', requiredXp: 1000 },
  { level: 3, name: 'Muralha do Cangaço', effect: '+5% Vigor das defesas rurais', requiredXp: 2500 },
  { level: 4, name: 'Ferradura de Prata', effect: '+3% Velocidade em combates PvE', requiredXp: 5000 },
  { level: 5, name: 'Feira Expandida', effect: '+1 doação diária na feira', requiredXp: 8500 },
  { level: 6, name: 'Joia da Fênix', effect: 'desbloqueia compra de Joia da Fênix', requiredXp: 13000 },
  { level: 7, name: 'Canto Coletivo', effect: '+50 de Canto inicial na Guerra', requiredXp: 19000 },
  { level: 8, name: 'Raid Mestre', effect: 'desbloqueia Colosso Dificuldade 10', requiredXp: 27000 },
  { level: 9, name: 'Asas de Aço', effect: '+5% Defesa global do bando', requiredXp: 37000 },
  { level: 10, name: 'Sertão Soberano', effect: '+10% em todas recompensas', requiredXp: 50000 },
];

export class ClanTechMarketEngine {
  public clanLevel = 1;
  public clanXp = 0;
  public dailyDonations = 0;
  public lastRequestTimeMs = 0;
  public pendingRequests = [
    { id: 'req_01', species: '#1 Galo Campina', rarity: 'Comum', count: 1, max: 5 },
  ];

  constructor(initialLevel = 1) {
    this.clanLevel = initialLevel;
  }

  public getTechTree(): ClanTechNode[] {
    return CLAN_TECH_TREE.map((t) => ({
      ...t,
      unlocked: this.clanLevel >= t.level || this.clanXp >= t.requiredXp,
    }));
  }

  public donateMilho(amount: number) {
    this.clanXp += amount;
    for (const t of CLAN_TECH_TREE) {
      if (this.clanXp >= t.requiredXp && this.clanLevel < t.level) {
        this.clanLevel = t.level;
      }
    }
    return { clanLevel: this.clanLevel, clanXp: this.clanXp };
  }

  public requestOrbs(species: string, rarity: 'Comum' | 'Raro', nowMs = Date.now()) {
    if (this.lastRequestTimeMs > 0 && nowMs - this.lastRequestTimeMs < CLAN_ORB_COOLDOWN_MS) {
      return { success: false, reason: 'COOLDOWN_8H_ATIVO' };
    }
    this.lastRequestTimeMs = nowMs;
    this.pendingRequests.push({ id: `req_${Date.now()}`, species, rarity, count: 0, max: 5 });
    return { success: true };
  }

  public donateOrb(reqId?: string) {
    const maxDaily = this.clanLevel >= 5 ? 6 : CLAN_DAILY_DONATIONS_LIMIT;
    if (this.dailyDonations >= maxDaily) {
      return { success: false, reason: 'LIMITE_DIARIO_ATINGIDO' };
    }
    const target = this.pendingRequests.find((r) => r.id === reqId) ?? this.pendingRequests[0];
    if (!target) return { success: false, reason: 'SEM_PEDIDOS' };
    target.count += 1;
    this.dailyDonations += 1;
    this.clanXp += 200;
    return { success: true, medals: 50 };
  }
}

export const ClanTechMarketPanel = defineComponent({
  name: 'ClanTechMarketPanel',
  props: {
    runtime: { type: Object as PropType<WebRuntime>, required: true },
  },
  setup(props) {
    const engine = new ClanTechMarketEngine(props.runtime.clan.getClanLevel());
    const clanLevel = ref(engine.clanLevel);
    const clanXp = ref(engine.clanXp);
    const dailyDonations = ref(engine.dailyDonations);
    const marketStatus = ref('Feira de Orbes pronta (Cooldown 8h | Limite 5 doações/dia)');

    const handleDonateTech = () => {
      const res = engine.donateMilho(1000);
      props.runtime.clan.setClanLevel(res.clanLevel);
      clanLevel.value = res.clanLevel;
      clanXp.value = res.clanXp;
      marketStatus.value = `Doou 1.000 Milho! Bando Nível ${res.clanLevel} (${res.clanXp} XP)`;
    };

    const handleRequestOrbs = () => {
      const res = engine.requestOrbs('#1 Galo Campina', 'Comum');
      if (res.success) {
        marketStatus.value = 'Pedido de Orbe registrado na Feira! Cooldown de 8h iniciado.';
      } else {
        marketStatus.value = 'Cooldown de 8h ativo para pedidos de orbes!';
      }
    };

    const handleDonateOrb = () => {
      const res = engine.donateOrb();
      if (res.success) {
        dailyDonations.value = engine.dailyDonations;
        marketStatus.value = `Orbe doado com louvor! +50 Medalhas de Bando. (${dailyDonations.value}/5 hoje)`;
      } else {
        marketStatus.value = `Doação não permitida: ${res.reason}`;
      }
    };

    const btn = (bg: string, fg = '#1B1B1B') => ({
      backgroundColor: bg, color: fg, border: '2px solid #1B1B1B', padding: '6px 12px', fontWeight: 'bold', cursor: 'pointer',
    });

    return () => {
      const techs = engine.getTechTree();
      const maxDaily = clanLevel.value >= 5 ? 6 : CLAN_DAILY_DONATIONS_LIMIT;

      return h('div', { class: 'cordel-card', 'data-testid': 'clan-tech-market-panel' }, [
        h('h3', `Tecnologias do Bando (Nível ${clanLevel.value}/10) & Feira de Orbes`),
        h('p', { 'data-testid': 'market-cooldown-status' },
          `Doações Hoje: ${dailyDonations.value}/${maxDaily} | Cooldown de Pedido: 8h | XP Acumulado: ${clanXp.value}`),
        h('div', { 'data-testid': 'tech-tree-list', style: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px', margin: '8px 0' } },
          techs.map((t) =>
            h('div', {
              key: t.level, 'data-testid': `tech-item-${t.level}`,
              style: {
                padding: '4px 8px', border: '1px solid #1B1B1B',
                backgroundColor: t.unlocked ? CORDEL_PALETTE.cremePapel : '#E5E7EB',
                opacity: t.unlocked ? 1 : 0.65,
              },
            }, `${t.level}. ${t.name}: ${t.effect} ${t.unlocked ? '✓' : '(Bloqueado)'}`),
          ),
        ),
        h('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' } }, [
          h('button', {
            type: 'button', 'data-testid': 'btn-donate-tech', style: btn(CORDEL_PALETTE.amareloMilho),
            onClick: handleDonateTech,
          }, 'Contribuir 1.000 Milho p/ Tecnologia'),
          h('button', {
            type: 'button', 'data-testid': 'btn-request-orbs', style: btn(CORDEL_PALETTE.azulAnil, CORDEL_PALETTE.cremePapel),
            onClick: handleRequestOrbs,
          }, 'Pedir Orbe na Feira (Cooldown 8h)'),
          h('button', {
            type: 'button', 'data-testid': 'btn-donate-orbs', style: btn(CORDEL_PALETTE.verdeMata, CORDEL_PALETTE.cremePapel),
            onClick: handleDonateOrb,
          }, 'Doar Orbe (+50 Medalhas)'),
        ]),
        h('p', { 'data-testid': 'clan-tech-market-status', style: { fontStyle: 'italic', marginTop: '6px' } }, marketStatus.value),
      ]);
    };
  },
});
