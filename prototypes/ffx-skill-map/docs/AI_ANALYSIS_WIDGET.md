# AI Analysis Widget Documentation

## Overview

The AI Analysis Widget provides intelligent, personalized skill recommendations using Claude AI to analyze a character's current skills and suggest optimal learning paths. This widget helps users make strategic decisions about their character development by providing both short-term and long-term goal recommendations.

## Features

- **Secure API Key Management**: Safely store your Claude API key with clear security warnings
- **AI-Powered Analysis**: Leverages Claude AI to analyze skill patterns and recommend strategic paths
- **Goal Recommendations**: Provides both short-term (immediate) and long-term (strategic) skill goals
- **One-Click Goal Setting**: Click any recommended skill to automatically set it as your learning goal
- **Smart Navigation**: Automatically scrolls to the Goal Planner when a goal is selected
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Caching**: Results are cached to minimize API calls and improve performance

## Security Measures

### API Key Storage
- **Local Storage Only**: Your API key is stored locally in your browser's localStorage
- **No Server Storage**: The key never leaves your device except to make direct API calls to Claude
- **Encryption in Transit**: All API calls use HTTPS/TLS encryption
- **Clear Warnings**: Users are explicitly warned about API key security best practices
- **Easy Removal**: One-click option to clear stored API key

### Security Best Practices Implemented
1. **Input Validation**: All API inputs are validated and sanitized
2. **Error Handling**: Proper error handling prevents sensitive information leakage
3. **Rate Limiting Awareness**: Graceful handling of API rate limits
4. **HTTPS Only**: All API communications use secure protocols
5. **No Logging**: API keys are never logged or stored on servers

### What We DON'T Store
- API keys on any server
- Analysis results on servers (cached locally only)
- Personal information beyond what's needed for analysis

## How to Use

### 1. First-Time Setup
1. Navigate to the skill map page
2. Select an employee/character
3. Find the "AI Analysis" widget
4. Click "Get API Key" to get your Claude API key from Anthropic
5. Enter your API key and click "Save & Continue"

### 2. Getting AI Analysis
1. With an API key configured, click "Get AI Analysis of Next Steps"
2. Wait for Claude AI to analyze your character's skills
3. Review the analysis results including:
   - Current strengths
   - Skill gaps
   - Short-term goal recommendations
   - Long-term goal recommendations
   - Overall assessment

### 3. Setting Goals from Recommendations
1. Browse the recommended skills in the analysis results
2. Click "Set Goal" on any recommended skill
3. The widget automatically:
   - Sets the skill as your current goal
   - Scrolls to the Goal Planner widget
   - Updates skill recommendations based on your new goal

## API Integration

### Claude API Requirements
- **API Provider**: Anthropic Claude API
- **Model Used**: claude-3-sonnet-20240229
- **Required Permissions**: Standard text generation
- **Rate Limits**: Respects Anthropic's rate limiting
- **Cost**: Uses your Anthropic API credits

### API Call Structure
```javascript
{
  model: 'claude-3-sonnet-20240229',
  max_tokens: 1500,
  messages: [{
    role: 'user',
    content: [Analysis prompt with character data]
  }]
}
```

## Technical Implementation

### Architecture
- **React Component**: Built as a standard React functional component
- **TypeScript**: Full TypeScript support with proper type definitions
- **Tailwind CSS**: Responsive design using Tailwind utility classes
- **React Query**: Integrated with existing data fetching patterns
- **Local Caching**: Results cached by character ID and mastered skills

### Dependencies
- `@tanstack/react-query`: Data fetching and caching
- `lucide-react`: Icon components
- Tailwind CSS: Styling and responsive design
- Existing UI components from the app's design system

### Integration Points
- **Skill Data**: Accesses skill information via `sharedEnhancedService`
- **Goal Setting**: Integrates with existing goal management system
- **Navigation**: Smooth scrolling to other widget sections
- **State Management**: Uses parent component state for goal synchronization

## Error Handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid API key" | Wrong or expired API key | Check and re-enter API key from Anthropic Console |
| "API rate limit exceeded" | Too many requests | Wait and try again later |
| "Failed to analyze skills" | Network or API issues | Check internet connection and try again |
| "No response content" | API response format issue | API might be experiencing issues, try again |

### Error Recovery
- All errors are displayed to the user with clear explanations
- Users can retry operations after errors
- API key validation before making requests
- Graceful degradation when API is unavailable

## Privacy and Data Handling

### Data Processing
- **Character Analysis**: Only skill data is sent to Claude AI for analysis
- **No Personal Data**: No personal information beyond game character data
- **Temporary Processing**: Data is only used for the analysis request
- **No Data Retention**: Anthropic doesn't store conversation data per their policy

### Data Flow
1. User skill data → Formatted prompt
2. Prompt → Claude API (HTTPS encrypted)
3. AI Analysis → Parsed response
4. Results → Displayed to user + cached locally
5. No persistent server storage

## Accessibility

### Features
- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Color Contrast**: Meets WCAG AA color contrast requirements
- **Responsive Text**: Text scales appropriately across devices
- **Focus Indicators**: Clear focus states for keyboard users

## Browser Compatibility

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Required Features
- LocalStorage support
- Fetch API
- ES6+ JavaScript features
- CSS Grid and Flexbox

## Troubleshooting

### Widget Not Loading
1. Check browser console for errors
2. Verify internet connection
3. Ensure Claude API key is valid
4. Try refreshing the page

### Analysis Taking Too Long
1. Check network connection
2. Verify API key hasn't hit rate limits
3. Try again in a few minutes
4. Check Anthropic API status

### Goals Not Setting Properly
1. Ensure character is selected
2. Check that the recommended skill exists in the system
3. Try refreshing the page and re-analyzing

## Future Enhancements

### Planned Features
- Multiple AI provider support (OpenAI, etc.)
- Analysis history and comparison
- Custom analysis prompts
- Skill build templates based on analysis
- Export analysis results

### Security Improvements
- API key encryption at rest
- Audit logging for API usage
- Integration with key management services
- Additional rate limiting client-side

## Support

For issues related to:
- **API Keys**: Contact Anthropic support
- **Widget Functionality**: Check browser console and network tab
- **Security Concerns**: Review this documentation's security section
- **Feature Requests**: Submit through the appropriate channels

## Version History

- **v1.0.0**: Initial release with Claude AI integration
- Security-first API key management
- Responsive design implementation
- Goal setting and navigation features