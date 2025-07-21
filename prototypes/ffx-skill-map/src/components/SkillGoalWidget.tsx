import React, { useState, useMemo } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { sharedEnhancedService } from '../services/sharedService';
import { Skill, Employee } from '../types';
import { SkillGraphAnalyzer } from '../utils/graphUtils';

interface SkillGoalWidgetProps {
  employeeId: string;
  employee?: Employee;
  onGoalSet?: (goalSkill: Skill | null, path: string[]) => void;
}

interface GoalPath {
  path: string[];
  totalXP: number;
  steps: number;
  skills: Skill[];
}

const SkillGoalWidget: React.FC<SkillGoalWidgetProps> = ({
  employeeId,
  employee,
  onGoalSet
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGoal, setSelectedGoal] = useState<Skill | null>(null);
  const [goalPath, setGoalPath] = useState<GoalPath | null>(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

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

    const totalXP = pathSkills.reduce((sum, skill) => sum + skill.xp_required, 0);

    return {
      path: shortestPath,
      totalXP,
      steps: shortestPath.length,
      skills: pathSkills
    };
  };

  const handleGoalSelect = (skill: Skill) => {
    setSelectedGoal(skill);
    setSearchTerm('');
    setIsSearchExpanded(false);
    
    const path = calculateGoalPath(skill);
    setGoalPath(path);
    
    // Notify parent component
    if (onGoalSet) {
      onGoalSet(skill, path?.path || []);
    }
  };

  const clearGoal = () => {
    setSelectedGoal(null);
    setGoalPath(null);
    if (onGoalSet) {
      onGoalSet(null, []);
    }
  };

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
      <Card className="border-border/50 shadow-elegant mx-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Skill Goal Planner
          </CardTitle>
          <CardDescription>
            Select an employee to set skill learning goals
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Choose an employee from the dropdown above to set learning goals
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-elegant mx-4">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Skill Goal for {employee.name}
        </CardTitle>
        <CardDescription>
          Search for a skill to set as your learning goal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="bg-blue-100 p-2 rounded-full">
                    {getCategoryIcon(selectedGoal.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg truncate">{selectedGoal.name}</h3>
                      <Badge variant="outline">Level {selectedGoal.level}</Badge>
                      <Badge className={`${getCategoryColor(selectedGoal.category)}`}>
                        {selectedGoal.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{selectedGoal.description}</p>
                    <div className="flex items-center gap-4 text-sm">
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
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Path Information */}
              {goalPath ? (
                <div className="border-t border-blue-200 pt-3 mt-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Route className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Learning Path</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-3 text-center">
                    <div>
                      <div className="text-lg font-bold text-blue-600">{goalPath.steps}</div>
                      <div className="text-xs text-gray-600">Steps</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-purple-600">{formatXP(goalPath.totalXP)}</div>
                      <div className="text-xs text-gray-600">Total XP</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">
                        {employee.current_xp && employee.current_xp >= goalPath.totalXP ? '✓' : 
                         employee.current_xp ? `${Math.round((employee.current_xp / goalPath.totalXP) * 100)}%` : '?'}
                      </div>
                      <div className="text-xs text-gray-600">Progress</div>
                    </div>
                  </div>
                  
                  {/* Path Steps */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 mb-2">Recommended path:</p>
                    <div className="flex flex-wrap gap-1">
                      {goalPath.skills.map((skill, index) => (
                        <React.Fragment key={skill.id}>
                          <Badge 
                            variant="outline" 
                            className="text-xs bg-white/50 hover:bg-white/80 transition-colors"
                          >
                            {skill.name}
                          </Badge>
                          {index < goalPath.skills.length - 1 && (
                            <ArrowRight className="h-3 w-3 text-gray-400 self-center" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
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