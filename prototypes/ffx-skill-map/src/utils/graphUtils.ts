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