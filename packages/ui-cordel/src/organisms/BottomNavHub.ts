import { defineComponent, h, type PropType } from 'vue';
import { CORDEL_BORDERS, CORDEL_PALETTE, CORDEL_TYPOGRAPHY } from '../tokens/cordelTokens.js';

export type HubTabId = 'Fazenda' | 'Lutar' | 'Galos' | 'Bando' | 'Loja';

export const HUB_TABS: readonly HubTabId[] = [
  'Fazenda',
  'Lutar',
  'Galos',
  'Bando',
  'Loja',
] as const;

export interface HubTabItem {
  id: HubTabId;
  label: string;
  icon: string;
  isActive: boolean;
  notificationCount: number;
  backgroundColor: string;
  textColor: string;
}

export interface BottomNavHubProps {
  activeTab: HubTabId;
  notifications?: Partial<Record<HubTabId, number>>;
}

export interface BottomNavHubModel {
  activeTab: HubTabId;
  borderClass: string;
  tabs: HubTabItem[];
}

const TAB_ICONS: Record<HubTabId, string> = {
  Fazenda: 'icon-tab-fazenda',
  Lutar: 'icon-tab-lutar',
  Galos: 'icon-tab-galos',
  Bando: 'icon-tab-bando',
  Loja: 'icon-tab-loja',
};

export function buildBottomNavHub(props: BottomNavHubProps): BottomNavHubModel {
  const tabs: HubTabItem[] = HUB_TABS.map((id) => {
    const isActive = id === props.activeTab;
    const notificationCount = Math.max(0, Math.floor(props.notifications?.[id] ?? 0));
    return {
      id,
      label: id,
      icon: TAB_ICONS[id],
      isActive,
      notificationCount,
      backgroundColor: isActive ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.cremePapel,
      textColor: CORDEL_PALETTE.tintaXilo,
    };
  });

  return {
    activeTab: props.activeTab,
    borderClass: CORDEL_BORDERS.xiloFrame,
    tabs,
  };
}

export const BottomNavHub = defineComponent({
  name: 'BottomNavHub',
  props: {
    activeTab: { type: String as PropType<HubTabId>, required: true },
    notifications: {
      type: Object as PropType<Partial<Record<HubTabId, number>>>,
      default: () => ({}),
    },
  },
  emits: ['changeTab'],
  setup(props, { emit }) {
    return () => {
      const model = buildBottomNavHub(props);
      return h(
        'nav',
        {
          class: `bottom-nav-hub ${model.borderClass}`,
          style: { fontFamily: CORDEL_TYPOGRAPHY.displayFont },
        },
        model.tabs.map((tab) =>
          h(
            'button',
            {
              key: tab.id,
              type: 'button',
              class: `bottom-nav-hub__tab ${tab.isActive ? 'is-active' : ''}`,
              style: {
                backgroundColor: tab.backgroundColor,
                color: tab.textColor,
              },
              onClick: () => emit('changeTab', tab.id),
            },
            [
              h('span', { class: `bottom-nav-hub__icon ${tab.icon}` }),
              h('span', { class: 'bottom-nav-hub__label' }, tab.label),
              tab.notificationCount > 0
                ? h('span', { class: 'bottom-nav-hub__badge' }, String(tab.notificationCount))
                : null,
            ],
          ),
        ),
      );
    };
  },
});
