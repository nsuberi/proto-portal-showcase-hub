import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ExternalLink, X, Copy, Check, Brain, RotateCcw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { askDocumentationQuestion, DocumentationAnalysis, fetchDocumentationFiles, DocumentData } from '@/services/documentationService'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function DocumentationExplorer() {
  const [question, setQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<DocumentationAnalysis | null>(null)
  const [selectedDocument, setSelectedDocument] = useState<DocumentData | null>(null)
  const [copied, setCopied] = useState(false)
  const [documentsData, setDocumentsData] = useState<DocumentData[]>([])
  const [isLoadingDocs, setIsLoadingDocs] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  // Floating background text: intentionally softer than foreground content,
  // but visible enough to read and invite clicks. /70 opacity on dark bg passes AA large text (3:1).
  const getCategoryColors = (category?: string) => {
    switch (category) {
      case 'memory': return 'text-amber-400/70 hover:text-amber-300 hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]'
      case 'skill': return 'text-violet-400/70 hover:text-violet-300 hover:drop-shadow-[0_0_8px_rgba(167,139,250,0.4)]'
      case 'tool': return 'text-blue-400/70 hover:text-blue-300 hover:drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]'
      case 'concept': return 'text-teal-400/70 hover:text-teal-300 hover:drop-shadow-[0_0_8px_rgba(45,212,191,0.4)]'
      default: return 'text-slate-400/70 hover:text-slate-300'
    }
  }

  const getCategoryBadge = (category?: string) => {
    switch (category) {
      case 'memory': return { label: 'Memory', bg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' }
      case 'skill': return { label: 'Skill', bg: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300' }
      case 'tool': return { label: 'MCP Tool', bg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' }
      case 'concept': return { label: 'Concept', bg: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300' }
      default: return { label: 'Item', bg: 'bg-muted text-muted-foreground' }
    }
  }

  // Fetch documentation files on component mount
  useEffect(() => {
    const loadDocumentation = async () => {
      try {
        setIsLoadingDocs(true)
        const { documents } = await fetchDocumentationFiles()
        setDocumentsData(documents)
      } catch (error) {
        console.error('Failed to load documentation:', error)
        toast.error('Failed to load documentation files')
      } finally {
        setIsLoadingDocs(false)
      }
    }

    loadDocumentation()
  }, [])

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      toast.error('Please enter a question')
      return
    }

    setIsLoading(true)
    try {
      const result = await askDocumentationQuestion(question)
      setResponse(result)
      
      // Show different success messages based on confidence
      if (result.confidence > 0.7) {
        toast.success('Claude found highly relevant files!')
      } else {
        toast.success('Claude analysis completed')
      }
    } catch (error) {
      console.error('Error asking question:', error)
      if (error.message?.includes('temporarily unavailable')) {
        toast.error('Documentation service is currently unavailable. Please try again when the connection to Claude is restored.')
      } else {
        toast.error('Failed to process question. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleClearRecommendations = () => {
    setResponse(null)
    setQuestion('')
  }

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault()
      handleAskQuestion()
    }
  }

  if (isLoadingDocs) {
    return (
      <div className="relative min-h-[calc(100vh-8rem)] overflow-hidden flex items-center justify-center">
        <Card className="bg-card backdrop-blur-sm shadow-xl">
          <CardContent className="py-8">
            <div className="flex items-center justify-center space-x-4">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Loading agent configuration...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="relative min-h-[calc(100vh-8rem)] overflow-hidden">
      {/* Floating Document Titles Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {documentsData.map((doc, index) => (
          <motion.div
            key={doc.id}
            className={`text-lg sm:text-xl lg:text-2xl font-bold ${getCategoryColors(doc.category)} select-none pointer-events-auto cursor-pointer transition-colors ${
              index % 2 === 0 ? 'floating-text' : 'floating-text-reverse'
            }`}
            style={{
              left: `${doc.position?.x || (10 + Math.random() * 60)}%`,
              top: `${doc.position?.y || (10 + Math.random() * 60)}%`,
              '--float-duration': `${doc.floatDuration || (60 + index * 10)}s`,
              '--float-delay': `${doc.floatDelay || index * 5}s`,
            } as React.CSSProperties}
            onClick={() => setSelectedDocument(doc)}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          >
            {doc.title}
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto pt-8 sm:pt-16 lg:pt-20 px-4">
        <Card className="bg-background/80 backdrop-blur-xl shadow-2xl border border-white/10 ring-1 ring-violet-500/20">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-xl sm:text-2xl lg:text-3xl text-center flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-violet-500" />
              Explore Agent Memory & Skills
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {/* Search Input */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5" />
                <textarea
                  placeholder="Ask about agent memory, skills, or configuration..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base min-h-[80px] sm:min-h-[100px] max-h-[150px] sm:max-h-[200px] resize-y rounded-lg border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoading}
                />
              </div>
              
              {/* Mobile: Stack vertically, Desktop: Side by side */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
                {/* Search limitation notice */}
                <div className="text-xs text-violet-200/80 bg-violet-950/30 border border-violet-500/20 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 sm:flex-1">
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-violet-500 mt-1.5 flex-shrink-0"></div>
                    <span>
                      <strong>Tip:</strong> Try "How does memory work?" or "What skills are available?"
                      <span className="hidden sm:inline"> Search finds relevant configuration files from the .claude/ directory.</span>
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2 sm:gap-3 sm:flex-shrink-0">
                {response && (
                  <Button
                    onClick={handleClearRecommendations}
                    variant="outline"
                    size="sm"
                    className="sm:size-lg"
                    disabled={isLoading}
                  >
                    <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm">Clear</span>
                  </Button>
                )}
                <Button
                  onClick={handleAskQuestion}
                  disabled={isLoading}
                  size="sm"
                  className="sm:size-lg px-4 sm:px-12"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Brain className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse" />
                      <span className="text-xs sm:text-sm">Thinking...</span>
                    </div>
                  ) : (
                    <>
                      <Search className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="text-xs sm:text-sm">Search</span>
                    </>
                  )}
                </Button>
                </div>
              </div>
            </div>

            {/* Response */}
            {response && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {/* Main Result Header */}
                <div className="p-4 bg-indigo-950/30 rounded-lg border border-indigo-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-semibold text-lg">Relevant Agent Configuration:</h3>
                    <div className="flex items-center gap-2">
                      {/* Confidence indicator */}
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${
                          response.confidence > 0.8 ? 'bg-green-500' :
                          response.confidence > 0.6 ? 'bg-yellow-500' : 'bg-orange-500'
                        }`} />
                        <span className="text-xs text-slate-400">
                          {Math.round(response.confidence * 100)}% match
                        </span>
                      </div>
                      {/* Source indicator */}
                      <span className="text-xs px-2 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        🤖 AI Analysis
                      </span>
                    </div>
                  </div>

                  {/* Justification */}
                  <div className="text-sm text-slate-300 bg-white/5 p-3 rounded mb-3">
                    <strong>Why these are relevant:</strong> {response.justification}
                  </div>

                  {/* File List */}
                  <div className="space-y-2">
                    {response.files.map((file, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-white/5 rounded border border-white/10 hover:bg-white/8 transition-colors">
                        <div className="flex-shrink-0 w-6 h-6 bg-indigo-500/30 text-indigo-200 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 underline font-mono text-sm break-all flex items-center gap-2"
                              >
                                {file.path}
                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                              </a>
                              <p className="text-sm text-slate-400 mt-1">
                                {file.reason}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyContent(file.url)}
                              className="flex-shrink-0 h-6 w-6 p-0"
                            >
                              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Analysis Summary */}
                  <div className="text-xs text-slate-400 mt-3 p-2 bg-white/5 rounded">
                    <strong>Analysis:</strong> {response.reasoning}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Legend & Instructions */}
            <div className="text-center text-sm text-slate-400 space-y-2">
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>Memories</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span>
                  <span>Skills</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span>MCP Tools</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                  <span>Concepts</span>
                </span>
              </div>
              <p>Click the floating items to explore how the AI agent is configured for this project.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Viewer Modal */}
      <AnimatePresence>
        {selectedDocument && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedDocument(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 text-slate-100 rounded-lg shadow-2xl ring-1 ring-white/10 max-w-3xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold">{selectedDocument.filename}</h2>
                  {selectedDocument.category && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getCategoryBadge(selectedDocument.category).bg}`}>
                      {getCategoryBadge(selectedDocument.category).label}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDocument(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-5rem)]">
                <div className="prose prose-base prose-invert max-w-none prose-headings:font-bold prose-headings:text-slate-100 prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-h4:text-base prose-h5:text-sm prose-h6:text-sm prose-pre:bg-slate-800/60 prose-code:bg-slate-800/60 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-slate-100 prose-a:text-blue-400 hover:prose-a:text-blue-300">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ href, children, ...props }) => (
                        <a
                          href={href}
                          target={href?.startsWith('http') ? '_blank' : undefined}
                          rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                          className="text-blue-400 hover:text-blue-300 underline"
                          {...props}
                        >
                          {children}
                        </a>
                      ),
                      code: ({ className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '')
                        return match ? (
                          <code className={`${className} block bg-slate-800/60 p-3 rounded-lg text-sm overflow-x-auto`} {...props}>
                            {children}
                          </code>
                        ) : (
                          <code className={`${className} bg-slate-800/60 px-1 py-0.5 rounded text-sm`} {...props}>
                            {children}
                          </code>
                        )
                      },
                    }}
                  >
                    {selectedDocument.content}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DocumentationExplorer