'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartConfig = {
  accuracy: {
    label: "Accuracy (%)",
    color: "hsl(var(--primary))",
  }
} satisfies ChartConfig

export function AccuracyChart({ data }: { data: { subject: string, accuracy: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subject-wise Accuracy</CardTitle>
        <CardDescription>Your correct answer percentage across subjects</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
            <BarChart accessibilityLayer data={data} margin={{ left: 12, right: 12 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="subject" tickLine={false} tickMargin={10} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} domain={[0, 100]} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="accuracy" fill="var(--color-accuracy)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[250px] items-center justify-center text-muted-foreground">No accuracy data available</div>
        )}
      </CardContent>
    </Card>
  )
}
