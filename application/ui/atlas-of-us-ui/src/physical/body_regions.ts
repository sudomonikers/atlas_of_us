//the regions of the drawn body, each with the body structures in it by ICF code. A structure belongs to the region with
//the longest code prefix that matches it, so the hand (s7302) is in hands rather than arms (s730), and anything that
//matches none, such as the skin or the blood vessels, is all over the body
export type RegionId =
  | 'head'
  | 'eyes'
  | 'ears'
  | 'mouth'
  | 'neck'
  | 'shoulders'
  | 'chest'
  | 'abdomen'
  | 'back'
  | 'pelvis'
  | 'arms'
  | 'hands'
  | 'legs'
  | 'feet'
  | 'whole';

export const REGIONS: { id: RegionId; label: string; prefixes: string[] }[] = [
  { id: 'head', label: 'Head and brain', prefixes: ['s110', 's130', 's5800', 's710', 's7100', 's7101', 's7104', 's7105', 's8100', 's8400', 's8401'] },
  { id: 'eyes', label: 'Eyes', prefixes: ['s210', 's220', 's230'] },
  { id: 'ears', label: 'Ears', prefixes: ['s240', 's250', 's260'] },
  { id: 'mouth', label: 'Nose, mouth and throat', prefixes: ['s310', 's320', 's330', 's510'] },
  { id: 'neck', label: 'Neck', prefixes: ['s7102', 's7103', 's340', 's5801', 's5802'] },
  { id: 'shoulders', label: 'Shoulders', prefixes: ['s720', 's8101', 's8402'] },
  { id: 'chest', label: 'Chest', prefixes: ['s4100', 's430', 's520', 's6302', 's4202'] },
  { id: 'abdomen', label: 'Belly', prefixes: ['s530', 's540', 's550', 's560', 's570', 's4203', 's5803'] },
  { id: 'back', label: 'Back and spine', prefixes: ['s760', 's120', 's8105', 's6100'] },
  { id: 'pelvis', label: 'Hips and pelvis', prefixes: ['s740', 's620', 's630', 's6101', 's6102', 's6103', 's8103', 's8403'] },
  { id: 'arms', label: 'Arms', prefixes: ['s730', 's8102'] },
  { id: 'hands', label: 'Hands', prefixes: ['s7302', 's8300'] },
  { id: 'legs', label: 'Legs', prefixes: ['s750', 's8104'] },
  { id: 'feet', label: 'Feet', prefixes: ['s7502', 's8301'] },
  { id: 'whole', label: 'All over', prefixes: [] },
];

//the region a body structure is in, by its code
export function regionOf(code: string): RegionId {
  let best: RegionId = 'whole';
  let length = 0;
  for (const region of REGIONS) {
    for (const prefix of region.prefixes) {
      if (code.startsWith(prefix) && prefix.length > length) {
        best = region.id;
        length = prefix.length;
      }
    }
  }
  return best;
}
