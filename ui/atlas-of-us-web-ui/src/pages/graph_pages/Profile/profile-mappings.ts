import { Bloom6Levels } from "../../../common/enums/blooms-6-levels.enum"
import { DreyfusLevels } from "../../../common/enums/dreyfus-skill-aquisition.enum"

export const DREYFUS_MAPPINGS = {
  [DreyfusLevels.NOVICE]: {
    color: '#FF0000', // Red
  },
  [DreyfusLevels.ADVANCED_BEGINNER]: {
    color: '#FF7F50', // Coral
  },
  [DreyfusLevels.COMPETENT]: {
    color: '#FFD700', // Gold
  },
  [DreyfusLevels.PROFICIENT]: {
    color: '#ADFF2F', // GreenYellow
  },
  [DreyfusLevels.EXPERT]: {
    color: '#008000', // Green
  },
}

export const BLOOM_MAPPINGS = {
  [Bloom6Levels.REMEMBER]: {
    color: '#FF0000', // Red
  },
  [Bloom6Levels.UNDERSTAND]: {
    color: '#FF7F50', // Coral
  },
  [Bloom6Levels.APPLY]: {
    color: '#FFD700', // Gold
  },
  [Bloom6Levels.ANALYZE]: {
    color: '#ADFF2F', // GreenYellow
  },
  [Bloom6Levels.EVALUATE]: {
    color: '#32CD32', // LimeGreen
  },
  [Bloom6Levels.CREATE]: {
    color: '#008000', // Green
  }
}