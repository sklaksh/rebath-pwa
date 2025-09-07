'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  Save, 
  Camera, 
  Ruler, 
  CheckCircle,
  AlertCircle,
  Info,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ProtectedRoute } from '@/components/protected-route'
import { PageHeader } from '@/components/page-header'
import { PhotoUpload } from '@/components/photo-upload'
import { PhotoPreview } from '@/components/photo-preview'
import { assessmentService, roomService, type AssessmentData, type FixtureData, type RoomType } from '@/lib/services'
import { toast } from 'react-hot-toast'

function EditAssessmentContent() {
  const router = useRouter()
  const params = useParams()
  const roomTypeParam = params.roomType as string
  const assessmentId = params.id as string
  
  // Get project ID from URL search params
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null)
  
  const [currentStep, setCurrentStep] = useState(1)
  const [roomType, setRoomType] = useState<RoomType | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddFixture, setShowAddFixture] = useState(false)
  const [newFixtureName, setNewFixtureName] = useState('')
  const [assessmentData, setAssessmentData] = useState<AssessmentData>({
    projectId: '',
    roomType: roomTypeParam,
    roomName: '',
    fixtures: [],
    measurements: {
      width: 0,
      length: 0,
      height: 0,
      notes: ''
    },
    photos: [],
    notes: '',
    status: 'draft'
  })

  const steps = [
    { id: 1, title: 'Assessment Info', description: 'Basic assessment information' },
    { id: 2, title: 'Fixtures', description: 'Assess existing fixtures' },
    { id: 3, title: 'Measurements', description: 'Room dimensions' },
    { id: 4, title: 'Photos', description: 'Add room photos' },
    { id: 5, title: 'Requirements', description: 'Additional information' },
    { id: 6, title: 'Review', description: 'Review and submit' }
  ]

  const fixtureTypes = [
    { key: 'faucet', label: 'Faucet', icon: '🚰' },
    { key: 'toilet', label: 'Toilet', icon: '🚽' },
    { key: 'shower', label: 'Shower', icon: '🚿' },
    { key: 'bathtub', label: 'Bathtub', icon: '🛁' },
    { key: 'vanity', label: 'Vanity', icon: '🪞' },
    { key: 'mirror', label: 'Mirror', icon: '🪞' },
    { key: 'lighting', label: 'Lighting', icon: '💡' },
    { key: 'tile', label: 'Tile', icon: '🔲' },
    { key: 'flooring', label: 'Flooring', icon: '🏠' },
    { key: 'other', label: 'Other', icon: '📦' }
  ]

  // Get search params and set project ID if provided
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setSearchParams(params)
    
    if (params.get('projectId')) {
      setAssessmentData(prev => ({
        ...prev,
        projectId: params.get('projectId')!
      }))
    }
  }, [])

  // Load existing assessment data
  useEffect(() => {
    const loadAssessment = async () => {
      try {
        const { assessment, error } = await assessmentService.getAssessment(assessmentId)
        if (error) {
          toast.error('Assessment not found')
          router.push('/projects')
          return
        }
        
        if (assessment) {
          setAssessmentData(assessment)
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
          toast.error('Room type not found')
          router.push('/projects')
          return
        }
        setRoomType(fetchedRoomType)
      } catch (error) {
        toast.error('Failed to load room type')
        router.push('/projects')
      }
    }

    if (roomTypeParam) {
      fetchRoomType()
    }
  }, [roomTypeParam, router])

  const addFixture = () => {
    if (!newFixtureName.trim()) return
    
    const newFixture: FixtureData = {
      id: Date.now().toString(),
      name: newFixtureName.trim(),
      brand: '',
      model: '',
      condition: 'good',
      notes: ''
    }
    
    setAssessmentData(prev => ({
      ...prev,
      fixtures: [...prev.fixtures, newFixture]
    }))
    
    setNewFixtureName('')
    setShowAddFixture(false)
  }

  const updateFixture = (fixtureId: string, field: keyof FixtureData, value: string) => {
    setAssessmentData(prev => ({
      ...prev,
      fixtures: prev.fixtures.map(fixture =>
        fixture.id === fixtureId
          ? { ...fixture, [field]: value }
          : fixture
      )
    }))
  }

  const removeFixture = (fixtureId: string) => {
    setAssessmentData(prev => ({
      ...prev,
      fixtures: prev.fixtures.filter(fixture => fixture.id !== fixtureId)
    }))
  }

  const updateMeasurement = (field: keyof AssessmentData['measurements'], value: number | string) => {
    setAssessmentData(prev => ({
      ...prev,
      measurements: {
        ...prev.measurements,
        [field]: value
      }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      console.log('Saving assessment:', { 
        assessmentId, 
        assessmentData: {
          ...assessmentData,
          photos: assessmentData.photos
        }
      })
      console.log('Photos array being saved:', assessmentData.photos)
      const result = await assessmentService.updateAssessment(assessmentId, assessmentData)
      console.log('Save result:', result)
      
      if (result.error) {
        console.error('Save error:', result.error)
        toast.error(`Failed to save assessment: ${result.error.message}`)
      } else {
        toast.success('Assessment saved successfully!')
        // Reload the assessment data to ensure we have the latest from database
        const { assessment: updatedAssessment, error: reloadError } = await assessmentService.getAssessment(assessmentId)
        if (!reloadError && updatedAssessment) {
          setAssessmentData(updatedAssessment)
          console.log('Assessment data reloaded after save:', updatedAssessment)
        }
        router.back()
      }
    } catch (error) {
      console.error('Error saving assessment:', error)
      toast.error(`Failed to save assessment: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  const handleStepClick = (stepId: number) => {
    setCurrentStep(stepId)
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Assessment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Type
                  </label>
                  <Input
                    value={roomType?.displayName || assessmentData.roomType}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Name
                  </label>
                  <Input
                    value={assessmentData.roomName}
                    onChange={(e) => setAssessmentData(prev => ({ ...prev, roomName: e.target.value }))}
                    placeholder="e.g., Master Bathroom, Guest Bathroom"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project ID
                  </label>
                  <Input
                    value={assessmentData.projectId}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Existing Fixtures</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assessmentData.fixtures.map((fixture) => (
                    <div key={fixture.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium">{fixture.name}</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFixture(fixture.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Brand</label>
                          <Input
                            value={fixture.brand}
                            onChange={(e) => updateFixture(fixture.id, 'brand', e.target.value)}
                            placeholder="Brand name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Model</label>
                          <Input
                            value={fixture.model}
                            onChange={(e) => updateFixture(fixture.id, 'model', e.target.value)}
                            placeholder="Model number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Condition</label>
                          <select
                            value={fixture.condition}
                            onChange={(e) => updateFixture(fixture.id, 'condition', e.target.value as any)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                          >
                            <option value="excellent">Excellent</option>
                            <option value="good">Good</option>
                            <option value="fair">Fair</option>
                            <option value="poor">Poor</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Size</label>
                          <Input
                            value={fixture.size || ''}
                            onChange={(e) => updateFixture(fixture.id, 'size', e.target.value)}
                            placeholder="Dimensions"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Notes</label>
                        <textarea
                          value={fixture.notes || ''}
                          onChange={(e) => updateFixture(fixture.id, 'notes', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md resize-none"
                          rows={2}
                          placeholder="Additional notes about this fixture..."
                        />
                      </div>
                    </div>
                  ))}
                  
                  {showAddFixture ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <div className="space-y-3">
                        <Input
                          value={newFixtureName}
                          onChange={(e) => setNewFixtureName(e.target.value)}
                          placeholder="Fixture name (e.g., Kitchen Faucet, Bathroom Vanity)"
                          onKeyPress={(e) => e.key === 'Enter' && addFixture()}
                        />
                        <div className="flex gap-2">
                          <Button onClick={addFixture} size="sm">
                            Add Fixture
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowAddFixture(false)
                              setNewFixtureName('')
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setShowAddFixture(true)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Fixture
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Room Measurements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Width (ft)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={assessmentData.measurements.width || ''}
                      onChange={(e) => updateMeasurement('width', parseFloat(e.target.value) || 0)}
                      placeholder="0.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Length (ft)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={assessmentData.measurements.length || ''}
                      onChange={(e) => updateMeasurement('length', parseFloat(e.target.value) || 0)}
                      placeholder="0.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Height (ft)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={assessmentData.measurements.height || ''}
                      onChange={(e) => updateMeasurement('height', parseFloat(e.target.value) || 0)}
                      placeholder="0.0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Measurement Notes
                  </label>
                  <textarea
                    value={assessmentData.measurements.notes || ''}
                    onChange={(e) => updateMeasurement('notes', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                    rows={3}
                    placeholder="Any additional notes about measurements..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Room Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <PhotoUpload
                  photos={assessmentData.photos}
                  onPhotosChange={(photos) => setAssessmentData(prev => ({ ...prev, photos }))}
                  assessmentId={assessmentId}
                />
              </CardContent>
            </Card>
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Additional Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes & Requirements
                  </label>
                  <textarea
                    value={assessmentData.notes || ''}
                    onChange={(e) => setAssessmentData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                    rows={6}
                    placeholder="Any additional notes, requirements, or special considerations for this room..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 6:
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Review Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Assessment Summary</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <p><strong>Room:</strong> {assessmentData.roomName}</p>
                    <p><strong>Type:</strong> {roomType?.displayName}</p>
                    <p><strong>Fixtures:</strong> {assessmentData.fixtures.length}</p>
                    <p><strong>Photos:</strong> {assessmentData.photos.length}</p>
                    <p><strong>Status:</strong> {assessmentData.status}</p>
                  </div>
                </div>
                
                {assessmentData.photos.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Photos</h4>
                    <PhotoPreview
                      photos={assessmentData.photos}
                      onUpdate={(index, newPhotoUrl) => {
                        const updatedPhotos = [...assessmentData.photos]
                        updatedPhotos[index] = newPhotoUrl
                        setAssessmentData(prev => ({ ...prev, photos: updatedPhotos }))
                      }}
                      showRemoveButton={false}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
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

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title={`Edit ${roomType?.displayName || 'Assessment'}`}
        backHref={assessmentData.projectId ? `/projects/${assessmentData.projectId}` : "/projects"}
      />

      <div className="max-w-4xl mx-auto p-4">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {steps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(step.id)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    currentStep === step.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        currentStep >= step.id
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {currentStep > step.id ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <span>{step.title}</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Step Content */}
        {renderStepContent()}

        {/* Save/Cancel Buttons - Always Visible */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            {currentStep < steps.length && (
              <Button
                onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
              >
                Next
                <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
              </Button>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={handleCancel}
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
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Assessment
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EditAssessmentPage() {
  return (
    <ProtectedRoute>
      <EditAssessmentContent />
    </ProtectedRoute>
  )
}