import neo4j from 'neo4j-driver';

const uri = 'bolt://localhost:7687';
const user = 'neo4j';
const password = 'password';

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

// FFX Skill Map Data
const skills = [
  // Starting Skills (Sphere Grid)
  { id: 'attack', name: 'Attack', description: 'Basic physical attack ability', level: 1, category: 'combat' },
  { id: 'defend', name: 'Defend', description: 'Defensive stance to reduce damage', level: 1, category: 'combat' },
  { id: 'item', name: 'Item', description: 'Use items in battle', level: 1, category: 'support' },
  { id: 'escape', name: 'Escape', description: 'Flee from battle', level: 1, category: 'support' },
  
  // Combat Skills
  { id: 'power_break', name: 'Power Break', description: 'Reduce enemy attack power', level: 2, category: 'combat' },
  { id: 'armor_break', name: 'Armor Break', description: 'Reduce enemy defense', level: 2, category: 'combat' },
  { id: 'mental_break', name: 'Mental Break', description: 'Reduce enemy magic attack', level: 2, category: 'combat' },
  { id: 'magic_break', name: 'Magic Break', description: 'Reduce enemy magic defense', level: 2, category: 'combat' },
  { id: 'quick_hit', name: 'Quick Hit', description: 'Fast attack with reduced damage', level: 3, category: 'combat' },
  { id: 'delay_attack', name: 'Delay Attack', description: 'Delay enemy turn', level: 3, category: 'combat' },
  { id: 'silence_attack', name: 'Silence Attack', description: 'Silence enemy with attack', level: 3, category: 'combat' },
  { id: 'sleep_attack', name: 'Sleep Attack', description: 'Put enemy to sleep with attack', level: 3, category: 'combat' },
  
  // Magic Skills
  { id: 'fire', name: 'Fire', description: 'Basic fire magic', level: 2, category: 'magic' },
  { id: 'ice', name: 'Ice', description: 'Basic ice magic', level: 2, category: 'magic' },
  { id: 'thunder', name: 'Thunder', description: 'Basic lightning magic', level: 2, category: 'magic' },
  { id: 'water', name: 'Water', description: 'Basic water magic', level: 2, category: 'magic' },
  { id: 'fira', name: 'Fira', description: 'Intermediate fire magic', level: 3, category: 'magic' },
  { id: 'blizzara', name: 'Blizzara', description: 'Intermediate ice magic', level: 3, category: 'magic' },
  { id: 'thundara', name: 'Thundara', description: 'Intermediate lightning magic', level: 3, category: 'magic' },
  { id: 'watera', name: 'Watera', description: 'Intermediate water magic', level: 3, category: 'magic' },
  { id: 'firaga', name: 'Firaga', description: 'Advanced fire magic', level: 4, category: 'magic' },
  { id: 'blizzaga', name: 'Blizzaga', description: 'Advanced ice magic', level: 4, category: 'magic' },
  { id: 'thundaga', name: 'Thundaga', description: 'Advanced lightning magic', level: 4, category: 'magic' },
  { id: 'waterga', name: 'Waterga', description: 'Advanced water magic', level: 4, category: 'magic' },
  
  // Support Skills
  { id: 'cure', name: 'Cure', description: 'Basic healing magic', level: 2, category: 'support' },
  { id: 'cura', name: 'Cura', description: 'Intermediate healing magic', level: 3, category: 'support' },
  { id: 'curaga', name: 'Curaga', description: 'Advanced healing magic', level: 4, category: 'support' },
  { id: 'esuna', name: 'Esuna', description: 'Remove status ailments', level: 3, category: 'support' },
  { id: 'haste', name: 'Haste', description: 'Increase action speed', level: 3, category: 'support' },
  { id: 'slow', name: 'Slow', description: 'Decrease enemy action speed', level: 3, category: 'support' },
  { id: 'protect', name: 'Protect', description: 'Increase physical defense', level: 3, category: 'support' },
  { id: 'shell', name: 'Shell', description: 'Increase magic defense', level: 3, category: 'support' },
  
  // Special Skills
  { id: 'steal', name: 'Steal', description: 'Steal items from enemies', level: 2, category: 'special' },
  { id: 'mug', name: 'Mug', description: 'Steal and attack simultaneously', level: 3, category: 'special' },
  { id: 'use', name: 'Use', description: 'Use special items', level: 2, category: 'special' },
  { id: 'throw', name: 'Throw', description: 'Throw items at enemies', level: 2, category: 'special' },
  { id: 'cheer', name: 'Cheer', description: 'Increase party strength', level: 2, category: 'special' },
  { id: 'focus', name: 'Focus', description: 'Increase party magic', level: 2, category: 'special' },
  { id: 'aim', name: 'Aim', description: 'Increase party accuracy', level: 2, category: 'special' },
  { id: 'reflex', name: 'Reflex', description: 'Increase party evasion', level: 2, category: 'special' },
  
  // Advanced Skills
  { id: 'doublecast', name: 'Doublecast', description: 'Cast two spells at once', level: 5, category: 'advanced' },
  { id: 'quick_pockets', name: 'Quick Pockets', description: 'Use items without consuming turn', level: 4, category: 'advanced' },
  { id: 'auto_haste', name: 'Auto-Haste', description: 'Automatically cast Haste', level: 5, category: 'advanced' },
  { id: 'auto_protect', name: 'Auto-Protect', description: 'Automatically cast Protect', level: 5, category: 'advanced' },
  { id: 'auto_shell', name: 'Auto-Shell', description: 'Automatically cast Shell', level: 5, category: 'advanced' },
  { id: 'auto_regen', name: 'Auto-Regen', description: 'Automatically regenerate HP', level: 5, category: 'advanced' },
  { id: 'auto_life', name: 'Auto-Life', description: 'Automatically revive when KO\'d', level: 6, category: 'advanced' },
  { id: 'ribbon', name: 'Ribbon', description: 'Immunity to all status ailments', level: 6, category: 'advanced' }
];

// Skill connections (prerequisites)
const connections = [
  // Combat progression
  { from: 'attack', to: 'power_break' },
  { from: 'attack', to: 'armor_break' },
  { from: 'power_break', to: 'mental_break' },
  { from: 'armor_break', to: 'magic_break' },
  { from: 'mental_break', to: 'quick_hit' },
  { from: 'magic_break', to: 'delay_attack' },
  { from: 'quick_hit', to: 'silence_attack' },
  { from: 'delay_attack', to: 'sleep_attack' },
  
  // Magic progression
  { from: 'attack', to: 'fire' },
  { from: 'attack', to: 'ice' },
  { from: 'attack', to: 'thunder' },
  { from: 'attack', to: 'water' },
  { from: 'fire', to: 'fira' },
  { from: 'ice', to: 'blizzara' },
  { from: 'thunder', to: 'thundara' },
  { from: 'water', to: 'watera' },
  { from: 'fira', to: 'firaga' },
  { from: 'blizzara', to: 'blizzaga' },
  { from: 'thundara', to: 'thundaga' },
  { from: 'watera', to: 'waterga' },
  
  // Support progression
  { from: 'item', to: 'cure' },
  { from: 'cure', to: 'cura' },
  { from: 'cura', to: 'curaga' },
  { from: 'cure', to: 'esuna' },
  { from: 'cure', to: 'haste' },
  { from: 'haste', to: 'slow' },
  { from: 'cure', to: 'protect' },
  { from: 'protect', to: 'shell' },
  
  // Special progression
  { from: 'item', to: 'steal' },
  { from: 'steal', to: 'mug' },
  { from: 'item', to: 'use' },
  { from: 'use', to: 'throw' },
  { from: 'item', to: 'cheer' },
  { from: 'cheer', to: 'focus' },
  { from: 'focus', to: 'aim' },
  { from: 'aim', to: 'reflex' },
  
  // Advanced connections
  { from: 'firaga', to: 'doublecast' },
  { from: 'blizzaga', to: 'doublecast' },
  { from: 'thundaga', to: 'doublecast' },
  { from: 'waterga', to: 'doublecast' },
  { from: 'throw', to: 'quick_pockets' },
  { from: 'haste', to: 'auto_haste' },
  { from: 'protect', to: 'auto_protect' },
  { from: 'shell', to: 'auto_shell' },
  { from: 'curaga', to: 'auto_regen' },
  { from: 'curaga', to: 'auto_life' },
  { from: 'esuna', to: 'ribbon' }
];

// Sample employees with their mastered skills
const employees = [
  {
    id: 'emp_001',
    name: 'Tidus',
    role: 'Frontend Developer',
    department: 'Engineering',
    mastered_skills: ['attack', 'defend', 'item', 'escape', 'power_break', 'armor_break', 'quick_hit', 'steal', 'cheer', 'focus']
  },
  {
    id: 'emp_002',
    name: 'Yuna',
    role: 'Backend Developer',
    department: 'Engineering',
    mastered_skills: ['attack', 'defend', 'item', 'escape', 'cure', 'cura', 'esuna', 'haste', 'protect', 'shell', 'fire', 'ice', 'thunder', 'water']
  },
  {
    id: 'emp_003',
    name: 'Auron',
    role: 'DevOps Engineer',
    department: 'Engineering',
    mastered_skills: ['attack', 'defend', 'item', 'escape', 'power_break', 'armor_break', 'mental_break', 'magic_break', 'delay_attack', 'silence_attack', 'sleep_attack']
  },
  {
    id: 'emp_004',
    name: 'Rikku',
    role: 'QA Engineer',
    department: 'Engineering',
    mastered_skills: ['attack', 'defend', 'item', 'escape', 'steal', 'mug', 'use', 'throw', 'quick_pockets', 'cheer', 'focus', 'aim', 'reflex']
  },
  {
    id: 'emp_005',
    name: 'Wakka',
    role: 'Product Manager',
    department: 'Product',
    mastered_skills: ['attack', 'defend', 'item', 'escape', 'power_break', 'armor_break', 'cheer', 'focus', 'aim', 'reflex']
  },
  {
    id: 'emp_006',
    name: 'Lulu',
    role: 'Data Scientist',
    department: 'Analytics',
    mastered_skills: ['attack', 'defend', 'item', 'escape', 'fire', 'fira', 'firaga', 'ice', 'blizzara', 'blizzaga', 'thunder', 'thundara', 'thundaga', 'water', 'watera', 'waterga', 'doublecast']
  },
  {
    id: 'emp_007',
    name: 'Kimahri',
    role: 'Security Engineer',
    department: 'Engineering',
    mastered_skills: ['attack', 'defend', 'item', 'escape', 'power_break', 'armor_break', 'mental_break', 'magic_break', 'steal', 'mug', 'silence_attack', 'sleep_attack']
  },
  {
    id: 'emp_008',
    name: 'Seymour',
    role: 'Tech Lead',
    department: 'Engineering',
    mastered_skills: ['attack', 'defend', 'item', 'escape', 'fire', 'fira', 'firaga', 'ice', 'blizzara', 'blizzaga', 'thunder', 'thundara', 'thundaga', 'water', 'watera', 'waterga', 'cure', 'cura', 'curaga', 'esuna', 'haste', 'slow', 'protect', 'shell', 'doublecast', 'auto_haste', 'auto_protect', 'auto_shell', 'auto_regen']
  }
];

async function clearDatabase() {
  const session = driver.session();
  try {
    await session.run('MATCH (n) DETACH DELETE n');
    console.log('Database cleared');
  } catch (error) {
    console.error('Error clearing database:', error);
  } finally {
    await session.close();
  }
}

async function createSkills() {
  const session = driver.session();
  try {
    for (const skill of skills) {
      await session.run(
        'CREATE (s:Skill {id: $id, name: $name, description: $description, level: $level, category: $category})',
        skill
      );
    }
    console.log(`Created ${skills.length} skills`);
  } catch (error) {
    console.error('Error creating skills:', error);
  } finally {
    await session.close();
  }
}

async function createConnections() {
  const session = driver.session();
  try {
    for (const connection of connections) {
      await session.run(
        'MATCH (from:Skill {id: $from}), (to:Skill {id: $to}) CREATE (from)-[:PREREQUISITE]->(to)',
        connection
      );
    }
    console.log(`Created ${connections.length} connections`);
  } catch (error) {
    console.error('Error creating connections:', error);
  } finally {
    await session.close();
  }
}

async function createEmployees() {
  const session = driver.session();
  try {
    for (const employee of employees) {
      // Create employee node
      await session.run(
        'CREATE (e:Employee {id: $id, name: $name, role: $role, department: $department})',
        {
          id: employee.id,
          name: employee.name,
          role: employee.role,
          department: employee.department
        }
      );
      
      // Create mastered skill relationships
      for (const skillId of employee.mastered_skills) {
        await session.run(
          'MATCH (e:Employee {id: $empId}), (s:Skill {id: $skillId}) CREATE (e)-[:MASTERED]->(s)',
          { empId: employee.id, skillId }
        );
      }
    }
    console.log(`Created ${employees.length} employees with their mastered skills`);
  } catch (error) {
    console.error('Error creating employees:', error);
  } finally {
    await session.close();
  }
}

async function createIndexes() {
  const session = driver.session();
  try {
    await session.run('CREATE INDEX skill_id IF NOT EXISTS FOR (s:Skill) ON (s.id)');
    await session.run('CREATE INDEX employee_id IF NOT EXISTS FOR (e:Employee) ON (e.id)');
    console.log('Created indexes');
  } catch (error) {
    console.error('Error creating indexes:', error);
  } finally {
    await session.close();
  }
}

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    await clearDatabase();
    await createIndexes();
    await createSkills();
    await createConnections();
    await createEmployees();
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await driver.close();
  }
}

// Run the seeding
seedDatabase(); 