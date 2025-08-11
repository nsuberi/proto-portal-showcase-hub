// Mock implementation for testing
export interface DocumentationAnalysis {
  files: Array<{
    path: string
    url: string
    reason: string
  }>
  confidence: number
  reasoning: string
  justification: string
  source: 'claude'
}

export interface DocumentData {
  id: string
  title: string
  filename: string
  content: string
  position?: { x: number; y: number }
  floatDuration?: number
  floatDelay?: number
}

export async function askDocumentationQuestion(question: string): Promise<DocumentationAnalysis> {
  try {
    // Mock implementation that uses fetch
    const response = await fetch('http://localhost:3003/api/v1/documentation/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question })
    })

    if (!response.ok) {
      throw new Error('Documentation service is temporarily unavailable. Please try again when the connection to Claude is restored.')
    }

    const data = await response.json()
    return {
      files: data.files || [],
      confidence: data.confidence || 0.5,
      reasoning: data.reasoning || 'Analysis completed',
      justification: data.justification || 'Files selected based on your question',
      source: 'claude'
    }
  } catch (error) {
    throw new Error('Documentation service is temporarily unavailable. Please try again when the connection to Claude is restored.')
  }
}

export async function fetchDocumentationFiles(): Promise<{ documents: DocumentData[], codebaseLinks: Record<string, string> }> {
  return {
    documents: [],
    codebaseLinks: {}
  }
}

export async function getDocumentationMetadata(filename: string) {
  return null
}