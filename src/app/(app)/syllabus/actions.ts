'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getInitialRevisionData } from '@/lib/spaced-repetition'
import { logActivity } from '@/lib/activity'

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

  const updateData: { status: string; revision_stage?: number; next_revision_at?: string | null } = { status }

  if (status === 'done' && (!current || current.status !== 'done')) {
    const { revision_stage, next_revision_at } = getInitialRevisionData()
    updateData.revision_stage = revision_stage
    updateData.next_revision_at = next_revision_at.toISOString()
  } else if (status !== 'done' && current?.status === 'done') {
    updateData.next_revision_at = null
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

  // Log activity in background
  logActivity('topic_status_change')

  revalidatePath('/syllabus')
  revalidatePath('/dashboard')
  revalidatePath('/planner')
}

