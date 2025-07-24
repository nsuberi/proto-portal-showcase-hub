# FFX Skill Map - Data Flow Architecture

## Overview

The FFX Skill Map application manages two separate datasets (Final Fantasy X skills and Tech Organization skills) with complex caching and state management. This document explains how data flows through the system and how dataset switching works.

## Architecture Components

### 1. Service Layer (Data Sources)

**FFX Dataset:**
- Service: `EnhancedMockNeo4jService` (from `enhancedMockData.ts`)
- localStorage key: `'ffx-skill-map-employees'`
- Themes: Combat, Magic, Support, Special, Advanced

**Tech Organization Dataset:**
- Service: `TechSkillsService` (from `techSkillsData.ts`)
- localStorage key: `'tech-skill-map-employees'`
- Themes: Engineering, Platform, Product, Communication, Process, Leadership

**Service Structure:**
```typescript
interface SkillService {
  skills: Skill[]              // Static skill definitions
  connections: Connection[]    // Static prerequisite relationships  
  employees: Employee[]        // Dynamic employee progression data
  graphAnalyzer: SkillGraphAnalyzer // Pathfinding and recommendations
}
```

### 2. React Query Caching Strategy

**Query Keys Pattern:**
```typescript
// Dataset-specific keys
[`${dataSource}-skills`]      // 'ffx-skills' or 'tech-skills'
[`${dataSource}-connections`] // 'ffx-connections' or 'tech-connections'  
[`${dataSource}-employees`]   // 'ffx-employees' or 'tech-employees'

// Cross-dataset keys
['skill-recommendations', employeeId, goalSkillId, serviceName]
```

**Cache Configuration:**
- **Skills & Connections**: Static data, cached indefinitely
- **Employees**: Dynamic data, 30s stale time, 5min cache time
- **Recommendations**: Dynamic, 5min stale time, conditional on employee state

### 3. Dataset Switching Flow

When user clicks dataset toggle button:

```
1. State Updates:
   - setDataSource('ffx' | 'tech')
   - setSelectedEmployeeId('')  // Clear selection
   - setCurrentGoal(null)       // Clear goal
   - setSelectedSkill(null)     // Clear modal

2. Cache Invalidation:
   - Invalidate previous dataset queries
   - queryClient.invalidateQueries(['previous-dataset-*'])
   - queryClient.invalidateQueries(['skill-recommendations'])

3. Service Switch:
   - currentService = dataSource === 'ffx' ? ffxService : techService
   - New service instance loaded with different data

4. Fresh Data Fetch:
   - React Query triggers new queries with dataset-specific keys
   - Components re-render with new data, colors, categories
```

## Critical Stale Closure Bug Fixed

### The Real Problem

The issue was a **stale closure in the SigmaGraph click handler**:

```
1. SigmaGraph component mounts → useEffect runs with empty dependency array []
2. Click handler created with reference to initial `skills` array (e.g., FFX skills)
3. User switches to Tech dataset → skills prop changes → new Tech skills fetched
4. BUT: Click handler still has closure over old FFX skills array!
5. User clicks node with ID 'central_4' → handler looks up ID in old FFX skills
6. Returns "Tornado" (FFX skill) instead of "Culture Building" (correct Tech skill)
7. Wrong skill object flows through entire goal-setting process
```

### The Solution

Split the SigmaGraph setup into two useEffects:

```typescript
// Create Sigma instance once (expensive operation)
useEffect(() => {
  // ... create Sigma renderer
  sigmaInstanceRef.current = renderer;
}, []); // Run once on mount

// Update click handler when skills change (lightweight operation)  
useEffect(() => {
  if (!sigmaInstanceRef.current) return;
  
  const renderer = sigmaInstanceRef.current;
  
  // Remove stale listeners and add fresh one with current skills
  renderer.removeAllListeners('clickNode');
  renderer.on('clickNode', (event) => {
    const skillId = event.node;
    const skill = skills?.find(s => s.id === skillId); // Uses current skills!
    if (skill && onNodeClick) {
      onNodeClick(skill);
    }
  });
}, [skills, onNodeClick]); // Update when skills or onNodeClick changes
```

## Data Consistency Safeguards

### 1. Complete Isolation
- **Service Encapsulation**: Each service manages its own state independently
- **localStorage Separation**: Different keys prevent cross-contamination
- **Query Key Namespacing**: React Query cache isolation between datasets

### 2. State Reset Patterns
- All UI state cleared during dataset transitions
- Query cache invalidation ensures fresh data fetching
- Component re-mounting triggers fresh data loads

### 3. Validation & Debug
- Services validate employee data structure on load
- Debug logging shows which employee data is being used
- Safety checks prevent recommending already-mastered skills

## Component Data Dependencies

### SkillMap.tsx (Main Component)
```typescript
// Dependencies
const { data: skills } = useQuery([`${dataSource}-skills`])
const { data: connections } = useQuery([`${dataSource}-connections`])
const { data: employees } = useQuery([`${dataSource}-employees`])

// Critical state
const currentService = dataSource === 'ffx' ? ffxService : techService
const CATEGORY_COLORS = dataSource === 'ffx' ? FFX_COLORS : TECH_COLORS
```

### SkillGoalWidget.tsx (Goal Setting)
```typescript
// Dependencies - MUST ALL BE CONSISTENT
const { data: skills } = useQuery([`${dataSource}-skills`])
const { data: connections } = useQuery([`${dataSource}-connections`])
const graphAnalyzer = useMemo(() => new SkillGraphAnalyzer(skills, connections))

// Critical fix: Wait for all dependencies before calculating
if (graphAnalyzer && employee && skills) {
  const path = calculateGoalPath(currentGoal)
}
```

### SkillRecommendationWidget.tsx (Recommendations)
```typescript
// Safe because it waits for queries to complete
const { data: recommendations } = useQuery({
  queryKey: ['skill-recommendations', employeeId, goalSkillId, service.constructor.name],
  queryFn: () => service.getSkillRecommendations(employeeId, goalSkillId),
  enabled: !!employeeId && !!service // Only runs when service is ready
})
```

## Performance Optimizations

1. **Service Persistence**: Service instances persist across switches (no reinitialization cost)
2. **Selective Invalidation**: Only invalidate previous dataset, not current
3. **Optimistic Updates**: Immediate UI updates with cache rollback on failure
4. **Memoized Computations**: Graph calculations cached until dependencies change

## Debugging Tips

When investigating data consistency issues:

1. **Check Query Keys**: Ensure queries use `${dataSource}-` prefix
2. **Verify Cache Invalidation**: Previous dataset queries should be invalidated
3. **Inspect Service Instance**: `currentService` should match selected dataset
4. **Monitor useEffect Dependencies**: All data dependencies should update together
5. **localStorage Check**: Verify correct storage keys are being used

## Common Pitfalls

1. **Missing Dependency**: useEffect that uses query data must include all dependencies
2. **Stale Service Reference**: Components caching old service instances
3. **Cache Key Collision**: Using same query key for different datasets
4. **State Timing**: Setting goals before data loads can use stale information

## Testing Dataset Consistency

To verify dataset switching works correctly:

1. Load Tech dataset → select employee → set goal → verify Tech skill displayed
2. Switch to FFX dataset → select employee → set goal → verify FFX skill displayed  
3. Switch back to Tech → select employee → set goal → verify Tech skill displayed
4. Repeat rapidly to test race conditions

Expected behavior: Goal cards always show skills from currently selected dataset, regardless of switching frequency.

## Critical Data Flow Issue: JustInTimeWidget Service Bypass

### Problem Identified
The JustInTimeWidget violates the established service architecture by directly importing and creating service instances instead of using the centralized service pattern. This causes goal state inconsistencies between characters.

### Architecture Violation
**Standard Pattern (SkillGoalWidget, SkillRecommendationWidget):**
```typescript
// Receives service as prop from parent
interface WidgetProps {
  service: SkillService;  // Centrally managed service instance
  dataSource: 'ffx' | 'tech';
}

// Uses consistent query pattern
const { data: skills } = useQuery([`${dataSource}-skills`])
```

**Anti-Pattern (JustInTimeWidget):**
```typescript
// Direct service import - bypasses service consistency
const { data: allSkills = [] } = useQuery({
  queryKey: [`${dataSource}-skills`],
  queryFn: async () => {
    if (dataSource === 'ffx') {
      const { sharedEnhancedService } = await import('../services/sharedService');
      return await sharedEnhancedService.getAllSkills();
    } else {
      const { default: TechSkillsService } = await import('../services/techSkillsData');
      const service = new TechSkillsService();  // NEW INSTANCE!
      return await service.getAllSkills();
    }
  }
});
```

### Root Cause of Goal Persistence Bug
1. **Service Instance Mismatch**: JustInTimeWidget creates its own service instances that may not be synchronized with the main application's service
2. **Cache Key Collision**: Multiple widgets using same query keys but different service instances
3. **Timing Race Condition**: useEffect processes `currentGoal` before consistent skills data loads
4. **State Leak**: Goal objects reference skills from one dataset but get processed with skills from another

### Symptoms
- Character A sets Goal X → Switch to Character B → Character B shows Goal X (wrong)
- Goal skill names appear correct but underlying skill objects are from wrong dataset
- Skills data loaded by JustInTimeWidget may be from different cache than goal-setting components

### Required Fix
1. **Service Prop Pattern**: Pass `service` as prop like other widgets
2. **Consistent Query Usage**: Use same query pattern as documented components
3. **Dependency Validation**: Ensure all data dependencies are from same service instance
4. **Cache Consistency**: Use centralized service for all skill data access

### Component Refactor Priority
- **COMPLETED**: Fix JustInTimeWidget service pattern ✅
- **COMPLETED**: Add service consistency validation ✅
- **COMPLETED**: Add debug logging for service instance tracking ✅

## RESOLUTION: SkillGoalWidget State Contamination Bug Fixed

### Final Root Cause
The issue was **NOT** in the JustInTimeWidget service pattern (though that was also fixed). The real problem was in the **SkillGoalWidget component**:

**The Bug:**
```typescript
// SkillGoalWidget useEffect dependency array was missing employeeId
useEffect(() => {
  if (selectedGoal && employee && skills && originalTotalStepsRef.current !== null) {
    // This would trigger for new employees using old originalTotalStepsRef value
    const updatedPath = calculateGoalPath(selectedGoal);
    // Goal gets automatically set for wrong employee!
  }
}, [JSON.stringify(employee?.mastered_skills), selectedGoal, skills]); // Missing employeeId!
```

**What Happened:**
1. Sarah Kim sets goal "CI/CD Pipeline" → `originalTotalStepsRef.current = 4`
2. User switches to Marcus Rodriguez → `selectedGoal` becomes `null` (correct)
3. BUT `originalTotalStepsRef.current` still equals `4` (wrong!)
4. SkillGoalWidget useEffect doesn't reset because `employeeId` not in dependencies
5. When Marcus data loads, condition `originalTotalStepsRef.current !== null` is true
6. Goal calculation triggers and automatically sets same goal for Marcus

**The Fix:**
```typescript
// Added employeeId to dependency array
}, [JSON.stringify(employee?.mastered_skills), selectedGoal, skills, employeeId]);

// Added separate useEffect to reset ref when employee changes
useEffect(() => {
  originalTotalStepsRef.current = null;
}, [employeeId]);
```

### Lessons Learned
1. **useEffect Dependencies**: Always include ALL state that affects the effect
2. **Ref Persistence**: useRef values persist across renders and need explicit reset
3. **Character-Specific State**: Employee-scoped state requires employee ID in dependencies
4. **Debug-First Approach**: Comprehensive logging revealed the exact issue location

### Testing Verification
The fix ensures:
- Each employee maintains their own independent goal
- No goal contamination when switching employees  
- `originalTotalStepsRef` resets properly for each employee
- Character-specific goals work correctly in JustInTimeWidget