import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { completeOnboarding } from '../actions'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: exams } = await supabase.from('exams').select('id, name').order('name')

  return (
    <div className="flex h-screen w-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome</CardTitle>
          <CardDescription>
            Let&apos;s set up your profile to personalize your experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={completeOnboarding} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="target_exam_id">Target Exam</Label>
              <Select name="target_exam_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select an exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams?.map(exam => (
                    <SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="daily_goal_hours">Daily Goal (Hours)</Label>
              <Input
                id="daily_goal_hours"
                type="number"
                name="daily_goal_hours"
                min="1"
                max="24"
                defaultValue="4"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="exam_date">Exam Date (Optional)</Label>
              <Input
                id="exam_date"
                type="date"
                name="exam_date"
              />
            </div>
            
            <Button type="submit" className="w-full mt-4">
              Complete Setup
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
