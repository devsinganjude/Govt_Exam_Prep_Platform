import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PlayCircle } from 'lucide-react'

export default async function PracticePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

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

  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name, sort_order, topics(id, name, sort_order)')
    .eq('exam_id', profile.target_exam_id)
    .order('sort_order')

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Practice</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select a Topic to Practice</CardTitle>
          <CardDescription>
            Choose a topic to start practicing questions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subjects && subjects.length > 0 ? (
            <Accordion className="w-full">
              {subjects.map((subject) => {
                const topics = (subject.topics as { id: string, name: string, sort_order: number }[]) || []
                
                return (
                  <AccordionItem key={subject.id} value={subject.id}>
                    <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                      {subject.name}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-2 pt-2 md:grid-cols-2">
                        {topics
                          .sort((a, b) => a.sort_order - b.sort_order)
                          .map((topic) => (
                            <Link key={topic.id} href={`/practice/${topic.id}`} className="block h-full">
                              <div className="flex items-center justify-between p-4 rounded-md border bg-card hover:bg-muted/50 transition-colors shadow-sm h-full">
                                <span className="font-medium text-sm md:text-base">{topic.name}</span>
                                <Button size="icon" variant="ghost" className="shrink-0" tabIndex={-1}>
                                  <PlayCircle className="h-5 w-5 text-primary" />
                                </Button>
                              </div>
                            </Link>
                        ))}
                        {topics.length === 0 && (
                          <p className="text-sm text-muted-foreground italic p-2 col-span-2">No topics defined for this subject.</p>
                        )}
                      </div>
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
