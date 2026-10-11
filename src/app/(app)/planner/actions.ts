'use server'

import { createClient } from '@/lib/supabase/server'
import { getNextRevisionData } from '@/lib/spaced-repetition'
import { logActivity } from '@/lib/activity'
import { revalidatePath } from 'next/cache'

export async function markTopicRevised(topicId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: progress } = await supabase
    .from('topic_progress')
    .select('revision_stage')
    .eq('user_id', user.id)
    .eq('topic_id', topicId)
    .maybeSingle()

  const currentStage = progress ? progress.revision_stage : null
  const { revision_stage, next_revision_at } = getNextRevisionData(currentStage)

  const { error } = await supabase
    .from('topic_progress')
    .update({
      revision_stage,
      last_revised_at: new Date().toISOString(),
      next_revision_at: next_revision_at.toISOString(),
    })
    .eq('user_id', user.id)
    .eq('topic_id', topicId)

  if (error) {
    console.error('Failed to mark topic revised', error)
    throw new Error('Could not mark topic as revised')
  }

  // Also count revision as an activity!
  logActivity('topic_status_change')

  revalidatePath('/planner')
  revalidatePath('/dashboard')
}
