// Expert Sphere Grid Network - Nodes and Edges for Sigma.js
// Based on the complex sphere grid structure with circular clusters and pathways

export const expertSphereNodes = [
  // Central Hub Cluster - Ultimate Abilities
  { id: "central_1", x: 0.48, y: 0.52, size: 12, color: "#8B4513", label: "Ultima", type: "core" },
  { id: "central_2", x: 0.52, y: 0.48, size: 10, color: "#FF6B35", label: "Flare", type: "major" },
  { id: "central_3", x: 0.45, y: 0.55, size: 10, color: "#4ECDC4", label: "Holy", type: "major" },
  { id: "central_4", x: 0.55, y: 0.52, size: 10, color: "#45B7D1", label: "Full-Life", type: "major" },
  { id: "central_5", x: 0.50, y: 0.45, size: 10, color: "#96CEB4", label: "Auto-Life", type: "major" },
  
  // Top Left Circular Cluster - Black Magic Progression
  { id: "tl_1", x: 0.15, y: 0.18, size: 8, color: "#FF6B6B", label: "Firaga", type: "cluster_center" },
  { id: "tl_2", x: 0.12, y: 0.22, size: 6, color: "#4ECDC4", label: "Fira", type: "node" },
  { id: "tl_3", x: 0.18, y: 0.15, size: 6, color: "#45B7D1", label: "Fire", type: "node" },
  { id: "tl_4", x: 0.19, y: 0.21, size: 6, color: "#96CEB4", label: "Thundaga", type: "node" },
  { id: "tl_5", x: 0.11, y: 0.16, size: 6, color: "#FFEAA7", label: "Thundara", type: "node" },
  { id: "tl_6", x: 0.16, y: 0.24, size: 6, color: "#DDA0DD", label: "Thunder", type: "node" },
  { id: "tl_7", x: 0.08, y: 0.19, size: 6, color: "#98D8C8", label: "Blizzaga", type: "node" },
  { id: "tl_8", x: 0.21, y: 0.18, size: 6, color: "#F7DC6F", label: "Blizzara", type: "node" },
  
  // Top Right Circular Cluster - White Magic/Support
  { id: "tr_1", x: 0.75, y: 0.25, size: 8, color: "#BB8FCE", label: "Curaga", type: "cluster_center" },
  { id: "tr_2", x: 0.72, y: 0.28, size: 6, color: "#85C1E9", label: "Cura", type: "node" },
  { id: "tr_3", x: 0.78, y: 0.22, size: 6, color: "#F8C471", label: "Cure", type: "node" },
  { id: "tr_4", x: 0.79, y: 0.28, size: 6, color: "#82E0AA", label: "Hastega", type: "node" },
  { id: "tr_5", x: 0.71, y: 0.22, size: 6, color: "#FF9FF3", label: "Haste", type: "node" },
  { id: "tr_6", x: 0.76, y: 0.31, size: 6, color: "#54A0FF", label: "Life", type: "node" },
  { id: "tr_7", x: 0.68, y: 0.25, size: 6, color: "#5F27CD", label: "Esuna", type: "node" },
  { id: "tr_8", x: 0.81, y: 0.25, size: 6, color: "#00D2D3", label: "Protect", type: "node" },
  
  // Left Middle Circular Cluster - Physical Skills
  { id: "lm_1", x: 0.12, y: 0.45, size: 8, color: "#FF9F43", label: "Full Break", type: "cluster_center" },
  { id: "lm_2", x: 0.09, y: 0.48, size: 6, color: "#10AC84", label: "Power Break", type: "node" },
  { id: "lm_3", x: 0.15, y: 0.42, size: 6, color: "#EE5A6F", label: "Armor Break", type: "node" },
  { id: "lm_4", x: 0.16, y: 0.48, size: 6, color: "#0ABDE3", label: "Magic Break", type: "node" },
  { id: "lm_5", x: 0.08, y: 0.42, size: 6, color: "#FEA47F", label: "Mental Break", type: "node" },
  { id: "lm_6", x: 0.13, y: 0.51, size: 6, color: "#3867D6", label: "Quick Hit", type: "node" },
  { id: "lm_7", x: 0.05, y: 0.45, size: 6, color: "#8395A7", label: "Provoke", type: "node" },
  { id: "lm_8", x: 0.18, y: 0.45, size: 6, color: "#222F3E", label: "Delay Attack", type: "node" },
  
  // Right Middle Circular Cluster - Special Abilities
  { id: "rm_1", x: 0.85, y: 0.55, size: 8, color: "#C44569", label: "Doublecast", type: "cluster_center" },
  { id: "rm_2", x: 0.82, y: 0.58, size: 6, color: "#F8B500", label: "Reflect", type: "node" },
  { id: "rm_3", x: 0.88, y: 0.52, size: 6, color: "#6C5CE7", label: "Dispel", type: "node" },
  { id: "rm_4", x: 0.89, y: 0.58, size: 6, color: "#A29BFE", label: "Shell", type: "node" },
  { id: "rm_5", x: 0.81, y: 0.52, size: 6, color: "#FD79A8", label: "Regen", type: "node" },
  { id: "rm_6", x: 0.86, y: 0.61, size: 6, color: "#00B894", label: "Slow", type: "node" },
  { id: "rm_7", x: 0.78, y: 0.55, size: 6, color: "#E17055", label: "Silence", type: "node" },
  { id: "rm_8", x: 0.91, y: 0.55, size: 6, color: "#0984E3", label: "Sleep", type: "node" },
  
  // Bottom Left Circular Cluster - Status Skills
  { id: "bl_1", x: 0.25, y: 0.78, size: 8, color: "#00B894", label: "Zombie Attack", type: "cluster_center" },
  { id: "bl_2", x: 0.22, y: 0.81, size: 6, color: "#E84393", label: "Poison Attack", type: "node" },
  { id: "bl_3", x: 0.28, y: 0.75, size: 6, color: "#FDCB6E", label: "Sleep Attack", type: "node" },
  { id: "bl_4", x: 0.29, y: 0.81, size: 6, color: "#6C5CE7", label: "Silence Attack", type: "node" },
  { id: "bl_5", x: 0.21, y: 0.75, size: 6, color: "#A29BFE", label: "Dark Attack", type: "node" },
  { id: "bl_6", x: 0.26, y: 0.84, size: 6, color: "#FD79A8", label: "Stone Touch", type: "node" },
  { id: "bl_7", x: 0.18, y: 0.78, size: 6, color: "#00CEC9", label: "Death Touch", type: "node" },
  { id: "bl_8", x: 0.31, y: 0.78, size: 6, color: "#E17055", label: "Slow Attack", type: "node" },
  
  // Bottom Right Circular Cluster - Elemental Magic
  { id: "br_1", x: 0.72, y: 0.82, size: 8, color: "#74B9FF", label: "Waterga", type: "cluster_center" },
  { id: "br_2", x: 0.69, y: 0.85, size: 6, color: "#55A3FF", label: "Watera", type: "node" },
  { id: "br_3", x: 0.75, y: 0.79, size: 6, color: "#FD79A8", label: "Water", type: "node" },
  { id: "br_4", x: 0.76, y: 0.85, size: 6, color: "#FDCB6E", label: "Bio", type: "node" },
  { id: "br_5", x: 0.68, y: 0.79, size: 6, color: "#E84393", label: "Demi", type: "node" },
  { id: "br_6", x: 0.73, y: 0.88, size: 6, color: "#00B894", label: "Drain", type: "node" },
  { id: "br_7", x: 0.65, y: 0.82, size: 6, color: "#A29BFE", label: "Osmose", type: "node" },
  { id: "br_8", x: 0.78, y: 0.82, size: 6, color: "#FD79A8", label: "Death", type: "node" },
  
  // Pathway Connectors - Character Paths
  { id: "path_1", x: 0.32, y: 0.35, size: 8, color: "#8E44AD", label: "Lock Spheres", type: "pathway" },
  { id: "path_2", x: 0.38, y: 0.28, size: 8, color: "#8E44AD", label: "Tidus Path", type: "pathway" },
  { id: "path_3", x: 0.62, y: 0.35, size: 8, color: "#8E44AD", label: "Rikku Path", type: "pathway" },
  { id: "path_4", x: 0.58, y: 0.68, size: 8, color: "#8E44AD", label: "Auron Path", type: "pathway" },
  { id: "path_5", x: 0.42, y: 0.72, size: 8, color: "#8E44AD", label: "Wakka Path", type: "pathway" },
  { id: "path_6", x: 0.28, y: 0.58, size: 8, color: "#8E44AD", label: "Lulu Path", type: "pathway" },
  { id: "path_7", x: 0.68, y: 0.42, size: 8, color: "#8E44AD", label: "Yuna Path", type: "pathway" },
  { id: "path_8", x: 0.48, y: 0.38, size: 8, color: "#8E44AD", label: "Kimahri Path", type: "pathway" },
  
  // Intermediate Pathway Nodes - Support Skills
  { id: "inter_1", x: 0.22, y: 0.32, size: 5, color: "#95A5A6", label: "Cheer", type: "intermediate" },
  { id: "inter_2", x: 0.35, y: 0.22, size: 5, color: "#95A5A6", label: "Focus", type: "intermediate" },
  { id: "inter_3", x: 0.65, y: 0.28, size: 5, color: "#95A5A6", label: "Aim", type: "intermediate" },
  { id: "inter_4", x: 0.78, y: 0.38, size: 5, color: "#95A5A6", label: "Reflex", type: "intermediate" },
  { id: "inter_5", x: 0.82, y: 0.68, size: 5, color: "#95A5A6", label: "Luck", type: "intermediate" },
  { id: "inter_6", x: 0.65, y: 0.78, size: 5, color: "#95A5A6", label: "Jinx", type: "intermediate" },
  { id: "inter_7", x: 0.35, y: 0.85, size: 5, color: "#95A5A6", label: "Spare Change", type: "intermediate" },
  { id: "inter_8", x: 0.18, y: 0.68, size: 5, color: "#95A5A6", label: "Lancet", type: "intermediate" },
  { id: "inter_9", x: 0.15, y: 0.38, size: 5, color: "#95A5A6", label: "Guard", type: "intermediate" },
  { id: "inter_10", x: 0.38, y: 0.18, size: 5, color: "#95A5A6", label: "Sentinel", type: "intermediate" },
  
  // Additional scattered nodes - Utility Skills
  { id: "scatter_1", x: 0.08, y: 0.32, size: 4, color: "#BDC3C7", label: "Flee", type: "scatter" },
  { id: "scatter_2", x: 0.92, y: 0.38, size: 4, color: "#BDC3C7", label: "Use", type: "scatter" },
  { id: "scatter_3", x: 0.05, y: 0.65, size: 4, color: "#BDC3C7", label: "Extract Power", type: "scatter" },
  { id: "scatter_4", x: 0.88, y: 0.72, size: 4, color: "#BDC3C7", label: "Extract Mana", type: "scatter" },
  { id: "scatter_5", x: 0.25, y: 0.92, size: 4, color: "#BDC3C7", label: "Extract Speed", type: "scatter" },
  { id: "scatter_6", x: 0.75, y: 0.08, size: 4, color: "#BDC3C7", label: "Extract Ability", type: "scatter" },
  { id: "scatter_7", x: 0.48, y: 0.05, size: 4, color: "#BDC3C7", label: "Copycat", type: "scatter" },
  { id: "scatter_8", x: 0.52, y: 0.95, size: 4, color: "#BDC3C7", label: "Mix", type: "scatter" },
  
  // Top center cluster - Advanced Elemental Magic
  { id: "tc_1", x: 0.48, y: 0.15, size: 7, color: "#E74C3C", label: "Blizzard", type: "node" },
  { id: "tc_2", x: 0.52, y: 0.18, size: 6, color: "#3498DB", label: "NulBlaze", type: "node" },
  { id: "tc_3", x: 0.45, y: 0.12, size: 6, color: "#2ECC71", label: "NulFrost", type: "node" },
  { id: "tc_4", x: 0.55, y: 0.15, size: 6, color: "#F39C12", label: "NulShock", type: "node" },
  
  // Bottom center cluster - Auto-Abilities and Equipment Skills
  { id: "bc_1", x: 0.48, y: 0.85, size: 7, color: "#9B59B6", label: "Auto-Haste", type: "node" },
  { id: "bc_2", x: 0.52, y: 0.82, size: 6, color: "#1ABC9C", label: "Auto-Protect", type: "node" },
  { id: "bc_3", x: 0.45, y: 0.88, size: 6, color: "#E67E22", label: "Auto-Shell", type: "node" },
  { id: "bc_4", x: 0.55, y: 0.85, size: 6, color: "#34495E", label: "Auto-Regen", type: "node" },
  
  // Additional high-level skills distributed throughout
  { id: "skill_1", x: 0.35, y: 0.45, size: 6, color: "#FF5733", label: "Triple Foul", type: "node" },
  { id: "skill_2", x: 0.65, y: 0.55, size: 6, color: "#33FF57", label: "Pray", type: "node" },
  { id: "skill_3", x: 0.25, y: 0.35, size: 6, color: "#3357FF", label: "Vigor", type: "node" },
  { id: "skill_4", x: 0.75, y: 0.65, size: 6, color: "#FF33F5", label: "Pilfer Gil", type: "node" },
  { id: "skill_5", x: 0.15, y: 0.55, size: 6, color: "#F5FF33", label: "Steal", type: "node" },
  { id: "skill_6", x: 0.85, y: 0.45, size: 6, color: "#FF8333", label: "Mug", type: "node" },
  { id: "skill_7", x: 0.40, y: 0.60, size: 6, color: "#8333FF", label: "Bribe", type: "node" },
  { id: "skill_8", x: 0.60, y: 0.40, size: 6, color: "#33FFF5", label: "Threaten", type: "node" },
  
  // Protection and Status Recovery Skills
  { id: "prot_1", x: 0.30, y: 0.25, size: 5, color: "#FFD700", label: "NulTide", type: "node" },
  { id: "prot_2", x: 0.70, y: 0.75, size: 5, color: "#C0C0C0", label: "NulAll", type: "node" },
  { id: "prot_3", x: 0.20, y: 0.60, size: 5, color: "#CD7F32", label: "Dispel", type: "node" },
  { id: "prot_4", x: 0.80, y: 0.30, size: 5, color: "#E6E6FA", label: "Esuna", type: "node" }
];

export const expertSphereEdges = [
  // Central hub internal connections
  { id: "e_central_1", source: "central_1", target: "central_2", type: "line", size: 3, color: "#34495E" },
  { id: "e_central_2", source: "central_1", target: "central_3", type: "line", size: 3, color: "#34495E" },
  { id: "e_central_3", source: "central_1", target: "central_4", type: "line", size: 3, color: "#34495E" },
  { id: "e_central_4", source: "central_1", target: "central_5", type: "line", size: 3, color: "#34495E" },
  { id: "e_central_5", source: "central_2", target: "central_4", type: "line", size: 2, color: "#7F8C8D" },
  { id: "e_central_6", source: "central_3", target: "central_5", type: "line", size: 2, color: "#7F8C8D" },
  
  // Top Left cluster internal connections
  { id: "e_tl_1", source: "tl_1", target: "tl_2", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_tl_2", source: "tl_1", target: "tl_3", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_tl_3", source: "tl_1", target: "tl_4", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_tl_4", source: "tl_1", target: "tl_5", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_tl_5", source: "tl_1", target: "tl_6", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_tl_6", source: "tl_1", target: "tl_7", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_tl_7", source: "tl_1", target: "tl_8", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_tl_8", source: "tl_2", target: "tl_6", type: "line", size: 1, color: "#BDC3C7" },
  { id: "e_tl_9", source: "tl_3", target: "tl_8", type: "line", size: 1, color: "#BDC3C7" },
  { id: "e_tl_10", source: "tl_4", target: "tl_8", type: "line", size: 1, color: "#BDC3C7" },
  { id: "e_tl_11", source: "tl_5", target: "tl_7", type: "line", size: 1, color: "#BDC3C7" },
  
  // Top Right cluster internal connections
  { id: "e_tr_1", source: "tr_1", target: "tr_2", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_tr_2", source: "tr_1", target: "tr_3", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_tr_3", source: "tr_1", target: "tr_4", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_tr_4", source: "tr_1", target: "tr_5", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_tr_5", source: "tr_1", target: "tr_6", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_tr_6", source: "tr_1", target: "tr_7", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_tr_7", source: "tr_1", target: "tr_8", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_tr_8", source: "tr_2", target: "tr_6", type: "line", size: 1, color: "#BDC3C7" },
  { id: "e_tr_9", source: "tr_3", target: "tr_8", type: "line", size: 1, color: "#BDC3C7" },
  { id: "e_tr_10", source: "tr_4", target: "tr_6", type: "line", size: 1, color: "#BDC3C7" },
  { id: "e_tr_11", source: "tr_5", target: "tr_7", type: "line", size: 1, color: "#BDC3C7" },
  
  // Left Middle cluster internal connections
  { id: "e_lm_1", source: "lm_1", target: "lm_2", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_lm_2", source: "lm_1", target: "lm_3", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_lm_3", source: "lm_1", target: "lm_4", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_lm_4", source: "lm_1", target: "lm_5", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_lm_5", source: "lm_1", target: "lm_6", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_lm_6", source: "lm_1", target: "lm_7", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_lm_7", source: "lm_1", target: "lm_8", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_lm_8", source: "lm_2", target: "lm_6", type: "line", size: 1, color: "#BDC3C7" },
  { id: "e_lm_9", source: "lm_3", target: "lm_8", type: "line", size: 1, color: "#BDC3C7" },
  { id: "e_lm_10", source: "lm_4", target: "lm_6", type: "line", size: 1, color: "#BDC3C7" },
  { id: "e_lm_11", source: "lm_5", target: "lm_7", type: "line", size: 1, color: "#BDC3C7" },
  
  // Right Middle cluster internal connections
  { id: "e_rm_1", source: "rm_1", target: "rm_2", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_rm_2", source: "rm_1", target: "rm_3", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_rm_3", source: "rm_1", target: "rm_4", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_rm_4", source: "rm_1", target: "rm_5", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_rm_5", source: "rm_1", target: "rm_6", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_rm_6", source: "rm_1", target: "rm_7", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_rm_7", source: "rm_1", target: "rm_8", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_rm_8", source: "rm_2", target: "rm_6", type: "line", size: 1, color: "#BDC3C7" },
  { id: "e_rm_9", source: "rm_3", target: "rm_8", type: "line", size: 1, color: "#BDC3C7" },
  { id: "e_rm_10", source: "rm_4", target: "rm_6", type: "line", size: 1, color: "#BDC3C7" },
  { id: "e_rm_11", source: "rm_5", target: "rm_7", type: "line", size: 1, color: "#BDC3C7" },
  
  // Bottom Left cluster internal connections
  { id: "e_bl_1", source: "bl_1", target: "bl_2", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_bl_2", source: "bl_1", target: "bl_3", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_bl_3", source: "bl_1", target: "bl_4", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_bl_4", source: "bl_1", target: "bl_5", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_bl_5", source: "bl_1", target: "bl_6", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_bl_6", source: "bl_1", target: "bl_7", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_bl_7", source: "bl_1", target: "bl_8", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_bl_8", source: "bl_2", target: "bl_6", type: "line", size: 1, color: "#BDC3C7" },
  { id: "e_bl_9", source: "bl_3", target: "bl_8", type: "line", size: 1, color: "#BDC3C7" },
  { id: "e_bl_10", source: "bl_4", target: "bl_6", type: "line", size: 1, color: "#BDC3C7" },
  { id: "e_bl_11", source: "bl_5", target: "bl_7", type: "line", size: 1, color: "#BDC3C7" },
  
  // Bottom Right cluster internal connections
  { id: "e_br_1", source: "br_1", target: "br_2", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_br_2", source: "br_1", target: "br_3", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_br_3", source: "br_1", target: "br_4", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_br_4", source: "br_1", target: "br_5", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_br_5", source: "br_1", target: "br_6", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_br_6", source: "br_1", target: "br_7", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_br_7", source: "br_1", target: "br_8", type: "line", size: 2, color: "#95A5A6" },
  { id: "e_br_8", source: "br_2", target: "br_6", type: "line", size: 1, color: "#BDC3C7" },
  { id: "e_br_9", source: "br_3", target: "br_8", type: "line", size: 1, color: "#BDC3C7" },
  { id: "e_br_10", source: "br_4", target: "br_6", type: "line", size: 1, color: "#BDC3C7" },
  { id: "e_br_11", source: "br_5", target: "br_7", type: "line", size: 1, color: "#BDC3C7" },
  
  // Pathway connections - connecting clusters via pathway nodes
  { id: "e_path_1", source: "tl_1", target: "path_1", type: "line", size: 3, color: "#8E44AD" },
  { id: "e_path_2", source: "path_1", target: "central_1", type: "line", size: 3, color: "#8E44AD" },
  { id: "e_path_3", source: "tr_1", target: "path_3", type: "line", size: 3, color: "#8E44AD" },
  { id: "e_path_4", source: "path_3", target: "central_1", type: "line", size: 3, color: "#8E44AD" },
  { id: "e_path_5", source: "lm_1", target: "path_6", type: "line", size: 3, color: "#8E44AD" },
  { id: "e_path_6", source: "path_6", target: "central_1", type: "line", size: 3, color: "#8E44AD" },
  { id: "e_path_7", source: "rm_1", target: "path_7", type: "line", size: 3, color: "#8E44AD" },
  { id: "e_path_8", source: "path_7", target: "central_1", type: "line", size: 3, color: "#8E44AD" },
  { id: "e_path_9", source: "bl_1", target: "path_5", type: "line", size: 3, color: "#8E44AD" },
  { id: "e_path_10", source: "path_5", target: "central_1", type: "line", size: 3, color: "#8E44AD" },
  { id: "e_path_11", source: "br_1", target: "path_4", type: "line", size: 3, color: "#8E44AD" },
  { id: "e_path_12", source: "path_4", target: "central_1", type: "line", size: 3, color: "#8E44AD" },
  
  // Top center connections
  { id: "e_tc_1", source: "tc_1", target: "path_2", type: "line", size: 2, color: "#8E44AD" },
  { id: "e_tc_2", source: "path_2", target: "central_5", type: "line", size: 2, color: "#8E44AD" },
  { id: "e_tc_3", source: "tc_2", target: "tc_1", type: "line", size: 1, color: "#95A5A6" },
  { id: "e_tc_4", source: "tc_3", target: "tc_1", type: "line", size: 1, color: "#95A5A6" },
  { id: "e_tc_5", source: "tc_4", target: "tc_1", type: "line", size: 1, color: "#95A5A6" },
  
  // Bottom center connections
  { id: "e_bc_1", source: "bc_1", target: "path_8", type: "line", size: 2, color: "#8E44AD" },
  { id: "e_bc_2", source: "path_8", target: "central_3", type: "line", size: 2, color: "#8E44AD" },
  { id: "e_bc_3", source: "bc_2", target: "bc_1", type: "line", size: 1, color: "#95A5A6" },
  { id: "e_bc_4", source: "bc_3", target: "bc_1", type: "line", size: 1, color: "#95A5A6" },
  { id: "e_bc_5", source: "bc_4", target: "bc_1", type: "line", size: 1, color: "#95A5A6" },
  
  // Intermediate pathway connections
  { id: "e_inter_1", source: "inter_1", target: "tl_8", type: "line", size: 1, color: "#7F8C8D" },
  { id: "e_inter_2", source: "inter_1", target: "path_1", type: "line", size: 1, color: "#7F8C8D" },
  { id: "e_inter_3", source: "inter_2", target: "tc_3", type: "line", size: 1, color: "#7F8C8D" },
  { id: "e_inter_4", source: "inter_2", target: "path_2", type: "line", size: 1, color: "#7F8C8D" },
  { id: "e_inter_5", source: "inter_3", target: "tr_8", type: "line", size: 1, color: "#7F8C8D" },
  { id: "e_inter_6", source: "inter_3", target: "path_3", type: "line", size: 1, color: "#7F8C8D" },
  { id: "e_inter_7", source: "inter_4", target: "rm_8", type: "line", size: 1, color: "#7F8C8D" },
  { id: "e_inter_8", source: "inter_4", target: "path_7", type: "line", size: 1, color: "#7F8C8D" },
  { id: "e_inter_9", source: "inter_5", target: "br_8", type: "line", size: 1, color: "#7F8C8D" },
  { id: "e_inter_10", source: "inter_5", target: "path_4", type: "line", size: 1, color: "#7F8C8D" },
  { id: "e_inter_11", source: "inter_6", target: "bc_4", type: "line", size: 1, color: "#7F8C8D" },
  { id: "e_inter_12", source: "inter_6", target: "path_8", type: "line", size: 1, color: "#7F8C8D" },
  { id: "e_inter_13", source: "inter_7", target: "bl_8", type: "line", size: 1, color: "#7F8C8D" },
  { id: "e_inter_14", source: "inter_7", target: "path_5", type: "line", size: 1, color: "#7F8C8D" },
  { id: "e_inter_15", source: "inter_8", target: "lm_8", type: "line", size: 1, color: "#7F8C8D" },
  { id: "e_inter_16", source: "inter_8", target: "path_6", type: "line", size: 1, color: "#7F8C8D" },
  { id: "e_inter_17", source: "inter_9", target: "tl_8", type: "line", size: 1, color: "#7F8C8D" },
  { id: "e_inter_18", source: "inter_9", target: "lm_3", type: "line", size: 1, color: "#7F8C8D" },
  { id: "e_inter_19", source: "inter_10", target: "tc_3", type: "line", size: 1, color: "#7F8C8D" },
  { id: "e_inter_20", source: "inter_10", target: "tr_3", type: "line", size: 1, color: "#7F8C8D" },
  
  // Scattered node connections
  { id: "e_scatter_1", source: "scatter_1", target: "tl_7", type: "line", size: 1, color: "#ECF0F1" },
  { id: "e_scatter_2", source: "scatter_2", target: "tr_8", type: "line", size: 1, color: "#ECF0F1" },
  { id: "e_scatter_3", source: "scatter_3", target: "lm_7", type: "line", size: 1, color: "#ECF0F1" },
  { id: "e_scatter_4", source: "scatter_4", target: "rm_8", type: "line", size: 1, color: "#ECF0F1" },
  { id: "e_scatter_5", source: "scatter_5", target: "bl_7", type: "line", size: 1, color: "#ECF0F1" },
  { id: "e_scatter_6", source: "scatter_6", target: "tr_3", type: "line", size: 1, color: "#ECF0F1" },
  { id: "e_scatter_7", source: "scatter_7", target: "tc_3", type: "line", size: 1, color: "#ECF0F1" },
  { id: "e_scatter_8", source: "scatter_8", target: "bc_3", type: "line", size: 1, color: "#ECF0F1" },
  
  // Long-range connections between distant clusters
  { id: "e_long_1", source: "tl_1", target: "br_1", type: "curve", size: 2, color: "#3498DB" },
  { id: "e_long_2", source: "tr_1", target: "bl_1", type: "curve", size: 2, color: "#E74C3C" },
  { id: "e_long_3", source: "lm_1", target: "rm_1", type: "curve", size: 2, color: "#2ECC71" },
  { id: "e_long_4", source: "tc_1", target: "bc_1", type: "curve", size: 2, color: "#F39C12" },
  
  // Additional complexity connections
  { id: "e_complex_1", source: "tl_4", target: "inter_2", type: "line", size: 1, color: "#BDC3C7" },
  { id: "e_complex_2", source: "tr_5", target: "inter_3", type: "line", size: 1, color: "#BDC3C7" },
  { id: "e_complex_3", source: "lm_5", target: "inter_8", type: "line", size: 1, color: "#BDC3C7" },
  { id: "e_complex_4", source: "rm_5", target: "inter_4", type: "line", size: 1, color: "#BDC3C7" },
  { id: "e_complex_5", source: "bl_5", target: "inter_7", type: "line", size: 1, color: "#BDC3C7" },
  { id: "e_complex_6", source: "br_5", target: "inter_5", type: "line", size: 1, color: "#BDC3C7" }
];

// Ability information display system
export const abilityInfo = {
  // Ultimate abilities
  "Ultima": { mp: 90, type: "Black Magic", description: "Ultimate non-elemental magic damage" },
  "Flare": { mp: 54, type: "Black Magic", description: "Powerful non-elemental magic damage" },
  "Holy": { mp: 85, type: "White Magic", description: "Holy elemental magic damage" },
  "Full-Life": { mp: 60, type: "White Magic", description: "Revive with full HP" },
  "Auto-Life": { mp: 97, type: "White Magic", description: "Automatic revival upon death" },
  
  // Black Magic progression
  "Firaga": { mp: 16, type: "Black Magic", description: "Heavy fire damage to one enemy" },
  "Fira": { mp: 8, type: "Black Magic", description: "Moderate fire damage to one enemy" },
  "Fire": { mp: 4, type: "Black Magic", description: "Small fire damage to one enemy" },
  "Thundaga": { mp: 16, type: "Black Magic", description: "Heavy lightning damage to one enemy" },
  "Thundara": { mp: 8, type: "Black Magic", description: "Moderate lightning damage to one enemy" },
  "Thunder": { mp: 4, type: "Black Magic", description: "Small lightning damage to one enemy" },
  
  // White Magic progression
  "Curaga": { mp: 20, type: "White Magic", description: "Large HP recovery to one ally" },
  "Cura": { mp: 10, type: "White Magic", description: "Moderate HP recovery to one ally" },
  "Cure": { mp: 4, type: "White Magic", description: "Small HP recovery to one ally" },
  "Hastega": { mp: 30, type: "White Magic", description: "Haste effect to all allies" },
  "Haste": { mp: 8, type: "White Magic", description: "Haste effect to one ally" },
  
  // Physical Skills
  "Full Break": { mp: 99, type: "Skill", description: "Reduce all stats of one enemy" },
  "Quick Hit": { mp: 36, type: "Skill", description: "Fast physical attack with high accuracy" },
  "Doublecast": { mp: 0, type: "Special", description: "Cast two black magic spells in one turn" },
  
  // Character-specific abilities
  "Flee": { mp: 0, type: "Special", description: "Escape from battle (Tidus only)" },
  "Use": { mp: 0, type: "Special", description: "Use items in battle (Rikku only)" },
  "Lancet": { mp: 1, type: "Special", description: "Absorb HP/MP and learn Blue Magic (Kimahri only)" }
};