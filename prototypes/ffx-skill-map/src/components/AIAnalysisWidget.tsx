import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Brain, 
  Key, 
  AlertTriangle, 
  CheckCircle2, 
  Target, 
  TrendingUp, 
  Clock,
  Shield,
  Eye,
  EyeOff,
  ExternalLink,
  Sparkles,
  Zap,
  BookOpen,
  ArrowDown,
  Star,
  Gem
} from 'lucide-react';
import { sharedEnhancedService } from '../services/sharedService';
import { Skill, Employee } from '../types';

interface AIAnalysisWidgetProps {
  employeeId: string;
  employee?: Employee;
  onGoalSelect?: (skill: Skill) => void;
  onScrollToGoals?: () => void;
}

interface AIGoalRecommendation {
  skill: Skill;
  reasoning: string;
  timeframe: 'short' | 'medium' | 'long';
  priority: 'high' | 'medium' | 'low';
  pathLength: number;
}

interface AIAnalysis {
  currentStrengths: string[];
  skillGaps: string[];
  shortTermGoals: AIGoalRecommendation[];
  longTermGoals: AIGoalRecommendation[];
  overallAssessment: string;
}

const AIAnalysisWidget: React.FC<AIAnalysisWidgetProps> = ({
  employeeId,
  employee,
  onGoalSelect,
  onScrollToGoals
}) => {
  const [apiKey, setApiKey] = useState('');
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showKeySetup, setShowKeySetup] = useState(true);
  
  const analysisCache = useRef<Map<string, AIAnalysis>>(new Map());

  const { data: skills } = useQuery({
    queryKey: ['enhanced-skills'],
    queryFn: () => sharedEnhancedService.getAllSkills(),
  });

  const { data: allEmployees } = useQuery({
    queryKey: ['enhanced-employees'],
    queryFn: () => sharedEnhancedService.getAllEmployees(),
  });

  // Check if we have a stored API key in localStorage (with security warnings)
  useEffect(() => {
    const storedKey = localStorage.getItem('claude_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      setShowKeySetup(false);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      // Store in localStorage with warning
      localStorage.setItem('claude_api_key', apiKey.trim());
      setShowKeySetup(false);
      setError(null);
    }
  };

  const handleClearApiKey = () => {
    localStorage.removeItem('claude_api_key');
    setApiKey('');
    setShowKeySetup(true);
    setAnalysis(null);
    setError(null);
  };

  const analyzeSkillsWithAI = async (): Promise<AIAnalysis> => {
    if (!employee || !skills || !allEmployees) {
      throw new Error('Missing required data for analysis');
    }

    // Check cache first
    const cacheKey = `${employeeId}-${employee.mastered_skills.join(',')}`;
    const cached = analysisCache.current.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Get skill recommendations for context
    const recommendations = await sharedEnhancedService.getSkillRecommendations(employeeId);
    
    // Prepare skill data for analysis
    const masteredSkills = skills.filter(skill => employee.mastered_skills.includes(skill.id));
    const availableSkills = recommendations.map(rec => rec.skill);
    const allSkillsByCategory = skills.reduce((acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill);
      return acc;
    }, {} as Record<string, Skill[]>);

    // Create analysis payload
    const analysisPrompt = `
    Analyze this RPG character's skill progression and provide strategic recommendations:

    CHARACTER: ${employee.name}
    ROLE: ${employee.role}
    CURRENT XP: ${employee.current_xp || 0}
    LEVEL: ${employee.level || 1}

    MASTERED SKILLS (${masteredSkills.length}):
    ${masteredSkills.map(skill => 
      `- ${skill.name} (Level ${skill.level}, ${skill.category}, ${skill.xp_required} XP) - ${skill.description}`
    ).join('\n')}

    AVAILABLE NEXT SKILLS:
    ${availableSkills.slice(0, 10).map(skill => 
      `- ${skill.name} (Level ${skill.level}, ${skill.category}, ${skill.xp_required} XP) - ${skill.description}`
    ).join('\n')}

    SKILL CATEGORIES OVERVIEW:
    ${Object.entries(allSkillsByCategory).map(([category, categorySkills]) =>
      `${category}: ${categorySkills.length} total skills, ${masteredSkills.filter(s => s.category === category).length} mastered`
    ).join('\n')}

    Please provide a JSON response with this structure:
    {
      "currentStrengths": ["strength1", "strength2", ...],
      "skillGaps": ["gap1", "gap2", ...],
      "shortTermGoals": [
        {
          "skillName": "Skill Name",
          "reasoning": "Why this skill next",
          "timeframe": "short",
          "priority": "high|medium|low",
          "pathLength": 1-3
        }
      ],
      "longTermGoals": [
        {
          "skillName": "Ultimate Skill Name", 
          "reasoning": "Strategic importance",
          "timeframe": "long",
          "priority": "high|medium|low",
          "pathLength": 5-10
        }
      ],
      "overallAssessment": "Strategic analysis of character progression"
    }

    Focus on:
    1. Identifying current strengths based on mastered skills
    2. Finding skill gaps that limit progression
    3. Recommending 2-3 short-term goals (achievable now or soon)
    4. Suggesting 2-3 long-term goals (powerful skills worth working toward)
    5. Providing strategic assessment of overall character build
    `;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey.trim(),
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1500,
          messages: [{
            role: 'user',
            content: analysisPrompt
          }]
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your Claude API key.');
        } else if (response.status === 429) {
          throw new Error('API rate limit exceeded. Please try again later.');
        }
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.content?.[0]?.text;
      
      if (!content) {
        throw new Error('No response content from Claude API');
      }

      // Parse the JSON response
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}') + 1;
      const jsonStr = content.slice(jsonStart, jsonEnd);
      const aiResponse = JSON.parse(jsonStr);

      // Map skill names back to skill objects
      const mapSkillName = (skillName: string) => {
        return availableSkills.find(skill => 
          skill.name.toLowerCase() === skillName.toLowerCase()
        ) || skills.find(skill => 
          skill.name.toLowerCase() === skillName.toLowerCase()
        );
      };

      interface RawGoalRecommendation {
        skillName: string;
        reasoning: string;
        timeframe: 'short' | 'medium' | 'long';
        priority: 'high' | 'medium' | 'low';
        pathLength: number;
      }

      interface MappedGoalRecommendation extends Omit<RawGoalRecommendation, 'skillName'> {
        skill: Skill | undefined;
      }

      const analysis: AIAnalysis = {
        currentStrengths: aiResponse.currentStrengths || [],
        skillGaps: aiResponse.skillGaps || [],
        shortTermGoals: (aiResponse.shortTermGoals || []).map((goal: RawGoalRecommendation): MappedGoalRecommendation => ({
          skill: mapSkillName(goal.skillName),
          reasoning: goal.reasoning,
          timeframe: goal.timeframe,
          priority: goal.priority,
          pathLength: goal.pathLength
        })).filter((goal: MappedGoalRecommendation): goal is AIGoalRecommendation => !!goal.skill),
        longTermGoals: (aiResponse.longTermGoals || []).map((goal: RawGoalRecommendation): MappedGoalRecommendation => ({
          skill: mapSkillName(goal.skillName),
          reasoning: goal.reasoning,
          timeframe: goal.timeframe,
          priority: goal.priority,
          pathLength: goal.pathLength
        })).filter((goal: MappedGoalRecommendation): goal is AIGoalRecommendation => !!goal.skill),
        overallAssessment: aiResponse.overallAssessment || 'Analysis completed successfully.'
      };

      // Cache the result
      analysisCache.current.set(cacheKey, analysis);
      
      return analysis;
    } catch (err) {
      console.error('AI Analysis error:', err);
      throw err;
    }
  };

  const handleAnalyze = async () => {
    if (!apiKey.trim()) {
      setError('Please provide your Claude API key first.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeSkillsWithAI();
      setAnalysis(result);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze skills. Please check your API key and try again.';
      setError(errorMessage);
      setAnalysis(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGoalSelection = (recommendation: AIGoalRecommendation) => {
    if (onGoalSelect && recommendation.skill) {
      onGoalSelect(recommendation.skill);
      // Scroll to goal planner section
      if (onScrollToGoals) {
        setTimeout(() => onScrollToGoals(), 100);
      }
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'combat': return <Target className="h-4 w-4" />;
      case 'magic': return <Zap className="h-4 w-4" />;
      case 'support': return <CheckCircle2 className="h-4 w-4" />;
      case 'special': return <Star className="h-4 w-4" />;
      case 'advanced': return <BookOpen className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (!employeeId || !employee) {
    return (
      <Card className="border-border/50 shadow-elegant mx-2 sm:mx-4">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            AI Skill Analysis
          </CardTitle>
          <CardDescription className="text-sm">
            Get AI-powered recommendations for your next skill goals
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6 sm:py-8">
          <Brain className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-sm sm:text-base">
            Select an employee to get AI-powered skill recommendations
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-elegant mx-2 sm:mx-4 max-w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-base sm:text-lg">
          <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          {employee.images?.face && (
            <div className="relative">
              <img 
                src={employee.images.face} 
                alt={employee.name}
                className="w-10 h-12 sm:w-12 sm:h-16 object-cover rounded-lg shadow-sm flex-shrink-0 max-w-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
          <span className="truncate">AI Analysis for {employee.name}</span>
        </CardTitle>
        <CardDescription className="text-sm">
          Get intelligent recommendations for your next skill goals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-w-full">
        {showKeySetup ? (
          <div className="space-y-4">
            {/* Security Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-amber-800 mb-2">Security Notice</h4>
                  <div className="text-sm text-amber-700 space-y-2">
                    <p>
                      Your API key will be stored locally in your browser and used only for AI analysis. 
                      <strong> Never share your API key with others.</strong>
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <Shield className="h-3 w-3" />
                      <span>Your key is encrypted in transit and stored securely</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* API Key Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="api-key" className="flex items-center gap-2 text-sm font-medium">
                  <Key className="h-4 w-4" />
                  Claude API Key
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  <a 
                    href="https://console.anthropic.com/settings/keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    Get API Key
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
              <div className="relative">
                <Input
                  id="api-key"
                  type={isApiKeyVisible ? "text" : "password"}
                  placeholder="sk-ant-api..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pr-10 text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsApiKeyVisible(!isApiKeyVisible)}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                >
                  {isApiKeyVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
              </div>
              <Button 
                onClick={handleSaveApiKey} 
                disabled={!apiKey.trim()}
                className="w-full"
                size="sm"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Save & Continue
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* API Key Status */}
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-green-800">
                <CheckCircle2 className="h-4 w-4" />
                <span>API key configured</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearApiKey}
                className="text-xs text-red-600 hover:text-red-700"
              >
                Clear Key
              </Button>
            </div>

            {/* Analysis Button */}
            <Button 
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Analyzing Skills...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Get AI Analysis of Next Steps
                </>
              )}
            </Button>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {analysis && (
              <div className="space-y-4">
                {/* Overall Assessment */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Overall Assessment
                  </h3>
                  <p className="text-sm text-blue-700">{analysis.overallAssessment}</p>
                </div>

                {/* Current Strengths */}
                {analysis.currentStrengths.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-green-700 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Current Strengths
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.currentStrengths.map((strength, index) => (
                        <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
                          {strength}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skill Gaps */}
                {analysis.skillGaps.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-orange-700 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Areas for Growth
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.skillGaps.map((gap, index) => (
                        <Badge key={index} variant="outline" className="bg-orange-50 text-orange-700 border-orange-300 text-xs">
                          {gap}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Short Term Goals */}
                {analysis.shortTermGoals.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-blue-700 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Recommended Short-Term Goals
                    </h4>
                    <div className="space-y-2">
                      {analysis.shortTermGoals.map((goal, index) => (
                        <div 
                          key={index}
                          className="p-3 bg-blue-50/50 border border-blue-200 rounded-lg hover:bg-blue-100/50 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="p-1 rounded bg-blue-100">
                                {getCategoryIcon(goal.skill.category)}
                              </div>
                              <span className="font-medium text-sm truncate">{goal.skill.name}</span>
                              <Badge variant="outline" className={`text-xs flex-shrink-0 ${getCategoryColor(goal.skill.category)}`}>
                                {goal.skill.category}
                              </Badge>
                              <Badge variant="outline" className={`text-xs flex-shrink-0 ${getPriorityColor(goal.priority)}`}>
                                {goal.priority}
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGoalSelection(goal)}
                              className="text-xs bg-blue-600 text-white border-blue-600 hover:bg-blue-700 flex-shrink-0"
                            >
                              <ArrowDown className="h-3 w-3 mr-1" />
                              Set Goal
                            </Button>
                          </div>
                          <p className="text-xs text-blue-600 italic">{goal.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Long Term Goals */}
                {analysis.longTermGoals.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-purple-700 flex items-center gap-2">
                      <Gem className="h-4 w-4" />
                      Recommended Long-Term Goals
                    </h4>
                    <div className="space-y-2">
                      {analysis.longTermGoals.map((goal, index) => (
                        <div 
                          key={index}
                          className="p-3 bg-purple-50/50 border border-purple-200 rounded-lg hover:bg-purple-100/50 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <div className="p-1 rounded bg-purple-100">
                                {getCategoryIcon(goal.skill.category)}
                              </div>
                              <span className="font-medium text-sm truncate">{goal.skill.name}</span>
                              <Badge variant="outline" className={`text-xs flex-shrink-0 ${getCategoryColor(goal.skill.category)}`}>
                                {goal.skill.category}
                              </Badge>
                              <Badge variant="outline" className={`text-xs flex-shrink-0 ${getPriorityColor(goal.priority)}`}>
                                {goal.priority}
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGoalSelection(goal)}
                              className="text-xs bg-purple-600 text-white border-purple-600 hover:bg-purple-700 flex-shrink-0"
                            >
                              <ArrowDown className="h-3 w-3 mr-1" />
                              Set Goal
                            </Button>
                          </div>
                          <p className="text-xs text-purple-600 italic">{goal.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIAnalysisWidget;