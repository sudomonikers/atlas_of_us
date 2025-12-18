// https://helpfulprofessor.com/levels-of-knowledge/
export enum Bloom6Levels {
  REMEMBER = 'Remember',
  UNDERSTAND = 'Understand',
  APPLY = 'Apply',
  ANALYZE = 'Analyze',
  EVALUATE = 'Evaluate',
  CREATE = 'Create',
}

// Ordered array for comparison operations
export const BLOOM_LEVELS = [
  Bloom6Levels.REMEMBER,
  Bloom6Levels.UNDERSTAND,
  Bloom6Levels.APPLY,
  Bloom6Levels.ANALYZE,
  Bloom6Levels.EVALUATE,
  Bloom6Levels.CREATE,
] as const;