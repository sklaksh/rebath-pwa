'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Edit, 
  Calendar, 
  DollarSign, 
  MapPin, 
  User, 
  Phone, 
  Mail,
  Plus,
  FileText,
  Calculator,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Send
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProtectedRoute } from '@/components/protected-route'
import { projectService, roomService, assessmentService, quoteService } from '@/lib/services'
import { toast } from 'react-hot-toast'
import type { Project, RoomType, AssessmentData, QuoteData } from '@/lib/services'
import { JobWorkItems } from '@/components/job-work-items'

function ProjectDetailContent() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [assessments, setAssessments] = useState<AssessmentData[]>([])
  const [quotes, setQuotes] = useState<QuoteData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load project
        const { project: fetchedProject, error } = await projectService.getProject(projectId)
        if (error) {
          toast.error('Project not found')
          router.push('/projects')
          return
        }
        setProject(fetchedProject)

        // Load room types
        const { roomTypes: fetchedRoomTypes, error: roomTypesError } = await roomService.getRoomTypes()
        if (roomTypesError) {
          toast.error('Failed to load room types')
          console.error('Error loading room types:', roomTypesError)
        } else {
          setRoomTypes(fetchedRoomTypes)
        }

        // Load assessments for this project
        const { assessments: fetchedAssessments, error: assessmentsError } = await assessmentService.getAssessmentsByProject(projectId)
        if (assessmentsError) {
          console.error('Error loading assessments:', assessmentsError)
          // Don't show error toast for assessments as they might not exist yet
        } else {
          setAssessments(fetchedAssessments)
        }

        // Load quotes for this project
        const { quotes: fetchedQuotes, error: quotesError } = await quoteService.getQuotesByProject(projectId)
        if (quotesError) {
          console.error('Error loading quotes:', quotesError)
          // Don't show error toast for quotes as they might not exist yet
        } else {
          setQuotes(fetchedQuotes)
        }
      } catch (error) {
        toast.error('Failed to load data')
        router.push('/projects')
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      loadData()
    }
  }, [projectId, router])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'quote_ready':
        return 'bg-green-100 text-green-800'
      case 'assessment':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'assessment': return 'Assessment'
      case 'quote_ready': return 'Quote Ready'
      case 'started': return 'Started'
      case 'in_progress': return 'In Progress'
      case 'completed': return 'Completed'
      case 'cancelled': return 'Cancelled'
      default: return status
    }
  }

  const getQuoteStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="w-4 h-4" />
      case 'rejected': return <XCircle className="w-4 h-4" />
      case 'sent': return <Send className="w-4 h-4" />
      case 'draft': return <FileText className="w-4 h-4" />
      case 'expired': return <Clock className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoomTypeIcon = (roomType: RoomType): string => {
    // Use the icon from the database if available, otherwise use a default
    if (roomType.icon) {
      return roomType.icon
    }
    
    // Fallback icons based on room type name
    const iconMap: Record<string, string> = {
      'guest_bathroom': '🚽',
      'master_bathroom': '🛁',
      'powder_room': '🚿',
      'kitchen': '🍳',
      'laundry_room': '🧺',
      'mudroom': '🚪',
      'closet': '👔',
      'other': '🏠'
    }
    
    return iconMap[roomType.name] || '🏠'
  }

  const getRoomTypeDisplayName = (roomTypeName: string): string => {
    const roomType = roomTypes.find(rt => rt.name === roomTypeName)
    return roomType?.displayName || roomTypeName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getAssessmentStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-green-100 text-green-800'
      case 'reviewed':
        return 'bg-blue-100 text-blue-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getQuoteStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'sent':
        return 'bg-blue-100 text-blue-800'
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'expired':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }


  const handleStatusChange = async (newStatus: string) => {
    if (!project) return
    
    try {
      console.log('Changing status to:', newStatus)
      const updates = { status: newStatus }
      
      console.log('Updates object:', updates)
      const { project: updatedProject, error } = await projectService.updateProject(project.id, updates)
      
      if (error) {
        console.error('Update error:', error)
        toast.error(`Failed to update status: ${error.message}`)
      } else if (updatedProject) {
        console.log('Status updated successfully')
        toast.success(`Project status updated to ${getStatusText(newStatus)}`)
        setProject(updatedProject)
      }
    } catch (error) {
      console.error('Error updating project status:', error)
      toast.error('An unexpected error occurred')
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
              <h1 className="text-lg font-semibold text-gray-900">{project.name}</h1>
              <div className="flex items-center space-x-2">
                <select
                  value={project.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="assessment">Assessment</option>
                  <option value="quote_ready">Quote Ready</option>
                  <option value="started">Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <Badge className={getPriorityColor(project.priority)}>
                  {project.priority}
                </Badge>
              </div>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push(`/projects/${projectId}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Project Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Project Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.totalBudget && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Total Budget</h4>
                <p className="text-2xl font-bold text-primary-600">
                  ${project.totalBudget.toLocaleString()}
                </p>
              </div>
            )}
            {project.notes && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                <p className="text-gray-600">{project.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job Work Items */}
        <Card>
          <CardHeader>
            <CardTitle>Work Scope & Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <JobWorkItems projectId={projectId} />
          </CardContent>
        </Card>

        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Client Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">{project.clientName}</span>
            </div>
            {project.clientEmail && (
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{project.clientEmail}</span>
              </div>
            )}
            {project.clientPhone && (
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{project.clientPhone}</span>
              </div>
            )}
            <div className="flex items-center space-x-3">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">{project.address}</span>
            </div>
          </CardContent>
        </Card>

        {/* Project Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Project Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Project Type</h4>
                <p className="text-gray-600 capitalize">{project.projectType.replace('_', ' ')}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Status</h4>
                <Badge className={getStatusColor(project.status)}>
                  {project.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
            {(project.estimatedStartDate || project.estimatedCompletionDate) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.estimatedStartDate && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Start Date</h4>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        {new Date(project.estimatedStartDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
                {project.estimatedCompletionDate && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Completion Date</h4>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">
                        {new Date(project.estimatedCompletionDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Created</h4>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Assessments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Project Assessments</span>
              <Badge variant="outline">
                {assessments.length} assessment{assessments.length !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assessments.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <FileText className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No assessments yet</h3>
                <p className="text-gray-600 mb-4">
                  Start by creating room assessments for this project.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {assessments.map((assessment) => (
                  <div
                    key={assessment.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">
                        {getRoomTypeIcon(roomTypes.find(rt => rt.name === assessment.roomType) || { name: assessment.roomType, icon: '🏠' } as RoomType)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {assessment.roomName || getRoomTypeDisplayName(assessment.roomType)}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {getRoomTypeDisplayName(assessment.roomType)} • {assessment.fixtures.length} fixtures
                        </p>
                        <p className="text-xs text-gray-500">
                          Created {assessment.createdAt ? new Date(assessment.createdAt).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getAssessmentStatusColor(assessment.status)}>
                        {assessment.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/assessment/${assessment.roomType}/edit/${assessment.id}?projectId=${projectId}`)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Quotes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span>Project Quotes</span>
                {quotes.some(quote => quote.status === 'accepted') && (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    ✓ Has Approved Quote
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {quotes.length} quote{quotes.length !== 1 ? 's' : ''}
                </Badge>
                <Button
                  size="sm"
                  onClick={() => router.push(`/projects/${projectId}/quote/new`)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Quote
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {quotes.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <DollarSign className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No quotes yet</h3>
                <p className="text-gray-600 mb-4">
                  Create a quote to provide pricing for this project.
                </p>
                <Button
                  onClick={() => router.push(`/projects/${projectId}/quote/new`)}
                >
                  Create First Quote
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {quotes.map((quote) => (
                  <div
                    key={quote.id}
                    className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ${
                      quote.status === 'accepted' 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-gray-200'
                    }`}
                    onClick={() => router.push(`/projects/${projectId}/quote/${quote.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className={`font-medium ${
                          quote.status === 'accepted' ? 'text-green-900' : 'text-gray-900'
                        }`}>
                          {quote.quoteNumber}
                        </h4>
                        <Badge className={`${getQuoteStatusColor(quote.status)} flex items-center space-x-1`}>
                          {getQuoteStatusIcon(quote.status)}
                          <span>{quote.status.replace('_', ' ')}</span>
                        </Badge>
                        {quote.status === 'accepted' && (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            ✓ Approved
                          </Badge>
                        )}
                      </div>
                      <p className={`text-sm ${
                        quote.status === 'accepted' ? 'text-green-700' : 'text-gray-600'
                      }`}>
                        {quote.items.length} items • Valid until {new Date(quote.validUntil).toLocaleDateString()}
                      </p>
                      <p className={`text-xs ${
                        quote.status === 'accepted' ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        Created {new Date(quote.createdAt!).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${
                        quote.status === 'accepted' ? 'text-green-900' : 'text-gray-900'
                      }`}>
                        ${quote.total.toFixed(2)}
                      </p>
                      <p className={`text-sm flex items-center space-x-1 ${
                        quote.status === 'accepted' ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {getQuoteStatusIcon(quote.status)}
                        <span>
                          {quote.status === 'accepted' ? 'Approved' : 
                           quote.status === 'sent' ? 'Sent to Client' :
                           quote.status === 'draft' ? 'Draft' : 
                           quote.status === 'rejected' ? 'Rejected' :
                           quote.status === 'expired' ? 'Expired' : quote.status}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Room Assessments</h4>
                <div className="grid grid-cols-2 gap-3">
                  {roomTypes.map((roomType) => (
                    <Button
                      key={roomType.id}
                      variant="outline"
                      onClick={() => router.push(`/assessment/${roomType.name}?projectId=${project.id}`)}
                      className="h-auto p-3 flex flex-col items-center space-y-2"
                    >
                      <span className="text-lg">{getRoomTypeIcon(roomType)}</span>
                      <span className="text-sm">{roomType.displayName}</span>
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Other Actions</h4>
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/projects/${projectId}/quote/new`)}
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                  >
                    <DollarSign className="h-6 w-6" />
                    <span>Create Quote</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/calculator')}
                    className="h-auto p-4 flex flex-col items-center space-y-2"
                  >
                    <Calculator className="h-6 w-6" />
                    <span>Price Calculator</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ProjectDetail() {
  return (
    <ProtectedRoute>
      <ProjectDetailContent />
    </ProtectedRoute>
  )
}
