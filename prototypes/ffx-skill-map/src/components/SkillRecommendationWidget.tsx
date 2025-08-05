import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
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
  Minimize2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { sharedEnhancedService } from '../services/sharedService';
import { Skill, Employee } from '../types';

interface SkillRecommendationWidgetProps {
  employeeId: string;
  employee?: Employee;
  goalSkillId?: string;
  onSkillLearn?: (skill: Skill, employee: Employee) => void;
  service?: any; // Service to use for recommendations (defaults to sharedEnhancedService)
  dataSource?: string; // Data source for query keys (defaults to 'enhanced')
}

interface SkillRecommendation {
  skill: Skill;
  xp_required: number;
  reason: string;
}

export interface SkillRecommendationWidgetRef {
  expand: () => void;
}

const SkillRecommendationWidget = forwardRef<SkillRecommendationWidgetRef, SkillRecommendationWidgetProps>(({
  employeeId,
  employee,
  goalSkillId,
  onSkillLearn,
  service = sharedEnhancedService, // Default to sharedEnhancedService for backward compatibility
  dataSource = 'enhanced' // Default to 'enhanced' for backward compatibility
}, ref) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLearning, setIsLearning] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();
  
  const ITEMS_PER_PAGE = 5;
  const { data: recommendations, isLoading, error } = useQuery({
    queryKey: ['skill-recommendations', employeeId, goalSkillId, service?.constructor?.name || 'default'],
    queryFn: () => service.getSkillRecommendations(employeeId, goalSkillId),
    enabled: !!employeeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Pagination calculations
  const totalRecommendations = recommendations?.length || 0;
  const totalPages = Math.ceil(totalRecommendations / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedRecommendations = recommendations?.slice(startIndex, endIndex) || [];
  const showPagination = totalRecommendations > ITEMS_PER_PAGE;

  // Reset pagination when recommendations change
  useEffect(() => {
    setCurrentPage(1);
  }, [employeeId, goalSkillId, totalRecommendations]);

  // Expose expand function to parent via ref
  useImperativeHandle(ref, () => ({
    expand: () => setIsExpanded(true)
  }));

  const getCategoryIcon = (category: string) => {
    switch (category) {
      // FFX categories
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
      // Tech categories
      case 'engineering':
        return <Zap className="h-4 w-4" />;
      case 'platform':
        return <Target className="h-4 w-4" />;
      case 'product':
        return <Star className="h-4 w-4" />;
      case 'communication':
        return <BookOpen className="h-4 w-4" />;
      case 'process':
        return <Clock className="h-4 w-4" />;
      case 'leadership':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      // FFX categories
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
      // Tech categories
      case 'engineering':
        return 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-300';
      case 'platform':
        return 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-300';
      case 'product':
        return 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-300';
      case 'communication':
        return 'bg-teal-100 text-teal-800 border-teal-300 hover:bg-teal-300';
      case 'process':
        return 'bg-pink-100 text-pink-800 border-pink-300 hover:bg-pink-300';
      case 'leadership':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-300';
    }
  };

  const getCategoryBorderColor = (category: string, canAfford: boolean) => {
    if (!canAfford) return 'border-gray-200 bg-gray-50/50';
    
    switch (category) {
      // FFX categories
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
      // Tech categories
      case 'engineering':
        return 'border-blue-200 bg-blue-50/50 hover:bg-blue-100 hover:border-blue-300';
      case 'platform':
        return 'border-purple-200 bg-purple-50/50 hover:bg-purple-100 hover:border-purple-300';
      case 'product':
        return 'border-orange-200 bg-orange-50/50 hover:bg-orange-100 hover:border-orange-300';
      case 'communication':
        return 'border-teal-200 bg-teal-50/50 hover:bg-teal-100 hover:border-teal-300';
      case 'process':
        return 'border-pink-200 bg-pink-50/50 hover:bg-pink-100 hover:border-pink-300';
      case 'leadership':
        return 'border-yellow-200 bg-yellow-50/50 hover:bg-yellow-100 hover:border-yellow-300';
      default:
        return 'border-gray-200 bg-gray-50/50 hover:bg-gray-100 hover:border-gray-300';
    }
  };

  const getCategoryIconBg = (category: string, canAfford: boolean) => {
    if (!canAfford) return 'bg-gray-100';
    
    switch (category) {
      // FFX categories
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
      // Tech categories
      case 'engineering':
        return 'bg-blue-100';
      case 'platform':
        return 'bg-purple-100';
      case 'product':
        return 'bg-orange-100';
      case 'communication':
        return 'bg-teal-100';
      case 'process':
        return 'bg-pink-100';
      case 'leadership':
        return 'bg-yellow-100';
      default:
        return 'bg-gray-100';
    }
  };

  const getXPProgressPercentage = (required: number | undefined | null, current?: number | undefined | null) => {
    if (!current || !required || required <= 0) {
      if (required !== undefined && required !== null && required <= 0) {
        console.warn(`SkillRecommendationWidget.getXPProgressPercentage: Invalid required XP value: ${required}`);
      }
      return 0;
    }
    if (typeof required !== 'number' || typeof current !== 'number') {
      console.error('SkillRecommendationWidget.getXPProgressPercentage: Non-numeric values:', { required, current });
      return 0;
    }
    return Math.min((current / required) * 100, 100);
  };

  const formatXP = (xp: number | undefined | null) => {
    if (xp == null || xp === undefined) {
      console.warn('SkillRecommendationWidget.formatXP: Received null/undefined XP value');
      return '0';
    }
    if (typeof xp !== 'number' || isNaN(xp)) {
      console.error('SkillRecommendationWidget.formatXP: Invalid XP value:', xp);
      return '?';
    }
    if (xp >= 1000) {
      return `${(xp / 1000).toFixed(1)}k`;
    }
    return xp.toString();
  };

  const handleLearnSkill = async (skill: Skill) => {
    if (!employee || !onSkillLearn) return;
    
    // Get the most up-to-date employee data from the cache or service
    const currentEmployeeData = queryClient.getQueryData([`${dataSource}-employees`]) as Employee[] | undefined;
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
      
      // Get updated data from the current service
      const updatedEmployees = await service.getAllEmployees();
      queryClient.setQueryData([`${dataSource}-employees`], updatedEmployees);
      
      // Use efficient invalidation instead of blocking refetch
      // Invalidate all skill-recommendations for this employee (with any goal/service combination)
      queryClient.invalidateQueries({ queryKey: ['skill-recommendations', employeeId], exact: false });
      queryClient.invalidateQueries({ queryKey: [`${dataSource}-employees`], exact: false });
      
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
          <CardDescription className="flex items-center gap-3">
            {employee?.images?.face && (
              <div className="relative">
                <img 
                  src={employee.images.face} 
                  alt={employee.name}
                  className="w-12 h-16 md:w-16 md:h-20 object-cover rounded-lg shadow-md flex-shrink-0 max-w-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            )}
            <div>
              <div className="font-medium text-foreground">Analyzing skill paths for {employee?.name}</div>
              <div className="text-sm text-muted-foreground">Finding optimal learning opportunities</div>
            </div>
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
            <div className="flex items-center gap-3">
              {employee?.images?.face && (
                <div className="relative">
                  <img 
                    src={employee.images.face} 
                    alt={employee.name}
                    className="w-10 h-12 object-cover rounded-lg shadow-sm flex-shrink-0 max-w-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              Skill Recommendations for {employee?.name}
            </div>
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
            <CardTitle className="flex items-center gap-3 text-lg md:text-xl">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
              {employee?.images?.face && (
                <div className="relative">
                  <img 
                    src={employee.images.face} 
                    alt={employee.name}
                    className="w-10 h-12 md:w-12 md:h-16 object-cover rounded-lg shadow-sm flex-shrink-0 max-w-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <span className="truncate">
                Invest in your Learning
              </span>
            </CardTitle>
            <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1 text-sm">
              <span>
                {showPagination 
                  ? `${totalRecommendations} recommendation${totalRecommendations === 1 ? '' : 's'} available (showing ${startIndex + 1}-${Math.min(endIndex, totalRecommendations)})`
                  : `${totalRecommendations} recommendation${totalRecommendations === 1 ? '' : 's'} available`
                }
              </span>
              {(() => {
                // Get the most up-to-date employee data for XP display
                const currentEmployeeData = queryClient.getQueryData([`${dataSource}-employees`]) as Employee[] | undefined;
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
                <span className="hidden sm:inline">Hide Skills</span>
                <span className="sm:hidden">Hide</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Show Skills</span>
                <span className="sm:hidden">Show</span>
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isExpanded ? (
          <div className="space-y-4">
            {paginatedRecommendations.map((recommendation, index) => {
            // Calculate global index for display purposes
            const globalIndex = startIndex + index;
            const { skill, reason, priority } = recommendation;
            
            // Validate data structure and provide helpful error messages
            if (!skill) {
              console.error('SkillRecommendationWidget: Missing skill in recommendation:', recommendation);
              return null;
            }
            
            const xp_required = skill.xp_required;
            if (xp_required === undefined || xp_required === null) {
              console.warn(`SkillRecommendationWidget: Missing xp_required for skill ${skill.id} (${skill.name})`);
            }
            // Get the most up-to-date employee data for XP checks
            const currentEmployeeData = queryClient.getQueryData([`${dataSource}-employees`]) as Employee[] | undefined;
            const currentEmployee = currentEmployeeData?.find(emp => emp.id === employeeId) || employee;
            
            const canAfford = (currentEmployee?.current_xp || 0) >= xp_required;
            const progressPercentage = getXPProgressPercentage(xp_required, currentEmployee?.current_xp);
            const isCurrentlyLearning = isLearning === skill.id;
            const isGoalSkill = skill.id === goalSkillId;

            return (
              <div
                key={skill.id}
                className={`p-3 md:p-4 rounded-lg border transition-all duration-200 hover:shadow-md relative overflow-hidden ${
                  isGoalSkill 
                    ? 'bg-gradient-to-r from-yellow-50 via-amber-50 to-yellow-50 border-yellow-400 shadow-lg ring-2 ring-yellow-300/50 shadow-yellow-200/50' 
                    : getCategoryBorderColor(skill.category, canAfford)
                }`}
              >
                {/* Lightning effects for goal skill */}
                {isGoalSkill && (
                  <>
                    <div className="absolute top-1 right-2 animate-pulse">
                      <Zap className="h-4 w-4 text-yellow-500 animate-bounce" style={{animationDelay: '0.1s'}} />
                    </div>
                    <div className="absolute bottom-1 left-2 animate-pulse" style={{animationDelay: '0.3s'}}>
                      <Zap className="h-3 w-3 text-amber-500 animate-ping" />
                    </div>
                    <div className="absolute top-3 left-1/3 animate-pulse" style={{animationDelay: '0.5s'}}>
                      <Zap className="h-3 w-3 text-yellow-600 animate-bounce" />
                    </div>
                    <div className="absolute bottom-2 right-1/4 animate-pulse" style={{animationDelay: '0.7s'}}>
                      <Zap className="h-2 w-2 text-amber-600 animate-ping" />
                    </div>
                  </>
                )}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`p-1.5 md:p-2 rounded-full flex-shrink-0 relative z-10 ${
                      isGoalSkill 
                        ? 'bg-gradient-to-br from-yellow-200 to-amber-300 ring-2 ring-yellow-400/50' 
                        : getCategoryIconBg(skill.category, canAfford)
                    }`}>
                      {getCategoryIcon(skill.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1 md:gap-2 mb-1">
                        <h4 className="font-semibold text-sm md:text-base truncate">{skill.name}</h4>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          Level {skill.level}
                        </Badge>
                        {priority && (
                          <Badge 
                            variant={priority === 'high' ? 'default' : priority === 'medium' ? 'secondary' : 'outline'}
                            className={`text-xs flex-shrink-0 ${
                              priority === 'high' ? 'bg-red-100 text-red-800 border-red-200' :
                              priority === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                              'bg-green-100 text-green-800 border-green-200'
                            }`}
                          >
                            {priority}
                          </Badge>
                        )}
                        <Badge className={`text-xs transition-colors flex-shrink-0 hidden sm:inline-flex ${getCategoryColor(skill.category)}`}>
                          {skill.category}
                        </Badge>
                      </div>
                      <p className="text-xs md:text-sm text-muted-foreground mb-2 line-clamp-2">
                        {skill.description}
                      </p>
                      <p className={`text-xs md:text-sm italic font-medium ${
                        isGoalSkill ? 'text-amber-700' : 'text-blue-600'
                      }`}>
                        {isGoalSkill ? 'Level up to meet your goal!' : reason}
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
                    <span>#{globalIndex + 1} recommendation</span>
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
              Skills currently hidden... Click "Show Skills" to view {totalRecommendations} recommendations
            </p>
          </div>
        )}
        
        {/* Pagination Controls */}
        {isExpanded && showPagination && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="text-xs"
              >
                <ChevronLeft className="h-3 w-3 mr-1" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {(() => {
                  const maxVisiblePages = 5;
                  const pages = [];
                  
                  if (totalPages <= maxVisiblePages) {
                    // Show all pages if there are few enough
                    for (let i = 1; i <= totalPages; i++) {
                      pages.push(i);
                    }
                  } else {
                    // Show smart pagination with ellipsis
                    const startPage = Math.max(1, currentPage - 2);
                    const endPage = Math.min(totalPages, currentPage + 2);
                    
                    if (startPage > 1) {
                      pages.push(1);
                      if (startPage > 2) {
                        pages.push('...');
                      }
                    }
                    
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(i);
                    }
                    
                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push('...');
                      }
                      pages.push(totalPages);
                    }
                  }
                  
                  return pages.map((page, index) => (
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="text-xs text-muted-foreground px-2">
                        ...
                      </span>
                    ) : (
                      <Button
                        key={page}
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page as number)}
                        className="text-xs w-8 h-8"
                      >
                        {page}
                      </Button>
                    )
                  ));
                })()}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="text-xs"
              >
                Next
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Page {currentPage} of {totalPages} ({totalRecommendations} total)
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

SkillRecommendationWidget.displayName = 'SkillRecommendationWidget';

export default SkillRecommendationWidget;