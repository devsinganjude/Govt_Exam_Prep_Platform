'use client'

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartConfig = {
  score: {
    label: "Score",
    color: "hsl(var(--primary))",
  }
} satisfies ChartConfig

export function TrendChart({ data }: { data: { name: string, score: number, date: string }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Score Trend</CardTitle>
        <CardDescription>Your scores over the last 10 attempts</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
            <LineChart accessibilityLayer data={data} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Line dataKey="score" type="monotone" stroke="var(--color-score)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[250px] items-center justify-center text-muted-foreground">No trend data available</div>
        )}
      </CardContent>
    </Card>
  )
}
