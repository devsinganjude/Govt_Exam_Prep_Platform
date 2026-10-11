import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { TopicItem } from './TopicItem'

export default async function SyllabusPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get user's target exam
  const { data: profile } = await supabase
    .from('profiles')
    .select('target_exam_id')
    .eq('id', user.id)
    .single()

  if (!profile?.target_exam_id) {
    return (
      <div className="p-4 md:p-8 pt-6">
        <p>Please select a target exam in your profile.</p>
      </div>
    )
  }

  // Get subjects and topics for this exam
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name, sort_order, topics(id, name, weightage, sort_order)')
    .eq('exam_id', profile.target_exam_id)
    .order('sort_order')

  // Get user's topic progress
  const { data: progress } = await supabase
    .from('topic_progress')
    .select('topic_id, status')
    .eq('user_id', user.id)

  const progressMap = new Map()
  progress?.forEach(p => {
    progressMap.set(p.topic_id, p.status)
  })

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Syllabus</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exam Syllabus</CardTitle>
          <CardDescription>
            All subjects and topics for your target exam.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subjects && subjects.length > 0 ? (
            <Accordion className="w-full">
              {subjects.map((subject) => {
                const topics = (subject.topics as { id: string, name: string, weightage: number | null, sort_order: number }[]) || []
                
                // Calculate progress
                const totalTopics = topics.length
                const completedTopics = topics.filter(t => progressMap.get(t.id) === 'done').length
                
                return (
                  <AccordionItem key={subject.id} value={subject.id}>
                    <AccordionTrigger className="text-sm md:text-lg font-semibold hover:no-underline">
                      <div className="flex w-full items-center justify-between pr-4">
                        <span>{subject.name}</span>
                        <span className="text-xs md:text-sm font-normal text-muted-foreground bg-muted px-2 py-1 rounded-full">
                          {completedTopics} / {totalTopics}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2 pt-2">
                        {topics
                          .sort((a, b) => a.sort_order - b.sort_order)
                          .map((topic) => (
                            <TopicItem 
                              key={topic.id} 
                              topic={topic} 
                              initialStatus={progressMap.get(topic.id) || 'not_started'} 
                            />
                        ))}
                        {topics.length === 0 && (
                          <p className="text-sm text-muted-foreground italic p-2">No topics defined for this subject.</p>
                        )}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          ) : (
            <p className="text-muted-foreground">No syllabus data found for this exam.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
