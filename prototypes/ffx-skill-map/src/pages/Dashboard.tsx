import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { neo4jService } from '../services/neo4j'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Sword, Users, Brain, Target, TrendingUp, Award } from 'lucide-react'

const Dashboard = () => {
  const { data: skills, isLoading: skillsLoading } = useQuery({
    queryKey: ['skills'],
    queryFn: () => neo4jService.getAllSkills(),
  })

  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => neo4jService.getAllEmployees(),
  })

  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ['statistics'],
    queryFn: () => neo4jService.getSkillStatistics(),
  })

  if (skillsLoading || employeesLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    )
  }

  const skillCount = skills?.length || 0
  const employeeCount = employees?.length || 0
  const totalMasteredSkills = employees?.reduce((total, emp) => total + emp.mastered_skills.length, 0) || 0

  // Prepare chart data
  const categoryData = statistics?.map(stat => ({
    name: stat.category,
    total: stat.totalSkills,
    mastered: stat.masteredCount,
    avgLevel: Math.round(stat.avgLevel * 10) / 10
  })) || []

  const pieData = categoryData.map(item => ({
    name: item.name,
    value: item.total
  }))

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Final Fantasy X Skill Map
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          A graph-based skill development system inspired by Final Fantasy X's Sphere Grid.
          Track employee skills, take assessments, and get personalized recommendations.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Skills</CardTitle>
            <Sword className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{skillCount}</div>
            <p className="text-xs text-muted-foreground">
              Available in the skill map
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employeeCount}</div>
            <p className="text-xs text-muted-foreground">
              Registered in the system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mastered Skills</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMasteredSkills}</div>
            <p className="text-xs text-muted-foreground">
              Skills mastered by employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Skills/Employee</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {employeeCount > 0 ? Math.round(totalMasteredSkills / employeeCount) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Average skills per person
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Skills by Category</CardTitle>
            <CardDescription>
              Distribution of skills across different categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skill Mastery by Category</CardTitle>
            <CardDescription>
              Total vs mastered skills in each category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#8884d8" name="Total Skills" />
                <Bar dataKey="mastered" fill="#82ca9d" name="Mastered Skills" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Get started with the skill map system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/skill-map">
              <Button className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <Sword className="h-6 w-6" />
                <span>Explore Skill Map</span>
              </Button>
            </Link>
            
            <Link to="/quiz">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <Brain className="h-6 w-6" />
                <span>Take Skill Quiz</span>
              </Button>
            </Link>
            
            <Link to="/recommendations">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <Target className="h-6 w-6" />
                <span>Get Recommendations</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest updates in the skill map system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Database seeded with FFX skill data</p>
                <p className="text-xs text-gray-500">48 skills and 8 sample employees added</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Skill quiz system implemented</p>
                <p className="text-xs text-gray-500">10 questions to infer employee skills</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Recommendation engine active</p>
                <p className="text-xs text-gray-500">AI-powered skill suggestions available</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard 