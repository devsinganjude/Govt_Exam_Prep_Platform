'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const target_exam_id = formData.get('target_exam_id') as string
  const daily_goal_hours = parseInt(formData.get('daily_goal_hours') as string, 10)
  const exam_date = formData.get('exam_date') as string

  await supabase
    .from('profiles')
    .update({
      target_exam_id,
      daily_goal_hours,
      exam_date: exam_date || null
    })
    .eq('id', user.id)

  redirect('/dashboard')
}
