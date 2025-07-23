import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Clock, User } from 'lucide-react';
import { Employee, Skill } from '../types';

interface JustInTimeWidgetProps {
  employeeId: string;
  employee: Employee;
  currentGoal?: { skill: Skill; path: string[] } | null;
  dataSource: 'ffx' | 'tech';
}

const JustInTimeWidget: React.FC<JustInTimeWidgetProps> = ({
  employeeId,
  employee,
  currentGoal,
  dataSource
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [justInTimeQuestion, setJustInTimeQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Generate default system prompt based on employee data and current goal
  useEffect(() => {
    if (!employee) return;

    const masteredSkillsText = employee.mastered_skills?.length > 0 
      ? employee.mastered_skills.join(', ')
      : 'No skills mastered yet';

    const goalContext = currentGoal 
      ? `\n\nCurrent Learning Goal: ${currentGoal.skill.name}\nDescription: ${currentGoal.skill.description}\nLearning Path: ${currentGoal.path.join(' → ')}`
      : '\n\nNo specific learning goal is currently set.';

    const defaultPrompt = `You are ${employee.name}, a ${employee.role} with ${employee.level || 1} levels of experience and ${employee.current_xp || 0} XP.

Your current mastered skills include: ${masteredSkillsText}${goalContext}

As an experienced professional, you have deep knowledge in your mastered skills and understand the context of your role. You are focused on continuous learning and growth. When answering questions, reference your existing knowledge base while highlighting new information that builds upon what you already know.

Focus on providing insights that bridge your known knowledge with new concepts, emphasizing practical applications and next steps for immediate implementation.`;

    setSystemPrompt(defaultPrompt);
  }, [employee, currentGoal]);

  const handleSubmit = async () => {
    if (!justInTimeQuestion.trim() || !systemPrompt.trim()) {
      setError('Both System Prompt and Just-in-Time Question are required.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse('');

    try {
      const requestPayload = {
        systemPrompt: systemPrompt,
        character: {
          name: employee.name,
          role: employee.role,
          currentXP: employee.current_xp || 0,
          level: employee.level || 1,
          masteredSkills: employee.mastered_skills || []
        },
        contextMessage: "Provide a Just-in-Time learning response that assumes familiarity with the topics in the System Prompt. Focus on known unknowns and unknown unknowns, giving practical insights that can be immediately applied. Emphasize new information that builds upon existing knowledge.",
        userMessage: justInTimeQuestion,
        currentGoal: currentGoal
      };

      const response = await fetch('/api/v1/ai-analysis/skill-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setResponse(data.recommendations || data.response || 'No response generated.');
      
    } catch (err) {
      console.error('Just-in-Time learning request failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to get Just-in-Time learning response');
    } finally {
      setIsLoading(false);
    }
  };

  const getEmployeeImage = () => {
    if (dataSource === 'ffx' && employee?.image) {
      return `/portraits/${employee.image}`;
    }
    if (dataSource === 'tech' && employee?.image) {
      return employee.image;
    }
    return null;
  };

  const employeeImage = getEmployeeImage();

  return (
    <div className="mb-6 md:mb-8 relative mx-4">
      <div className="bg-gradient-to-br from-orange-100/70 via-yellow-100/70 to-red-100/70 border-2 border-orange-200/50 rounded-xl p-4 md:p-6 shadow-lg backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-orange-600 via-orange-700 to-red-600 rounded-lg shadow-md">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold bg-gradient-to-r from-orange-700 via-orange-800 to-red-700 bg-clip-text text-transparent">
                Just-in-Time Learning
              </h3>
              <p className="text-sm text-orange-600/80">
                Personalized insights for immediate application
              </p>
            </div>
          </div>
          
          {/* Employee Image */}
          {employeeImage ? (
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden border-3 border-orange-300/50 shadow-lg">
              <img 
                src={employeeImage} 
                alt={employee?.name || 'Employee'} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<div class="w-full h-full bg-gradient-to-r from-orange-600 to-red-600 flex items-center justify-center"><span class="text-white font-bold text-lg">${employee?.name?.[0] || '?'}</span></div>`;
                  }
                }}
              />
            </div>
          ) : (
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-orange-600 to-red-600 flex items-center justify-center border-3 border-orange-300/50 shadow-lg">
              <User className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-orange-600 via-orange-700 to-red-600 text-white rounded-lg hover:from-orange-700 hover:via-orange-800 hover:to-red-700 transition-all duration-200 shadow-md"
        >
          <span className="font-medium">
            {isVisible ? 'Hide' : 'Show'} Just-in-Time Learning Assistant
          </span>
          {isVisible ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>

        {/* Collapsible Content */}
        {isVisible && (
          <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
            {/* Contextual Message */}
            <div className="bg-orange-50/70 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-800 leading-relaxed">
                <strong>Just-in-Time Learning:</strong> This assistant considers your current knowledge and goals to provide focused, immediately applicable insights. 
                The System Prompt represents your known knowledge base, while your question targets specific areas for growth.
              </p>
            </div>

            {/* System Prompt Section */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-orange-800">
                System Prompt (Your Current Knowledge Context)
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full p-3 border-2 border-orange-200 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-colors duration-200 bg-white/90 text-sm"
                rows={8}
                placeholder="Describe your current knowledge, skills, and context..."
              />
            </div>

            {/* Just-in-Time Question Section */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-orange-800">
                Just-in-Time Question
              </label>
              <textarea
                value={justInTimeQuestion}
                onChange={(e) => setJustInTimeQuestion(e.target.value)}
                className="w-full p-3 border-2 border-orange-200 rounded-lg focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-colors duration-200 bg-white/90 text-sm"
                rows={3}
                placeholder="What specific knowledge or insight do you need right now?"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading || !justInTimeQuestion.trim() || !systemPrompt.trim()}
              className="w-full p-3 bg-gradient-to-r from-orange-600 via-orange-700 to-red-600 text-white rounded-lg hover:from-orange-700 hover:via-orange-800 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md font-medium"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Getting Just-in-Time Insights...</span>
                </div>
              ) : (
                'Get Just-in-Time Learning'
              )}
            </button>

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
              <div className="bg-white/90 border-2 border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-orange-800 mb-3 flex items-center space-x-2">
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
          </div>
        )}
      </div>
    </div>
  );
};

export default JustInTimeWidget;