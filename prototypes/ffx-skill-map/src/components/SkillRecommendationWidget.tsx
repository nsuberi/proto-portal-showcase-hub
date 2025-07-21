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
    
    const canAfford = (employee.current_xp || 0) >= skill.xp_required;
    if (!canAfford) return;

    setIsLearning(skill.id);
    
    try {
      // Create updated employee with new skill and reduced XP
      const updatedEmployee = {
        ...employee,
        mastered_skills: [...employee.mastered_skills, skill.id],
        current_xp: (employee.current_xp || 0) - skill.xp_required
      };
      
      // Call the parent handler
      await onSkillLearn(skill, updatedEmployee);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['skill-recommendations', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-employees'] });
      
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
    <Card className="border-border/50 shadow-elegant">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Next Skills for {employee?.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-4 mt-1">
              <span>Ready to learn • {recommendations.length} recommendations available</span>
              {employee?.current_xp && (
                <span className="flex items-center gap-1 text-blue-600">
                  <Zap className="h-3 w-3" />
                  {formatXP(employee.current_xp)} XP available
                </span>
              )}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1"
          >
            {isExpanded ? (
              <>
                <Minimize2 className="h-4 w-4" />
                Hide Recs
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4" />
                Show Recs
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
            const canAfford = (employee?.current_xp || 0) >= xp_required;
            const progressPercentage = getXPProgressPercentage(xp_required, employee?.current_xp);
            const isCurrentlyLearning = isLearning === skill.id;

            return (
              <div
                key={skill.id}
                className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${getCategoryBorderColor(skill.category, canAfford)}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-full ${getCategoryIconBg(skill.category, canAfford)}`}>
                      {getCategoryIcon(skill.category)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{skill.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          Level {skill.level}
                        </Badge>
                        <Badge className={`text-xs transition-colors ${getCategoryColor(skill.category)}`}>
                          {skill.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {skill.description}
                      </p>
                      <p className="text-xs text-blue-600 italic">
                        {reason}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className="flex items-center gap-1 mb-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className={`text-sm font-medium ${canAfford ? 'text-green-600' : 'text-orange-600'}`}>
                        {formatXP(xp_required)} XP
                      </span>
                    </div>
                    {employee?.current_xp && (
                      <Progress 
                        value={progressPercentage} 
                        className="w-16 h-2"
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>#{index + 1} recommendation</span>
                    {canAfford && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                        Ready to learn
                      </Badge>
                    )}
                  </div>
                  
                  <Button
                    variant={canAfford ? "default" : "secondary"}
                    size="sm"
                    className="text-xs"
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
                      `Need ${formatXP(xp_required - (employee?.current_xp || 0))} more XP`
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