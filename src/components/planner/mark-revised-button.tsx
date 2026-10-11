'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { markTopicRevised } from '@/app/(app)/planner/actions'
import { CheckCircle2, Loader2 } from 'lucide-react'

export function MarkRevisedButton({ topicId }: { topicId: string }) {
  const [loading, setLoading] = useState(false)

  const handleMarkRevised = async () => {
    try {
      setLoading(true)
      await markTopicRevised(topicId)
    } catch (err) {
      console.error(err)
      alert('Failed to mark revised')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      size="sm" 
      variant="outline" 
      onClick={handleMarkRevised} 
      disabled={loading}
      className="gap-1.5 text-xs text-emerald-600 border-emerald-600/30 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-500/30 dark:hover:bg-emerald-950/30"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <CheckCircle2 className="w-3.5 h-3.5" />
      )}
      Mark Revised
    </Button>
  )
}
