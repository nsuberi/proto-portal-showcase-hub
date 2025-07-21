import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SkillMap from './SkillMap';

// Mock the neo4j service
jest.mock('../services/neo4j', () => ({
  neo4jService: {
    getAllSkills: jest.fn().mockResolvedValue([
      { id: 'attack', name: 'Attack', category: 'combat', level: 1, description: 'Basic attack' },
      { id: 'fire', name: 'Fire', category: 'magic', level: 1, description: 'Fire spell' },
      { id: 'cure', name: 'Cure', category: 'magic', level: 2, description: 'Healing spell' },
    ]),
    getSkillConnections: jest.fn().mockResolvedValue([
      { from: 'attack', to: 'fire' },
      { from: 'fire', to: 'cure' },
    ]),
    getAllEmployees: jest.fn().mockResolvedValue([
      { id: 'emp1', name: 'Tidus', role: 'Warrior', mastered_skills: ['attack', 'fire'] },
      { id: 'emp2', name: 'Yuna', role: 'Mage', mastered_skills: ['cure'] },
    ]),
  },
}));

// Mock Sigma.js
const mockKill = jest.fn();
const mockSigmaInstance = {
  kill: mockKill,
  graph: {},
};

jest.mock('sigma', () => {
  return jest.fn().mockImplementation((graph, container, options) => {
    return mockSigmaInstance;
  });
});

jest.mock('graphology', () => {
  const mockAddNode = jest.fn();
  const mockAddEdge = jest.fn();
  const mockHasNode = jest.fn().mockReturnValue(true);
  
  return jest.fn().mockImplementation(() => ({
    addNode: mockAddNode,
    addEdge: mockAddEdge,
    hasNode: mockHasNode,
  }));
});

const Sigma = require('sigma');
const Graph = require('graphology');

function renderWithQueryClient(component: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
}

describe('SkillMap Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders employee dropdown with correct options', async () => {
    renderWithQueryClient(<SkillMap />);
    
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
    
    // Open dropdown
    fireEvent.click(screen.getByRole('combobox'));
    
    await waitFor(() => {
      expect(screen.getByText('Tidus - Warrior')).toBeInTheDocument();
      expect(screen.getByText('Yuna - Mage')).toBeInTheDocument();
    });
  });

  it('creates new Sigma instance when employee is selected', async () => {
    renderWithQueryClient(<SkillMap />);
    
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
    
    // Initial render should create one Sigma instance
    expect(Sigma).toHaveBeenCalledTimes(1);
    
    // Select an employee
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('Tidus - Warrior'));
    
    // Should create a new Sigma instance due to key prop change
    await waitFor(() => {
      expect(Sigma).toHaveBeenCalledTimes(2);
    });
  });

  it('passes correct mastered skills to graph when employee is selected', async () => {
    renderWithQueryClient(<SkillMap />);
    
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
    
    // Select Tidus (has attack and fire skills)
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('Tidus - Warrior'));
    
    await waitFor(() => {
      const mockGraphInstance = Graph.mock.results[Graph.mock.results.length - 1].value;
      const addNodeCalls = mockGraphInstance.addNode.mock.calls;
      
      // Find attack node (should be mastered - opacity 1)
      const attackNode = addNodeCalls.find(call => call[0] === 'attack');
      expect(attackNode[1].opacity).toBe(1);
      
      // Find fire node (should be mastered - opacity 1)
      const fireNode = addNodeCalls.find(call => call[0] === 'fire');
      expect(fireNode[1].opacity).toBe(1);
      
      // Find cure node (should not be mastered - opacity 0.3)
      const cureNode = addNodeCalls.find(call => call[0] === 'cure');
      expect(cureNode[1].opacity).toBe(0.3);
    });
  });

  it('changes node opacity when switching between employees', async () => {
    renderWithQueryClient(<SkillMap />);
    
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
    
    // Select Tidus first
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('Tidus - Warrior'));
    
    await waitFor(() => {
      expect(Sigma).toHaveBeenCalledTimes(2);
    });
    
    // Now select Yuna (different mastered skills)
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText('Yuna - Mage'));
    
    await waitFor(() => {
      expect(Sigma).toHaveBeenCalledTimes(3);
      
      const mockGraphInstance = Graph.mock.results[Graph.mock.results.length - 1].value;
      const addNodeCalls = mockGraphInstance.addNode.mock.calls;
      
      // For Yuna, cure should be mastered (opacity 1)
      const cureNode = addNodeCalls.find(call => call[0] === 'cure');
      expect(cureNode[1].opacity).toBe(1);
      
      // attack and fire should not be mastered (opacity 0.3)
      const attackNode = addNodeCalls.find(call => call[0] === 'attack');
      expect(attackNode[1].opacity).toBe(0.3);
      
      const fireNode = addNodeCalls.find(call => call[0] === 'fire');
      expect(fireNode[1].opacity).toBe(0.3);
    });
  });

  it('shows all nodes as fully opaque when no employee is selected', async () => {
    renderWithQueryClient(<SkillMap />);
    
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
    
    // Initial state - no employee selected
    const mockGraphInstance = Graph.mock.results[0].value;
    const addNodeCalls = mockGraphInstance.addNode.mock.calls;
    
    // All nodes should be fully opaque
    addNodeCalls.forEach(call => {
      expect(call[1].opacity).toBe(1);
    });
  });

  it('displays correct legend colors', async () => {
    renderWithQueryClient(<SkillMap />);
    
    await waitFor(() => {
      expect(screen.getByText('Combat')).toBeInTheDocument();
      expect(screen.getByText('Magic')).toBeInTheDocument();
      expect(screen.getByText('Support')).toBeInTheDocument();
      expect(screen.getByText('Special')).toBeInTheDocument();
      expect(screen.getByText('Advanced')).toBeInTheDocument();
    });
  });
}); 