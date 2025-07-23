import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Users, 
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
  EyeOff,
  ChevronUp,
  ChevronDown,
  UserPlus,
  Heart,
  Handshake,
  Award,
  ArrowRightLeft
} from 'lucide-react';
import { sharedEnhancedService } from '../services/sharedService';
import { Skill, Employee } from '../types';
import { getSystemPrompt } from '../lib/systemPrompts';

interface AITeamPathWidgetProps {
  employeeId: string;
  employee?: Employee;
  onGoalSelect?: (skill: Skill) => void;
  onScrollToGoals?: () => void;
  apiBaseUrl?: string; // Allow configurable API URL
  service?: {
    getAllSkills: () => Promise<Skill[]>;
    getAllEmployees: () => Promise<Employee[]>;
    getSkillRecommendations: (employeeId: string) => Promise<{ skill: Skill }[]>;
  }; // Service to use for skills data (defaults to sharedEnhancedService)
  dataSource?: string; // Data source for query keys (defaults to 'enhanced')
}

interface TeammateRecommendation {
  teammate: Employee;
  relationship: 'help' | 'learn_from';
  reasoning: string;
  sharedSkills: string[];
  complementarySkills: string[];
  impact: 'high' | 'medium' | 'low';
}

interface TeamCollaborationOpportunity {
  skillArea: string;
  description: string;
  participants: Employee[];
  benefit: string;
}

interface AITeamAnalysis {
  teammateToHelpMost: TeammateRecommendation;
  teammateToLearnFrom: TeammateRecommendation;
  collaborationOpportunities: TeamCollaborationOpportunity[];
  skillGapsForTeam: string[];
  mentorshipPotential: {
    canMentor: string[];
    shouldLearnFrom: string[];
  };
  teamImpactAssessment: string;
}

// Reuse the same response format as the career analysis API
interface APIAnalysisResponse {
  analysis: {
    currentStrengths: string[];
    skillGaps: string[];
    shortTermGoals: Array<{
      skill: Skill;
      reasoning: string;
      timeframe: 'short' | 'medium' | 'long';
      priority: 'high' | 'medium' | 'low';
      pathLength: number;
    }>;
    longTermGoals: Array<{
      skill: Skill;
      reasoning: string;
      timeframe: 'short' | 'medium' | 'long';
      priority: 'high' | 'medium' | 'low';
      pathLength: number;
    }>;
    overallAssessment: string;
  };
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

const AITeamPathWidget: React.FC<AITeamPathWidgetProps> = ({
  employeeId,
  employee,
  onGoalSelect,
  onScrollToGoals,
  apiBaseUrl,
  service = sharedEnhancedService, // Default to sharedEnhancedService for backward compatibility
  dataSource = 'enhanced' // Default to 'enhanced' for backward compatibility
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AITeamAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisMetadata, setAnalysisMetadata] = useState<APIAnalysisResponse['metadata'] | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [useMockData, setUseMockData] = useState(false);
  const [additionalContext, setAdditionalContext] = useState('');
  const [isWidgetVisible, setIsWidgetVisible] = useState(false);
  
  const analysisCache = useRef<Map<string, { analysis: AITeamAnalysis; metadata: APIAnalysisResponse['metadata'] }>>(new Map());

  const { data: skills } = useQuery({
    queryKey: [`${dataSource}-skills`],
    queryFn: () => service.getAllSkills(),
  });

  const { data: allEmployees } = useQuery({
    queryKey: [`${dataSource}-employees`],
    queryFn: () => service.getAllEmployees(),
  });

  // Use existing Lambda API as proxy to Claude - same endpoint as career analysis
  const API_ENDPOINT = `${apiBaseUrl || getApiUrl()}/api/v1/ai-analysis/skill-recommendations`;

  // Mock analysis for local testing
  const generateMockAnalysis = async (
    character: {
      name: string;
      role: string;
      currentXP: number;
      level: number;
      masteredSkills: string[];
    }, 
    teammates: Employee[], 
    availableSkills: Skill[]
  ): Promise<{ analysis: AITeamAnalysis; metadata: APIAnalysisResponse['metadata'] }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Find teammates with different skill sets
    const helpCandidate = teammates.find(t => 
      t.mastered_skills.length < character.masteredSkills.length
    ) || teammates[0];
    
    const learnFromCandidate = teammates.find(t => 
      t.mastered_skills.length > character.masteredSkills.length
    ) || teammates[1] || teammates[0];

    const analysis: AITeamAnalysis = {
      teammateToHelpMost: {
        teammate: helpCandidate,
        relationship: 'help',
        reasoning: `${helpCandidate?.name} could benefit significantly from your expertise in ${character.masteredSkills.slice(0, 2).join(' and ')}. Your experience would help accelerate their development in these key areas.`,
        sharedSkills: character.masteredSkills.slice(0, 2),
        complementarySkills: ['Advanced problem solving', 'Best practices'],
        impact: 'high'
      },
      teammateToLearnFrom: {
        teammate: learnFromCandidate,
        relationship: 'learn_from',
        reasoning: `${learnFromCandidate?.name} has mastered ${learnFromCandidate?.mastered_skills?.length || 0} skills and could provide valuable guidance in areas where you're looking to grow. Their experience would be invaluable for your development.`,
        sharedSkills: [],
        complementarySkills: learnFromCandidate?.mastered_skills?.slice(0, 3) || [],
        impact: 'high'
      },
      collaborationOpportunities: [
        {
          skillArea: 'Knowledge Sharing Sessions',
          description: 'Regular skill-sharing sessions where team members teach each other their specialties',
          participants: [character, ...teammates.slice(0, 2)],
          benefit: 'Cross-pollination of expertise and stronger team cohesion'
        }
      ],
      skillGapsForTeam: [
        'Advanced leadership skills',
        'Cross-functional communication',
        'Mentoring abilities'
      ],
      mentorshipPotential: {
        canMentor: character.masteredSkills.slice(0, 3),
        shouldLearnFrom: ['Leadership', 'Strategic thinking', 'Advanced technical skills']
      },
      teamImpactAssessment: `${character.name} is positioned to make a significant impact on team development. With ${character.masteredSkills.length} mastered skills, you can serve as a knowledge bridge while continuing to grow. Focus on collaborative learning and knowledge sharing to maximize team potential.`
    };

    const metadata = {
      analysisId: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      model: 'mock-claude-for-development',
      processingTimeMs: 1500
    };

    return { analysis, metadata };
  };

  const analyzeTeamWithAPI = async (): Promise<{ analysis: AITeamAnalysis; metadata: APIAnalysisResponse['metadata'] }> => {
    if (!employee || !skills || !allEmployees) {
      throw new Error('Missing required data for team analysis');
    }

    // Check cache first
    const cacheKey = `team-${employeeId}-${employee.mastered_skills.join(',')}-${useMockData ? 'mock' : 'real'}-${additionalContext}`;
    const cached = analysisCache.current.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Get other team members (excluding current employee)
    const teammates = allEmployees.filter(emp => emp.id !== employeeId);

    // Get skill recommendations for context (required by the API)
    const recommendations = await service.getSkillRecommendations(employeeId);

    // Use mock data for local testing
    if (useMockData) {
      const result = await generateMockAnalysis({
        name: employee.name,
        role: employee.role,
        currentXP: employee.current_xp || 0,
        level: employee.level || 1,
        masteredSkills: employee.mastered_skills
      }, teammates, skills);
      
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
    
    // Prepare request payload matching the API format but with team context
    // We'll encode team information in the context to work around API limitations
    const teamContext = teammates.map(teammate => 
      `${teammate.name} (${teammate.role}): mastered ${teammate.mastered_skills.length} skills including ${teammate.mastered_skills.slice(0, 3).join(', ')}`
    ).join('; ');

    const enhancedAdditionalContext = `
TEAM COLLABORATION FOCUS: ${additionalContext || 'Help me understand how to collaborate effectively with my team.'}

TEAM MEMBERS:
${teamContext}

Please analyze how I can best collaborate with these teammates, who I can help the most, and who I should learn from based on our respective skills and roles.
`.trim();

    const requestPayload = {
      apiKey: requestApiKey, // User-provided Claude API key or 'mock'
      systemPrompt: getSystemPrompt('TEAM_PATH'), // Use centralized team analysis prompt
      character: {
        name: employee.name,
        role: employee.role,
        currentXP: employee.current_xp || 0,
        level: employee.level || 1,
        masteredSkills: employee.mastered_skills
      },
      availableSkills: recommendations.map(rec => rec.skill), // Required by API
      allSkills: skills,
      context: {
        additionalContext: enhancedAdditionalContext,
        goalDefinitions: {
          shortTerm: 'Collaboration opportunities that can be established quickly',
          longTerm: 'Strategic team development initiatives'
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
        
        throw new Error(errorData.error || `Team analysis request failed: ${response.status} ${response.statusText}`);
      }

      const data: APIAnalysisResponse = await response.json();
      
      if (!data.analysis) {
        throw new Error('Invalid response from team analysis service');
      }

      // Convert the standard API response to team analysis format
      // For now, we'll create a simplified team analysis structure from the career analysis response
      const teamAnalysis: AITeamAnalysis = {
        teammateToHelpMost: {
          teammate: teammates[0] || { id: '', name: 'No teammates', role: '', mastered_skills: [], images: {} } as Employee,
          relationship: 'help',
          reasoning: data.analysis.shortTermGoals[0]?.reasoning || 'Based on your current strengths, you can help your teammates develop new skills.',
          sharedSkills: data.analysis.currentStrengths.slice(0, 2),
          complementarySkills: data.analysis.shortTermGoals.map(goal => goal.skill.name).slice(0, 2),
          impact: 'high'
        },
        teammateToLearnFrom: {
          teammate: teammates[1] || teammates[0] || { id: '', name: 'No teammates', role: '', mastered_skills: [], images: {} } as Employee,
          relationship: 'learn_from',
          reasoning: data.analysis.longTermGoals[0]?.reasoning || 'This teammate has skills that would benefit your development.',
          sharedSkills: [],
          complementarySkills: data.analysis.longTermGoals.map(goal => goal.skill.name).slice(0, 3),
          impact: 'high'
        },
        collaborationOpportunities: [
          {
            skillArea: 'Knowledge Sharing',
            description: 'Regular skill-sharing sessions where team members teach each other their specialties',
            participants: [employee, ...teammates.slice(0, 2)],
            benefit: 'Cross-pollination of expertise and stronger team cohesion'
          }
        ],
        skillGapsForTeam: data.analysis.skillGaps.slice(0, 3),
        mentorshipPotential: {
          canMentor: data.analysis.currentStrengths.slice(0, 3),
          shouldLearnFrom: data.analysis.skillGaps.slice(0, 3)
        },
        teamImpactAssessment: data.analysis.overallAssessment
      };

      // Cache the result
      const result = { analysis: teamAnalysis, metadata: data.metadata };
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
      const result = await analyzeTeamWithAPI();
      setAnalysis(result.analysis);
      setAnalysisMetadata(result.metadata);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze team collaboration. Please try again later.';
      setError(errorMessage);
      setAnalysis(null);
      setAnalysisMetadata(null);
    } finally {
      setIsAnalyzing(false);
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

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-green-100 text-green-800 border-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (!employeeId || !employee) {
    return (
      <Card className="border-border/50 shadow-elegant mx-2 sm:mx-4">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            AI Team Path Analysis
          </CardTitle>
          <CardDescription className="text-sm">
            Get AI-powered recommendations for team collaboration and mutual skill development
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6 sm:py-8">
          <Users className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-sm sm:text-base">
            Select an employee to get AI-powered team collaboration recommendations
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-border/50 shadow-elegant mx-2 sm:mx-4 max-w-full bg-gradient-to-br from-green-100/70 via-blue-100/70 to-purple-100/70 ${!isWidgetVisible ? 'min-h-[200px]' : ''}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between w-full gap-2">
          <div className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-green-700 via-blue-700 to-purple-700 bg-clip-text text-transparent flex-1 min-w-0">
          <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-green-600 to-blue-600 shadow-lg flex-shrink-0">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
          </div>
          {employee.images?.face && (
            <div className="relative ring-2 ring-green-200 rounded-lg overflow-hidden flex-shrink-0">
              <img 
                src={employee.images.face} 
                alt={employee.name}
                className="w-10 h-12 sm:w-12 sm:h-14 md:w-14 md:h-18 object-cover shadow-sm"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
            <span className="truncate min-w-0">🤝 AI Team Path Analysis</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsWidgetVisible(!isWidgetVisible)}
            className="flex-shrink-0 px-2 sm:px-3 py-1 hover:bg-green-100 text-xs sm:text-sm font-medium whitespace-nowrap"
          >
            {isWidgetVisible ? 'Hide' : 'Show'}
          </Button>
        </CardTitle>
        <CardDescription className="text-sm text-green-700 font-medium">
          Discover how {employee.name} can collaborate with teammates for mutual skill growth and team success
        </CardDescription>
      </CardHeader>
      {isWidgetVisible && (
        <CardContent className="space-y-4 max-w-full">
        {/* Additional Context Input */}
        <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-100 to-blue-100">
              <Handshake className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <Label htmlFor="team-context" className="text-base font-semibold text-green-800 mb-2 block">
                What are your team collaboration goals?
              </Label>
              <p className="text-sm text-green-700 mb-3">
                Share your thoughts on how you'd like to work with your team, areas where you'd like to help others, or skills you'd like to learn from teammates.
              </p>
              <textarea
                id="team-context"
                placeholder="e.g., I want to mentor junior team members, learn advanced techniques from seniors, focus on knowledge sharing..."
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                className="w-full min-h-[80px] text-sm p-3 border border-green-200 rounded-lg focus:border-green-400 focus:ring-2 focus:ring-green-400 focus:ring-opacity-50 resize-none bg-white"
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
                <strong>Claude API Key Required:</strong> Enter your Anthropic Claude API key to get personalized team collaboration analysis. 
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
          className="w-full bg-gradient-to-r from-green-600 via-green-700 to-blue-600 hover:from-green-700 hover:via-green-800 hover:to-blue-700 text-white font-bold text-lg py-6 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:transform-none"
          size="lg"
        >
          {isAnalyzing ? (
            <>
              <div className="animate-spin h-5 w-5 border-3 border-white border-t-transparent rounded-full mr-3" />
              <span className="animate-pulse">{useMockData ? 'Generating Mock Team Analysis...' : 'Analyzing Team Collaboration...'}</span>
            </>
          ) : (
            <>
              <Users className="h-5 w-5 mr-3 animate-pulse" />
              <span>
                {useMockData 
                  ? 'Get Mock Team Analysis' 
                  : (apiKey.trim() ? '🤝 Analyze Team Collaboration' : '🤝 Get Team Analysis')
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

            {/* Team Impact Assessment */}
            <div className="bg-gradient-to-br from-green-50 via-blue-50 to-green-50 border-2 border-green-300 rounded-xl p-6 shadow-md">
              <h3 className="font-bold text-lg text-green-900 mb-3 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-blue-600">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                🎯 Team Impact Assessment
              </h3>
              <p className="text-base text-green-800 leading-relaxed font-medium">{analysis.teamImpactAssessment}</p>
            </div>

            {/* Teammate Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Teammate to Help Most */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-5 shadow-md">
                <h4 className="font-bold text-lg text-orange-800 flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg bg-orange-100">
                    <UserPlus className="h-5 w-5 text-orange-600" />
                  </div>
                  🤲 Teammate You Can Help Most
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2 bg-white/50 rounded-lg">
                    {analysis.teammateToHelpMost.teammate.images?.face && (
                      <img 
                        src={analysis.teammateToHelpMost.teammate.images.face} 
                        alt={analysis.teammateToHelpMost.teammate.name}
                        className="w-10 h-12 object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    )}
                    <div>
                      <p className="font-semibold text-orange-900">{analysis.teammateToHelpMost.teammate.name}</p>
                      <p className="text-sm text-orange-700">{analysis.teammateToHelpMost.teammate.role}</p>
                    </div>
                    <Badge variant="outline" className={`ml-auto text-xs ${getImpactColor(analysis.teammateToHelpMost.impact)}`}>
                      {analysis.teammateToHelpMost.impact} impact
                    </Badge>
                  </div>
                  <p className="text-sm text-orange-700 italic">{analysis.teammateToHelpMost.reasoning}</p>
                  {analysis.teammateToHelpMost.sharedSkills.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-orange-800">Skills you can share:</p>
                      <div className="flex flex-wrap gap-1">
                        {analysis.teammateToHelpMost.sharedSkills.map((skill, index) => (
                          <Badge key={index} variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Teammate to Learn From */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-5 shadow-md">
                <h4 className="font-bold text-lg text-blue-800 flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg bg-blue-100">
                    <Heart className="h-5 w-5 text-blue-600" />
                  </div>
                  📚 Teammate to Learn From
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2 bg-white/50 rounded-lg">
                    {analysis.teammateToLearnFrom.teammate.images?.face && (
                      <img 
                        src={analysis.teammateToLearnFrom.teammate.images.face} 
                        alt={analysis.teammateToLearnFrom.teammate.name}
                        className="w-10 h-12 object-cover rounded-lg"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    )}
                    <div>
                      <p className="font-semibold text-blue-900">{analysis.teammateToLearnFrom.teammate.name}</p>
                      <p className="text-sm text-blue-700">{analysis.teammateToLearnFrom.teammate.role}</p>
                    </div>
                    <Badge variant="outline" className={`ml-auto text-xs ${getImpactColor(analysis.teammateToLearnFrom.impact)}`}>
                      {analysis.teammateToLearnFrom.impact} impact
                    </Badge>
                  </div>
                  <p className="text-sm text-blue-700 italic">{analysis.teammateToLearnFrom.reasoning}</p>
                  {analysis.teammateToLearnFrom.complementarySkills.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-blue-800">Skills they can teach:</p>
                      <div className="flex flex-wrap gap-1">
                        {analysis.teammateToLearnFrom.complementarySkills.map((skill, index) => (
                          <Badge key={index} variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Collaboration Opportunities */}
            {analysis.collaborationOpportunities.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-bold text-lg text-purple-800 flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-purple-100">
                    <ArrowRightLeft className="h-5 w-5 text-purple-600" />
                  </div>
                  🤝 Collaboration Opportunities
                </h4>
                <div className="space-y-2">
                  {analysis.collaborationOpportunities.map((opportunity, index) => (
                    <div 
                      key={index}
                      className="p-3 bg-purple-50/50 border border-purple-200 rounded-lg"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1 rounded bg-purple-100">
                          <Handshake className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="font-medium text-sm">{opportunity.skillArea}</span>
                      </div>
                      <p className="text-xs text-purple-600 mb-2">{opportunity.description}</p>
                      <p className="text-xs text-purple-700 italic font-medium">✨ {opportunity.benefit}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mentorship Potential */}
            {(analysis.mentorshipPotential.canMentor.length > 0 || analysis.mentorshipPotential.shouldLearnFrom.length > 0) && (
              <div className="space-y-3">
                <h4 className="font-bold text-lg text-teal-800 flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-teal-100">
                    <Award className="h-5 w-5 text-teal-600" />
                  </div>
                  🏆 Mentorship Potential
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysis.mentorshipPotential.canMentor.length > 0 && (
                    <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-teal-800 mb-2">Areas where you can mentor:</p>
                      <div className="flex flex-wrap gap-1">
                        {analysis.mentorshipPotential.canMentor.map((skill, index) => (
                          <Badge key={index} variant="outline" className="bg-teal-100 text-teal-700 border-teal-300 text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {analysis.mentorshipPotential.shouldLearnFrom.length > 0 && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-indigo-800 mb-2">Areas to seek mentorship:</p>
                      <div className="flex flex-wrap gap-1">
                        {analysis.mentorshipPotential.shouldLearnFrom.map((skill, index) => (
                          <Badge key={index} variant="outline" className="bg-indigo-100 text-indigo-700 border-indigo-300 text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Team Skill Gaps */}
            {analysis.skillGapsForTeam.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-bold text-lg text-red-800 flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-red-100">
                    <Target className="h-5 w-5 text-red-600" />
                  </div>
                  🎯 Team Skill Gaps
                </h4>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700 mb-2">Skills the team could benefit from developing:</p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.skillGapsForTeam.map((gap, index) => (
                      <Badge key={index} variant="outline" className="bg-red-100 text-red-700 border-red-300 text-xs">
                        {gap}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        </CardContent>
      )}
    </Card>
  );
};

export default AITeamPathWidget;