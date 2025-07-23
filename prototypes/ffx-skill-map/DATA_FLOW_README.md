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