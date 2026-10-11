import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CreateTestForm } from './CreateTestForm'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Clock, CheckCircle2, ChevronRight, PlayCircle } from 'lucide-react'

export default async function TestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('target_exam_id').eq('id', user.id).single()
  
  let subjects: { id: string, name: string }[] = []
  if (profile?.target_exam_id) {
    const { data } = await supabase.from('subjects').select('id, name').eq('exam_id', profile.target_exam_id).order('sort_order')
    if (data) subjects = data
  }

  const { data: attempts } = await supabase
    .from('attempts')
    .select('*, tests(title, duration_min)')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Mock Tests</h2>
      </div>

      <div className="grid md:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-6">
          <h3 className="text-xl font-semibold">Your Attempts</h3>
          
          {(!attempts || attempts.length === 0) ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                You haven&apos;t taken any tests yet. Create a custom test to start!
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {attempts.map((attempt) => {
                const test = attempt.tests as unknown as { title: string, duration_min: number }
                const isSubmitted = attempt.status === 'submitted'
                const score = attempt.score !== null ? Number(attempt.score).toFixed(2) : '--'
                
                return (
                  <Card key={attempt.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{test?.title || 'Test'}</CardTitle>
                          <CardDescription>
                            {new Date(attempt.started_at).toLocaleDateString()} • {test?.duration_min} mins
                          </CardDescription>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-semibold ${isSubmitted ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                          {isSubmitted ? 'Completed' : 'In Progress'}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex space-x-4 text-sm text-muted-foreground">
                          {isSubmitted && (
                            <div className="flex items-center font-medium text-foreground">
                              <CheckCircle2 className="w-4 h-4 mr-1 text-green-500" />
                              Score: {score}
                            </div>
                          )}
                          {isSubmitted && attempt.time_taken_sec && (
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {Math.floor(attempt.time_taken_sec / 60)}m {attempt.time_taken_sec % 60}s
                            </div>
                          )}
                        </div>
                        
                        <Link href={isSubmitted ? `/tests/${attempt.id}/result` : `/tests/${attempt.id}`}>
                          <Button variant={isSubmitted ? "outline" : "default"} size="sm">
                            {isSubmitted ? 'View Results' : 'Resume'}
                            {isSubmitted ? <ChevronRight className="w-4 h-4 ml-1" /> : <PlayCircle className="w-4 h-4 ml-1" />}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        <div>
          <CreateTestForm subjects={subjects} />
        </div>
      </div>
    </div>
  )
}
