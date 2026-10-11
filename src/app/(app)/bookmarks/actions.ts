'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function removeBookmark(bookmarkId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('bookmarks').delete().eq('id', bookmarkId).eq('user_id', user.id)
  revalidatePath('/bookmarks')
}
