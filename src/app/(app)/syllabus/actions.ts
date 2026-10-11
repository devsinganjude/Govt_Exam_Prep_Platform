'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const REVISION_INTERVALS_DAYS = [1, 3, 7, 21, 60]

export async function updateTopicStatus(topicId: string, status: 'not_started' | 'in_progress' | 'done') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: current } = await supabase
    .from('topic_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('topic_id', topicId)
    .maybeSingle()

  const updateData: { status: string; revision_stage?: number; next_revision_at?: string } = { status }

  if (status === 'done' && (!current || current.status !== 'done')) {
    const nextDate = new Date()
    nextDate.setDate(nextDate.getDate() + REVISION_INTERVALS_DAYS[0])
    updateData.revision_stage = 0
    updateData.next_revision_at = nextDate.toISOString()
  }

  const { error } = await supabase
    .from('topic_progress')
    .upsert(
      {
        user_id: user.id,
        topic_id: topicId,
        ...updateData
      },
      { onConflict: 'user_id,topic_id' }
    )

  if (error) {
    console.error(error)
    throw new Error('Failed to update progress')
  }

  revalidatePath('/syllabus')
  revalidatePath('/dashboard')
}
