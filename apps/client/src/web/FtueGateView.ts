import { defineComponent, h, ref, type PropType } from 'vue';
import { CORDEL_PALETTE, CordelWoodFrame } from '@beakbreaker/ui-cordel';
import type { WebRuntime } from './createWebRuntime.js';
import type { StarterEggSlot } from '../features/ftue/FtueController.js';

export const FtueGateView = defineComponent({
  name: 'FtueGateView',
  props: {
    runtime: { type: Object as PropType<WebRuntime>, required: true },
  },
  emits: ['ftueReady'],
  setup(props, { emit }) {
    const birthYearInput = ref(1995);
    const errorMsg = ref('');

    const onConfirmAge = () => {
      const ok = props.runtime.verifyAge(birthYearInput.value);
      if (!ok) {
        errorMsg.value = 'Acesso permitido somente para maiores de 18 anos (ECA Digital).';
        return;
      }
      errorMsg.value = '';
    };

    const onSelectEgg = (slot: StarterEggSlot) => {
      const awarded = props.runtime.chooseEgg(slot);
      if (awarded) {
        emit('ftueReady', awarded);
      }
    };

    return () => {
      const ftue = props.runtime.state.ftue;
      if (ftue.awardedRooster) {
        return h(
          'div',
          {
            class: 'cordel-card',
            'data-testid': 'ftue-awarded-banner',
            style: { backgroundColor: '#FEF3C7' },
          },
          [
            h(
              'strong',
              { 'data-testid': 'ftue-rooster-name' },
              `Vô Tonho: Ave Inicial Garantida — #${ftue.awardedRooster.number} ${ftue.awardedRooster.name} (${ftue.awardedRooster.rarity} / ${ftue.awardedRooster.primaryElement})`,
            ),
            h('p', { style: { margin: '4px 0 0 0', fontSize: '13px' } }, ftue.voTonhoDialogue),
          ],
        );
      }

      return h(
        CordelWoodFrame,
        {
          title: 'ECA Digital (18+) & Boas-Vindas do Vô Tonho',
          subtitle: ftue.voTonhoDialogue,
        },
        {
          default: () => [
            !ftue.ageVerified18Plus
              ? h('div', { 'data-testid': 'age-gate-modal', class: 'cordel-card' }, [
                  h('p', 'Confirme seu ano de nascimento (Verificação Etária 18+ obrigatória):'),
                  h('div', { style: { display: 'flex', gap: '8px', alignItems: 'center' } }, [
                    h('input', {
                      'data-testid': 'input-birth-year',
                      type: 'number',
                      value: birthYearInput.value,
                      onInput: (e: Event) => {
                        birthYearInput.value = Number((e.target as HTMLInputElement).value);
                      },
                      style: {
                        padding: '6px 10px',
                        border: '2px solid #1B1B1B',
                        fontWeight: 'bold',
                      },
                    }),
                    h(
                      'button',
                      {
                        type: 'button',
                        'data-testid': 'btn-confirm-18plus',
                        style: {
                          backgroundColor: CORDEL_PALETTE.amareloMilho,
                          border: '2px solid #1B1B1B',
                          padding: '8px 14px',
                          fontWeight: 'bold',
                        },
                        onClick: onConfirmAge,
                      },
                      'Confirmar 18+ (ECA Digital)',
                    ),
                  ]),
                  errorMsg.value
                    ? h('p', { style: { color: CORDEL_PALETTE.vermelhoCrista } }, errorMsg.value)
                    : null,
                ])
              : h('div', { 'data-testid': 'ftue-egg-selection', class: 'cordel-card' }, [
                  h(
                    'h3',
                    'Escolha 1 entre 3 Ovos do Ninhal (Garantia FTUE: #5 Brisa do Rio):',
                  ),
                  h('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap' } }, [
                    (['OVO_ESQUERDO', 'OVO_CENTRAL', 'OVO_DIREITO'] as StarterEggSlot[]).map(
                      (slot, idx) =>
                        h(
                          'button',
                          {
                            key: slot,
                            type: 'button',
                            'data-testid': `btn-egg-${idx + 1}`,
                            style: {
                              backgroundColor: CORDEL_PALETTE.verdeMata,
                              color: CORDEL_PALETTE.cremePapel,
                              border: '2px solid #1B1B1B',
                              padding: '10px 14px',
                              fontWeight: 'bold',
                            },
                            onClick: () => onSelectEgg(slot),
                          },
                          `Escolher Ovo #${idx + 1} (${slot})`,
                        ),
                    ),
                  ]),
                ]),
          ],
        },
      );
    };
  },
});
