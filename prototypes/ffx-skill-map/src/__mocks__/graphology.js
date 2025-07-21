// Mock implementation of Graphology for Jest tests
class MockGraph {
  constructor(options = {}) {
    this.nodes = new Map();
    this.edges = new Map();
    this.nodeConnections = new Map();
    this.type = options.type || 'undirected';
  }

  addNode(nodeId, attributes = {}) {
    this.nodes.set(nodeId, attributes);
    if (!this.nodeConnections.has(nodeId)) {
      this.nodeConnections.set(nodeId, { in: new Set(), out: new Set() });
    }
  }

  hasNode(nodeId) {
    return this.nodes.has(nodeId);
  }

  addEdge(from, to, attributes = {}) {
    const edgeId = `${from}-${to}`;
    this.edges.set(edgeId, { from, to, ...attributes });
    
    if (!this.nodeConnections.has(from)) {
      this.nodeConnections.set(from, { in: new Set(), out: new Set() });
    }
    if (!this.nodeConnections.has(to)) {
      this.nodeConnections.set(to, { in: new Set(), out: new Set() });
    }

    this.nodeConnections.get(from).out.add(to);
    this.nodeConnections.get(to).in.add(from);
  }

  forEachNode(callback) {
    this.nodes.forEach((attributes, nodeId) => {
      callback(nodeId, attributes);
    });
  }

  forEachNeighbor(nodeId, callback) {
    const connections = this.nodeConnections.get(nodeId);
    if (connections) {
      connections.out.forEach(neighbor => callback(neighbor));
      if (this.type === 'undirected') {
        connections.in.forEach(neighbor => callback(neighbor));
      }
    }
  }

  forEachInNeighbor(nodeId, callback) {
    const connections = this.nodeConnections.get(nodeId);
    if (connections) {
      connections.in.forEach(neighbor => callback(neighbor));
    }
  }

  outNeighbors(nodeId) {
    const connections = this.nodeConnections.get(nodeId);
    return connections ? Array.from(connections.out) : [];
  }

  inNeighbors(nodeId) {
    const connections = this.nodeConnections.get(nodeId);
    return connections ? Array.from(connections.in) : [];
  }

  getNodeAttributes(nodeId) {
    return this.nodes.get(nodeId) || {};
  }

  // Add mock methods that might be used in tests
  clear() {
    this.nodes.clear();
    this.edges.clear();
    this.nodeConnections.clear();
  }

  order() {
    return this.nodes.size;
  }

  size() {
    return this.edges.size;
  }
}

// Export as both default and named export to handle different import styles
module.exports = MockGraph;
module.exports.default = MockGraph;