import EnhancedMockNeo4jService from './enhancedMockData';

describe('EnhancedMockNeo4jService XP Logic', () => {
  let service: EnhancedMockNeo4jService;

  beforeEach(async () => {
    // Clear localStorage before each test
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
    
    service = new EnhancedMockNeo4jService();
    await service.connect();
  });

  afterEach(async () => {
    await service.close();
  });

  describe('learnSkill XP Decrementing', () => {
    it('should correctly decrement XP when learning a skill', async () => {
      // Get initial employee data
      const employees = await service.getAllEmployees();
      const tidus = employees.find(emp => emp.id === 'tidus');
      expect(tidus).toBeDefined();
      
      const initialXP = tidus!.current_xp || 0;
      expect(initialXP).toBeGreaterThan(0);

      // Get an affordable skill
      const recommendations = await service.getSkillRecommendations('tidus');
      const affordableSkill = recommendations.find(rec => initialXP >= rec.xp_required);
      expect(affordableSkill).toBeDefined();

      const skillCost = affordableSkill!.xp_required;
      const expectedXPAfterLearning = initialXP - skillCost;

      // Learn the skill
      const updatedEmployee = await service.learnSkill('tidus', affordableSkill!.skill.id);
      
      expect(updatedEmployee).toBeDefined();
      expect(updatedEmployee.current_xp).toBe(expectedXPAfterLearning);
      expect(updatedEmployee.mastered_skills).toContain(affordableSkill!.skill.id);
    });

    it('should throw error when trying to learn skill with insufficient XP', async () => {
      const employees = await service.getAllEmployees();
      const employee = employees.find(emp => emp.id === 'tidus');
      const skills = await service.getAllSkills();
      
      // Find a skill that costs more than current XP
      const expensiveSkill = skills.find(skill => 
        skill.xp_required > (employee!.current_xp || 0) && 
        !employee!.mastered_skills.includes(skill.id)
      );

      if (expensiveSkill) {
        await expect(service.learnSkill('tidus', expensiveSkill.id))
          .rejects.toThrow('Insufficient XP to learn this skill');
      }
    });

    it('should throw error when trying to learn already mastered skill', async () => {
      const employees = await service.getAllEmployees();
      const tidus = employees.find(emp => emp.id === 'tidus');
      
      // Use one of the already mastered skills
      const alreadyMasteredSkillId = tidus!.mastered_skills[0];
      
      await expect(service.learnSkill('tidus', alreadyMasteredSkillId))
        .rejects.toThrow('Skill already mastered');
    });

    it('should persist XP changes to localStorage', async () => {
      // Get initial data
      const initialEmployees = await service.getAllEmployees();
      const tidus = initialEmployees.find(emp => emp.id === 'tidus');
      const initialXP = tidus!.current_xp || 0;

      // Get an affordable skill
      const recommendations = await service.getSkillRecommendations('tidus');
      const affordableSkill = recommendations.find(rec => initialXP >= rec.xp_required);
      expect(affordableSkill).toBeDefined();

      // Learn the skill
      await service.learnSkill('tidus', affordableSkill!.skill.id);
      const expectedXP = initialXP - affordableSkill!.xp_required;

      // Close and recreate service to test persistence
      await service.close();
      const newService = new EnhancedMockNeo4jService();
      await newService.connect();

      // Check that the data persisted
      const persistedEmployees = await newService.getAllEmployees();
      const persistedTidus = persistedEmployees.find(emp => emp.id === 'tidus');
      
      expect(persistedTidus!.current_xp).toBe(expectedXP);
      expect(persistedTidus!.mastered_skills).toContain(affordableSkill!.skill.id);

      await newService.close();
    });

    it('should prevent infinite skill learning by checking updated XP values', async () => {
      const employees = await service.getAllEmployees();
      const tidus = employees.find(emp => emp.id === 'tidus');
      const initialXP = tidus!.current_xp || 0;

      // Get all affordable skills
      const recommendations = await service.getSkillRecommendations('tidus');
      const affordableSkills = recommendations.filter(rec => initialXP >= rec.xp_required);
      
      let currentXP = initialXP;
      let learnedCount = 0;

      // Try to learn skills until we run out of XP
      for (const skillRec of affordableSkills) {
        if (currentXP >= skillRec.xp_required) {
          const updatedEmployee = await service.learnSkill('tidus', skillRec.skill.id);
          currentXP = updatedEmployee.current_xp;
          learnedCount++;
          
          // Verify XP decreased
          expect(currentXP).toBeLessThan(initialXP);
        }
      }

      // Verify we learned some skills but couldn't learn infinitely
      expect(learnedCount).toBeGreaterThan(0);
      
      // Try to learn another expensive skill - should fail
      const allSkills = await service.getAllSkills();
      const expensiveSkill = allSkills.find(skill => 
        skill.xp_required > currentXP && 
        !tidus!.mastered_skills.includes(skill.id)
      );

      if (expensiveSkill) {
        await expect(service.learnSkill('tidus', expensiveSkill.id))
          .rejects.toThrow('Insufficient XP to learn this skill');
      }
    });
  });

  describe('getSkillRecommendations', () => {
    it('should return recommendations based on current mastered skills', async () => {
      const recommendations = await service.getSkillRecommendations('tidus');
      
      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      
      // Each recommendation should have the required properties
      recommendations.forEach(rec => {
        expect(rec.skill).toBeDefined();
        expect(rec.xp_required).toBeDefined();
        expect(rec.reason).toBeDefined();
        expect(typeof rec.xp_required).toBe('number');
        expect(rec.xp_required).toBeGreaterThan(0);
      });
    });
  });

  describe('localStorage integration', () => {
    it('should save and load employee data correctly', async () => {
      // Mock localStorage if it doesn't exist
      const mockLocalStorage = {
        data: {} as Record<string, string>,
        setItem: function(key: string, value: string) {
          this.data[key] = value;
        },
        getItem: function(key: string) {
          return this.data[key] || null;
        },
        removeItem: function(key: string) {
          delete this.data[key];
        }
      };

      // If localStorage doesn't exist, mock it
      if (typeof window === 'undefined') {
        (global as any).window = {
          localStorage: mockLocalStorage
        };
      }

      // Test saving and loading
      const employees = await service.getAllEmployees();
      const storageKey = service.getStorageKey();
      
      expect(storageKey).toBe('ffx-skill-map-employees');
      
      // The employees should have been automatically saved
      const savedData = window.localStorage.getItem(storageKey);
      expect(savedData).toBeDefined();
      
      if (savedData) {
        const parsedEmployees = JSON.parse(savedData);
        expect(Array.isArray(parsedEmployees)).toBe(true);
        expect(parsedEmployees.length).toBe(employees.length);
      }
    });
  });
});