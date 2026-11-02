// Every test persona, keyed by its file name, which is also the title of each test it plays.
import chris from './chris.ts';
import dev from './dev.ts';
import grace from './grace.ts';
import holly from './holly.ts';
import jules from './jules.ts';
import kai from './kai.ts';
import marcus from './marcus.ts';
import morgan from './morgan.ts';
import noor from './noor.ts';
import ray from './ray.ts';
import ruth from './ruth.ts';
import sam from './sam.ts';
import tanya from './tanya.ts';
import type { Persona } from './persona.ts';

export const personas: Record<string, Persona> = { chris, dev, grace, holly, jules, kai, marcus, morgan, noor, ray, ruth, sam, tanya };
