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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Edit Project"
        backHref={`/projects/${projectId}`}
      />

      <div className="max-w-4xl mx-auto p-4">
        <div className="space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Name *
                  </label>
                  <Input
                    value={formData.clientName}
                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                    placeholder="Enter client name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                    placeholder="client@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <Input
                    type="tel"
                    value={formData.clientPhone}
                    onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <Input
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="123 Main St, City, State"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Details */}
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Type
                  </label>
                  <select
                    value={formData.projectType}
                    onChange={(e) => handleInputChange('projectType', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="bathroom">Bathroom</option>
                    <option value="kitchen">Kitchen</option>
                    <option value="full_remodel">Full Remodel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="assessment">Assessment</option>
                    <option value="quote_ready">Quote Ready</option>
                    <option value="started">Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Start Date
                  </label>
                  <Input
                    type="date"
                    value={formData.estimatedStartDate}
                    onChange={(e) => handleInputChange('estimatedStartDate', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Completion Date
                  </label>
                  <Input
                    type="date"
                    value={formData.estimatedCompletionDate}
                    onChange={(e) => handleInputChange('estimatedCompletionDate', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Actual Start Date
                  </label>
                  <Input
                    type="date"
                    value={formData.actualStartDate}
                    onChange={(e) => handleInputChange('actualStartDate', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Actual Completion Date
                  </label>
                  <Input
                    type="date"
                    value={formData.actualCompletionDate}
                    onChange={(e) => handleInputChange('actualCompletionDate', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget */}
          <Card>
            <CardHeader>
              <CardTitle>Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Budget
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.totalBudget}
                  onChange={(e) => handleInputChange('totalBudget', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                  rows={4}
                  placeholder="Any additional notes about this project..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-600 hover:text-red-700"
            >
              Delete Project
            </Button>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-primary-600 hover:bg-primary-700"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <DeleteConfirmation
          title="Delete Project"
          message={`Are you sure you want to delete the project for ${project?.clientName}? This action cannot be undone.`}
          onConfirm={handleDeleteProject}
          onCancel={() => setShowDeleteConfirm(false)}
          isLoading={saving}
        />
      )}
    </div>
  )
}

export default function EditProjectPage() {
  return (
    <ProtectedRoute>
      <EditProjectContent />
    </ProtectedRoute>
  )
}