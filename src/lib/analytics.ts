export type AttemptData = {
  id: string
  score: number | null
  started_at: string
  time_taken_sec: number | null
  tests: {
    title: string
    duration_min: number
    question_ids: string[]
  } | null
}

export type AnswerData = {
  is_correct: boolean | null
  time_spent_sec: number
  questions: {
    topic_id: string
    topics: {
      name: string
      subjects: {
        id: string
        name: string
      } | null
    } | null
  } | null
}

export function computeScoreTrend(attempts: AttemptData[]) {
  const sorted = [...attempts]
    .filter(a => a.score !== null)
    .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime())
    .slice(-10)

  return sorted.map((a, i) => ({
    name: `Test ${i + 1}`,
    score: Number(a.score),
    date: new Date(a.started_at).toLocaleDateString()
  }))
}

export function computeSubjectAccuracy(answers: AnswerData[]) {
  const subjectStats: Record<string, { correct: number, total: number }> = {}

  answers.forEach(ans => {
    if (ans.is_correct === null) return
    const subjectName = ans.questions?.topics?.subjects?.name
    if (!subjectName) return

    if (!subjectStats[subjectName]) {
      subjectStats[subjectName] = { correct: 0, total: 0 }
    }
    
    subjectStats[subjectName].total++
    if (ans.is_correct) {
      subjectStats[subjectName].correct++
    }
  })

  return Object.entries(subjectStats).map(([subject, stats]) => ({
    subject,
    accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
  })).sort((a, b) => b.accuracy - a.accuracy)
}

export function computeWeakTopics(answers: AnswerData[]) {
  const topicStats: Record<string, { id: string, name: string, correct: number, total: number }> = {}

  answers.forEach(ans => {
    if (ans.is_correct === null) return
    const topicId = ans.questions?.topic_id
    const topicName = ans.questions?.topics?.name
    if (!topicId || !topicName) return

    if (!topicStats[topicId]) {
      topicStats[topicId] = { id: topicId, name: topicName, correct: 0, total: 0 }
    }
    
    topicStats[topicId].total++
    if (ans.is_correct) {
      topicStats[topicId].correct++
    }
  })

  return Object.values(topicStats)
    .map(stats => ({
      ...stats,
      accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
    }))
    .filter(t => t.total >= 5 && t.accuracy < 50)
    .sort((a, b) => a.accuracy - b.accuracy)
}

export function computeTimeAnalysis(attempts: AttemptData[], answers: AnswerData[]) {
  let totalDurationSec = 0
  let totalQuestionsAllocated = 0

  attempts.forEach(a => {
    if (a.tests?.duration_min && a.tests?.question_ids) {
      totalDurationSec += a.tests.duration_min * 60
      totalQuestionsAllocated += a.tests.question_ids.length
    }
  })

  let totalTimeSpentOnAnswers = 0
  let answerCount = 0

  answers.forEach(a => {
    totalTimeSpentOnAnswers += a.time_spent_sec
    answerCount++
  })

  const avgTimePerQuestion = answerCount > 0 ? totalTimeSpentOnAnswers / answerCount : 0
  const targetTimePerQuestion = totalQuestionsAllocated > 0 ? totalDurationSec / totalQuestionsAllocated : 0

  return {
    avgTimePerQuestion,
    targetTimePerQuestion,
    totalAnswers: answerCount
  }
}
