'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createCustomTest } from './actions'
import { Loader2 } from 'lucide-react'

export function CreateTestForm({ subjects }: { subjects: { id: string, name: string }[] }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    try {
      await createCustomTest(formData)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Custom Test</CardTitle>
        <CardDescription>Configure a new mock test based on your preferences.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && <div className="text-red-500 text-sm">{error}</div>}
          
          <div className="space-y-2">
            <Label htmlFor="title">Test Title</Label>
            <Input id="title" name="title" defaultValue="Custom Practice Test" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject_id">Subject</Label>
            <Select name="subject_id" defaultValue="all">
              <SelectTrigger>
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects (Full Mock)</SelectItem>
                {subjects.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="num_questions">Questions</Label>
              <Input id="num_questions" name="num_questions" type="number" defaultValue="10" min="1" max="100" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration_min">Duration (mins)</Label>
              <Input id="duration_min" name="duration_min" type="number" defaultValue="15" min="1" max="180" required />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Start Test
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
