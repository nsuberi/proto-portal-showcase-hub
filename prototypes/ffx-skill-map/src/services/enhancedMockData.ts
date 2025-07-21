// Enhanced Mock Data Service with Complex Network Structure
// Based on Expert Sphere Grid network data with FFX-inspired skill names and categories

import { Skill, Employee, SkillConnection } from '../types';
import { SkillGraphAnalyzer, calculateSkillXP, expandMasteredSkills } from '../utils/graphUtils';

// FFX-inspired skill names organized by node type and category
const skillNames = {
  // Core/Central Hub Skills - Most powerful abilities
  core: [
    'Ultima', 'Holy', 'Flare', 'Tornado', 'Bahamut'
  ],
  
  // Combat Skills
  combat: [
    'Sword Strike', 'Power Attack', 'Berserker', 'Warrior\'s Spirit', 'Blade Dance',
    'Critical Hit', 'Double Strike', 'Finishing Touch', 'Piercing Strike', 'Mighty Guard',
    'Weapon Master', 'Battle Fury', 'Steel Strike', 'Crimson Blade', 'War Cry',
    'Shield Bash', 'Counter Attack', 'Armor Break', 'Mental Break', 'Power Break',
    'Bloodlust', 'Intimidate', 'Provoke', 'Taunt', 'Guardian'
  ],
  
  // Magic Skills
  magic: [
    'Fire', 'Fira', 'Firaga', 'Blizzard', 'Blizzara', 'Blizzaga',
    'Thunder', 'Thundara', 'Thundaga', 'Water', 'Watera', 'Waterga',
    'Aero', 'Aerora', 'Aeroga', 'Bio', 'Biora', 'Bioga',
    'Demi', 'Drain', 'Osmose', 'Dispel', 'Reflect', 'Shell',
    'Protect', 'Berserk', 'Haste', 'Slow', 'Stop', 'Sleep',
    'Silence', 'Blind', 'Poison', 'Petrify', 'Death', 'Zombie'
  ],
  
  // Support Skills
  support: [
    'Cure', 'Cura', 'Curaga', 'Life', 'Full-Life', 'Esuna',
    'Regen', 'Auto-Life', 'Revive', 'Restore', 'Remedy', 'Blessing',
    'Sanctuary', 'Guardian Angel', 'Healing Light', 'Divine Grace',
    'Purify', 'Cleanse', 'Renewal', 'Recovery', 'Vigor', 'Stamina',
    'Endurance', 'Fortify', 'Strengthen', 'Empower', 'Enhance', 'Boost'
  ],
  
  // Special Skills
  special: [
    'Steal', 'Mug', 'Use', 'Throw', 'Aim', 'Flee',
    'Escape', 'Teleport', 'Warp', 'Quick Hit', 'Delay Attack', 'Delay Buster',
    'Slow Strike', 'Tempo Strike', 'Confusion Strike', 'Sleep Strike',
    'Silence Strike', 'Dark Strike', 'Zombie Strike', 'Stone Strike',
    'Poison Strike', 'Power Strike', 'Magic Strike', 'Mental Strike',
    'Armor Strike', 'HP Strike', 'MP Strike', 'Luck Strike'
  ],
  
  // Advanced Skills
  advanced: [
    'Grand Summon', 'Master Strike', 'Omega Drive', 'Genesis',
    'Apocalypse', 'Meteor', 'Comet', 'Supernova', 'Big Bang',
    'Time Magic', 'Space Magic', 'Gravity Magic', 'Quantum Leap',
    'Dimensional Rift', 'Void Strike', 'Reality Break', 'Existence',
    'Transcendence', 'Enlightenment', 'Mastery', 'Perfection',
    'Infinity', 'Eternity', 'Omnipotence', 'Omniscience'
  ]
};

// Skill descriptions by category
const skillDescriptions = {
  combat: [
    'A powerful physical attack that strikes with devastating force',
    'Enhances weapon damage and critical hit rate significantly',
    'Increases attack power while reducing defense temporarily',
    'Channel the warrior\'s inner strength for massive damage',
    'A graceful series of strikes that flow like a deadly dance'
  ],
  magic: [
    'Harness elemental forces to devastate your enemies',
    'Advanced magical techniques for experienced spellcasters',
    'Manipulate the fabric of reality with arcane power',
    'Channel pure magical energy into destructive force',
    'Ancient spells passed down through generations'
  ],
  support: [
    'Restore health and vitality to allies in need',
    'Protective magic that shields from harm',
    'Enhance ally capabilities and remove negative effects',
    'Divine blessing that strengthens the spirit',
    'Sacred healing that mends both body and soul'
  ],
  special: [
    'Unique techniques that exploit enemy weaknesses',
    'Tactical abilities that change the flow of battle',
    'Specialized skills for specific combat situations',
    'Advanced techniques requiring precise timing',
    'Rare abilities that bend the rules of combat'
  ],
  advanced: [
    'Legendary techniques known only to masters',
    'Ultimate abilities that transcend normal limits',
    'Forbidden arts that reshape reality itself',
    'Divine powers that surpass mortal understanding',
    'Transcendent skills that define true mastery'
  ]
};

class EnhancedMockNeo4jService {
  private skills: Skill[] = [];
  private connections: SkillConnection[] = [];
  private employees: Employee[] = [];
  private initialized = false;
  private graphAnalyzer: SkillGraphAnalyzer | null = null;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    if (this.initialized) return;

    // Convert network nodes to FFX skills
    this.skills = this.createSkillsFromNetworkData();
    this.connections = this.createConnectionsFromNetworkData();
    
    // Initialize graph analyzer for recommendations
    this.graphAnalyzer = new SkillGraphAnalyzer(this.skills, this.connections);
    
    // Create employees with expanded mastered skills
    this.employees = this.createEnhancedEmployees();
    
    this.initialized = true;
  }

  private createSkillsFromNetworkData(): Skill[] {
    const skills: Skill[] = [];
    let combatIndex = 0, magicIndex = 0, supportIndex = 0, specialIndex = 0, advancedIndex = 0;

    // Network data from the provided file
    const networkNodes = [
      // Central Hub - Core skills
      { id: "central_1", type: "core", size: 12, level: 6 },
      { id: "central_2", type: "core", size: 10, level: 5 },
      { id: "central_3", type: "core", size: 10, level: 5 },
      { id: "central_4", type: "core", size: 10, level: 5 },
      { id: "central_5", type: "core", size: 10, level: 5 },
      
      // Cluster centers - Advanced skills
      { id: "tl_1", type: "cluster_center", size: 8, level: 4 },
      { id: "tr_1", type: "cluster_center", size: 8, level: 4 },
      { id: "lm_1", type: "cluster_center", size: 8, level: 4 },
      { id: "rm_1", type: "cluster_center", size: 8, level: 4 },
      { id: "bl_1", type: "cluster_center", size: 8, level: 4 },
      { id: "br_1", type: "cluster_center", size: 8, level: 4 },
      
      // Pathway nodes - Special skills
      { id: "path_1", type: "pathway", size: 8, level: 3 },
      { id: "path_2", type: "pathway", size: 8, level: 3 },
      { id: "path_3", type: "pathway", size: 8, level: 3 },
      { id: "path_4", type: "pathway", size: 8, level: 3 },
      { id: "path_5", type: "pathway", size: 8, level: 3 },
      { id: "path_6", type: "pathway", size: 8, level: 3 },
      { id: "path_7", type: "pathway", size: 8, level: 3 },
      { id: "path_8", type: "pathway", size: 8, level: 3 },
      
      // Regular nodes - Combat, Magic, Support skills
      { id: "tl_2", type: "node", size: 6, level: 2 },
      { id: "tl_3", type: "node", size: 6, level: 2 },
      { id: "tl_4", type: "node", size: 6, level: 2 },
      { id: "tl_5", type: "node", size: 6, level: 2 },
      { id: "tl_6", type: "node", size: 6, level: 2 },
      { id: "tl_7", type: "node", size: 6, level: 2 },
      { id: "tl_8", type: "node", size: 6, level: 2 },
      { id: "tr_2", type: "node", size: 6, level: 2 },
      { id: "tr_3", type: "node", size: 6, level: 2 },
      { id: "tr_4", type: "node", size: 6, level: 2 },
      { id: "tr_5", type: "node", size: 6, level: 2 },
      { id: "tr_6", type: "node", size: 6, level: 2 },
      { id: "tr_7", type: "node", size: 6, level: 2 },
      { id: "tr_8", type: "node", size: 6, level: 2 },
      { id: "lm_2", type: "node", size: 6, level: 2 },
      { id: "lm_3", type: "node", size: 6, level: 2 },
      { id: "lm_4", type: "node", size: 6, level: 2 },
      { id: "lm_5", type: "node", size: 6, level: 2 },
      { id: "lm_6", type: "node", size: 6, level: 2 },
      { id: "lm_7", type: "node", size: 6, level: 2 },
      { id: "lm_8", type: "node", size: 6, level: 2 },
      { id: "rm_2", type: "node", size: 6, level: 2 },
      { id: "rm_3", type: "node", size: 6, level: 2 },
      { id: "rm_4", type: "node", size: 6, level: 2 },
      { id: "rm_5", type: "node", size: 6, level: 2 },
      { id: "rm_6", type: "node", size: 6, level: 2 },
      { id: "rm_7", type: "node", size: 6, level: 2 },
      { id: "rm_8", type: "node", size: 6, level: 2 },
      { id: "bl_2", type: "node", size: 6, level: 2 },
      { id: "bl_3", type: "node", size: 6, level: 2 },
      { id: "bl_4", type: "node", size: 6, level: 2 },
      { id: "bl_5", type: "node", size: 6, level: 2 },
      { id: "bl_6", type: "node", size: 6, level: 2 },
      { id: "bl_7", type: "node", size: 6, level: 2 },
      { id: "bl_8", type: "node", size: 6, level: 2 },
      { id: "br_2", type: "node", size: 6, level: 2 },
      { id: "br_3", type: "node", size: 6, level: 2 },
      { id: "br_4", type: "node", size: 6, level: 2 },
      { id: "br_5", type: "node", size: 6, level: 2 },
      { id: "br_6", type: "node", size: 6, level: 2 },
      { id: "br_7", type: "node", size: 6, level: 2 },
      { id: "br_8", type: "node", size: 6, level: 2 },
      
      // Intermediate nodes - Level 1 skills
      { id: "inter_1", type: "intermediate", size: 5, level: 1 },
      { id: "inter_2", type: "intermediate", size: 5, level: 1 },
      { id: "inter_3", type: "intermediate", size: 5, level: 1 },
      { id: "inter_4", type: "intermediate", size: 5, level: 1 },
      { id: "inter_5", type: "intermediate", size: 5, level: 1 },
      { id: "inter_6", type: "intermediate", size: 5, level: 1 },
      { id: "inter_7", type: "intermediate", size: 5, level: 1 },
      { id: "inter_8", type: "intermediate", size: 5, level: 1 },
      { id: "inter_9", type: "intermediate", size: 5, level: 1 },
      { id: "inter_10", type: "intermediate", size: 5, level: 1 },
      
      // Scattered nodes - Basic skills
      { id: "scatter_1", type: "scatter", size: 4, level: 1 },
      { id: "scatter_2", type: "scatter", size: 4, level: 1 },
      { id: "scatter_3", type: "scatter", size: 4, level: 1 },
      { id: "scatter_4", type: "scatter", size: 4, level: 1 },
      { id: "scatter_5", type: "scatter", size: 4, level: 1 },
      { id: "scatter_6", type: "scatter", size: 4, level: 1 },
      { id: "scatter_7", type: "scatter", size: 4, level: 1 },
      { id: "scatter_8", type: "scatter", size: 4, level: 1 },
      
      // Top/Bottom center clusters
      { id: "tc_1", type: "node", size: 7, level: 3 },
      { id: "tc_2", type: "node", size: 6, level: 2 },
      { id: "tc_3", type: "node", size: 6, level: 2 },
      { id: "tc_4", type: "node", size: 6, level: 2 },
      { id: "bc_1", type: "node", size: 7, level: 3 },
      { id: "bc_2", type: "node", size: 6, level: 2 },
      { id: "bc_3", type: "node", size: 6, level: 2 },
      { id: "bc_4", type: "node", size: 6, level: 2 }
    ];

    networkNodes.forEach((node, index) => {
      let category: string;
      let name: string;
      let description: string;

      // Assign categories based on node type and position
      if (node.type === 'core') {
        category = 'advanced';
        name = skillNames.core[index % skillNames.core.length];
        description = skillDescriptions.advanced[advancedIndex % skillDescriptions.advanced.length];
        advancedIndex++;
      } else if (node.type === 'cluster_center') {
        category = 'advanced';
        name = skillNames.advanced[advancedIndex % skillNames.advanced.length];
        description = skillDescriptions.advanced[advancedIndex % skillDescriptions.advanced.length];
        advancedIndex++;
      } else if (node.type === 'pathway') {
        category = 'special';
        name = skillNames.special[specialIndex % skillNames.special.length];
        description = skillDescriptions.special[specialIndex % skillDescriptions.special.length];
        specialIndex++;
      } else {
        // Distribute regular nodes across combat, magic, and support
        const categoryIndex = index % 3;
        if (categoryIndex === 0) {
          category = 'combat';
          name = skillNames.combat[combatIndex % skillNames.combat.length];
          description = skillDescriptions.combat[combatIndex % skillDescriptions.combat.length];
          combatIndex++;
        } else if (categoryIndex === 1) {
          category = 'magic';
          name = skillNames.magic[magicIndex % skillNames.magic.length];
          description = skillDescriptions.magic[magicIndex % skillDescriptions.magic.length];
          magicIndex++;
        } else {
          category = 'support';
          name = skillNames.support[supportIndex % skillNames.support.length];
          description = skillDescriptions.support[supportIndex % skillDescriptions.support.length];
          supportIndex++;
        }
      }

      const skill: Skill = {
        id: node.id,
        name,
        description,
        category,
        level: node.level,
        prerequisites: [], // Will be filled by connections
        sphere_cost: node.level * 2,
        activation_cost: node.level * 10,
        stat_bonuses: this.generateStatBonuses(category, node.level),
        xp_required: 0 // Will be calculated after skill creation
      };

      // Calculate XP requirement with progressive scaling
      skill.xp_required = calculateSkillXP(skill);
      skills.push(skill);
    });

    return skills;
  }

  private generateStatBonuses(category: string, level: number) {
    const baseBonus = level * 5;
    switch (category) {
      case 'combat':
        return { strength: baseBonus, hp: baseBonus * 2 };
      case 'magic':
        return { magic: baseBonus, mp: baseBonus * 2 };
      case 'support':
        return { hp: baseBonus, mp: baseBonus, magic: Math.floor(baseBonus / 2) };
      case 'special':
        return { agility: baseBonus, luck: Math.floor(baseBonus / 2) };
      case 'advanced':
        return { 
          strength: Math.floor(baseBonus / 2), 
          magic: Math.floor(baseBonus / 2), 
          hp: baseBonus, 
          mp: baseBonus 
        };
      default:
        return { hp: baseBonus };
    }
  }

  private createConnectionsFromNetworkData(): SkillConnection[] {
    // Network edges from the provided file
    const networkEdges = [
      // Central hub internal connections
      { source: "central_1", target: "central_2" },
      { source: "central_1", target: "central_3" },
      { source: "central_1", target: "central_4" },
      { source: "central_1", target: "central_5" },
      { source: "central_2", target: "central_4" },
      { source: "central_3", target: "central_5" },
      
      // Cluster connections (simplified for readability)
      { source: "tl_1", target: "tl_2" },
      { source: "tl_1", target: "tl_3" },
      { source: "tl_1", target: "tl_4" },
      { source: "tl_1", target: "tl_5" },
      { source: "tl_1", target: "tl_6" },
      { source: "tl_1", target: "tl_7" },
      { source: "tl_1", target: "tl_8" },
      
      { source: "tr_1", target: "tr_2" },
      { source: "tr_1", target: "tr_3" },
      { source: "tr_1", target: "tr_4" },
      { source: "tr_1", target: "tr_5" },
      { source: "tr_1", target: "tr_6" },
      { source: "tr_1", target: "tr_7" },
      { source: "tr_1", target: "tr_8" },
      
      { source: "lm_1", target: "lm_2" },
      { source: "lm_1", target: "lm_3" },
      { source: "lm_1", target: "lm_4" },
      { source: "lm_1", target: "lm_5" },
      { source: "lm_1", target: "lm_6" },
      { source: "lm_1", target: "lm_7" },
      { source: "lm_1", target: "lm_8" },
      
      { source: "rm_1", target: "rm_2" },
      { source: "rm_1", target: "rm_3" },
      { source: "rm_1", target: "rm_4" },
      { source: "rm_1", target: "rm_5" },
      { source: "rm_1", target: "rm_6" },
      { source: "rm_1", target: "rm_7" },
      { source: "rm_1", target: "rm_8" },
      
      { source: "bl_1", target: "bl_2" },
      { source: "bl_1", target: "bl_3" },
      { source: "bl_1", target: "bl_4" },
      { source: "bl_1", target: "bl_5" },
      { source: "bl_1", target: "bl_6" },
      { source: "bl_1", target: "bl_7" },
      { source: "bl_1", target: "bl_8" },
      
      { source: "br_1", target: "br_2" },
      { source: "br_1", target: "br_3" },
      { source: "br_1", target: "br_4" },
      { source: "br_1", target: "br_5" },
      { source: "br_1", target: "br_6" },
      { source: "br_1", target: "br_7" },
      { source: "br_1", target: "br_8" },
      
      // Pathway connections
      { source: "tl_1", target: "path_1" },
      { source: "path_1", target: "central_1" },
      { source: "tr_1", target: "path_3" },
      { source: "path_3", target: "central_1" },
      { source: "lm_1", target: "path_6" },
      { source: "path_6", target: "central_1" },
      { source: "rm_1", target: "path_7" },
      { source: "path_7", target: "central_1" },
      { source: "bl_1", target: "path_5" },
      { source: "path_5", target: "central_1" },
      { source: "br_1", target: "path_4" },
      { source: "path_4", target: "central_1" },
      
      // Top/Bottom center connections
      { source: "tc_1", target: "path_2" },
      { source: "path_2", target: "central_5" },
      { source: "tc_2", target: "tc_1" },
      { source: "tc_3", target: "tc_1" },
      { source: "tc_4", target: "tc_1" },
      
      { source: "bc_1", target: "path_8" },
      { source: "path_8", target: "central_3" },
      { source: "bc_2", target: "bc_1" },
      { source: "bc_3", target: "bc_1" },
      { source: "bc_4", target: "bc_1" },
      
      // Intermediate connections
      { source: "inter_1", target: "tl_8" },
      { source: "inter_1", target: "path_1" },
      { source: "inter_2", target: "tc_3" },
      { source: "inter_2", target: "path_2" },
      { source: "inter_3", target: "tr_8" },
      { source: "inter_3", target: "path_3" },
      { source: "inter_4", target: "rm_8" },
      { source: "inter_4", target: "path_7" },
      { source: "inter_5", target: "br_8" },
      { source: "inter_5", target: "path_4" },
      { source: "inter_6", target: "bc_4" },
      { source: "inter_6", target: "path_8" },
      { source: "inter_7", target: "bl_8" },
      { source: "inter_7", target: "path_5" },
      { source: "inter_8", target: "lm_8" },
      { source: "inter_8", target: "path_6" },
      { source: "inter_9", target: "tl_8" },
      { source: "inter_9", target: "lm_3" },
      { source: "inter_10", target: "tc_3" },
      { source: "inter_10", target: "tr_3" },
      
      // Scattered connections
      { source: "scatter_1", target: "tl_7" },
      { source: "scatter_2", target: "tr_8" },
      { source: "scatter_3", target: "lm_7" },
      { source: "scatter_4", target: "rm_8" },
      { source: "scatter_5", target: "bl_7" },
      { source: "scatter_6", target: "tr_3" },
      { source: "scatter_7", target: "tc_3" },
      { source: "scatter_8", target: "bc_3" }
    ];

    return networkEdges.map((edge, index) => ({
      id: `connection_${index}`,
      from: edge.source,
      to: edge.target,
      weight: 1
    }));
  }

  private createEnhancedEmployees(): Employee[] {
    const baseEmployees = [
      {
        id: 'tidus',
        name: 'Tidus',
        role: 'Blitzball Ace / Time Warrior',
        department: 'Combat Division',
        // Clustered in TOP CENTER area - Speed/Agility focused
        mastered_skills: ['tc_1', 'tc_2', 'tc_3', 'tc_4', 'path_2', 'inter_2', 'inter_10', 'scatter_7'],
        current_xp: 2450,
        skill_points: 145,
        level: 28,
        stats: {
          strength: 45,
          magic: 25,
          hp: 850,
          mp: 320,
          agility: 55,
          luck: 35
        }
      },
      {
        id: 'yuna',
        name: 'Yuna',
        role: 'High Summoner / White Mage',
        department: 'Support Division',
        // Clustered in TOP RIGHT area - White Magic/Support focused
        mastered_skills: ['tr_1', 'tr_2', 'tr_3', 'tr_4', 'tr_5', 'tr_6', 'tr_7', 'tr_8'],
        current_xp: 3200,
        skill_points: 168,
        level: 32,
        stats: {
          strength: 20,
          magic: 65,
          hp: 680,
          mp: 920,
          agility: 30,
          luck: 45
        }
      },
      {
        id: 'auron',
        name: 'Auron',
        role: 'Legendary Guardian / Weapon Master',
        department: 'Combat Division',
        // Clustered in LEFT MIDDLE area - Combat/Break skills focused
        mastered_skills: ['lm_1', 'lm_2', 'lm_3', 'lm_4', 'lm_5', 'lm_6', 'lm_7', 'lm_8'],
        current_xp: 4750,
        skill_points: 189,
        level: 38,
        stats: {
          strength: 75,
          magic: 15,
          hp: 1200,
          mp: 180,
          agility: 25,
          luck: 20
        }
      },
      {
        id: 'lulu',
        name: 'Lulu',
        role: 'Black Mage Virtuoso / Elemental Master',
        department: 'Magic Division',
        // Clustered in TOP LEFT area - Black Magic focused
        mastered_skills: ['tl_1', 'tl_2', 'tl_3', 'tl_4', 'tl_5', 'tl_6', 'tl_7', 'tl_8'],
        current_xp: 2980,
        skill_points: 156,
        level: 30,
        stats: {
          strength: 18,
          magic: 78,
          hp: 580,
          mp: 1050,
          agility: 22,
          luck: 25
        }
      },
      {
        id: 'wakka',
        name: 'Wakka',
        role: 'Blitzball Captain / Ranged Specialist',
        department: 'Special Operations',
        // Clustered in BOTTOM LEFT area - Status/Debuff focused
        mastered_skills: ['bl_1', 'bl_2', 'bl_3', 'bl_4', 'bl_5', 'bl_6', 'bl_7', 'bl_8'],
        current_xp: 2150,
        skill_points: 134,
        level: 26,
        stats: {
          strength: 42,
          magic: 28,
          hp: 780,
          mp: 380,
          agility: 48,
          luck: 55
        }
      },
      {
        id: 'kimahri',
        name: 'Kimahri',
        role: 'Ronso Warrior / Versatile Guardian',
        department: 'Multi-Division',
        // Clustered in RIGHT MIDDLE area - Special abilities focused
        mastered_skills: ['rm_1', 'rm_2', 'rm_3', 'rm_4', 'rm_5', 'rm_6', 'rm_7', 'rm_8'],
        current_xp: 2350,
        skill_points: 142,
        level: 27,
        stats: {
          strength: 38,
          magic: 35,
          hp: 920,
          mp: 450,
          agility: 32,
          luck: 28
        }
      },
      {
        id: 'rikku',
        name: 'Rikku',
        role: 'Al Bhed Machinist / Item Specialist',
        department: 'Special Operations',
        // Clustered in SCATTERED area - Utility/Special skills focused
        mastered_skills: ['scatter_1', 'scatter_2', 'scatter_3', 'scatter_4', 'scatter_5', 'scatter_6', 'scatter_7', 'scatter_8'],
        current_xp: 1950,
        skill_points: 127,
        level: 24,
        stats: {
          strength: 32,
          magic: 40,
          hp: 650,
          mp: 520,
          agility: 62,
          luck: 58
        }
      },
      {
        id: 'seymour',
        name: 'Seymour',
        role: 'Maester / Dark Summoner',
        department: 'Advanced Magic',
        // Clustered in BOTTOM RIGHT area - Advanced Magic focused
        mastered_skills: ['br_1', 'br_2', 'br_3', 'br_4', 'br_5', 'br_6', 'br_7', 'br_8'],
        current_xp: 6800,
        skill_points: 245,
        level: 45,
        stats: {
          strength: 25,
          magic: 95,
          hp: 1100,
          mp: 1400,
          agility: 35,
          luck: 15
        }
      }
    ];

    // Expand mastered skills using graph analysis
    if (this.graphAnalyzer) {
      return baseEmployees.map(employee => ({
        ...employee,
        mastered_skills: expandMasteredSkills(employee, this.graphAnalyzer!, 3)
      }));
    }

    return baseEmployees;
  }

  // Mock Neo4j service methods
  async connect(): Promise<void> {
    if (!this.initialized) {
      this.initializeData();
      console.log('Enhanced Mock Neo4j service connected with complex sphere grid data');
    }
  }

  async close(): Promise<void> {
    // Clear data to free memory
    this.skills = [];
    this.connections = [];
    this.employees = [];
    this.initialized = false;
    console.log('Enhanced Mock Neo4j service connection closed');
  }

  async getAllSkills(): Promise<Skill[]> {
    return this.skills;
  }

  async getSkillConnections(): Promise<SkillConnection[]> {
    return this.connections;
  }

  async getAllEmployees(): Promise<Employee[]> {
    return this.employees;
  }

  async getSkillById(id: string): Promise<Skill | null> {
    return this.skills.find(skill => skill.id === id) || null;
  }

  async getEmployeeById(id: string): Promise<Employee | null> {
    return this.employees.find(emp => emp.id === id) || null;
  }

  async getSkillsByCategory(category: string): Promise<Skill[]> {
    return this.skills.filter(skill => skill.category === category);
  }

  async getSkillsByLevel(level: number): Promise<Skill[]> {
    return this.skills.filter(skill => skill.level === level);
  }

  async getEmployeeSkills(employeeId: string): Promise<Skill[]> {
    const employee = await this.getEmployeeById(employeeId);
    if (!employee) return [];
    
    return this.skills.filter(skill => 
      employee.mastered_skills.includes(skill.id)
    );
  }

  async getSkillPrerequisites(skillId: string): Promise<Skill[]> {
    const connections = this.connections.filter(conn => conn.to === skillId);
    const prerequisiteIds = connections.map(conn => conn.from);
    return this.skills.filter(skill => prerequisiteIds.includes(skill.id));
  }

  async getSkillDependents(skillId: string): Promise<Skill[]> {
    const connections = this.connections.filter(conn => conn.from === skillId);
    const dependentIds = connections.map(conn => conn.to);
    return this.skills.filter(skill => dependentIds.includes(skill.id));
  }

  async getSkillRecommendations(employeeId: string): Promise<{ skill: Skill; xp_required: number; reason: string }[]> {
    if (!this.graphAnalyzer) return [];

    const employee = await this.getEmployeeById(employeeId);
    if (!employee) return [];

    const availableSkills = this.graphAnalyzer.getAvailableNextSkills(employee.mastered_skills);
    
    return availableSkills
      .map(skillId => {
        const skill = this.skills.find(s => s.id === skillId);
        if (!skill) return null;

        return {
          skill,
          xp_required: skill.xp_required,
          reason: this.generateRecommendationReason(skill, employee)
        };
      })
      .filter((rec): rec is { skill: Skill; xp_required: number; reason: string } => rec !== null)
      .slice(0, 10); // Limit to top 10 recommendations
  }

  private generateRecommendationReason(skill: Skill, employee: Employee): string {
    const reasons = [
      `Builds on your ${skill.category} expertise`,
      `Natural progression from your current skills`,
      `Enhances your role as ${employee.role}`,
      `Unlocks advanced abilities in ${skill.category}`,
      `Complements your existing skill set`
    ];
    
    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  async learnSkill(employeeId: string, skillId: string): Promise<Employee | null> {
    const employee = await this.getEmployeeById(employeeId);
    const skill = await this.getSkillById(skillId);
    
    if (!employee || !skill) return null;
    
    // Check if employee can afford the skill
    if ((employee.current_xp || 0) < skill.xp_required) {
      throw new Error('Insufficient XP to learn this skill');
    }
    
    // Check if skill is already mastered
    if (employee.mastered_skills.includes(skillId)) {
      throw new Error('Skill already mastered');
    }
    
    // Update employee with new skill and reduced XP
    const updatedEmployee = {
      ...employee,
      mastered_skills: [...employee.mastered_skills, skillId],
      current_xp: (employee.current_xp || 0) - skill.xp_required
    };
    
    // Update the employee in the internal array
    const employeeIndex = this.employees.findIndex(emp => emp.id === employeeId);
    if (employeeIndex !== -1) {
      this.employees[employeeIndex] = updatedEmployee;
    }
    
    return updatedEmployee;
  }
}

export default EnhancedMockNeo4jService;