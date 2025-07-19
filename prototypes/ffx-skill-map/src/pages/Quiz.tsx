import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toast'
import { neo4jService } from '../services/neo4j'
import { quizQuestions, calculateInferredSkills, calculateConfidence } from '../data/quiz-questions'
import { QuizResult } from '../types'
import { Brain, CheckCircle, ArrowRight, ArrowLeft, Target } from 'lucide-react'

const Quiz = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<{ questionId: string; selectedOptionId: string }[]>([])
  const [employeeId, setEmployeeId] = useState('')
  const [employeeName, setEmployeeName] = useState('')
  const [showResults, setShowResults] = useState(false)
  const [inferredSkills, setInferredSkills] = useState<string[]>([])
  const [confidence, setConfidence] = useState(0)

  const queryClient = useQueryClient()

  const saveQuizMutation = useMutation({
    mutationFn: (quizResult: QuizResult) => neo4jService.saveQuizResults(quizResult),
    onSuccess: () => {
      toast({
        title: "Quiz completed!",
        description: "Your skills have been saved to the database.",
      })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save quiz results. Please try again.",
        variant: "destructive",
      })
    }
  })

  const handleAnswerSelect = (optionId: string) => {
    const questionId = quizQuestions[currentQuestion].id
    const existingAnswerIndex = answers.findIndex(a => a.questionId === questionId)
    
    if (existingAnswerIndex >= 0) {
      // Update existing answer
      const newAnswers = [...answers]
      newAnswers[existingAnswerIndex] = { questionId, selectedOptionId: optionId }
      setAnswers(newAnswers)
    } else {
      // Add new answer
      setAnswers([...answers, { questionId, selectedOptionId: optionId }])
    }
  }

  const handleNext = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      // Quiz completed, calculate results
      const skills = calculateInferredSkills(answers)
      const conf = calculateConfidence(answers)
      setInferredSkills(skills)
      setConfidence(conf)
      setShowResults(true)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSaveResults = () => {
    if (!employeeId.trim() || !employeeName.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both employee ID and name.",
        variant: "destructive",
      })
      return
    }

    const quizResult: QuizResult = {
      employeeId: employeeId.trim(),
      answers,
      inferredSkills,
      confidence
    }

    saveQuizMutation.mutate(quizResult)
  }

  const currentQuestionData = quizQuestions[currentQuestion]
  const currentAnswer = answers.find(a => a.questionId === currentQuestionData.id)
  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100

  if (showResults) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Quiz Results</h1>
          <p className="text-gray-600">
            Based on your answers, here are the skills we've inferred for you.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
            <CardDescription>
              Please provide your employee details to save the results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  placeholder="e.g., emp_001"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="employeeName">Employee Name</Label>
                <Input
                  id="employeeName"
                  placeholder="e.g., John Doe"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inferred Skills</CardTitle>
            <CardDescription>
              Confidence: {confidence.toFixed(1)}%
            </CardDescription>
          </CardHeader>
          <CardContent>
            {inferredSkills.length > 0 ? (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {inferredSkills.map(skillId => (
                    <Badge key={skillId} variant="default" className="text-sm">
                      {skillId}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-gray-600">
                  These skills were inferred based on your quiz answers. 
                  The confidence level indicates how certain we are about these skill assessments.
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  No skills were inferred from your answers. 
                  This might be because the answers didn't provide enough evidence for specific skills.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              setShowResults(false)
              setCurrentQuestion(0)
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retake Quiz
          </Button>
          
          <Button
            onClick={handleSaveResults}
            disabled={saveQuizMutation.isPending || inferredSkills.length === 0}
          >
            {saveQuizMutation.isPending ? (
              "Saving..."
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Results
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Skill Assessment Quiz</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Answer these questions to help us understand your skills and experience. 
          Based on your answers, we'll infer which skills you've mastered in our Final Fantasy X skill map.
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Question {currentQuestion + 1} of {quizQuestions.length}</CardTitle>
            <Badge variant="outline">{Math.round(progress)}% Complete</Badge>
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>
      </Card>

      {/* Question */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            {currentQuestionData.question}
          </CardTitle>
          <CardDescription>
            Category: {currentQuestionData.category}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentQuestionData.options.map((option) => (
              <div
                key={option.id}
                className={`p-4 border rounded-lg cursor-pointer quiz-option ${
                  currentAnswer?.selectedOptionId === option.id ? 'selected' : ''
                }`}
                onClick={() => handleAnswerSelect(option.id)}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-4 h-4 rounded-full border-2 mt-1 ${
                    currentAnswer?.selectedOptionId === option.id 
                      ? 'bg-blue-500 border-blue-500' 
                      : 'border-gray-300'
                  }`}>
                    {currentAnswer?.selectedOptionId === option.id && (
                      <div className="w-full h-full rounded-full bg-white scale-50"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{option.text}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {option.skills.map(skillId => (
                        <Badge key={skillId} variant="secondary" className="text-xs">
                          {skillId}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={!currentAnswer}
        >
          {currentQuestion === quizQuestions.length - 1 ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Quiz
            </>
          ) : (
            <>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How it works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Each question has multiple choice answers that correspond to different skills</p>
            <p>• Skills shown under each option indicate what that answer suggests about your abilities</p>
            <p>• We'll analyze your answers to infer which skills you've mastered</p>
            <p>• The more questions you answer, the more accurate our skill assessment will be</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Quiz 