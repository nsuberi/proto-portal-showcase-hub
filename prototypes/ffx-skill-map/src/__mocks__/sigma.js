// Mock implementation of Sigma.js for Jest tests
class MockSigma {
  constructor(graph, container, options = {}) {
    this.graph = graph;
    this.container = container;
    this.options = options;
  }

  kill() {
    // Mock cleanup
  }

  getGraph() {
    return this.graph;
  }

  refresh() {
    // Mock refresh
  }
}

module.exports = MockSigma;
module.exports.default = MockSigma;