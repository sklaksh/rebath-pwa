'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/page-header'
import { ProtectedRoute } from '@/components/protected-route'
import { DeleteConfirmation } from '@/components/delete-confirmation'
import { projectService } from '@/lib/services'
import type { Project } from '@/lib/services'

function EditProjectContent() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    address: '',
    projectType: 'bathroom' as 'bathroom' | 'kitchen' | 'full_remodel',
    status: 'assessment' as 'assessment' | 'quote_ready' | 'started' | 'in_progress' | 'completed' | 'cancelled',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    estimatedStartDate: '',
    estimatedCompletionDate: '',
    actualStartDate: '',
    actualCompletionDate: '',
    totalBudget: '',
    notes: ''
  })

  useEffect(() => {
    const loadProject = async () => {
      try {
        const { project: fetchedProject, error } = await projectService.getProject(projectId)
        if (error) {
          toast.error('Project not found')
          router.push('/projects')
          return
        }
        
        setProject(fetchedProject)
        if (fetchedProject) {
          setFormData({
            clientName: fetchedProject.clientName || '',
            clientEmail: fetchedProject.clientEmail || '',
            clientPhone: fetchedProject.clientPhone || '',
            address: fetchedProject.address || '',
            projectType: fetchedProject.projectType,
            status: fetchedProject.status,
            priority: fetchedProject.priority,
            estimatedStartDate: fetchedProject.estimatedStartDate ? fetchedProject.estimatedStartDate.split('T')[0] : '',
            estimatedCompletionDate: fetchedProject.estimatedCompletionDate ? fetchedProject.estimatedCompletionDate.split('T')[0] : '',
            actualStartDate: fetchedProject.actualStartDate ? fetchedProject.actualStartDate.split('T')[0] : '',
            actualCompletionDate: fetchedProject.actualCompletionDate ? fetchedProject.actualCompletionDate.split('T')[0] : '',
            totalBudget: fetchedProject.totalBudget ? fetchedProject.totalBudget.toString() : '',
            notes: fetchedProject.notes || ''
          })
        }
      } catch (error) {
        toast.error('Failed to load project')
        router.push('/projects')
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      loadProject()
    }
  }, [projectId, router])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = () => {
    if (!formData.clientName.trim()) {
      toast.error('Client name is required')
      return false
    }
    if (!formData.address.trim()) {
      toast.error('Address is required')
      return false
    }
    if (formData.clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.clientEmail)) {
      toast.error('Please enter a valid email address')
      return false
    }
    if (formData.clientPhone && !/^[\d\s\-\+\(\)]+$/.test(formData.clientPhone)) {
      toast.error('Please enter a valid phone number')
      return false
    }
    if (formData.totalBudget && isNaN(Number(formData.totalBudget))) {
      toast.error('Budget must be a valid number')
      return false
    }
    return true
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setSaving(true)
    try {
      const updates: Partial<Project> = {
        clientName: formData.clientName.trim(),
        clientEmail: formData.clientEmail.trim() || undefined,
        clientPhone: formData.clientPhone.trim() || undefined,
        address: formData.address.trim(),
        projectType: formData.projectType,
        status: formData.status,
        priority: formData.priority,
        estimatedStartDate: formData.estimatedStartDate || undefined,
        estimatedCompletionDate: formData.estimatedCompletionDate || undefined,
        actualStartDate: formData.actualStartDate || undefined,
        actualCompletionDate: formData.actualCompletionDate || undefined,
        totalBudget: formData.totalBudget ? Number(formData.totalBudget) : undefined,
        notes: formData.notes.trim() || undefined
      }

      const { project: updatedProject, error } = await projectService.updateProject(projectId, updates)
      
      if (error) {
        toast.error(`Failed to update project: ${error.message}`)
      } else {
        toast.success('Project updated successfully!')
        router.push(`/projects/${projectId}`)
      }
    } catch (error) {
      console.error('Error updating project:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProject = async () => {
    setSaving(true)
    try {
      const { success, error } = await projectService.deleteProject(projectId)
      
      if (error) {
        toast.error(`Failed to delete project: ${error.message}`)
      } else if (success) {
        toast.success('Project deleted successfully!')
        router.push('/projects')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setSaving(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading project...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-4">The requested project could not be found.</p>
          <Button onClick={() => router.push('/projects')}>
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Edit Project"
        showBackButton={true}
        showQuickNav={true}
      />

      <div className="p-4 space-y-6">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">
                Client Name *
              </label>
              <Input
                id="clientName"
                type="text"
                value={formData.clientName}
                onChange={(e) => handleInputChange('clientName', e.target.value)}
                placeholder="Enter client name"
                required
              />
            </div>
            <div>
              <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <Input
                id="clientEmail"
                type="email"
                value={formData.clientEmail}
                onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label htmlFor="clientPhone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <Input
                id="clientPhone"
                type="tel"
                value={formData.clientPhone}
                onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <Input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter project address"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Project Details */}
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="projectType" className="block text-sm font-medium text-gray-700 mb-1">
                Project Type
              </label>
              <select
                id="projectType"
                value={formData.projectType}
                onChange={(e) => handleInputChange('projectType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="bathroom">Bathroom</option>
                <option value="kitchen">Kitchen</option>
                <option value="full_remodel">Full Remodel</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="assessment">Assessment</option>
                  <option value="quote_ready">Quote Ready</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="estimatedStartDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Start Date
                </label>
                <Input
                  id="estimatedStartDate"
                  type="date"
                  value={formData.estimatedStartDate}
                  onChange={(e) => handleInputChange('estimatedStartDate', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="estimatedCompletionDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Completion Date
                </label>
                <Input
                  id="estimatedCompletionDate"
                  type="date"
                  value={formData.estimatedCompletionDate}
                  onChange={(e) => handleInputChange('estimatedCompletionDate', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="actualStartDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Actual Start Date
                </label>
                <Input
                  id="actualStartDate"
                  type="date"
                  value={formData.actualStartDate}
                  onChange={(e) => handleInputChange('actualStartDate', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="actualCompletionDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Actual Completion Date
                </label>
                <Input
                  id="actualCompletionDate"
                  type="date"
                  value={formData.actualCompletionDate}
                  onChange={(e) => handleInputChange('actualCompletionDate', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget and Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Budget and Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="totalBudget" className="block text-sm font-medium text-gray-700 mb-1">
                Total Budget
              </label>
              <Input
                id="totalBudget"
                type="number"
                value={formData.totalBudget}
                onChange={(e) => handleInputChange('totalBudget', e.target.value)}
                placeholder="Enter total budget"
                min="0"
                step="0.01"
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Scope of Work</h4>
              <p className="text-sm text-blue-700">
                Use the "Work Scope & Tasks" section on the project detail page to add detailed work items for each room.
                This allows you to break down the work by room and track individual tasks with priorities and time estimates.
              </p>
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Enter project notes"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={saving}
          >
            Delete Project
          </Button>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <DeleteConfirmation
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteProject}
          title="Delete Project"
          description="This action cannot be undone. This will permanently delete the project and all associated data."
          itemName="Project"
          loading={saving}
        />
      </div>
    </div>
  )
}

export default function EditProject() {
  return (
    <ProtectedRoute>
      <EditProjectContent />
    </ProtectedRoute>
  )
}
