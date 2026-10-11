'use client'
import { useState } from 'react'
import Papa from 'papaparse'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { importQuestionsAction } from './actions'

const rowSchema = z.object({
  exam: z.string().min(1),
  subject: z.string().min(1),
  topic: z.string().min(1),
  question_text: z.string().min(1),
  option_a: z.string().min(1),
  option_b: z.string().min(1),
  option_c: z.string().min(1),
  option_d: z.string().min(1),
  correct_option: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  year: z.string().optional(),
  source: z.string().optional(),
  verified: z.string().optional(),
})

export function ImportClient() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState<Record<string, string>[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    
    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setPreview((results.data as Record<string, string>[]).slice(0, 5))
      }
    })
  }

  const handleUpload = () => {
    if (!file) return
    setLoading(true)
    setMessage('')
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const parsed = z.array(rowSchema).parse(results.data)
          const count = await importQuestionsAction(parsed)
          setMessage(`Successfully imported ${count} questions!`)
        } catch (err: unknown) {
          setMessage(`Error: ${err instanceof Error ? err.message : String(err)}`)
        } finally {
          setLoading(false)
        }
      },
      error: (err: Error) => {
        setMessage(`CSV Error: ${err.message}`)
        setLoading(false)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Questions via CSV</CardTitle>
        <CardDescription>Upload a CSV file to bulk import questions into the database.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input type="file" accept=".csv" onChange={handleFileChange} className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" />
        
        {preview.length > 0 && (
          <div className="border rounded-md p-4 overflow-x-auto text-sm bg-muted/20">
            <h4 className="font-semibold mb-2">Preview (first 5 rows)</h4>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="border-b p-2">Exam</th>
                  <th className="border-b p-2">Subject</th>
                  <th className="border-b p-2">Question</th>
                  <th className="border-b p-2">Correct</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i}>
                    <td className="border-b p-2">{r.exam}</td>
                    <td className="border-b p-2">{r.subject}</td>
                    <td className="border-b p-2 truncate max-w-[200px]">{r.question_text}</td>
                    <td className="border-b p-2">{r.correct_option}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {message && (
          <div className={`p-4 rounded-md ${message.startsWith('Error') ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900' : 'bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900'}`}>
            {message}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleUpload} disabled={!file || loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Import
        </Button>
      </CardFooter>
    </Card>
  )
}
