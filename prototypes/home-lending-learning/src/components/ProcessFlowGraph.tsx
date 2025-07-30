import React, { useEffect, useRef, useState } from 'react';
import Graph from 'graphology';
import Sigma from 'sigma';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import { FlowMapNode } from '../types';
import { CATEGORIES } from '../constants';

interface ProcessFlowGraphProps {
  nodes: FlowMapNode[];
  glossaryTerms: Record<string, any>;
  onNodeClick: (node: FlowMapNode) => void;
  highlightedNodes?: string[];
}

export function ProcessFlowGraph({ nodes, glossaryTerms, onNodeClick, highlightedNodes = [] }: ProcessFlowGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create graph
    const graph = new Graph();

    // Define phase order for left-to-right layout
    const phaseOrder = ['preparation', 'application', 'processing', 'underwriting', 'closing'];
    
    // Group nodes by category and maintain order
    const nodesByCategory: Record<string, FlowMapNode[]> = {};
    phaseOrder.forEach(phase => {
      nodesByCategory[phase] = nodes.filter(node => node.category === phase);
    });

    // Calculate total number of nodes to determine spacing
    const totalNodes = nodes.length;
    let currentX = 0.05; // Start with small margin
    const spacing = 0.9 / totalNodes; // Distribute across 90% of width

    // Add nodes to graph with strict left-to-right positioning across all categories
    phaseOrder.forEach((category) => {
      const categoryNodes = nodesByCategory[category];
      
      categoryNodes.forEach((node, indexInCategory) => {
        const categoryHeight = categoryNodes.length;
        
        // Calculate y position to spread nodes vertically within their category
        const yPosition = categoryHeight > 1 
          ? 0.2 + (indexInCategory * 0.6) / (categoryHeight - 1)
          : 0.5;

        graph.addNode(node.id, {
          x: currentX,
          y: yPosition,
          size: node.id === 'loan-denial' ? 18 : 15, // Make loan denial slightly larger
          label: node.title,
          color: node.id === 'loan-denial' ? '#DC2626' : (CATEGORIES[node.category]?.color || '#6B7280'), // Red for loan denial
          category: node.category,
          originalNode: node
        });

        // Move to next x position for the next node
        currentX += spacing * 1.2; // Add some extra spacing between nodes
      });
      
      // Add extra space between categories
      currentX += spacing * 0.5;
    });

    // Add edges
    nodes.forEach((node) => {
      node.connections.forEach((targetId) => {
        if (graph.hasNode(targetId)) {
          graph.addEdge(node.id, targetId, {
            size: 2,
            color: '#9CA3AF'
          });
        }
      });
    });

    // Apply force-directed layout for better positioning while preserving left-to-right flow
    const settings = forceAtlas2.inferSettings(graph);
    forceAtlas2.assign(graph, {
      ...settings,
      iterations: 100,
      settings: {
        ...settings,
        gravity: 0.1,
        scalingRatio: 20,
        strongGravityMode: true,
        outboundAttractionDistribution: false,
        linLogMode: false,
        adjustSizes: false,
        edgeWeightInfluence: 1,
        jitterTolerance: 1,
        barnesHutOptimize: false,
        barnesHutTheta: 0.5,
        slowDown: 1
      }
    });

    // Get container dimensions for responsive sizing
    const containerRect = containerRef.current.getBoundingClientRect();
    const isSmallScreen = containerRect.width < 768;
    
    // Create Sigma instance with responsive settings
    const sigma = new Sigma(graph, containerRef.current, {
      renderLabels: true,
      labelRenderedSizeThreshold: 0,
      defaultNodeColor: '#6B7280',
      defaultEdgeColor: '#9CA3AF',
      defaultEdgeType: 'arrow',
      labelDensity: isSmallScreen ? 0.15 : 0.07,
      labelGridCellSize: isSmallScreen ? 80 : 60,
      labelFont: '"Inter", "system-ui", "sans-serif"',
      labelSize: isSmallScreen ? 10 : 12,
      labelWeight: '600',
      labelColor: { color: '#374151' },
      edgeLabelSize: isSmallScreen ? 10 : 12,
      stagePadding: isSmallScreen ? 20 : 30,
      zoomToSizeRatioFunction: (ratio) => ratio,
      nodeReducer: (node, data) => {
        const res = { ...data };
        res.size = isSmallScreen ? 12 : 15;
        
        // Highlight nodes if they're in the highlightedNodes array
        if (highlightedNodes.length > 0) {
          if (highlightedNodes.includes(node)) {
            res.size = isSmallScreen ? 16 : 20; // Make highlighted nodes larger
            res.color = '#F59E0B'; // Amber color for highlighting
            res.borderColor = '#D97706';
            res.borderSize = 2;
          } else {
            res.color = '#E5E7EB'; // Dim non-highlighted nodes
            res.label = ''; // Hide labels for non-highlighted nodes
          }
        } else if (hoveredNode && hoveredNode !== node && !graph.neighbors(hoveredNode).includes(node)) {
          res.label = '';
          res.color = '#E5E7EB';
        }
        return res;
      },
      edgeReducer: (edge, data) => {
        const res = { ...data };
        res.size = isSmallScreen ? 1.5 : 2;
        if (hoveredNode && !graph.extremities(edge).includes(hoveredNode)) {
          res.hidden = true;
        }
        return res;
      }
    });

    // Handle node clicks
    sigma.on('clickNode', ({ node }) => {
      const nodeData = graph.getNodeAttributes(node);
      if (nodeData.originalNode) {
        onNodeClick(nodeData.originalNode);
      }
    });

    // Handle hover effects
    sigma.on('enterNode', ({ node }) => {
      setHoveredNode(node);
      containerRef.current!.style.cursor = 'pointer';
    });

    sigma.on('leaveNode', () => {
      setHoveredNode(null);
      containerRef.current!.style.cursor = 'default';
    });

    // Cleanup
    return () => {
      sigma.kill();
    };
  }, [nodes, onNodeClick, hoveredNode, highlightedNodes]);

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Responsive Legend */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white/90 backdrop-blur-sm rounded-lg p-2 sm:p-4 shadow-lg max-w-[150px] sm:max-w-none">
        <h3 className="text-xs sm:text-sm font-semibold mb-1 sm:mb-2">Process Phases</h3>
        <div className="space-y-0.5 sm:space-y-1">
          {Object.entries(CATEGORIES).map(([key, category]) => (
            <div key={key} className="flex items-center gap-1 sm:gap-2">
              <div 
                className="w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: category.color }}
              />
              <span className="text-xs text-gray-700 truncate">{category.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Controls */}
      <div className="absolute bottom-2 left-2 sm:hidden bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
        <div className="text-xs text-gray-600">
          Tap nodes to explore • Pinch to zoom
        </div>
      </div>
    </div>
  );
}