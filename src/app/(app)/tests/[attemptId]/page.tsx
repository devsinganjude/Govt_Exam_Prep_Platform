import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { TestEngine } from './TestEngine'

export default async function TestAttemptPage({ params }: { params: { attemptId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch attempt
  const { data: attempt } = await supabase
    .from('attempts')
    .select('*, tests(title, duration_min)')
    .eq('id', params.attemptId)
    .eq('user_id', user.id)
    .single()

  if (!attempt) notFound()

  // 4.7 Block re-entry
  if (attempt.status === 'submitted') {
    redirect(`/tests/${attempt.id}/result`)
  }

  // Fetch answers
  const { data: answers } = await supabase
    .from('attempt_answers')
    .select(`
      id,
      selected_option,
      marked_for_review,
      time_spent_sec,
      question_id,
      questions(
        question_text,
        options
      )
    `)
    .eq('attempt_id', attempt.id)

  if (!answers || answers.length === 0) notFound()

  // Clean up format
  const formattedAnswers = answers.map(a => {
    const q = a.questions as unknown as { question_text: string, options: string[] }
    return {
      answerId: a.id,
      questionId: a.question_id,
      questionText: q.question_text,
      options: q.options,
      selectedOption: a.selected_option,
      markedForReview: a.marked_for_review,
      timeSpentSec: a.time_spent_sec
    }
  })

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-[calc(100vh-64px)] md:h-auto">
      <TestEngine 
        attemptId={attempt.id} 
        testTitle={(attempt.tests as unknown as { title: string }).title}
        durationMin={(attempt.tests as unknown as { duration_min: number }).duration_min}
        startedAt={attempt.started_at}
        initialAnswers={formattedAnswers} 
      />
    </div>
  )
}
