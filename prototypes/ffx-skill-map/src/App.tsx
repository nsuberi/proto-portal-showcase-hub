import { Routes, Route } from 'react-router-dom'
import { Toaster } from '@proto-portal/design-system'
import Navigation from './components/Navigation'
import Dashboard from './pages/Dashboard'
import SkillMap from './pages/SkillMap'
import Employees from './pages/Employees'
import Quiz from './pages/Quiz'
import Recommendations from './pages/Recommendations'
import { useEffect } from 'react'
import MockNeo4jService from './services/mockData'

// Use mock service instead of real Neo4j for browser compatibility
const neo4jService = new MockNeo4jService()

function App() {
  useEffect(() => {
    // Initialize Neo4j connection
    const initDatabase = async () => {
      try {
        await neo4jService.connect()
      } catch (error) {
        console.error('Failed to connect to Neo4j:', error)
      }
    }

    initDatabase()

    // Cleanup on unmount
    return () => {
      neo4jService.close()
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/skill-map" element={<SkillMap />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/recommendations" element={<Recommendations />} />
        </Routes>
      </main>
      <Toaster />
    </div>
  )
}

export default App 