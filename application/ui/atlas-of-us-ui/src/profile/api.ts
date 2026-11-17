import { request } from '../auth/api';
import type { PersonPersonality } from '../personality/api';
import type { AbilitiesSummary } from '../abilities/api';
import type { AchievedSkill } from '../skills/api';
import type { EngagedTopic } from '../topics/api';

//everything someone shares about themselves, one entry per part of the Atlas they've been mapped on
export interface Profile {
  username: string;
  first_name: string;
  public: boolean;
  personality: PersonPersonality;
  abilities: AbilitiesSummary | null; //Atlas's summary of everything they've added to Abilities, once they've asked for it
  topics: EngagedTopic[]; //the topics they've placed themselves on, deepest first
  skills: AchievedSkill[]; //the skills they've placed themselves on, highest level first
}

//someone's profile at /u/{username}. Private ones 404 for everyone but the owner
export const getProfile = (username: string) => request<Profile>('GET', `/profiles/${encodeURIComponent(username)}`);
