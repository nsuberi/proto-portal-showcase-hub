import { Button } from './ui/button'
import { Brain, MousePointer, ExternalLink, Search, X, Layers, Wrench } from 'lucide-react'

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
              <Brain className="w-6 h-6 text-primary" />
              Agent Memory & Skills
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-base mt-2">
              Explore how AI agents are configured for this project
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
              This interactive explorer shows how Claude Code is configured to work on this portfolio project.
              It visualizes the agent's <strong>persistent memories</strong> (cross-session context),
              <strong>skills</strong> (reusable workflows), and the <strong>system concepts</strong> that tie them together.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-3">How to use:</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <MousePointer className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">Click Floating Items</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    The floating text in the background represents actual agent configuration.
                    Click any item to view its full content. Items are color-coded by type.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Search className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">Ask Questions</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Type a question in the search box to find relevant agent configuration files.
                    For example: "How does memory work?" or "What skills are available?" or
                    "How is the breadboarding workflow structured?"
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Layers className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">Four Layers of Configuration</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1"></span>
                    <strong>Memories</strong> — persistent context the agent carries between sessions<br />
                    <span className="inline-block w-2 h-2 rounded-full bg-violet-500 mr-1"></span>
                    <strong>Skills</strong> — reusable workflows invoked with slash commands<br />
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1"></span>
                    <strong>MCP Tools</strong> — live, queryable access to project data via the proto-mcp CLI<br />
                    <span className="inline-block w-2 h-2 rounded-full bg-teal-500 mr-1"></span>
                    <strong>Concepts</strong> — how the memory, skills, and tools systems work
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">MCP: Live Data for AI Agents</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    MCP (Model Context Protocol) servers give Claude structured, queryable access to project-specific data.
                    The <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">proto-mcp</code> CLI runs
                    servers locally via stdio &mdash; versioned, shareable, no remote infrastructure.
                    The design-tokens server is the first example: 4 tools, 9 resources, 2 prompt templates.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <ExternalLink className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">Explore the Source</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Search results link directly to the source files on GitHub where memories and skills are defined.
                    Results include confidence levels and AI-powered reasoning.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm">
              <strong>Why this matters:</strong> Agent memory and skills represent a new paradigm in developer tooling &mdash;
              encoding institutional knowledge so AI agents work consistently across sessions.
              This explorer makes that invisible configuration layer visible and interactive.
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
