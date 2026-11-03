//the layers of the 3D body, as database/anatomy_import draws them: one model file each, under public/anatomy
export type LayerId = 'skin' | 'skeleton' | 'muscles' | 'organs' | 'nervous' | 'vessels';

export const LAYERS: { id: LayerId; label: string }[] = [
  { id: 'skeleton', label: 'Skeleton' },
  { id: 'muscles', label: 'Muscles' },
  { id: 'organs', label: 'Organs' },
  { id: 'nervous', label: 'Nervous system' },
  { id: 'vessels', label: 'Heart and vessels' },
  { id: 'skin', label: 'Skin' },
];

//each layer's colour, in the palette's spirit
export const LAYER_COLOURS: Record<LayerId, number> = {
  skin: 0xefd9cf,
  skeleton: 0xfffce8,
  muscles: 0xc98a7a,
  organs: 0xe8a9a4,
  nervous: 0xf2d16b,
  vessels: 0x6a8eae,
};

//what each mesh opens and which layer it's on, from public/anatomy/meshes.json
export type MeshIndex = Record<string, [string, LayerId]>;

export const getMeshIndex = (): Promise<MeshIndex> =>
  fetch('/anatomy/meshes.json').then((r) => {
    if (!r.ok) throw new Error("The 3D body didn't load. Please try again.");
    return r.json();
  });
