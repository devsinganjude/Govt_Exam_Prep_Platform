'use server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function importQuestionsAction(rows: Record<string, string>[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const adminEmail = process.env.ADMIN_EMAIL
  if (!user || !adminEmail || user.email !== adminEmail) {
    throw new Error('Unauthorized')
  }

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let successCount = 0

  for (const row of rows) {
    // 1. Get or create Exam
    let { data: exam } = await supabaseAdmin.from('exams').select('id').eq('name', row.exam).maybeSingle()
    if (!exam) {
      const { data: newExam } = await supabaseAdmin.from('exams').insert({ name: row.exam, total_marks: 100 }).select('id').single()
      if (!newExam) throw new Error('Failed to create exam')
      exam = newExam
    }
    
    // 2. Get or create Subject
    let { data: subject } = await supabaseAdmin.from('subjects').select('id').eq('exam_id', exam.id).eq('name', row.subject).maybeSingle()
    if (!subject) {
      const { data: newSubject } = await supabaseAdmin.from('subjects').insert({ exam_id: exam.id, name: row.subject }).select('id').single()
      if (!newSubject) throw new Error('Failed to create subject')
      subject = newSubject
    }
    
    // 3. Get or create Topic
    let { data: topic } = await supabaseAdmin.from('topics').select('id').eq('subject_id', subject.id).eq('name', row.topic).maybeSingle()
    if (!topic) {
      const { data: newTopic } = await supabaseAdmin.from('topics').insert({ subject_id: subject.id, name: row.topic }).select('id').single()
      if (!newTopic) throw new Error('Failed to create topic')
      topic = newTopic
    }

    // 4. Insert Question
    const options = [row.option_a, row.option_b, row.option_c, row.option_d]
    let correctIdx = 0
    if (row.correct_option === 'B') correctIdx = 1
    if (row.correct_option === 'C') correctIdx = 2
    if (row.correct_option === 'D') correctIdx = 3
    
    const { error } = await supabaseAdmin.from('questions').insert({
      topic_id: topic.id,
      question_text: row.question_text,
      options: options,
      correct_option: correctIdx,
      explanation: row.explanation || null,
      difficulty: row.difficulty?.toLowerCase() || 'medium',
      year: parseInt(row.year) || null,
      source: row.source || null,
      verified: row.verified === 'true' || row.verified === '1'
    })
    
    if (error) {
      console.error('Failed to insert question:', error, row)
      throw new Error(`Failed to insert question: ${row.question_text}`)
    }
    successCount++
  }

  revalidatePath('/practice')
  revalidatePath('/syllabus')
  return successCount
}
