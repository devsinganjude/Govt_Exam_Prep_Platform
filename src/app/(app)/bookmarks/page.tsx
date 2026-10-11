import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookmarkMinus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { removeBookmark } from './actions'

export default async function BookmarksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select(`
      id,
      note_text,
      question_id,
      questions (
        question_text,
        options,
        correct_option,
        explanation
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <h2 className="text-3xl font-bold tracking-tight">Bookmarks</h2>
      </div>
      
      {(!bookmarks || bookmarks.length === 0) ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">You have no bookmarked questions.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {bookmarks.map((bookmark) => {
            const q = bookmark.questions as unknown as { question_text: string, options: string[], correct_option: number, explanation: string | null }
            if (!q) return null
            return (
              <Card key={bookmark.id}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <CardTitle className="text-lg leading-relaxed max-w-[85%]">{q.question_text}</CardTitle>
                  <form action={async () => {
                    'use server'
                    await removeBookmark(bookmark.id)
                  }}>
                    <Button type="submit" variant="ghost" size="icon" title="Remove bookmark">
                      <BookmarkMinus className="h-5 w-5 text-destructive" />
                    </Button>
                  </form>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {q.options.map((opt: string, idx: number) => (
                      <li key={idx} className={`p-3 rounded-md border text-sm ${idx === q.correct_option ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : ''}`}>
                        {idx === q.correct_option && <span className="font-bold text-green-600 mr-2">✓</span>}
                        {opt}
                      </li>
                    ))}
                  </ul>
                  {q.explanation && (
                    <div className="bg-muted p-4 rounded-md">
                      <h4 className="font-semibold text-sm mb-1">Explanation</h4>
                      <p className="text-sm">{q.explanation}</p>
                    </div>
                  )}
                  {bookmark.note_text && (
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-md border border-yellow-200 dark:border-yellow-900">
                      <h4 className="font-semibold text-sm mb-1 text-yellow-800 dark:text-yellow-200">Your Note</h4>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">{bookmark.note_text}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
