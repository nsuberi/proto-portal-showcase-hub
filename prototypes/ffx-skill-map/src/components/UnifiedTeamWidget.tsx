import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Code, Sword, RotateCcw } from 'lucide-react';
import { Employee } from '../types';
import TeamGoalWidget from './TeamGoalWidget';

interface UnifiedTeamWidgetProps {
  dataSource: 'ffx' | 'tech';
  employees: Employee[];
  selectedEmployeeId: string;
  onDataSourceChange: (dataSource: 'ffx' | 'tech') => void;
  onEmployeeSelect: (employeeId: string) => void;
  queryClient: any;
  clearGoal: () => void;
  setSelectedSkill: (skill: any) => void;
  currentService: any;
  teamGoal: string;
  onTeamGoalChange: (goal: string) => void;
}

export const getHeroVideoSrc = (dataSource: 'ffx' | 'tech') => {
  return dataSource === 'ffx' 
    ? '/prototypes/ffx-skill-map/images/characters/ffx/final-fantasy-hero.mp4'
    : '/prototypes/ffx-skill-map/images/characters/tech_org/tech-org-hero.mp4';
};

const UnifiedTeamWidget: React.FC<UnifiedTeamWidgetProps> = ({
  dataSource,
  employees,
  selectedEmployeeId,
  onDataSourceChange,
  onEmployeeSelect,
  queryClient,
  clearGoal,
  setSelectedSkill,
  currentService,
  teamGoal,
  onTeamGoalChange
}) => {
  const [isResettingTeam, setIsResettingTeam] = useState(false);
  const teamDisplayName = dataSource === 'ffx' ? 'Final Fantasy X Team' : 'Tech Organization';

  const handleTeamReset = async () => {
    if (!currentService) return;
    
    setIsResettingTeam(true);
    try {
      // Reset all employees in the team
      if (employees && employees.length > 0) {
        for (const employee of employees) {
          await currentService.resetEmployeeSkills(employee.id);
          
          // Clear goals for each employee from localStorage
          const goalKey = `employee-goal-${dataSource}-${employee.id}`;
          localStorage.removeItem(goalKey);
          console.log(`🗑️ Cleared goal for ${employee.name}`);
        }
      }
      
      // Clear any active goals
      clearGoal();
      
      // Clear selected employee
      onEmployeeSelect('');
      
      // Invalidate cache to refresh data
      queryClient.invalidateQueries({ queryKey: [`${dataSource}-employees`], exact: false });
      queryClient.invalidateQueries({ queryKey: ['skill-recommendations'], exact: false });
      
      console.log(`✅ Successfully reset all skills and goals for ${teamDisplayName}`);
    } catch (error) {
      console.error('Failed to reset team skills:', error);
    } finally {
      setIsResettingTeam(false);
    }
  };

  const handleDataSourceChange = (newDataSource: 'ffx' | 'tech') => {
    onDataSourceChange(newDataSource);
    onEmployeeSelect('');
    clearGoal();
    setSelectedSkill(null);
    
    // Invalidate all cached data when switching datasets
    if (newDataSource === 'tech') {
      queryClient.invalidateQueries({ queryKey: ['ffx-skills'] });
      queryClient.invalidateQueries({ queryKey: ['ffx-connections'] });
      queryClient.invalidateQueries({ queryKey: ['ffx-employees'] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['tech-skills'] });
      queryClient.invalidateQueries({ queryKey: ['tech-connections'] });
      queryClient.invalidateQueries({ queryKey: ['tech-employees'] });
    }
    queryClient.invalidateQueries({ queryKey: ['skill-recommendations'] });
  };

  return (
    <div className="w-full max-w-4xl mb-6 mx-auto relative z-10">
      <Card className="border-border/50 shadow-lg backdrop-blur-sm bg-background/60 md:bg-background relative overflow-hidden">
        {/* Soft glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 blur-xl" />
        
        <CardContent className="relative p-6 space-y-6">

          {/* Team Selection Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Select Team:</span>
                <div className="flex items-center border border-border rounded-lg p-0.5 bg-background/80 backdrop-blur-sm">
                  <button
                    onClick={() => handleDataSourceChange('tech')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 ${
                      dataSource === 'tech'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <Code className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Tech Organization</span>
                    <span className="sm:hidden">Tech</span>
                  </button>
                  <button
                    onClick={() => handleDataSourceChange('ffx')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 ${
                      dataSource === 'ffx'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <Sword className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Final Fantasy X</span>
                    <span className="sm:hidden">FFX</span>
                  </button>
                </div>
              </div>
              
              {/* Reset Team Button */}
              <Button
                variant="outline"
                onClick={handleTeamReset}
                disabled={isResettingTeam || !employees || employees.length === 0}
                className="whitespace-nowrap flex-shrink-0"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {isResettingTeam ? 'Resetting Team...' : 'Reset Team Skills and Goals'}
              </Button>
            </div>

            {/* Team Goal Widget */}
            <TeamGoalWidget 
              teamId={dataSource}
              teamName={teamDisplayName}
              teamGoal={teamGoal}
              onTeamGoalChange={onTeamGoalChange}
            />
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* Team Members Section */}
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{teamDisplayName}</h3>
              <p className="text-sm text-muted-foreground">Meet your team members</p>
            </div>
            
            {employees && employees.length > 0 ? (
              <>
                {/* Team Member Grid - Responsive */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 justify-items-center">
                  {employees.map((employee) => (
                    <div 
                      key={employee.id}
                      className={`flex flex-col items-center group cursor-pointer transition-all duration-200 ${
                        selectedEmployeeId === employee.id 
                          ? 'transform scale-105' 
                          : 'hover:transform hover:scale-105'
                      }`}
                      onClick={() => onEmployeeSelect(employee.id)}
                    >
                      {/* Headshot Container */}
                      <div className={`relative rounded-full overflow-hidden ring-2 transition-all duration-200 ${
                        selectedEmployeeId === employee.id
                          ? 'ring-blue-500 ring-offset-2 ring-offset-white shadow-lg'
                          : 'ring-gray-200 group-hover:ring-blue-400 group-hover:ring-offset-2 group-hover:ring-offset-white group-hover:shadow-md'
                      }`}>
                        {employee.images?.face ? (
                          <img
                            src={employee.images.face}
                            alt={employee.name}
                            className="w-16 h-20 sm:w-20 sm:h-24 md:w-24 md:h-28 object-cover object-top transition-all duration-200 group-hover:brightness-110"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-16 h-20 sm:w-20 sm:h-24 md:w-24 md:h-28 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                            <span className="text-gray-500 text-xs font-medium">
                              {employee.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        )}
                        
                      </div>
                      
                      {/* Name Label */}
                      <div className="mt-2 text-center min-h-[2.5rem] flex flex-col justify-center">
                        <p className={`text-xs sm:text-sm font-medium transition-colors duration-200 ${
                          selectedEmployeeId === employee.id 
                            ? 'text-blue-600' 
                            : 'text-gray-700 group-hover:text-blue-600'
                        } leading-tight`}>
                          {employee.name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 leading-tight">
                          {employee.role}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Team Stats */}
                <div className="pt-4 border-t border-border/50">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-blue-600">{employees.length}</div>
                      <p className="text-xs text-muted-foreground">Team Members</p>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">
                        {employees.reduce((total, emp) => total + (emp.mastered_skills?.length || 0), 0)}
                      </div>
                      <p className="text-xs text-muted-foreground">Total Skills</p>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-purple-600">
                        {Math.round(employees.reduce((total, emp) => total + (emp.level || 1), 0) / employees.length)}
                      </div>
                      <p className="text-xs text-muted-foreground">Avg Level</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading team members...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedTeamWidget;