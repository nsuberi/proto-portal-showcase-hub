import { Skill, Employee } from '../types';

/**
 * Calculates the optimal goal path from mastered skills to a target goal skill
 * @param goalSkill The target skill to reach
 * @param employee The employee with mastered skills
 * @param service The service containing the graph analyzer
 * @returns Array of skill IDs representing the path to the goal
 */
export function calculateGoalPath(
  goalSkill: Skill,
  employee: Employee,
  service: any
): string[] {
  if (!service || !(service as any).graphAnalyzer || !employee) {
    console.warn('⚠️ calculateGoalPath: Missing required parameters', { 
      hasService: !!service, 
      hasGraphAnalyzer: !!(service as any)?.graphAnalyzer, 
      hasEmployee: !!employee 
    });
    return [];
  }
  
  const graphAnalyzer = (service as any).graphAnalyzer;
  const masteredSkills = employee.mastered_skills;
  
  // Find shortest path from any mastered skill to goal
  let shortestPath: string[] = [];
  let shortestDistance = Infinity;

  for (const masteredSkill of masteredSkills) {
    const path = graphAnalyzer.findShortestPath(masteredSkill, goalSkill.id);
    if (path.length > 0 && path.length < shortestDistance) {
      shortestPath = path;
      shortestDistance = path.length;
    }
  }

  // If no direct path, find path from nearest available skills
  if (shortestPath.length === 0) {
    const availableNext = graphAnalyzer.getAvailableNextSkills(masteredSkills);
    if (availableNext.includes(goalSkill.id)) {
      shortestPath = [goalSkill.id];
    } else {
      // Try to find a path through available next skills
      for (const nextSkill of availableNext) {
        const pathFromNext = graphAnalyzer.findShortestPath(nextSkill, goalSkill.id);
        if (pathFromNext.length > 0 && pathFromNext.length + 1 < shortestDistance) {
          shortestPath = [nextSkill, ...pathFromNext.slice(1)];
          shortestDistance = pathFromNext.length + 1;
        }
      }
    }
  }
  
  console.log('🎯 calculateGoalPath: Calculated path for', goalSkill.name, ':', shortestPath);
  return shortestPath;
}