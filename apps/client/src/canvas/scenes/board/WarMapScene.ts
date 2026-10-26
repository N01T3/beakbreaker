import type { AssetBundleId } from '../../core/AssetLoader.js';
import type { GameScene } from '../../core/SceneRouter.js';

export type TerritoryNodeKind = 'VILAREJO' | 'FORTE_DO_CANGACO' | 'ACUDE_REAL';

export interface TerritoryNode {
  id: string;
  name: string;
  kind: TerritoryNodeKind;
  ownerClanId: string | null;
  pointsPerHour: number;
  connectedTo: readonly string[];
}

export class WarMapScene implements GameScene {
  public readonly key = 'war-map' as const;
  public readonly requiredBundle: AssetBundleId = 'liveops-boards';
  private nodes = new Map<string, TerritoryNode>();

  public mount(): void {
    if (this.nodes.size === 0) {
      this.initializeDefaultTerritoryGraph();
    }
  }

  public unmount(): void {}

  public initializeDefaultTerritoryGraph(): void {
    this.nodes.clear();
    for (let i = 1; i <= 12; i++) {
      const id = `vilarejo_${i}`;
      const nextId = `vilarejo_${(i % 12) + 1}`;
      const prevId = `vilarejo_${((i + 10) % 12) + 1}`;
      const hubLinks =
        i <= 6 ? ['forte_do_cangaco'] : ['acude_real'];
      this.nodes.set(id, {
        id,
        name: `Vilarejo Sertanejo #${i}`,
        kind: 'VILAREJO',
        ownerClanId: null,
        pointsPerHour: 100,
        connectedTo: [prevId, nextId, ...hubLinks],
      });
    }

    this.nodes.set('forte_do_cangaco', {
      id: 'forte_do_cangaco',
      name: 'Forte do Cangaço',
      kind: 'FORTE_DO_CANGACO',
      ownerClanId: null,
      pointsPerHour: 350,
      connectedTo: ['vilarejo_1', 'vilarejo_3', 'vilarejo_6', 'acude_real'],
    });

    this.nodes.set('acude_real', {
      id: 'acude_real',
      name: 'Açude Real',
      kind: 'ACUDE_REAL',
      ownerClanId: null,
      pointsPerHour: 350,
      connectedTo: ['vilarejo_7', 'vilarejo_9', 'vilarejo_12', 'forte_do_cangaco'],
    });
  }

  public captureNode(nodeId: string, clanId: string): boolean {
    const node = this.nodes.get(nodeId);
    if (!node) return false;
    node.ownerClanId = clanId;
    return true;
  }

  public areNodesConnected(nodeA: string, nodeB: string): boolean {
    const a = this.nodes.get(nodeA);
    return Boolean(a && a.connectedTo.includes(nodeB));
  }

  public getVillageCount(): number {
    return Array.from(this.nodes.values()).filter((n) => n.kind === 'VILAREJO').length;
  }

  public getNode(nodeId: string): TerritoryNode | undefined {
    return this.nodes.get(nodeId);
  }

  public getAllNodes(): TerritoryNode[] {
    return Array.from(this.nodes.values());
  }

  public update(_deltaMs: number): void {}

  public getDrawCallEstimate(): number {
    return 11;
  }
}
