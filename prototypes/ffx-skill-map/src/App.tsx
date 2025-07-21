import { Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toast'
import Navigation from './components/Navigation'
import Dashboard from './pages/Dashboard'
import SkillMap from './pages/SkillMap'
import Employees from './pages/Employees'
import Quiz from './pages/Quiz'
import Recommendations from './pages/Recommendations'
import { useEffect } from 'react'
import { sharedEnhancedService } from './services/sharedService'

// Use shared enhanced mock service with complex sphere grid data
const neo4jService = sharedEnhancedService

function App() {
  useEffect(() => {
    // Initialize Neo4j connection only once
    let mounted = true;
    
    const initDatabase = async () => {
      try {
        if (mounted) {
          await neo4jService.connect()
        }
      } catch (error) {
        console.error('Failed to connect to Neo4j:', error)
      }
    }

    initDatabase()

    // Cleanup on unmount
    return () => {
      mounted = false;
      neo4jService.close()
    }
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<SkillMap />} />
          <Route path="/dashboard" element={<Dashboard />} />
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