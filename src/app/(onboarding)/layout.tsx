import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('target_exam_id')
    .eq('id', user.id)
    .single()
    
  if (profile?.target_exam_id) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
