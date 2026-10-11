'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Clock, Flag, ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react'
import { updateAnswer } from './actions'
import { submitTestAttempt } from '../actions'

type Answer = {
  answerId: string
  questionId: string
  questionText: string
  options: string[]
  selectedOption: number | null
  markedForReview: boolean
  timeSpentSec: number
}

export function TestEngine({ 
  attemptId, 
  testTitle, 
  durationMin, 
  startedAt, 
  initialAnswers 
}: { 
  attemptId: string
  testTitle: string
  durationMin: number
  startedAt: string
  initialAnswers: Answer[]
}) {
  const [answers, setAnswers] = useState<Answer[]>(initialAnswers)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(durationMin * 60)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const lastActiveRef = useRef(0)

  useEffect(() => {
    lastActiveRef.current = Date.now()
  }, [])

  const handleFinalSubmit = async () => {
    setIsSubmitting(true)
    await submitTestAttempt(attemptId)
  }

  // Timer Correctness (4.5)
  useEffect(() => {
    const start = new Date(startedAt).getTime()
    const durationMs = durationMin * 60 * 1000
    
    const updateTimer = () => {
      const now = Date.now()
      const elapsed = now - start
      const remaining = Math.max(0, Math.floor((durationMs - elapsed) / 1000))
      setTimeLeft(remaining)
      
      if (remaining === 0) {
        if (timerRef.current) clearInterval(timerRef.current)
        handleFinalSubmit()
      }
    }
    
    updateTimer()
    timerRef.current = setInterval(updateTimer, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt, durationMin])

  // Track time spent per question
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const delta = Math.floor((now - lastActiveRef.current) / 1000)
      if (delta > 0) {
        setAnswers(prev => {
          const newAnswers = [...prev]
          newAnswers[currentIndex].timeSpentSec += delta
          return newAnswers
        })
        lastActiveRef.current = now
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [currentIndex])

  const currentAnswer = answers[currentIndex]

  // Autosave (4.4)
  const saveAnswer = async (answerId: string, sel: number | null, marked: boolean, time: number) => {
    await updateAnswer(answerId, sel, marked, time)
  }

  const handleOptionSelect = (val: string) => {
    const newVal = parseInt(val)
    setAnswers(prev => {
      const copy = [...prev]
      copy[currentIndex].selectedOption = newVal
      return copy
    })
    saveAnswer(currentAnswer.answerId, newVal, currentAnswer.markedForReview, currentAnswer.timeSpentSec)
  }

  const handleClear = () => {
    setAnswers(prev => {
      const copy = [...prev]
      copy[currentIndex].selectedOption = null
      return copy
    })
    saveAnswer(currentAnswer.answerId, null, currentAnswer.markedForReview, currentAnswer.timeSpentSec)
  }

  const handleMarkReview = () => {
    const newVal = !currentAnswer.markedForReview
    setAnswers(prev => {
      const copy = [...prev]
      copy[currentIndex].markedForReview = newVal
      return copy
    })
    saveAnswer(currentAnswer.answerId, currentAnswer.selectedOption, newVal, currentAnswer.timeSpentSec)
  }

  const handleNext = () => {
    if (currentIndex < answers.length - 1) {
      setCurrentIndex(currentIndex + 1)
      lastActiveRef.current = Date.now()
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      lastActiveRef.current = Date.now()
    }
  }



  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const answeredCount = answers.filter(a => a.selectedOption !== null).length
  const markedCount = answers.filter(a => a.markedForReview).length
  const unansweredCount = answers.length - answeredCount

  return (
    <div className="flex flex-col md:flex-row flex-1 h-full overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col border-r overflow-hidden">
        {/* Top bar */}
        <div className="p-4 border-b flex justify-between items-center bg-card">
          <h2 className="font-bold text-lg hidden sm:block truncate max-w-[300px]">{testTitle}</h2>
          <div className="flex items-center space-x-4 bg-muted px-4 py-2 rounded-full font-mono text-lg ml-auto md:ml-0">
            <Clock className="w-5 h-5 mr-2 text-primary" />
            <span className={timeLeft < 60 ? 'text-red-500 font-bold' : ''}>{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Question Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-3xl mx-auto">
            <div className="mb-6 flex justify-between items-center text-sm text-muted-foreground font-medium">
              <span>Question {currentIndex + 1} of {answers.length}</span>
              <Button variant="ghost" size="sm" onClick={handleMarkReview} className={currentAnswer.markedForReview ? 'text-yellow-600 dark:text-yellow-500' : ''}>
                <Flag className="w-4 h-4 mr-2" />
                {currentAnswer.markedForReview ? 'Marked for Review' : 'Mark for Review'}
              </Button>
            </div>
            
            <h3 className="text-xl leading-relaxed mb-8">{currentAnswer.questionText}</h3>
            
            <RadioGroup value={currentAnswer.selectedOption?.toString() ?? ''} onValueChange={handleOptionSelect} className="space-y-4">
              {currentAnswer.options.map((opt, idx) => (
                <Label 
                  key={idx} 
                  className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors ${currentAnswer.selectedOption === idx ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}
                >
                  <RadioGroupItem value={idx.toString()} className="mt-0.5" />
                  <span className="font-normal text-base">{opt}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>
        </div>

        {/* Action Bar */}
        <div className="p-4 border-t flex items-center justify-between bg-card">
          <div className="space-x-2">
            <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Prev
            </Button>
            <Button variant="outline" onClick={handleNext} disabled={currentIndex === answers.length - 1}>
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <Button variant="ghost" onClick={handleClear} disabled={currentAnswer.selectedOption === null}>
            Clear
          </Button>
        </div>
      </div>

      {/* Right Palette */}
      <div className="w-full md:w-[320px] bg-muted/20 flex flex-col border-t md:border-t-0 shrink-0 h-64 md:h-auto">
        <div className="p-4 border-b bg-card">
          <h3 className="font-semibold flex items-center"><LayoutGrid className="w-4 h-4 mr-2" /> Question Palette</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-5 gap-2">
            {answers.map((ans, idx) => {
              let stateClass = "bg-card text-foreground border-border hover:bg-muted"
              if (ans.selectedOption !== null && ans.markedForReview) stateClass = "bg-yellow-600 text-white hover:bg-yellow-700 border-yellow-700"
              else if (ans.selectedOption !== null) stateClass = "bg-green-600 text-white hover:bg-green-700 border-green-700"
              else if (ans.markedForReview) stateClass = "bg-yellow-200 text-yellow-900 hover:bg-yellow-300 border-yellow-300"
              
              if (idx === currentIndex) stateClass += " ring-2 ring-primary ring-offset-2 ring-offset-background"

              return (
                <button
                  key={ans.questionId}
                  onClick={() => {
                    setCurrentIndex(idx)
                    lastActiveRef.current = Date.now()
                  }}
                  className={`w-full aspect-square rounded flex items-center justify-center text-sm font-medium border transition-all ${stateClass}`}
                >
                  {idx + 1}
                </button>
              )
            })}
          </div>

          <div className="mt-8 space-y-2 text-sm text-muted-foreground hidden md:block">
            <div className="flex items-center"><span className="w-4 h-4 rounded bg-green-600 mr-2"></span> Answered ({answeredCount})</div>
            <div className="flex items-center"><span className="w-4 h-4 rounded bg-yellow-600 mr-2"></span> Marked & Answered</div>
            <div className="flex items-center"><span className="w-4 h-4 rounded bg-yellow-200 mr-2"></span> Marked ({markedCount})</div>
            <div className="flex items-center"><span className="w-4 h-4 rounded border bg-card mr-2"></span> Unanswered ({unansweredCount})</div>
          </div>
        </div>

        <div className="p-4 border-t bg-card">
          <Button 
            className="w-full" 
            size="lg"
            onClick={() => setShowConfirm(true)}
          >
            Submit Test
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader>
              <CardTitle>Submit Test?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">Are you sure you want to submit your attempt? You cannot change your answers after submission.</p>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{answeredCount}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Answered</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{unansweredCount}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Unanswered</div>
                </div>
              </div>
            </CardContent>
            <div className="p-4 flex justify-end space-x-2 border-t">
              <Button variant="ghost" onClick={() => setShowConfirm(false)} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleFinalSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Confirm Submit'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
