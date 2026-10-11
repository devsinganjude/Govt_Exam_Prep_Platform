import { describe, it, expect } from 'vitest'
import { computeScoreTrend, computeSubjectAccuracy, computeWeakTopics, computeTimeAnalysis } from './analytics'

describe('Analytics Calculations', () => {
  it('computes score trend accurately', () => {
    const attempts = [
      { id: '1', score: 10, started_at: '2026-01-01', time_taken_sec: 60, tests: null },
      { id: '2', score: 15, started_at: '2026-01-02', time_taken_sec: 60, tests: null },
      { id: '3', score: null, started_at: '2026-01-03', time_taken_sec: null, tests: null }
    ]
    const trend = computeScoreTrend(attempts)
    expect(trend).toHaveLength(2)
    expect(trend[0].score).toBe(10)
    expect(trend[1].score).toBe(15)
  })

  it('computes subject accuracy accurately', () => {
    const answers = [
      {
        is_correct: true,
        time_spent_sec: 10,
        questions: { topic_id: 't1', topics: { name: 'Topic 1', subjects: { id: 's1', name: 'History' } } }
      },
      {
        is_correct: false,
        time_spent_sec: 10,
        questions: { topic_id: 't1', topics: { name: 'Topic 1', subjects: { id: 's1', name: 'History' } } }
      },
      {
        is_correct: true,
        time_spent_sec: 10,
        questions: { topic_id: 't2', topics: { name: 'Topic 2', subjects: { id: 's2', name: 'Geography' } } }
      }
    ]
    const acc = computeSubjectAccuracy(answers)
    expect(acc).toHaveLength(2)
    const hist = acc.find(a => a.subject === 'History')
    const geo = acc.find(a => a.subject === 'Geography')
    expect(hist?.accuracy).toBe(50)
    expect(geo?.accuracy).toBe(100)
  })

  it('computes weak topics filtering strictly for >= 5 attempts and < 50% accuracy', () => {
    const makeAns = (topicId: string, isCorrect: boolean) => ({
      is_correct: isCorrect,
      time_spent_sec: 10,
      questions: { topic_id: topicId, topics: { name: `Topic ${topicId}`, subjects: null } }
    })

    const answers = [
      // Topic 1: 5 attempts, 1 correct (20%) -> Weak
      makeAns('1', true),
      makeAns('1', false),
      makeAns('1', false),
      makeAns('1', false),
      makeAns('1', false),

      // Topic 2: 4 attempts, 0 correct (0%) -> Not enough attempts (< 5)
      makeAns('2', false),
      makeAns('2', false),
      makeAns('2', false),
      makeAns('2', false),

      // Topic 3: 5 attempts, 3 correct (60%) -> Above 50%
      makeAns('3', true),
      makeAns('3', true),
      makeAns('3', true),
      makeAns('3', false),
      makeAns('3', false)
    ]

    const weak = computeWeakTopics(answers)
    expect(weak).toHaveLength(1)
    expect(weak[0].id).toBe('1')
    expect(weak[0].accuracy).toBe(20)
  })

  it('computes time analysis', () => {
    const attempts = [
      {
        id: '1',
        score: 10,
        started_at: '2026-01-01',
        time_taken_sec: 60,
        tests: { title: 'Test 1', duration_min: 10, question_ids: ['1', '2'] } // Target: 600s / 2 = 300s per question
      }
    ]
    const answers = [
      { is_correct: true, time_spent_sec: 60, questions: null },
      { is_correct: false, time_spent_sec: 40, questions: null }
    ]

    const timeStats = computeTimeAnalysis(attempts, answers)
    expect(timeStats.avgTimePerQuestion).toBe(50) // (60 + 40) / 2
    expect(timeStats.targetTimePerQuestion).toBe(300)
  })
})
