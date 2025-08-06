import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Employee } from '../types';

interface TeamMemberHeadshotsProps {
  employees: Employee[];
  dataSource: 'ffx' | 'tech';
  selectedEmployeeId?: string;
  onEmployeeSelect?: (employeeId: string) => void;
}

const TeamMemberHeadshots: React.FC<TeamMemberHeadshotsProps> = ({
  employees,
  dataSource,
  selectedEmployeeId,
  onEmployeeSelect
}) => {
  const teamDisplayName = dataSource === 'ffx' ? 'Final Fantasy X Team' : 'Tech Organization';

  if (!employees || employees.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto mb-6 px-4">
      <Card className="border-border/50 shadow-lg backdrop-blur-sm relative overflow-hidden">
        {/* Soft glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 blur-xl" />
        
        <CardContent className="relative p-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{teamDisplayName}</h3>
            <p className="text-sm text-muted-foreground">Meet your team members</p>
          </div>
          
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
                onClick={() => onEmployeeSelect?.(employee.id)}
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
                  
                  {/* Selected Indicator */}
                  {selectedEmployeeId === employee.id && (
                    <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
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
                    {employee.role?.length > 20 
                      ? employee.role.substring(0, 20) + '...' 
                      : employee.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Team Stats */}
          <div className="mt-6 pt-4 border-t border-border/50">
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
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamMemberHeadshots;