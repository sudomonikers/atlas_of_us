// https://en.wikipedia.org/wiki/Dreyfus_model_of_skill_acquisition
export enum DreyfusLevels {
  NOVICE = 'Novice',
  ADVANCED_BEGINNER = 'Advanced Beginner',
  COMPETENT = 'Competent',
  PROFICIENT = 'Proficient',
  EXPERT = 'Expert',
}

// Ordered array for comparison operations
export const DREYFUS_LEVELS = [
  DreyfusLevels.NOVICE,
  DreyfusLevels.ADVANCED_BEGINNER,
  DreyfusLevels.COMPETENT,
  DreyfusLevels.PROFICIENT,
  DreyfusLevels.EXPERT,
] as const;