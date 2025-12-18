// Shared utilities for skill tree components

import type { CanvasNode } from './skill-tree-types';
import { BLOOM_LEVELS } from '../../../../common/enums/blooms-6-levels.enum';
import { DREYFUS_LEVELS } from '../../../../common/enums/dreyfus-skill-aquisition.enum';

// User progress map type - maps element ID to relationship props
export type UserProgressMap = Map<string, { [key: string]: unknown }>;

// Check if user's progress meets a node's requirement
export function isNodeRequirementMet(
  node: CanvasNode,
  userProgressMap: UserProgressMap
): boolean {
  if (!node.elementId) return false;

  const userProgress = userProgressMap.get(node.elementId);
  if (!userProgress) return false;

  // Knowledge nodes: compare bloom levels
  if (node.type === 'knowledge' && node.requirement?.bloomLevel) {
    const userLevel = userProgress.bloom_level as string | undefined;
    if (!userLevel) return false;

    const requiredIndex = BLOOM_LEVELS.indexOf(node.requirement.bloomLevel as typeof BLOOM_LEVELS[number]);
    const userIndex = BLOOM_LEVELS.indexOf(userLevel as typeof BLOOM_LEVELS[number]);
    return userIndex >= requiredIndex;
  }

  // Skill nodes: compare dreyfus levels
  if (node.type === 'skill' && node.requirement?.dreyfusLevel) {
    const userLevel = userProgress.dreyfus_level as string | undefined;
    if (!userLevel) return false;

    const requiredIndex = DREYFUS_LEVELS.indexOf(node.requirement.dreyfusLevel as typeof DREYFUS_LEVELS[number]);
    const userIndex = DREYFUS_LEVELS.indexOf(userLevel as typeof DREYFUS_LEVELS[number]);
    return userIndex >= requiredIndex;
  }

  // Trait nodes: compare scores
  if (node.type === 'trait' && node.requirement?.minScore !== undefined) {
    const userScore = userProgress.score as number | undefined;
    if (userScore === undefined) return false;
    return userScore >= node.requirement.minScore;
  }

  // Milestones and others: just check if relationship exists
  return true;
}
