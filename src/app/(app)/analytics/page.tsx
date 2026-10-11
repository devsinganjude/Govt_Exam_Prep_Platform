import { createClient } from '@/lib/supabase/server'
import { computeScoreTrend, computeSubjectAccuracy, computeWeakTopics, computeTimeAnalysis, AttemptData, AnswerData } from '@/lib/analytics'
import { TrendChart } from './TrendChart'
import { AccuracyChart } from './AccuracyChart'
import { WeakTopics } from './WeakTopics'
import { TimeAnalysis } from './TimeAnalysis'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Fetch attempts
  const { data: attemptsReq } = await supabase
    .from('attempts')
    .select('id, score, started_at, time_taken_sec, tests(title, duration_min, question_ids)')
    .eq('user_id', user.id)
    .eq('status', 'submitted')

  const attempts = (attemptsReq || []) as unknown as AttemptData[]

  const attemptIds = attempts.map(a => a.id)
  let answers: AnswerData[] = []

  if (attemptIds.length > 0) {
    const { data: answersReq } = await supabase
      .from('attempt_answers')
      .select(`
        is_correct, 
        time_spent_sec, 
        questions(
          topic_id, 
          topics(
            name, 
            subjects(id, name)
          )
        )
      `)
      .in('attempt_id', attemptIds)

    answers = (answersReq || []) as unknown as AnswerData[]
  }

  const scoreTrend = computeScoreTrend(attempts)
  const subjectAccuracy = computeSubjectAccuracy(answers)
  const weakTopics = computeWeakTopics(answers)
  const timeStats = computeTimeAnalysis(attempts, answers)

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
      </div>

      {attempts.length === 0 ? (
        <div className="text-center p-12 border rounded-lg bg-muted/20">
          <h3 className="text-xl font-semibold mb-2">No Data Yet</h3>
          <p className="text-muted-foreground">Complete some mock tests to see your performance analytics.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TrendChart data={scoreTrend} />
          <AccuracyChart data={subjectAccuracy} />
          <TimeAnalysis data={timeStats} />
          <WeakTopics data={weakTopics} />
        </div>
      )}
    </div>
  )
}
