'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Bookmark, BookmarkCheck, ChevronRight, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { getNextQuestion, toggleBookmark, checkBookmarkStatus, recordPracticeAnswer } from '../actions'
import { useRouter } from 'next/navigation'

type Question = {
  id: string
  question_text: string
  options: string[]
  explanation: string | null
  correct_option: number
}

export function PracticeClient({ topicId }: { topicId: string }) {
  const router = useRouter()
  const [question, setQuestion] = useState<Question | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFinished, setIsFinished] = useState(false)
  
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  
  const [seenIds, setSeenIds] = useState<string[]>([])

  const fetchQuestion = async (isFirstLoad = false) => {
    if (!isFirstLoad) setIsLoading(true)
    setIsSubmitted(false)
    setSelectedOption(null)
    setIsBookmarked(false)

    const q = await getNextQuestion(topicId, seenIds)
    if (!q) {
      setIsFinished(true)
      setIsLoading(false)
      return
    }

    setQuestion(q as Question)
    setSeenIds(prev => [...prev, q.id])
    
    const bookmarked = await checkBookmarkStatus(q.id)
    setIsBookmarked(bookmarked)
    
    setIsLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line
    fetchQuestion(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleBookmarkToggle = async () => {
    if (!question) return
    const newState = !isBookmarked
    setIsBookmarked(newState)
    await toggleBookmark(question.id, newState)
  }

  const handleSubmit = async () => {
    if (selectedOption === null || !question) return
    setIsSubmitted(true)
    const isCorrect = selectedOption === question.correct_option
    await recordPracticeAnswer(topicId, question.id, selectedOption, isCorrect)
  }

  if (isLoading) {
    return (
      <Card className="w-full h-64 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </Card>
    )
  }

  if (isFinished || !question) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 text-center space-y-4">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
          <h3 className="text-xl font-bold">You&apos;ve reached the end!</h3>
          <p className="text-muted-foreground">You have practiced all available questions for this topic.</p>
          <Button onClick={() => router.push('/practice')}>Back to Practice</Button>
        </CardContent>
      </Card>
    )
  }

  const isCorrect = isSubmitted && selectedOption === question.correct_option

  return (
    <Card className="w-full relative">
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-2 right-2"
        onClick={handleBookmarkToggle}
      >
        {isBookmarked ? <BookmarkCheck className="h-5 w-5 text-primary" /> : <Bookmark className="h-5 w-5 text-muted-foreground" />}
      </Button>

      <CardHeader>
        <CardTitle className="text-lg leading-relaxed pr-8">
          {question.question_text}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <RadioGroup 
          value={selectedOption?.toString() ?? ''} 
          onValueChange={(val) => !isSubmitted && setSelectedOption(parseInt(val))}
          className="space-y-3"
        >
          {question.options.map((opt, idx) => {
            const isThisCorrect = isSubmitted && idx === question.correct_option
            const isThisWrongSelected = isSubmitted && selectedOption === idx && idx !== question.correct_option
            
            let itemClass = "flex items-center space-x-3 space-y-0 rounded-md border p-4 transition-colors "
            if (!isSubmitted) {
              itemClass += "hover:bg-muted cursor-pointer"
            } else {
              if (isThisCorrect) itemClass += "border-green-500 bg-green-50 dark:bg-green-950/20"
              else if (isThisWrongSelected) itemClass += "border-red-500 bg-red-50 dark:bg-red-950/20"
              else itemClass += "opacity-50"
            }

            return (
              <Label key={idx} className={itemClass}>
                <RadioGroupItem value={idx.toString()} disabled={isSubmitted} className="mt-0.5" />
                <span className="font-normal text-base leading-snug break-words">
                  {opt}
                </span>
                {isThisCorrect && <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto shrink-0" />}
                {isThisWrongSelected && <XCircle className="h-5 w-5 text-red-500 ml-auto shrink-0" />}
              </Label>
            )
          })}
        </RadioGroup>

        {isSubmitted && (
          <div className={`p-4 rounded-md border ${isCorrect ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
            <h4 className={`font-semibold mb-2 ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </h4>
            {question.explanation ? (
              <p className="text-sm">{question.explanation}</p>
            ) : (
              <p className="text-sm italic opacity-80">No explanation provided.</p>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="justify-end bg-muted/20 border-t p-4 rounded-b-lg">
        {!isSubmitted ? (
          <Button onClick={handleSubmit} disabled={selectedOption === null} className="w-full sm:w-auto">
            Submit Answer
          </Button>
        ) : (
          <Button onClick={() => fetchQuestion(false)} className="w-full sm:w-auto gap-2">
            Next Question <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
