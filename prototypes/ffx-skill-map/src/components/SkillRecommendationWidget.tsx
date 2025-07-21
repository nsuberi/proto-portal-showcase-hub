import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Star, 
  TrendingUp, 
  Clock, 
  Target, 
  BookOpen,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { sharedEnhancedService } from '../services/sharedService';
import { Skill, Employee } from '../types';

interface SkillRecommendationWidgetProps {
  employeeId: string;
  employee?: Employee;
  onSkillLearn?: (skill: Skill, employee: Employee) => void;
}

interface SkillRecommendation {
  skill: Skill;
  xp_required: number;
  reason: string;
}

const SkillRecommendationWidget: React.FC<SkillRecommendationWidgetProps> = ({
  employeeId,
  employee,
  onSkillLearn
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLearning, setIsLearning] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { data: recommendations, isLoading, error } = useQuery({
    queryKey: ['skill-recommendations', employeeId],
    queryFn: () => sharedEnhancedService.getSkillRecommendations(employeeId),
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'combat':
        return <Target className="h-4 w-4" />;
      case 'magic':
        return <Zap className="h-4 w-4" />;
      case 'support':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'special':
        return <Star className="h-4 w-4" />;
      case 'advanced':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'combat':
        return 'bg-red-100 text-red-800 border-red-300 hover:bg-red-300';
      case 'magic':
        return 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-300';
      case 'support':
        return 'bg-green-100 text-green-800 border-green-300 hover:bg-green-300';
      case 'special':
        return 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-300';
      case 'advanced':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-300';
    }
  };

  const getCategoryBorderColor = (category: string, canAfford: boolean) => {
    if (!canAfford) return 'border-gray-200 bg-gray-50/50';
    
    switch (category) {
      case 'combat':
        return 'border-red-200 bg-red-50/50 hover:bg-red-100 hover:border-red-300';
      case 'magic':
        return 'border-blue-200 bg-blue-50/50 hover:bg-blue-100 hover:border-blue-300';
      case 'support':
        return 'border-green-200 bg-green-50/50 hover:bg-green-100 hover:border-green-300';
      case 'special':
        return 'border-purple-200 bg-purple-50/50 hover:bg-purple-100 hover:border-purple-300';
      case 'advanced':
        return 'border-yellow-200 bg-yellow-50/50 hover:bg-yellow-100 hover:border-yellow-300';
      default:
        return 'border-gray-200 bg-gray-50/50 hover:bg-gray-100 hover:border-gray-300';
    }
  };

  const getCategoryIconBg = (category: string, canAfford: boolean) => {
    if (!canAfford) return 'bg-gray-100';
    
    switch (category) {
      case 'combat':
        return 'bg-red-100';
      case 'magic':
        return 'bg-blue-100';
      case 'support':
        return 'bg-green-100';
      case 'special':
        return 'bg-purple-100';
      case 'advanced':
        return 'bg-yellow-100';
      default:
        return 'bg-gray-100';
    }
  };

  const getXPProgressPercentage = (required: number, current?: number) => {
    if (!current) return 0;
    return Math.min((current / required) * 100, 100);
  };

  const formatXP = (xp: number) => {
    if (xp >= 1000) {
      return `${(xp / 1000).toFixed(1)}k`;
    }
    return xp.toString();
  };

  const handleLearnSkill = async (skill: Skill) => {
    if (!employee || !onSkillLearn) return;
    
    // Get the most up-to-date employee data from the cache or service
    const currentEmployeeData = queryClient.getQueryData(['enhanced-employees']) as Employee[] | undefined;
    const currentEmployee = currentEmployeeData?.find(emp => emp.id === employeeId) || employee;
    
    const canAfford = (currentEmployee.current_xp || 0) >= skill.xp_required;
    if (!canAfford) {
      console.warn(`Insufficient XP: has ${currentEmployee.current_xp}, needs ${skill.xp_required}`);
      return;
    }

    setIsLearning(skill.id);
    
    try {
      // Call the parent handler - the service will handle XP decrementing
      await onSkillLearn(skill, currentEmployee);
      
      // Get updated data from the shared service
      const updatedEmployees = await sharedEnhancedService.getAllEmployees();
      queryClient.setQueryData(['enhanced-employees'], updatedEmployees);
      
      // Force refetch queries to refresh data immediately
      await queryClient.refetchQueries({ queryKey: ['skill-recommendations', employeeId] });
      await queryClient.refetchQueries({ queryKey: ['enhanced-employees'] });
      
    } catch (error) {
      console.error('Failed to learn skill:', error);
    } finally {
      setIsLearning(null);
    }
  };

  if (!employeeId) {
    return (
      <Card className="border-border/50 shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Skill Recommendations
          </CardTitle>
          <CardDescription>
            Select an employee to view personalized skill recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Choose an employee from the dropdown above to see their next recommended skills
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="border-border/50 shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Skill Recommendations
          </CardTitle>
          <CardDescription>
            Analyzing skill paths for {employee?.name}...
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Computing optimal learning paths...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-border/50 shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Skill Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-red-600">Failed to load recommendations</p>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card className="border-border/50 shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Skill Recommendations for {employee?.name}
          </CardTitle>
          <CardDescription>
            No available skill recommendations at this time
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <p className="text-muted-foreground">
            {employee?.name} has mastered all available skills in their learning path!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-elegant mx-4">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
              <span className="truncate">Next Skills for {employee?.name}</span>
            </CardTitle>
            <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1 text-sm">
              <span>{recommendations.length} recommendations available</span>
              {(() => {
                // Get the most up-to-date employee data for XP display
                const currentEmployeeData = queryClient.getQueryData(['enhanced-employees']) as Employee[] | undefined;
                const currentEmployee = currentEmployeeData?.find(emp => emp.id === employeeId) || employee;
                return currentEmployee?.current_xp ? (
                  <span className="flex items-center gap-1 text-blue-600">
                    <Zap className="h-3 w-3 flex-shrink-0" />
                    {formatXP(currentEmployee.current_xp)} XP available
                  </span>
                ) : null;
              })()}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 flex-shrink-0 text-xs md:text-sm"
          >
            {isExpanded ? (
              <>
                <Minimize2 className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Hide Recs</span>
                <span className="sm:hidden">Hide</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Show Recs</span>
                <span className="sm:hidden">Show</span>
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isExpanded ? (
          <div className="space-y-4">
            {recommendations.map((recommendation, index) => {
            const { skill, xp_required, reason } = recommendation;
            // Get the most up-to-date employee data for XP checks
            const currentEmployeeData = queryClient.getQueryData(['enhanced-employees']) as Employee[] | undefined;
            const currentEmployee = currentEmployeeData?.find(emp => emp.id === employeeId) || employee;
            
            const canAfford = (currentEmployee?.current_xp || 0) >= xp_required;
            const progressPercentage = getXPProgressPercentage(xp_required, currentEmployee?.current_xp);
            const isCurrentlyLearning = isLearning === skill.id;

            return (
              <div
                key={skill.id}
                className={`p-3 md:p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${getCategoryBorderColor(skill.category, canAfford)}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-1.5 md:p-2 rounded-full flex-shrink-0 ${getCategoryIconBg(skill.category, canAfford)}`}>
                      {getCategoryIcon(skill.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1 md:gap-2 mb-1">
                        <h4 className="font-semibold text-sm md:text-base truncate">{skill.name}</h4>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          Level {skill.level}
                        </Badge>
                        <Badge className={`text-xs transition-colors flex-shrink-0 hidden sm:inline-flex ${getCategoryColor(skill.category)}`}>
                          {skill.category}
                        </Badge>
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground mb-2 line-clamp-2">
                        {skill.description}
                      </p>
                      <p className="text-xs md:text-sm text-blue-600 italic">
                        {reason}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className={`text-sm font-medium ${canAfford ? 'text-green-600' : 'text-orange-600'}`}>
                        {formatXP(xp_required)} XP
                      </span>
                    </div>
                    {currentEmployee?.current_xp && (
                      <Progress 
                        value={progressPercentage} 
                        className="w-16 h-2"
                      />
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>#{index + 1} recommendation</span>
                  </div>
                  
                  <Button
                    variant={canAfford ? "default" : "secondary"}
                    size="sm"
                    className="text-xs w-full sm:w-auto"
                    onClick={() => handleLearnSkill(skill)}
                    disabled={!canAfford || isCurrentlyLearning}
                  >
                    {isCurrentlyLearning ? (
                      <>
                        <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full mr-1" />
                        Learning...
                      </>
                    ) : canAfford ? (
                      <>
                        Learn Now
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </>
                    ) : (
                      `Need ${formatXP(xp_required - (currentEmployee?.current_xp || 0))} more XP`
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-muted-foreground text-sm">
              Recs currently hidden... Click "Show Recs" to view {recommendations.length} recommendations
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SkillRecommendationWidget;