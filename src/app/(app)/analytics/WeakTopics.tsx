'use client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function WeakTopics({ data }: { data: { id: string, name: string, accuracy: number, total: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weak Topics</CardTitle>
        <CardDescription>Topics below 50% accuracy (min 5 attempts)</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="space-y-4">
            {data.map(topic => (
              <div key={topic.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-semibold">{topic.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {topic.accuracy.toFixed(1)}% accuracy ({topic.total} questions)
                  </div>
                </div>
                <Link href={`/practice/${topic.id}`}>
                  <Button variant="outline" size="sm">Practice</Button>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">Great job! No weak topics identified yet.</div>
        )}
      </CardContent>
    </Card>
  )
}
