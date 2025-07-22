// Enhanced Utility for Complex Network SkillMap Sigma.js node generation
// Based on Expert Sphere Grid network structure with artistic positioning

import { expertSphereNodes, expertSphereEdges } from '../services/expertSphereData'

// New functions for Expert Sphere Grid data
export function getExpertSphereGraphNodes(masteredSkills: string[]) {
  return expertSphereNodes.map(node => {
    const isMastered = masteredSkills.includes(node.id);
    const hasEmployeeSelected = masteredSkills.length > 0;
    
    return {
      ...node,
      // Convert x,y from 0-1 range to actual coordinates
      x: (node.x - 0.5) * 800,
      y: (node.y - 0.5) * 800,
      // Use standard Sigma.js node type
      type: 'circle',
      // Store original type as custom property
      nodeType: node.type,
      isMastered,
      hasEmployeeSelected,
      zIndex: isMastered ? 2 : 1,
      
      // Enhanced properties for mastered skills border display
      borderWidth: isMastered ? 3 : (node.type === 'core' ? 2 : 1),
      borderColor: isMastered ? '#F39C12' : (node.type === 'core' ? '#E74C3C' : node.type === 'pathway' ? '#8E44AD' : '#34495E'),
      
      // Label styling
      labelSize: node.type === 'core' ? 14 : (node.type === 'cluster_center' ? 12 : 10),
      labelColor: '#2C3E50',
      labelWeight: node.type === 'core' ? 'bold' : 'normal',
      
      // Hover effects
      hoverColor: '#F39C12',
      hoverSize: node.size * 1.2
    };
  });
}

export function getExpertSphereGraphEdges() {
  return expertSphereEdges.map(edge => ({
    ...edge,
    // Use standard Sigma.js edge type
    type: edge.type === 'curve' ? 'curved' : 'straight',
    // Enhanced edge styling
    opacity: 0.7,
    hoverOpacity: 1.0,
    hoverColor: '#3498DB',
    hoverSize: edge.size * 1.5,
  }));
}

export function getEnhancedGraphNodes(skills: any[], masteredSkills: string[], categoryColors: any, goalPathSkills?: Set<string>, goalSkillId?: string) {
  // Network positioning data from the complex sphere grid
  const networkPositions = {
    // Central Hub Cluster (largest central area)
    "central_1": { x: 0.48, y: 0.52, size: 8, type: "core" },
    "central_2": { x: 0.52, y: 0.48, size: 8, type: "major" },
    "central_3": { x: 0.45, y: 0.55, size: 8, type: "major" },
    "central_4": { x: 0.55, y: 0.52, size: 8, type: "major" },
    "central_5": { x: 0.50, y: 0.45, size: 8, type: "major" },
    
    // Top Left Circular Cluster
    "tl_1": { x: 0.15, y: 0.18, size: 8, type: "cluster_center" },
    "tl_2": { x: 0.12, y: 0.22, size: 8, type: "node" },
    "tl_3": { x: 0.18, y: 0.15, size: 8, type: "node" },
    "tl_4": { x: 0.19, y: 0.21, size: 8, type: "node" },
    "tl_5": { x: 0.11, y: 0.16, size: 8, type: "node" },
    "tl_6": { x: 0.16, y: 0.24, size: 8, type: "node" },
    "tl_7": { x: 0.08, y: 0.19, size: 8, type: "node" },
    "tl_8": { x: 0.21, y: 0.18, size: 8, type: "node" },
    
    // Top Right Circular Cluster
    "tr_1": { x: 0.75, y: 0.25, size: 8, type: "cluster_center" },
    "tr_2": { x: 0.72, y: 0.28, size: 8, type: "node" },
    "tr_3": { x: 0.78, y: 0.22, size: 8, type: "node" },
    "tr_4": { x: 0.79, y: 0.28, size: 8, type: "node" },
    "tr_5": { x: 0.71, y: 0.22, size: 8, type: "node" },
    "tr_6": { x: 0.76, y: 0.31, size: 8, type: "node" },
    "tr_7": { x: 0.68, y: 0.25, size: 8, type: "node" },
    "tr_8": { x: 0.81, y: 0.25, size: 8, type: "node" },
    
    // Left Middle Circular Cluster
    "lm_1": { x: 0.12, y: 0.45, size: 8, type: "cluster_center" },
    "lm_2": { x: 0.09, y: 0.48, size: 8, type: "node" },
    "lm_3": { x: 0.15, y: 0.42, size: 8, type: "node" },
    "lm_4": { x: 0.16, y: 0.48, size: 8, type: "node" },
    "lm_5": { x: 0.08, y: 0.42, size: 8, type: "node" },
    "lm_6": { x: 0.13, y: 0.51, size: 8, type: "node" },
    "lm_7": { x: 0.05, y: 0.45, size: 8, type: "node" },
    "lm_8": { x: 0.18, y: 0.45, size: 8, type: "node" },
    
    // Right Middle Circular Cluster
    "rm_1": { x: 0.85, y: 0.55, size: 8, type: "cluster_center" },
    "rm_2": { x: 0.82, y: 0.58, size: 8, type: "node" },
    "rm_3": { x: 0.88, y: 0.52, size: 8, type: "node" },
    "rm_4": { x: 0.89, y: 0.58, size: 8, type: "node" },
    "rm_5": { x: 0.81, y: 0.52, size: 8, type: "node" },
    "rm_6": { x: 0.86, y: 0.61, size: 8, type: "node" },
    "rm_7": { x: 0.78, y: 0.55, size: 8, type: "node" },
    "rm_8": { x: 0.91, y: 0.55, size: 8, type: "node" },
    
    // Bottom Left Circular Cluster
    "bl_1": { x: 0.25, y: 0.78, size: 8, type: "cluster_center" },
    "bl_2": { x: 0.22, y: 0.81, size: 8, type: "node" },
    "bl_3": { x: 0.28, y: 0.75, size: 8, type: "node" },
    "bl_4": { x: 0.29, y: 0.81, size: 8, type: "node" },
    "bl_5": { x: 0.21, y: 0.75, size: 8, type: "node" },
    "bl_6": { x: 0.26, y: 0.84, size: 8, type: "node" },
    "bl_7": { x: 0.18, y: 0.78, size: 8, type: "node" },
    "bl_8": { x: 0.31, y: 0.78, size: 8, type: "node" },
    
    // Bottom Right Circular Cluster
    "br_1": { x: 0.72, y: 0.82, size: 8, type: "cluster_center" },
    "br_2": { x: 0.69, y: 0.85, size: 8, type: "node" },
    "br_3": { x: 0.75, y: 0.79, size: 8, type: "node" },
    "br_4": { x: 0.76, y: 0.85, size: 8, type: "node" },
    "br_5": { x: 0.68, y: 0.79, size: 8, type: "node" },
    "br_6": { x: 0.73, y: 0.88, size: 8, type: "node" },
    "br_7": { x: 0.65, y: 0.82, size: 8, type: "node" },
    "br_8": { x: 0.78, y: 0.82, size: 8, type: "node" },
    
    // Pathway Connectors (Special nodes)
    "path_1": { x: 0.32, y: 0.35, size: 8, type: "pathway" },
    "path_2": { x: 0.38, y: 0.28, size: 8, type: "pathway" },
    "path_3": { x: 0.62, y: 0.35, size: 8, type: "pathway" },
    "path_4": { x: 0.58, y: 0.68, size: 8, type: "pathway" },
    "path_5": { x: 0.42, y: 0.72, size: 8, type: "pathway" },
    "path_6": { x: 0.28, y: 0.58, size: 8, type: "pathway" },
    "path_7": { x: 0.68, y: 0.42, size: 8, type: "pathway" },
    "path_8": { x: 0.48, y: 0.38, size: 8, type: "pathway" },
    
    // Intermediate Pathway Nodes
    "inter_1": { x: 0.22, y: 0.32, size: 8, type: "intermediate" },
    "inter_2": { x: 0.35, y: 0.22, size: 8, type: "intermediate" },
    "inter_3": { x: 0.65, y: 0.28, size: 8, type: "intermediate" },
    "inter_4": { x: 0.78, y: 0.38, size: 8, type: "intermediate" },
    "inter_5": { x: 0.82, y: 0.68, size: 8, type: "intermediate" },
    "inter_6": { x: 0.65, y: 0.78, size: 8, type: "intermediate" },
    "inter_7": { x: 0.35, y: 0.85, size: 8, type: "intermediate" },
    "inter_8": { x: 0.18, y: 0.68, size: 8, type: "intermediate" },
    "inter_9": { x: 0.15, y: 0.38, size: 8, type: "intermediate" },
    "inter_10": { x: 0.38, y: 0.18, size: 8, type: "intermediate" },
    
    // Additional scattered nodes for complexity
    "scatter_1": { x: 0.08, y: 0.32, size: 8, type: "scatter" },
    "scatter_2": { x: 0.92, y: 0.38, size: 8, type: "scatter" },
    "scatter_3": { x: 0.05, y: 0.65, size: 8, type: "scatter" },
    "scatter_4": { x: 0.88, y: 0.72, size: 8, type: "scatter" },
    "scatter_5": { x: 0.25, y: 0.92, size: 8, type: "scatter" },
    "scatter_6": { x: 0.75, y: 0.08, size: 8, type: "scatter" },
    "scatter_7": { x: 0.48, y: 0.05, size: 8, type: "scatter" },
    "scatter_8": { x: 0.52, y: 0.95, size: 8, type: "scatter" },
    
    // Top center cluster
    "tc_1": { x: 0.48, y: 0.15, size: 8, type: "node" },
    "tc_2": { x: 0.52, y: 0.18, size: 8, type: "node" },
    "tc_3": { x: 0.45, y: 0.12, size: 8, type: "node" },
    "tc_4": { x: 0.55, y: 0.15, size: 8, type: "node" },
    
    // Bottom center cluster
    "bc_1": { x: 0.48, y: 0.85, size: 8, type: "node" },
    "bc_2": { x: 0.52, y: 0.82, size: 8, type: "node" },
    "bc_3": { x: 0.45, y: 0.88, size: 8, type: "node" },
    "bc_4": { x: 0.55, y: 0.85, size: 8, type: "node" }
  };

  const nodes = [];
  const scaleFactor = 800; // Scale normalized coordinates to proper pixel values

  skills.forEach(skill => {
    const position = networkPositions[skill.id];
    if (!position) {
      console.warn(`No position found for skill: ${skill.id}`);
      return;
    }

    const isMastered = masteredSkills.includes(skill.id);
    const isOnGoalPath = goalPathSkills?.has(skill.id) || false;
    const isGoalNode = goalSkillId === skill.id;
    const baseColor = categoryColors[skill.category] || categoryColors.default;
    
    // Debug goal node detection
    if (isGoalNode) {
      console.log('🎯 Goal node detected:', skill.name, 'isMastered:', isMastered);
    }
    
    // Convert normalized coordinates (0-1) to actual pixel coordinates
    const x = (position.x - 0.5) * scaleFactor;
    const y = (position.y - 0.5) * scaleFactor;
    
    // Determine node visual properties based on type and category
    let nodeType = position.type;
    
    // Set uniform size for all non-mastered nodes
    const nodeSize = 8;
    
    // Enhanced color for goal path skills
    let nodeColor = baseColor;
    if (isOnGoalPath && !isMastered) {
      // Keep category color but will add golden border in Sigma reducer
      nodeColor = baseColor;
    }

    nodes.push({
      id: skill.id,
      label: (isGoalNode && !isMastered) ? `Current goal: ${skill.name}` : skill.name,
      x,
      y,
      size: nodeSize,
      color: nodeColor,
      category: skill.category,
      level: skill.level,
      nodeType: nodeType,
      zIndex: isMastered ? 3 : (isOnGoalPath ? 2 : (nodeType === 'core' ? 1 : 0)),
      isMastered: isMastered,
      isOnGoalPath: isOnGoalPath,
      isGoalNode: isGoalNode,
      hasEmployeeSelected: masteredSkills.length > 0,
      
      // Set node type to 'border' for mastered skills and goal path skills to use NodeBorderProgram
      type: (isMastered || isOnGoalPath) ? 'border' : 'circle',
      
      // Border styling - black for goal path, mastered skills, and different colors for node types
      borderColor: (isMastered || isOnGoalPath) ? '#000000' : (nodeType === 'core' ? '#E74C3C' : (nodeType === 'pathway' ? '#8E44AD' : '#34495E')),
      
      // Additional properties for enhanced styling
      sphere_cost: skill.sphere_cost || 1,
      activation_cost: skill.activation_cost || 10,
      description: skill.description || 'A powerful ability',
      
      // Visual enhancement properties - unmastered goal node gets extra thick border
      borderWidth: (isGoalNode && !isMastered) ? (console.log('🔧 Setting goal node border width to 10 for:', skill.name), 10) : (!isMastered && !isOnGoalPath ? (nodeType === 'core' ? 3 : (nodeType === 'cluster_center' ? 2 : 1)) : (isOnGoalPath && !isMastered ? 2 : undefined)),
      
      // Shadow and glow effects for important nodes
      shadowSize: nodeType === 'core' ? 4 : (nodeType === 'cluster_center' ? 2 : 0),
      shadowColor: nodeType === 'core' ? 'rgba(231, 76, 60, 0.3)' : 'rgba(0, 0, 0, 0.2)',
      
      // Label styling
      labelSize: nodeType === 'core' ? 14 : (nodeType === 'cluster_center' ? 12 : 10),
      labelColor: '#2C3E50',
      labelWeight: nodeType === 'core' ? 'bold' : 'normal',
      
      // Hover effects
      hoverColor: '#F39C12',
      hoverSize: nodeSize * 1.2
    });
  });

  return nodes;
}

// Enhanced edge generation for complex network connections
export function getEnhancedGraphEdges(connections: any[]) {
  return connections.map(conn => ({
    id: conn.id,
    source: conn.from,
    target: conn.to,
    size: 2,
    color: '#95A5A6',
    type: 'line',
    
    // Enhanced edge styling
    opacity: 0.7,
    hoverOpacity: 1.0,
    hoverColor: '#3498DB',
    hoverSize: 3,
    
    // Arrow styling for directed connections
    arrow: {
      enabled: true,
      size: 6,
      color: '#7F8C8D'
    }
  }));
}

// Utility to get node clustering information
export function getNodeClusters() {
  return {
    central: ['central_1', 'central_2', 'central_3', 'central_4', 'central_5'],
    topLeft: ['tl_1', 'tl_2', 'tl_3', 'tl_4', 'tl_5', 'tl_6', 'tl_7', 'tl_8'],
    topRight: ['tr_1', 'tr_2', 'tr_3', 'tr_4', 'tr_5', 'tr_6', 'tr_7', 'tr_8'],
    leftMiddle: ['lm_1', 'lm_2', 'lm_3', 'lm_4', 'lm_5', 'lm_6', 'lm_7', 'lm_8'],
    rightMiddle: ['rm_1', 'rm_2', 'rm_3', 'rm_4', 'rm_5', 'rm_6', 'rm_7', 'rm_8'],
    bottomLeft: ['bl_1', 'bl_2', 'bl_3', 'bl_4', 'bl_5', 'bl_6', 'bl_7', 'bl_8'],
    bottomRight: ['br_1', 'br_2', 'br_3', 'br_4', 'br_5', 'br_6', 'br_7', 'br_8'],
    pathways: ['path_1', 'path_2', 'path_3', 'path_4', 'path_5', 'path_6', 'path_7', 'path_8'],
    intermediate: ['inter_1', 'inter_2', 'inter_3', 'inter_4', 'inter_5', 'inter_6', 'inter_7', 'inter_8', 'inter_9', 'inter_10'],
    scattered: ['scatter_1', 'scatter_2', 'scatter_3', 'scatter_4', 'scatter_5', 'scatter_6', 'scatter_7', 'scatter_8'],
    topCenter: ['tc_1', 'tc_2', 'tc_3', 'tc_4'],
    bottomCenter: ['bc_1', 'bc_2', 'bc_3', 'bc_4']
  };
}

// Camera presets for exploring different areas of the sphere grid
export function getCameraPresets() {
  return {
    overview: { x: 0, y: 0, ratio: 0.8 },
    central: { x: 0, y: 20, ratio: 1.5 },
    topLeft: { x: -300, y: -280, ratio: 2.0 },
    topRight: { x: 200, y: -200, ratio: 2.0 },
    bottomLeft: { x: -200, y: 280, ratio: 2.0 },
    bottomRight: { x: 220, y: 280, ratio: 2.0 },
    pathways: { x: 0, y: 0, ratio: 1.2 }
  };
}