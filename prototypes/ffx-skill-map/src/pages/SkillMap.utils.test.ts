import { getGraphNodes } from './SkillMap.utils';

describe('getGraphNodes', () => {
  const skills = [
    { id: 'a', name: 'Attack', category: 'combat', level: 1 },
    { id: 'b', name: 'Fire', category: 'magic', level: 1 },
    { id: 'c', name: 'Cure', category: 'magic', level: 2 },
  ];
  const categoryColors = {
    combat: '#ef4444',
    magic: '#3b82f6',
    default: '#6b7280',
  };

  it('marks mastered skills with flags while keeping same size, transparency handled in nodeReducer', () => {
    const masteredSkills = ['a', 'c'];
    const nodes = getGraphNodes(skills, masteredSkills, categoryColors);
    const masteredNode = nodes.find(n => n.id === 'a');
    const unmasteredNode = nodes.find(n => n.id === 'b');
    
    expect(masteredNode.size).toBe(10);
    expect(masteredNode.color).toBe('#ef4444');
    expect(masteredNode.isMastered).toBe(true);
    expect(unmasteredNode.size).toBe(10);
    expect(unmasteredNode.color).toBe('#3b82f6'); // Base color, transparency handled in nodeReducer
    expect(unmasteredNode.isMastered).toBe(false);
  });

  it('all nodes have default size and full color if no mastered skills', () => {
    const nodes = getGraphNodes(skills, [], categoryColors);
    nodes.forEach(n => {
      expect(n.size).toBe(10);
      expect(n.color).toHaveLength(7); // #rrggbb format (no alpha)
      expect(n.hasEmployeeSelected).toBe(false);
    });
  });

  it('assigns correct color by category', () => {
    const nodes = getGraphNodes(skills, [], categoryColors);
    expect(nodes.find(n => n.id === 'a').color).toBe('#ef4444');
    expect(nodes.find(n => n.id === 'b').color).toBe('#3b82f6');
  });

  it('lays out nodes in concentric circles by level', () => {
    const nodes = getGraphNodes(skills, [], categoryColors);
    const level1 = nodes.filter(n => n.level === 1);
    const level2 = nodes.filter(n => n.level === 2);
    // All level 1 nodes should have the same radius
    const r1 = Math.sqrt(level1[0].x ** 2 + level1[0].y ** 2);
    expect(Math.abs(Math.sqrt(level1[1].x ** 2 + level1[1].y ** 2) - r1)).toBeLessThan(0.0001);
    // Level 2 node should have a larger radius
    const r2 = Math.sqrt(level2[0].x ** 2 + level2[0].y ** 2);
    expect(r2).toBeGreaterThan(r1);
  });
}); 