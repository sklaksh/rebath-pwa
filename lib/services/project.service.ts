import { supabase } from '@/lib/supabase/client'
import type { Project as DbProject, Inserts as ProjectInsert, Updates as ProjectUpdate } from '@/lib/supabase/types'

export interface Project {
  id: string
  name: string
  clientName: string
  clientEmail?: string
  clientPhone?: string
  address: string
  projectType: 'bathroom' | 'kitchen' | 'full_remodel'
  status: 'assessment' | 'quote_ready' | 'started' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  estimatedStartDate?: string
  estimatedCompletionDate?: string
  actualStartDate?: string
  actualCompletionDate?: string
  totalBudget?: number
  actualCost?: number
  jobDescription?: string
  notes?: string
  createdAt: string
  updatedAt: string
  userId: string
  // Admin view fields
  userFullName?: string
  userEmail?: string
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
  private supabase = supabase

  // Create a new project
  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<{ project: Project | null; success: boolean; error: ProjectError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { project: null, success: false, error: { message: 'User not authenticated' } }
      }

      // Get the current user's name for the project
      const { data: userProfile } = await this.supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single()

      const projectData: ProjectInsert<'projects'> = {
        user_id: user.id,
        user_name: userProfile?.full_name || userProfile?.email || 'Unknown User',
        client_name: project.clientName,
        client_email: project.clientEmail || null,
        client_phone: project.clientPhone || null,
        address: project.address,
        project_type: project.projectType,
        status: project.status,
        priority: project.priority,
        estimated_start_date: project.estimatedStartDate ? new Date(project.estimatedStartDate).toISOString() : null,
        estimated_completion_date: project.estimatedCompletionDate ? new Date(project.estimatedCompletionDate).toISOString() : null,
        actual_start_date: project.actualStartDate ? new Date(project.actualStartDate).toISOString() : null,
        actual_completion_date: project.actualCompletionDate ? new Date(project.actualCompletionDate).toISOString() : null,
        total_budget: project.totalBudget || null,
        notes: project.notes || null
      }

      const { data, error } = await this.supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single()

      if (error) {
        return {
          project: null,
          success: false,
          error: { message: error.message, code: error.code }
        }
      }

      const newProject = this.mapDbProjectToProject(data)
      return { project: newProject, success: true, error: null }
    } catch (error) {
      return {
        project: null,
        success: false,
        error: { message: 'Failed to create project' }
      }
    }
  }

  // Get all projects for the current user (including shared projects)
  async getProjects(): Promise<{ projects: Project[]; error: ProjectError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { projects: [], error: { message: 'User not authenticated' } }
      }

      // Check if user is admin
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const isAdmin = profile?.role === 'admin'

      let query
      
      if (isAdmin) {
        // For admin users, get all projects
        query = this.supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false })
      } else {
        // For regular users, get their own projects + shared projects
        query = this.supabase
          .from('projects')
          .select(`
            *,
            project_permissions!inner(permission_type)
          `)
          .or(`user_id.eq.${user.id},project_permissions.user_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
      }

      const { data, error } = await query

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

  // Get all projects (admin only)
  async getAllProjects(): Promise<{ projects: Project[]; error: ProjectError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { projects: [], error: { message: 'User not authenticated' } }
      }

      // Check if user is admin
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        return { projects: [], error: { message: 'Admin access required' } }
      }

      const { data, error } = await this.supabase
        .from('projects')
        .select(`
          *,
          profiles!projects_user_id_fkey (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        return {
          projects: [],
          error: { message: error.message, code: error.code }
        }
      }

      const projects = data.map(this.mapDbProjectToProjectWithUser)
      return { projects, error: null }
    } catch (error) {
      return {
        projects: [],
        error: { message: 'Failed to fetch all projects' }
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
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { project: null, error: { message: 'User not authenticated' } }
      }

      const updateData: ProjectUpdate<'projects'> = {}
      
      // Client information
      if (updates.clientName !== undefined) updateData.client_name = updates.clientName
      if (updates.clientEmail !== undefined) updateData.client_email = updates.clientEmail || null
      if (updates.clientPhone !== undefined) updateData.client_phone = updates.clientPhone || null
      
      // Project details
      if (updates.address !== undefined) updateData.address = updates.address
      if (updates.projectType !== undefined) updateData.project_type = updates.projectType
      if (updates.status !== undefined) updateData.status = updates.status
      if (updates.priority !== undefined) updateData.priority = updates.priority
      
      // Dates
      if (updates.estimatedStartDate !== undefined) updateData.estimated_start_date = updates.estimatedStartDate ? new Date(updates.estimatedStartDate).toISOString() : null
      if (updates.estimatedCompletionDate !== undefined) updateData.estimated_completion_date = updates.estimatedCompletionDate ? new Date(updates.estimatedCompletionDate).toISOString() : null
      if (updates.actualStartDate !== undefined) updateData.actual_start_date = updates.actualStartDate ? new Date(updates.actualStartDate).toISOString() : null
      if (updates.actualCompletionDate !== undefined) updateData.actual_completion_date = updates.actualCompletionDate ? new Date(updates.actualCompletionDate).toISOString() : null
      
      // Budget, job description and notes
      if (updates.totalBudget !== undefined) updateData.total_budget = updates.totalBudget || null
      if (updates.jobDescription !== undefined) updateData.job_description = updates.jobDescription || null
      if (updates.notes !== undefined) updateData.notes = updates.notes || null

      const { data, error } = await this.supabase
        .from('projects')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
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

  // Share project with another user
  async shareProject(projectId: string, userId: string, permissionType: 'view' | 'edit' | 'admin' = 'view'): Promise<{ success: boolean; error: ProjectError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { success: false, error: { message: 'User not authenticated' } }
      }

      // Check if user has permission to share this project
      const { data: project } = await this.supabase
        .from('projects')
        .select('user_id')
        .eq('id', projectId)
        .single()

      if (!project) {
        return { success: false, error: { message: 'Project not found' } }
      }

      // Check if user is project owner or admin
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const isProjectOwner = project.user_id === user.id
      const isAdmin = profile?.role === 'admin'

      if (!isProjectOwner && !isAdmin) {
        return { success: false, error: { message: 'You do not have permission to share this project' } }
      }

      // Grant permission
      const { error } = await this.supabase
        .from('project_permissions')
        .upsert({
          project_id: projectId,
          user_id: userId,
          permission_type: permissionType,
          granted_by: user.id
        })

      if (error) {
        return { success: false, error: { message: error.message, code: error.code } }
      }

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: { message: 'Failed to share project' } }
    }
  }

  // Revoke project access from a user
  async revokeProjectAccess(projectId: string, userId: string): Promise<{ success: boolean; error: ProjectError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { success: false, error: { message: 'User not authenticated' } }
      }

      // Check if user has permission to revoke access
      const { data: project } = await this.supabase
        .from('projects')
        .select('user_id')
        .eq('id', projectId)
        .single()

      if (!project) {
        return { success: false, error: { message: 'Project not found' } }
      }

      // Check if user is project owner or admin
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const isProjectOwner = project.user_id === user.id
      const isAdmin = profile?.role === 'admin'

      if (!isProjectOwner && !isAdmin) {
        return { success: false, error: { message: 'You do not have permission to revoke access to this project' } }
      }

      // Revoke permission
      const { error } = await this.supabase
        .from('project_permissions')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId)

      if (error) {
        return { success: false, error: { message: error.message, code: error.code } }
      }

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: { message: 'Failed to revoke project access' } }
    }
  }

  // Get project permissions (who has access to a project)
  async getProjectPermissions(projectId: string): Promise<{ permissions: any[]; error: ProjectError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { permissions: [], error: { message: 'User not authenticated' } }
      }

      // Check if user has permission to view project permissions
      const { data: project } = await this.supabase
        .from('projects')
        .select('user_id')
        .eq('id', projectId)
        .single()

      if (!project) {
        return { permissions: [], error: { message: 'Project not found' } }
      }

      // Check if user is project owner or admin
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const isProjectOwner = project.user_id === user.id
      const isAdmin = profile?.role === 'admin'

      if (!isProjectOwner && !isAdmin) {
        return { permissions: [], error: { message: 'You do not have permission to view project permissions' } }
      }

      // Get permissions
      const { data: permissionsData, error } = await this.supabase
        .from('project_permissions')
        .select('*')
        .eq('project_id', projectId)

      if (error) {
        return { permissions: [], error: { message: error.message, code: error.code } }
      }

      // Get user details separately
      const userIds = permissionsData?.map(p => p.user_id) || []
      let userProfiles: any[] = []
      
      if (userIds.length > 0) {
        const { data: profilesData } = await this.supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds)
        
        userProfiles = profilesData || []
      }

      // Combine permissions with user details
      const data = permissionsData?.map(permission => ({
        ...permission,
        profiles: userProfiles.find(profile => profile.id === permission.user_id)
      })) || []

      return { permissions: data, error: null }
    } catch (error) {
      return { permissions: [], error: { message: 'Failed to fetch project permissions' } }
    }
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

  // Start a project
  async startProject(projectId: string): Promise<{ success: boolean; error: ProjectError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { success: false, error: { message: 'User not authenticated' } }
      }

      const today = new Date().toISOString().split('T')[0]

      const { error } = await this.supabase
        .from('projects')
        .update({ 
          status: 'started',
          actual_start_date: today
        })
        .eq('id', projectId)
        .eq('user_id', user.id)

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
        error: { message: 'Failed to start project' }
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
      clientEmail: dbProject.client_email || undefined,
      clientPhone: dbProject.client_phone || undefined,
      address: dbProject.address,
      projectType: dbProject.project_type,
      status: dbProject.status,
      priority: dbProject.priority,
      estimatedStartDate: dbProject.estimated_start_date || undefined,
      estimatedCompletionDate: dbProject.estimated_completion_date || undefined,
      actualStartDate: dbProject.actual_start_date || undefined,
      actualCompletionDate: dbProject.actual_completion_date || undefined,
      totalBudget: dbProject.total_budget || undefined,
      actualCost: 0, // Will be calculated
      jobDescription: dbProject.job_description || undefined,
      notes: dbProject.notes || undefined,
      createdAt: dbProject.created_at,
      updatedAt: dbProject.updated_at,
      userId: dbProject.user_id,
      userFullName: dbProject.user_name || 'Unknown User',
      userEmail: 'N/A' // We'll get this from the user's own profile if needed
    }
  }

  // Map database project with user info to application project (for admin view)
  private mapDbProjectToProjectWithUser(dbProject: any): Project {
    return {
      id: dbProject.id,
      name: dbProject.client_name,
      clientName: dbProject.client_name,
      clientEmail: dbProject.client_email || undefined,
      clientPhone: dbProject.client_phone || undefined,
      address: dbProject.address,
      projectType: dbProject.project_type,
      status: dbProject.status,
      priority: dbProject.priority,
      estimatedStartDate: dbProject.estimated_start_date || undefined,
      estimatedCompletionDate: dbProject.estimated_completion_date || undefined,
      actualStartDate: dbProject.actual_start_date || undefined,
      actualCompletionDate: dbProject.actual_completion_date || undefined,
      totalBudget: dbProject.total_budget || undefined,
      actualCost: 0, // Will be calculated
      jobDescription: dbProject.job_description || undefined,
      notes: dbProject.notes || undefined,
      createdAt: dbProject.created_at,
      updatedAt: dbProject.updated_at,
      userId: dbProject.user_id,
      // Admin view fields
      userFullName: dbProject.profiles?.full_name || 'Unknown User',
      userEmail: dbProject.profiles?.email || 'No email'
    }
  }
}

export const projectService = new ProjectService()
