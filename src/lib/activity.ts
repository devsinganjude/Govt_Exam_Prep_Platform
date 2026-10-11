import { createClient } from './supabase/server'

export async function logActivity(type: 'topic_status_change' | 'practice_question' | 'test_submitted') {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const todayStr = new Date().toISOString().split('T')[0]

    await supabase.from('activity_log').upsert(
      {
        user_id: user.id,
        date: todayStr,
        type,
      },
      { onConflict: 'user_id,date,type', ignoreDuplicates: true }
    )
  } catch (err) {
    console.error('Failed to log activity', err)
  }
}
