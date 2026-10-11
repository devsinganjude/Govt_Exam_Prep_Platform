'use client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock } from 'lucide-react'

export function TimeAnalysis({ data }: { data: { avgTimePerQuestion: number, targetTimePerQuestion: number, totalAnswers: number } }) {
  const isOver = data.avgTimePerQuestion > data.targetTimePerQuestion

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Analysis</CardTitle>
        <CardDescription>Average time spent per question</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none">Average Time</p>
            <p className="text-2xl font-bold">{data.avgTimePerQuestion.toFixed(1)}s</p>
          </div>
          <div className="p-3 bg-primary/10 rounded-full">
            <Clock className="w-6 h-6 text-primary" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Target Time</span>
            <span className="font-medium">{data.targetTimePerQuestion.toFixed(1)}s</span>
          </div>
          
          {data.targetTimePerQuestion > 0 && (
            <div className={`text-sm ${isOver ? 'text-red-500' : 'text-green-500'} font-medium`}>
              {isOver ? (
                <>You are spending {(data.avgTimePerQuestion - data.targetTimePerQuestion).toFixed(1)}s more than the target.</>
              ) : (
                <>You are spending {(data.targetTimePerQuestion - data.avgTimePerQuestion).toFixed(1)}s less than the target.</>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
