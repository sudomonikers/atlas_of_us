import { Bloom6Levels } from "../../../common/enums/blooms-6-levels.enum"
import { DreyfusLevelsOfAquisition } from "../../../common/enums/dreyfus-skill-aquisition.enum"

export const DREYFUS_MAPPINGS = {
  [DreyfusLevelsOfAquisition.NOVICE]: {
    color: '#FF0000', // Red
  },
  [DreyfusLevelsOfAquisition.ADV_BEG]: {
    color: '#FF7F50', // Coral
  },
  [DreyfusLevelsOfAquisition.PROFICIENCY]: {
    color: '#FFD700', // Gold
  },
  [DreyfusLevelsOfAquisition.COMPETENCE]: {
    color: '#ADFF2F', // GreenYellow
  },
  [DreyfusLevelsOfAquisition.EXPERTISE]: {
    color: '#32CD32', // LimeGreen
  },
  [DreyfusLevelsOfAquisition.MASTERY]: {
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