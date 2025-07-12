// Utility for SkillMap Sigma.js node generation
export function getGraphNodes(skills, masteredSkills, categoryColors) {
  // Group skills by level for layout
  const skillsByLevel = {};
  skills.forEach(skill => {
    if (!skillsByLevel[skill.level]) skillsByLevel[skill.level] = [];
    skillsByLevel[skill.level].push(skill);
  });
  const minLevel = Math.min(...skills.map(s => s.level));
  const radiusStep = 2;
  const nodes = [];
  Object.entries(skillsByLevel).forEach(([levelStr, levelSkills]) => {
    const level = Number(levelStr);
    const r = (level - minLevel + 1) * radiusStep;
    const count = levelSkills.length;
    levelSkills.forEach((skill, i) => {
      const theta = (2 * Math.PI * i) / count;
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      const isMastered = masteredSkills.includes(skill.id);
      const baseColor = categoryColors[skill.category] || categoryColors.default;
      
      nodes.push({
        id: skill.id,
        label: skill.name,
        x,
        y,
        size: 10, // Keep all nodes the same size
        color: baseColor, // Always use base color, handle transparency in nodeReducer
        category: skill.category,
        level: skill.level,
        zIndex: isMastered ? 1 : 0,
        isMastered: isMastered, // Add this flag for nodeReducer
        hasEmployeeSelected: masteredSkills.length > 0, // Add this flag for nodeReducer
      });
    });
  });
  return nodes;
} 