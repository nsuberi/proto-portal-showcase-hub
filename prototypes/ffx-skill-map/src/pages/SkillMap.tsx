import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { sharedEnhancedService } from '../services/sharedService'

// Use the shared service instance to prevent multiple connections
const enhancedNeo4jService = sharedEnhancedService
import { useState, useRef, useEffect, useMemo } from 'react'
import { Sword, Zap, Heart, Star, Crown, Filter, ChevronDown, ChevronUp, Maximize2, Minimize2, Users } from 'lucide-react'
import Sigma from 'sigma';
import Graph from 'graphology';
import { NodeBorderProgram } from '@sigma/node-border';
import { getEnhancedGraphNodes, getEnhancedGraphEdges } from './EnhancedSkillMap.utils';
import SkillRecommendationWidget from '../components/SkillRecommendationWidget';

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
const CATEGORY_COLORS = {
  combat: hslToHex(0, 84.2, 60.2),     // Red: #f95454
  magic: hslToHex(213, 94, 68),        // Blue: #429bff  
  support: hslToHex(142, 76, 36),      // Green: #16a34a
  special: hslToHex(263, 70, 60),      // Purple: #8b5cf6
  advanced: hslToHex(48, 96, 53),      // Yellow: #facc15
  default: hslToHex(240, 5, 64.9),     // Gray: #a1a1aa
};

function SigmaGraph({ skills, connections, masteredSkills, selectedEmployeeId }: {
  skills: any[],
  connections: any[],
  masteredSkills: string[],
  selectedEmployeeId: string
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
        } else if (data.hasEmployeeSelected && !data.isMastered) {
          // Employee doesn't have this skill - make it translucent
          color = hexToRgba(data.color, 0.6);
          labelColor = hexToRgba('#2C3E50', 0.7); // Fade the label as well
        }
        
        return {
          ...data,
          label: data.label,
          color: color,
          // Make mastered skills bigger to ensure they stand out
          size: data.isMastered ? data.size * 1.3 : data.size,
          zIndex: data.isMastered ? 3 : (data.zIndex || 1), // Higher z-index for mastered skills
          // Keep the node type as set in the data (border for mastered, circle for others)
          type: data.type,
          labelSize: labelSize,
          labelColor: labelColor,
          labelWeight: labelWeight,
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
  
  // Memoize expensive graph computations
  const memoizedNodes = useMemo(() => {
    if (!skills) return [];
    return getEnhancedGraphNodes(skills, masteredSkills, CATEGORY_COLORS);
  }, [skills, masteredSkills]);

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
      className="w-full h-[400px] sm:h-[500px] md:h-[600px] border border-border/50 mb-6 rounded-lg shadow-md bg-gradient-to-br from-background via-card to-background/95 mx-4"
      data-testid="sigma-graph"
      style={{
        background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.05) 0%, rgba(0, 0, 0, 0.02) 50%, rgba(139, 69, 19, 0.03) 100%)'
      }}
    />
  );
}

export { SigmaGraph };

const SkillMap = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')
  const [expandedLevels, setExpandedLevels] = useState<Record<string, boolean>>({})
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: skills, isLoading } = useQuery({
    queryKey: ['enhanced-skills'],
    queryFn: () => enhancedNeo4jService.getAllSkills(),
  })

  const { data: connections } = useQuery({
    queryKey: ['enhanced-connections'],
    queryFn: () => enhancedNeo4jService.getSkillConnections(),
  })

  const { data: employees } = useQuery({
    queryKey: ['enhanced-employees'],
    queryFn: () => enhancedNeo4jService.getAllEmployees(),
  })

  // Find selected employee's mastered skills
  const selectedEmployee = employees?.find(emp => emp.id === selectedEmployeeId)
  const masteredSkills = selectedEmployee?.mastered_skills || []

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
  }

  const getCategoryColor = (category: string) => {
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
  }

  const getCategoryMasteredColors = (category: string) => {
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
  }

  return (
    <>
      {/* Instructions */}
      <div className="mb-6 md:mb-8 bg-blue-50/50 border border-blue-200 rounded-lg p-4 md:p-6 mx-4">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
            <Users className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base md:text-lg font-semibold text-blue-900 mb-2">How to Use the Map of Mastery</h3>
            <div className="space-y-2 text-xs sm:text-sm text-blue-800">
              <p>1. <strong>Select an employee</strong> from the dropdown below to highlight their mastered skills</p>
              <p>2. <strong>Explore the interactive network</strong> - each node represents a skill with prerequisite connections</p>
              <p>3. <strong>View personalized recommendations</strong> - see suggested next skills based on current expertise</p>
              <p>4. <strong>Hover over legend items</strong> to learn about different skill categories</p>
            </div>
          </div>
        </div>
      </div>

      {/* Employee dropdown */}
      <div className="w-full max-w-md mb-4 mx-4">
        <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an employee to highlight mastered skills..." />
          </SelectTrigger>
          <SelectContent>
            {employees?.map(emp => (
              <SelectItem key={emp.id} value={emp.id}>
                <span className="block sm:hidden">{emp.name}</span>
                <span className="hidden sm:block">{emp.name} - {emp.role}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sigma.js visualization container */}
      <SigmaGraph
        skills={skills}
        connections={connections}
        masteredSkills={masteredSkills}
        selectedEmployeeId={selectedEmployeeId}
      />

      {/* Legend for node colors - with hover tooltips */}
      <div className="mb-6 md:mb-8 relative mx-4">
        <div className="bg-white/60 backdrop-blur-sm border border-border/50 rounded-lg p-3 md:p-4 shadow-sm">
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
        <div className="text-center mb-6 md:mb-8 px-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 px-2"
              style={{
                background: 'linear-gradient(135deg, hsl(263, 70%, 30%), hsl(263, 70%, 75%), hsl(263, 70%, 30%))',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent'
              }}>
            Map of Mastery
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto px-4">
            Visualize employee expertise through an interactive skill network. Track what skills your team members have mastered,
            identify skill gaps, and discover optimal learning pathways. Each node represents a skill, with connections showing
            prerequisite relationships and recommended next steps for professional development.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mt-6 text-xs sm:text-sm text-muted-foreground max-w-4xl mx-auto px-4">
            <span className="flex items-center justify-center gap-2">• <strong className="text-primary">Skill Tracking</strong> for employees</span>
            <span className="flex items-center justify-center gap-2">• <strong className="text-blue-600">Smart Recommendations</strong> based on expertise</span>
            <span className="flex items-center justify-center gap-2">• <strong className="text-purple-600">Learning Pathways</strong> between skills</span>
            <span className="flex items-center justify-center gap-2">• <strong className="text-green-600">Team Analytics</strong> and gaps</span>
          </div>
        </div>


        {/* Skill Recommendation Widget */}
        <div className="mb-8">
          <SkillRecommendationWidget
            employeeId={selectedEmployeeId}
            employee={selectedEmployee}
            onSkillLearn={async (skill, updatedEmployee) => {
              try {
                await enhancedNeo4jService.learnSkill(selectedEmployeeId, skill.id);
                
                // Refresh all queries to update the UI
                queryClient.invalidateQueries({ queryKey: ['enhanced-employees'] });
                queryClient.invalidateQueries({ queryKey: ['enhanced-skills'] });
                queryClient.invalidateQueries({ queryKey: ['skill-recommendations'] });
                
                console.log(`${updatedEmployee.name} learned ${skill.name}!`);
              } catch (error) {
                console.error('Failed to learn skill:', error);
              }
            }}
          />
        </div>

        {/* Filters */}
        <Card className="border-border/50 hover:border-primary/30 shadow-elegant transition-smooth mx-4">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg md:text-xl">Filters</CardTitle>
            <CardDescription className="text-sm">
              Filter skills by category and level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="combat">Combat</SelectItem>
                  <SelectItem value="magic">Magic</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="special">Special</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
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
          </CardContent>
        </Card>

        {/* Skill Grid */}
        <div className="space-y-6 md:space-y-8 mx-4">
          {Object.keys(skillsByLevel).length > 0 ? (
            Object.entries(skillsByLevel)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([level, levelSkills]) => (
                <Card key={level} className="border-border/50 hover:border-primary/30 shadow-elegant transition-smooth">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-lg md:text-xl">
                          <span>Level {level} Skills</span>
                          <Badge variant="outline" className="self-start sm:self-auto text-xs">{levelSkills.length} skills</Badge>
                        </CardTitle>
                        <CardDescription className="text-sm">
                          Skills available at level {level}
                        </CardDescription>
                      </div>
                      <button
                        onClick={() => toggleLevelExpansion(level)}
                        className="flex items-center gap-1 px-2 md:px-3 py-1 text-xs md:text-sm bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md transition-colors flex-shrink-0"
                      >
                        {expandedLevels[level] ? (
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
            <Card className="border-border/50 shadow-elegant">
              <CardContent className="text-center py-8 md:py-12">
                <Filter className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm md:text-base text-muted-foreground px-4">
                  No skills match the current filters. Try adjusting your selection.
                </p>
              </CardContent>
            </Card>
          )}
        </div>


        {/* Statistics */}
        <Card className="border-border/50 shadow-elegant mx-4">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg md:text-xl">Skill Map Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="text-center p-2 md:p-4">
                <div className="text-xl md:text-2xl font-bold text-blue-600">{skills?.length || 0}</div>
                <p className="text-xs md:text-sm text-gray-500">Total Skills</p>
              </div>
              
              <div className="text-center p-2 md:p-4">
                <div className="text-xl md:text-2xl font-bold text-green-600">
                  {Math.max(...(skills?.map(s => s.level) || [0]))}
                </div>
                <p className="text-xs md:text-sm text-gray-500">Max Level</p>
              </div>
              
              <div className="text-center p-2 md:p-4">
                <div className="text-xl md:text-2xl font-bold text-purple-600">
                  {connections?.length || 0}
                </div>
                <p className="text-xs md:text-sm text-gray-500">Connections</p>
              </div>
              
              <div className="text-center p-2 md:p-4">
                <div className="text-xl md:text-2xl font-bold text-orange-600">
                  {skills?.filter(s => s.level === 1).length || 0}
                </div>
                <p className="text-xs md:text-sm text-gray-500">Starting Skills</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default SkillMap 