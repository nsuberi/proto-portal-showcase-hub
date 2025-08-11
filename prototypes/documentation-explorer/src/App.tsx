import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import Navigation from './components/Navigation'
import DocumentationExplorer from './pages/DocumentationExplorer'
import InstructionsModal from './components/InstructionsModal'

function App() {
  const [showInstructions, setShowInstructions] = useState(true)

  useEffect(() => {
    // Check if user has seen instructions before
    const hasSeenInstructions = localStorage.getItem('documentation-explorer-instructions-seen')
    if (hasSeenInstructions) {
      setShowInstructions(false)
    }
  }, [])

  const handleCloseInstructions = () => {
    setShowInstructions(false)
    localStorage.setItem('documentation-explorer-instructions-seen', 'true')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation onShowInstructions={() => setShowInstructions(true)} />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<DocumentationExplorer />} />
          <Route path="/*" element={<DocumentationExplorer />} />
        </Routes>
      </main>
      <Toaster position="bottom-right" />
      <InstructionsModal 
        open={showInstructions} 
        onClose={handleCloseInstructions}
      />
    </div>
  )
}

export default App