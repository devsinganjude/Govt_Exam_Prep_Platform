import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import { getSupabaseConfig } from '@/lib/supabase/config'

export async function middleware(request: NextRequest) {
  const { url, anonKey: key } = getSupabaseConfig()

  if (!url || !key) {
    return NextResponse.next({ request })
  }

  const response = await updateSession(request)

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {
          // Handled by updateSession
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const isAuthRoute = pathname === '/login' || pathname === '/signup'
  const isPublicRoute = isAuthRoute || pathname.startsWith('/auth/callback') || pathname === '/'

  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
