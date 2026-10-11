import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'


export default async function AppLayout({
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
    
  if (!profile?.target_exam_id) {
    redirect('/onboarding')
  }

  return <AppShell>{children}</AppShell>
}
