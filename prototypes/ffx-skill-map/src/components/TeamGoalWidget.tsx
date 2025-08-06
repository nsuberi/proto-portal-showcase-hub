import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Target, Save, Edit2 } from 'lucide-react';

interface TeamGoalWidgetProps {
  teamId: string;
  teamName: string;
}

const TeamGoalWidget: React.FC<TeamGoalWidgetProps> = ({ teamId, teamName }) => {
  const [goal, setGoal] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [tempGoal, setTempGoal] = useState<string>('');

  // Load goal from localStorage when component mounts or teamId changes
  useEffect(() => {
    const storageKey = `team-goal-${teamId}`;
    const savedGoal = localStorage.getItem(storageKey);
    if (savedGoal) {
      setGoal(savedGoal);
    } else {
      setGoal('');
      setIsEditing(true);
    }
  }, [teamId]);

  const handleSave = () => {
    const storageKey = `team-goal-${teamId}`;
    localStorage.setItem(storageKey, tempGoal);
    setGoal(tempGoal);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setTempGoal(goal);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setTempGoal('');
    setIsEditing(false);
  };

  return (
    <div className="w-full">
      {isEditing ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Team Goal:</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:flex-1">
            <Input
              id="team-goal"
              type="text"
              value={tempGoal}
              onChange={(e) => setTempGoal(e.target.value)}
              placeholder="e.g., Launch new mobile app by Q3"
              className="text-sm flex-1"
              autoFocus
            />
            <div className="flex gap-2 flex-shrink-0">
              <Button onClick={handleSave} size="sm" disabled={!tempGoal.trim()}>
                <Save className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Save</span>
              </Button>
              {goal && (
                <Button onClick={handleCancel} variant="outline" size="sm">
                  <span className="hidden sm:inline">Cancel</span>
                  <span className="sm:hidden">✕</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Team Goal:</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:flex-1">
            {goal ? (
              <div className="p-2 bg-primary/5 rounded-md border border-primary/20 flex-1">
                <p className="text-sm">{goal}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic flex-1">No goal set</p>
            )}
            <Button onClick={handleEdit} variant="outline" size="sm" className="flex-shrink-0">
              <Edit2 className="h-3 w-3 mr-1" />
              <span>{goal ? 'Edit' : 'Set Goal'}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamGoalWidget;