import { Button } from './ui/button'
import { BookOpen, MousePointer, Copy, Search, X } from 'lucide-react'

interface InstructionsModalProps {
  open: boolean
  onClose: () => void
}

function InstructionsModal({ open, onClose }: InstructionsModalProps) {
  if (!open) return null

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              Welcome to Documentation Explorer
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-base mt-2">
              Explore the codebase documentation interactively
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-5rem)]">
        
        <div className="space-y-6 mt-6">
          <div>
            <h3 className="font-semibold text-lg mb-3">What is this?</h3>
            <p className="text-gray-600 dark:text-gray-400">
              This AI-powered documentation explorer helps you navigate the Proto Portal codebase.
              Ask questions in natural language, and Claude will analyze your query to provide direct links to the most relevant files on GitHub.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-3">How to use:</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Search className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">Ask Questions</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Type any question about the codebase in the large text area. Claude will analyze your question and find the most relevant code. For example:
                    "Where is the Claude API integration?" or "Show me the design tokens" or "How does the skill mapping prototype work?"
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <MousePointer className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">Click Floating Documents</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    The floating text in the background represents actual documentation files.
                    Click on any of them to view their content.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Copy className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">Copy and Explore</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Copy content from the documentation and paste it into the search box
                    to find related code files and implementations. The results show confidence levels and whether Claude AI or keyword matching was used.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm">
              <strong>Note:</strong> This tool always returns a link to the actual codebase at{' '}
              <a 
                href="https://github.com/nsuberi/proto-portal-showcase-hub" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
              >
                github.com/nsuberi/proto-portal-showcase-hub
              </a>
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={onClose} size="lg">
              Get Started
            </Button>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

export default InstructionsModal