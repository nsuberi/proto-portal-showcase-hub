import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { sharedEnhancedService } from '../services/sharedService'
import TechSkillsService from '../services/techSkillsData'

// Create instances of both services
const ffxSkillService = sharedEnhancedService
const techSkillService = new TechSkillsService()
import { useState, useRef, useEffect, useMemo } from 'react'
import { useEmployeeGoals } from '../hooks/useEmployeeGoals'
import { Sword, Zap, Heart, Star, Crown, Filter, Users, HelpCircle, X, Sparkles, Code, Settings, Plus, Calendar, Key, Eye, EyeOff, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Sigma from 'sigma';
import Graph from 'graphology';
import { NodeBorderProgram } from '@sigma/node-border';
import { getEnhancedGraphNodes, getEnhancedGraphEdges } from './EnhancedSkillMap.utils';
import SkillRecommendationWidget, { SkillRecommendationWidgetRef } from '../components/SkillRecommendationWidget';
import SkillGoalWidget from '../components/SkillGoalWidget';
import TeamCollaborationWidget from '../components/TeamCollaborationWidget';
import UnifiedTeamWidget, { getHeroVideoSrc } from '../components/UnifiedTeamWidget';
import { calculateGoalPath } from '../utils/goalPathUtils';
import { Employee } from '../types';

// Convert HSL to hex for Sigma.js compatibility
const hslToHex = (h: number, s: number, l: number): string => {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

// Convert design system HSL values to hex for Sigma.js
const FFX_CATEGORY_COLORS = {
  combat: hslToHex(0, 84.2, 60.2),     // Red: #f95454
  magic: hslToHex(213, 94, 68),        // Blue: #429bff  
  support: hslToHex(142, 76, 36),      // Green: #16a34a
  special: hslToHex(263, 70, 60),      // Purple: #8b5cf6
  advanced: hslToHex(48, 96, 53),      // Yellow: #facc15
  default: hslToHex(240, 5, 64.9),     // Gray: #a1a1aa
};

const TECH_CATEGORY_COLORS = {
  engineering: hslToHex(213, 94, 68),   // Blue: #429bff
  platform: hslToHex(142, 76, 36),     // Green: #16a34a
  product: hslToHex(263, 70, 60),      // Purple: #8b5cf6
  communication: hslToHex(35, 91, 55), // Orange: #f97316
  process: hslToHex(193, 95, 68),      // Cyan: #22d3ee
  leadership: hslToHex(48, 96, 53),    // Yellow: #facc15
  default: hslToHex(240, 5, 64.9),     // Gray: #a1a1aa
};

function SigmaGraph({ skills, connections, masteredSkills, selectedEmployeeId, goalPath, goalSkillId, onNodeClick, categoryColors }: {
  skills: any[],
  connections: any[],
  masteredSkills: string[],
  selectedEmployeeId: string,
  goalPath?: string[],
  goalSkillId?: string,
  onNodeClick?: (skill: any) => void,
  categoryColors: Record<string, string>
}) {
  const sigmaContainerRef = useRef<HTMLDivElement>(null);
  const sigmaInstanceRef = useRef<Sigma | null>(null);
  
  // Initialize Sigma instance once
  useEffect(() => {
    if (!sigmaContainerRef.current) return;
    
    const graph = new Graph();
    const renderer = new Sigma(graph, sigmaContainerRef.current, {
      renderEdgeLabels: false,
      labelRenderedSizeThreshold: 15, // Higher threshold to hide most labels
      labelDensity: 1, // Standard label density
      // Performance optimizations
      enableEdgeEvents: false,
      hideEdgesOnMove: true,
      hideLabelsOnMove: true, // Re-enable hiding labels on move
      allowInvalidContainer: false,
      // Use NodeBorderProgram for mastered skills
      nodeProgramClasses: {
        border: NodeBorderProgram,
      },
      nodeReducer: (node: string, data: any) => {
        // Handle transparency by converting hex to rgba when needed
        const hexToRgba = (hex: string, alpha: number) => {
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };
        
        let color = data.color;
        let labelSize = data.labelSize || 12;
        let labelColor = data.labelColor || '#2C3E50';
        let labelWeight = data.labelWeight || 'normal';
        
        // Enhanced styling for mastered skills
        if (data.isMastered) {
          labelSize = 18; // Larger labels for mastered skills to ensure visibility
          labelColor = '#1A1A1A'; // Darker text for better contrast
          labelWeight = 'bold'; // Bold text for mastered skills
          color = data.color; // Keep original vibrant color
        } else if (data.isGoalNode && data.hasEmployeeSelected) {
          // Goal node - halfway opacity between mastered (1.0) and unmastered (0.6)
          color = hexToRgba(data.color, 0.8);
          labelColor = '#000000'; // Solid black for maximum visibility
          labelSize = 24; // Extra large for maximum prominence (since bold isn't supported per-node)
          labelWeight = 'normal'; // Sigma.js doesn't support per-node bold
        } else if (data.hasEmployeeSelected && !data.isMastered) {
          // Employee doesn't have this skill - make it translucent
          color = hexToRgba(data.color, 0.6);
          labelColor = hexToRgba('#2C3E50', 0.7); // Fade the label as well
        }
        
        return {
          ...data,
          label: data.label,
          color: color,
          // Make mastered skills bigger, goal nodes even bigger to enhance border visibility
          size: data.isGoalNode && !data.isMastered ? data.size * 1.5 : (data.isMastered ? data.size * 1.3 : data.size),
          zIndex: data.isMastered ? 3 : (data.zIndex || 1), // Higher z-index for mastered skills
          // Keep the node type as set in the data (border for mastered, circle for others)
          type: data.type,
          labelSize: labelSize,
          labelColor: labelColor,
          // Ensure border properties are preserved
          borderColor: data.borderColor,
          borderWidth: data.borderWidth,
          // Force label visibility for mastered skills
          forceLabel: data.isMastered,
        };
      },
      // Add hover effects
      nodeHoverReducer: (node: string, data: any) => {
        const hexToRgba = (hex: string, alpha: number) => {
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };
        
        let borderColor = null;
        let borderWidth = 0;
        
        if (data.hasEmployeeSelected && data.isMastered) {
          // On hover, make border 100% opacity
          borderColor = data.color;
          borderWidth = 3;
        } else if (data.isGoalNode && !data.isMastered) {
          // Unmastered goal node gets extra thick black border
          borderColor = '#000000';
          borderWidth = 10;
        } else if (data.isOnGoalPath) {
          // Goal path skills get black border to stand out
          borderColor = '#000000';
          borderWidth = 2;
        }
        
        return {
          ...data,
          borderColor: borderColor,
          borderWidth: borderWidth,
        };
      },
    });
    
    sigmaInstanceRef.current = renderer;
    
    return () => {
      if (sigmaInstanceRef.current) {
        sigmaInstanceRef.current.kill();
        sigmaInstanceRef.current = null;
      }
    };
  }, []); // Only run once on mount
  
  // Update click handler when skills or onNodeClick changes
  useEffect(() => {
    if (!sigmaInstanceRef.current) return;
    
    const renderer = sigmaInstanceRef.current;
    
    // Remove all existing click listeners to avoid duplicates
    renderer.removeAllListeners('clickNode');
    
    // Add fresh click handler with current skills and onNodeClick
    renderer.on('clickNode', (event) => {
      const skillId = event.node;
      const skill = skills?.find(s => s.id === skillId);
      if (skill && onNodeClick) {
        onNodeClick(skill);
      }
    });
  }, [skills, onNodeClick]); // Update when skills or onNodeClick changes
  
  // Memoize expensive graph computations
  const memoizedNodes = useMemo(() => {
    if (!skills) return [];
    const pathSet = new Set(goalPath || []);
    return getEnhancedGraphNodes(skills, masteredSkills, categoryColors, pathSet, goalSkillId);
  }, [skills, masteredSkills, goalPath, goalSkillId, categoryColors]);

  const memoizedEdges = useMemo(() => {
    if (!connections) return [];
    return getEnhancedGraphEdges(connections);
  }, [connections]);

  // Update graph data when dependencies change
  useEffect(() => {
    if (!skills || !connections || !sigmaInstanceRef.current) return;
    
    const graph = sigmaInstanceRef.current.getGraph();
    
    // Performance optimization: batch graph operations
    try {
      // Clear existing graph
      graph.clear();
      
      // Use memoized nodes for better performance
      const nodes = memoizedNodes;
      
      // Batch add nodes for better performance
      if (nodes.length > 0) {
        graph.import({
          nodes: nodes.map(node => ({ key: node.id, attributes: node })),
          edges: []
        });
      }
      
      // Add edges with enhanced styling
      const edges = memoizedEdges;
      edges.forEach(edge => {
        try {
          if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
            graph.addEdge(edge.source, edge.target, {
              size: edge.size || 1,
              color: edge.color || '#95A5A6',
              type: 'line' // Use standard edge type
            });
          }
        } catch (edgeError) {
          console.warn(`Failed to add edge ${edge.source} -> ${edge.target}:`, edgeError);
        }
      });
      
      // Refresh the rendering with performance optimizations
      if (sigmaInstanceRef.current && graph.order > 0) {
        // Use requestAnimationFrame for smooth rendering
        requestAnimationFrame(() => {
          if (sigmaInstanceRef.current) {
            sigmaInstanceRef.current.refresh();
          }
        });
      }
    } catch (error) {
      console.error('Error updating graph:', error);
    }
  }, [memoizedNodes, memoizedEdges, selectedEmployeeId]);
  
  return (
    <div
      ref={sigmaContainerRef}
      className="w-full h-[400px] sm:h-[500px] md:h-[600px] border border-border/50 mb-6 rounded-lg shadow-md bg-gradient-to-br from-background via-card to-background/95 mx-2 sm:mx-4"
      data-testid="sigma-graph"
      style={{
        background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.05) 0%, rgba(0, 0, 0, 0.02) 50%, rgba(139, 69, 19, 0.03) 100%)'
      }}
    />
  );
}

export { SigmaGraph };

const SkillMap = ({ showInstructions, setShowInstructions }: { showInstructions: boolean, setShowInstructions: (show: boolean) => void }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [selectedSkill, setSelectedSkill] = useState<any>(null)
  const [dataSource, setDataSource] = useState<'ffx' | 'tech'>('tech') // Default to tech skills
  const [showTutorial, setShowTutorial] = useState(() => {
    // Show tutorial on first visit
    return !localStorage.getItem('skillMapTutorialSeen')
  })
  const [selectedMentor, setSelectedMentor] = useState<Employee | null>(null)
  const [selectedMentee, setSelectedMentee] = useState<Employee | null>(null)
  const [mentorMeetingDate, setMentorMeetingDate] = useState<Date | null>(null)
  const [menteeMeetingDate, setMenteeMeetingDate] = useState<Date | null>(null)
  const [showMentorCalendar, setShowMentorCalendar] = useState(false)
  const [showMenteeCalendar, setShowMenteeCalendar] = useState(false)
  const [teamGoal, setTeamGoal] = useState('')
  const [personalGrowthGoal, setPersonalGrowthGoal] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [isLoadingInsights, setIsLoadingInsights] = useState(false)
  const [insightsResponse, setInsightsResponse] = useState('')
  const [insightsError, setInsightsError] = useState<string | null>(null)

  // Use external goal manager
  const { currentGoal, isLoading: goalLoading, setGoal, clearGoal, loadGoal, updatePath, deleteGoalForEmployee } = useEmployeeGoals()

  // Debug current goal state
  useEffect(() => {
    console.log('🎯 SkillMap: Current goal state changed:', currentGoal);
  }, [currentGoal]);
  const skillGoalRef = useRef<HTMLDivElement>(null)
  const skillRecommendationRef = useRef<HTMLDivElement>(null)
  const skillRecommendationWidgetRef = useRef<SkillRecommendationWidgetRef>(null)
  const queryClient = useQueryClient()

  // Get the current service and colors based on data source selection
  const currentService = dataSource === 'ffx' ? ffxSkillService : techSkillService
  const CATEGORY_COLORS = dataSource === 'ffx' ? FFX_CATEGORY_COLORS : TECH_CATEGORY_COLORS


  const { data: skills, isLoading } = useQuery({
    queryKey: [`${dataSource}-skills`],
    queryFn: () => currentService.getAllSkills(),
  })

  const { data: connections } = useQuery({
    queryKey: [`${dataSource}-connections`],
    queryFn: () => currentService.getSkillConnections(),
  })

  const { data: employees } = useQuery({
    queryKey: [`${dataSource}-employees`],
    queryFn: () => currentService.getAllEmployees(),
  })

  // Load goal when employee, dataSource, or skills change
  useEffect(() => {
    console.log('🔄 SkillMap: Employee/DataSource/Skills changed:', {
      selectedEmployeeId,
      dataSource,
      skillsLength: skills?.length || 0,
      isLoading,
      skillsExists: !!skills
    });
    
    if (selectedEmployeeId && skills && skills.length > 0 && !isLoading) {
      console.log('🚀 SkillMap: Loading goal for employee:', selectedEmployeeId);
      loadGoal(selectedEmployeeId, dataSource, skills);
    } else {
      console.log('🧹 SkillMap: Clearing goal - conditions not met:', {
        hasEmployeeId: !!selectedEmployeeId,
        hasSkills: !!skills,
        skillsLength: skills?.length || 0,
        isLoading
      });
      if (!isLoading) {
        clearGoal();
      }
    }
    
    // Clear mentor/mentee selections and meeting dates when employee changes
    setSelectedMentor(null);
    setSelectedMentee(null);
    setMentorMeetingDate(null);
    setMenteeMeetingDate(null);
    setInsightsResponse('');
    setInsightsError(null);
  }, [selectedEmployeeId, dataSource, skills, isLoading, loadGoal, clearGoal]);

  // Load team goal from localStorage
  useEffect(() => {
    const storageKey = `team-goal-${dataSource}`;
    const savedGoal = localStorage.getItem(storageKey);
    if (savedGoal) {
      setTeamGoal(savedGoal);
    } else {
      setTeamGoal('Working together to achieve excellence and master new skills');
    }
  }, [dataSource]);

  // Load personal growth goal for current employee from localStorage
  useEffect(() => {
    if (selectedEmployeeId) {
      const storageKey = `personal-growth-goal-${dataSource}-${selectedEmployeeId}`;
      const savedGoal = localStorage.getItem(storageKey);
      setPersonalGrowthGoal(savedGoal || '');
    } else {
      setPersonalGrowthGoal('');
    }
  }, [selectedEmployeeId, dataSource]);

  // Save personal growth goal to localStorage when it changes
  useEffect(() => {
    if (selectedEmployeeId && personalGrowthGoal !== undefined) {
      const storageKey = `personal-growth-goal-${dataSource}-${selectedEmployeeId}`;
      if (personalGrowthGoal.trim()) {
        localStorage.setItem(storageKey, personalGrowthGoal);
      } else {
        localStorage.removeItem(storageKey);
      }
    }
  }, [personalGrowthGoal, selectedEmployeeId, dataSource]);

  // Get API URL
  const getApiUrl = () => {
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    
    if (import.meta.env.DEV || typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return 'http://localhost:3003';
    }
    
    return 'PLACEHOLDER_API_GATEWAY_URL';
  };

  // Handle AI insights request
  const handleGetInsights = async () => {
    if (!teamGoal.trim()) {
      setInsightsError('Team goal is required.');
      return;
    }

    setIsLoadingInsights(true);
    setInsightsError(null);
    setInsightsResponse('');

    try {
      let requestApiKey = apiKey.trim();
      if (!requestApiKey && import.meta.env.DEV) {
        requestApiKey = 'mock';
      }

      if (!requestApiKey) {
        throw new Error('Claude API Key is required. In development mode, you can leave this empty to use mock data.');
      }

      if (requestApiKey !== 'mock' && !requestApiKey.startsWith('sk-ant-api')) {
        throw new Error('Invalid API key format. API keys should start with "sk-ant-api".');
      }

      // Build team skills mapping
      const teamSkillsMap = employees?.map(teammate => ({
        employeeId: teammate.id,
        employeeName: teammate.name,
        role: teammate.role,
        masteredSkills: teammate.mastered_skills?.map(skillId => {
          const skill = skills?.find(s => s.id === skillId);
          return skill ? skill.name : skillId;
        }) || []
      })) || [];

      // Build skill descriptions
      const skillDescriptions = skills?.reduce((acc, skill) => {
        acc[skill.name] = skill.description;
        return acc;
      }, {} as Record<string, string>) || {};

      // Ensure personal growth goal is always included in the prompt
      const effectivePersonalGrowthGoal = personalGrowthGoal.trim() || "general professional development and skill improvement";

      const systemPrompt = `You are an AI assistant helping ${selectedEmployee?.name} (${selectedEmployee?.role}) identify which skills would be most helpful for their team to achieve "${teamGoal}".

Current team composition and skills:
${JSON.stringify(teamSkillsMap, null, 2)}

Available skills and descriptions:
${JSON.stringify(skillDescriptions, null, 2)}

The employee's personal growth goal is: "${effectivePersonalGrowthGoal}"

IMPORTANT: You must consider and reference the employee's personal growth goal ("${effectivePersonalGrowthGoal}") in your recommendations, even if it seems unconventional or silly. Find creative ways to connect it to skill development and team collaboration.

Please provide your response in the following format:

## RECOMMENDED SKILLS
List 3-5 skills that would:
1. Help the team achieve their goal: "${teamGoal}"
2. Align with or creatively connect to the employee's personal growth interests: "${effectivePersonalGrowthGoal}"
3. Build on their existing skills: ${selectedEmployee?.mastered_skills?.map(id => skills?.find(s => s.id === id)?.name).filter(Boolean).join(', ')}

For each skill, format as:
**[SKILL_NAME]**
- Why it's important for the team goal: "${teamGoal}"
- How it connects to their personal growth goal: "${effectivePersonalGrowthGoal}"
- How it builds on their existing skills
- Which team members they should collaborate with to learn it

## MENTORSHIP RECOMMENDATIONS

**LEARN FROM:** [Team member name]
One brief sentence explaining why this person would be a good mentor for ${selectedEmployee?.name}, considering both the team goal and their personal growth interest in "${effectivePersonalGrowthGoal}".

**MENTOR:** [Team member name]  
One brief sentence explaining why ${selectedEmployee?.name} would be a good mentor for this person, potentially drawing on insights from their personal growth focus on "${effectivePersonalGrowthGoal}".

IMPORTANT: 
- Use exact skill names from the available skills list for the RECOMMENDED SKILLS section
- Always reference the personal growth goal ("${effectivePersonalGrowthGoal}") in your recommendations
- Keep mentorship descriptions to ONE sentence each
- Be creative in connecting unconventional personal goals to professional skill development
- Do not include additional sections or recommendations beyond what is requested`;

      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/v1/ai-analysis/just-in-time`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: requestApiKey,
          character: {
            name: selectedEmployee?.name,
            role: selectedEmployee?.role,
            currentXP: selectedEmployee?.current_xp || 0,
            level: selectedEmployee?.level || 1,
            masteredSkills: selectedEmployee?.mastered_skills || []
          },
          allSkills: skills || [],
          teammates: employees?.filter(t => t.id !== selectedEmployee?.id) || [],
          widgetSystemPrompt: 'You are an AI assistant helping with team collaboration and skill development.',
          userSystemPrompt: systemPrompt,
          justInTimeQuestion: `Team Goal: ${teamGoal}\nPersonal Growth Interest: ${effectivePersonalGrowthGoal}`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setInsightsResponse(data.response || 'No response generated.');
      
    } catch (err) {
      console.error('AI insights request failed:', err);
      setInsightsError(err instanceof Error ? err.message : 'Failed to get AI insights');
    } finally {
      setIsLoadingInsights(false);
    }
  };

  // Find selected employee's mastered skills
  const selectedEmployee = employees?.find(emp => emp.id === selectedEmployeeId)
  const masteredSkills = selectedEmployee?.mastered_skills || []


  // Always call hooks before any early returns - Rules of Hooks

  // Early returns after all hooks are called
  if (isLoading || !skills || !connections) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-lg text-muted-foreground">Loading Expert Sphere Grid...</div>
          <div className="text-sm text-muted-foreground mt-2">Initializing complex network structure</div>
        </div>
      </div>
    )
  }

  if (skills.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-lg text-muted-foreground">No skills data available</div>
          <div className="text-sm text-muted-foreground mt-2">Please check the data service connection</div>
        </div>
      </div>
    )
  }

  const getCategoryIcon = (category: string) => {
    if (dataSource === 'ffx') {
      switch (category) {
        case 'combat':
          return <Sword className="h-4 w-4" />
        case 'magic':
          return <Zap className="h-4 w-4" />
        case 'support':
          return <Heart className="h-4 w-4" />
        case 'special':
          return <Star className="h-4 w-4" />
        case 'advanced':
          return <Crown className="h-4 w-4" />
        default:
          return <Sword className="h-4 w-4" />
      }
    } else {
      switch (category) {
        case 'engineering':
          return <Code className="h-4 w-4" />
        case 'platform':
          return <Settings className="h-4 w-4" />
        case 'product':
          return <Star className="h-4 w-4" />
        case 'communication':
          return <Users className="h-4 w-4" />
        case 'process':
          return <Filter className="h-4 w-4" />
        case 'leadership':
          return <Crown className="h-4 w-4" />
        default:
          return <Code className="h-4 w-4" />
      }
    }
  }

  const getCategoryColor = (category: string) => {
    if (dataSource === 'ffx') {
      switch (category) {
        case 'combat':
          return 'bg-red-100 text-red-800 border-red-300'
        case 'magic':
          return 'bg-blue-100 text-blue-800 border-blue-300'
        case 'support':
          return 'bg-green-100 text-green-800 border-green-300'
        case 'special':
          return 'bg-purple-100 text-purple-800 border-purple-300'
        case 'advanced':
          return 'bg-yellow-100 text-yellow-800 border-yellow-300'
        default:
          return 'bg-gray-100 text-gray-800 border-gray-300'
      }
    } else {
      switch (category) {
        case 'engineering':
          return 'bg-blue-100 text-blue-800 border-blue-300'
        case 'platform':
          return 'bg-green-100 text-green-800 border-green-300'
        case 'product':
          return 'bg-purple-100 text-purple-800 border-purple-300'
        case 'communication':
          return 'bg-orange-100 text-orange-800 border-orange-300'
        case 'process':
          return 'bg-cyan-100 text-cyan-800 border-cyan-300'
        case 'leadership':
          return 'bg-yellow-100 text-yellow-800 border-yellow-300'
        default:
          return 'bg-gray-100 text-gray-800 border-gray-300'
      }
    }
  }


  const getPrerequisites = (skillId: string) => {
    return connections?.filter(conn => conn.to === skillId).map(conn => conn.from) || []
  }

  const getDependents = (skillId: string) => {
    return connections?.filter(conn => conn.from === skillId).map(conn => conn.to) || []
  }


  const getCategoryInfo = (category: string) => {
    if (dataSource === 'ffx') {
      switch (category) {
        case 'combat':
          return {
            icon: <Sword className="h-5 w-5" />,
            title: 'Combat',
            description: 'Physical and tactical abilities for direct confrontation and battlefield strategy.'
          }
        case 'magic':
          return {
            icon: <Zap className="h-5 w-5" />,
            title: 'Magic',
            description: 'Elemental and arcane spells for damage and utility.'
          }
        case 'support':
          return {
            icon: <Heart className="h-5 w-5" />,
            title: 'Support',
            description: 'Healing and buffing abilities to aid allies.'
          }
        case 'special':
          return {
            icon: <Star className="h-5 w-5" />,
            title: 'Special',
            description: 'Unique utility abilities with specialized effects.'
          }
        case 'advanced':
          return {
            icon: <Crown className="h-5 w-5" />,
            title: 'Advanced',
            description: 'High-level master abilities requiring significant expertise.'
          }
        default:
          return {
            icon: <Sword className="h-5 w-5" />,
            title: 'Unknown',
            description: 'Category information not available.'
          }
      }
    } else {
      switch (category) {
        case 'engineering':
          return {
            icon: <Code className="h-5 w-5" />,
            title: 'Engineering',
            description: 'Technical implementation skills including coding, system design, and architecture.'
          }
        case 'platform':
          return {
            icon: <Settings className="h-5 w-5" />,
            title: 'Platform',
            description: 'DevOps, infrastructure, and deployment automation skills.'
          }
        case 'product':
          return {
            icon: <Star className="h-5 w-5" />,
            title: 'Product',
            description: 'Product management, user research, and business strategy skills.'
          }
        case 'communication':
          return {
            icon: <Users className="h-5 w-5" />,
            title: 'Communication',
            description: 'Interpersonal skills, collaboration, and stakeholder management.'
          }
        case 'process':
          return {
            icon: <Filter className="h-5 w-5" />,
            title: 'Process',
            description: 'Project management, agile methodologies, and organizational skills.'
          }
        case 'leadership':
          return {
            icon: <Crown className="h-5 w-5" />,
            title: 'Leadership',
            description: 'Executive presence, strategic thinking, and organizational leadership.'
          }
        default:
          return {
            icon: <Code className="h-5 w-5" />,
            title: 'Unknown',
            description: 'Category information not available.'
          }
      }
    }
  }

  const handleTutorialComplete = () => {
    setShowTutorial(false)
    localStorage.setItem('skillMapTutorialSeen', 'true')
  }

  const handleNodeClick = (skill: any) => {
    setSelectedSkill(skill)
  }

  const handleSetGoal = () => {
    if (selectedSkill && selectedEmployeeId) {
      const selectedEmployee = employees?.find(emp => emp.id === selectedEmployeeId);
      if (!selectedEmployee) return;
      
      // Calculate goal path using shared utility function
      const goalPath = calculateGoalPath(selectedSkill, selectedEmployee, currentService);
      
      // Set the goal using the external manager
      const goalToSet = {
        skill: selectedSkill,
        path: goalPath,
        employeeId: selectedEmployeeId,
        dataSource
      };
      console.log('🎯 SkillMap: Setting goal from handleSetGoal with path:', goalToSet);
      setGoal(goalToSet);
      queryClient.invalidateQueries({ queryKey: ['skill-recommendations'], exact: false })
      setSelectedSkill(null)
      
      // Scroll to the goal section after a brief delay to allow state to update
      setTimeout(() => {
        if (skillGoalRef.current) {
          skillGoalRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          })
        }
      }, 100)
    }
  }

  const handleLearnNewSkills = () => {
    // Expand the recommendations widget directly
    if (skillRecommendationWidgetRef.current) {
      skillRecommendationWidgetRef.current.expand()
    }
    
    // Scroll to the recommendations section
    setTimeout(() => {
      if (skillRecommendationRef.current) {
        skillRecommendationRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        })
      }
    }, 100)
  }

  const handleGoalCompleted = () => {
    // Scroll back to the Skill Goal widget to show completion
    setTimeout(() => {
      if (skillGoalRef.current) {
        skillGoalRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        })
      }
    }, 500) // Delay to allow completion animation to start
  }

  return (
    <>
      {/* Tutorial Overlay */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 animate-in fade-in zoom-in duration-300">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Welcome to the Map of Mastery!</h2>
              </div>
              <div className="space-y-3 text-sm text-gray-600 mb-6">
                <p className="font-medium text-gray-800">
                  Visualize employee expertise through an interactive skill network and guide their professional development.
                </p>
                <div className="space-y-2">
                  <p><strong className="text-blue-600">1. Select an employee</strong> from the dropdown to view their current skills and expertise</p>
                  <p><strong className="text-purple-600">2. Set a learning goal</strong> using the Goal Planner - choose what skill they should work toward next</p>
                  <p><strong className="text-green-600">3. Invest in recommended skills</strong> from the Next Steps section to progress toward your goal</p>
                  <p><strong className="text-orange-600">4. Track your progress</strong> on the interactive skill network as you build expertise</p>
                  <p><strong className="text-teal-600">5. Work with your team</strong> to make magic happen - prioritize skills your teammates need help with, and lean on them to do the same for you</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleTutorialComplete}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Let's Go!
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowTutorial(false)}
                  className="px-3"
                >
                  Skip
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-blue-600" />
                How to Use the Map of Mastery
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInstructions(false)}
                className="p-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <div className="bg-blue-100 p-1 rounded-full flex-shrink-0 mt-0.5">
                    <span className="block w-2 h-2 bg-blue-600 rounded-full"></span>
                  </div>
                  <div>
                    <p><strong className="text-blue-600">Select an employee</strong></p>
                    <p className="text-gray-600">Choose from the dropdown to view their current skills and expertise</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="bg-purple-100 p-1 rounded-full flex-shrink-0 mt-0.5">
                    <span className="block w-2 h-2 bg-purple-600 rounded-full"></span>
                  </div>
                  <div>
                    <p><strong className="text-purple-600">Set a learning goal</strong></p>
                    <p className="text-gray-600">Use the Goal Planner to choose what skill they should work toward next</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="bg-green-100 p-1 rounded-full flex-shrink-0 mt-0.5">
                    <span className="block w-2 h-2 bg-green-600 rounded-full"></span>
                  </div>
                  <div>
                    <p><strong className="text-green-600">Invest in recommended skills</strong></p>
                    <p className="text-gray-600">Progress toward your goal using the Next Steps section</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="bg-orange-100 p-1 rounded-full flex-shrink-0 mt-0.5">
                    <span className="block w-2 h-2 bg-orange-600 rounded-full"></span>
                  </div>
                  <div>
                    <p><strong className="text-orange-600">Track your progress</strong></p>
                    <p className="text-gray-600">Monitor advancement on the interactive skill network</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="bg-teal-100 p-1 rounded-full flex-shrink-0 mt-0.5">
                    <span className="block w-2 h-2 bg-teal-600 rounded-full"></span>
                  </div>
                  <div>
                    <p><strong className="text-teal-600">Work with your team</strong></p>
                    <p className="text-gray-600">Make magic happen - prioritize skills your teammates need help with, and lean on them to do the same for you</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Skill Node Click Modal */}
      {selectedSkill && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-in fade-in zoom-in duration-300">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-full ${getCategoryColor(selectedSkill.category)}`}>
                  {getCategoryIcon(selectedSkill.category)}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 truncate">{selectedSkill.name}</h2>
                  <p className="text-sm text-gray-600">Level {selectedSkill.level} • {selectedSkill.category}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-3">{selectedSkill.description}</p>
                
                {selectedEmployeeId && (
                  <div className="flex items-center gap-2 text-xs">
                    {masteredSkills.includes(selectedSkill.id) ? (
                      <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                        <span>Mastered by {selectedEmployee?.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-gray-600">
                        <span>Not yet mastered by {selectedEmployee?.name}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex gap-3">
                {selectedEmployeeId && !masteredSkills.includes(selectedSkill.id) && (
                  <Button
                    onClick={handleSetGoal}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Set as Goal
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setSelectedSkill(null)}
                  className={selectedEmployeeId && !masteredSkills.includes(selectedSkill.id) ? "px-3" : "flex-1"}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section with Video Background */}
      <section className="relative mb-8 overflow-hidden -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 xl:-mx-16">
        {/* Hero Video Background */}
        <div className="absolute inset-0 w-screen left-1/2 transform -translate-x-1/2">
          <video
            key={getHeroVideoSrc(dataSource)}
            className="absolute inset-0 w-full h-full object-cover opacity-45"
            style={{ width: '100vw' }}
            autoPlay
            muted
            loop
            playsInline
            webkit-playsinline="true"
            preload="auto"
          >
            <source src={getHeroVideoSrc(dataSource)} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/20 to-background/30" />
        </div>

        {/* Header with Title and Intro */}
        <div className="relative z-10 pt-12 pb-8 text-center px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="bg-background/20 backdrop-blur-sm rounded-lg px-6 py-8 mb-8 max-w-4xl mx-auto">
            <div className="mb-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center drop-shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, hsl(263, 70%, 30%), hsl(263, 70%, 75%), hsl(263, 70%, 30%))',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    color: 'transparent'
                  }}>
                Map of Mastery
              </h1>
            </div>
            <p className="text-sm sm:text-base md:text-lg text-foreground/90 max-w-3xl mx-auto drop-shadow-md">
              Navigate the adventure of work with your team.<br />Level up and master skills to take on the world, together.
            </p>
          </div>
        </div>

        {/* Unified Team Widget - Team Selection, Goal, and Member Headshots */}
        <div className="relative z-10 pb-8 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <UnifiedTeamWidget
            dataSource={dataSource}
            employees={employees || []}
            selectedEmployeeId={selectedEmployeeId}
            onDataSourceChange={setDataSource}
            onEmployeeSelect={(employeeId) => {
              console.log('👤 SkillMap: Employee selected from unified widget:', employeeId);
              setSelectedEmployeeId(employeeId);
            }}
            queryClient={queryClient}
            clearGoal={clearGoal}
            setSelectedSkill={setSelectedSkill}
            currentService={currentService}
          />
        </div>
      </section>


      {/* Skill Types Legend */}
      <div className="mb-6 md:mb-8 relative mx-4">
        <div className="bg-white/60 backdrop-blur-sm border border-border/50 rounded-lg p-3 md:p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-center mb-3 text-gray-700">Skill Types</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:justify-center gap-2 md:gap-4">
            {Object.entries(CATEGORY_COLORS).filter(([k]) => k !== 'default').map(([cat, color]) => {
              const categoryInfo = getCategoryInfo(cat);
              return (
                <div 
                  key={cat} 
                  className="relative flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors min-w-0"
                  onMouseEnter={() => setHoveredCategory(cat)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <span 
                    className="inline-block w-3 h-3 md:w-4 md:h-4 rounded-full border border-border flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="capitalize text-xs md:text-sm truncate">{cat}</span>
                  
                  {/* Tooltip */}
                  {hoveredCategory === cat && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 md:w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <span style={{ color: color }}>
                          {categoryInfo.icon}
                        </span>
                        <h4 className="font-semibold text-sm">{categoryInfo.title}</h4>
                      </div>
                      <p className="text-xs text-gray-600">{categoryInfo.description}</p>
                      {/* Arrow */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-white"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sigma.js visualization container */}
      <div className="mb-8">
        <SigmaGraph
          skills={skills}
          connections={connections}
          masteredSkills={masteredSkills}
          selectedEmployeeId={selectedEmployeeId}
          goalPath={currentGoal?.path}
          goalSkillId={currentGoal?.skill?.id}
          onNodeClick={handleNodeClick}
          categoryColors={CATEGORY_COLORS}
        />
      </div>

      {/* Debug Goal State - Remove in production */}
      {false && (
        <div className="mx-4 mb-4 p-4 bg-gray-100 rounded-lg border">
          <h3 className="font-bold text-sm mb-2">🐛 Goal Debug Info:</h3>
          <div className="text-xs space-y-1">
            <div><strong>Current Goal:</strong> {currentGoal ? `${currentGoal.skill.name} (${currentGoal.employeeId})` : 'None'}</div>
            <div><strong>Selected Employee:</strong> {selectedEmployeeId || 'None'}</div>
            <div><strong>Data Source:</strong> {dataSource}</div>
            <div><strong>Skills Loaded:</strong> {skills?.length || 0}</div>
            <div><strong>Goal Loading:</strong> {goalLoading ? 'Yes' : 'No'}</div>
          </div>
          {selectedEmployeeId && skills?.length > 0 && (
            <div className="mt-2 space-x-2">
              <button 
                onClick={() => {
                  if (skills.length > 0) {
                    const testSkill = skills[0];
                    const selectedEmployee = employees?.find(emp => emp.id === selectedEmployeeId);
                    if (!selectedEmployee) return;
                    
                    // Calculate goal path using shared utility function
                    const goalPath = calculateGoalPath(testSkill, selectedEmployee, currentService);
                    
                    setGoal({
                      skill: testSkill,
                      path: goalPath,
                      employeeId: selectedEmployeeId,
                      dataSource
                    });
                    console.log('🧪 SkillMap: Set test goal with calculated path:', { skill: testSkill.name, path: goalPath });
                  }
                }}
                className="px-2 py-1 bg-blue-500 text-white text-xs rounded"
              >
                Set Test Goal
              </button>
              <button 
                onClick={() => {
                  if (selectedEmployeeId) {
                    deleteGoalForEmployee(selectedEmployeeId, dataSource);
                  }
                }}
                className="px-2 py-1 bg-red-500 text-white text-xs rounded"
              >
                Delete Goal
              </button>
              <button 
                onClick={() => {
                  if (selectedEmployeeId && skills) {
                    loadGoal(selectedEmployeeId, dataSource, skills);
                  }
                }}
                className="px-2 py-1 bg-green-500 text-white text-xs rounded"
              >
                Reload Goal
              </button>
            </div>
          )}
        </div>
      )}

      {/* Plan your Path to Victory - as a Team */}
      <div className="mb-8 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8"
            style={{
              background: 'linear-gradient(135deg, hsl(263, 70%, 50%), hsl(213, 94%, 68%))',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent'
            }}>
          Plan your Path to Victory - as a Team
        </h2>

        {/* Character and Mentor/Mentee Display */}
        {selectedEmployee && (
          <div className="space-y-6 mb-8">
            <div className="flex items-center justify-center gap-8">
              {/* Selected Character */}
              <div className="flex flex-col items-center">
                <div className="relative ring-4 ring-blue-400 rounded-lg overflow-hidden shadow-lg mb-2">
                  {selectedEmployee.images?.face ? (
                    <img 
                      src={selectedEmployee.images.face} 
                      alt={selectedEmployee.name}
                      className="w-20 h-24 object-cover"
                    />
                  ) : (
                    <div className="w-20 h-24 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <span className="text-gray-500 text-sm font-medium">
                        {selectedEmployee.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-lg mb-2">{selectedEmployee.name}</h3>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
                    Level {selectedEmployee.level || 1}
                  </Badge>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300">
                    {selectedEmployee.current_xp || 0} XP
                  </Badge>
                </div>
              </div>

              {/* Mentor Box */}
              <div className="flex flex-col items-center">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Mentor</h4>
                <div className="relative ring-2 ring-gray-300 rounded-lg overflow-hidden shadow-md mb-2">
                  {selectedMentor?.images?.face ? (
                    <img 
                      src={selectedMentor.images.face} 
                      alt={selectedMentor.name}
                      className="w-16 h-20 object-cover"
                    />
                  ) : (
                    <div className="w-16 h-20 bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400 text-3xl">?</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-2">{selectedMentor?.name || 'Not Selected'}</p>
                {selectedMentor && (
                  <div className="flex gap-2 mb-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300 text-xs">
                      Level {selectedMentor.level || 1}
                    </Badge>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300 text-xs">
                      {selectedMentor.current_xp || 0} XP
                    </Badge>
                  </div>
                )}
                {selectedMentor && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => setSelectedMentor(null)} className="h-6 w-6 p-0">
                      <X className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowMentorCalendar(true)} className="h-6 w-6 p-0">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Mentee Box */}
              <div className="flex flex-col items-center">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Mentee</h4>
                <div className="relative ring-2 ring-gray-300 rounded-lg overflow-hidden shadow-md mb-2">
                  {selectedMentee?.images?.face ? (
                    <img 
                      src={selectedMentee.images.face} 
                      alt={selectedMentee.name}
                      className="w-16 h-20 object-cover"
                    />
                  ) : (
                    <div className="w-16 h-20 bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400 text-3xl">?</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-2">{selectedMentee?.name || 'Not Selected'}</p>
                {selectedMentee && (
                  <div className="flex gap-2 mb-2">
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300 text-xs">
                      Level {selectedMentee.level || 1}
                    </Badge>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300 text-xs">
                      {selectedMentee.current_xp || 0} XP
                    </Badge>
                  </div>
                )}
                {selectedMentee && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => setSelectedMentee(null)} className="h-6 w-6 p-0">
                      <X className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowMenteeCalendar(true)} className="h-6 w-6 p-0">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Next Meetings Display */}
            {(mentorMeetingDate || menteeMeetingDate) && (
              <div className="flex justify-center gap-8 text-sm">
                {mentorMeetingDate && selectedMentor && (
                  <div className="text-center">
                    <p className="text-gray-600">Next meeting with {selectedMentor.name}:</p>
                    <p className="font-semibold">{mentorMeetingDate.toLocaleDateString()}</p>
                  </div>
                )}
                {menteeMeetingDate && selectedMentee && (
                  <div className="text-center">
                    <p className="text-gray-600">Next meeting with {selectedMentee.name}:</p>
                    <p className="font-semibold">{menteeMeetingDate.toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Combined Team Collaboration, Skill Goal, and Learning Widget */}
        {selectedEmployee && (
          <div className="space-y-6">
            {/* Team Goal Display */}
            <Card className="mx-4 bg-gradient-to-br from-blue-50/50 to-white border-blue-200">
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Team Goal</h3>
                  <p className="text-blue-700">{teamGoal}</p>
                </div>
              </CardContent>
            </Card>

            {/* Personal Growth Question */}
            <Card className="mx-4 border-purple-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-purple-800 mb-3">Personal Growth</h3>
                <p className="text-gray-700 mb-3">How would you like to grow, personally?</p>
                <input 
                  type="text"
                  value={personalGrowthGoal}
                  onChange={(e) => setPersonalGrowthGoal(e.target.value)}
                  placeholder="e.g., I want to improve my leadership skills..."
                  className="w-full p-3 border border-purple-200 rounded-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-200 focus:outline-none"
                />
              </CardContent>
            </Card>

            {/* AI Insights Section */}
            <Card className="mx-4 bg-gradient-to-br from-green-50/50 to-white border-green-200">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Get AI Insights
                </h3>
                
                {/* API Key Section */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Key className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-green-700 mb-3">
                        <strong>Claude API Key Required:</strong> Enter your Anthropic Claude API key to get personalized recommendations for skills and mentors based on your team goal and personal growth interests.
                        {import.meta.env.DEV && " In development mode, you can leave this empty to use mock data."}
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
                        <p className="text-xs text-green-600">
                          Get your API key from <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="underline">Anthropic Console</a>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Get Insights Button */}
                <Button
                  onClick={handleGetInsights}
                  disabled={isLoadingInsights || !teamGoal.trim()}
                  className="w-full p-3 bg-gradient-to-r from-green-600 via-blue-600 to-green-600 text-white hover:from-green-700 hover:via-blue-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md font-medium"
                >
                  {isLoadingInsights ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Getting AI Insights...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Sparkles className="h-4 w-4" />
                      <span>Get Recommendations for Skills & Mentors</span>
                    </div>
                  )}
                </Button>

                {/* Error Display */}
                {insightsError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800">
                      <strong>Error:</strong> {insightsError}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Insights Response Display */}
            {insightsResponse && (
              <Card className="mx-4 bg-gradient-to-br from-blue-50/50 to-white border-blue-200">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-blue-800 mb-4 flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>AI Recommendations</span>
                  </h4>
                  
                  {(() => {
                    // Parse the response into structured sections
                    const sections = insightsResponse.split('## ');
                    const skillsSection = sections.find(s => s.startsWith('RECOMMENDED SKILLS'));
                    const mentorshipSection = sections.find(s => s.startsWith('MENTORSHIP RECOMMENDATIONS'));
                    
                    const content = [];
                    
                    // Parse Skills Section
                    if (skillsSection) {
                      const skillLines = skillsSection.split('\n').filter(line => line.trim());
                      const recommendedSkills = [];
                      let currentSkill = null;
                      
                      for (const line of skillLines) {
                        const skillMatch = line.match(/\*\*([^*]+)\*\*/);
                        if (skillMatch && !line.includes('[')) {
                          if (currentSkill) recommendedSkills.push(currentSkill);
                          const skillName = skillMatch[1];
                          const skill = skills?.find(s => s.name === skillName);
                          currentSkill = { name: skillName, skill, details: [] };
                        } else if (line.startsWith('- ') && currentSkill) {
                          currentSkill.details.push(line.substring(2));
                        }
                      }
                      if (currentSkill) recommendedSkills.push(currentSkill);
                      
                      // Render Skills Widgets
                      if (recommendedSkills.length > 0) {
                        content.push(
                          <div key="skills" className="space-y-3 mb-6">
                            <h3 className="text-lg font-semibold text-blue-800 mb-3">Recommended Skills</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {recommendedSkills.map((skillItem, idx) => (
                                <Card key={idx} className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-white shadow-sm hover:shadow-md transition-shadow">
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-full bg-blue-100">
                                          <Target className="h-3 w-3 text-blue-600" />
                                        </div>
                                        <h4 className="font-semibold text-blue-900">{skillItem.name}</h4>
                                      </div>
                                      {skillItem.skill && (
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            if (skillItem.skill && selectedEmployeeId) {
                                              const calculatedPath = calculateGoalPath(skillItem.skill, selectedEmployee, currentService);
                                              console.log('🎯 AI Insights: Setting goal with calculated path:', { skill: skillItem.skill.name, path: calculatedPath });
                                              const goalToSet = {
                                                skill: skillItem.skill,
                                                path: calculatedPath,
                                                employeeId: selectedEmployeeId,
                                                dataSource
                                              };
                                              setGoal(goalToSet);
                                            }
                                          }}
                                          className="bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                          <Target className="h-3 w-3 mr-1" />
                                          Set as Goal
                                        </Button>
                                      )}
                                    </div>
                                    <div className="space-y-2">
                                      {skillItem.details.map((detail, detailIdx) => (
                                        <p key={detailIdx} className="text-sm text-gray-700 leading-relaxed">
                                          • {detail}
                                        </p>
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        );
                      }
                    }
                    
                    // Parse Mentorship Section
                    if (mentorshipSection) {
                      const mentorshipLines = mentorshipSection.split('\n').filter(line => line.trim());
                      let learnFromMentor = null;
                      let mentorTo = null;
                      let currentSection = null;
                      
                      for (const line of mentorshipLines) {
                        if (line.includes('**LEARN FROM:**')) {
                          currentSection = 'learnFrom';
                          const mentorName = line.replace('**LEARN FROM:**', '').trim();
                          const mentor = employees?.find(t => t.name === mentorName);
                          learnFromMentor = { name: mentorName, teammate: mentor, description: [] };
                        } else if (line.includes('**MENTOR:**')) {
                          currentSection = 'mentor';
                          const menteeName = line.replace('**MENTOR:**', '').trim();
                          const mentee = employees?.find(t => t.name === menteeName);
                          mentorTo = { name: menteeName, teammate: mentee, description: [] };
                        } else if (line.trim() && currentSection && !line.includes('**')) {
                          // Stop processing if we hit another section or formatting
                          if (line.includes('Just-in-Time Learning') || line.includes('Key piece') || line.includes('This focused approach')) {
                            break;
                          }
                          if (currentSection === 'learnFrom' && learnFromMentor) {
                            learnFromMentor.description.push(line.trim());
                          } else if (currentSection === 'mentor' && mentorTo) {
                            mentorTo.description.push(line.trim());
                          }
                        }
                      }
                      
                      // Render Mentorship Widgets
                      content.push(
                        <div key="mentorship" className="space-y-3">
                          <h3 className="text-lg font-semibold text-blue-800 mb-3">Mentorship Recommendations</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {learnFromMentor && (
                              <Card className="border-green-200 bg-gradient-to-br from-green-50/50 to-white shadow-sm">
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-green-100 rounded-full">
                                      <Users className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-green-800">Learn From</h4>
                                      <p className="text-sm text-green-600">Find a mentor</p>
                                    </div>
                                    {learnFromMentor.teammate && (
                                      <Button
                                        size="sm"
                                        onClick={() => setSelectedMentor(learnFromMentor.teammate!)}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                      >
                                        Select Mentor
                                      </Button>
                                    )}
                                  </div>
                                  <div className="flex items-start gap-3">
                                    {learnFromMentor.teammate?.images?.face && (
                                      <img
                                        src={learnFromMentor.teammate.images.face}
                                        alt={learnFromMentor.name}
                                        className="w-12 h-14 object-cover rounded-lg shadow-sm flex-shrink-0"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                        }}
                                      />
                                    )}
                                    <div className="flex-1">
                                      <h5 className="font-semibold text-gray-900 mb-1">{learnFromMentor.name}</h5>
                                      <p className="text-sm text-gray-600 mb-2">{learnFromMentor.teammate?.role}</p>
                                      <div className="text-sm text-gray-700 leading-relaxed">
                                        {learnFromMentor.description.join(' ')}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                            
                            {mentorTo && (
                              <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-white shadow-sm">
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-purple-100 rounded-full">
                                      <Users className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-purple-800">Mentor</h4>
                                      <p className="text-sm text-purple-600">Share your knowledge</p>
                                    </div>
                                    {mentorTo.teammate && (
                                      <Button
                                        size="sm"
                                        onClick={() => setSelectedMentee(mentorTo.teammate!)}
                                        className="bg-purple-600 hover:bg-purple-700 text-white"
                                      >
                                        Select Mentee
                                      </Button>
                                    )}
                                  </div>
                                  <div className="flex items-start gap-3">
                                    {mentorTo.teammate?.images?.face && (
                                      <img
                                        src={mentorTo.teammate.images.face}
                                        alt={mentorTo.name}
                                        className="w-12 h-14 object-cover rounded-lg shadow-sm flex-shrink-0"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                        }}
                                      />
                                    )}
                                    <div className="flex-1">
                                      <h5 className="font-semibold text-gray-900 mb-1">{mentorTo.name}</h5>
                                      <p className="text-sm text-gray-600 mb-2">{mentorTo.teammate?.role}</p>
                                      <div className="text-sm text-gray-700 leading-relaxed">
                                        {mentorTo.description.join(' ')}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </div>
                        </div>
                      );
                    }
                    
                    return content;
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Skill Goal Widget Content */}
            <div className="mx-4">
              <SkillGoalWidget
                employeeId={selectedEmployeeId}
                employee={selectedEmployee}
                currentGoal={currentGoal?.skill || null}
                service={currentService}
                dataSource={dataSource}
                onGoalSet={(goalSkill, path) => {
                  console.log('🎯 SkillMap: SkillGoalWidget onGoalSet called:', { goalSkill: goalSkill?.name, path, selectedEmployeeId });
                  if (goalSkill && selectedEmployeeId) {
                    const goalToSet = {
                      skill: goalSkill,
                      path,
                      employeeId: selectedEmployeeId,
                      dataSource
                    };
                    console.log('🎯 SkillMap: Setting goal from SkillGoalWidget:', goalToSet);
                    setGoal(goalToSet);
                  } else {
                    console.log('🧹 SkillMap: Clearing goal from SkillGoalWidget');
                    clearGoal();
                  }
                }}
                onLearnNewSkills={handleLearnNewSkills}
                onGoalCompleted={handleGoalCompleted}
              />
            </div>

            {/* Skill Recommendation Widget */}
            <div className="mx-4">
              <SkillRecommendationWidget
                ref={skillRecommendationWidgetRef}
                employeeId={selectedEmployeeId}
                employee={selectedEmployee}
                goalSkillId={currentGoal?.skill?.id}
                currentGoal={currentGoal?.skill || null}
                service={currentService}
                dataSource={dataSource}
                onSkillLearn={async (skill, updatedEmployee) => {
                  try {
                    await currentService.learnSkill(selectedEmployeeId, skill.id);
                    
                    // Optimistically update the employee cache immediately
                    const currentEmployees = queryClient.getQueryData([`${dataSource}-employees`]) as any[];
                    if (currentEmployees) {
                      const optimisticEmployees = currentEmployees.map(emp => 
                        emp.id === selectedEmployeeId 
                          ? { ...emp, mastered_skills: [...emp.mastered_skills, skill.id] }
                          : emp
                      );
                      queryClient.setQueryData([`${dataSource}-employees`], optimisticEmployees);
                    }
                    
                    // Use single invalidation to trigger efficient background refresh
                    queryClient.invalidateQueries({ queryKey: [`${dataSource}-employees`], exact: false });
                    queryClient.invalidateQueries({ queryKey: ['skill-recommendations'], exact: false });
                    
                    console.log(`${updatedEmployee.name} learned ${skill.name}!`);
                  } catch (error) {
                    console.error('Failed to learn skill:', error);
                    // Revert optimistic update on error
                    queryClient.invalidateQueries({ queryKey: [`${dataSource}-employees`] });
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Calendar Modals */}
      {showMentorCalendar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Schedule Meeting with {selectedMentor?.name}</h3>
              <input 
                type="date"
                className="w-full p-3 border border-gray-300 rounded-lg mb-4"
                onChange={(e) => {
                  if (e.target.value) {
                    setMentorMeetingDate(new Date(e.target.value));
                    setShowMentorCalendar(false);
                  }
                }}
              />
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowMentorCalendar(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMenteeCalendar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Schedule Meeting with {selectedMentee?.name}</h3>
              <input 
                type="date"
                className="w-full p-3 border border-gray-300 rounded-lg mb-4"
                onChange={(e) => {
                  if (e.target.value) {
                    setMenteeMeetingDate(new Date(e.target.value));
                    setShowMenteeCalendar(false);
                  }
                }}
              />
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setShowMenteeCalendar(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  )
}

export default SkillMap 