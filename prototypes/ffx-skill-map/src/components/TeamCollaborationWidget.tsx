import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Users, Key, Eye, EyeOff, Sparkles, Target, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Employee, Skill } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import SkillGoalWidget from './SkillGoalWidget';

interface TeamCollaborationWidgetProps {
  employeeId: string;
  employee: Employee;
  currentGoal?: { skill: Skill; path: string[] } | null;
  dataSource: 'ffx' | 'tech';
  onGoalSet?: (goalSkill: Skill | null, path: string[]) => void;
}

const TeamCollaborationWidget: React.FC<TeamCollaborationWidgetProps> = ({
  employeeId,
  employee,
  currentGoal,
  dataSource,
  onGoalSet
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [personalGrowthGoal, setPersonalGrowthGoal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [teamGoal, setTeamGoal] = useState('');

  // Load team goal from localStorage
  useEffect(() => {
    const storageKey = `team-goal-${dataSource}`;
    const savedGoal = localStorage.getItem(storageKey);
    if (savedGoal) {
      setTeamGoal(savedGoal);
    }
  }, [dataSource]);

  // Fetch all skills, connections, and teammates for the analysis
  const { data: allSkills = [] } = useQuery({
    queryKey: [`${dataSource}-skills`],
    queryFn: async () => {
      if (dataSource === 'ffx') {
        const { sharedEnhancedService } = await import('../services/sharedService');
        return await sharedEnhancedService.getAllSkills();
      } else {
        const { default: TechSkillsService } = await import('../services/techSkillsData');
        const service = new TechSkillsService();
        return await service.getAllSkills();
      }
    }
  });

  const { data: connections = [] } = useQuery({
    queryKey: [`${dataSource}-connections`],
    queryFn: async () => {
      if (dataSource === 'ffx') {
        const { sharedEnhancedService } = await import('../services/sharedService');
        return await sharedEnhancedService.getSkillConnections();
      } else {
        const { default: TechSkillsService } = await import('../services/techSkillsData');
        const service = new TechSkillsService();
        return await service.getSkillConnections();
      }
    }
  });

  const { data: teammates = [] } = useQuery({
    queryKey: [`${dataSource}-employees`],
    queryFn: async () => {
      if (dataSource === 'ffx') {
        const { sharedEnhancedService } = await import('../services/sharedService');
        return await sharedEnhancedService.getAllEmployees();
      } else {
        const { default: TechSkillsService } = await import('../services/techSkillsData');
        const service = new TechSkillsService();
        return await service.getAllEmployees();
      }
    }
  });

  // Get skill category counts for the employee
  const getSkillCategoryCounts = () => {
    const categoryCounts: Record<string, number> = {};
    
    employee.mastered_skills?.forEach(skillId => {
      const skill = allSkills.find(s => s.id === skillId);
      if (skill) {
        categoryCounts[skill.category] = (categoryCounts[skill.category] || 0) + 1;
      }
    });
    
    return categoryCounts;
  };

  // Get skills for a specific category
  const getSkillsForCategory = (category: string) => {
    return employee.mastered_skills?.map(skillId => {
      const skill = allSkills.find(s => s.id === skillId);
      return skill;
    }).filter(skill => skill && skill.category === category) || [];
  };

  // Get category icon and color
  const getCategoryStyle = (category: string) => {
    const styles: Record<string, { icon: JSX.Element, color: string }> = {
      // FFX categories
      combat: { icon: <Target className="h-3 w-3" />, color: 'bg-red-100 text-red-800 border-red-300' },
      magic: { icon: <Zap className="h-3 w-3" />, color: 'bg-blue-100 text-blue-800 border-blue-300' },
      support: { icon: <Users className="h-3 w-3" />, color: 'bg-green-100 text-green-800 border-green-300' },
      special: { icon: <Sparkles className="h-3 w-3" />, color: 'bg-purple-100 text-purple-800 border-purple-300' },
      advanced: { icon: <Target className="h-3 w-3" />, color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      // Tech categories
      engineering: { icon: <Zap className="h-3 w-3" />, color: 'bg-blue-100 text-blue-800 border-blue-300' },
      platform: { icon: <Target className="h-3 w-3" />, color: 'bg-purple-100 text-purple-800 border-purple-300' },
      product: { icon: <Sparkles className="h-3 w-3" />, color: 'bg-orange-100 text-orange-800 border-orange-300' },
      communication: { icon: <Users className="h-3 w-3" />, color: 'bg-teal-100 text-teal-800 border-teal-300' },
      process: { icon: <Target className="h-3 w-3" />, color: 'bg-pink-100 text-pink-800 border-pink-300' },
      leadership: { icon: <Users className="h-3 w-3" />, color: 'bg-yellow-100 text-yellow-800 border-yellow-300' }
    };
    return styles[category] || { icon: <Target className="h-3 w-3" />, color: 'bg-gray-100 text-gray-800 border-gray-300' };
  };

  // Get API URL
  const getApiUrl = () => {
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    
    if (import.meta.env.DEV || typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return 'http://localhost:3003';
    }
    
    return 'PLACEHOLDER_API_GATEWAY_URL';
  };

  const handleSubmit = async () => {
    if (!personalGrowthGoal.trim() || !teamGoal.trim()) {
      setError('Both team goal and personal growth goal are required.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse('');

    try {
      let requestApiKey = apiKey.trim();
      if (!requestApiKey && import.meta.env.DEV) {
        requestApiKey = 'mock';
      }

      if (!requestApiKey) {
        throw new Error('Claude API Key is required. In development mode, you can leave this empty to use mock data.');
      }

      if (requestApiKey !== 'mock' && !requestApiKey.startsWith('sk-ant-api')) {
        throw new Error('Invalid API key format. API keys should start with "sk-ant-api".');
      }

      // Build team skills mapping
      const teamSkillsMap = teammates.map(teammate => ({
        employeeId: teammate.id,
        employeeName: teammate.name,
        role: teammate.role,
        masteredSkills: teammate.mastered_skills?.map(skillId => {
          const skill = allSkills.find(s => s.id === skillId);
          return skill ? skill.name : skillId;
        }) || []
      }));

      // Build skill descriptions
      const skillDescriptions = allSkills.reduce((acc, skill) => {
        acc[skill.name] = skill.description;
        return acc;
      }, {} as Record<string, string>);

      const systemPrompt = `You are an AI assistant helping ${employee.name} (${employee.role}) identify which skills would be most helpful for their team to achieve "${teamGoal}".

Current team composition and skills:
${JSON.stringify(teamSkillsMap, null, 2)}

Available skills and descriptions:
${JSON.stringify(skillDescriptions, null, 2)}

The employee wants to grow in this direction: "${personalGrowthGoal}"

Please provide your response in the following format:

## RECOMMENDED SKILLS
List 3-5 skills that would:
1. Help the team achieve their goal
2. Align with the employee's personal growth interests  
3. Build on their existing skills: ${employee.mastered_skills?.map(id => allSkills.find(s => s.id === id)?.name).filter(Boolean).join(', ')}

For each skill, format as:
**[SKILL_NAME]**
- Why it's important for the team goal
- How it connects to their existing skills
- Which team members they should collaborate with to learn it

## MENTORSHIP RECOMMENDATIONS

**LEARN FROM:** [Team member name]
One brief sentence explaining why this person would be a good mentor for ${employee.name}.

**MENTOR:** [Team member name]  
One brief sentence explaining why ${employee.name} would be a good mentor for this person.

IMPORTANT: 
- Use exact skill names from the available skills list for the RECOMMENDED SKILLS section
- Keep mentorship descriptions to ONE sentence each
- Do not include additional sections or recommendations beyond what is requested`;

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
        teammates: teammates.filter(t => t.id !== employee.id),
        systemPrompt: systemPrompt,
        userPrompt: `Team Goal: ${teamGoal}\nPersonal Growth Interest: ${personalGrowthGoal}`
      };

      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/v1/ai-analysis/just-in-time`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: requestApiKey,
          character: requestPayload.character,
          allSkills: requestPayload.allSkills,
          teammates: requestPayload.teammates,
          widgetSystemPrompt: 'You are an AI assistant helping with team collaboration and skill development.',
          userSystemPrompt: requestPayload.systemPrompt,
          justInTimeQuestion: requestPayload.userPrompt
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResponse(data.response || 'No response generated.');
      
    } catch (err) {
      console.error('Team collaboration request failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to get team collaboration recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  const categoryCounts = getSkillCategoryCounts();

  return (
    <Card className="mb-6 md:mb-8 relative mx-4 bg-gradient-to-br from-blue-100/70 via-purple-100/70 to-blue-100/70 border-2 border-blue-200/50 shadow-lg backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between w-full gap-2">
          <div className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-blue-700 via-purple-700 to-blue-700 bg-clip-text text-transparent flex-1 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg flex-shrink-0">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
            </div>
            
            {employee.images?.face && (
              <div className="relative ring-2 ring-blue-200 rounded-lg overflow-hidden flex-shrink-0">
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
            
            <span className="truncate min-w-0">How should I work with my team to achieve our goals?</span>
          </div>

          <Button
            onClick={() => setIsVisible(!isVisible)}
            variant="ghost"
            size="sm"
            className="flex-shrink-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 text-white hover:from-blue-700 hover:via-purple-700 hover:to-blue-700 transition-all duration-200"
          >
            {isVisible ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CardTitle>
        
        <CardDescription className="text-blue-600/80 space-y-2">
          <div>Team collaboration insights for {employee.name}</div>
          
          {/* Level and XP tags */}
          <div className="flex gap-2 items-center">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
              Level {employee.level || 1}
            </Badge>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300">
              {employee.current_xp || 0} XP
            </Badge>
          </div>
          
          {/* Skill category tags */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(categoryCounts).map(([category, count]) => {
              const style = getCategoryStyle(category);
              const skills = getSkillsForCategory(category);
              
              return (
                <Popover key={category}>
                  <PopoverTrigger asChild>
                    <Badge 
                      variant="outline" 
                      className={`cursor-pointer ${style.color} hover:opacity-80 transition-opacity`}
                    >
                      {style.icon}
                      <span className="ml-1 capitalize">{category} ({count})</span>
                    </Badge>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="font-semibold capitalize">{category} Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {skills.map(skill => (
                          <Badge key={skill!.id} variant="secondary" className="text-xs">
                            {skill!.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              );
            })}
          </div>
        </CardDescription>
      </CardHeader>

      {isVisible && (
        <CardContent className="space-y-4 animate-in slide-in-from-top-2 duration-300">
          {/* Team Goal Display */}
          {teamGoal && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-800 mb-1">Team Goal</h4>
              <p className="text-sm text-blue-700">{teamGoal}</p>
            </div>
          )}

          {/* Personal Growth Goal */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-blue-800">
              How would you like to grow, personally?
            </Label>
            <Input
              value={personalGrowthGoal}
              onChange={(e) => setPersonalGrowthGoal(e.target.value)}
              placeholder="e.g., I want to improve my leadership skills..."
              className="border-blue-200 focus:border-blue-400"
            />
          </div>

          {/* Integrated Skill Goal Widget */}
          <div className="border-2 border-blue-200 rounded-lg p-4 bg-white/50">
            <SkillGoalWidget
              employeeId={employeeId}
              employee={employee}
              skills={allSkills}
              connections={connections}
              currentGoal={currentGoal?.skill || null}
              service={{
                getAllSkills: async () => allSkills,
                getSkillConnections: async () => connections,
                getSkillPath: async (from: string, to: string) => {
                  // Simple BFS pathfinding implementation
                  if (!connections || connections.length === 0) return [];
                  
                  const adjacency: Record<string, string[]> = {};
                  connections.forEach(conn => {
                    if (!adjacency[conn.from]) adjacency[conn.from] = [];
                    adjacency[conn.from].push(conn.to);
                  });
                  
                  const queue = [[from]];
                  const visited = new Set([from]);
                  
                  while (queue.length > 0) {
                    const path = queue.shift()!;
                    const current = path[path.length - 1];
                    
                    if (current === to) {
                      return path.slice(1); // Exclude the starting node
                    }
                    
                    for (const neighbor of (adjacency[current] || [])) {
                      if (!visited.has(neighbor)) {
                        visited.add(neighbor);
                        queue.push([...path, neighbor]);
                      }
                    }
                  }
                  
                  return []; // No path found
                }
              }}
              dataSource={dataSource}
              onGoalSet={onGoalSet}
            />
          </div>

          {/* API Key Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Key className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-blue-700 mb-3">
                  <strong>Claude API Key Required:</strong> Enter your Anthropic Claude API key to enable AI-powered recommendations. 
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
                  <p className="text-xs text-blue-600">
                    Get your API key from <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="underline">Anthropic Console</a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !personalGrowthGoal.trim() || !teamGoal.trim()}
            className="w-full p-3 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 text-white hover:from-blue-700 hover:via-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md font-medium"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Getting Team Recommendations...</span>
              </div>
            ) : (
              'Get Recommendations for Supporting Your Team'
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
            <div className="space-y-4">
              <h4 className="font-semibold text-blue-800 mb-3 flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Team Collaboration Recommendations</span>
              </h4>
              
              {(() => {
                // Parse the response into structured sections
                const sections = response.split('## ');
                const skillsSection = sections.find(s => s.startsWith('RECOMMENDED SKILLS'));
                const mentorshipSection = sections.find(s => s.startsWith('MENTORSHIP RECOMMENDATIONS'));
                
                const content = [];
                
                // Parse Skills Section
                if (skillsSection) {
                  const skillLines = skillsSection.split('\n').filter(line => line.trim());
                  const skills = [];
                  let currentSkill = null;
                  
                  for (const line of skillLines) {
                    const skillMatch = line.match(/\*\*([^*]+)\*\*/);
                    if (skillMatch && !line.includes('[')) {
                      if (currentSkill) skills.push(currentSkill);
                      const skillName = skillMatch[1];
                      const skill = allSkills.find(s => s.name === skillName);
                      currentSkill = { name: skillName, skill, details: [] };
                    } else if (line.startsWith('- ') && currentSkill) {
                      currentSkill.details.push(line.substring(2));
                    }
                  }
                  if (currentSkill) skills.push(currentSkill);
                  
                  // Render Skills Widgets
                  if (skills.length > 0) {
                    content.push(
                      <div key="skills" className="space-y-3">
                        <h3 className="text-lg font-semibold text-blue-800 mb-3">Recommended Skills</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {skills.map((skillItem, idx) => {
                            const categoryStyle = getCategoryStyle(skillItem.skill?.category || 'default');
                            return (
                              <Card key={idx} className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-white shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <div className={`p-1.5 rounded-full ${categoryStyle.color.replace('text-', 'bg-').replace('border-', 'border-').replace('800', '100').replace('300', '300')}`}>
                                        {categoryStyle.icon}
                                      </div>
                                      <h4 className="font-semibold text-blue-900">{skillItem.name}</h4>
                                    </div>
                                    {skillItem.skill && (
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          if (onGoalSet) {
                                            onGoalSet(skillItem.skill, []);
                                          }
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                      >
                                        <Target className="h-3 w-3 mr-1" />
                                        Set as Goal
                                      </Button>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    {skillItem.details.map((detail, detailIdx) => (
                                      <p key={detailIdx} className="text-sm text-gray-700 leading-relaxed">
                                        • {detail}
                                      </p>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                }
                
                // Parse Mentorship Section
                if (mentorshipSection) {
                  const mentorshipLines = mentorshipSection.split('\n').filter(line => line.trim());
                  let learnFromMentor = null;
                  let mentorTo = null;
                  let currentSection = null;
                  
                  for (const line of mentorshipLines) {
                    if (line.includes('**LEARN FROM:**')) {
                      currentSection = 'learnFrom';
                      const mentorName = line.replace('**LEARN FROM:**', '').trim();
                      const mentor = teammates.find(t => t.name === mentorName);
                      learnFromMentor = { name: mentorName, teammate: mentor, description: [] };
                    } else if (line.includes('**MENTOR:**')) {
                      currentSection = 'mentor';
                      const menteeName = line.replace('**MENTOR:**', '').trim();
                      const mentee = teammates.find(t => t.name === menteeName);
                      mentorTo = { name: menteeName, teammate: mentee, description: [] };
                    } else if (line.trim() && currentSection && !line.includes('**')) {
                      // Stop processing if we hit another section or formatting
                      if (line.includes('Just-in-Time Learning') || line.includes('Key piece') || line.includes('This focused approach')) {
                        break;
                      }
                      if (currentSection === 'learnFrom' && learnFromMentor) {
                        learnFromMentor.description.push(line.trim());
                      } else if (currentSection === 'mentor' && mentorTo) {
                        mentorTo.description.push(line.trim());
                      }
                    }
                  }
                  
                  // Render Mentorship Widgets
                  content.push(
                    <div key="mentorship" className="space-y-3">
                      <h3 className="text-lg font-semibold text-blue-800 mb-3">Mentorship Recommendations</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {learnFromMentor && (
                          <Card className="border-green-200 bg-gradient-to-br from-green-50/50 to-white shadow-sm">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-green-100 rounded-full">
                                  <Users className="h-4 w-4 text-green-600" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-green-800">Learn From</h4>
                                  <p className="text-sm text-green-600">Find a mentor</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                {learnFromMentor.teammate?.images?.face && (
                                  <img
                                    src={learnFromMentor.teammate.images.face}
                                    alt={learnFromMentor.name}
                                    className="w-12 h-14 object-cover rounded-lg shadow-sm flex-shrink-0"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                )}
                                <div className="flex-1">
                                  <h5 className="font-semibold text-gray-900 mb-1">{learnFromMentor.name}</h5>
                                  <p className="text-sm text-gray-600 mb-2">{learnFromMentor.teammate?.role}</p>
                                  <div className="text-sm text-gray-700 leading-relaxed">
                                    {learnFromMentor.description.join(' ')}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                        
                        {mentorTo && (
                          <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-white shadow-sm">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-purple-100 rounded-full">
                                  <Users className="h-4 w-4 text-purple-600" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-purple-800">Mentor</h4>
                                  <p className="text-sm text-purple-600">Share your knowledge</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                {mentorTo.teammate?.images?.face && (
                                  <img
                                    src={mentorTo.teammate.images.face}
                                    alt={mentorTo.name}
                                    className="w-12 h-14 object-cover rounded-lg shadow-sm flex-shrink-0"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                )}
                                <div className="flex-1">
                                  <h5 className="font-semibold text-gray-900 mb-1">{mentorTo.name}</h5>
                                  <p className="text-sm text-gray-600 mb-2">{mentorTo.teammate?.role}</p>
                                  <div className="text-sm text-gray-700 leading-relaxed">
                                    {mentorTo.description.join(' ')}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  );
                }
                
                return content;
              })()}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default TeamCollaborationWidget;