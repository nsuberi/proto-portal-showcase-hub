// Shared Enhanced Mock Service Instance
// This ensures we have a single service instance across the app

import EnhancedMockNeo4jService from './enhancedMockData'

// Create a single shared instance
export const sharedEnhancedService = new EnhancedMockNeo4jService();

export default sharedEnhancedService;