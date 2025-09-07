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
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ProtectedRoute } from '@/components/protected-route'
import { PhotoUpload } from '@/components/photo-upload'
import { PhotoPreview } from '@/components/photo-preview'
import { assessmentService, roomService, type AssessmentData, type FixtureData, type RoomType } from '@/lib/services'
import { toast } from 'react-hot-toast'

function DynamicAssessmentContent() {
  const router = useRouter()
  const params = useParams()
  const roomTypeParam = params.roomType as string
  
  // Get project ID from URL search params
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null)
  
  const [currentStep, setCurrentStep] = useState(1)
  const [roomType, setRoomType] = useState<RoomType | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddFixture, setShowAddFixture] = useState(false)
  const [newFixtureName, setNewFixtureName] = useState('')
  const [assessmentId, setAssessmentId] = useState<string | null>(null)
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

  // Get search params and set project ID if provided
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setSearchParams(params)
    
    const projectId = params.get('projectId')
    if (projectId) {
      setAssessmentData(prev => ({
        ...prev,
        projectId: projectId
      }))
    } else {
      // If no project ID in URL, redirect to projects page
      toast.error('Assessment must be linked to a project. Please start from a project page.')
      router.push('/projects')
    }
  }, [router])

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
    { key: 'sink', label: 'Sink', icon: '🪞' },
    { key: 'toilet', label: 'Toilet', icon: '🚽' },
    { key: 'shower', label: 'Shower', icon: '🚿' },
    { key: 'bathtub', label: 'Bathtub', icon: '🛁' },
    { key: 'vanity', label: 'Vanity', icon: '🗄️' },
    { key: 'mirror', label: 'Mirror', icon: '🪞' },
    { key: 'lighting', label: 'Lighting', icon: '💡' },
    { key: 'flooring', label: 'Flooring', icon: '🏠' },
    { key: 'walls', label: 'Walls', icon: '🧱' },
    { key: 'custom', label: 'Add Custom...', icon: '➕', isCustom: true }
  ]

  const conditionOptions = [
    { value: 'excellent', label: 'Excellent', color: 'bg-green-100 text-green-800' },
    { value: 'good', label: 'Good', color: 'bg-blue-100 text-blue-800' },
    { value: 'fair', label: 'Fair', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'poor', label: 'Poor', color: 'bg-red-100 text-red-800' }
  ]

  const addFixture = (fixtureType: any) => {
    if (fixtureType.isCustom) {
      setShowAddFixture(true)
      return
    }

    const fixtureCount = assessmentData.fixtures.filter(f => f.name.toLowerCase().includes(fixtureType.label.toLowerCase())).length
    const fixtureName = fixtureCount > 0 ? `${fixtureType.label} ${fixtureCount + 1}` : fixtureType.label

    const newFixture: FixtureData = {
      id: Date.now().toString(),
      name: fixtureName,
      brand: '',
      model: '',
      condition: 'good',
      notes: ''
    }

    setAssessmentData(prev => ({
      ...prev,
      fixtures: [...prev.fixtures, newFixture]
    }))
  }

  const addCustomFixture = () => {
    if (!newFixtureName.trim()) return

    const fixtureCount = assessmentData.fixtures.filter(f => f.name.toLowerCase().includes(newFixtureName.toLowerCase())).length
    const fixtureName = fixtureCount > 0 ? `${newFixtureName} ${fixtureCount + 1}` : newFixtureName

    const newFixture: FixtureData = {
      id: Date.now().toString(),
      name: fixtureName,
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

  const updateFixture = (fixtureId: string, field: keyof FixtureData, value: any) => {
    setAssessmentData(prev => ({
      ...prev,
      fixtures: prev.fixtures.map(fixture =>
        fixture.id === fixtureId ? { ...fixture, [field]: value } : fixture
      )
    }))
  }

  const removeFixture = (fixtureId: string) => {
    setAssessmentData(prev => ({
      ...prev,
      fixtures: prev.fixtures.filter(fixture => fixture.id !== fixtureId)
    }))
  }

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
        setAssessmentData(prev => ({
          ...prev,
          roomName: fetchedRoomType?.displayName || ''
        }))
      } catch (error) {
        toast.error('Failed to load room type')
        router.push('/projects')
      } finally {
        setLoading(false)
      }
    }

    if (roomTypeParam) {
      fetchRoomType()
    }
  }, [roomTypeParam, router])


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
    try {
      const result = await assessmentService.saveDraft(assessmentData)
      
      if (result.success) {
        // Set the assessment ID for photo uploads
        if ('assessment' in result && result.assessment?.id) {
          setAssessmentId(result.assessment.id)
        }
        toast.success('Assessment saved successfully!')
        router.push('/projects/new?assessment=complete')
      } else {
        toast.error(result.error?.message || 'Failed to save assessment')
      }
    } catch (error) {
      console.error('Error saving assessment:', error)
      toast.error('An unexpected error occurred')
    }
  }

  const ensureAssessmentId = async () => {
    if (!assessmentId) {
      try {
        const result = await assessmentService.saveDraft(assessmentData)
        if (result.success && 'assessment' in result && result.assessment?.id) {
          setAssessmentId(result.assessment.id)
          return result.assessment.id
        }
      } catch (error) {
        console.error('Error creating assessment for photos:', error)
        toast.error('Failed to prepare assessment for photo upload')
      }
    }
    return assessmentId
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
                    Room Name (Optional)
                  </label>
                  <Input
                    value={assessmentData.roomName}
                    onChange={(e) => setAssessmentData(prev => ({ ...prev, roomName: e.target.value }))}
                    placeholder="e.g., Master Bathroom, Guest Bath, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project ID {assessmentData.projectId ? '(Linked)' : '(Required)'}
                  </label>
                  <Input
                    value={assessmentData.projectId}
                    onChange={(e) => setAssessmentData(prev => ({ ...prev, projectId: e.target.value }))}
                    placeholder="Enter project ID"
                    disabled={!!searchParams?.get('projectId')}
                    className={searchParams?.get('projectId') ? 'bg-gray-50' : ''}
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {assessmentData.projectId 
                      ? 'This assessment is automatically linked to your project.'
                      : 'Every assessment must be linked to a project. Please create a project first or enter an existing project ID.'
                    }
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">
                        {roomType?.displayName} Assessment
                      </h4>
                      <p className="text-sm text-blue-700 mt-1">
                        {roomType?.description || 'This assessment will help determine the scope of work and provide accurate pricing for the room remodel.'}
                      </p>
                      {assessmentData.projectId && (
                        <p className="text-sm text-green-700 mt-2 font-medium">
                          ✓ Linked to Project ID: {assessmentData.projectId}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {fixtureTypes.map((fixture) => (
                <Button
                  key={fixture.key}
                  variant="outline"
                  size="sm"
                  onClick={() => addFixture(fixture)}
                >
                  {fixture.icon} {fixture.label}
                </Button>
              ))}
            </div>
            
            {/* Custom Fixture Input */}
            {showAddFixture && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Input
                      value={newFixtureName}
                      onChange={(e) => setNewFixtureName(e.target.value)}
                      placeholder="Enter custom fixture name (e.g., Medicine Cabinet, Towel Rack)"
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && addCustomFixture()}
                    />
                    <Button onClick={addCustomFixture} disabled={!newFixtureName.trim()}>
                      Add
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setShowAddFixture(false)
                      setNewFixtureName('')
                    }}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {assessmentData.fixtures.map((fixture) => (
              <Card key={fixture.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <Input
                      value={fixture.name}
                      onChange={(e) => updateFixture(fixture.id, 'name', e.target.value)}
                      className="font-semibold text-lg border-none p-0 bg-transparent focus:bg-white focus:border focus:px-2 focus:py-1"
                      placeholder="Fixture name"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFixture(fixture.id)}
                    >
                      Remove
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Brand
                      </label>
                      <Input
                        value={fixture.brand}
                        onChange={(e) => updateFixture(fixture.id, 'brand', e.target.value)}
                        placeholder="Brand name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Model
                      </label>
                      <Input
                        value={fixture.model}
                        onChange={(e) => updateFixture(fixture.id, 'model', e.target.value)}
                        placeholder="Model number"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Size/Dimensions
                    </label>
                    <Input
                      value={fixture.size || ''}
                      onChange={(e) => updateFixture(fixture.id, 'size', e.target.value)}
                      placeholder="e.g., 24 x 18 or Standard"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Condition
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {conditionOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateFixture(fixture.id, 'condition', option.value as any)}
                          className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                            fixture.condition === option.value
                              ? option.color
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={fixture.notes || ''}
                      onChange={(e) => updateFixture(fixture.id, 'notes', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                      rows={3}
                      placeholder="Additional notes about this fixture..."
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Ruler className="h-5 w-5" />
                  <span>Room Measurements</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Room Width
                    </label>
                    <Input
                      type="number"
                      value={assessmentData.measurements.width}
                      onChange={(e) => updateMeasurement('width', parseFloat(e.target.value) || 0)}
                      placeholder="e.g., 8.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Room Length
                    </label>
                    <Input
                      type="number"
                      value={assessmentData.measurements.length}
                      onChange={(e) => updateMeasurement('length', parseFloat(e.target.value) || 0)}
                      placeholder="e.g., 10.2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ceiling Height
                  </label>
                  <Input
                    type="number"
                    value={assessmentData.measurements.height}
                    onChange={(e) => updateMeasurement('height', parseFloat(e.target.value) || 0)}
                    placeholder="e.g., 8"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={assessmentData.measurements.notes || ''}
                    onChange={(e) => updateMeasurement('notes', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                    rows={3}
                    placeholder="Additional measurement notes..."
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
                  assessmentId={assessmentId || undefined}
                  onEnsureAssessmentId={ensureAssessmentId}
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
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Name
                  </label>
                  <Input
                    value={assessmentData.roomName}
                    onChange={(e) => setAssessmentData(prev => ({ ...prev, roomName: e.target.value }))}
                    placeholder={`e.g., Main ${roomType?.displayName}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={assessmentData.notes || ''}
                    onChange={(e) => setAssessmentData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                    rows={4}
                    placeholder="Any additional notes or special requirements..."
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
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Assessment Information</h4>
                    <p className="text-sm text-gray-600">Project ID: {assessmentData.projectId}</p>
                    <p className="text-sm text-gray-600">Room Type: {roomType?.displayName}</p>
                    <p className="text-sm text-gray-600">Room Name: {assessmentData.roomName}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Fixtures Assessed</h4>
                    <div className="space-y-2">
                      {assessmentData.fixtures.map((fixture) => (
                        <div key={fixture.id} className="text-sm flex items-center justify-between">
                          <span className="font-medium">{fixture.name}</span>
                          <Badge variant={fixture.condition === 'poor' ? 'destructive' : 'default'}>
                            {fixture.condition}
                          </Badge>
                        </div>
                      ))}
                      {assessmentData.fixtures.length === 0 && (
                        <p className="text-sm text-gray-500">No fixtures added yet</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Room Measurements</h4>
                    <div className="text-sm text-gray-600">
                      <p>Width: {assessmentData.measurements.width} ft</p>
                      <p>Length: {assessmentData.measurements.length} ft</p>
                      <p>Height: {assessmentData.measurements.height} ft</p>
                      {assessmentData.measurements.notes && (
                        <p className="mt-2">Notes: {assessmentData.measurements.notes}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Photos</h4>
                    <PhotoPreview
                      photos={assessmentData.photos}
                      showRemoveButton={false}
                    />
                  </div>
                  {assessmentData.notes && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Additional Notes</h4>
                      <p className="text-sm text-gray-600">{assessmentData.notes}</p>
                    </div>
                  )}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-900">
                        Assessment complete and ready to submit
                      </span>
                    </div>
                  </div>
                </div>
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading room type...</p>
        </div>
      </div>
    )
  }

  if (!roomType) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Room Type Not Found</h2>
          <p className="text-gray-600 mb-4">The requested room type could not be found.</p>
          <Button onClick={() => router.push('/projects')}>
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
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
              <h1 className="text-lg font-semibold text-gray-900">
                {roomType.displayName} Assessment
              </h1>
              <p className="text-sm text-gray-500">Step {currentStep} of {steps.length}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                currentStep >= step.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {currentStep > step.id ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  step.id
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-2 ${
                  currentStep > step.id ? 'bg-primary-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-50">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          <div className="text-sm text-gray-500">
            {currentStep} of {steps.length}
          </div>
          <Button
            onClick={() => {
              if (currentStep === steps.length) {
                handleSave()
              } else {
                setCurrentStep(prev => Math.min(steps.length, prev + 1))
              }
            }}
          >
            {currentStep === steps.length ? 'Submit Assessment' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function DynamicAssessment() {
  return (
    <ProtectedRoute>
      <DynamicAssessmentContent />
    </ProtectedRoute>
  )
}
