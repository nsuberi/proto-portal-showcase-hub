import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { neo4jService } from '../services/neo4j'
import { Target, TrendingUp, Clock, Star, ArrowRight } from 'lucide-react'

const Recommendations = () => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')

  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => neo4jService.getAllEmployees(),
  })

  const { data: recommendations, isLoading: recommendationsLoading } = useQuery({
    queryKey: ['recommendations', selectedEmployeeId],
    queryFn: () => neo4jService.getSkillRecommendations(selectedEmployeeId),
    enabled: !!selectedEmployeeId,
  })

  const { data: employeeSkills } = useQuery({
    queryKey: ['employee-skills', selectedEmployeeId],
    queryFn: () => neo4jService.getEmployeeSkills(selectedEmployeeId),
    enabled: !!selectedEmployeeId,
  })

  const { data: availableSkills } = useQuery({
    queryKey: ['available-skills', selectedEmployeeId],
    queryFn: () => neo4jService.getAvailableSkills(selectedEmployeeId),
    enabled: !!selectedEmployeeId,
  })

  if (employeesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading employees...</div>
      </div>
    )
  }

  const selectedEmployee = employees?.find(emp => emp.id === selectedEmployeeId)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Star className="h-4 w-4 text-red-600" />
      case 'medium':
        return <TrendingUp className="h-4 w-4 text-yellow-600" />
      case 'low':
        return <Clock className="h-4 w-4 text-green-600" />
      default:
        return <Target className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Skill Recommendations</h1>
        <p className="text-gray-600 mt-2">
          Get personalized skill recommendations based on your current abilities and the Final Fantasy X skill map.
        </p>
      </div>

      {/* Employee Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Employee</CardTitle>
          <CardDescription>
            Choose an employee to view their personalized skill recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
            <SelectTrigger className="w-full md:w-96">
              <SelectValue placeholder="Select an employee..." />
            </SelectTrigger>
            <SelectContent>
              {employees?.map(employee => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.name} - {employee.role} ({employee.department})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedEmployee && (
        <>
          {/* Employee Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Employee Overview</CardTitle>
              <CardDescription>
                Current skills and learning path for {selectedEmployee.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Current Skills</h3>
                  <div className="text-2xl font-bold text-blue-600">
                    {employeeSkills?.length || 0}
                  </div>
                  <p className="text-sm text-gray-500">Skills mastered</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Available Skills</h3>
                  <div className="text-2xl font-bold text-green-600">
                    {availableSkills?.length || 0}
                  </div>
                  <p className="text-sm text-gray-500">Skills ready to learn</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Recommendations</h3>
                  <div className="text-2xl font-bold text-purple-600">
                    {recommendations?.length || 0}
                  </div>
                  <p className="text-sm text-gray-500">Personalized suggestions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Current Skills</CardTitle>
              <CardDescription>
                Skills that {selectedEmployee.name} has already mastered
              </CardDescription>
            </CardHeader>
            <CardContent>
              {employeeSkills && employeeSkills.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {employeeSkills.map(skill => (
                    <div
                      key={skill.id}
                      className={`p-4 rounded-lg border skill-${skill.category} skill-mastered`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{skill.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{skill.description}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          L{skill.level}
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {skill.category}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No skills mastered yet. Take the quiz to get started!
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommendations */}
          {recommendationsLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-lg">Loading recommendations...</div>
              </CardContent>
            </Card>
          ) : recommendations && recommendations.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Recommended Next Steps</CardTitle>
                <CardDescription>
                  Skills recommended for {selectedEmployee.name} based on current abilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendations.map((recommendation, index) => (
                    <div
                      key={recommendation.skill.id}
                      className={`p-6 rounded-lg border recommendation-${recommendation.priority}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getPriorityIcon(recommendation.priority)}
                            <h3 className="font-semibold text-lg">{recommendation.skill.name}</h3>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getPriorityColor(recommendation.priority)}`}
                            >
                              {recommendation.priority} priority
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 mb-3">{recommendation.skill.description}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                            <span>Level {recommendation.skill.level}</span>
                            <span>•</span>
                            <span className="capitalize">{recommendation.skill.category}</span>
                          </div>
                          
                          <p className="text-sm font-medium text-gray-700 mb-3">
                            {recommendation.reason}
                          </p>
                          
                          {recommendation.prerequisites.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Prerequisites:</p>
                              <div className="flex flex-wrap gap-1">
                                {recommendation.prerequisites.map(prereq => (
                                  <Badge key={prereq.id} variant="outline" className="text-xs">
                                    {prereq.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="ml-4">
                          <Button variant="outline" size="sm">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  No recommendations available. This might be because you've mastered all available skills or need to take the quiz first.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Available Skills */}
          {availableSkills && availableSkills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>All Available Skills</CardTitle>
                <CardDescription>
                  Skills that {selectedEmployee.name} can learn next (not prioritized)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableSkills.map(skill => (
                    <div
                      key={skill.id}
                      className={`p-4 rounded-lg border skill-${skill.category} skill-available`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{skill.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{skill.description}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          L{skill.level}
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {skill.category}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How Recommendations Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <Star className="h-4 w-4 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">High Priority</p>
                <p>Essential skills that will significantly advance your career path</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <TrendingUp className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Medium Priority</p>
                <p>Valuable skills that complement your current abilities</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Low Priority</p>
                <p>Nice-to-have skills for future development</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Recommendations 