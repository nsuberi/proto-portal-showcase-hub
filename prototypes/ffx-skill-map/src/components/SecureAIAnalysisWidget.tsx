import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Brain, 
  CheckCircle2, 
  Target, 
  TrendingUp, 
  Clock,
  Shield,
  ExternalLink,
  Sparkles,
  Zap,
  BookOpen,
  ArrowDown,
  Star,
  Gem,
  AlertTriangle,
  Server,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';
import { sharedEnhancedService } from '../services/sharedService';
import { Skill, Employee } from '../types';

interface SecureAIAnalysisWidgetProps {
  employeeId: string;
  employee?: Employee;
  onGoalSelect?: (skill: Skill) => void;
  onScrollToGoals?: () => void;
  apiBaseUrl?: string; // Allow configurable API URL
  service?: any; // Service to use for skills data (defaults to sharedEnhancedService)
  dataSource?: string; // Data source for query keys (defaults to 'enhanced')
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

interface AnalysisResponse {
  analysis: AIAnalysis;
  metadata: {
    analysisId: string;
    timestamp: string;
    model: string;
    processingTimeMs: number;
  };
}

// Function to determine the appropriate API URL based on environment
const getApiUrl = (): string => {
  // Check if we're running in development mode (Vite's import.meta.env)
  const isDevelopment = import.meta.env.DEV;
  
  // Check if we're on localhost or a development port
  const isLocalhost = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';
  
  // Use environment variable if provided (for build-time configuration)
  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl) {
    return envApiUrl;
  }
  
  // If in development or on localhost, use local API
  if (isDevelopment || isLocalhost) {
    return 'http://localhost:3003';
  }
  
  // For production, this placeholder will be replaced by the deploy script
  // with the actual API Gateway URL from Terraform outputs
  return 'PLACEHOLDER_API_GATEWAY_URL';
};

const SecureAIAnalysisWidget: React.FC<SecureAIAnalysisWidgetProps> = ({
  employeeId,
  employee,
  onGoalSelect,
  onScrollToGoals,
  apiBaseUrl,
  service = sharedEnhancedService, // Default to sharedEnhancedService for backward compatibility
  dataSource = 'enhanced' // Default to 'enhanced' for backward compatibility
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisMetadata, setAnalysisMetadata] = useState<any>(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [useMockData, setUseMockData] = useState(false);
  const [additionalContext, setAdditionalContext] = useState('');
  
  const analysisCache = useRef<Map<string, { analysis: AIAnalysis; metadata: any }>>(new Map());

  const { data: skills } = useQuery({
    queryKey: [`${dataSource}-skills`],
    queryFn: () => service.getAllSkills(),
  });

  const { data: allEmployees } = useQuery({
    queryKey: [`${dataSource}-employees`],
    queryFn: () => service.getAllEmployees(),
  });

  // Use existing Lambda API as proxy to Claude
  const API_ENDPOINT = `${apiBaseUrl || getApiUrl()}/api/v1/ai-analysis/skill-recommendations`;

  // Mock analysis for local testing
  const generateMockAnalysis = async (character: any, availableSkills: any[]): Promise<{ analysis: AIAnalysis; metadata: any }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const mockSkill1 = availableSkills[0] || {
      id: 'mock_skill_1',
      name: 'Advanced Combat',
      category: 'combat',
      description: 'Enhanced fighting techniques'
    };

    const mockSkill2 = availableSkills[1] || {
      id: 'mock_skill_2', 
      name: 'Magic Mastery',
      category: 'magic',
      description: 'Advanced magical abilities'
    };

    const analysis: AIAnalysis = {
      currentStrengths: [
        `Strong ${character.role.toLowerCase()} foundation`,
        'Good progression in core skills',
        'Balanced skill development'
      ],
      skillGaps: [
        'Advanced combat techniques',
        'Support abilities',
        'Specialized role skills'
      ],
      shortTermGoals: [
        {
          skill: mockSkill1,
          reasoning: `As a ${character.role}, developing advanced combat skills would complement your existing ${character.masteredSkills.join(', ')} abilities and provide immediate tactical advantages.`,
          timeframe: 'short',
          priority: 'high',
          pathLength: 1
        }
      ],
      longTermGoals: [
        {
          skill: mockSkill2,
          reasoning: `Long-term mastery of magical abilities would open up new strategic possibilities and create powerful synergies with your current skill set.`,
          timeframe: 'long', 
          priority: 'medium',
          pathLength: 3
        }
      ],
      overallAssessment: `${character.name} shows excellent potential as a ${character.role}. With ${character.masteredSkills.length} mastered skills and ${character.currentXP} XP, you're well-positioned for both tactical improvements and strategic growth. Focus on complementing your existing strengths while gradually expanding into new domains.`
    };

    const metadata = {
      analysisId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      model: 'mock-claude-for-development',
      processingTimeMs: 1500
    };

    return { analysis, metadata };
  };

  const analyzeSkillsWithAPI = async (): Promise<{ analysis: AIAnalysis; metadata: any }> => {
    if (!employee || !skills || !allEmployees) {
      throw new Error('Missing required data for analysis');
    }

    // Check cache first
    const cacheKey = `${employeeId}-${employee.mastered_skills.join(',')}-${useMockData ? 'mock' : 'real'}-${additionalContext}`;
    const cached = analysisCache.current.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Get skill recommendations for context
    const recommendations = await service.getSkillRecommendations(employeeId);

    // Use mock data for local testing
    if (useMockData) {
      const result = await generateMockAnalysis({
        name: employee.name,
        role: employee.role,
        currentXP: employee.current_xp || 0,
        level: employee.level || 1,
        masteredSkills: employee.mastered_skills
      }, recommendations.map(rec => rec.skill));
      
      analysisCache.current.set(cacheKey, result);
      return result;
    }

    // In development mode, allow using server's mock mode without an API key
    let requestApiKey = apiKey.trim();
    if (!requestApiKey && import.meta.env.DEV) {
      requestApiKey = 'mock'; // Use server's mock mode
    }
    
    // Validate API key for real API calls
    if (!requestApiKey) {
      throw new Error('Claude API key is required. Please enter your API key from Anthropic Console.');
    }

    if (requestApiKey !== 'mock' && !requestApiKey.startsWith('sk-ant-api')) {
      throw new Error('Invalid API key format. Please enter a valid Anthropic Claude API key.');
    }
    
    // Prepare request payload matching your Lambda API format
    const requestPayload = {
      apiKey: requestApiKey, // User-provided Claude API key or 'mock'
      character: {
        name: employee.name,
        role: employee.role,
        currentXP: employee.current_xp || 0,
        level: employee.level || 1,
        masteredSkills: employee.mastered_skills
      },
      availableSkills: recommendations.map(rec => rec.skill),
      allSkills: skills,
      context: {
        additionalContext: additionalContext || '',
        goalDefinitions: {
          shortTerm: 'Skills that can be achieved in 3 steps or fewer',
          longTerm: 'Skills that require more than 3 steps to achieve'
        }
      }
    };

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          throw new Error('Authentication failed. Please contact support if this persists.');
        } else if (response.status === 429) {
          throw new Error('Service is busy. Please try again in a few minutes.');
        } else if (response.status === 503) {
          throw new Error('AI analysis service is temporarily unavailable. Please check your API key and try again later.');
        } else if (response.status === 400) {
          throw new Error('Invalid request format. Please contact support.');
        }
        
        throw new Error(errorData.error || `Analysis request failed: ${response.status} ${response.statusText}`);
      }

      const data: AnalysisResponse = await response.json();
      
      if (!data.analysis) {
        throw new Error('Invalid response from analysis service');
      }

      // Cache the result
      const result = { analysis: data.analysis, metadata: data.metadata };
      analysisCache.current.set(cacheKey, result);
      
      return result;

    } catch (err) {
      console.error('Claude API error:', err);
      console.error('Error details:', {
        message: (err as Error).message,
        stack: (err as Error).stack,
        apiEndpoint: API_ENDPOINT
      });
      throw err;
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeSkillsWithAPI();
      setAnalysis(result.analysis);
      setAnalysisMetadata(result.metadata);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze skills. Please try again later.';
      setError(errorMessage);
      setAnalysis(null);
      setAnalysisMetadata(null);
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
      // FFX categories
      case 'combat': return <Target className="h-4 w-4" />;
      case 'magic': return <Zap className="h-4 w-4" />;
      case 'support': return <CheckCircle2 className="h-4 w-4" />;
      case 'special': return <Star className="h-4 w-4" />;
      case 'advanced': return <BookOpen className="h-4 w-4" />;
      // Tech categories
      case 'engineering': return <Zap className="h-4 w-4" />;
      case 'platform': return <Target className="h-4 w-4" />;
      case 'product': return <Star className="h-4 w-4" />;
      case 'communication': return <BookOpen className="h-4 w-4" />;
      case 'process': return <Clock className="h-4 w-4" />;
      case 'leadership': return <TrendingUp className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      // FFX categories
      case 'combat': return 'bg-red-100 text-red-800 border-red-300';
      case 'magic': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'support': return 'bg-green-100 text-green-800 border-green-300';
      case 'special': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'advanced': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      // Tech categories
      case 'engineering': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'platform': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'product': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'communication': return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'process': return 'bg-pink-100 text-pink-800 border-pink-300';
      case 'leadership': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
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
        <CardTitle className="flex items-center gap-3 text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-700 via-blue-700 to-purple-700 bg-clip-text text-transparent">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 shadow-lg">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          {employee.images?.face && (
            <div className="relative ring-2 ring-purple-200 rounded-lg overflow-hidden">
              <img 
                src={employee.images.face} 
                alt={employee.name}
                className="w-12 h-14 sm:w-14 sm:h-18 object-cover shadow-sm flex-shrink-0 max-w-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
          <span className="truncate">✨ AI Career Path Analysis</span>
        </CardTitle>
        <CardDescription className="text-sm text-purple-700 font-medium">
          Get intelligent, personalized recommendations for {employee.name}'s next skill goals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-w-full">
        {/* Additional Context Input */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <Label htmlFor="growth-context" className="text-base font-semibold text-purple-800 mb-2 block">
                What areas do you hope to grow in?
              </Label>
              <p className="text-sm text-purple-700 mb-3">
                Share your career aspirations, interests, or specific areas you'd like to develop to get more personalized recommendations.
              </p>
              <textarea
                id="growth-context"
                placeholder="e.g., I want to become a stronger leader, develop magical abilities, focus on team support skills..."
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                className="w-full min-h-[80px] text-sm p-3 border border-purple-200 rounded-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50 resize-none bg-white"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* API Key Input */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <Key className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-blue-700 mb-3">
                <strong>Claude API Key Required:</strong> Enter your Anthropic Claude API key to get personalized skill analysis. 
                Your key is used only for this request and never stored.
              </p>
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    placeholder="sk-ant-api03-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="pr-10 text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-blue-600">
                  Get your API key from <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="underline">Anthropic Console</a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Development Mode Toggle */}
        {import.meta.env.DEV && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="mockMode"
                checked={useMockData}
                onChange={(e) => setUseMockData(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="mockMode" className="text-sm text-yellow-800">
                <strong>Development Mode:</strong> Use mock data (no API key required)
              </label>
            </div>
          </div>
        )}

        {/* Analysis Button */}
        <Button 
          onClick={handleAnalyze}
          disabled={isAnalyzing || (!useMockData && !apiKey.trim() && !import.meta.env.DEV)}
          className="w-full bg-gradient-to-r from-purple-600 via-purple-700 to-blue-600 hover:from-purple-700 hover:via-purple-800 hover:to-blue-700 text-white font-bold text-lg py-6 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:transform-none"
          size="lg"
        >
          {isAnalyzing ? (
            <>
              <div className="animate-spin h-5 w-5 border-3 border-white border-t-transparent rounded-full mr-3" />
              <span className="animate-pulse">{useMockData ? 'Generating Mock Analysis...' : 'Analyzing Career Path...'}</span>
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-3 animate-pulse" />
              <span>
                {useMockData 
                  ? 'Get Mock Analysis' 
                  : (apiKey.trim() ? '✨ Analyze My Career Path' : '✨ Get AI Analysis (Server Mock)')
                }
              </span>
            </>
          )}
        </Button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-700">{error}</p>
                {error.includes('Authentication') && (
                  <p className="text-xs text-red-600 mt-1">
                    This usually indicates a deployment configuration issue.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {analysis && (
          <div className="space-y-4">
            {/* Analysis Metadata */}
            {analysisMetadata && (
              <div className="text-xs text-gray-500 flex items-center gap-4 pb-2 border-b">
                <span>Analysis ID: {analysisMetadata.analysisId.substring(0, 8)}...</span>
                <span>Model: {analysisMetadata.model}</span>
                <span>Processing: {analysisMetadata.processingTimeMs}ms</span>
              </div>
            )}

            {/* Overall Assessment */}
            <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 border-2 border-blue-300 rounded-xl p-6 shadow-md">
              <h3 className="font-bold text-lg text-blue-900 mb-3 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                🎯 Career Path Assessment
              </h3>
              <p className="text-base text-blue-800 leading-relaxed font-medium">{analysis.overallAssessment}</p>
            </div>

            {/* Current Strengths */}
            {analysis.currentStrengths.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-lg text-green-800 flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-green-100">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  💪 Current Strengths
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
                <h4 className="font-bold text-lg text-orange-800 flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-orange-100">
                    <Target className="h-5 w-5 text-orange-600" />
                  </div>
                  🎯 Areas for Growth
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
                <h4 className="font-bold text-lg text-blue-800 flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-blue-100">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  🚀 Recommended Short-Term Goals
                  <Badge variant="outline" className="ml-2 text-xs bg-blue-50 text-blue-700 border-blue-300">
                    3 steps or less
                  </Badge>
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
                <h4 className="font-bold text-lg text-purple-800 flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-purple-100">
                    <Gem className="h-5 w-5 text-purple-600" />
                  </div>
                  🌟 Recommended Long-Term Goals
                  <Badge variant="outline" className="ml-2 text-xs bg-purple-50 text-purple-700 border-purple-300">
                    more than 3 steps
                  </Badge>
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
      </CardContent>
    </Card>
  );
};

export default SecureAIAnalysisWidget;