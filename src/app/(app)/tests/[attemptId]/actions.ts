'use server'
import { createClient } from '@/lib/supabase/server'

export async function updateAnswer(answerId: string, selectedOption: number | null, markedForReview: boolean, timeSpentSec: number) {
  const supabase = await createClient()
  await supabase.from('attempt_answers').update({
    selected_option: selectedOption,
    marked_for_review: markedForReview,
    time_spent_sec: timeSpentSec
  }).eq('id', answerId)
}
