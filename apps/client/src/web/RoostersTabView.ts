import { defineComponent, h, ref, type PropType } from 'vue';
import {
  CORDEL_PALETTE,
  CordelWoodFrame,
  EquipmentSlot,
  RoosterAtletaCard,
} from '@beakbreaker/ui-cordel';
import type { WebRuntime } from './createWebRuntime.js';
import { GeneticsSanctuaryPanel } from './panels/GeneticsSanctuaryPanel.js';
import { AstralLapidaryPanel } from './panels/AstralLapidaryPanel.js';
import { PedigreeLineagePanel } from './panels/PedigreeLineagePanel.js';

export const RoostersTabView = defineComponent({
  name: 'RoostersTabView',
  props: {
    runtime: { type: Object as PropType<WebRuntime>, required: true },
  },
  setup(props) {
    const parentANg = ref(32);
    const parentBNg = ref(35);
    const extractedOrbs = ref(props.runtime.genetics.calculateTreeOfLifeExtractionOrbs(30));

    const handleToggleParentNg = () => {
      parentANg.value = parentANg.value >= 30 ? 15 : 35;
      parentBNg.value = parentBNg.value >= 30 ? 15 : 35;
    };

    const handleRefine15 = () => {
      const res = props.runtime.roster.refineEquipment(
        'rooster_05_brisa_do_rio',
        'BrasaViva',
        15,
      );
      props.runtime.state.refineLevel = res.refineLevel;
    };

    return () => {
      const preview = props.runtime.genetics.previewNinhalCross(
        parentANg.value,
        parentBNg.value,
        true,
      );
      const recipesCount = props.runtime.genetics.setSanctuaryLevel(
        props.runtime.state.sanctuaryLevel,
      ) * 3;

      return h(
        CordelWoodFrame,
        {
          title: 'Álbum dos 40 Galos (#01 a #40), Genética & Oficina +15',
          subtitle: `Árvore da Vida (${props.runtime.totalOrbsTo10Stars} Orbes até 10★) | Santuário Genético (${recipesCount}/24 Receitas)`,
        },
        {
          default: () => [
            h('div', { 'data-testid': 'tab-content-galos' }, [
              h('div', { class: 'cordel-grid' }, [
                h('div', { class: 'cordel-card', 'data-testid': 'ninhal-calculator' }, [
                  h('h3', 'Calculadora do Ninhal'),
                  h(
                    'p',
                    `Pais NG ${parentANg.value} x NG ${parentBNg.value} -> Híbrido: ${preview.hybridChancePct}% | Mutação Secreta: ${preview.mutationChancePct}% | Peso Lendário: ${preview.goldenEmpowermentWeight}%`,
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      'data-testid': 'btn-toggle-ninhal-ng',
                      onClick: handleToggleParentNg,
                    },
                    'Alternar NG dos Pais (15 / 35)',
                  ),
                ]),
                h('div', { class: 'cordel-card', 'data-testid': 'sanctuary-panel' }, [
                  h('h3', `Santuário Genético (${props.runtime.sanctuaryRecipes.length} Receitas)`),
                  h(
                    'p',
                    `Exemplos: ${props.runtime.sanctuaryRecipes
                      .slice(0, 3)
                      .map((r) => r.name)
                      .join(' | ')}`,
                  ),
                  h(
                    'p',
                    `Árvore da Vida: 1★-10★ = ${props.runtime.totalOrbsTo10Stars} Orbes (Extração NG 30: +${extractedOrbs.value} Orbes)`,
                  ),
                ]),
                h('div', { class: 'cordel-card', 'data-testid': 'oficina-panel' }, [
                  h('h3', `Oficina de Equipamentos (+${props.runtime.state.refineLevel})`),
                  h(EquipmentSlot, {
                    slotIndex: 1,
                    setId: 'BrasaViva',
                    refineLevel: props.runtime.state.refineLevel,
                  }),
                  h(
                    'button',
                    {
                      type: 'button',
                      'data-testid': 'btn-refine-15',
                      style: {
                        marginTop: '6px',
                        backgroundColor: CORDEL_PALETTE.amareloMilho,
                        border: '2px solid #1B1B1B',
                        padding: '6px 12px',
                        fontWeight: 'bold',
                      },
                      onClick: handleRefine15,
                    },
                    'Refinar Brasa Viva +15',
                  ),
                ]),
              ]),
              h('div', { class: 'cordel-card', 'data-testid': 'rooster-album-40' }, [
                h(
                  'h3',
                  `Álbum Oficial: ${props.runtime.roosters40.length} Galos do Sertão (#01 a #40)`,
                ),
                h(
                  'div',
                  { class: 'cordel-grid' },
                  props.runtime.roosters40.slice(0, 8).map((r) =>
                    h(RoosterAtletaCard, {
                      key: r.id,
                      mode: 'album',
                      rooster: {
                        id: r.id,
                        number: r.number,
                        name: r.name,
                        rarity: r.rarity,
                        roosterClass: r.roosterClass,
                        primaryElement: r.primaryElement,
                        level: 10,
                        stars: 3,
                        isDiscovered: true,
                      },
                    }),
                  ),
                ),
                h(
                  'p',
                  { 'data-testid': 'album-summary-text' },
                  `Catálogo completo carregado: #01 ${props.runtime.roosters40[0]?.name} até #40 ${
                    props.runtime.roosters40[39]?.name
                  } (Total: ${props.runtime.roosters40.length} aves).`,
                ),
              ]),
              h(GeneticsSanctuaryPanel, { runtime: props.runtime }),
              h(AstralLapidaryPanel, { runtime: props.runtime }),
              h(PedigreeLineagePanel, { runtime: props.runtime }),
            ]),
          ],
        },
      );
    };
  },
});
