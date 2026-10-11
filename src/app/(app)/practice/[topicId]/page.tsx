import { createClient } from '@/lib/supabase/server'
import { PracticeClient } from './PracticeClient'
import { notFound } from 'next/navigation'

export default async function PracticeTopicPage({ params }: { params: { topicId: string } }) {
  const supabase = await createClient()
  
  const { data: topic } = await supabase
    .from('topics')
    .select('id, name')
    .eq('id', params.topicId)
    .single()

  if (!topic) {
    notFound()
  }

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 max-w-3xl mx-auto w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Practice: {topic.name}</h2>
      </div>
      <PracticeClient topicId={topic.id} />
    </div>
  )
}
