import { supabase } from '@/lib/supabase/client'

export interface JobWorkItem {
  id: string
  projectId: string
  roomType: string
  workDescription: string
  estimatedHours?: number
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
}

export interface CreateJobWorkItemData {
  projectId: string
  roomType: string
  workDescription: string
  estimatedHours?: number
  priority?: 'low' | 'medium' | 'high'
}

export interface UpdateJobWorkItemData {
  roomType?: string
  workDescription?: string
  estimatedHours?: number
  priority?: 'low' | 'medium' | 'high'
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
}

export interface JobWorkError {
  message: string
  code?: string
}

class JobWorkService {
  private supabase = supabase

  async getWorkItemsByProject(projectId: string): Promise<{ data: JobWorkItem[] | null; error: JobWorkError | null }> {
    try {
      const { data, error } = await this.supabase
        .from('job_work_items')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

      if (error) {
        return { data: null, error: { message: error.message, code: error.code } }
      }

      const workItems: JobWorkItem[] = data.map(item => ({
        id: item.id,
        projectId: item.project_id,
        roomType: item.room_type,
        workDescription: item.work_description,
        estimatedHours: item.estimated_hours,
        priority: item.priority,
        status: item.status,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }))

      return { data: workItems, error: null }
    } catch (error) {
      return { data: null, error: { message: 'Failed to fetch work items' } }
    }
  }

  async createWorkItem(workItemData: CreateJobWorkItemData): Promise<{ data: JobWorkItem | null; error: JobWorkError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } }
      }

      const { data, error } = await this.supabase
        .from('job_work_items')
        .insert({
          project_id: workItemData.projectId,
          room_type: workItemData.roomType,
          work_description: workItemData.workDescription,
          estimated_hours: workItemData.estimatedHours,
          priority: workItemData.priority || 'medium'
        })
        .select()
        .single()

      if (error) {
        return { data: null, error: { message: error.message, code: error.code } }
      }

      const workItem: JobWorkItem = {
        id: data.id,
        projectId: data.project_id,
        roomType: data.room_type,
        workDescription: data.work_description,
        estimatedHours: data.estimated_hours,
        priority: data.priority,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }

      return { data: workItem, error: null }
    } catch (error) {
      return { data: null, error: { message: 'Failed to create work item' } }
    }
  }

  async updateWorkItem(workItemId: string, updates: UpdateJobWorkItemData): Promise<{ success: boolean; error: JobWorkError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { success: false, error: { message: 'User not authenticated' } }
      }

      const updateData: any = {}
      if (updates.roomType !== undefined) updateData.room_type = updates.roomType
      if (updates.workDescription !== undefined) updateData.work_description = updates.workDescription
      if (updates.estimatedHours !== undefined) updateData.estimated_hours = updates.estimatedHours
      if (updates.priority !== undefined) updateData.priority = updates.priority
      if (updates.status !== undefined) updateData.status = updates.status

      const { error } = await this.supabase
        .from('job_work_items')
        .update(updateData)
        .eq('id', workItemId)

      if (error) {
        return { success: false, error: { message: error.message, code: error.code } }
      }

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: { message: 'Failed to update work item' } }
    }
  }

  async deleteWorkItem(workItemId: string): Promise<{ success: boolean; error: JobWorkError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { success: false, error: { message: 'User not authenticated' } }
      }

      const { error } = await this.supabase
        .from('job_work_items')
        .delete()
        .eq('id', workItemId)

      if (error) {
        return { success: false, error: { message: error.message, code: error.code } }
      }

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: { message: 'Failed to delete work item' } }
    }
  }

  async getWorkItemsByRoom(projectId: string, roomType: string): Promise<{ data: JobWorkItem[] | null; error: JobWorkError | null }> {
    try {
      const { data, error } = await this.supabase
        .from('job_work_items')
        .select('*')
        .eq('project_id', projectId)
        .eq('room_type', roomType)
        .order('created_at', { ascending: true })

      if (error) {
        return { data: null, error: { message: error.message, code: error.code } }
      }

      const workItems: JobWorkItem[] = data.map(item => ({
        id: item.id,
        projectId: item.project_id,
        roomType: item.room_type,
        workDescription: item.work_description,
        estimatedHours: item.estimated_hours,
        priority: item.priority,
        status: item.status,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }))

      return { data: workItems, error: null }
    } catch (error) {
      return { data: null, error: { message: 'Failed to fetch work items by room' } }
    }
  }
}

export const jobWorkService = new JobWorkService()
