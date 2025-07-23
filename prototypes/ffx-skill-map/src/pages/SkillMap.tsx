import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { sharedEnhancedService } from '../services/sharedService'
import TechSkillsService from '../services/techSkillsData'

// Create instances of both services
const ffxSkillService = sharedEnhancedService
const techSkillService = new TechSkillsService()
import { useState, useRef, useEffect, useMemo } from 'react'
import { Sword, Zap, Heart, Star, Crown, Filter, ChevronDown, ChevronUp, Maximize2, Minimize2, Users, RotateCcw, HelpCircle, X, Sparkles, TrendingUp, BarChart3, Code, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Sigma from 'sigma';
import Graph from 'graphology';
import { NodeBorderProgram } from '@sigma/node-border';
import { getEnhancedGraphNodes, getEnhancedGraphEdges } from './EnhancedSkillMap.utils';
import SkillRecommendationWidget, { SkillRecommendationWidgetRef } from '../components/SkillRecommendationWidget';
import SkillGoalWidget from '../components/SkillGoalWidget';
import SecureAIAnalysisWidget from '../components/SecureAIAnalysisWidget';

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
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')
  const [expandedLevels, setExpandedLevels] = useState<Record<string, boolean>>({})
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const [isResetting, setIsResetting] = useState(false)
  const [currentGoal, setCurrentGoal] = useState<{ skill: any; path: string[] } | null>(null)
  const [showTutorial, setShowTutorial] = useState(() => {
    // Show tutorial on first visit
    return !localStorage.getItem('skillMapTutorialSeen')
  })
  const [showSkillExplorer, setShowSkillExplorer] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState<any>(null)
  const [dataSource, setDataSource] = useState<'ffx' | 'tech'>('tech') // Default to tech skills
  const skillGoalRef = useRef<HTMLDivElement>(null)
  const skillRecommendationRef = useRef<HTMLDivElement>(null)
  const skillRecommendationWidgetRef = useRef<SkillRecommendationWidgetRef>(null)
  const queryClient = useQueryClient()

  // Get the current service and colors based on data source selection
  const currentService = dataSource === 'ffx' ? ffxSkillService : techSkillService
  const CATEGORY_COLORS = dataSource === 'ffx' ? FFX_CATEGORY_COLORS : TECH_CATEGORY_COLORS

  // Reset category filter when switching data sources
  useEffect(() => {
    setSelectedCategory('all')
  }, [dataSource])

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

  // Find selected employee's mastered skills
  const selectedEmployee = employees?.find(emp => emp.id === selectedEmployeeId)
  const masteredSkills = selectedEmployee?.mastered_skills || []

  // Reset skills for selected employee
  const handleResetSkills = async () => {
    if (!selectedEmployeeId) return;
    
    setIsResetting(true);
    try {
      await currentService.resetEmployeeSkills(selectedEmployeeId);
      
      // Clear the current goal when skills are reset
      setCurrentGoal(null);
      
      // Use efficient non-blocking invalidation with current data source
      queryClient.invalidateQueries({ queryKey: [`${dataSource}-employees`], exact: false });
      queryClient.invalidateQueries({ queryKey: ['skill-recommendations'], exact: false });
      
      console.log(`✅ Successfully reset skills for ${selectedEmployee?.name || selectedEmployeeId}`);
    } catch (error) {
      console.error('Failed to reset employee skills:', error);
    } finally {
      setIsResetting(false);
    }
  };

  // Always call hooks before any early returns - Rules of Hooks
  // Memoize filtered skills for performance
  const filteredSkills = useMemo(() => {
    if (!skills) return [];
    
    return skills.filter(skill => {
      const matchesCategory = selectedCategory === 'all' || skill.category === selectedCategory;
      const matchesLevel = selectedLevel === 'all' || skill.level.toString() === selectedLevel;
      return matchesCategory && matchesLevel;
    });
  }, [skills, selectedCategory, selectedLevel]);

  // Memoize skills grouping for performance
  const skillsByLevel = useMemo(() => {
    return filteredSkills.reduce((acc, skill) => {
      if (!acc[skill.level]) {
        acc[skill.level] = [];
      }
      acc[skill.level].push(skill);
      return acc;
    }, {} as Record<number, typeof skills>);
  }, [filteredSkills]);

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

  const getCategoryMasteredColors = (category: string) => {
    if (dataSource === 'ffx') {
      switch (category) {
        case 'combat':
          return {
            border: 'border-red-500',
            bg: 'bg-red-50',
            text: 'text-red-800',
            check: 'text-red-600'
          }
        case 'magic':
          return {
            border: 'border-blue-500',
            bg: 'bg-blue-50',
            text: 'text-blue-800',
            check: 'text-blue-600'
          }
        case 'support':
          return {
            border: 'border-green-500',
            bg: 'bg-green-50',
            text: 'text-green-800',
            check: 'text-green-600'
          }
        case 'special':
          return {
            border: 'border-purple-500',
            bg: 'bg-purple-50',
            text: 'text-purple-800',
            check: 'text-purple-600'
          }
        case 'advanced':
          return {
            border: 'border-yellow-500',
            bg: 'bg-yellow-50',
            text: 'text-yellow-800',
            check: 'text-yellow-600'
          }
        default:
          return {
            border: 'border-gray-500',
            bg: 'bg-gray-50',
            text: 'text-gray-800',
            check: 'text-gray-600'
          }
      }
    } else {
      switch (category) {
        case 'engineering':
          return {
            border: 'border-blue-500',
            bg: 'bg-blue-50',
            text: 'text-blue-800',
            check: 'text-blue-600'
          }
        case 'platform':
          return {
            border: 'border-green-500',
            bg: 'bg-green-50',
            text: 'text-green-800',
            check: 'text-green-600'
          }
        case 'product':
          return {
            border: 'border-purple-500',
            bg: 'bg-purple-50',
            text: 'text-purple-800',
            check: 'text-purple-600'
          }
        case 'communication':
          return {
            border: 'border-orange-500',
            bg: 'bg-orange-50',
            text: 'text-orange-800',
            check: 'text-orange-600'
          }
        case 'process':
          return {
            border: 'border-cyan-500',
            bg: 'bg-cyan-50',
            text: 'text-cyan-800',
            check: 'text-cyan-600'
          }
        case 'leadership':
          return {
            border: 'border-yellow-500',
            bg: 'bg-yellow-50',
            text: 'text-yellow-800',
            check: 'text-yellow-600'
          }
        default:
          return {
            border: 'border-gray-500',
            bg: 'bg-gray-50',
            text: 'text-gray-800',
            check: 'text-gray-600'
          }
      }
    }
  }

  const getPrerequisites = (skillId: string) => {
    return connections?.filter(conn => conn.to === skillId).map(conn => conn.from) || []
  }

  const getDependents = (skillId: string) => {
    return connections?.filter(conn => conn.from === skillId).map(conn => conn.to) || []
  }

  const toggleLevelExpansion = (level: string) => {
    setExpandedLevels(prev => ({
      ...prev,
      [level]: !prev[level]
    }))
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
      // Simply set the goal - let the SkillGoalWidget handle path calculation
      setCurrentGoal({ skill: selectedSkill, path: [] })
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

      {/* Header with Title and Intro */}
      <div className="mb-6 md:mb-8 text-center px-4">
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center"
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
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
          Navigate the adventure of work with your team.<br />Level up and master skills to take on the world, together.
        </p>
        
        {/* Data Source Toggle */}
        <div className="mt-4 mb-6">
          <div className="flex items-center justify-center gap-3">
            <span className="text-sm text-muted-foreground">Skill Set:</span>
            <div className="flex items-center border border-border rounded-lg p-1 bg-background">
              <button
                onClick={() => {
                  setDataSource('tech')
                  setSelectedEmployeeId('')
                  setCurrentGoal(null)
                  setSelectedSkill(null)
                  // Invalidate all cached data when switching datasets
                  queryClient.invalidateQueries({ queryKey: ['ffx-skills'] })
                  queryClient.invalidateQueries({ queryKey: ['ffx-connections'] })
                  queryClient.invalidateQueries({ queryKey: ['ffx-employees'] })
                  queryClient.invalidateQueries({ queryKey: ['skill-recommendations'] })
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  dataSource === 'tech'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <Code className="h-4 w-4" />
                <span>Tech Organization</span>
              </button>
              <button
                onClick={() => {
                  setDataSource('ffx')
                  setSelectedEmployeeId('')
                  setCurrentGoal(null)
                  setSelectedSkill(null)
                  // Invalidate all cached data when switching datasets
                  queryClient.invalidateQueries({ queryKey: ['tech-skills'] })
                  queryClient.invalidateQueries({ queryKey: ['tech-connections'] })
                  queryClient.invalidateQueries({ queryKey: ['tech-employees'] })
                  queryClient.invalidateQueries({ queryKey: ['skill-recommendations'] })
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  dataSource === 'ffx'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <Sword className="h-4 w-4" />
                <span>Final Fantasy X</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Feature highlights */}
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-xs sm:text-sm">
            <div className="flex items-center gap-2 bg-gradient-to-r from-primary/10 to-primary/5 px-3 py-2 rounded-full border border-primary/20">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span className="font-medium text-primary">Skill Tracking</span>
              <span className="text-muted-foreground">for employees</span>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600/10 to-blue-600/5 px-3 py-2 rounded-full border border-blue-200">
              <Sparkles className="h-3 w-3 text-blue-600" />
              <span className="font-medium text-blue-600">Smart Recommendations</span>
              <span className="text-muted-foreground">based on expertise</span>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-purple-600/10 to-purple-600/5 px-3 py-2 rounded-full border border-purple-200">
              <TrendingUp className="h-3 w-3 text-purple-600" />
              <span className="font-medium text-purple-600">Learning Pathways</span>
              <span className="text-muted-foreground">between skills</span>
            </div>
            <div className="flex items-center gap-2 bg-gradient-to-r from-green-600/10 to-green-600/5 px-3 py-2 rounded-full border border-green-200">
              <BarChart3 className="h-3 w-3 text-green-600" />
              <span className="font-medium text-green-600">Team Analytics</span>
              <span className="text-muted-foreground">and gaps</span>
            </div>
          </div>
        </div>
      </div>

      {/* Employee dropdown */}
      <div className="w-full max-w-4xl mb-4 mx-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1 max-w-md">
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger className="w-full" data-testid="employee-select">
                <SelectValue placeholder="Select an employee to highlight mastered skills..." />
              </SelectTrigger>
              <SelectContent>
                {employees?.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    <div className="flex items-center gap-3">
                      {emp.images?.face && (
                        <img 
                          src={emp.images.face} 
                          alt={emp.name}
                          className="w-6 h-6 rounded-full object-cover flex-shrink-0 max-w-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      )}
                      <div>
                        <span className="block sm:hidden">{emp.name}</span>
                        <span className="hidden sm:block">{emp.name} - {emp.role}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            onClick={handleResetSkills}
            disabled={!selectedEmployeeId || isResetting}
            className="whitespace-nowrap"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {isResetting ? 'Resetting...' : 'Reset Skills'}
          </Button>
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

      {/* Existing SkillMap content below */}
      <div className="space-y-6">

        {/* Secure AI Analysis Widget */}
        <div className="mb-8">
          <SecureAIAnalysisWidget
            employeeId={selectedEmployeeId}
            employee={selectedEmployee}
            service={currentService}
            dataSource={dataSource}
            onGoalSelect={(skill) => {
              setCurrentGoal({ skill, path: [] });
              // Invalidate recommendations to refresh with goal-directed ones
              queryClient.invalidateQueries({ queryKey: ['skill-recommendations'], exact: false });
            }}
            onScrollToGoals={() => {
              skillGoalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          />
        </div>

        {/* Skill Goal Widget */}
        <div ref={skillGoalRef} className="mb-8">
          <SkillGoalWidget
            employeeId={selectedEmployeeId}
            employee={selectedEmployee}
            currentGoal={currentGoal?.skill || null}
            service={currentService}
            dataSource={dataSource}
            onGoalSet={(goalSkill, path) => {
              setCurrentGoal(goalSkill ? { skill: goalSkill, path } : null);
              // Invalidate recommendations to refresh with goal-directed ones
              queryClient.invalidateQueries({ queryKey: ['skill-recommendations'], exact: false });
            }}
            onLearnNewSkills={handleLearnNewSkills}
            onGoalCompleted={handleGoalCompleted}
          />
        </div>

        {/* Skill Recommendation Widget */}
        <div ref={skillRecommendationRef} className="mb-8">
          <SkillRecommendationWidget
            ref={skillRecommendationWidgetRef}
            employeeId={selectedEmployeeId}
            employee={selectedEmployee}
            goalSkillId={currentGoal?.skill?.id}
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

        {/* Team Analytics */}
        <div className="mb-8">
          <Card className="border-border/50 shadow-elegant mx-4">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Team Analytics
              </CardTitle>
              <CardDescription>Skill distribution across all team members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Overall Statistics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2">
                    <div className="text-xl font-bold text-blue-600">{skills?.length || 0}</div>
                    <p className="text-xs text-gray-500">Total Skills</p>
                  </div>
                  <div className="text-center p-2">
                    <div className="text-xl font-bold text-green-600">{employees?.length || 0}</div>
                    <p className="text-xs text-gray-500">Employees</p>
                  </div>
                  <div className="text-center p-2">
                    <div className="text-xl font-bold text-orange-600">
                      {employees?.reduce((sum, emp) => sum + (emp.mastered_skills?.length || 0), 0) || 0}
                    </div>
                    <p className="text-xs text-gray-500">Skills Mastered</p>
                  </div>
                </div>

                {/* Team Mastered Skills by Category */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-3">Team Mastered Skills by Type</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    {(() => {
                      // Count all mastered skills by category across all employees
                      const masteredByCategory: Record<string, number> = {};
                      employees?.forEach(emp => {
                        emp.mastered_skills?.forEach(skillId => {
                          const skill = skills?.find(s => s.id === skillId);
                          if (skill) {
                            masteredByCategory[skill.category] = (masteredByCategory[skill.category] || 0) + 1;
                          }
                        });
                      });
                      
                      return Object.entries(masteredByCategory).map(([category, count]) => {
                        const categoryInfo = getCategoryInfo(category);
                        return (
                          <div key={category} className="text-center p-2 rounded-lg bg-gray-50/50 border">
                            <div className="flex items-center justify-center mb-1">
                              <span className="text-sm" style={{ color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] }}>
                                {categoryInfo.icon}
                              </span>
                            </div>
                            <div className="text-lg font-bold" style={{ color: CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS] }}>
                              {count}
                            </div>
                            <p className="text-xs text-gray-500 capitalize">{category}</p>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Team Mastered Skills by Level */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-3">Team Mastered Skills by Level</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[1, 2, 3, 4, 5, 6].map(level => {
                      // Count all mastered skills by level across all employees
                      const masteredAtLevel = employees?.reduce((count, emp) => {
                        return count + (emp.mastered_skills?.filter(skillId => {
                          const skill = skills?.find(s => s.id === skillId);
                          return skill?.level === level;
                        }).length || 0);
                      }, 0) || 0;
                      
                      return (
                        <div key={level} className="text-center p-2 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200">
                          <div className="text-lg font-bold text-blue-600">{masteredAtLevel}</div>
                          <p className="text-xs text-gray-500">Level {level}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Skill Explorer */}
        <div className="mb-8">
          <Card className="border-border/50 shadow-elegant mx-4">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <CardTitle className="flex items-center gap-3 text-lg md:text-xl">
                    <Filter className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
                    {selectedEmployee?.images?.face && (
                      <div className="relative">
                        <img 
                          src={selectedEmployee.images.face} 
                          alt={selectedEmployee.name}
                          className="w-8 h-10 md:w-10 md:h-12 object-cover rounded-lg shadow-sm flex-shrink-0 max-w-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <span className="truncate">
                      {selectedEmployee ? `${selectedEmployee.name}'s Mastered Skills` : 'Skill Explorer'}
                    </span>
                  </CardTitle>
                  <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm mt-1">
                    <span>
                      {showSkillExplorer 
                        ? selectedEmployee 
                          ? `Filter and browse all skills - mastered skills for ${selectedEmployee.name} are highlighted`
                          : "Filter and browse all skills organized by level"
                        : selectedEmployee
                          ? `See all skills by level with ${selectedEmployee.name}'s mastered skills highlighted`
                          : "See all skills by level with detailed breakdowns and filtering options"
                      }
                    </span>
                    {selectedEmployee && showSkillExplorer && (
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                          <span>{masteredSkills.length} mastered</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <span>of {skills?.length || 0} total</span>
                        </div>
                      </div>
                    )}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSkillExplorer(!showSkillExplorer)}
                  className="flex items-center gap-2 flex-shrink-0 text-xs md:text-sm"
                >
                  {showSkillExplorer ? (
                    <>
                      <Minimize2 className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden sm:inline">Hide Explorer</span>
                      <span className="sm:hidden">Hide</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="h-3 w-3 md:h-4 md:w-4" />
                      <span className="hidden sm:inline">See All Skills</span>
                      <span className="sm:hidden">Explore</span>
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            
            {showSkillExplorer && (
              <CardContent>
                {/* Filters */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-3">Filter Skills</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Filter by category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {dataSource === 'ffx' ? (
                          <>
                            <SelectItem value="combat">Combat</SelectItem>
                            <SelectItem value="magic">Magic</SelectItem>
                            <SelectItem value="support">Support</SelectItem>
                            <SelectItem value="special">Special</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="engineering">Engineering</SelectItem>
                            <SelectItem value="platform">Platform</SelectItem>
                            <SelectItem value="product">Product</SelectItem>
                            <SelectItem value="communication">Communication</SelectItem>
                            <SelectItem value="process">Process</SelectItem>
                            <SelectItem value="leadership">Leadership</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                    
                    <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Filter by level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="1">Level 1</SelectItem>
                        <SelectItem value="2">Level 2</SelectItem>
                        <SelectItem value="3">Level 3</SelectItem>
                        <SelectItem value="4">Level 4</SelectItem>
                        <SelectItem value="5">Level 5</SelectItem>
                        <SelectItem value="6">Level 6</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Skill Grid */}
                <div className="space-y-6">
                  {Object.keys(skillsByLevel).length > 0 ? (
                    Object.entries(skillsByLevel)
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([level, levelSkills]) => (
                        <Card key={level} className="border-border/50 hover:border-primary/30 shadow-sm transition-smooth">
                          <CardHeader className="pb-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="min-w-0">
                                <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-base md:text-lg">
                                  <span>Level {level} Skills</span>
                                  <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline" className="self-start sm:self-auto text-xs">{levelSkills?.length || 0} skills</Badge>
                                    {selectedEmployeeId && levelSkills && (
                                      <Badge 
                                        variant="secondary" 
                                        className="self-start sm:self-auto text-xs bg-green-100 text-green-800 border-green-200"
                                      >
                                        {levelSkills.filter(skill => masteredSkills.includes(skill.id)).length} mastered
                                      </Badge>
                                    )}
                                  </div>
                                </CardTitle>
                              </div>
                              <button
                                onClick={() => toggleLevelExpansion(level)}
                                className="flex items-center gap-1 px-2 md:px-3 py-1 text-xs md:text-sm bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md transition-colors flex-shrink-0"
                              >
                                {expandedLevels[level] ? (
                                  <>
                                    <ChevronUp className="h-3 w-3 md:h-4 md:w-4" />
                                    <span className="hidden sm:inline">Hide Skills</span>
                                    <span className="sm:hidden">Hide</span>
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-3 w-3 md:h-4 md:w-4" />
                                    <span className="hidden sm:inline">Show Skills</span>
                                    <span className="sm:hidden">Show</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {expandedLevels[level] ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                              {levelSkills.map(skill => {
                                const prerequisites = getPrerequisites(skill.id)
                                const dependents = getDependents(skill.id)
                                const isMastered = masteredSkills.includes(skill.id)
                                const hasEmployeeSelected = selectedEmployeeId !== ''
                                const masteredColors = getCategoryMasteredColors(skill.category)
                                
                                return (
                                  <div
                                    key={skill.id}
                                    className={`p-4 rounded-lg border skill-node skill-${skill.category} transition-all duration-200 ${
                                      hasEmployeeSelected 
                                        ? isMastered 
                                          ? `${masteredColors.border} border-2 ${masteredColors.bg} shadow-md` 
                                          : 'border-gray-300 bg-gray-50 opacity-60'
                                        : 'border-gray-200 bg-white'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        {getCategoryIcon(skill.category)}
                                        <h4 className={`font-medium text-sm ${
                                          hasEmployeeSelected && isMastered ? `${masteredColors.text} font-semibold` : ''
                                        }`}>
                                          {skill.name}
                                          {hasEmployeeSelected && isMastered && (
                                            <span className={`ml-2 ${masteredColors.check}`}>✓</span>
                                          )}
                                        </h4>
                                      </div>
                                      <Badge variant="outline" className="text-xs">
                                        L{skill.level}
                                      </Badge>
                                    </div>
                                    
                                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                                      {skill.description}
                                    </p>
                                    
                                    <div className="space-y-2">
                                      <Badge 
                                        variant="secondary" 
                                        className={`text-xs hidden sm:inline-flex ${getCategoryColor(skill.category)}`}
                                      >
                                        {skill.category}
                                      </Badge>
                                      
                                      {prerequisites.length > 0 && (
                                        <div>
                                          <p className="text-xs font-medium text-gray-700 mb-1">Prerequisites:</p>
                                          <div className="flex flex-wrap gap-1">
                                            {prerequisites.map(prereqId => {
                                              const prereqSkill = skills?.find(s => s.id === prereqId)
                                              return prereqSkill ? (
                                                <Badge key={prereqId} variant="outline" className="text-xs">
                                                  {prereqSkill.name}
                                                </Badge>
                                              ) : null
                                            })}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {dependents.length > 0 && (
                                        <div>
                                          <p className="text-xs font-medium text-gray-700 mb-1">Unlocks:</p>
                                          <div className="flex flex-wrap gap-1">
                                            {dependents.map(depId => {
                                              const depSkill = skills?.find(s => s.id === depId)
                                              return depSkill ? (
                                                <Badge key={depId} variant="outline" className="text-xs">
                                                  {depSkill.name}
                                                </Badge>
                                              ) : null
                                            })}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                              </div>
                            ) : (
                              <div className="text-center py-6">
                                <p className="text-muted-foreground text-sm">
                                  Level {level} skills currently hidden... Click "Show Skills" to view {levelSkills.length} skills
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                  ) : (
                    <Card className="border-border/50 shadow-sm">
                      <CardContent className="text-center py-8 md:py-12">
                        <Filter className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm md:text-base text-muted-foreground px-4">
                          No skills match the current filters. Try adjusting your selection.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        </div>


      </div>
    </>
  )
}

export default SkillMap 