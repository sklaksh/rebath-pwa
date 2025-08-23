import { createClient } from '@/lib/supabase/client'
import type { Project as DbProject, Inserts as ProjectInsert, Updates as ProjectUpdate } from '@/lib/supabase/types'

export interface Project {
  id: string
  name: string
  clientName: string
  address: string
  status: 'assessment' | 'quote_ready' | 'in_progress' | 'completed' | 'cancelled'
  progress: number
  estimatedStartDate?: string
  estimatedEndDate?: string
  actualStartDate?: string
  actualEndDate?: string
  budget: number
  actualCost?: number
  notes: string
  assessments: string[] // Assessment IDs
  quotes: string[] // Quote IDs
  teamMembers: string[]
  priority: 'low' | 'medium' | 'high' | 'urgent'
  createdAt: string
  updatedAt: string
  userId: string
}

export interface ProjectError {
  message: string
  code?: string
}

export interface ProjectStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalValue: number
  averageProjectValue: number
}

class ProjectService {
  private supabase = createClient()

  // Create a new project
  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ project: Project; error: ProjectError | null }> {
    try {
      const projectData: ProjectInsert<'projects'> = {
        user_id: project.userId,
        client_name: project.clientName,
        client_email: null, // Will be added later
        client_phone: null, // Will be added later
        address: project.address,
        project_type: 'bathroom', // Default, will be enhanced later
        status: project.status,
        priority: project.priority,
        estimated_start_date: project.estimatedStartDate ? new Date(project.estimatedStartDate).toISOString() : null,
        estimated_completion_date: project.estimatedEndDate ? new Date(project.estimatedEndDate).toISOString() : null,
        actual_start_date: project.actualStartDate ? new Date(project.actualStartDate).toISOString() : null,
        actual_completion_date: project.actualEndDate ? new Date(project.actualEndDate).toISOString() : null,
        total_budget: project.budget,
        notes: project.notes
      }

      const { data, error } = await this.supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single()

      if (error) {
        return {
          project: {} as Project,
          error: { message: error.message, code: error.code }
        }
      }

      const newProject = this.mapDbProjectToProject(data)
      return { project: newProject, error: null }
    } catch (error) {
      return {
        project: {} as Project,
        error: { message: 'Failed to create project' }
      }
    }
  }

  // Get all projects for the current user
  async getProjects(): Promise<{ projects: Project[]; error: ProjectError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { projects: [], error: { message: 'User not authenticated' } }
      }

      const { data, error } = await this.supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        return {
          projects: [],
          error: { message: error.message, code: error.code }
        }
      }

      const projects = data.map(this.mapDbProjectToProject)
      return { projects, error: null }
    } catch (error) {
      return {
        projects: [],
        error: { message: 'Failed to fetch projects' }
      }
    }
  }

  // Get a specific project by ID
  async getProject(id: string): Promise<{ project: Project | null; error: ProjectError | null }> {
    try {
      const { data, error } = await this.supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        return {
          project: null,
          error: { message: error.message, code: error.code }
        }
      }

      const project = this.mapDbProjectToProject(data)
      return { project, error: null }
    } catch (error) {
      return {
        project: null,
        error: { message: 'Failed to fetch project' }
      }
    }
  }

  // Update a project
  async updateProject(id: string, updates: Partial<Project>): Promise<{ project: Project | null; error: ProjectError | null }> {
    try {
      const updateData: ProjectUpdate<'projects'> = {}
      
      if (updates.clientName) updateData.client_name = updates.clientName
      if (updates.address) updateData.address = updates.address
      if (updates.status) updateData.status = updates.status
      if (updates.priority) updateData.priority = updates.priority
      if (updates.estimatedStartDate) updateData.estimated_start_date = new Date(updates.estimatedStartDate).toISOString()
      if (updates.estimatedEndDate) updateData.estimated_completion_date = new Date(updates.estimatedEndDate).toISOString()
      if (updates.actualStartDate) updateData.actual_start_date = new Date(updates.actualStartDate).toISOString()
      if (updates.actualEndDate) updateData.actual_completion_date = new Date(updates.actualEndDate).toISOString()
      if (updates.budget) updateData.total_budget = updates.budget
      if (updates.notes) updateData.notes = updates.notes

      const { data, error } = await this.supabase
        .from('projects')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return {
          project: null,
          error: { message: error.message, code: error.code }
        }
      }

      const project = this.mapDbProjectToProject(data)
      return { project, error: null }
    } catch (error) {
      return {
        project: null,
        error: { message: 'Failed to update project' }
      }
    }
  }

  // Delete a project
  async deleteProject(id: string): Promise<{ success: boolean; error: ProjectError | null }> {
    try {
      const { error } = await this.supabase
        .from('projects')
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
        error: { message: 'Failed to delete project' }
      }
    }
  }

  // Get projects by status
  async getProjectsByStatus(status: Project['status']): Promise<{ projects: Project[]; error: ProjectError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { projects: [], error: { message: 'User not authenticated' } }
      }

      const { data, error } = await this.supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', status)
        .order('created_at', { ascending: false })

      if (error) {
        return {
          projects: [],
          error: { message: error.message, code: error.code }
        }
      }

      const projects = data.map(this.mapDbProjectToProject)
      return { projects, error: null }
    } catch (error) {
      return {
        projects: [],
        error: { message: 'Failed to fetch projects by status' }
      }
    }
  }

  // Get projects by priority
  async getProjectsByPriority(priority: Project['priority']): Promise<{ projects: Project[]; error: ProjectError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { projects: [], error: { message: 'User not authenticated' } }
      }

      const { data, error } = await this.supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .eq('priority', priority)
        .order('created_at', { ascending: false })

      if (error) {
        return {
          projects: [],
          error: { message: error.message, code: error.code }
        }
      }

      const projects = data.map(this.mapDbProjectToProject)
      return { projects, error: null }
    } catch (error) {
      return {
        projects: [],
        error: { message: 'Failed to fetch projects by priority' }
      }
    }
  }

  // Search projects
  async searchProjects(query: string): Promise<{ projects: Project[]; error: ProjectError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { projects: [], error: { message: 'User not authenticated' } }
      }

      const { data, error } = await this.supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .or(`client_name.ilike.%${query}%,address.ilike.%${query}%`)
        .order('created_at', { ascending: false })

      if (error) {
        return {
          projects: [],
          error: { message: error.message, code: error.code }
        }
      }

      const projects = data.map(this.mapDbProjectToProject)
      return { projects, error: null }
    } catch (error) {
      return {
        projects: [],
        error: { message: 'Failed to search projects' }
      }
    }
  }

  // Get recent projects
  async getRecentProjects(limit: number = 5): Promise<{ projects: Project[]; error: ProjectError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { projects: [], error: { message: 'User not authenticated' } }
      }

      const { data, error } = await this.supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(limit)

      if (error) {
        return {
          projects: [],
          error: { message: error.message, code: error.code }
        }
      }

      const projects = data.map(this.mapDbProjectToProject)
      return { projects, error: null }
    } catch (error) {
      return {
        projects: [],
        error: { message: 'Failed to fetch recent projects' }
      }
    }
  }

  // Update project progress
  async updateProjectProgress(id: string, progress: number): Promise<{ success: boolean; error: ProjectError | null }> {
    try {
      // Auto-update status based on progress
      let status: Project['status'] = 'in_progress'
      if (progress >= 100) {
        status = 'completed'
      } else if (progress === 0) {
        status = 'assessment'
      }

      const result = await this.updateProject(id, { progress, status })
      
      if (result.error) {
        return { success: false, error: result.error }
      }

      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error: { message: 'Failed to update project progress' }
      }
    }
  }

  // Add assessment to project
  async addAssessmentToProject(projectId: string, assessmentId: string): Promise<{ success: boolean; error: ProjectError | null }> {
    // This will be implemented when we have the assessments table properly linked
    return { success: true, error: null }
  }

  // Add quote to project
  async addQuoteToProject(projectId: string, quoteId: string): Promise<{ success: boolean; error: ProjectError | null }> {
    // This will be implemented when we have the quotes table properly linked
    return { success: true, error: null }
  }

  // Get project statistics
  async getProjectStats(): Promise<{ stats: ProjectStats; error: ProjectError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { 
          stats: { totalProjects: 0, activeProjects: 0, completedProjects: 0, totalValue: 0, averageProjectValue: 0 },
          error: { message: 'User not authenticated' }
        }
      }

      const { data, error } = await this.supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)

      if (error) {
        return {
          stats: { totalProjects: 0, activeProjects: 0, completedProjects: 0, totalValue: 0, averageProjectValue: 0 },
          error: { message: error.message, code: error.code }
        }
      }

      const totalProjects = data.length
      const activeProjects = data.filter((p: DbProject) => p.status === 'in_progress').length
      const completedProjects = data.filter((p: DbProject) => p.status === 'completed').length
      const totalValue = data.reduce((sum: number, p: DbProject) => sum + (p.total_budget || 0), 0)
      const averageProjectValue = totalProjects > 0 ? totalValue / totalProjects : 0

      const stats: ProjectStats = {
        totalProjects,
        activeProjects,
        completedProjects,
        totalValue,
        averageProjectValue
      }

      return { stats, error: null }
    } catch (error) {
      return {
        stats: { totalProjects: 0, activeProjects: 0, completedProjects: 0, totalValue: 0, averageProjectValue: 0 },
        error: { message: 'Failed to get project statistics' }
      }
    }
  }

  // Get projects due soon
  async getProjectsDueSoon(days: number = 7): Promise<{ projects: Project[]; error: ProjectError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { projects: [], error: { message: 'User not authenticated' } }
      }

      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + days)

      const { data, error } = await this.supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .not('estimated_completion_date', 'is', null)
        .lte('estimated_completion_date', dueDate.toISOString())
        .neq('status', 'completed')
        .order('estimated_completion_date', { ascending: true })

      if (error) {
        return {
          projects: [],
          error: { message: error.message, code: error.code }
        }
      }

      const projects = data.map(this.mapDbProjectToProject)
      return { projects, error: null }
    } catch (error) {
      return {
        projects: [],
        error: { message: 'Failed to fetch projects due soon' }
      }
    }
  }

  // Export project data
  exportProject(project: Project): string {
    return JSON.stringify(project, null, 2)
  }

  // Import project data
  importProject(data: string): Project | null {
    try {
      return JSON.parse(data)
    } catch (error) {
      console.error('Error parsing project data:', error)
      return null
    }
  }

  // Map database project to application project
  private mapDbProjectToProject(dbProject: DbProject): Project {
    return {
      id: dbProject.id,
      name: dbProject.client_name, // Using client_name as name for now
      clientName: dbProject.client_name,
      address: dbProject.address,
      status: dbProject.status,
      progress: 0, // Will be calculated based on assessments/quotes
      estimatedStartDate: dbProject.estimated_start_date || undefined,
      estimatedEndDate: dbProject.estimated_completion_date || undefined,
      actualStartDate: dbProject.actual_start_date || undefined,
      actualEndDate: dbProject.actual_completion_date || undefined,
      budget: dbProject.total_budget || 0,
      actualCost: 0, // Will be calculated
      notes: dbProject.notes || '',
      assessments: [], // Will be populated from assessments table
      quotes: [], // Will be populated from quotes table
      teamMembers: [], // Will be enhanced later
      priority: dbProject.priority,
      createdAt: dbProject.created_at,
      updatedAt: dbProject.updated_at,
      userId: dbProject.user_id
    }
  }
}

export const projectService = new ProjectService()
