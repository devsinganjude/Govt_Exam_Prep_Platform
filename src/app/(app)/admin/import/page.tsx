import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ImportClient } from './ImportClient'

export default async function AdminImportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect('/dashboard')
  }

  return (
    <div className="flex-1 p-4 md:p-8 pt-6 max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Admin</h2>
      </div>
      <ImportClient />
    </div>
  )
}
