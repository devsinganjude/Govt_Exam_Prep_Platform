export function getSupabaseConfig() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const url = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  return { url, anonKey, serviceRoleKey }
}
