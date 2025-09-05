import { createClient } from '@/lib/supabase/client'
import type { Assessment as DbAssessment, Inserts as AssessmentInsert, Updates as AssessmentUpdate } from '@/lib/supabase/types'

export interface FixtureData {
  id: string
  name: string
  brand: string
  model: string
  size?: string
  material?: string
  color?: string
  condition: 'excellent' | 'good' | 'fair' | 'poor'
  notes?: string
}

export interface AssessmentData {
  id?: string
  projectId: string // Required - every assessment must be tied to a project
  roomType: string // Now dynamic - references room_types.name
  roomName: string
  fixtures: FixtureData[]
  measurements: {
    width: number
    length: number
    height: number
    notes?: string
  }
  photos: string[]
  notes?: string
  status: 'draft' | 'submitted' | 'reviewed'
  createdAt?: string
  updatedAt?: string
  userId?: string
}

export interface AssessmentError {
  message: string
  code?: string
}

class AssessmentService {
  private supabase = createClient()

  // Save assessment draft to database
  async saveDraft(assessment: AssessmentData): Promise<{ success: boolean; error: AssessmentError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { success: false, error: { message: 'User not authenticated' } }
      }

      const assessmentData: AssessmentInsert<'assessments'> = {
        project_id: assessment.projectId,
        user_id: user.id,
        room_type: assessment.roomType,
        room_name: assessment.roomName,
        fixtures: assessment.fixtures as any,
        measurements: assessment.measurements as any,
        photos: assessment.photos,
        notes: assessment.notes,
        status: assessment.status || 'draft'
      }

      if (assessment.id) {
        // Update existing assessment
        const { error } = await this.supabase
          .from('assessments')
          .update(assessmentData)
          .eq('id', assessment.id)

        if (error) {
          return {
            success: false,
            error: { message: error.message, code: error.code }
          }
        }
      } else {
        // Create new assessment
        const { error } = await this.supabase
          .from('assessments')
          .insert(assessmentData)

        if (error) {
          return {
            success: false,
            error: { message: error.message, code: error.code }
          }
        }
      }
      
      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error: { message: 'Failed to save assessment draft' }
      }
    }
  }

  // Get all assessment drafts for the current user
  async getDrafts(): Promise<{ assessments: AssessmentData[]; error: AssessmentError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { assessments: [], error: { message: 'User not authenticated' } }
      }

      const { data, error } = await this.supabase
        .from('assessments')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .order('created_at', { ascending: false })

      if (error) {
        return {
          assessments: [],
          error: { message: error.message, code: error.code }
        }
      }

      const assessments = data.map(this.mapDbAssessmentToAssessment)
      return { assessments, error: null }
    } catch (error) {
      return {
        assessments: [],
        error: { message: 'Failed to fetch assessment drafts' }
      }
    }
  }

  // Get a specific assessment by ID
  async getAssessment(id: string): Promise<{ assessment: AssessmentData | null; error: AssessmentError | null }> {
    try {
      const { data, error } = await this.supabase
        .from('assessments')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        return {
          assessment: null,
          error: { message: error.message, code: error.code }
        }
      }

      const assessment = this.mapDbAssessmentToAssessment(data)
      return { assessment, error: null }
    } catch (error) {
      return {
        assessment: null,
        error: { message: 'Failed to fetch assessment' }
      }
    }
  }

  // Get assessments by project
  async getAssessmentsByProject(projectId: string): Promise<{ assessments: AssessmentData[]; error: AssessmentError | null }> {
    try {
      const { data, error } = await this.supabase
        .from('assessments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) {
        return {
          assessments: [],
          error: { message: error.message, code: error.code }
        }
      }

      const assessments = data.map(this.mapDbAssessmentToAssessment)
      return { assessments, error: null }
    } catch (error) {
      return {
        assessments: [],
        error: { message: 'Failed to fetch project assessments' }
      }
    }
  }

  // Delete an assessment
  async deleteAssessment(id: string): Promise<{ success: boolean; error: AssessmentError | null }> {
    try {
      const { error } = await this.supabase
        .from('assessments')
        .delete()
        .eq('id', id)

      if (error) {
        return {
          success: false,
          error: { message: error.message, code: error.code }
        }
      }
      
      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error: { message: 'Failed to delete assessment' }
      }
    }
  }

  // Submit assessment (change status to submitted)
  async submitAssessment(id: string): Promise<{ success: boolean; error: AssessmentError | null }> {
    try {
      const { error } = await this.supabase
        .from('assessments')
        .update({ status: 'submitted' })
        .eq('id', id)

      if (error) {
        return {
          success: false,
          error: { message: error.message, code: error.code }
        }
      }
      
      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error: { message: 'Failed to submit assessment' }
      }
    }
  }

  // Sync offline drafts when back online
  async syncOfflineDrafts(): Promise<{ success: boolean; error: AssessmentError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { success: false, error: { message: 'User not authenticated' } }
      }

      // Get offline drafts from localStorage (fallback)
      const offlineDrafts = this.getOfflineDrafts()
      
      for (const draft of offlineDrafts) {
        const result = await this.saveDraft(draft)
        if (!result.success) {
          return result
        }
      }

      // Clear offline drafts after successful sync
      this.clearOfflineDrafts()
      
      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error: { message: 'Failed to sync offline drafts' }
      }
    }
  }

  // Get assessment statistics
  async getAssessmentStats(): Promise<{ stats: { totalDrafts: number; completedAssessments: number; pendingAssessments: number }; error: AssessmentError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { 
          stats: { totalDrafts: 0, completedAssessments: 0, pendingAssessments: 0 },
          error: { message: 'User not authenticated' }
        }
      }

      const { data, error } = await this.supabase
        .from('assessments')
        .select('*')
        .eq('user_id', user.id)

      if (error) {
        return {
          stats: { totalDrafts: 0, completedAssessments: 0, pendingAssessments: 0 },
          error: { message: error.message, code: error.code }
        }
      }

      const totalDrafts = data.filter((a: DbAssessment) => a.status === 'draft').length
      const completedAssessments = data.filter((a: DbAssessment) => a.status === 'reviewed').length
      const pendingAssessments = data.filter((a: DbAssessment) => a.status === 'submitted').length

      return { 
        stats: { totalDrafts, completedAssessments, pendingAssessments }, 
        error: null 
      }
    } catch (error) {
      return {
        stats: { totalDrafts: 0, completedAssessments: 0, pendingAssessments: 0 },
        error: { message: 'Failed to get assessment statistics' }
      }
    }
  }

  // Export assessment data
  exportAssessment(assessment: AssessmentData): string {
    return JSON.stringify(assessment, null, 2)
  }

  // Import assessment data
  importAssessment(data: string): AssessmentData | null {
    try {
      return JSON.parse(data)
    } catch (error) {
      console.error('Error parsing assessment data:', error)
      return null
    }
  }

  // Offline fallback methods
  private getOfflineDrafts(): AssessmentData[] {
    try {
      const drafts = localStorage.getItem('assessment_drafts')
      return drafts ? JSON.parse(drafts) : []
    } catch (error) {
      console.error('Error reading offline drafts:', error)
      return []
    }
  }

  private clearOfflineDrafts(): void {
    try {
      localStorage.removeItem('assessment_drafts')
    } catch (error) {
      console.error('Error clearing offline drafts:', error)
    }
  }

  // Map database assessment to application assessment
  private mapDbAssessmentToAssessment(dbAssessment: DbAssessment): AssessmentData {
    return {
      id: dbAssessment.id,
      projectId: dbAssessment.project_id,
      roomType: dbAssessment.room_type,
      roomName: dbAssessment.room_name,
      fixtures: dbAssessment.fixtures as unknown as FixtureData[],
      measurements: dbAssessment.measurements as {
        width: number
        length: number
        height: number
        notes?: string
      },
      photos: dbAssessment.photos || [],
      notes: dbAssessment.notes || undefined,
      status: dbAssessment.status,
      createdAt: dbAssessment.created_at,
      updatedAt: dbAssessment.updated_at,
      userId: dbAssessment.user_id
    }
  }
}

export const assessmentService = new AssessmentService()
