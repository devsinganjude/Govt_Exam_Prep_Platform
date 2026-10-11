'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { calculateScore } from '@/lib/scoring'
import { logActivity } from '@/lib/activity'
import { revalidatePath } from 'next/cache'

export async function createCustomTest(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const profileReq = await supabase.from('profiles').select('target_exam_id').eq('id', user.id).single()
  const examId = profileReq.data?.target_exam_id
  if (!examId) throw new Error('No target exam')

  const title = formData.get('title') as string
  const subjectId = formData.get('subject_id') as string
  const numQuestions = parseInt(formData.get('num_questions') as string) || 10
  const durationMin = parseInt(formData.get('duration_min') as string) || 10

  let qQuery = supabase.from('questions').select('id, topic_id')
  
  if (subjectId && subjectId !== 'all') {
    const { data: topics } = await supabase.from('topics').select('id').eq('subject_id', subjectId)
    const topicIds = topics?.map(t => t.id) || []
    if (topicIds.length > 0) {
      qQuery = qQuery.in('topic_id', topicIds)
    } else {
      qQuery = qQuery.in('topic_id', ['00000000-0000-0000-0000-000000000000']) // force empty
    }
  }

  const { data: allQuestions } = await qQuery
  if (!allQuestions || allQuestions.length === 0) {
    throw new Error('No questions found for the selected criteria')
  }

  // Shuffle and pick
  const shuffled = allQuestions.sort(() => 0.5 - Math.random())
  const selected = shuffled.slice(0, numQuestions).map(q => q.id)

  const { data: test } = await supabase.from('tests').insert({
    user_id: user.id,
    exam_id: examId,
    title: title || 'Custom Practice Test',
    duration_min: durationMin,
    question_ids: selected
  }).select('id').single()

  if (!test) throw new Error('Failed to create test')

  // Create attempt
  const { data: attempt } = await supabase.from('attempts').insert({
    user_id: user.id,
    test_id: test.id,
    status: 'in_progress'
  }).select('id').single()

  if (!attempt) throw new Error('Failed to create attempt')

  // Create attempt_answers
  const answers = selected.map(qId => ({
    attempt_id: attempt.id,
    question_id: qId
  }))

  await supabase.from('attempt_answers').insert(answers)

  redirect(`/tests/${attempt.id}`)
}

export async function submitTestAttempt(attemptId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Get attempt
  const { data: attempt } = await supabase.from('attempts').select('*, tests(exam_id)').eq('id', attemptId).eq('user_id', user.id).single()
  if (!attempt || attempt.status === 'submitted') return

  // Get exam details
  const { data: exam } = await supabase.from('exams').select('*').eq('id', (attempt.tests as unknown as { exam_id: string }).exam_id).single()
  if (!exam) return

  // Get all answers for this attempt
  const { data: answers } = await supabase.from('attempt_answers').select('id, selected_option, question_id, questions(correct_option)').eq('attempt_id', attemptId)
  if (!answers) return

  let correctCount = 0
  let wrongCount = 0

  // Grade answers
  for (const ans of answers) {
    const q = ans.questions as unknown as { correct_option: number }
    if (ans.selected_option !== null) {
      const isCorrect = ans.selected_option === q.correct_option
      if (isCorrect) correctCount++
      else wrongCount++

      await supabase.from('attempt_answers')
        .update({ is_correct: isCorrect })
        .eq('id', ans.id)
    } else {
      await supabase.from('attempt_answers')
        .update({ is_correct: null })
        .eq('id', ans.id)
    }
  }

  const score = calculateScore(correctCount, wrongCount, exam.marks_per_question, exam.negative_marking)
  
  const timeTaken = Math.floor((Date.now() - new Date(attempt.started_at).getTime()) / 1000)

  await supabase.from('attempts').update({
    status: 'submitted',
    submitted_at: new Date().toISOString(),
    score,
    time_taken_sec: timeTaken
  }).eq('id', attemptId)

  // Log activity in background
  logActivity('test_submitted')

  revalidatePath('/tests')
  revalidatePath('/dashboard')
  redirect(`/tests/${attemptId}/result`)
}
