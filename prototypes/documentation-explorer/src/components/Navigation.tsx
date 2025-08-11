import { Button } from './ui/button'
import { ArrowLeft, Info, Book } from 'lucide-react'

interface NavigationProps {
  onShowInstructions: () => void
}

function Navigation({ onShowInstructions }: NavigationProps) {
  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-lg sm:text-xl font-bold text-primary flex items-center gap-2">
                <Book className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="hidden sm:inline">Documentation Explorer</span>
                <span className="sm:hidden">Doc Explorer</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onShowInstructions}
              className="flex items-center gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
            >
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">How to Use</span>
              <span className="sm:hidden">Help</span>
            </Button>
            <Button 
              asChild
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-lg hover:shadow-purple-500/25 text-xs sm:text-sm"
            >
              <a href="/" className="flex items-center space-x-1 sm:space-x-2">
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
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