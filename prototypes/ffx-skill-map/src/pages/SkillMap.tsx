import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@proto-portal/design-system'
import { Badge } from '@proto-portal/design-system'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@proto-portal/design-system'
import { neo4jService } from '../services/neo4j'
import { useState } from 'react'
import { Sword, Zap, Heart, Star, Crown, Filter } from 'lucide-react'

const SkillMap = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')

  const { data: skills, isLoading } = useQuery({
    queryKey: ['skills'],
    queryFn: () => neo4jService.getAllSkills(),
  })

  const { data: connections } = useQuery({
    queryKey: ['connections'],
    queryFn: () => neo4jService.getSkillConnections(),
  })

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Skill Map</h1>
        <p className="text-gray-600 mt-2">
          Explore the Final Fantasy X-inspired skill grid. Skills are organized by level and category, 
          with arrows showing prerequisites and dependencies.
        </p>
      </div>

      {/* Filters */}
      <Card>
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
              <Card key={level}>
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
                      
                      return (
                        <div
                          key={skill.id}
                          className={`p-4 rounded-lg border skill-node skill-${skill.category}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getCategoryIcon(skill.category)}
                              <h4 className="font-medium text-sm">{skill.name}</h4>
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
          <Card>
            <CardContent className="text-center py-12">
              <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                No skills match the current filters. Try adjusting your selection.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Legend */}
      <Card>
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
      <Card>
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
  )
}

export default SkillMap 