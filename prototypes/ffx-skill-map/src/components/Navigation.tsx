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
              <span className="text-xl font-bold text-foreground">Expert Sphere Grid</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <a 
              href="/"
              className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Portfolio</span>
            </a>
          </div>
        </div>

      </div>
    </nav>
  )
}

export default Navigation 