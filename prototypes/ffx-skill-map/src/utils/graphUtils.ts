import Graph from 'graphology';
import { Skill, SkillConnection, Employee } from '../types';

/**
 * Graphology utility functions for skill recommendations and path finding
 */

export class SkillGraphAnalyzer {
  private graph: Graph;
  
  constructor(skills: Skill[], connections: SkillConnection[]) {
    this.graph = new Graph({ type: 'directed' });
    this.buildGraph(skills, connections);
  }

  private buildGraph(skills: Skill[], connections: SkillConnection[]) {
    // Add all skills as nodes
    skills.forEach(skill => {
      this.graph.addNode(skill.id, {
        name: skill.name,
        category: skill.category,
        level: skill.level,
        xp_required: skill.xp_required,
        cluster: this.determineCluster(skill.id)
      });
    });

    // Add connections as edges
    connections.forEach(connection => {
      if (this.graph.hasNode(connection.from) && this.graph.hasNode(connection.to)) {
        this.graph.addEdge(connection.from, connection.to);
      }
    });
  }

  private determineCluster(skillId: string): string {
    // Determine which cluster a skill belongs to based on its ID pattern
    if (skillId.startsWith('tl_')) return 'top-left';
    if (skillId.startsWith('tr_')) return 'top-right';
    if (skillId.startsWith('lm_')) return 'left-middle';
    if (skillId.startsWith('rm_')) return 'right-middle';
    if (skillId.startsWith('bl_')) return 'bottom-left';
    if (skillId.startsWith('br_')) return 'bottom-right';
    if (skillId.startsWith('tc_')) return 'top-center';
    if (skillId.startsWith('bc_')) return 'bottom-center';
    if (skillId.startsWith('central_')) return 'central';
    if (skillId.startsWith('path_')) return 'pathway';
    if (skillId.startsWith('inter_')) return 'intermediate';
    if (skillId.startsWith('scatter_')) return 'scattered';
    return 'unknown';
  }

  /**
   * Find skills within N steps from a given skill
   */
  findSkillsWithinSteps(startSkillId: string, maxSteps: number): string[] {
    if (!this.graph.hasNode(startSkillId)) return [];

    const visited = new Set<string>();
    const queue: { skillId: string; steps: number }[] = [{ skillId: startSkillId, steps: 0 }];
    const result: string[] = [];

    while (queue.length > 0) {
      const { skillId, steps } = queue.shift()!;
      
      if (visited.has(skillId) || steps > maxSteps) continue;
      
      visited.add(skillId);
      if (steps > 0) result.push(skillId); // Don't include the starting skill itself

      // Add neighbors to queue
      this.graph.forEachNeighbor(skillId, (neighborId) => {
        if (!visited.has(neighborId) && steps + 1 <= maxSteps) {
          queue.push({ skillId: neighborId, steps: steps + 1 });
        }
      });

      // Also check incoming edges (prerequisites)
      this.graph.forEachInNeighbor(skillId, (neighborId) => {
        if (!visited.has(neighborId) && steps + 1 <= maxSteps) {
          queue.push({ skillId: neighborId, steps: steps + 1 });
        }
      });
    }

    return result;
  }

  /**
   * Get all skills in a specific cluster
   */
  getClusterSkills(cluster: string): string[] {
    const clusterSkills: string[] = [];
    this.graph.forEachNode((nodeId, attributes) => {
      if (attributes.cluster === cluster) {
        clusterSkills.push(nodeId);
      }
    });
    return clusterSkills;
  }

  /**
   * Find the shortest path between two skills
   */
  findShortestPath(fromSkill: string, toSkill: string): string[] {
    if (!this.graph.hasNode(fromSkill) || !this.graph.hasNode(toSkill)) {
      return [];
    }

    const visited = new Set<string>();
    const queue: { skillId: string; path: string[] }[] = [{ skillId: fromSkill, path: [fromSkill] }];

    while (queue.length > 0) {
      const { skillId, path } = queue.shift()!;
      
      if (skillId === toSkill) {
        return path;
      }
      
      if (visited.has(skillId)) continue;
      visited.add(skillId);

      this.graph.forEachNeighbor(skillId, (neighborId) => {
        if (!visited.has(neighborId)) {
          queue.push({ skillId: neighborId, path: [...path, neighborId] });
        }
      });
    }

    return []; // No path found
  }

  /**
   * Find optimal path from any mastered skill to target goal skill
   * Returns the shortest path considering XP cost and accessibility
   */
  findOptimalPathToGoal(masteredSkills: string[], goalSkill: string): {
    path: string[];
    startSkill: string;
    totalXP: number;
    isReachable: boolean;
  } {
    if (!this.graph.hasNode(goalSkill)) {
      return { path: [], startSkill: '', totalXP: 0, isReachable: false };
    }

    let bestPath: string[] = [];
    let bestStartSkill = '';
    let shortestDistance = Infinity;
    let lowestXPCost = Infinity;

    // Try pathfinding from each mastered skill
    for (const masteredSkill of masteredSkills) {
      if (!this.graph.hasNode(masteredSkill)) continue;

      const path = this.findShortestPath(masteredSkill, goalSkill);
      if (path.length === 0) continue;

      // Calculate total XP cost for path (excluding the starting mastered skill)
      const pathXPCost = path.slice(1).reduce((total, skillId) => {
        const attrs = this.getSkillAttributes(skillId);
        return total + (attrs?.xp_required || 0);
      }, 0);

      // Prefer shorter paths, then lower XP cost
      const isCurrentBetter = path.length < shortestDistance || 
        (path.length === shortestDistance && pathXPCost < lowestXPCost);

      if (isCurrentBetter) {
        bestPath = path;
        bestStartSkill = masteredSkill;
        shortestDistance = path.length;
        lowestXPCost = pathXPCost;
      }
    }

    // If no direct path found, try finding path through immediately available skills
    if (bestPath.length === 0) {
      const availableNext = this.getAvailableNextSkills(masteredSkills);
      
      if (availableNext.includes(goalSkill)) {
        // Goal is directly reachable from current progress
        return {
          path: [goalSkill],
          startSkill: 'available',
          totalXP: this.getSkillAttributes(goalSkill)?.xp_required || 0,
          isReachable: true
        };
      }

      // Try paths through available next skills
      for (const nextSkill of availableNext) {
        const pathFromNext = this.findShortestPath(nextSkill, goalSkill);
        if (pathFromNext.length === 0) continue;

        const fullPath = [nextSkill, ...pathFromNext.slice(1)];
        const pathXPCost = fullPath.reduce((total, skillId) => {
          const attrs = this.getSkillAttributes(skillId);
          return total + (attrs?.xp_required || 0);
        }, 0);

        if (fullPath.length < shortestDistance || 
           (fullPath.length === shortestDistance && pathXPCost < lowestXPCost)) {
          bestPath = fullPath;
          bestStartSkill = 'available';
          shortestDistance = fullPath.length;
          lowestXPCost = pathXPCost;
        }
      }
    }

    return {
      path: bestPath,
      startSkill: bestStartSkill,
      totalXP: lowestXPCost,
      isReachable: bestPath.length > 0
    };
  }

  /**
   * Get skills that are on the optimal path to a goal skill
   * Useful for prioritizing recommendations
   */
  getSkillsOnPathToGoal(masteredSkills: string[], goalSkill: string): Set<string> {
    const pathInfo = this.findOptimalPathToGoal(masteredSkills, goalSkill);
    return new Set(pathInfo.path);
  }

  /**
   * Enhanced recommendation system that prioritizes goal-directed learning
   */
  getGoalDirectedRecommendations(
    masteredSkills: string[], 
    goalSkill: string | null,
    maxRecommendations: number = 5
  ): Array<{
    skillId: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
    isOnGoalPath: boolean;
    stepsToGoal?: number;
  }> {
    const availableSkills = this.getAvailableNextSkills(masteredSkills);
    const recommendations: Array<{
      skillId: string;
      reason: string;
      priority: 'high' | 'medium' | 'low';
      isOnGoalPath: boolean;
      stepsToGoal?: number;
    }> = [];

    // If no goal is set, use standard recommendations
    if (!goalSkill || !this.graph.hasNode(goalSkill)) {
      return availableSkills.slice(0, maxRecommendations).map(skillId => ({
        skillId,
        reason: 'Available to learn from your current skills',
        priority: 'medium' as const,
        isOnGoalPath: false
      }));
    }

    const pathInfo = this.findOptimalPathToGoal(masteredSkills, goalSkill);
    const skillsOnPath = this.getSkillsOnPathToGoal(masteredSkills, goalSkill);

    // Prioritize skills on the path to goal
    const pathSkills = availableSkills.filter(skillId => skillsOnPath.has(skillId));
    const nonPathSkills = availableSkills.filter(skillId => !skillsOnPath.has(skillId));

    // Add path skills with high priority
    pathSkills.forEach(skillId => {
      const pathIndex = pathInfo.path.indexOf(skillId);
      const stepsToGoal = pathInfo.path.length - pathIndex;
      
      recommendations.push({
        skillId,
        reason: `Next step towards ${this.getSkillAttributes(goalSkill)?.name || 'goal'}`,
        priority: pathIndex === 0 ? 'high' : 'medium',
        isOnGoalPath: true,
        stepsToGoal
      });
    });

    // Add complementary skills with lower priority
    nonPathSkills.forEach(skillId => {
      const attrs = this.getSkillAttributes(skillId);
      recommendations.push({
        skillId,
        reason: `Complementary ${attrs?.category || 'skill'} ability`,
        priority: 'low',
        isOnGoalPath: false
      });
    });

    // Sort by priority and limit results
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    recommendations.sort((a, b) => {
      if (a.priority !== b.priority) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      // Within same priority, prefer skills closer to goal
      if (a.stepsToGoal && b.stepsToGoal) {
        return a.stepsToGoal - b.stepsToGoal;
      }
      return 0;
    });

    return recommendations.slice(0, maxRecommendations);
  }

  /**
   * Get skills that can be learned next (only directly adjacent nodes to mastered skills)
   */
  getAvailableNextSkills(masteredSkills: string[]): string[] {
    const masteredSet = new Set(masteredSkills);
    const availableSkills = new Set<string>();

    // For each mastered skill, find its immediate neighbors
    masteredSkills.forEach(masteredSkill => {
      if (!this.graph.hasNode(masteredSkill)) return;

      // Get all neighbors (both incoming and outgoing)
      const outNeighbors = this.graph.outNeighbors(masteredSkill);
      const inNeighbors = this.graph.inNeighbors(masteredSkill);
      
      // Add outgoing neighbors (skills this mastered skill leads to)
      outNeighbors.forEach(neighborId => {
        if (!masteredSet.has(neighborId)) {
          availableSkills.add(neighborId);
        }
      });
      
      // Add incoming neighbors (skills that lead to this mastered skill)
      inNeighbors.forEach(neighborId => {
        if (!masteredSet.has(neighborId)) {
          availableSkills.add(neighborId);
        }
      });
    });

    return Array.from(availableSkills);
  }

  /**
   * Calculate XP required for progressive skill sequences (cure -> cura -> curaga)
   */
  calculateProgressiveXP(skillName: string, baseXP: number): number {
    const progressiveSuffixes = ['', 'ra', 'ga', 'ja'];
    const currentSuffix = this.getSkillSuffix(skillName);
    const tier = progressiveSuffixes.indexOf(currentSuffix);
    
    if (tier === -1) return baseXP;
    
    // XP increases exponentially: base, base*2, base*4, base*8
    return baseXP * Math.pow(2, tier);
  }

  private getSkillSuffix(skillName: string): string {
    const lowerName = skillName.toLowerCase();
    if (lowerName.endsWith('ja')) return 'ja';
    if (lowerName.endsWith('ga')) return 'ga';
    if (lowerName.endsWith('ra')) return 'ra';
    return '';
  }

  /**
   * Get skill node attributes
   */
  getSkillAttributes(skillId: string) {
    return this.graph.hasNode(skillId) ? this.graph.getNodeAttributes(skillId) : null;
  }

  /**
   * Get all skills that lead to a specific skill (reverse path)
   */
  getSkillDependencies(skillId: string): string[] {
    return this.graph.hasNode(skillId) ? this.graph.inNeighbors(skillId) : [];
  }

  /**
   * Get all skills that this skill unlocks
   */
  getSkillUnlocks(skillId: string): string[] {
    return this.graph.hasNode(skillId) ? this.graph.outNeighbors(skillId) : [];
  }
}

/**
 * Calculate XP requirements based on skill properties
 */
export function calculateSkillXP(skill: Skill): number {
  const baseLevelXP = skill.level * 50; // Base XP per level
  const categoryMultiplier = getCategoryMultiplier(skill.category);
  const progressiveMultiplier = getProgressiveMultiplier(skill.name);
  
  return Math.round(baseLevelXP * categoryMultiplier * progressiveMultiplier);
}

function getCategoryMultiplier(category: string): number {
  switch (category) {
    case 'combat': return 1.0;
    case 'magic': return 1.2;
    case 'support': return 0.8;
    case 'special': return 1.5;
    case 'advanced': return 2.0;
    default: return 1.0;
  }
}

function getProgressiveMultiplier(skillName: string): number {
  const lowerName = skillName.toLowerCase();
  if (lowerName.includes('ja')) return 4.0;
  if (lowerName.includes('ga')) return 2.5;
  if (lowerName.includes('ra')) return 1.5;
  return 1.0;
}

/**
 * Generate expanded mastered skills for an employee based on their cluster
 */
export function expandMasteredSkills(
  employee: Employee, 
  analyzer: SkillGraphAnalyzer,
  maxSteps: number = 3
): string[] {
  const expandedSkills = new Set(employee.mastered_skills);
  
  // For each currently mastered skill, find skills within maxSteps
  employee.mastered_skills.forEach(masteredSkill => {
    const nearbySkills = analyzer.findSkillsWithinSteps(masteredSkill, maxSteps);
    
    // Add a portion of nearby skills based on employee level/experience
    const skillsToAdd = Math.floor(nearbySkills.length * 0.3); // Add 30% of nearby skills
    nearbySkills.slice(0, skillsToAdd).forEach(skill => {
      expandedSkills.add(skill);
    });
  });
  
  return Array.from(expandedSkills);
}