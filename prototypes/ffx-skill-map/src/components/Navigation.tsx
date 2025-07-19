import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Sword, Users, Brain, Target, BarChart3 } from 'lucide-react'

const Navigation = () => {
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Dashboard', icon: BarChart3 },
    { path: '/skill-map', label: 'Skill Map', icon: Sword },
    { path: '/employees', label: 'Employees', icon: Users },
    { path: '/quiz', label: 'Skill Quiz', icon: Brain },
    { path: '/recommendations', label: 'Recommendations', icon: Target },
  ]

  return (
    <nav className="bg-background border-b border-border/50 shadow-elegant">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <Sword className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">FFX Skill Map</span>
            </Link>
            
            <div className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                
                return (
                  <Link key={item.path} to={item.path}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={`flex items-center space-x-2 transition-smooth ${
                        isActive 
                          ? "bg-gradient-primary text-primary-foreground shadow-glow" 
                          : "hover:bg-primary/10 hover:text-primary"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">
              Final Fantasy X Skill Map Prototype
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden py-4 border-t border-border/50">
          <div className="flex flex-col space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start transition-smooth ${
                      isActive 
                        ? "bg-gradient-primary text-primary-foreground" 
                        : "hover:bg-primary/10 hover:text-primary"
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation 