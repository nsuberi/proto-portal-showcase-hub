import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Target, 
  Search, 
  X, 
  MapPin, 
  Route,
  Clock,
  ArrowRight,
  CheckCircle2,
  Check,
  AlertCircle,
  Sparkles,
  Star,
  Gem
} from 'lucide-react';
import { sharedEnhancedService } from '../services/sharedService';
import { Skill, Employee } from '../types';
import { SkillGraphAnalyzer } from '../utils/graphUtils';

interface SkillGoalWidgetProps {
  employeeId: string;
  employee?: Employee;
  onGoalSet?: (goalSkill: Skill | null, path: string[]) => void;
  currentGoal?: Skill | null; // External goal state to sync with
}

interface GoalPath {
  path: string[];
  totalXP: number;
  remainingXP: number;
  steps: number;
  remainingSteps: number;
  totalSteps: number;
  originalTotalSteps: number; // Fixed denominator for progress calculation
  completedSteps: number;
  skills: Skill[];
  isCompleted: boolean;
}

const SkillGoalWidget: React.FC<SkillGoalWidgetProps> = ({
  employeeId,
  employee,
  onGoalSet,
  currentGoal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<Skill | null>(null);
  const [goalPath, setGoalPath] = useState<GoalPath | null>(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);
  const originalTotalStepsRef = useRef<number | null>(null);

  const { data: skills } = useQuery({
    queryKey: ['enhanced-skills'],
    queryFn: () => sharedEnhancedService.getAllSkills(),
  });

  const { data: connections } = useQuery({
    queryKey: ['enhanced-connections'],
    queryFn: () => sharedEnhancedService.getSkillConnections(),
  });

  // Create graph analyzer
  const graphAnalyzer = useMemo(() => {
    if (!skills || !connections) return null;
    return new SkillGraphAnalyzer(skills, connections);
  }, [skills, connections]);

  // Get unlearned skills for search
  const unlearnedSkills = useMemo(() => {
    if (!skills || !employee) return [];
    const masteredSet = new Set(employee.mastered_skills);
    return skills.filter(skill => !masteredSet.has(skill.id));
  }, [skills, employee]);

  // Filter skills based on search term
  const filteredSkills = useMemo(() => {
    if (!searchTerm) return unlearnedSkills.slice(0, 10); // Show first 10 if no search
    return unlearnedSkills.filter(skill => 
      skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skill.category.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 20); // Limit to 20 results
  }, [unlearnedSkills, searchTerm]);

  // Calculate path to goal when goal is selected
  const calculateGoalPath = (goalSkill: Skill): GoalPath | null => {
    if (!graphAnalyzer || !employee || !skills) return null;

    const masteredSkills = employee.mastered_skills;
    
    // Check if goal is already completed
    const isGoalAlreadyMastered = masteredSkills.includes(goalSkill.id);
    
    if (isGoalAlreadyMastered) {
      // Goal is already completed - return completed state
      return {
        path: [goalSkill.id],
        totalXP: goalSkill.xp_required,
        remainingXP: 0,
        steps: 1,
        remainingSteps: 0,
        totalSteps: 1,
        originalTotalSteps: originalTotalStepsRef.current || 1,
        completedSteps: originalTotalStepsRef.current || 1,
        skills: [goalSkill],
        isCompleted: true
      };
    }
    
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

    if (shortestPath.length === 0) {
      // If no direct path, find path from nearest mastered skill using BFS
      const availableNext = graphAnalyzer.getAvailableNextSkills(masteredSkills);
      if (availableNext.includes(goalSkill.id)) {
        // Goal is directly reachable
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

    if (shortestPath.length === 0) return null;

    // Calculate total XP and get skill details
    const pathSkills = shortestPath
      .map(skillId => skills.find(s => s.id === skillId))
      .filter(Boolean) as Skill[];

    const masteredSet = new Set(employee.mastered_skills);
    
    // Calculate steps based on original path when goal was first set
    const originalTotal = originalTotalStepsRef.current;
    let completedSteps: number;
    
    if (originalTotal !== null) {
      // Use original total and calculate how many steps we've progressed
      // since the original path was longer, we calculate based on how much closer we are to the goal
      const currentRemainingSteps = pathSkills.filter(skill => !masteredSet.has(skill.id)).length;
      completedSteps = originalTotal - currentRemainingSteps;
      
      // Ensure completedSteps doesn't exceed original total and isn't negative
      completedSteps = Math.max(0, Math.min(completedSteps, originalTotal));
    } else {
      // Fallback: count directly mastered skills in current path
      completedSteps = pathSkills.filter(skill => masteredSet.has(skill.id)).length;
    }
    
    const remainingSkills = pathSkills.filter(skill => !masteredSet.has(skill.id));
    const totalXP = pathSkills.reduce((sum, skill) => sum + skill.xp_required, 0);
    const remainingXP = remainingSkills.reduce((sum, skill) => sum + skill.xp_required, 0);
    const totalSteps = pathSkills.length;
    const remainingSteps = remainingSkills.length;
    const isCompleted = remainingSteps === 0;

    return {
      path: shortestPath,
      totalXP,
      remainingXP,
      steps: shortestPath.length,
      remainingSteps,
      totalSteps,
      originalTotalSteps: originalTotal || totalSteps,
      completedSteps,
      skills: pathSkills,
      isCompleted
    };
  };

  const handleGoalSelect = (skill: Skill) => {
    setSelectedGoal(skill);
    setSearchTerm('');
    setIsSearchExpanded(false);
    
    const path = calculateGoalPath(skill);
    
    // Store original total steps for consistent progress calculation
    if (path) {
      originalTotalStepsRef.current = path.totalSteps;
    }
    
    setGoalPath(path);
    
    // Notify parent component
    if (onGoalSet) {
      onGoalSet(skill, path?.path || []);
    }
  };

  const clearGoal = () => {
    setSelectedGoal(null);
    setGoalPath(null);
    setShowCompletionAnimation(false);
    originalTotalStepsRef.current = null;
    if (onGoalSet) {
      onGoalSet(null, []);
    }
  };

  // Recalculate path when employee mastered skills change
  useEffect(() => {
    console.log('🔄 Goal recalculation effect triggered:', {
      hasSelectedGoal: !!selectedGoal,
      hasEmployee: !!employee,
      hasSkills: !!skills,
      originalTotalSteps: originalTotalStepsRef.current,
      masteredSkills: employee?.mastered_skills?.length || 0
    });
    
    if (selectedGoal && employee && skills && originalTotalStepsRef.current !== null) {
      const previouslyCompleted = goalPath?.isCompleted || false;
      const updatedPath = calculateGoalPath(selectedGoal);
      
      console.log('🎯 Path calculation result:', {
        goal: selectedGoal.name,
        pathFound: !!updatedPath,
        completedSteps: updatedPath?.completedSteps,
        totalSteps: updatedPath?.totalSteps,
        originalTotal: originalTotalStepsRef.current,
        masteredSkillsInEmployee: employee.mastered_skills
      });
      
      // Preserve the original total steps from when goal was first set
      if (updatedPath) {
        updatedPath.originalTotalSteps = originalTotalStepsRef.current;
        console.log('📊 Final percentage calculation:', {
          completedSteps: updatedPath.completedSteps,
          originalTotalSteps: updatedPath.originalTotalSteps,
          percentage: Math.round((updatedPath.completedSteps / updatedPath.originalTotalSteps) * 100)
        });
      }
      
      setGoalPath(updatedPath);
      
      // Check if goal was just completed
      if (!previouslyCompleted && updatedPath?.isCompleted) {
        setShowCompletionAnimation(true);
        setTimeout(() => setShowCompletionAnimation(false), 3000);
      }
    }
  }, [JSON.stringify(employee?.mastered_skills), selectedGoal, skills]);

  // Sync with external currentGoal state (for reset functionality)
  useEffect(() => {
    if (currentGoal === null && selectedGoal !== null) {
      // External goal was cleared, clear internal state
      setSelectedGoal(null);
      setGoalPath(null);
      setShowCompletionAnimation(false);
      originalTotalStepsRef.current = null;
    }
  }, [currentGoal, selectedGoal]);

  const getCategoryIcon = (category: string) => {
    const iconClass = "h-4 w-4";
    switch (category) {
      case 'combat': return <Target className={iconClass} />;
      case 'magic': return <div className={iconClass}>⚡</div>;
      case 'support': return <div className={iconClass}>❤️</div>;
      case 'special': return <div className={iconClass}>⭐</div>;
      case 'advanced': return <div className={iconClass}>👑</div>;
      default: return <Target className={iconClass} />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'combat': return 'bg-red-100 text-red-800 border-red-300';
      case 'magic': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'support': return 'bg-green-100 text-green-800 border-green-300';
      case 'special': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'advanced': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatXP = (xp: number) => {
    if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`;
    return xp.toString();
  };

  if (!employeeId || !employee) {
    return (
      <Card className="border-border/50 shadow-elegant mx-2 sm:mx-4">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Skill Goal Planner
          </CardTitle>
          <CardDescription className="text-sm">
            Select an employee to set skill learning goals
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6 sm:py-8">
          <Target className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-sm sm:text-base">
            Choose an employee from the dropdown above to set learning goals
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-elegant mx-2 sm:mx-4">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <span className="truncate">Skill Goal for {employee.name}</span>
        </CardTitle>
        <CardDescription className="text-sm">
          Search for a skill to set as your learning goal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {!selectedGoal ? (
          <>
            {/* Search Interface */}
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for an unlearned skill..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsSearchExpanded(true);
                  }}
                  onFocus={() => setIsSearchExpanded(true)}
                  className="pl-10"
                />
              </div>

              {/* Search Results Dropdown */}
              {isSearchExpanded && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                  {filteredSkills.length > 0 ? (
                    <div className="p-2">
                      {filteredSkills.map((skill) => (
                        <div
                          key={skill.id}
                          onClick={() => handleGoalSelect(skill)}
                          className="p-3 hover:bg-gray-50 rounded-md cursor-pointer border-l-4 border-transparent hover:border-blue-400 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {getCategoryIcon(skill.category)}
                              <span className="font-medium text-sm truncate">{skill.name}</span>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Badge variant="outline" className="text-xs">L{skill.level}</Badge>
                              <Badge className={`text-xs ${getCategoryColor(skill.category)}`}>
                                {skill.category}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2 mb-1">
                            {skill.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{formatXP(skill.xp_required)} XP required</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : searchTerm ? (
                    <div className="p-8 text-center text-gray-500">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">No unlearned skills match "{searchTerm}"</p>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <Search className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Start typing to search for skills...</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Click outside to close search */}
            {isSearchExpanded && (
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsSearchExpanded(false)}
              />
            )}
          </>
        ) : (
          <>
            {/* Selected Goal Display */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                                              <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0">
                    {/* Title and icon row - properly aligned */}
                    <div className="flex items-center gap-2 sm:gap-3 mb-1">
                      <div className="bg-blue-100 p-1.5 sm:p-2 rounded-full flex-shrink-0">
                        {getCategoryIcon(selectedGoal.category)}
                      </div>
                      <h3 className="font-semibold text-base sm:text-lg text-gray-900 leading-tight flex-1">{selectedGoal.name}</h3>
                    </div>
                    
                    {/* Badges row */}
                    <div className="flex gap-1 flex-wrap ml-8 sm:ml-10 mb-2">
                      <Badge variant="outline" className="text-xs">Level {selectedGoal.level}</Badge>
                      <Badge className={`text-xs ${getCategoryColor(selectedGoal.category)}`}>
                        {selectedGoal.category}
                      </Badge>
                    </div>
                    
                    {/* Description and XP */}
                    <div className="ml-8 sm:ml-10">
                      <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">{selectedGoal.description}</p>
                      <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatXP(selectedGoal.xp_required)} XP
                        </span>
                      </div>
                    </div>
                  </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearGoal}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0 p-1 sm:p-2"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>

              {/* Path Information */}
              {goalPath ? (
                <div className="border-t border-blue-200 pt-3 mt-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Route className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Learning Path</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3 text-center">
                    <div className="p-2 rounded-lg bg-blue-50/50">
                      <div className="text-base sm:text-lg font-bold text-blue-600">{goalPath.remainingSteps}</div>
                      <div className="text-xs text-gray-600 font-medium">Steps Left</div>
                    </div>
                    <div className="p-2 rounded-lg bg-purple-50/50">
                      <div className="text-base sm:text-lg font-bold text-purple-600">{formatXP(goalPath.remainingXP)}</div>
                      <div className="text-xs text-gray-600 font-medium">XP Needed</div>
                    </div>
                    <div className="p-2 rounded-lg bg-green-50/50">
                      <div className="text-base sm:text-lg font-bold text-green-600 flex justify-center items-center min-h-[1.5rem]">
                        {goalPath.isCompleted ? (
                          <Check className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                        ) : (
                          `${Math.round((goalPath.completedSteps / goalPath.originalTotalSteps) * 100)}%`
                        )}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">Complete</div>
                    </div>
                  </div>
                  
                  {/* Path Steps */}
                  {!goalPath.isCompleted && (
                    <div className="space-y-2">
                      <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Recommended path:</p>
                      <div className="flex flex-wrap gap-1 sm:gap-2 items-center">
                        {goalPath.skills.map((skill, index) => {
                          const isSkillMastered = employee?.mastered_skills?.includes(skill.id) || false;
                          const categoryColorClass = getCategoryColor(skill.category);
                          return (
                            <React.Fragment key={skill.id}>
                              <Badge 
                                variant="outline" 
                                className={`text-xs transition-all duration-300 ${
                                  isSkillMastered 
                                    ? categoryColorClass
                                    : `${categoryColorClass} opacity-40 hover:opacity-60`
                                }`}
                              >
                                {isSkillMastered && <span className="mr-1">✓</span>}
                                <span className="truncate max-w-[120px] sm:max-w-none">{skill.name}</span>
                              </Badge>
                              {index < goalPath.skills.length - 1 && (
                                <ArrowRight className={`h-3 w-3 flex-shrink-0 transition-all duration-300 ${
                                  isSkillMastered ? 'text-current opacity-100' : 'text-gray-400 opacity-60'
                                }`} />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Completion Animation and Next Goal Prompt */}
                  {goalPath.isCompleted && (
                    <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 border border-emerald-200 transition-all duration-500 shadow-lg relative overflow-hidden">
                      {/* Sparkly Background Elements - Bouquet Eruption */}
                      {showCompletionAnimation && (
                        <>
                          {/* Large Central Gems */}
                          <div className="absolute top-1 left-6 animate-pulse">
                            <Gem className="h-6 w-6 text-emerald-500 animate-spin drop-shadow-lg" style={{animationDuration: '3s'}} />
                          </div>
                          <div className="absolute top-2 right-8 animate-pulse" style={{animationDelay: '0.3s'}}>
                            <Star className="h-7 w-7 text-yellow-500 animate-ping drop-shadow-lg" />
                          </div>
                          <div className="absolute bottom-2 left-12 animate-pulse" style={{animationDelay: '0.6s'}}>
                            <Sparkles className="h-6 w-6 text-blue-500 animate-bounce drop-shadow-lg" />
                          </div>
                          
                          {/* Medium Sparkles */}
                          <div className="absolute top-4 left-1/2 animate-pulse" style={{animationDelay: '0.9s'}}>
                            <Star className="h-5 w-5 text-purple-500 animate-ping drop-shadow-md" />
                          </div>
                          <div className="absolute bottom-3 right-6 animate-pulse" style={{animationDelay: '1.2s'}}>
                            <Gem className="h-5 w-5 text-pink-500 animate-spin drop-shadow-md" style={{animationDuration: '2s'}} />
                          </div>
                          <div className="absolute top-6 right-16 animate-pulse" style={{animationDelay: '1.5s'}}>
                            <Sparkles className="h-4 w-4 text-cyan-500 animate-bounce drop-shadow-md" />
                          </div>
                          <div className="absolute bottom-5 left-20 animate-pulse" style={{animationDelay: '1.8s'}}>
                            <Star className="h-4 w-4 text-rose-500 animate-ping drop-shadow-md" />
                          </div>
                          
                          {/* Small Sparkles - More Scattered */}
                          <div className="absolute top-1 left-16 animate-pulse" style={{animationDelay: '0.2s'}}>
                            <Sparkles className="h-3 w-3 text-amber-400 animate-spin" style={{animationDuration: '4s'}} />
                          </div>
                          <div className="absolute top-7 left-2 animate-pulse" style={{animationDelay: '0.4s'}}>
                            <Star className="h-3 w-3 text-indigo-400 animate-ping" />
                          </div>
                          <div className="absolute bottom-1 right-12 animate-pulse" style={{animationDelay: '0.7s'}}>
                            <Gem className="h-3 w-3 text-teal-400 animate-spin" style={{animationDuration: '3.5s'}} />
                          </div>
                          <div className="absolute top-2 right-2 animate-pulse" style={{animationDelay: '1.0s'}}>
                            <Sparkles className="h-2 w-2 text-violet-400 animate-bounce" />
                          </div>
                          <div className="absolute bottom-6 left-4 animate-pulse" style={{animationDelay: '1.3s'}}>
                            <Star className="h-2 w-2 text-orange-400 animate-ping" />
                          </div>
                          <div className="absolute top-5 left-24 animate-pulse" style={{animationDelay: '1.6s'}}>
                            <Gem className="h-2 w-2 text-lime-400 animate-spin" style={{animationDuration: '2.5s'}} />
                          </div>
                          <div className="absolute bottom-2 right-20 animate-pulse" style={{animationDelay: '1.9s'}}>
                            <Sparkles className="h-3 w-3 text-sky-400 animate-bounce" />
                          </div>
                          <div className="absolute top-3 right-24 animate-pulse" style={{animationDelay: '2.2s'}}>
                            <Star className="h-2 w-2 text-fuchsia-400 animate-ping" />
                          </div>
                          
                          {/* Radial burst effects */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-emerald-100/20 to-transparent animate-ping" style={{animationDelay: '0.5s'}}></div>
                        </>
                      )}
                      
                      <div className="flex items-center gap-3 mb-3 relative z-10">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-emerald-800">Goal Completed!</h3>
                          <p className="text-sm text-emerald-600">You've mastered all skills in this path</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 relative z-10">
                        <Button
                          onClick={() => {
                            clearGoal();
                            setIsSearchExpanded(true);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm shadow-md flex-1 sm:flex-initial"
                        >
                          <Target className="h-4 w-4 mr-1" />
                          Set Next Goal
                        </Button>
                        <Button
                          onClick={clearGoal}
                          variant="outline"
                          className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 text-sm flex-1 sm:flex-initial"
                        >
                          Clear Goal
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-t border-blue-200 pt-3 mt-3">
                  <div className="flex items-center gap-2 text-yellow-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">No direct path found to this skill</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    This skill may be disconnected from your current progress or require skills not yet available.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SkillGoalWidget;