import React, { useState, useEffect, useRef } from 'react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Input } from './components/ui/input';
import { Progress } from './components/ui/progress';
import { 
  UserProfile, 
  StudyCard as StudyCardType, 
  GlossaryTerm,
  FlowMapNode
} from './types';
import { 
  getNextCards, 
  getProgressStats 
} from './utils/learningUtils';
import { flowMapNodes } from './data/flowMapData';
import { glossaryTerms } from './data/glossaryData';
import { studyCards } from './data/studyCardsData';
import { useVoiceRecording } from './hooks/useVoiceRecording';
import { assessUserUnderstanding } from './services/genAIAssessment';
import { 
  Home, 
  BookOpen, 
  Map, 
  User, 
  Brain,
  FileText,
  ExternalLink,
  CheckCircle,
  XCircle,
  Info,
  ArrowRight,
  Trophy,
  Mic,
  MicOff,
  Square,
  RotateCcw,
  MessageSquare,
  Lightbulb,
  AlertCircle,
  ArrowLeft,
  X
} from 'lucide-react';
import { ProcessFlowGraph } from './components/ProcessFlowGraph';
import { NodeDetailPopup } from './components/NodeDetailPopup';
import { GlossaryBrowser } from './components/GlossaryBrowser';
import { DocumentationOverview } from './components/DocumentationOverview';
import { LegalAndInstructionsContent } from './components/LegalAndInstructionsContent';
import { processPersonas, documentRequirements } from './data/documentationData';

type ViewMode = 'dashboard' | 'profile';

function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [currentStudyCard, setCurrentStudyCard] = useState<StudyCardType | null>(null);
  const [selectedFlowNode, setSelectedFlowNode] = useState<FlowMapNode | null>(null);
  const [selectedGlossaryTerm, setSelectedGlossaryTerm] = useState<GlossaryTerm | null>(null);
  const [highlightedNodes, setHighlightedNodes] = useState<string[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [assessment, setAssessment] = useState<any>(null);
  const [isAssessing, setIsAssessing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [baseText, setBaseText] = useState('');
  const processedTranscriptRef = useRef<string>('');
  const [showLegalDisclaimer, setShowLegalDisclaimer] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [glossaryBrowserExpanded, setGlossaryBrowserExpanded] = useState(false);
  
  // Voice recording hook
  const voiceRecording = useVoiceRecording(selectedLanguage);
  
  // Handle voice recording state changes
  useEffect(() => {
    if (!voiceRecording.isMobile && !voiceRecording.isRecording && voiceRecording.finalTranscript && 
        voiceRecording.finalTranscript !== processedTranscriptRef.current) {
      // When recording stops and we have final transcript, insert it at cursor position
      const finalText = baseText.substring(0, cursorPosition) + voiceRecording.finalTranscript + baseText.substring(cursorPosition);
      setUserAnswer(finalText);
      setBaseText('');
      setCursorPosition(0);
      processedTranscriptRef.current = voiceRecording.finalTranscript;
      
      // Reset voice recording
      setTimeout(() => {
        voiceRecording.resetRecording();
        processedTranscriptRef.current = '';
      }, 100);
    }
  }, [voiceRecording.isRecording, voiceRecording.isIOS, voiceRecording.finalTranscript, voiceRecording, baseText, cursorPosition]);

  const handleStartRecording = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const cursorPos = textarea.selectionStart;
      setCursorPosition(cursorPos);
      setBaseText(userAnswer);
      processedTranscriptRef.current = '';
    }
    voiceRecording.startRecording();
  };

  const handleRequestMicrophonePermission = async () => {
    try {
      // Attempt to request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // If successful, stop the stream immediately
      stream.getTracks().forEach(track => track.stop());
      alert('Microphone permission granted! You can now try using voice typing in the text field.');
    } catch (error) {
      console.error('Microphone permission denied:', error);
      // If denied, show instructions for manual permission
      alert('Microphone permission was denied. Please follow the manual steps below to enable permissions.');
    }
  };

  const handleOpenAndroidSettings = () => {
    // Try to open Android app settings (this may or may not work depending on the browser)
    try {
      // This is a best-effort attempt - results may vary by browser and Android version
      window.open('intent://apps/settings/app/permissions#Intent;scheme=android-app;end', '_system');
    } catch (error) {
      // Fallback - just provide instructions
      alert('Please go to your Android Settings → Apps → find your browser → Permissions → Microphone → Allow');
    }
  };

  // Compute display text for the textarea
  const displayText = voiceRecording.isRecording 
    ? baseText.substring(0, cursorPosition) + voiceRecording.transcript + baseText.substring(cursorPosition)
    : userAnswer;

  
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: 'demo-user',
    name: 'Demo Learner',
    knownTerms: [],
    completedCards: [],
    currentLevel: 'beginner',
    learningGoals: ['Understand mortgage basics', 'Learn the lending process', 'Master key terminology'],
    createdAt: new Date(),
    lastActive: new Date()
  });

  // Initialize first study card
  useEffect(() => {
    if (!currentStudyCard) {
      const nextCards = getNextCards(userProfile, studyCards, 1);
      if (nextCards.length > 0) {
        setCurrentStudyCard(nextCards[0]);
      }
    }
  }, [currentStudyCard, userProfile]);

  const handleStudyCardComplete = () => {
    if (!currentStudyCard) return;
    
    // Only count as completed if there was an actual assessment (user submitted an answer)
    const wasAssessed = assessment !== null;
    
    // Determine if topic is learned based on AI assessment, or mark as not learned if no assessment
    const isLearned = assessment ? 
      (assessment.comprehensionLevel === 'excellent' || assessment.comprehensionLevel === 'good') : 
      false; // If no assessment (just showed answer), don't mark as learned
    
    // Only increment completed cards and progress if the response was judged to be correct
    const wasCorrect = isLearned; // Only excellent or good assessments count as correct
    
    const updatedProfile = {
      ...userProfile,
      // Only add to completed cards if there was an assessment AND it was correct
      completedCards: (wasAssessed && wasCorrect) 
        ? [...userProfile.completedCards, currentStudyCard.id]
        : userProfile.completedCards,
      knownTerms: isLearned 
        ? [...new Set([...userProfile.knownTerms, ...currentStudyCard.glossaryTerms])]
        : userProfile.knownTerms,
      lastActive: new Date()
    };
    
    setUserProfile(updatedProfile);
    
    // Reset study card state and advance to next question
    setShowAnswer(false);
    setUserAnswer('');
    setAssessment(null);
    voiceRecording.resetRecording();
    
    // Get next card using the updated profile, excluding the current card
    const nextCards = getNextCards(updatedProfile, studyCards, 1, currentStudyCard.id);
    setCurrentStudyCard(nextCards.length > 0 ? nextCards[0] : null);
  };

  const handleSubmitAnswer = async () => {
    if (!currentStudyCard) return;
    
    const responseText = userAnswer.trim();
    if (!responseText) return;
    
    setIsAssessing(true);
    setShowAnswer(true);
    
    try {
      // Get the official definition and examples
      const relatedTerms = currentStudyCard.glossaryTerms
        .map(termId => glossaryTerms.find(term => term.id === termId))
        .filter(Boolean) as GlossaryTerm[];
      
      const primaryTerm = relatedTerms[0];
      const termName = primaryTerm?.term || 'this concept';
      const definition = primaryTerm?.definition || currentStudyCard.answer;
      const examples = primaryTerm?.examples || [];
      
      // Call GenAI assessment
      const result = await assessUserUnderstanding(
        responseText,
        termName,
        definition,
        examples
      );
      
      setAssessment(result);
    } catch (error) {
      console.error('Assessment error:', error);
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Assessment service temporarily unavailable';
      setAssessment({
        similarities: [],
        differences: [],
        feedback: `Error: ${errorMessage}`,
        comprehensionLevel: 'needs-improvement' as const,
        suggestions: ['Please check your API key and try again', 'Ensure you have sufficient API credits available']
      });
    } finally {
      setIsAssessing(false);
    }
  };

  const handleTestKnowledge = (term: GlossaryTerm) => {
    // Find a study card that includes this term
    const relevantCards = studyCards.filter(card => 
      card.glossaryTerms.includes(term.id)
    );
    
    if (relevantCards.length > 0) {
      // Prioritize cards not yet completed
      const uncompletedCards = relevantCards.filter(card => 
        !userProfile.completedCards.includes(card.id)
      );
      
      const cardToUse = uncompletedCards.length > 0 ? uncompletedCards[0] : relevantCards[0];
      
      setCurrentStudyCard(cardToUse);
      setSelectedFlowNode(null); // Close the popup
      setSelectedGlossaryTerm(null); // Clear any selected glossary term
      setShowAnswer(false);
      setUserAnswer('');
      setAssessment(null);
      voiceRecording.resetRecording();
      
      // Expand the Glossary Browser
      setGlossaryBrowserExpanded(true);
      
      // Auto-scroll to glossary browser first, then to study card section
      setTimeout(() => {
        const glossaryElement = document.querySelector('[data-glossary-browser]');
        if (glossaryElement) {
          glossaryElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          
          // Then scroll to study card within the glossary browser
          setTimeout(() => {
            const studyCardElement = document.querySelector('[data-study-card-section]');
            if (studyCardElement) {
              studyCardElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 500);
        }
      }, 100);
    } else {
      // If no study card exists for this term, create a dynamic one
      const dynamicCard = {
        id: `dynamic-${term.id}`,
        question: `Define and explain: ${term.term}`,
        answer: term.definition + (term.examples ? ` Examples: ${term.examples.join(', ')}` : ''),
        category: 'terminology' as const,
        difficulty: 'beginner' as const,
        glossaryTerms: [term.id],
        flowMapNodes: term.flowMapNodes
      };
      
      setCurrentStudyCard(dynamicCard);
      setSelectedFlowNode(null);
      setSelectedGlossaryTerm(null);
      setShowAnswer(false);
      setUserAnswer('');
      setAssessment(null);
      voiceRecording.resetRecording();
      
      // Expand the Glossary Browser
      setGlossaryBrowserExpanded(true);
      
      // Auto-scroll to glossary browser first, then to study card section
      setTimeout(() => {
        const glossaryElement = document.querySelector('[data-glossary-browser]');
        if (glossaryElement) {
          glossaryElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          
          // Then scroll to study card within the glossary browser
          setTimeout(() => {
            const studyCardElement = document.querySelector('[data-study-card-section]');
            if (studyCardElement) {
              studyCardElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 500);
        }
      }, 100);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'preparation': return 'bg-blue-50 border-blue-200 text-primary';
      case 'application': return 'bg-blue-100 border-blue-300 text-primary';
      case 'processing': return 'bg-secondary/20 border-secondary text-primary';
      case 'underwriting': return 'bg-secondary/30 border-secondary text-primary';
      case 'closing': return 'bg-primary/90 border-primary text-primary-foreground';
      default: return 'bg-muted/50 border-border text-foreground';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'preparation': return 'Preparation';
      case 'application': return 'Application';
      case 'processing': return 'Processing';
      case 'underwriting': return 'Underwriting';
      case 'closing': return 'Closing';
      default: return category;
    }
  };

  const getGlossaryTermsForNode = (node: FlowMapNode) => {
    return node.glossaryTerms
      .map(termId => glossaryTerms.find(term => term.id === termId))
      .filter(Boolean) as GlossaryTerm[];
  };

  const handleDocumentClick = (documentData: any) => {
    // Store the selected document for display
    setSelectedDocument(documentData);
    
    // Highlight the nodes where this document is referenced
    setHighlightedNodes(documentData.requiredFor || []);
    
    // Navigate to the Process Flow section
    setTimeout(() => {
      const processFlowElement = window.document.querySelector('[data-process-flow]');
      if (processFlowElement) {
        processFlowElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };


  const stats = getProgressStats(userProfile, studyCards, glossaryTerms);

  const renderNavigation = () => (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-lg sm:text-xl font-bold text-primary flex items-center gap-2">
                <Home className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="hidden sm:inline">Home Lending Learning</span>
                <span className="sm:hidden">HLL</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInstructions(true)}
              className="flex items-center gap-2 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
            >
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">How to Use</span>
              <span className="sm:hidden">Help</span>
            </Button>
            <Button
              variant={currentView === 'dashboard' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('dashboard')}
              size="sm"
              className="text-xs sm:text-sm"
            >
              <Home className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            <Button
              variant={currentView === 'profile' ? 'default' : 'ghost'}
              onClick={() => setCurrentView('profile')}
              size="sm"
              className="text-xs sm:text-sm"
            >
              <User className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Profile</span>
            </Button>
            <Button 
              asChild
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 transition-all duration-300 shadow-lg hover:shadow-purple-500/25 text-xs sm:text-sm"
            >
              <a href="/" className="flex items-center space-x-1 sm:space-x-2">
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Back to Portfolio</span>
                <span className="sm:hidden">Back</span>
              </a>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );

  const renderProcessFlow = () => {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Home Lending Process Flow</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-4xl mx-auto">
            Click on any step to learn more about that part of the process and see related terms
          </p>
        </div>

        {highlightedNodes.length > 0 && selectedDocument && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                <span className="text-sm font-medium text-amber-800">
                  Showing where "<strong>{selectedDocument.name}</strong>" is required in the process
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setHighlightedNodes([]);
                  setSelectedDocument(null);
                }}
                className="text-amber-700 hover:text-amber-900 text-xs"
              >
                Clear
              </Button>
            </div>
          </div>
        )}

        <Card className="p-2 sm:p-4 max-w-full overflow-hidden">
          <div className="w-full h-[400px] sm:h-[500px] lg:h-[600px] relative">
            <ProcessFlowGraph 
              nodes={flowMapNodes}
              glossaryTerms={glossaryTerms}
              onNodeClick={setSelectedFlowNode}
              highlightedNodes={highlightedNodes}
            />
          </div>
        </Card>

        {/* Node Detail Popup */}
        {selectedFlowNode && (
          <NodeDetailPopup
            node={selectedFlowNode}
            glossaryTerms={glossaryTerms}
            knownTerms={userProfile.knownTerms}
            onClose={() => setSelectedFlowNode(null)}
            onTermClick={setSelectedGlossaryTerm}
            onTestKnowledge={handleTestKnowledge}
          />
        )}
      </div>
    );
  };

  const renderStudyCards = () => {
    if (!currentStudyCard) {
      return (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6 sm:p-8 text-center">
            <Brain className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Great job!</h3>
            <p className="text-muted-foreground text-sm sm:text-base">
              You've completed all available study cards for your current level. 
              Check back later for more advanced content!
            </p>
          </CardContent>
        </Card>
      );
    }

    const relatedTerms = currentStudyCard.glossaryTerms
      .map(termId => glossaryTerms.find(term => term.id === termId))
      .filter(Boolean) as GlossaryTerm[];

    // Get card position information
    const completedCards = userProfile.completedCards.length;
    const totalCards = studyCards.length;
    const currentCardIndex = studyCards.findIndex(card => card.id === currentStudyCard.id) + 1;

    const getDifficultyColor = (difficulty: string) => {
      switch (difficulty) {
        case 'beginner': return 'bg-secondary/20 text-primary border-secondary/50';
        case 'intermediate': return 'bg-secondary/30 text-primary border-secondary';
        case 'advanced': return 'bg-primary/20 text-primary border-primary/50';
        default: return 'bg-muted text-muted-foreground border-border';
      }
    };

    return (
      <Card className="w-full max-w-2xl mx-auto max-w-full overflow-hidden">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Study Card {currentCardIndex} of {totalCards}
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {completedCards} completed • Progress: {Math.round((completedCards / totalCards) * 100)}%
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className={getDifficultyColor(currentStudyCard.difficulty)}>
                {currentStudyCard.difficulty}
              </Badge>
              <Badge variant="outline">
                {currentStudyCard.category}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 p-4 sm:p-6">
          {/* Enhanced Question Display with Visual Hierarchy */}
          <div className="relative p-6 sm:p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl max-w-full overflow-hidden border-2 border-blue-200 shadow-lg">
            {/* Question Icon/Label */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
              <h3 className="font-bold text-blue-900 text-lg sm:text-xl tracking-tight">Question</h3>
            </div>
            
            {/* Question Text with Enhanced Typography */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 sm:p-6 border border-blue-100">
              <p className="text-gray-800 text-base sm:text-lg font-medium break-words leading-relaxed tracking-wide">
                {currentStudyCard.question}
              </p>
            </div>
            
            {/* Subtle decorative elements for visual interest */}
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-100/30 rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 bg-indigo-100/40 rounded-full translate-y-6 -translate-x-6"></div>
          </div>

          {!showAnswer && (
            <div className="space-y-4">
              {/* Language Selection - Only show on desktop where speech recognition is used */}
              {!voiceRecording.isMobile && (
                <div className="flex items-center gap-2 p-3 bg-secondary/5 rounded-lg border border-secondary/20">
                  <label htmlFor="language-select" className="text-sm font-medium text-primary whitespace-nowrap">
                    Speech Language:
                  </label>
                  <select
                    id="language-select"
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="flex-1 p-2 border border-secondary/30 rounded-md text-sm bg-background"
                    disabled={voiceRecording.isRecording}
                  >
                    <option value="en-US">English (US)</option>
                    <option value="es-US">Spanish (US)</option>
                    <option value="es">Spanish</option>
                  </select>
                </div>
              )}

              {/* Voice Recording Interface */}
              {voiceRecording.isSupported ? (
                <div className="space-y-4">
                  {voiceRecording.isMobile ? (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-800 mb-2">
                            Voice Input on {voiceRecording.isIOS ? 'iOS' : 'Android'}
                          </p>
                          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                            <li>Tap the explanation text field below</li>
                            <li>Tap the microphone button on your keyboard</li>
                            <li>Speak your answer</li>
                            <li>Tap "Done" when finished</li>
                          </ol>
                          {voiceRecording.isAndroid && (
                            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
                              <p className="font-medium text-yellow-800 mb-2">If you see "No permission to enable voice typing":</p>
                              
                              {/* Quick permission request */}
                              <div className="mb-3">
                                <p className="text-yellow-700 mb-1">Try this first:</p>
                                <Button
                                  onClick={handleRequestMicrophonePermission}
                                  size="sm"
                                  className="text-xs py-1 px-2 h-auto bg-blue-600 hover:bg-blue-700"
                                >
                                  Request Microphone Permission
                                </Button>
                              </div>

                              {/* Manual steps */}
                              <div className="border-t border-yellow-300 pt-2">
                                <p className="text-yellow-700 mb-1">If that doesn't work, enable manually:</p>
                                <div className="flex flex-col gap-1">
                                  <Button
                                    onClick={handleOpenAndroidSettings}
                                    size="sm"
                                    variant="outline"
                                    className="text-xs py-1 px-2 h-auto border-yellow-400 text-yellow-800 hover:bg-yellow-100"
                                  >
                                    Open App Settings
                                  </Button>
                                  <p className="text-yellow-600 mt-1">Or go to: Settings → Apps → Browser → Permissions → Microphone → Allow</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-secondary/5 rounded-lg border border-secondary/20">
                      <div className="flex items-center gap-2">
                        {voiceRecording.isRecording ? (
                          <div className="flex items-center gap-2 text-red-600">
                            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium">Recording...</span>
                          </div>
                        ) : (
                          <Mic className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      
                      <div className="flex gap-2 flex-1">
                        {!voiceRecording.isRecording && !voiceRecording.isProcessing && (
                          <Button
                            onClick={handleStartRecording}
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Mic className="w-4 h-4" />
                            Start Recording
                          </Button>
                        )}
                        
                        {voiceRecording.isRecording && (
                          <Button
                            onClick={voiceRecording.stopRecording}
                            size="sm"
                            variant="destructive"
                            className="flex items-center gap-2"
                          >
                            <Square className="w-4 h-4" />
                            Stop Recording
                          </Button>
                        )}
                        
                        {(voiceRecording.transcript || voiceRecording.audioBlob) && !voiceRecording.isRecording && (
                          <Button
                            onClick={voiceRecording.resetRecording}
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Reset
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {voiceRecording.error && !voiceRecording.isIOS && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">{voiceRecording.error}</span>
                      </div>
                    </div>
                  )}
                  
                  {voiceRecording.isProcessing && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-800">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm">Processing recording...</span>
                      </div>
                    </div>
                  )}
                  
                  {voiceRecording.isRecording && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-800">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-medium">Recording... Speak now to see your text appear in the explanation box below</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <MicOff className="w-4 h-4" />
                    <span className="text-sm font-medium">Voice recording not supported</span>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">
                    Please use the text input below or try a different browser.
                  </p>
                </div>
              )}
              
              {/* Text Input */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Your explanation:
                </label>
                <textarea
                  ref={textareaRef}
                  value={displayText}
                  onChange={(e) => {
                    // Only allow editing when not recording
                    if (!voiceRecording.isRecording) {
                      setUserAnswer(e.target.value);
                    }
                  }}
                  className={`w-full p-3 border rounded-lg resize-none h-20 sm:h-24 text-sm ${
                    voiceRecording.isRecording ? 'border-blue-500 bg-blue-50/30' : ''
                  }`}
                  placeholder={voiceRecording.isMobile 
                    ? "Type here or tap the microphone on your keyboard to dictate..." 
                    : "Type or click 'Start Recording' to dictate..."}
                  autoComplete="off"
                  autoCorrect="on"
                  autoCapitalize="sentences"
                  spellCheck="true"
                />
                {voiceRecording.isMobile && (
                  <p className="text-xs text-gray-600 mt-1">
                    💡 Tip: Use your keyboard's microphone button for voice input
                  </p>
                )}
                {!voiceRecording.isMobile && voiceRecording.speechRecognitionSupported && !voiceRecording.isRecording && (
                  <p className="text-xs text-gray-600 mt-1">
                    💡 Tip: Click "Start Recording" to dictate. You'll see your words appear in real-time!
                  </p>
                )}
              </div>
              
              {/* Server-side AI Assessment Info */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>AI Assessment:</strong> Your responses are analyzed server-side using secure AI processing to provide detailed feedback on key concepts.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={handleSubmitAnswer}
                  disabled={!userAnswer.trim()}
                  className="flex-1"
                  size="sm"
                >
                  {isAssessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    'Submit Response'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAnswer(true)}
                  className="flex-1"
                  size="sm"
                >
                  Show Answer
                </Button>
              </div>
            </div>
          )}

          {showAnswer && (
            <div className="space-y-4">
              {/* User's Submitted Answer - only show if they submitted something and we're not waiting for assessment */}
              {userAnswer.trim() && !isAssessing && (
                <div className="p-3 sm:p-4 bg-blue-50 rounded-lg max-w-full overflow-hidden border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2 text-sm sm:text-base">Your Answer:</h3>
                  <p className="text-blue-700 text-sm sm:text-base break-words leading-relaxed">
                    {userAnswer.trim()}
                  </p>
                </div>
              )}

              {/* Judging Criteria - only show if no answer was submitted (direct Show Answer) */}
              {!userAnswer.trim() && (
                <div className="p-3 sm:p-4 bg-green-50 rounded-lg max-w-full overflow-hidden border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-2 text-sm sm:text-base">Expected Answer:</h3>
                  <p className="text-green-700 text-sm sm:text-base break-words leading-relaxed mb-3">
                    {currentStudyCard.answer}
                  </p>
                  <div className="text-xs text-green-600 italic">
                    This is what the AI system uses to judge correct responses.
                  </div>
                </div>
              )}

              {/* Continue Button - only show if no submission was made (direct Show Answer) */}
              {!userAnswer.trim() && (
                <div className="text-center">
                  <Button 
                    onClick={handleStudyCardComplete}
                    className="bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Continue to Next Topic
                  </Button>
                </div>
              )}

              {isAssessing && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium">AI is analyzing your response...</span>
                  </div>
                </div>
              )}

              {assessment && !isAssessing && (
                <div className="space-y-4">
                  {/* Overall Feedback */}
                  <div className="p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      <h4 className="font-semibold text-primary">AI Assessment</h4>
                      <Badge 
                        variant="outline" 
                        className={`${
                          assessment.comprehensionLevel === 'excellent' ? 'bg-green-50 text-green-700 border-green-300' :
                          assessment.comprehensionLevel === 'good' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                          assessment.comprehensionLevel === 'partial' ? 'bg-yellow-50 text-yellow-700 border-yellow-300' :
                          'bg-red-50 text-red-700 border-red-300'
                        }`}
                      >
                        {assessment.comprehensionLevel}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground break-words leading-relaxed">
                      {assessment.feedback}
                    </p>
                  </div>

                  {/* Similarities */}
                  {assessment.similarities && assessment.similarities.length > 0 && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <h5 className="font-medium text-green-800">What you got right:</h5>
                      </div>
                      <ul className="space-y-1">
                        {assessment.similarities.map((similarity: string, index: number) => (
                          <li key={index} className="text-sm text-green-700 break-words leading-relaxed flex items-start gap-2">
                            <span className="text-green-500 mt-1">•</span>
                            <span>{similarity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Technical Answer and Areas to Consider */}
                  {assessment.differences && assessment.differences.length > 0 && (
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Info className="w-4 h-4 text-orange-600" />
                        <h5 className="font-medium text-orange-800">Areas to consider:</h5>
                      </div>
                      
                      {/* Technical Answer */}
                      <div className="mb-4 p-3 bg-white/60 rounded-lg border border-orange-100">
                        <h6 className="font-semibold text-orange-900 mb-2 text-sm">This is what the AI system uses to judge correct responses:</h6>
                        <p className="text-sm text-orange-800 break-words leading-relaxed">
                          {currentStudyCard.answer}
                        </p>
                      </div>
                      
                      {/* Areas to Consider */}
                      <div>
                        <h6 className="font-semibold text-orange-900 mb-2 text-sm">Key Points to Review:</h6>
                        <ul className="space-y-1">
                          {assessment.differences.map((difference: string, index: number) => (
                            <li key={index} className="text-sm text-orange-700 break-words leading-relaxed flex items-start gap-2">
                              <span className="text-orange-500 mt-1">•</span>
                              <span>{difference}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {assessment.suggestions && assessment.suggestions.length > 0 && (
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Lightbulb className="w-4 h-4 text-purple-600" />
                        <h5 className="font-medium text-purple-800">Suggestions for improvement:</h5>
                      </div>
                      <ul className="space-y-1">
                        {assessment.suggestions.map((suggestion: string, index: number) => (
                          <li key={index} className="text-sm text-purple-700 break-words leading-relaxed flex items-start gap-2">
                            <span className="text-purple-500 mt-1">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Continue Button - after all assessment content */}
                  <div className="text-center pt-4">
                    <div className={`p-3 rounded-lg mb-3 ${
                      assessment.comprehensionLevel === 'excellent' || assessment.comprehensionLevel === 'good' 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-orange-50 border border-orange-200'
                    }`}>
                      <p className="text-sm font-medium">
                        {assessment.comprehensionLevel === 'excellent' || assessment.comprehensionLevel === 'good'
                          ? '✅ Topic Learned! Key concepts demonstrated successfully.'
                          : '📚 Needs More Practice - Some key concepts need reinforcement.'}
                      </p>
                    </div>
                    <Button 
                      onClick={handleStudyCardComplete}
                      className="bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Continue to Next Topic
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {relatedTerms.length > 0 && (
            <div className="p-3 sm:p-4 bg-accent/10 rounded-lg max-w-full overflow-hidden border border-accent/20">
              <h4 className="font-semibold text-primary mb-2 text-sm sm:text-base">Related Terms:</h4>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {relatedTerms.map((term) => (
                  <Badge key={term.id} variant="secondary" className="text-xs break-all">
                    {term.term}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };


  const renderProfile = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Learning Profile</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Track your progress and achievements
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Profile Overview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            <div>
              <div className="font-semibold text-sm sm:text-base break-words">{userProfile.name}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Learning since {userProfile.createdAt.toLocaleDateString()}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl">
                {stats.currentLevel === 'beginner' ? '🌱' : 
                 stats.currentLevel === 'intermediate' ? '🌿' : '🏆'}
              </span>
              <Badge className="bg-secondary/20 text-primary border-secondary/50 text-xs">
                {stats.currentLevel.charAt(0).toUpperCase() + stats.currentLevel.slice(1)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Overall Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
              Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-primary">
                {stats.overallProgress}%
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">Complete</div>
            </div>
            <Progress value={stats.overallProgress} className="w-full" />
          </CardContent>
        </Card>

        {/* Terms Mastery */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium">Known</span>
              <span className="text-xs sm:text-sm text-muted-foreground">
                {stats.knownTerms} / {stats.totalTerms}
              </span>
            </div>
            <Progress value={stats.termProgress} className="w-full" />
            <div className="text-xs text-muted-foreground">
              {stats.termProgress}% mastered
            </div>
          </CardContent>
        </Card>

        {/* Study Cards Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Brain className="w-4 h-4 sm:w-5 sm:h-5" />
              Cards
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-medium">Completed</span>
              <span className="text-xs sm:text-sm text-muted-foreground">
                {stats.completedCards} / {stats.totalCards}
              </span>
            </div>
            <Progress value={stats.cardProgress} className="w-full" />
            <div className="text-xs text-muted-foreground">
              {stats.cardProgress}% completed
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Goals */}
      {userProfile.learningGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              Learning Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {userProfile.learningGoals.map((goal, index) => (
                <Badge key={index} variant="outline" className="text-xs break-all">
                  {goal}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6 sm:space-y-8">
      <div className="text-center max-w-full px-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
          Navigate Your Home Loan Journey with Confidence
        </h2>
        <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto break-words leading-relaxed">
          Understand what happens behind the scenes when applying for a home loan. 
          See what documents you'll need, who reviews them, and how each step 
          of the process works—from application to closing.
        </p>
      </div>

      {/* Documentation Overview Section - NEW MAIN CONTENT */}
      <div className="space-y-6">
        <DocumentationOverview 
          personas={processPersonas}
          documents={documentRequirements}
          onDocumentClick={handleDocumentClick}
        />
      </div>

      {/* Process Flow Section */}
      <div className="space-y-6" data-process-flow>
        <div className="flex items-center gap-2 px-4">
          <Map className="w-5 h-5 text-primary" />
          <h3 className="text-lg sm:text-xl font-semibold">Process Flow Map</h3>
        </div>
        {renderProcessFlow()}
      </div>

      {/* Glossary Section with Study Cards */}
      <div data-glossary-browser>
        <GlossaryBrowser
          glossaryTerms={glossaryTerms}
          userProfile={userProfile}
          onTermSelect={setSelectedGlossaryTerm}
          selectedTerm={selectedGlossaryTerm}
          currentStudyCard={currentStudyCard}
          showTestingSection={true}
          studyCardContent={renderStudyCards()}
          onTestKnowledge={handleTestKnowledge}
          isExpanded={glossaryBrowserExpanded}
          onExpandedChange={setGlossaryBrowserExpanded}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background max-w-full overflow-x-hidden">
      {renderNavigation()}
      <main className="max-w-7xl mx-auto py-4 sm:py-6">
        <div className="px-4 sm:px-6 lg:px-8">
          {currentView === 'dashboard' ? renderDashboard() : renderProfile()}
        </div>
      </main>

      {/* Legal Disclaimer Popup */}
      {showLegalDisclaimer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Important Legal Notice & Instructions
              </h2>
            </div>
            <div className="p-6">
              <LegalAndInstructionsContent showFullLegalDisclaimer={true} />
              
              <div className="flex justify-end pt-6 border-t mt-6">
                <Button 
                  onClick={() => setShowLegalDisclaimer(false)}
                  className="bg-primary hover:bg-primary/90"
                >
                  I Understand and Accept
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions Popup */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                How to Use This Learning Platform
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInstructions(false)}
                className="p-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-6">
              <LegalAndInstructionsContent showFullLegalDisclaimer={true} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;