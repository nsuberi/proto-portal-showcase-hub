import { askDocumentationQuestion, DocumentationAnalysis } from './__mocks__/documentationService'

// Mock fetch globally
global.fetch = jest.fn()

describe('documentationService', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('askDocumentationQuestion', () => {
    it('should return DocumentationAnalysis object for successful API call', async () => {
      const mockResponse = {
        files: [
          {
            path: 'src/services/claude-service.js',
            url: 'https://github.com/example/repo/blob/main/src/services/claude-service.js',
            reason: 'Contains Claude API implementation'
          }
        ],
        confidence: 0.9,
        reasoning: 'Found relevant files based on your question',
        justification: 'These files contain the Claude API implementation you asked about'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await askDocumentationQuestion('Where is the Claude API?')
      
      expect(result).toHaveProperty('files')
      expect(result).toHaveProperty('confidence')
      expect(result).toHaveProperty('reasoning')
      expect(result).toHaveProperty('justification')
      expect(result).toHaveProperty('source', 'claude')
      expect(result.files).toHaveLength(1)
      expect(result.files[0].url).toContain('github.com')
      expect(result.confidence).toBe(0.9)
    })

    it('should throw error when API call fails', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      await expect(askDocumentationQuestion('test question'))
        .rejects
        .toThrow('Documentation service is temporarily unavailable')
    })

    it('should throw error when fetch fails', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      await expect(askDocumentationQuestion('test question'))
        .rejects
        .toThrow('Documentation service is temporarily unavailable')
    })

    it('should handle empty question', async () => {
      const mockResponse = {
        files: [],
        confidence: 0.1,
        reasoning: 'Empty question provided',
        justification: 'No files could be recommended for an empty question'
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await askDocumentationQuestion('')
      
      expect(result).toHaveProperty('files')
      expect(result.files).toHaveLength(0)
      expect(result.confidence).toBeLessThan(0.5)
    })
  })
})