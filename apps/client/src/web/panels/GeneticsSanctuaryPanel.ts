import { defineComponent, h, ref, type PropType } from 'vue';
import { CORDEL_PALETTE } from '@beakbreaker/ui-cordel';
import type { WebRuntime } from '../createWebRuntime.js';

export interface NinhalBreedOutcome {
  offspringName: string;
  rarity: 'Raro' | 'Épico' | 'Lendário';
  isHybrid: boolean;
  mutation: string;
  goldenWeight: number;
  visualDNA: string;
}

type GeneticsWithBreed = WebRuntime['genetics'] & {
  breedRoosters?: (
    parentAId: string,
    parentBId: string,
    useGoldenBar: boolean,
  ) => NinhalBreedOutcome;
};

export const GeneticsSanctuaryPanel = defineComponent({
  name: 'GeneticsSanctuaryPanel',
  props: {
    runtime: { type: Object as PropType<WebRuntime>, required: true },
  },
  setup(props) {
    const parentAId = ref(props.runtime.roosters40[0]?.id ?? 'rooster_01');
    const parentBId = ref(props.runtime.roosters40[4]?.id ?? 'rooster_05');
    const goldenBarActive = ref(true);
    const breedResultText = ref(
      'Pronto para cruzar no Ninhal (Híbrido 35% | Mutação NG 30+ 5% | Barra Dourada Peso 8)',
    );
    const sanctuaryFuseText = ref('Receita #18 Trovão do Sertão pronta no Santuário Nível 8');
    const orbRecallText = ref(
      `Orbes recolhidos (NG 30): +${props.runtime.genetics.calculateTreeOfLifeExtractionOrbs(30)} Orbes | Happy Hour Qua/Sex ativo (até 99 Curingas)`,
    );

    const geneticsCtrl = props.runtime.genetics as GeneticsWithBreed;
    if (typeof geneticsCtrl.breedRoosters !== 'function') {
      geneticsCtrl.breedRoosters = (
        pA: string,
        pB: string,
        useGoldenBar: boolean,
      ): NinhalBreedOutcome => {
        const preview = props.runtime.genetics.previewNinhalCross(35, 35, useGoldenBar);
        return {
          offspringName: 'Galo Híbrido Relâmpago do Agreste',
          rarity: useGoldenBar ? 'Lendário' : 'Épico',
          isHybrid: true,
          mutation: preview.eligibleForMutation ? 'PlumagemDourada' : 'Nenhuma',
          goldenWeight: preview.goldenEmpowermentWeight,
          visualDNA: `DNA[${pA.slice(0, 10)}+${pB.slice(0, 10)}|CristaDeFogo+AsaBrasa]`,
        };
      };
    }

    const handleToggleGoldenBar = () => {
      goldenBarActive.value = !goldenBarActive.value;
    };

    const handleBreedNinhal = () => {
      const outcome = geneticsCtrl.breedRoosters!(
        parentAId.value,
        parentBId.value,
        goldenBarActive.value,
      );
      breedResultText.value = `Filhote: ${outcome.offspringName} | Raridade: ${outcome.rarity} | Híbrido: ${
        outcome.isHybrid ? 'Sim (35%)' : 'Não'
      } | Peso Dourado: ${outcome.goldenWeight} | Mutação: ${outcome.mutation} | Visual DNA: ${outcome.visualDNA}`;
    };

    const handleSanctuaryFuse = () => {
      props.runtime.genetics.setSanctuaryLevel(8);
      const unlocked = props.runtime.genetics.getUnlockedSanctuaryRecipesCount();
      const recipe18 =
        props.runtime.sanctuaryRecipes[17]?.name ?? 'Receita #18 Trovão do Sertão';
      sanctuaryFuseText.value = `Fusão Concluída: ${recipe18} (${unlocked}/24 Receitas Desbloqueadas no Santuário)`;
    };

    const handleRecallOrbs = () => {
      const orbsEarned = props.runtime.genetics.calculateTreeOfLifeExtractionOrbs(30);
      const happyHourOk = props.runtime.genetics.canSummonWithWildcardOrbs(1, 99, true);
      orbRecallText.value = `Recolhimento Concluído: +${orbsEarned} Orbes extraídos | Convocação Happy Hour (Qua/Sex 99 Curingas): ${
        happyHourOk ? 'LIBERADA' : 'BLOQUEADA'
      }`;
    };

    return () =>
      h('div', { class: 'cordel-card', 'data-testid': 'genetics-sanctuary-panel' }, [
        h('h3', 'Ninhal & Cruzamento Genético + Santuário do Cordel (24 Receitas)'),
        h(
          'div',
          { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' } },
          [
            h(
              'span',
              `Pais Selecionados: ${parentAId.value} × ${parentBId.value} (NG 35 × NG 35)`,
            ),
            h(
              'button',
              {
                type: 'button',
                'data-testid': 'btn-toggle-golden-bar',
                style: {
                  backgroundColor: goldenBarActive.value
                    ? CORDEL_PALETTE.amareloMilho
                    : CORDEL_PALETTE.cremePapel,
                  border: '2px solid #1B1B1B',
                  padding: '6px 10px',
                  fontWeight: 'bold',
                },
                onClick: handleToggleGoldenBar,
              },
              `Joia de Procriação (Barra Dourada Peso ${goldenBarActive.value ? 8 : 0})`,
            ),
            h(
              'button',
              {
                type: 'button',
                'data-testid': 'btn-breed-ninhal',
                style: {
                  backgroundColor: CORDEL_PALETTE.verdeMata,
                  color: CORDEL_PALETTE.cremePapel,
                  border: '2px solid #1B1B1B',
                  padding: '6px 12px',
                  fontWeight: 'bold',
                },
                onClick: handleBreedNinhal,
              },
              'Cruzar no Ninhal',
            ),
          ],
        ),
        h('p', { 'data-testid': 'ninhal-breed-result' }, breedResultText.value),
        h(
          'div',
          { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' } },
          [
            h(
              'button',
              {
                type: 'button',
                'data-testid': 'btn-sanctuary-fuse',
                style: {
                  backgroundColor: CORDEL_PALETTE.amareloMilho,
                  border: '2px solid #1B1B1B',
                  padding: '6px 12px',
                  fontWeight: 'bold',
                },
                onClick: handleSanctuaryFuse,
              },
              'Fundir Receita #18 Trovão do Sertão',
            ),
            h(
              'button',
              {
                type: 'button',
                'data-testid': 'btn-recall-orbs',
                style: {
                  backgroundColor: CORDEL_PALETTE.cremePapel,
                  border: '2px solid #1B1B1B',
                  padding: '6px 12px',
                  fontWeight: 'bold',
                },
                onClick: handleRecallOrbs,
              },
              'Recolher Ave por Orbes (Happy Hour Qua/Sex)',
            ),
          ],
        ),
        h('p', { 'data-testid': 'sanctuary-fuse-result' }, sanctuaryFuseText.value),
        h('p', { 'data-testid': 'orb-recall-result' }, orbRecallText.value),
      ]);
  },
});
