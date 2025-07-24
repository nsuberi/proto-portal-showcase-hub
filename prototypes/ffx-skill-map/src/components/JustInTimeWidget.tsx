import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './JustInTimeWidget.css';
import { ChevronDown, ChevronUp, Clock, Key, Eye, EyeOff, Save } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Employee, Skill } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface JustInTimeWidgetProps {
  employeeId: string;
  employee: Employee;
  getCurrentGoal?: () => { skill: Skill; path: string[] } | null;
  dataSource: 'ffx' | 'tech';
  service: any; // SkillService instance
}

// React Quill configuration
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['blockquote', 'code-block'],
    ['link'],
    ['clean']
  ],
};

const quillFormats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'color', 'background', 'list', 'bullet',
  'blockquote', 'code-block', 'link'
];

const JustInTimeWidget: React.FC<JustInTimeWidgetProps> = ({
  employeeId,
  employee,
  getCurrentGoal,
  dataSource,
  service
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [userSystemPrompt, setUserSystemPrompt] = useState('');
  const [savedUserSystemPrompt, setSavedUserSystemPrompt] = useState('');
  const [justInTimeQuestion, setJustInTimeQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch all skills and teammates for the analysis using consistent service pattern
  const { data: allSkills = [] } = useQuery({
    queryKey: [`${dataSource}-skills`],
    queryFn: () => service.getAllSkills(),
  });

  const { data: teammates = [] } = useQuery({
    queryKey: [`${dataSource}-employees`],
    queryFn: () => service.getAllEmployees(),
  });

  // Widget system prompt (hidden from user)
  const widgetSystemPrompt = "As an experienced professional, you have deep knowledge in your mastered skills and understand the context of your role. You are focused on continuous learning and growth. When answering questions, reference your existing knowledge base while highlighting new information that builds upon what you already know. Focus on providing insights that bridge your known knowledge with new concepts, emphasizing practical applications and next steps for immediate implementation.";

  // Generate default user system prompt based on employee data and current goal
  useEffect(() => {
    if (!employee || !allSkills.length) return;
    
    // Get current goal using callback to avoid object reference issues
    const currentGoal = getCurrentGoal?.() || null;

    // Convert skill IDs to skill names
    const masteredSkillNames = employee.mastered_skills?.length > 0 
      ? employee.mastered_skills
          .map(skillId => {
            const skill = allSkills.find(s => s.id === skillId);
            return skill ? skill.name : skillId; // Fallback to ID if skill not found
          })
          .join(', ')
      : 'No skills mastered yet';

    const goalContext = currentGoal 
      ? `\n\nCurrent Learning Goal: ${currentGoal.skill.name}\nDescription: ${currentGoal.skill.description}\nLearning Path: ${currentGoal.path
          .map(skillId => {
            const skill = allSkills.find(s => s.id === skillId);
            return skill ? skill.name : skillId; // Fallback to ID if skill not found
          })
          .join(' → ')}`
      : '\n\nNo specific learning goal is currently set.';

    const defaultPrompt = `You are ${employee.name}, a ${employee.role} with ${employee.level || 1} levels of experience and ${employee.current_xp || 0} XP.

Your current mastered skills include: ${masteredSkillNames}${goalContext}`;

    // Always reset the system prompt when employee changes (by including employeeId in dependency)
    // Convert plain text to HTML for rich text editor by replacing newlines with <br> tags
    const htmlPrompt = defaultPrompt.replace(/\n/g, '<br>');
    
    if (!savedUserSystemPrompt) {
      setUserSystemPrompt(htmlPrompt);
    } else {
      setUserSystemPrompt(savedUserSystemPrompt);
    }
    
    // Clear the saved prompt when employee changes to ensure fresh start
    if (savedUserSystemPrompt) {
      setSavedUserSystemPrompt('');
    }
  }, [employee.id, employeeId, allSkills, getCurrentGoal]); // Now depends on the callback function, which has stable reference

  // Clear the question when employee changes
  useEffect(() => {
    setJustInTimeQuestion('');
    setResponse('');
    setError(null);
  }, [employee.id, employeeId]);

  const handleSaveUserSystemPrompt = () => {
    setSavedUserSystemPrompt(userSystemPrompt);
    // In a real app, you might want to persist this to localStorage or a server
  };

  // Get API URL - same pattern as other AI widgets
  const getApiUrl = () => {
    // Check for environment variable first
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    
    // Default to localhost:3003 for development
    if (import.meta.env.DEV || typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return 'http://localhost:3003';
    }
    
    // Production fallback (would be replaced by deploy script)
    return 'PLACEHOLDER_API_GATEWAY_URL';
  };

  // Helper function to convert HTML to plain text for API calls
  const stripHtml = (html: string) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const handleSubmit = async () => {
    const plainUserSystemPrompt = stripHtml(userSystemPrompt).trim();
    const plainJustInTimeQuestion = stripHtml(justInTimeQuestion).trim();
    
    if (!plainJustInTimeQuestion || !plainUserSystemPrompt) {
      setError('Both User System Prompt and Just-in-Time Question are required.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse('');

    try {
      // In development mode, allow using server's mock mode without an API key
      let requestApiKey = apiKey.trim();
      if (!requestApiKey && import.meta.env.DEV) {
        requestApiKey = 'mock'; // Use server's mock mode
      }

      // Validate API key for real API calls
      if (!requestApiKey) {
        throw new Error('Claude API Key is required. In development mode, you can leave this empty to use mock data.');
      }

      if (requestApiKey !== 'mock' && !requestApiKey.startsWith('sk-ant-api')) {
        throw new Error('Invalid API key format. API keys should start with "sk-ant-api".');
      }

      const requestPayload = {
        apiKey: requestApiKey,
        character: {
          name: employee.name,
          role: employee.role,
          currentXP: employee.current_xp || 0,
          level: employee.level || 1,
          masteredSkills: employee.mastered_skills || []
        },
        allSkills: allSkills,
        teammates: teammates.filter(t => t.id !== employee.id), // Exclude current employee
        widgetSystemPrompt: widgetSystemPrompt,
        userSystemPrompt: plainUserSystemPrompt,
        justInTimeQuestion: plainJustInTimeQuestion
      };

      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/v1/ai-analysis/just-in-time`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResponse(data.response || 'No response generated.');
      
    } catch (err) {
      console.error('Just-in-Time learning request failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to get Just-in-Time learning response');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-6 md:mb-8 relative mx-4 bg-gradient-to-br from-green-100/70 via-purple-100/70 to-green-100/70 border-2 border-green-200/50 shadow-lg backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between w-full gap-2">
          {/* Left side with icon, employee image, and title */}
          <div className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-green-700 via-purple-700 to-green-700 bg-clip-text text-transparent flex-1 min-w-0">
            {/* Widget Icon */}
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-green-600 to-purple-600 shadow-lg flex-shrink-0">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
            </div>
            
            {/* Employee Image */}
            {employee.images?.face && (
              <div className="relative ring-2 ring-green-200 rounded-lg overflow-hidden flex-shrink-0">
                <img 
                  src={employee.images.face} 
                  alt={employee.name}
                  className="w-10 h-12 sm:w-12 sm:h-14 md:w-14 md:h-18 object-cover shadow-sm"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            )}
            
            <span className="truncate min-w-0">Just-in-Time Learning</span>
          </div>

          {/* Toggle Button */}
          <Button
            onClick={() => setIsVisible(!isVisible)}
            variant="ghost"
            size="sm"
            className="flex-shrink-0 bg-gradient-to-r from-green-600 via-purple-600 to-green-600 text-white hover:from-green-700 hover:via-purple-700 hover:to-green-700 transition-all duration-200"
          >
            {isVisible ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CardTitle>
        
        <CardDescription className="text-green-600/80">
          Personalized insights for immediate application
        </CardDescription>
      </CardHeader>

      {/* Collapsible Content */}
      {isVisible && (
        <CardContent className="space-y-4 animate-in slide-in-from-top-2 duration-300">
          {/* Contextual Message */}
          <div className="bg-green-50/70 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800 leading-relaxed">
              <strong>Just-in-Time Learning:</strong> This assistant considers your current knowledge and goals to provide focused, immediately applicable insights. 
              The System Prompt represents your known knowledge base, while your question targets specific areas for growth.
            </p>
          </div>

          {/* User System Prompt Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-green-800">
                System Prompt (Your Current Knowledge Context)
              </Label>
              <Button
                onClick={handleSaveUserSystemPrompt}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-xs"
              >
                <Save className="h-3 w-3" />
                Save Changes
              </Button>
            </div>
            <div className="border-2 border-green-200 rounded-lg focus-within:border-green-400 transition-colors duration-200 bg-white/90 system-prompt-editor">
              <ReactQuill
                theme="snow"
                value={userSystemPrompt}
                onChange={setUserSystemPrompt}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Describe your current knowledge, skills, and context..."
              />
            </div>
          </div>

          {/* Just-in-Time Question Section */}
          <div className="space-y-2">
            <Label className="block text-sm font-semibold text-green-800">
              Just-in-Time Question
            </Label>
            <div className="border-2 border-green-200 rounded-lg focus-within:border-green-400 transition-colors duration-200 bg-white/90 question-editor">
              <ReactQuill
                theme="snow"
                value={justInTimeQuestion}
                onChange={setJustInTimeQuestion}
                modules={quillModules}
                formats={quillFormats}
                placeholder="What specific knowledge or insight do you need right now?"
              />
            </div>
          </div>

          {/* API Key Section */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Key className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-green-700 mb-3">
                  <strong>Claude API Key Required:</strong> Enter your Anthropic Claude API key to enable AI-powered just-in-time learning analysis. 
                  {import.meta.env.DEV && " In development mode, you can leave this empty to use mock data."}
                </p>
                <div className="space-y-2">
                  <div className="relative">
                    <Input
                      type={showApiKey ? "text" : "password"}
                      placeholder="sk-ant-api03-..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="pr-10 text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-green-600">
                    Get your API key from <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="underline">Anthropic Console</a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !stripHtml(justInTimeQuestion).trim() || !stripHtml(userSystemPrompt).trim()}
            className="w-full p-3 bg-gradient-to-r from-green-600 via-purple-600 to-green-600 text-white hover:from-green-700 hover:via-purple-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md font-medium"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Getting Just-in-Time Insights...</span>
              </div>
            ) : (
              'Get Just-in-Time Learning'
            )}
          </Button>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}

          {/* Response Display */}
          {response && (
            <div className="bg-white/90 border-2 border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-3 flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Just-in-Time Learning Insights</span>
              </h4>
              <div className="prose prose-sm max-w-none text-gray-700">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {response}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default JustInTimeWidget;