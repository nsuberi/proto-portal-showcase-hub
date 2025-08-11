// Note: codebaseLinks will be fetched dynamically from API, but keep static import for fallback
import { codebaseLinks } from '@/data/documentsData'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV 
    ? 'http://localhost:3003/api' 
    : 'PLACEHOLDER_API_GATEWAY_URL/api')

interface DocumentationResponse {
  files: Array<{
    path: string
    url: string
    reason: string
  }>
  confidence: number
  reasoning?: string
  justification?: string
}

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

/**
 * Ask a question about the documentation and get a relevant codebase link
 */
export async function askDocumentationQuestion(question: string): Promise<DocumentationAnalysis> {
  try {
    // Try the API first for Claude analysis
    const response = await fetch(`${API_BASE_URL}/v1/documentation/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question })
    })

    if (!response.ok) {
      console.warn('API call failed', response.status, response.statusText)
      throw new Error('Documentation service is currently unavailable')
    }

    const data: DocumentationResponse = await response.json()
    return {
      files: data.files || [],
      confidence: data.confidence || 0.5,
      reasoning: data.reasoning || 'Analysis completed',
      justification: data.justification || 'Files selected based on your question',
      source: 'claude'
    }
  } catch (error) {
    console.error('Error asking documentation question:', error)
    throw new Error('Documentation service is temporarily unavailable. Please try again when the connection to Claude is restored.')
  }
}


export interface DocumentData {
  id: string;
  title: string;
  filename: string;
  content: string;
  position?: { x: number; y: number };
  floatDuration?: number;
  floatDelay?: number;
}

interface DocumentationFilesResponse {
  documents: DocumentData[];
  codebaseLinks: Record<string, string>;
}

/**
 * Fetch all documentation files from the API
 */
export async function fetchDocumentationFiles(): Promise<{ documents: DocumentData[], codebaseLinks: Record<string, string> }> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/documentation/files`)
    if (!response.ok) {
      throw new Error('Failed to fetch documentation files')
    }
    
    const data: DocumentationFilesResponse = await response.json()
    return {
      documents: data.documents,
      codebaseLinks: data.codebaseLinks
    }
  } catch (error) {
    console.error('Error fetching documentation files:', error)
    
    // Return fallback data from the existing hardcoded data
    const { documentsData } = await import('@/data/documentsData')
    return {
      documents: documentsData,
      codebaseLinks
    }
  }
}

/**
 * Get metadata about a documentation file
 */
export async function getDocumentationMetadata(filename: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/documentation/metadata/${filename}`)
    if (!response.ok) {
      throw new Error('Failed to fetch metadata')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching documentation metadata:', error)
    return null
  }
}