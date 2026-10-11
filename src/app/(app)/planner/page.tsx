import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarIcon, ClockIcon, FlameIcon, ArrowRightIcon } from 'lucide-react'
import { MarkRevisedButton } from '@/components/planner/mark-revised-button'
import { calculateStreak } from '@/lib/streak'
import Link from 'next/link'

interface NextTopicItem {
  topicId: string
  topicName: string
  subjectName: string
  status: string
}

interface DueTopicProgress {
  topic_id: string
  revision_stage: number
  next_revision_at: string | null
  topics: {
    id: string
    name: string
    subjects: {
      id: string
      name: string
    } | null
  } | null
}

export default async function PlannerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Fetch Profile & target exam
  const { data: profile } = await supabase
    .from('profiles')
    .select('daily_goal_hours, exam_date, target_exam_id')
    .eq('id', user.id)
    .single()

  let examName = 'No Exam Selected'
  if (profile?.target_exam_id) {
    const { data: exam } = await supabase.from('exams').select('name').eq('id', profile.target_exam_id).single()
    if (exam) examName = exam.name
  }

  // Calculate Streak
  const { data: activities } = await supabase
    .from('activity_log')
    .select('date')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  const dates = activities?.map(a => a.date) || []
  const todayStr = new Date().toISOString().split('T')[0]
  const streak = calculateStreak(dates, todayStr)

  // Fetch Due Topics
  const { data: dueProgressRaw } = await supabase
    .from('topic_progress')
    .select(`
      topic_id,
      revision_stage,
      next_revision_at,
      topics (
        id,
        name,
        subjects (
          id,
          name
        )
      )
    `)
    .eq('user_id', user.id)
    .lte('next_revision_at', new Date().toISOString())
    .order('next_revision_at', { ascending: true })

  const dueProgress = (dueProgressRaw as unknown as DueTopicProgress[]) || []

  // Fetch Next 3 Topics
  const nextTopics: NextTopicItem[] = []
  if (profile?.target_exam_id) {
    const { data: subjects } = await supabase
      .from('subjects')
      .select('id, name, sort_order, topics(id, name, sort_order)')
      .eq('exam_id', profile.target_exam_id)
      .order('sort_order', { ascending: true })

    const { data: progress } = await supabase
      .from('topic_progress')
      .select('topic_id, status')
      .eq('user_id', user.id)

    const progressMap = new Map<string, string>()
    progress?.forEach(p => {
      progressMap.set(p.topic_id, p.status)
    })

    if (subjects) {
      for (const subject of subjects) {
        if (nextTopics.length >= 3) break
        const topics = (subject.topics as { id: string; name: string; sort_order: number }[])?.sort((a, b) => a.sort_order - b.sort_order) || []
        for (const topic of topics) {
          const status = progressMap.get(topic.id) || 'not_started'
          if (status !== 'done') {
            nextTopics.push({
              topicId: topic.id,
              topicName: topic.name,
              subjectName: subject.name,
              status
            })
            if (nextTopics.length >= 3) break
          }
        }
      }
    }
  }

  // Countdown
  let daysUntilExam: number | null = null
  if (profile?.exam_date) {
    const examDate = new Date(profile.exam_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    daysUntilExam = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Today&apos;s Plan</h2>
          <p className="text-muted-foreground mt-1">Stay on track for {examName}</p>
        </div>

        <div className="flex items-center gap-4">
          {daysUntilExam !== null && daysUntilExam > 0 && (
            <div className="flex flex-col items-end">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Exam In</span>
              <span className="text-xl font-bold flex items-center gap-1">
                <CalendarIcon className="w-5 h-5 text-primary" />
                {daysUntilExam} Days
              </span>
            </div>
          )}
          
          <div className="flex flex-col items-end pl-4 border-l">
            <span className="text-xs text-muted-foreground uppercase font-semibold">Study Streak</span>
            <span className="text-xl font-bold flex items-center gap-1">
              <FlameIcon className={`w-5 h-5 ${streak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
              {streak} Days
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Goal Card */}
        <Card className="col-span-full lg:col-span-1 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-primary" />
              Daily Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{profile?.daily_goal_hours ?? 4} hrs</div>
            <p className="text-sm text-muted-foreground mt-1">Recommended daily study time</p>
          </CardContent>
        </Card>

        {/* Due Topics Card */}
        <Card className="col-span-full lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Due for Revision</CardTitle>
            <CardDescription>Topics scheduled for review based on spaced repetition</CardDescription>
          </CardHeader>
          <CardContent>
            {dueProgress.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p>No topics due for revision today.</p>
                <p className="text-sm">Keep up the good work!</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {dueProgress.map((prog) => {
                  const topic = prog.topics
                  const subject = topic?.subjects
                  
                  return (
                    <li key={prog.topic_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-3">
                      <div>
                        <div className="font-medium text-sm md:text-base">{topic?.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="font-normal text-[10px]">Stage {prog.revision_stage}</Badge>
                          <span>{subject?.name}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/practice?topic=${prog.topic_id}`}>
                          <Button size="sm" variant="outline" className="text-xs h-8">
                            Practice
                          </Button>
                        </Link>
                        <MarkRevisedButton topicId={prog.topic_id} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Next Topics Card */}
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowRightIcon className="w-5 h-5" />
              Up Next
            </CardTitle>
            <CardDescription>The next topics to study from your syllabus</CardDescription>
          </CardHeader>
          <CardContent>
            {nextTopics.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center">No more topics in the syllabus, or syllabus is empty!</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {nextTopics.map(topic => (
                  <Link href={`/practice?topic=${topic.topicId}`} key={topic.topicId}>
                    <div className="p-4 border rounded-lg hover:border-primary/50 hover:bg-muted/50 transition-colors h-full flex flex-col justify-between group">
                      <div>
                        <div className="text-xs font-semibold uppercase text-primary/80 mb-2 tracking-wider">
                          {topic.subjectName}
                        </div>
                        <h4 className="font-medium line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                          {topic.topicName}
                        </h4>
                      </div>
                      <div className="mt-4">
                        <Badge variant={topic.status === 'in_progress' ? 'default' : 'secondary'} className="text-[10px]">
                          {topic.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
