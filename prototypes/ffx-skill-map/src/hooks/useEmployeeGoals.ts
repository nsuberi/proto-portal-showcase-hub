import { useState, useEffect, useCallback } from 'react';
import { Skill } from '../types';

export interface EmployeeGoal {
  skill: Skill;
  path: string[];
  employeeId: string;
  dataSource: 'ffx' | 'tech';
}

export interface EmployeeGoalState {
  currentGoal: EmployeeGoal | null;
  isLoading: boolean;
  error: string | null;
}

// External state manager for employee goals
class EmployeeGoalManager {
  private subscribers: Set<(state: EmployeeGoalState) => void> = new Set();
  private state: EmployeeGoalState = {
    currentGoal: null,
    isLoading: false,
    error: null
  };

  subscribe(callback: (state: EmployeeGoalState) => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  getState(): EmployeeGoalState {
    return { ...this.state };
  }

  private setState(newState: Partial<EmployeeGoalState>) {
    this.state = { ...this.state, ...newState };
    this.subscribers.forEach(callback => callback(this.getState()));
  }

  private getStorageKey(employeeId: string, dataSource: string): string {
    return `employee-goal-${dataSource}-${employeeId}`;
  }

  async loadGoalFromStorage(employeeId: string, dataSource: 'ffx' | 'tech', skills: Skill[]): Promise<void> {
    
    if (!employeeId || !skills.length) {
      this.setState({ currentGoal: null, isLoading: false, error: null });
      return;
    }

    this.setState({ isLoading: true, error: null });

    try {
      const storageKey = this.getStorageKey(employeeId, dataSource);
      const savedGoal = localStorage.getItem(storageKey);
      
      if (savedGoal) {
        const { skillId, path } = JSON.parse(savedGoal);
        const skill = skills.find(s => s.id === skillId);
        
        if (skill) {
          const goal: EmployeeGoal = {
            skill,
            path,
            employeeId,
            dataSource
          };
          console.log('✅ GoalManager: Loaded goal for', employeeId, ':', skill.name);
          this.setState({ currentGoal: goal, isLoading: false });
          return;
        }
      }
      
      // No valid goal found
      this.setState({ currentGoal: null, isLoading: false });
    } catch (error) {
      console.error('GoalManager: Error loading saved goal:', error);
      // Clean up corrupted storage
      const storageKey = this.getStorageKey(employeeId, dataSource);
      localStorage.removeItem(storageKey);
      this.setState({ 
        currentGoal: null, 
        isLoading: false, 
        error: 'Failed to load saved goal' 
      });
    }
  }

  setGoal(goal: EmployeeGoal | null): void {
    this.setState({ currentGoal: goal, error: null });
    
    if (goal) {
      // Save to storage
      const storageKey = this.getStorageKey(goal.employeeId, goal.dataSource);
      const goalData = {
        skillId: goal.skill.id,
        skillName: goal.skill.name,
        path: goal.path
      };
      console.log('💾 GoalManager: Saved goal for', goal.employeeId, ':', goal.skill.name);
      localStorage.setItem(storageKey, JSON.stringify(goalData));
    } else if (this.state.currentGoal) {
      // Clear storage for current employee
      const storageKey = this.getStorageKey(
        this.state.currentGoal.employeeId, 
        this.state.currentGoal.dataSource
      );
      localStorage.removeItem(storageKey);
    }
  }

  clearGoal(): void {
    this.setGoal(null);
  }

  // Explicitly delete goal from localStorage for specific employee
  deleteGoalForEmployee(employeeId: string, dataSource: 'ffx' | 'tech'): void {
    const storageKey = this.getStorageKey(employeeId, dataSource);
    localStorage.removeItem(storageKey);
    console.log('🗑️ GoalManager: Permanently deleted goal for', employeeId, 'from localStorage');
    
    // If this is the currently active employee, also clear the current goal
    if (this.state.currentGoal?.employeeId === employeeId && this.state.currentGoal?.dataSource === dataSource) {
      this.setState({ currentGoal: null, error: null });
    }
  }

  updateGoalPath(path: string[]): void {
    if (this.state.currentGoal) {
      const updatedGoal = { ...this.state.currentGoal, path };
      this.setGoal(updatedGoal);
    }
  }
}

// Singleton instance
const goalManager = new EmployeeGoalManager();

// React hook to use the goal manager
export function useEmployeeGoals() {
  const [state, setState] = useState<EmployeeGoalState>(goalManager.getState());

  useEffect(() => {
    const unsubscribe = goalManager.subscribe(setState);
    return () => {
      unsubscribe();
    };
  }, []);

  const loadGoal = useCallback(
    (employeeId: string, dataSource: 'ffx' | 'tech', skills: Skill[]) => {
      return goalManager.loadGoalFromStorage(employeeId, dataSource, skills);
    },
    []
  );

  const setGoal = useCallback((goal: EmployeeGoal | null) => {
    goalManager.setGoal(goal);
  }, []);

  const clearGoal = useCallback(() => {
    goalManager.clearGoal();
  }, []);

  const updatePath = useCallback((path: string[]) => {
    goalManager.updateGoalPath(path);
  }, []);

  const deleteGoalForEmployee = useCallback((employeeId: string, dataSource: 'ffx' | 'tech') => {
    goalManager.deleteGoalForEmployee(employeeId, dataSource);
  }, []);

  return {
    ...state,
    loadGoal,
    setGoal,
    clearGoal,
    updatePath,
    deleteGoalForEmployee
  };
}

export default goalManager;