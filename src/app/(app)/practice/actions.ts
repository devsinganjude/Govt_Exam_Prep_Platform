'use server'

import { createClient } from '@/lib/supabase/server'

export async function getNextQuestion(topicId: string, ignoreIds: string[] = []) {
  const supabase = await createClient()
  
  let query = supabase
    .from('questions')
    .select('id, question_text, options, explanation, correct_option')
    .eq('topic_id', topicId)
    .limit(20)

  if (ignoreIds.length > 0) {
    query = query.not('id', 'in', `(${ignoreIds.join(',')})`)
  }

  const { data, error } = await query

  if (error || !data || data.length === 0) {
    return null
  }

  const q = data[Math.floor(Math.random() * data.length)]
  return q
}

export async function toggleBookmark(questionId: string, isBookmarked: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  if (isBookmarked) {
    await supabase.from('bookmarks').upsert({ user_id: user.id, question_id: questionId })
  } else {
    await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('question_id', questionId)
  }
}

export async function checkBookmarkStatus(questionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { count } = await supabase.from('bookmarks').select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('question_id', questionId)

  return count ? count > 0 : false
}

export async function recordPracticeAnswer(topicId: string, questionId: string, selectedOption: number, isCorrect: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Find or create special practice test
  const { data: topic } = await supabase.from('topics').select('name, subject_id').eq('id', topicId).single()
  if (!topic) return
  const { data: subject } = await supabase.from('subjects').select('exam_id').eq('id', topic.subject_id).single()
  if (!subject) return

  const testTitle = `Practice: ${topic.name}`

  let testId: string | null = null
  const { data: existingTest } = await supabase.from('tests').select('id').eq('user_id', user.id).eq('title', testTitle).maybeSingle()
  
  if (existingTest) {
    testId = existingTest.id
  } else {
    const { data: newTest } = await supabase.from('tests').insert({
      user_id: user.id,
      exam_id: subject.exam_id,
      title: testTitle,
      duration_min: 0,
      question_ids: []
    }).select('id').single()
    if (newTest) testId = newTest.id
  }

  if (!testId) return

  // Find or create in_progress attempt
  let attemptId: string | null = null
  const { data: existingAttempt } = await supabase.from('attempts').select('id').eq('test_id', testId).eq('status', 'in_progress').maybeSingle()
  
  if (existingAttempt) {
    attemptId = existingAttempt.id
  } else {
    const { data: newAttempt } = await supabase.from('attempts').insert({
      user_id: user.id,
      test_id: testId,
      status: 'in_progress'
    }).select('id').single()
    if (newAttempt) attemptId = newAttempt.id
  }

  if (!attemptId) return

  // Upsert the answer
  await supabase.from('attempt_answers').upsert({
    attempt_id: attemptId,
    question_id: questionId,
    selected_option: selectedOption,
    is_correct: isCorrect,
    time_spent_sec: 15 // Placeholder
  }, { onConflict: 'attempt_id,question_id' })
}
