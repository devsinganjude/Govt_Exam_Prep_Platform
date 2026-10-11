export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      exams: {
        Row: {
          id: string
          name: string
          language: string
          total_marks: number
          marks_per_question: number
          negative_marking: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          language?: string
          total_marks: number
          marks_per_question?: number
          negative_marking?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          language?: string
          total_marks?: number
          marks_per_question?: number
          negative_marking?: number
          created_at?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          id: string
          exam_id: string
          name: string
          sort_order: number
        }
        Insert: {
          id?: string
          exam_id: string
          name: string
          sort_order?: number
        }
        Update: {
          id?: string
          exam_id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "subjects_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          }
        ]
      }
      topics: {
        Row: {
          id: string
          subject_id: string
          name: string
          weightage: number | null
          sort_order: number
        }
        Insert: {
          id?: string
          subject_id: string
          name: string
          weightage?: number | null
          sort_order?: number
        }
        Update: {
          id?: string
          subject_id?: string
          name?: string
          weightage?: number | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "topics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          }
        ]
      }
      questions: {
        Row: {
          id: string
          topic_id: string
          question_text: string
          options: Json
          correct_option: number
          explanation: string | null
          difficulty: 'easy' | 'medium' | 'hard'
          year: number | null
          source: string | null
          verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          topic_id: string
          question_text: string
          options: Json
          correct_option: number
          explanation?: string | null
          difficulty?: 'easy' | 'medium' | 'hard'
          year?: number | null
          source?: string | null
          verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          topic_id?: string
          question_text?: string
          options?: Json
          correct_option?: number
          explanation?: string | null
          difficulty?: 'easy' | 'medium' | 'hard'
          year?: number | null
          source?: string | null
          verified?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          display_name: string | null
          target_exam_id: string | null
          daily_goal_hours: number
          exam_date: string | null
          created_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          target_exam_id?: string | null
          daily_goal_hours?: number
          exam_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          target_exam_id?: string | null
          daily_goal_hours?: number
          exam_date?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_target_exam_id_fkey"
            columns: ["target_exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          }
        ]
      }
      topic_progress: {
        Row: {
          id: string
          user_id: string
          topic_id: string
          status: 'not_started' | 'in_progress' | 'done'
          revision_stage: number
          last_revised_at: string | null
          next_revision_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          topic_id: string
          status?: 'not_started' | 'in_progress' | 'done'
          revision_stage?: number
          last_revised_at?: string | null
          next_revision_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          topic_id?: string
          status?: 'not_started' | 'in_progress' | 'done'
          revision_stage?: number
          last_revised_at?: string | null
          next_revision_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topic_progress_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          }
        ]
      }
      tests: {
        Row: {
          id: string
          user_id: string | null
          exam_id: string
          title: string
          duration_min: number
          question_ids: string[]
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          exam_id: string
          title: string
          duration_min: number
          question_ids: string[]
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          exam_id?: string
          title?: string
          duration_min?: number
          question_ids?: string[]
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tests_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          }
        ]
      }
      attempts: {
        Row: {
          id: string
          user_id: string
          test_id: string
          started_at: string
          submitted_at: string | null
          score: number | null
          time_taken_sec: number | null
          status: 'in_progress' | 'submitted'
        }
        Insert: {
          id?: string
          user_id: string
          test_id: string
          started_at?: string
          submitted_at?: string | null
          score?: number | null
          time_taken_sec?: number | null
          status?: 'in_progress' | 'submitted'
        }
        Update: {
          id?: string
          user_id?: string
          test_id?: string
          started_at?: string
          submitted_at?: string | null
          score?: number | null
          time_taken_sec?: number | null
          status?: 'in_progress' | 'submitted'
        }
        Relationships: [
          {
            foreignKeyName: "attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          }
        ]
      }
      attempt_answers: {
        Row: {
          id: string
          attempt_id: string
          question_id: string
          selected_option: number | null
          marked_for_review: boolean
          time_spent_sec: number
          is_correct: boolean | null
        }
        Insert: {
          id?: string
          attempt_id: string
          question_id: string
          selected_option?: number | null
          marked_for_review?: boolean
          time_spent_sec?: number
          is_correct?: boolean | null
        }
        Update: {
          id?: string
          attempt_id?: string
          question_id?: string
          selected_option?: number | null
          marked_for_review?: boolean
          time_spent_sec?: number
          is_correct?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          }
        ]
      }
      bookmarks: {
        Row: {
          id: string
          user_id: string
          question_id: string
          note_text: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          question_id: string
          note_text?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          question_id?: string
          note_text?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          }
        ]
      }
      activity_log: {
        Row: {
          id: string
          user_id: string
          date: string
          type: 'topic_status_change' | 'practice_question' | 'test_submitted'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          type: 'topic_status_change' | 'practice_question' | 'test_submitted'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          type?: 'topic_status_change' | 'practice_question' | 'test_submitted'
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
