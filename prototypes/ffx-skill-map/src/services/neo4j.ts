// Browser-compatible mock service
import MockNeo4jService from './mockData';

// Export the mock service for browser compatibility
export const neo4jService = new MockNeo4jService();

// Original Neo4j service code (commented out for browser compatibility)
/*
import neo4j, { Driver, Session } from 'neo4j-driver';
import { Skill, Employee, SkillConnection, QuizResult, SkillRecommendation } from '../types';

class Neo4jService {
  private driver: Driver;
  private session: Session | null = null;

  constructor() {
    this.driver = neo4j.driver(
      'bolt://localhost:7687',
      neo4j.auth.basic('neo4j', 'password')
    );
  }

  async connect() {
    try {
      await this.driver.verifyConnectivity();
      console.log('Connected to Neo4j');
    } catch (error) {
      console.error('Failed to connect to Neo4j:', error);
      throw error;
    }
  }

  async close() {
    if (this.session) {
      await this.session.close();
    }
    await this.driver.close();
  }

  private getSession(): Session {
    if (!this.session) {
      this.session = this.driver.session();
    }
    return this.session;
  }

  // Get all skills
  async getAllSkills(): Promise<Skill[]> {
    const session = this.getSession();
    const result = await session.run(
      'MATCH (s:Skill) RETURN s ORDER BY s.level, s.name'
    );
    return result.records.map(record => record.get('s').properties as Skill);
  }

  // Get all employees
  async getAllEmployees(): Promise<Employee[]> {
    const session = this.getSession();
    const result = await session.run(`
      MATCH (e:Employee)-[:MASTERED]->(s:Skill)
      RETURN e, collect(s.id) as mastered_skills
    `);
    
    return result.records.map(record => ({
      ...record.get('e').properties,
      mastered_skills: record.get('mastered_skills')
    })) as Employee[];
  }

  // Get skill connections
  async getSkillConnections(): Promise<SkillConnection[]> {
    const session = this.getSession();
    const result = await session.run(`
      MATCH (from:Skill)-[:PREREQUISITE]->(to:Skill)
      RETURN from.id as from, to.id as to
    `);
    
    return result.records.map(record => ({
      from: record.get('from'),
      to: record.get('to')
    })) as SkillConnection[];
  }

  // Get skills by category
  async getSkillsByCategory(category: string): Promise<Skill[]> {
    const session = this.getSession();
    const result = await session.run(
      'MATCH (s:Skill {category: $category}) RETURN s ORDER BY s.level, s.name',
      { category }
    );
    return result.records.map(record => record.get('s').properties as Skill);
  }

  // Get employee by ID
  async getEmployeeById(id: string): Promise<Employee | null> {
    const session = this.getSession();
    const result = await session.run(`
      MATCH (e:Employee {id: $id})-[:MASTERED]->(s:Skill)
      RETURN e, collect(s.id) as mastered_skills
    `, { id });
    
    if (result.records.length === 0) return null;
    
    const record = result.records[0];
    return {
      ...record.get('e').properties,
      mastered_skills: record.get('mastered_skills')
    } as Employee;
  }

  // Get skills mastered by employee
  async getEmployeeSkills(employeeId: string): Promise<Skill[]> {
    const session = this.getSession();
    const result = await session.run(`
      MATCH (e:Employee {id: $employeeId})-[:MASTERED]->(s:Skill)
      RETURN s ORDER BY s.level, s.name
    `, { employeeId });
    
    return result.records.map(record => record.get('s').properties as Skill);
  }

  // Get available skills for employee (skills they can learn next)
  async getAvailableSkills(employeeId: string): Promise<Skill[]> {
    const session = this.getSession();
    const result = await session.run(`
      MATCH (e:Employee {id: $employeeId})-[:MASTERED]->(mastered:Skill)
      MATCH (prereq:Skill)-[:PREREQUISITE]->(available:Skill)
      WHERE NOT (e)-[:MASTERED]->(available)
      WITH available, collect(prereq) as prereqs
      WHERE all(prereq in prereqs WHERE (prereq)<-[:MASTERED]-({id: $employeeId}))
      RETURN DISTINCT available ORDER BY available.level, available.name
    `, { employeeId });
    
    return result.records.map(record => record.get('available').properties as Skill);
  }

  // Get skill recommendations for employee
  async getSkillRecommendations(employeeId: string): Promise<SkillRecommendation[]> {
    const session = this.getSession();
    const result = await session.run(`
      MATCH (e:Employee {id: $employeeId})-[:MASTERED]->(mastered:Skill)
      MATCH (prereq:Skill)-[:PREREQUISITE]->(available:Skill)
      WHERE NOT (e)-[:MASTERED]->(available)
      WITH available, collect(prereq) as prereqs
      WHERE all(prereq in prereqs WHERE (prereq)<-[:MASTERED]-({id: $employeeId}))
      
      // Calculate recommendation score based on level and category diversity
      WITH available, prereqs, 
           size([(e)-[:MASTERED]->(s) WHERE s.category = available.category | s]) as categoryCount,
           available.level as level
      
      RETURN available, prereqs, categoryCount, level
      ORDER BY level ASC, categoryCount DESC
      LIMIT 10
    `, { employeeId });
    
    return result.records.map(record => {
      const skill = record.get('available').properties as Skill;
      const prerequisites = record.get('prereqs').map((p: any) => p.properties as Skill);
      const categoryCount = record.get('categoryCount').toNumber();
      const level = record.get('level').toNumber();
      
      let priority: 'high' | 'medium' | 'low' = 'medium';
      if (level <= 2) priority = 'high';
      else if (level >= 5) priority = 'low';
      
      let reason = `Level ${level} ${skill.category} skill`;
      if (categoryCount > 0) {
        reason += ` - You already have ${categoryCount} ${skill.category} skills`;
      }
      
      return {
        skill,
        reason,
        priority,
        prerequisites
      };
    });
  }

  // Save quiz results and infer skills
  async saveQuizResults(quizResult: QuizResult): Promise<void> {
    const session = this.getSession();
    
    // Create or update employee
    await session.run(`
      MERGE (e:Employee {id: $employeeId})
      SET e.quizCompleted = true, e.quizConfidence = $confidence
    `, { 
      employeeId: quizResult.employeeId, 
      confidence: quizResult.confidence 
    });
    
    // Create mastered skill relationships
    for (const skillId of quizResult.inferredSkills) {
      await session.run(`
        MATCH (e:Employee {id: $employeeId})
        MATCH (s:Skill {id: $skillId})
        MERGE (e)-[:MASTERED]->(s)
      `, { employeeId: quizResult.employeeId, skillId });
    }
  }

  // Get graph data for visualization
  async getGraphData(): Promise<any> {
    const session = this.getSession();
    const result = await session.run(`
      MATCH (n)
      OPTIONAL MATCH (n)-[r]->(m)
      RETURN n, r, m
    `);
    
    const nodes = new Map();
    const relationships: any[] = [];
    
    result.records.forEach(record => {
      const node1 = record.get('n');
      const node2 = record.get('m');
      const rel = record.get('r');
      
      if (node1) {
        nodes.set(node1.identity.toString(), {
          id: node1.identity.toString(),
          label: node1.properties.name || node1.properties.id,
          type: node1.labels[0].toLowerCase(),
          properties: node1.properties
        });
      }
      
      if (node2) {
        nodes.set(node2.identity.toString(), {
          id: node2.identity.toString(),
          label: node2.properties.name || node2.properties.id,
          type: node2.labels[0].toLowerCase(),
          properties: node2.properties
        });
      }
      
      if (rel) {
        relationships.push({
          source: rel.start.toString(),
          target: rel.end.toString(),
          type: rel.type
        });
      }
    });
    
    return {
      nodes: Array.from(nodes.values()),
      relationships
    };
  }

  // Get skill statistics
  async getSkillStatistics(): Promise<any> {
    const session = this.getSession();
    const result = await session.run(`
      MATCH (s:Skill)
      OPTIONAL MATCH (e:Employee)-[:MASTERED]->(s)
      RETURN s.category as category, 
             count(s) as totalSkills,
             count(e) as masteredCount,
             avg(s.level) as avgLevel
      ORDER BY category
    `);
    
    return result.records.map(record => ({
      category: record.get('category'),
      totalSkills: record.get('totalSkills').toNumber(),
      masteredCount: record.get('masteredCount').toNumber(),
      avgLevel: record.get('avgLevel').toNumber()
    }));
  }
}

export const neo4jService = new Neo4jService();
*/ 