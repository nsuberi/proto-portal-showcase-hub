import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { neo4jService } from '../services/neo4j'
import { useState, useRef, useEffect } from 'react'
import { Sword, Zap, Heart, Star, Crown, Filter } from 'lucide-react'
import Sigma from 'sigma';
import Graph from 'graphology';
import { getGraphNodes } from './SkillMap.utils';

const CATEGORY_COLORS: Record<string, string> = {
  combat: '#ef4444',    // red-500
  magic: '#3b82f6',     // blue-500
  support: '#22c55e',   // green-500
  special: '#a21caf',   // purple-800
  advanced: '#eab308',  // yellow-500
  default: '#6b7280',   // gray-500
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
      nodeReducer: (node, data) => {
        // Handle transparency by converting hex to rgba when needed
        const hexToRgba = (hex, alpha) => {
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };
        
        let color = data.color;
        if (data.hasEmployeeSelected && !data.isMastered) {
          color = hexToRgba(data.color, 0.7);
        }
        
        return {
          ...data,
          label: data.label,
          color: color,
          size: data.size,
          zIndex: data.zIndex,
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
  
  // Update graph data when dependencies change
  useEffect(() => {
    if (!skills || !connections || !sigmaInstanceRef.current) return;
    
    const graph = sigmaInstanceRef.current.getGraph();
    
    // Clear existing graph
    graph.clear();
    
    // Add nodes with updated data
    const nodes = getGraphNodes(skills, masteredSkills, CATEGORY_COLORS);
    nodes.forEach(node => {
      graph.addNode(node.id, node);
    });
    
    // Add edges
    connections.forEach(conn => {
      if (graph.hasNode(conn.from) && graph.hasNode(conn.to)) {
        graph.addEdge(conn.from, conn.to);
      }
    });
    
    // Refresh the rendering
    if (sigmaInstanceRef.current.getGraph().order > 0) {
      sigmaInstanceRef.current.refresh({
        skipIndexation: true,
      });
    }
  }, [skills, connections, masteredSkills, selectedEmployeeId]);
  
  return (
    <div
      ref={sigmaContainerRef}
      style={{ width: "100%", height: 400, border: "1px solid #ccc", marginBottom: 16 }}
      data-testid="sigma-graph"
    />
  );
}

export { SigmaGraph };

const SkillMap = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')

  const { data: skills, isLoading } = useQuery({
    queryKey: ['skills'],
    queryFn: () => neo4jService.getAllSkills(),
  })

  const { data: connections } = useQuery({
    queryKey: ['connections'],
    queryFn: () => neo4jService.getSkillConnections(),
  })

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: () => neo4jService.getAllEmployees(),
  })

  // Find selected employee's mastered skills
  const selectedEmployee = employees?.find(emp => emp.id === selectedEmployeeId)
  const masteredSkills = selectedEmployee?.mastered_skills || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading skill map...</div>
      </div>
    )
  }

  // Filter skills based on selection
  const filteredSkills = skills?.filter(skill => {
    const matchesCategory = selectedCategory === 'all' || skill.category === selectedCategory
    const matchesLevel = selectedLevel === 'all' || skill.level.toString() === selectedLevel
    return matchesCategory && matchesLevel
  }) || []

  // Group skills by level
  const skillsByLevel = filteredSkills.reduce((acc, skill) => {
    if (!acc[skill.level]) {
      acc[skill.level] = []
    }
    acc[skill.level].push(skill)
    return acc
  }, {} as Record<number, typeof skills>)

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

  const getPrerequisites = (skillId: string) => {
    return connections?.filter(conn => conn.to === skillId).map(conn => conn.from) || []
  }

  const getDependents = (skillId: string) => {
    return connections?.filter(conn => conn.from === skillId).map(conn => conn.to) || []
  }

  return (
    <>
      {/* Employee dropdown */}
      <div style={{ maxWidth: 400, marginBottom: 16 }}>
        <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an employee to highlight mastered skills..." />
          </SelectTrigger>
          <SelectContent>
            {employees?.map(emp => (
              <SelectItem key={emp.id} value={emp.id}>
                {emp.name} - {emp.role}
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
      {/* Legend for node colors */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
        {Object.entries(CATEGORY_COLORS).filter(([k]) => k !== 'default').map(([cat, color]) => (
          <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: 8, background: color, border: '1px solid #ccc' }} />
            <span style={{ textTransform: 'capitalize', fontSize: 14 }}>{cat}</span>
          </div>
        ))}
      </div>
      {/* Existing SkillMap content below */}
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span style={{ color: "rgb(144, 19, 254)" }}>
              Skill Map
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore the Final Fantasy X-inspired skill grid. Skills are organized by level and category, 
            with arrows showing prerequisites and dependencies.
          </p>
        </div>

        {/* Filters */}
        <Card className="border-border/50 hover:border-primary/30 shadow-elegant transition-smooth">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Filter skills by category and level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
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
                <SelectTrigger>
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
        <div className="space-y-8">
          {Object.keys(skillsByLevel).length > 0 ? (
            Object.entries(skillsByLevel)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([level, levelSkills]) => (
                <Card key={level} className="border-border/50 hover:border-primary/30 shadow-elegant transition-smooth">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Level {level} Skills
                      <Badge variant="outline">{levelSkills.length} skills</Badge>
                    </CardTitle>
                    <CardDescription>
                      Skills available at level {level}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {levelSkills.map(skill => {
                        const prerequisites = getPrerequisites(skill.id)
                        const dependents = getDependents(skill.id)
                        const isMastered = masteredSkills.includes(skill.id)
                        const hasEmployeeSelected = selectedEmployeeId !== ''
                        
                        return (
                          <div
                            key={skill.id}
                            className={`p-4 rounded-lg border skill-node skill-${skill.category} transition-all duration-200 ${
                              hasEmployeeSelected 
                                ? isMastered 
                                  ? 'border-green-500 border-2 bg-green-50 shadow-md' 
                                  : 'border-gray-300 bg-gray-50 opacity-60'
                                : 'border-gray-200 bg-white'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getCategoryIcon(skill.category)}
                                <h4 className={`font-medium text-sm ${
                                  hasEmployeeSelected && isMastered ? 'text-green-800 font-semibold' : ''
                                }`}>
                                  {skill.name}
                                  {hasEmployeeSelected && isMastered && (
                                    <span className="ml-2 text-green-600">✓</span>
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
                                className={`text-xs ${getCategoryColor(skill.category)}`}
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
                  </CardContent>
                </Card>
              ))
          ) : (
            <Card className="border-border/50 shadow-elegant">
              <CardContent className="text-center py-12">
                <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No skills match the current filters. Try adjusting your selection.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Legend */}
        <Card className="border-border/50 shadow-elegant">
          <CardHeader>
            <CardTitle>Skill Categories</CardTitle>
            <CardDescription>
              Understanding the different types of skills in the map
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                <Sword className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">Combat</p>
                  <p className="text-xs text-red-600">Physical and tactical abilities</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <Zap className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">Magic</p>
                  <p className="text-xs text-blue-600">Elemental and arcane spells</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                <Heart className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Support</p>
                  <p className="text-xs text-green-600">Healing and buffing abilities</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 border border-purple-200">
                <Star className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-purple-800">Special</p>
                  <p className="text-xs text-purple-600">Unique utility abilities</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <Crown className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">Advanced</p>
                  <p className="text-xs text-yellow-600">High-level master abilities</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card className="border-border/50 shadow-elegant">
          <CardHeader>
            <CardTitle>Skill Map Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{skills?.length || 0}</div>
                <p className="text-sm text-gray-500">Total Skills</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.max(...(skills?.map(s => s.level) || [0]))}
                </div>
                <p className="text-sm text-gray-500">Max Level</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {connections?.length || 0}
                </div>
                <p className="text-sm text-gray-500">Connections</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {skills?.filter(s => s.level === 1).length || 0}
                </div>
                <p className="text-sm text-gray-500">Starting Skills</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default SkillMap 