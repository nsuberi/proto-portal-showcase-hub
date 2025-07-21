import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Sword, ArrowLeft } from 'lucide-react'

const Navigation = () => {
  const location = useLocation()


  return (
    <nav className="bg-background border-b border-border/50 shadow-elegant">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center space-x-2 md:space-x-8 flex-1 min-w-0">
            <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
              <Sword className="h-6 w-6 md:h-8 md:w-8 text-primary flex-shrink-0" />
              <span className="text-sm md:text-xl font-bold text-primary truncate">
                <span className="hidden sm:inline">Final Fantasy X Skill Map for Employees</span>
                <span className="sm:hidden">FFX Skill Map</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
            <Button 
              asChild
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-lg hover:shadow-purple-500/25 text-xs md:text-sm"
            >
              <a href="/" className="flex items-center space-x-1 md:space-x-2">
                <ArrowLeft className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Back to Portfolio</span>
                <span className="sm:hidden">Back</span>
              </a>
            </Button>
          </div>
        </div>

      </div>
    </nav>
  )
}

export default Navigation 