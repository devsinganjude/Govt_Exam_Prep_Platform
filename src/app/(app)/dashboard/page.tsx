import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BookOpen, Target, Clock, Trophy } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, daily_goal_hours, target_exam_id')
    .eq('id', user.id)
    .single()

  let examName = 'No exam selected'
  let syllabusCompletion = 0
  const subjectProgress: { name: string, percent: number }[] = []

  if (profile?.target_exam_id) {
    const { data: exam } = await supabase
      .from('exams')
      .select('name')
      .eq('id', profile.target_exam_id)
      .single()
    if (exam) examName = exam.name

    const { data: subjects } = await supabase
      .from('subjects')
      .select('id, name, topics(id)')
      .eq('exam_id', profile.target_exam_id)

    const { data: completedProgress } = await supabase
      .from('topic_progress')
      .select('topic_id')
      .eq('user_id', user.id)
      .eq('status', 'done')

    const doneTopicIds = new Set(completedProgress?.map(p => p.topic_id))

    let totalTopicsCount = 0
    let totalDoneCount = 0

    if (subjects) {
      for (const subject of subjects) {
        const topics = (subject.topics as { id: string }[]) || []
        const sTotal = topics.length
        if (sTotal === 0) continue

        const sDone = topics.filter(t => doneTopicIds.has(t.id)).length
        totalTopicsCount += sTotal
        totalDoneCount += sDone

        subjectProgress.push({
          name: subject.name,
          percent: Math.round((sDone / sTotal) * 100)
        })
      }
    }

    if (totalTopicsCount > 0) {
      syllabusCompletion = Math.round((totalDoneCount / totalTopicsCount) * 100)
    }
  }

  const { count: testsTaken } = await supabase
    .from('attempts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: topicsInProgress } = await supabase
    .from('topic_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .neq('status', 'not_started')

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'User'

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Welcome back, {displayName} 👋</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Target Exam</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{examName}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Goal</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.daily_goal_hours || 4} Hours</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Topics Started</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topicsInProgress || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests Taken</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testsTaken || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Syllabus Completion</CardTitle>
            <CardDescription>Overall progress across all subjects.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-xl">Overall</span>
                <span className="font-bold">{syllabusCompletion}%</span>
              </div>
              <Progress value={syllabusCompletion} className="h-3" />
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium leading-none">Subject breakdown</h4>
              {subjectProgress.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {subjectProgress.map(subj => (
                    <div key={subj.name} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span>{subj.name}</span>
                        <span className="text-muted-foreground">{subj.percent}%</span>
                      </div>
                      <Progress value={subj.percent} className="h-1.5" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No subjects found.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest study sessions.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No recent activity. Start practicing to see your progress here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
