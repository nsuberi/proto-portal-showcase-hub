import { askDocumentationQuestion } from './documentationService'

describe('documentationService', () => {
  describe('askDocumentationQuestion', () => {
    it('should return API link for Claude API questions', async () => {
      const result = await askDocumentationQuestion('Where is the Claude API?')
      expect(result).toContain('github.com')
      expect(result).toContain('claude-service')
    })

    it('should return design tokens link for design system questions', async () => {
      const result = await askDocumentationQuestion('Show me the design tokens')
      expect(result).toContain('github.com')
      expect(result).toContain('design-tokens')
    })

    it('should return ffx link for skill map questions', async () => {
      const result = await askDocumentationQuestion('Where is the skill map prototype?')
      expect(result).toContain('github.com')
      expect(result).toContain('ffx-skill-map')
    })

    it('should return default link for unclear questions', async () => {
      const result = await askDocumentationQuestion('Random question that does not match')
      expect(result).toContain('github.com')
      expect(result).toContain('proto-portal-showcase-hub')
    })

    it('should return portfolio link for main page questions', async () => {
      const result = await askDocumentationQuestion('Where is the main portfolio page?')
      expect(result).toContain('github.com')
      expect(result).toContain('Portfolio')
    })

    it('should handle empty questions gracefully', async () => {
      const result = await askDocumentationQuestion('')
      expect(result).toContain('github.com')
    })
  })
})