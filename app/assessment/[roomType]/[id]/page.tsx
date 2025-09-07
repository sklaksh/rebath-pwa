'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Edit, 
  Camera, 
  Ruler, 
  CheckCircle,
  AlertCircle,
  Info,
  Calendar,
  User,
  MapPin
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProtectedRoute } from '@/components/protected-route'
import { PageHeader } from '@/components/page-header'
import { PhotoPreview } from '@/components/photo-preview'
import { assessmentService, roomService, type AssessmentData, type FixtureData, type RoomType } from '@/lib/services'
import { toast } from 'react-hot-toast'

function ViewAssessmentContent() {
  const router = useRouter()
  const params = useParams()
  const roomTypeParam = params.roomType as string
  const assessmentId = params.id as string
  
  const [assessment, setAssessment] = useState<AssessmentData | null>(null)
  const [roomType, setRoomType] = useState<RoomType | null>(null)
  const [loading, setLoading] = useState(true)

  // Load assessment data
  useEffect(() => {
    const loadAssessment = async () => {
      try {
        const { assessment: fetchedAssessment, error } = await assessmentService.getAssessment(assessmentId)
        if (error) {
          toast.error('Assessment not found')
          router.push('/projects')
          return
        }
        
        if (fetchedAssessment) {
          setAssessment(fetchedAssessment)
        }
      } catch (error) {
        toast.error('Failed to load assessment')
        router.push('/projects')
      } finally {
        setLoading(false)
      }
    }

    if (assessmentId) {
      loadAssessment()
    }
  }, [assessmentId, router])

  // Load room type data
  useEffect(() => {
    const fetchRoomType = async () => {
      try {
        const { roomType: fetchedRoomType, error } = await roomService.getRoomType(roomTypeParam)
        if (error) {
          console.error('Room type not found:', error)
          return
        }
        setRoomType(fetchedRoomType)
      } catch (error) {
        console.error('Failed to load room type:', error)
      }
    }

    if (roomTypeParam) {
      fetchRoomType()
    }
  }, [roomTypeParam])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'submitted':
        return 'bg-blue-100 text-blue-800'
      case 'reviewed':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent':
        return 'bg-green-100 text-green-800'
      case 'good':
        return 'bg-blue-100 text-blue-800'
      case 'fair':
        return 'bg-yellow-100 text-yellow-800'
      case 'poor':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    )
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Assessment not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title={`${assessment.roomName} Assessment`}
        backHref="/projects"
      />

      <div className="max-w-4xl mx-auto p-4">
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500">
              {roomType?.displayName || assessment.roomType}
            </span>
          </div>
          <Button
            onClick={() => router.push(`/assessment/${assessment.roomType}/edit/${assessment.id}?projectId=${assessment.projectId}`)}
            className="bg-primary-600 hover:bg-primary-700"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Assessment
          </Button>
        </div>

        <div className="space-y-6">
          {/* Assessment Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="h-5 w-5 mr-2" />
                Assessment Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Room Name</label>
                    <p className="text-gray-900">{assessment.roomName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Room Type</label>
                    <p className="text-gray-900">{roomType?.displayName || assessment.roomType}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created</label>
                    <p className="text-gray-900">
                      {assessment.createdAt ? new Date(assessment.createdAt).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                    <p className="text-gray-900">
                      {assessment.updatedAt ? new Date(assessment.updatedAt).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Project ID</label>
                    <p className="text-gray-900 font-mono text-sm">{assessment.projectId}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fixtures */}
          {assessment.fixtures && assessment.fixtures.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Ruler className="h-5 w-5 mr-2" />
                  Existing Fixtures ({assessment.fixtures.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assessment.fixtures.map((fixture) => (
                    <div key={fixture.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium text-lg">{fixture.name}</h4>
                        <Badge className={getConditionColor(fixture.condition)}>
                          {fixture.condition}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        {fixture.brand && (
                          <div>
                            <span className="font-medium text-gray-700">Brand:</span>
                            <span className="ml-2 text-gray-900">{fixture.brand}</span>
                          </div>
                        )}
                        {fixture.model && (
                          <div>
                            <span className="font-medium text-gray-700">Model:</span>
                            <span className="ml-2 text-gray-900">{fixture.model}</span>
                          </div>
                        )}
                        {fixture.size && (
                          <div>
                            <span className="font-medium text-gray-700">Size:</span>
                            <span className="ml-2 text-gray-900">{fixture.size}</span>
                          </div>
                        )}
                        {fixture.material && (
                          <div>
                            <span className="font-medium text-gray-700">Material:</span>
                            <span className="ml-2 text-gray-900">{fixture.material}</span>
                          </div>
                        )}
                        {fixture.color && (
                          <div>
                            <span className="font-medium text-gray-700">Color:</span>
                            <span className="ml-2 text-gray-900">{fixture.color}</span>
                          </div>
                        )}
                      </div>
                      {fixture.notes && (
                        <div className="mt-3">
                          <span className="font-medium text-gray-700">Notes:</span>
                          <p className="text-gray-900 mt-1">{fixture.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Measurements */}
          {assessment.measurements && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Ruler className="h-5 w-5 mr-2" />
                  Room Measurements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary-600">
                      {assessment.measurements.width || 0}
                    </div>
                    <div className="text-sm text-gray-600">Width (ft)</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary-600">
                      {assessment.measurements.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Length (ft)</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary-600">
                      {assessment.measurements.height || 0}
                    </div>
                    <div className="text-sm text-gray-600">Height (ft)</div>
                  </div>
                </div>
                {assessment.measurements.notes && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Measurement Notes</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {assessment.measurements.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Photos */}
          {assessment.photos && assessment.photos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="h-5 w-5 mr-2" />
                  Room Photos ({assessment.photos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PhotoPreview
                  photos={assessment.photos}
                  showRemoveButton={false}
                />
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {assessment.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="h-5 w-5 mr-2" />
                  Additional Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-900 whitespace-pre-wrap">{assessment.notes}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Data Messages */}
          {(!assessment.fixtures || assessment.fixtures.length === 0) && 
           (!assessment.photos || assessment.photos.length === 0) && 
           !assessment.notes && (
            <Card>
              <CardContent className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No additional assessment data available</p>
                <p className="text-sm text-gray-400 mt-2">
                  Edit the assessment to add fixtures, photos, and notes
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ViewAssessmentPage() {
  return (
    <ProtectedRoute>
      <ViewAssessmentContent />
    </ProtectedRoute>
  )
}
