export const ROOSTER_SLOTS = [
  'tronco',
  'cabeca',
  'crista',
  'asa_frente',
  'cauda',
  'canelas',
] as const;

export type RoosterSlotKey = (typeof ROOSTER_SLOTS)[number];

export interface RoosterVisualDNA {
  id: string;
  parts: Record<RoosterSlotKey, string>;
  equippedSetVisual?: string;
  isGoldenPlumage?: boolean;
}

export interface SpineSkinLike {
  name: string;
  attachedSkins: string[];
  addSkin(other: SpineSkinLike): void;
}

export interface SpineSkeletonAdapter {
  readonly masterRigFile: 'rooster_master.skel';
  availableSkins: ReadonlySet<string>;
  activeSkin: SpineSkinLike | null;
  tintHex: string;
  slotsAtSetupPose: boolean;
  createSkin(name: string): SpineSkinLike;
  findSkin(name: string): SpineSkinLike | null;
  setSkin(skin: SpineSkinLike): void;
  setSlotsToSetupPose(): void;
}

export interface AssembledRoosterSkinResult {
  skinName: string;
  masterRig: 'rooster_master.skel';
  appliedParts: Record<RoosterSlotKey, string>;
  appliedEquipmentSkin: string | null;
  isGoldenPlumage: boolean;
  tintHex: string;
  drawCallsUsed: number;
}

export function createMockSkeletonAdapter(
  extraKnownSkins: readonly string[] = [],
): SpineSkeletonAdapter {
  const known = new Set<string>(extraKnownSkins);
  return {
    masterRigFile: 'rooster_master.skel',
    availableSkins: known,
    activeSkin: null,
    tintHex: '#FFFFFF',
    slotsAtSetupPose: false,
    createSkin(name: string): SpineSkinLike {
      return {
        name,
        attachedSkins: [],
        addSkin(other: SpineSkinLike) {
          this.attachedSkins.push(other.name);
        },
      };
    },
    findSkin(name: string): SpineSkinLike | null {
      if (known.size > 0 && !known.has(name)) {
        return null;
      }
      return {
        name,
        attachedSkins: [name],
        addSkin() {},
      };
    },
    setSkin(skin: SpineSkinLike) {
      this.activeSkin = skin;
    },
    setSlotsToSetupPose() {
      this.slotsAtSetupPose = true;
    },
  };
}

export function assembleRoosterSkin(
  skeletonAdapter: SpineSkeletonAdapter,
  dna: RoosterVisualDNA,
): AssembledRoosterSkinResult {
  const customSkin = skeletonAdapter.createSkin(`hybrid_${dna.id}`);
  const appliedParts = {} as Record<RoosterSlotKey, string>;

  for (const slotKey of ROOSTER_SLOTS) {
    const partSkinName = dna.parts[slotKey];
    const sourceSkin =
      skeletonAdapter.findSkin(partSkinName) ??
      skeletonAdapter.findSkin(`${slotKey}/${partSkinName}`);
    if (sourceSkin) {
      customSkin.addSkin(sourceSkin);
      appliedParts[slotKey] = sourceSkin.name;
    } else {
      appliedParts[slotKey] = partSkinName;
    }
  }

  let appliedEquipmentSkin: string | null = null;
  if (dna.equippedSetVisual) {
    const equipKey = dna.equippedSetVisual.startsWith('equip/')
      ? dna.equippedSetVisual
      : `equip/${dna.equippedSetVisual}`;
    const equipSkin = skeletonAdapter.findSkin(equipKey);
    if (equipSkin) {
      customSkin.addSkin(equipSkin);
      appliedEquipmentSkin = equipSkin.name;
    }
  }

  const isGoldenPlumage = Boolean(dna.isGoldenPlumage);
  if (isGoldenPlumage) {
    const goldenOverlay = skeletonAdapter.findSkin('mutation/plumagem_dourada');
    if (goldenOverlay) {
      customSkin.addSkin(goldenOverlay);
    }
    skeletonAdapter.tintHex = '#F4B400';
  } else {
    skeletonAdapter.tintHex = '#FFFFFF';
  }

  skeletonAdapter.setSkin(customSkin);
  skeletonAdapter.setSlotsToSetupPose();

  return {
    skinName: customSkin.name,
    masterRig: skeletonAdapter.masterRigFile,
    appliedParts,
    appliedEquipmentSkin,
    isGoldenPlumage,
    tintHex: skeletonAdapter.tintHex,
    drawCallsUsed: 1,
  };
}
