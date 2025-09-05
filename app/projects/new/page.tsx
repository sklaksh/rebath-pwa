'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, User, MapPin, Phone, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ProtectedRoute } from '@/components/protected-route'
import { projectService } from '@/lib/services'
import { toast } from 'react-hot-toast'

function NewProjectContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    address: '',
    projectType: 'bathroom',
    priority: 'medium',
    estimatedStartDate: '',
    estimatedCompletionDate: '',
    totalBudget: '',
    notes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Run initial validation when component mounts
  useEffect(() => {
    validateFormRealTime()
  }, [])

  // Helper function to check if form is valid
  const isFormValid = () => {
    const hasRequiredFields = formData.clientName.trim() !== '' && formData.address.trim() !== ''
    const hasNoErrors = Object.keys(errors).length === 0
    const isValid = hasRequiredFields && hasNoErrors
    
    // Debug logging
    console.log('Form validation check:', {
      hasRequiredFields,
      hasNoErrors,
      errors: Object.keys(errors),
      isValid,
      formData: {
        clientName: formData.clientName,
        address: formData.address
      }
    })
    
    return isValid
  }

  const validateEmail = (email: string): boolean => {
    if (!email) return true // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true // Phone is optional
    const phoneRegex = /^\d{10}$/
    return phoneRegex.test(phone.replace(/\D/g, '')) // Remove non-digits and check
  }

  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length <= 3) return cleaned
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
  }

  const validateDates = (startDate: string, completionDate: string): boolean => {
    if (!startDate) return true // Start date is optional
    
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to start of day
    
    // Create date from string and reset time to start of day
    const start = new Date(startDate + 'T00:00:00')
    
    // Start date should be today or future
    if (start < today) return false
    
    if (!completionDate) return true // Completion date is optional
    
    // Create date from string and reset time to start of day
    const completion = new Date(completionDate + 'T00:00:00')
    
    // Completion date should be after start date
    return completion > start
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Validate email
    if (formData.clientEmail && !validateEmail(formData.clientEmail)) {
      newErrors.clientEmail = 'Please enter a valid email address'
    }

    // Validate phone
    if (formData.clientPhone && !validatePhone(formData.clientPhone)) {
      newErrors.clientPhone = 'Phone number must be exactly 10 digits'
    }

    // Validate dates
    if (!validateDates(formData.estimatedStartDate, formData.estimatedCompletionDate)) {
      if (formData.estimatedStartDate) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const start = new Date(formData.estimatedStartDate + 'T00:00:00')
        
        if (start < today) {
          newErrors.estimatedStartDate = 'Start date must be today or in the future'
        }
      }
      
      if (formData.estimatedStartDate && formData.estimatedCompletionDate) {
        const start = new Date(formData.estimatedStartDate + 'T00:00:00')
        const completion = new Date(formData.estimatedCompletionDate + 'T00:00:00')
        
        if (completion <= start) {
          newErrors.estimatedCompletionDate = 'Completion date must be after start date'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    const newFormData = {
      ...formData,
      [field]: value
    }
    
    setFormData(newFormData)

    // If start date changes and completion date is before it, clear completion date
    if (field === 'estimatedStartDate' && formData.estimatedCompletionDate) {
      const start = new Date(value + 'T00:00:00')
      const completion = new Date(formData.estimatedCompletionDate + 'T00:00:00')
      if (completion <= start) {
        newFormData.estimatedCompletionDate = ''
        setFormData(newFormData)
      }
    }

    // Run real-time validation
    validateFormRealTime(newFormData)
  }

  const validateFormRealTime = (data = formData) => {
    const newErrors: Record<string, string> = {}

    // Validate email
    if (data.clientEmail && !validateEmail(data.clientEmail)) {
      newErrors.clientEmail = 'Please enter a valid email address'
    }

    // Validate phone
    if (data.clientPhone && !validatePhone(data.clientPhone)) {
      newErrors.clientPhone = 'Phone number must be exactly 10 digits'
    }

    // Validate dates
    if (!validateDates(data.estimatedStartDate, data.estimatedCompletionDate)) {
      if (data.estimatedStartDate) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const start = new Date(data.estimatedStartDate + 'T00:00:00')
        
        if (start < today) {
          newErrors.estimatedStartDate = 'Start date must be today or in the future'
        }
      }
      
      if (data.estimatedStartDate && data.estimatedCompletionDate) {
        const start = new Date(data.estimatedStartDate + 'T00:00:00')
        const completion = new Date(data.estimatedCompletionDate + 'T00:00:00')
        
        if (completion <= start) {
          newErrors.estimatedCompletionDate = 'Completion date must be after start date'
        }
      }
    }

    setErrors(newErrors)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form before submission
    if (!validateForm()) {
      toast.error('Please fix the validation errors before submitting')
      return
    }
    
    setLoading(true)

    try {
      const projectData = {
        clientName: formData.clientName,
        clientEmail: formData.clientEmail || undefined,
        clientPhone: formData.clientPhone || undefined,
        address: formData.address,
        projectType: formData.projectType as 'bathroom' | 'kitchen' | 'full_remodel',
        priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
        estimatedStartDate: formData.estimatedStartDate || undefined,
        estimatedCompletionDate: formData.estimatedCompletionDate || undefined,
        totalBudget: formData.totalBudget ? parseFloat(formData.totalBudget) : undefined,
        notes: formData.notes || undefined
      }

      const result = await projectService.createProject(projectData)
      
      if (result.success && result.project) {
        toast.success('Project created successfully!')
        router.push(`/projects/${result.project.id}`)
      } else {
        toast.error(result.error?.message || 'Failed to create project')
      }
    } catch (error) {
      console.error('Error creating project:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">New Project</h1>
              <p className="text-sm text-gray-500">Create a new bath remodel project</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-4">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Client Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Name *
                </label>
                <Input
                  value={formData.clientName}
                  onChange={(e) => handleInputChange('clientName', e.target.value)}
                  placeholder="Enter client name"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                    placeholder="client@example.com"
                    className={errors.clientEmail ? 'border-red-500 focus:border-red-500' : ''}
                  />
                  {errors.clientEmail && (
                    <p className="mt-1 text-sm text-red-600">{errors.clientEmail}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <Input
                    type="tel"
                    value={formatPhoneNumber(formData.clientPhone)}
                    onChange={(e) => handleInputChange('clientPhone', e.target.value.replace(/\D/g, ''))}
                    placeholder="(555) 123-4567"
                    maxLength={14}
                    className={errors.clientPhone ? 'border-red-500 focus:border-red-500' : ''}
                  />
                  {errors.clientPhone && (
                    <p className="mt-1 text-sm text-red-600">{errors.clientPhone}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Project Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <Input
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Enter project address"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Type
                  </label>
                  <select
                    value={formData.projectType}
                    onChange={(e) => handleInputChange('projectType', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  >
                    <option value="bathroom">Bathroom</option>
                    <option value="kitchen">Kitchen</option>
                    <option value="full_remodel">Full Remodel</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Start Date
                  </label>
                  <Input
                    type="date"
                    value={formData.estimatedStartDate}
                    onChange={(e) => handleInputChange('estimatedStartDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={errors.estimatedStartDate ? 'border-red-500 focus:border-red-500' : ''}
                  />
                  {errors.estimatedStartDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.estimatedStartDate}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Completion Date
                  </label>
                  <Input
                    type="date"
                    value={formData.estimatedCompletionDate}
                    onChange={(e) => handleInputChange('estimatedCompletionDate', e.target.value)}
                    min={formData.estimatedStartDate || new Date().toISOString().split('T')[0]}
                    className={errors.estimatedCompletionDate ? 'border-red-500 focus:border-red-500' : ''}
                  />
                  {errors.estimatedCompletionDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.estimatedCompletionDate}</p>
                  )}
                </div>
              </div>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                  rows={4}
                  placeholder="Additional project notes..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !isFormValid()}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Project
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function NewProject() {
  return (
    <ProtectedRoute>
      <NewProjectContent />
    </ProtectedRoute>
  )
}
