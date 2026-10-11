'use client'

import { useState, useTransition } from 'react'
import { updateTopicStatus } from './actions'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

export function TopicItem({ 
  topic, 
  initialStatus 
}: { 
  topic: { id: string, name: string, weightage: number | null },
  initialStatus: 'not_started' | 'in_progress' | 'done'
}) {
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState(initialStatus)

  const handleStatusChange = (newStatus: 'not_started' | 'in_progress' | 'done' | null) => {
    if (!newStatus) return
    const prevStatus = status
    setStatus(newStatus)
    startTransition(async () => {
      try {
        await updateTopicStatus(topic.id, newStatus)
      } catch {
        setStatus(prevStatus) // rollback on error
      }
    })
  }

  return (
    <li className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3 rounded-md border bg-card text-card-foreground shadow-sm">
      <span className="font-medium text-sm sm:text-base">{topic.name}</span>
      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
        {topic.weightage && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">{topic.weightage}% weight</span>
        )}
        <div className="flex items-center gap-2 shrink-0">
          {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <Select 
            value={status} 
            onValueChange={handleStatusChange} 
            disabled={isPending}
          >
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not_started">Not Started</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </li>
  )
}
