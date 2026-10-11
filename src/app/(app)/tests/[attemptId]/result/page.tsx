import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, XCircle, MinusCircle, Clock, Target } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function TestResultPage({ params }: { params: { attemptId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: attempt } = await supabase
    .from('attempts')
    .select('*, tests(title, duration_min, exam_id)')
    .eq('id', params.attemptId)
    .eq('user_id', user.id)
    .single()

  if (!attempt) notFound()
  if (attempt.status !== 'submitted') {
    redirect(`/tests/${attempt.id}`)
  }

  const { data: answers } = await supabase
    .from('attempt_answers')
    .select(`
      id,
      selected_option,
      is_correct,
      time_spent_sec,
      question_id,
      questions(
        question_text,
        options,
        correct_option,
        explanation,
        topic_id
      )
    `)
    .eq('attempt_id', attempt.id)
    
  if (!answers) notFound()

  const correct = answers.filter(a => a.is_correct === true).length
  const wrong = answers.filter(a => a.is_correct === false).length
  const unattempted = answers.filter(a => a.is_correct === null).length
  // accuracy could be calculated using total if needed
  
  const test = attempt.tests as unknown as { title: string, duration_min: number, exam_id: string }

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Test Results</h2>
          <p className="text-muted-foreground mt-1">{test.title}</p>
        </div>
        <Link href="/tests">
          <Button variant="outline">Back to Tests</Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="col-span-2 md:col-span-1 border-primary/50 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center"><Target className="w-4 h-4 mr-2"/> Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{Number(attempt.score).toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center"><CheckCircle2 className="w-4 h-4 mr-2 text-green-500"/> Correct</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{correct}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center"><XCircle className="w-4 h-4 mr-2 text-red-500"/> Wrong</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{wrong}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center"><MinusCircle className="w-4 h-4 mr-2 text-gray-500"/> Skipped</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{unattempted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center"><Clock className="w-4 h-4 mr-2"/> Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor((attempt.time_taken_sec || 0) / 60)}m {(attempt.time_taken_sec || 0) % 60}s
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Review List */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold">Review Questions</h3>
        <div className="space-y-6">
          {answers.map((ans, index) => {
            const q = ans.questions as unknown as { question_text: string, options: string[], correct_option: number, explanation: string | null }
            let statusBadge = <span className="text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs font-semibold">Skipped</span>
            let borderColor = 'border-gray-200 dark:border-gray-800'
            if (ans.is_correct === true) {
              statusBadge = <span className="text-green-700 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded text-xs font-semibold">Correct</span>
              borderColor = 'border-green-500/50'
            } else if (ans.is_correct === false) {
              statusBadge = <span className="text-red-700 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded text-xs font-semibold">Wrong</span>
              borderColor = 'border-red-500/50'
            }

            return (
              <Card key={ans.id} className={`border-l-4 ${borderColor}`}>
                <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                  <div className="font-semibold">Question {index + 1}</div>
                  <div>{statusBadge}</div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-lg">{q.question_text}</p>
                  <div className="grid gap-2">
                    {q.options.map((opt: string, idx: number) => {
                      const isSelected = ans.selected_option === idx
                      const isCorrectOpt = q.correct_option === idx
                      let itemClass = "p-3 rounded-md border text-sm flex justify-between items-center "
                      
                      if (isCorrectOpt) {
                        itemClass += "border-green-500 bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-300 font-medium"
                      } else if (isSelected && !isCorrectOpt) {
                        itemClass += "border-red-500 bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-300"
                      } else {
                        itemClass += "border-border"
                      }

                      return (
                        <div key={idx} className={itemClass}>
                          <span>{opt}</span>
                          <div className="flex space-x-2">
                            {isSelected && <span className="text-xs uppercase bg-background px-2 py-0.5 border rounded text-muted-foreground">Your Answer</span>}
                            {isCorrectOpt && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                            {isSelected && !isCorrectOpt && <XCircle className="w-5 h-5 text-red-500" />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {q.explanation && (
                    <div className="bg-muted p-4 rounded-md mt-4">
                      <h4 className="font-semibold text-sm mb-1">Explanation</h4>
                      <p className="text-sm">{q.explanation}</p>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground flex items-center pt-2">
                    <Clock className="w-3 h-3 mr-1" /> Time spent: {ans.time_spent_sec}s
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
