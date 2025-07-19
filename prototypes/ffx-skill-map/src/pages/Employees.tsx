import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { neo4jService } from '../services/neo4j'
import { useState } from 'react'
import { Search, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const Employees = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => neo4jService.getAllEmployees(),
  })

  const { data: skills } = useQuery({
    queryKey: ['skills'],
    queryFn: () => neo4jService.getAllSkills(),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading employees...</div>
      </div>
    )
  }

  // Filter employees based on search and department
  const filteredEmployees = employees?.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.role.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = departmentFilter === 'all' || employee.department === departmentFilter
    return matchesSearch && matchesDepartment
  }) || []

  // Get unique departments
  const departments = [...new Set(employees?.map(emp => emp.department) || [])]

  // Get skill details for display
  const getSkillDetails = (skillIds: string[]) => {
    return skillIds.map(skillId => {
      const skill = skills?.find(s => s.id === skillId)
      return skill ? { ...skill, id: skillId } : null
    }).filter(Boolean)
  }

  // Get category counts for an employee
  const getCategoryCounts = (skillIds: string[]) => {
    const skillDetails = getSkillDetails(skillIds)
    const counts: Record<string, number> = {}
    
    skillDetails.forEach(skill => {
      if (skill) {
        counts[skill.category] = (counts[skill.category] || 0) + 1
      }
    })
    
    return counts
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
        <p className="text-gray-600 mt-2">
          View all employees and their mastered skills in the Final Fantasy X skill map system.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Search and filter employees by name, role, or department
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employee Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Skills Overview</CardTitle>
          <CardDescription>
            Showing {filteredEmployees.length} of {employees?.length || 0} employees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Skills Mastered</TableHead>
                <TableHead>Skill Categories</TableHead>
                <TableHead>Level Distribution</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => {
                const skillDetails = getSkillDetails(employee.mastered_skills)
                const categoryCounts = getCategoryCounts(employee.mastered_skills)
                
                // Calculate level distribution
                const levelCounts: Record<number, number> = {}
                skillDetails.forEach(skill => {
                  if (skill) {
                    levelCounts[skill.level] = (levelCounts[skill.level] || 0) + 1
                  }
                })

                return (
                  <TableRow key={employee.id} className="employee-card">
                    <TableCell>
                      <div>
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-sm text-gray-500">ID: {employee.id}</div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="font-medium">{employee.role}</div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline">{employee.department}</Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {employee.mastered_skills.length} skills
                        </div>
                        <div className="text-xs text-gray-500">
                          {skillDetails.map(skill => skill?.name).join(', ')}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(categoryCounts).map(([category, count]) => (
                          <Badge key={category} variant="secondary" className="text-xs">
                            {category}: {count}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(levelCounts).map(([level, count]) => (
                          <Badge key={level} variant="outline" className="text-xs">
                            L{level}: {count}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Most Skilled Employee</CardTitle>
          </CardHeader>
          <CardContent>
            {employees && employees.length > 0 && (
              <div>
                <div className="text-2xl font-bold">
                  {employees.reduce((max, emp) => 
                    emp.mastered_skills.length > max.mastered_skills.length ? emp : max
                  ).name}
                </div>
                <p className="text-xs text-gray-500">
                  {Math.max(...employees.map(emp => emp.mastered_skills.length))} skills mastered
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Most Popular Department</CardTitle>
          </CardHeader>
          <CardContent>
            {departments.length > 0 && (
              <div>
                <div className="text-2xl font-bold">
                  {departments.reduce((max, dept) => {
                    const count = employees?.filter(emp => emp.department === dept).length || 0
                    const maxCount = employees?.filter(emp => emp.department === max).length || 0
                    return count > maxCount ? dept : max
                  }, departments[0])}
                </div>
                <p className="text-xs text-gray-500">
                  {Math.max(...departments.map(dept => 
                    employees?.filter(emp => emp.department === dept).length || 0
                  ))} employees
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Average Skills per Employee</CardTitle>
          </CardHeader>
          <CardContent>
            {employees && employees.length > 0 && (
              <div>
                <div className="text-2xl font-bold">
                  {Math.round(employees.reduce((total, emp) => total + emp.mastered_skills.length, 0) / employees.length)}
                </div>
                <p className="text-xs text-gray-500">
                  skills on average
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Employees 