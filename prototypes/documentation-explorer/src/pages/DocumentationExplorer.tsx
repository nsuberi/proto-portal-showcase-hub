import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ExternalLink, X, Copy, Check, Brain, RotateCcw } from 'lucide-react'
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
        <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-xl">
          <CardContent className="py-8">
            <div className="flex items-center justify-center space-x-4">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Loading documentation files...</span>
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
            className={`text-lg sm:text-xl lg:text-2xl font-bold text-gray-500/50 dark:text-gray-400/50 select-none pointer-events-auto cursor-pointer hover:text-primary/60 transition-colors ${
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
        <Card className="bg-white/10 dark:bg-black/10 backdrop-blur-sm shadow-2xl border border-white/30 dark:border-white/20 ring-1 ring-blue-200/30 dark:ring-blue-400/20">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-xl sm:text-2xl lg:text-3xl text-center">
              Ask About the Codebase
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {/* Search Input */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <textarea
                  placeholder="Ask a question about the codebase and we'll return relevant files..."
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
                <div className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/30 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 sm:flex-1">
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                    <span>
                      <strong>Note:</strong> Search analyzes file names/paths only. 
                      <span className="hidden sm:inline">File content analysis is not yet included in the search scope.</span>
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
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-semibold text-lg">Recommended Files to Explore:</h3>
                    <div className="flex items-center gap-2">
                      {/* Confidence indicator */}
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${
                          response.confidence > 0.8 ? 'bg-green-500' :
                          response.confidence > 0.6 ? 'bg-yellow-500' : 'bg-orange-500'
                        }`} />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {Math.round(response.confidence * 100)}% match
                        </span>
                      </div>
                      {/* Source indicator */}
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                        🤖 AI Analysis
                      </span>
                    </div>
                  </div>

                  {/* Justification */}
                  <div className="text-sm text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 p-3 rounded mb-3">
                    <strong>Why these files:</strong> {response.justification}
                  </div>

                  {/* File List */}
                  <div className="space-y-2">
                    {response.files.map((file, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded border">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline font-mono text-sm break-all flex items-center gap-2"
                              >
                                {file.path}
                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                              </a>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded">
                    <strong>Analysis:</strong> {response.reasoning}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Instructions */}
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              <p>The floating document titles in the background represent the currently written documentation for this project. Click on them to learn more.</p>
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
              className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-bold">{selectedDocument.filename}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDocument(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-5rem)]">
                <div className="prose prose-base max-w-none dark:prose-invert prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-h4:text-base prose-h5:text-sm prose-h6:text-sm prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // Custom heading components to ensure proper styling
                      h1: ({ children, ...props }) => (
                        <h1 className="text-2xl font-bold mb-4 mt-6 text-gray-900 dark:text-gray-100" {...props}>
                          {children}
                        </h1>
                      ),
                      h2: ({ children, ...props }) => (
                        <h2 className="text-xl font-bold mb-3 mt-5 text-gray-900 dark:text-gray-100" {...props}>
                          {children}
                        </h2>
                      ),
                      h3: ({ children, ...props }) => (
                        <h3 className="text-lg font-bold mb-2 mt-4 text-gray-900 dark:text-gray-100" {...props}>
                          {children}
                        </h3>
                      ),
                      h4: ({ children, ...props }) => (
                        <h4 className="text-base font-bold mb-2 mt-3 text-gray-900 dark:text-gray-100" {...props}>
                          {children}
                        </h4>
                      ),
                      h5: ({ children, ...props }) => (
                        <h5 className="text-sm font-bold mb-1 mt-3 text-gray-900 dark:text-gray-100" {...props}>
                          {children}
                        </h5>
                      ),
                      h6: ({ children, ...props }) => (
                        <h6 className="text-sm font-bold mb-1 mt-2 text-gray-900 dark:text-gray-100" {...props}>
                          {children}
                        </h6>
                      ),
                      // Custom link component to handle external links properly
                      a: ({ href, children, ...props }) => (
                        <a
                          href={href}
                          target={href?.startsWith('http') ? '_blank' : undefined}
                          rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                          {...props}
                        >
                          {children}
                        </a>
                      ),
                      // Custom code block styling
                      code: ({ className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '')
                        return match ? (
                          <code className={`${className} block bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm overflow-x-auto`} {...props}>
                            {children}
                          </code>
                        ) : (
                          <code className={`${className} bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm`} {...props}>
                            {children}
                          </code>
                        )
                      },
                      // Custom paragraph styling
                      p: ({ children, ...props }) => (
                        <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed" {...props}>
                          {children}
                        </p>
                      ),
                      // Custom list styling
                      ul: ({ children, ...props }) => (
                        <ul className="mb-4 pl-5 list-disc text-gray-700 dark:text-gray-300" {...props}>
                          {children}
                        </ul>
                      ),
                      ol: ({ children, ...props }) => (
                        <ol className="mb-4 pl-5 list-decimal text-gray-700 dark:text-gray-300" {...props}>
                          {children}
                        </ol>
                      ),
                      li: ({ children, ...props }) => (
                        <li className="mb-1" {...props}>
                          {children}
                        </li>
                      )
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