import { defineComponent, h, ref, type PropType } from 'vue';
import {
  CORDEL_PALETTE, CordelWoodFrame, EquipmentSlot, RoosterAtletaCard,
} from '@beakbreaker/ui-cordel';
import type { WebRuntime } from './createWebRuntime.js';
import { GeneticsSanctuaryPanel } from './panels/GeneticsSanctuaryPanel.js';
import { AstralLapidaryPanel } from './panels/AstralLapidaryPanel.js';
import { PedigreeLineagePanel } from './panels/PedigreeLineagePanel.js';
import { BranchingEvolutionPanel } from './panels/BranchingEvolutionPanel.js';
import { OficinaForjaPanel } from './panels/OficinaForjaPanel.js';
import { ArvoreDaVidaOrbesPanel } from './panels/ArvoreDaVidaOrbesPanel.js';
import { GrimorioSantuarioPanel } from './panels/GrimorioSantuarioPanel.js';
import { cordelAudio } from '../services/AudioService.js';

const ELEMENT_TAGS: Record<string, string> = {
  Brasa: '🔥 Brasa', Mata: '🌿 Mata', Correnteza: '💧 Correnteza', Sol: '☀️ Sol', Lua: '🌙 Lua',
};
const CLASS_TAGS: Record<string, string> = {
  Tanque: '🛡️ Tanque', Bruiser: '⚔️ Bruiser', Velocista: '⚡ Velocista', Atirador: '🎯 Atirador', Suporte: '✨ Suporte',
};

export const RoostersTabView = defineComponent({
  name: 'RoostersTabView',
  props: {
    runtime: { type: Object as PropType<WebRuntime>, required: true },
  },
  setup(props) {
    const activeSubTab = ref<'plantel' | 'evolucao' | 'oficina' | 'arvore' | 'grimorio'>('plantel');
    const parentANg = ref(32);
    const parentBNg = ref(35);
    const extractedOrbs = ref(props.runtime.genetics.calculateTreeOfLifeExtractionOrbs(30));
    const selectedRoosterFeedback = ref<string | null>(null);

    const handleToggleParentNg = () => {
      parentANg.value = parentANg.value >= 30 ? 15 : 35;
      parentBNg.value = parentBNg.value >= 30 ? 15 : 35;
    };

    const handleRefine15 = () => {
      const res = props.runtime.roster.refineEquipment('rooster_05_brisa_do_rio', 'BrasaViva', 15);
      props.runtime.state.refineLevel = res.refineLevel;
    };

    return () => {
      const preview = props.runtime.genetics.previewNinhalCross(parentANg.value, parentBNg.value, true);
      const recipesCount = props.runtime.genetics.setSanctuaryLevel(props.runtime.state.sanctuaryLevel) * 3;

      return h(CordelWoodFrame, {
        title: 'Álbum dos 40 Galos (#01 a #40), Genética & Oficina +15',
        subtitle: `Árvore da Vida (${props.runtime.totalOrbsTo10Stars} Orbes até 10★) | Santuário Genético (${recipesCount}/24 Receitas)`,
      }, {
        default: () => [
          h('div', { 'data-testid': 'tab-content-galos' }, [
            h('div', { style: { display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' } }, [
              h('button', {
                type: 'button', 'data-testid': 'subtab-plantel',
                style: { padding: '8px 14px', fontWeight: 'bold', cursor: 'pointer', border: '2px solid #1B1B1B', backgroundColor: activeSubTab.value === 'plantel' ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.cremePapel },
                onClick: () => { activeSubTab.value = 'plantel'; },
              }, 'Plantel de Galos'),
              h('button', {
                type: 'button', 'data-testid': 'subtab-evolucao',
                style: { padding: '8px 14px', fontWeight: 'bold', cursor: 'pointer', border: '2px solid #1B1B1B', backgroundColor: activeSubTab.value === 'evolucao' ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.cremePapel },
                onClick: () => { activeSubTab.value = 'evolucao'; },
              }, 'Árvore de Evolução (Prancha 10)'),
              h('button', {
                type: 'button', 'data-testid': 'subtab-oficina',
                style: { padding: '8px 14px', fontWeight: 'bold', cursor: 'pointer', border: '2px solid #1B1B1B', backgroundColor: activeSubTab.value === 'oficina' ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.cremePapel },
                onClick: () => { activeSubTab.value = 'oficina'; },
              }, 'Oficina +15 (Prancha 12)'),
              h('button', {
                type: 'button', 'data-testid': 'subtab-arvore',
                style: { padding: '8px 14px', fontWeight: 'bold', cursor: 'pointer', border: '2px solid #1B1B1B', backgroundColor: activeSubTab.value === 'arvore' ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.cremePapel },
                onClick: () => { activeSubTab.value = 'arvore'; },
              }, 'Árvore da Vida (Orbes)'),
              h('button', {
                type: 'button', 'data-testid': 'subtab-grimorio',
                style: { padding: '8px 14px', fontWeight: 'bold', cursor: 'pointer', border: '2px solid #1B1B1B', backgroundColor: activeSubTab.value === 'grimorio' ? CORDEL_PALETTE.amareloMilho : CORDEL_PALETTE.cremePapel },
                onClick: () => { activeSubTab.value = 'grimorio'; },
              }, 'Grimório 24 Receitas (Prancha 11)'),
            ]),
            activeSubTab.value === 'oficina'
              ? h(OficinaForjaPanel, { runtime: props.runtime })
              : activeSubTab.value === 'evolucao'
                ? h(BranchingEvolutionPanel, { runtime: props.runtime })
                : activeSubTab.value === 'arvore'
                  ? h(ArvoreDaVidaOrbesPanel, { runtime: props.runtime })
                  : activeSubTab.value === 'grimorio'
                    ? h(GrimorioSantuarioPanel, { runtime: props.runtime })
                    : h('div', { 'data-testid': 'plantel-view-wrapper' }, [
                    h('div', { class: 'cordel-grid' }, [
                      h('div', { class: 'cordel-card', 'data-testid': 'ninhal-calculator' }, [
                        h('h3', 'Calculadora do Ninhal'),
                        h('p', `Pais NG ${parentANg.value} x NG ${parentBNg.value} -> Híbrido: ${preview.hybridChancePct}% | Mutação Secreta: ${preview.mutationChancePct}% | Peso Lendário: ${preview.goldenEmpowermentWeight}%`),
                        h('button', { type: 'button', 'data-testid': 'btn-toggle-ninhal-ng', onClick: handleToggleParentNg }, 'Alternar NG dos Pais (15 / 35)'),
                      ]),
                      h('div', { class: 'cordel-card', 'data-testid': 'sanctuary-panel' }, [
                        h('h3', `Santuário Genético (${props.runtime.sanctuaryRecipes.length} Receitas)`),
                        h('p', `Exemplos: ${props.runtime.sanctuaryRecipes.slice(0, 3).map((r) => r.name).join(' | ')}`),
                        h('p', `Árvore da Vida: 1★-10★ = ${props.runtime.totalOrbsTo10Stars} Orbes (Extração NG 30: +${extractedOrbs.value} Orbes)`),
                      ]),
                      h('div', { class: 'cordel-card', 'data-testid': 'oficina-panel' }, [
                        h('h3', `Oficina de Equipamentos (+${props.runtime.state.refineLevel})`),
                        h(EquipmentSlot, { slotIndex: 1, setId: 'BrasaViva', refineLevel: props.runtime.state.refineLevel }),
                        h('button', {
                          type: 'button', 'data-testid': 'btn-refine-15',
                          style: { marginTop: '6px', backgroundColor: CORDEL_PALETTE.amareloMilho, border: '2px solid #1B1B1B', padding: '6px 12px', fontWeight: 'bold' },
                          onClick: handleRefine15,
                        }, 'Refinar Brasa Viva +15'),
                      ]),
                    ]),
                    h('div', {
                      class: 'cordel-card', 'data-testid': 'rooster-album-40',
                      style: {
                        backgroundImage: "linear-gradient(rgba(253, 248, 237, 0.90), rgba(253, 248, 237, 0.94)), url('/assets/pranchas/album-galos-backdrop.webp')",
                        backgroundSize: 'cover', backgroundPosition: 'center', border: '3px solid #5C3A21', borderRadius: '8px', padding: '14px',
                      },
                    }, [
                      h('h3', `Álbum Oficial: ${props.runtime.roosters40.length} Galos do Sertão (#01 a #40)`),
                      h('div', { class: 'cordel-grid' }, props.runtime.roosters40.slice(0, 8).map((r) =>
                        h('div', {
                          key: r.id, class: 'rooster-plantel-frame', 'data-testid': `rooster-card-${r.id}`,
                          style: {
                            border: '3px solid #6D4C41', borderRadius: '8px', padding: '8px', backgroundColor: '#FFFDF9',
                            boxShadow: 'inset 0 0 5px #4E342E, 0 3px 6px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: '5px',
                          },
                        }, [
                          h(RoosterAtletaCard, {
                            mode: 'album',
                            rooster: {
                              id: r.id, number: r.number, name: r.name, rarity: r.rarity,
                              roosterClass: r.roosterClass, primaryElement: r.primaryElement,
                              level: 10, stars: 3, isDiscovered: true,
                            },
                          }),
                          h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: 'bold' } }, [
                            h('span', { 'data-testid': `rooster-elem-${r.id}`, style: { color: '#B45309' } }, ELEMENT_TAGS[r.primaryElement] ?? r.primaryElement),
                            h('span', { 'data-testid': `rooster-class-${r.id}`, style: { color: '#1E40AF' } }, CLASS_TAGS[r.roosterClass] ?? r.roosterClass),
                          ]),
                          h('div', { style: { color: '#D97706', fontSize: '13px', letterSpacing: '2px', textAlign: 'center' } }, '★ ★ ★ ☆ ☆'),
                          h('div', { style: { display: 'flex', gap: '4px', marginTop: '2px' } }, [
                            h('button', {
                              type: 'button', 'data-testid': `btn-ver-ficha-${r.id}`,
                              style: { flex: '1', padding: '4px 6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', border: '1px solid #1B1B1B', backgroundColor: CORDEL_PALETTE.cremePapel },
                              onClick: () => { selectedRoosterFeedback.value = `Ficha Técnica: ${r.name} (#${String(r.number).padStart(2, '0')}) — ${r.primaryElement} | ${r.roosterClass}`; },
                            }, 'Ver Ficha'),
                            h('button', {
                              type: 'button', 'data-testid': `btn-treinar-${r.id}`,
                              style: { flex: '1', padding: '4px 6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', border: '1px solid #1B1B1B', backgroundColor: CORDEL_PALETTE.amareloMilho },
                              onClick: () => { cordelAudio.playHarvestMilho(); selectedRoosterFeedback.value = `Treino intensivo de ${r.name}: +50 XP e +5 Canto!`; },
                            }, 'Treinar'),
                          ]),
                        ]),
                      )),
                      selectedRoosterFeedback.value ? h('p', { 'data-testid': 'rooster-action-feedback', style: { padding: '6px 10px', backgroundColor: '#FEF3C7', border: '1px solid #D97706', fontWeight: 'bold', fontSize: '12px', marginTop: '6px' } }, selectedRoosterFeedback.value) : null,
                      h('p', { 'data-testid': 'album-summary-text' }, `Catálogo completo carregado: #01 ${props.runtime.roosters40[0]?.name} até #40 ${props.runtime.roosters40[39]?.name} (Total: ${props.runtime.roosters40.length} aves).`),
                    ]),
                    h(GeneticsSanctuaryPanel, { runtime: props.runtime }),
                    h(AstralLapidaryPanel, { runtime: props.runtime }),
                    h(PedigreeLineagePanel, { runtime: props.runtime }),
                  ]),
          ]),
        ],
      });
    };
  },
});
