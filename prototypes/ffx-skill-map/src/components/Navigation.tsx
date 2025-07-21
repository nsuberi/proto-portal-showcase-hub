import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Sword, ArrowLeft } from 'lucide-react'

const Navigation = () => {
  const location = useLocation()


  return (
    <nav className="bg-background border-b border-border/50 shadow-elegant">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <Sword className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-primary">
                Final Fantasy X Skill Map for Employees
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button 
              asChild
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
            >
              <a href="/" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Portfolio</span>
              </a>
            </Button>
          </div>
        </div>

      </div>
    </nav>
  )
}

export default Navigation 