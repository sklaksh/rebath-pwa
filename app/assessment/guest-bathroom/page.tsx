'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { assessmentService, type AssessmentData } from '@/lib/services'
import { toast } from 'react-hot-toast'

function GuestBathroomAssessmentContent() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [assessmentData, setAssessmentData] = useState<AssessmentData>({
    projectId: '',
    roomType: 'guest_bathroom',
    fixtures: {
      faucet: { type: 'faucet', brand: '', model: '', size: '', condition: 'good', notes: '', photos: [] },
      sink: { type: 'sink', brand: '', model: '', size: '', condition: 'good', notes: '', photos: [] },
      toilet: { type: 'toilet', brand: '', model: '', size: '', condition: 'good', notes: '', photos: [] },
      shower: { type: 'shower', brand: '', model: '', size: '', condition: 'good', notes: '', photos: [] },
      bathtub: { type: 'bathtub', brand: '', model: '', size: '', condition: 'good', notes: '', photos: [] },
      vanity: { type: 'vanity', brand: '', model: '', size: '', condition: 'good', notes: '', photos: [] },
      mirror: { type: 'mirror', brand: '', model: '', size: '', condition: 'good', notes: '', photos: [] },
      lighting: { type: 'lighting', brand: '', model: '', size: '', condition: 'good', notes: '', photos: [] },
      flooring: { type: 'flooring', brand: '', model: '', size: '', condition: 'good', notes: '', photos: [] },
      walls: { type: 'walls', brand: '', model: '', size: '', condition: 'good', notes: '', photos: [] }
    },
    measurements: {
      roomWidth: '',
      roomLength: '',
      ceilingHeight: '',
      windowWidth: '',
      windowHeight: '',
      doorWidth: '',
      doorHeight: ''
    },
    clientRequests: [],
    estimatedTimeline: '',
    priority: 'medium',
    notes: ''
  })

  const steps = [
    { id: 1, title: 'Project Info', description: 'Basic project information' },
    { id: 2, title: 'Fixtures', description: 'Assess existing fixtures' },
    { id: 3, title: 'Measurements', description: 'Room dimensions' },
    { id: 4, title: 'Requirements', description: 'Client requests & timeline' },
    { id: 5, title: 'Review', description: 'Review and submit' }
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
    { key: 'walls', label: 'Walls', icon: '🧱' }
  ]

  const conditionOptions = [
    { value: 'good', label: 'Good', color: 'bg-green-100 text-green-800' },
    { value: 'fair', label: 'Fair', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'poor', label: 'Poor', color: 'bg-orange-100 text-orange-800' },
    { value: 'needs_replacement', label: 'Needs Replacement', color: 'bg-red-100 text-red-800' }
  ]

  const updateFixture = (fixtureKey: keyof AssessmentData['fixtures'], field: keyof FixtureData, value: any) => {
    setAssessmentData(prev => ({
      ...prev,
      fixtures: {
        ...prev.fixtures,
        [fixtureKey]: {
          ...prev.fixtures[fixtureKey],
          [field]: value
        }
      }
    }))
  }

  const updateMeasurement = (field: keyof AssessmentData['measurements'], value: string) => {
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

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project ID
                  </label>
                  <Input
                    value={assessmentData.projectId}
                    onChange={(e) => setAssessmentData(prev => ({ ...prev, projectId: e.target.value }))}
                    placeholder="Enter project ID"
                  />
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">Guest Bathroom Assessment</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        This assessment will help determine the scope of work and provide accurate pricing for the guest bathroom remodel.
                      </p>
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
            {fixtureTypes.map((fixture) => {
              const fixtureData = assessmentData.fixtures[fixture.key as keyof AssessmentData['fixtures']]
              return (
                <Card key={fixture.key}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{fixture.icon}</span>
                      <span>{fixture.label}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Brand
                        </label>
                        <Input
                          value={fixtureData.brand}
                          onChange={(e) => updateFixture(fixture.key as keyof AssessmentData['fixtures'], 'brand', e.target.value)}
                          placeholder="Brand name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Model
                        </label>
                        <Input
                          value={fixtureData.model}
                          onChange={(e) => updateFixture(fixture.key as keyof AssessmentData['fixtures'], 'model', e.target.value)}
                          placeholder="Model number"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Size/Dimensions
                      </label>
                      <Input
                        value={fixtureData.size}
                        onChange={(e) => updateFixture(fixture.key as keyof AssessmentData['fixtures'], 'size', e.target.value)}
                        placeholder="e.g., 24\" x 18\" or Standard"
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
                            onClick={() => updateFixture(fixture.key as keyof AssessmentData['fixtures'], 'condition', option.value)}
                            className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                              fixtureData.condition === option.value
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
                        value={fixtureData.notes}
                        onChange={(e) => updateFixture(fixture.key as keyof AssessmentData['fixtures'], 'notes', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                        rows={3}
                        placeholder="Additional notes about this fixture..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Photos
                      </label>
                      <Button variant="outline" className="w-full">
                        <Camera className="h-4 w-4 mr-2" />
                        Add Photos
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
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
                      value={assessmentData.measurements.roomWidth}
                      onChange={(e) => updateMeasurement('roomWidth', e.target.value)}
                      placeholder="e.g., 8' 6\""
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Room Length
                    </label>
                    <Input
                      value={assessmentData.measurements.roomLength}
                      onChange={(e) => updateMeasurement('roomLength', e.target.value)}
                      placeholder="e.g., 10' 2\""
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ceiling Height
                  </label>
                  <Input
                    value={assessmentData.measurements.ceilingHeight}
                    onChange={(e) => updateMeasurement('ceilingHeight', e.target.value)}
                    placeholder="e.g., 8'"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Window Width
                    </label>
                    <Input
                      value={assessmentData.measurements.windowWidth}
                      onChange={(e) => updateMeasurement('windowWidth', e.target.value)}
                      placeholder="e.g., 3'"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Window Height
                    </label>
                    <Input
                      value={assessmentData.measurements.windowHeight}
                      onChange={(e) => updateMeasurement('windowHeight', e.target.value)}
                      placeholder="e.g., 4'"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Door Width
                    </label>
                    <Input
                      value={assessmentData.measurements.doorWidth}
                      onChange={(e) => updateMeasurement('doorWidth', e.target.value)}
                      placeholder="e.g., 2' 8\""
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Door Height
                    </label>
                    <Input
                      value={assessmentData.measurements.doorHeight}
                      onChange={(e) => updateMeasurement('doorHeight', e.target.value)}
                      placeholder="e.g., 6' 8\""
                    />
                  </div>
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
                <CardTitle>Client Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Requests
                  </label>
                  <div className="space-y-2">
                    {[
                      'Modern fixtures',
                      'Accessibility features',
                      'Energy efficient',
                      'Luxury finishes',
                      'Quick installation',
                      'Budget friendly'
                    ].map((request) => (
                      <label key={request} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={assessmentData.clientRequests.includes(request)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAssessmentData(prev => ({
                                ...prev,
                                clientRequests: [...prev.clientRequests, request]
                              }))
                            } else {
                              setAssessmentData(prev => ({
                                ...prev,
                                clientRequests: prev.clientRequests.filter(r => r !== request)
                              }))
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">{request}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Timeline
                  </label>
                  <select
                    value={assessmentData.estimatedTimeline}
                    onChange={(e) => setAssessmentData(prev => ({ ...prev, estimatedTimeline: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select timeline</option>
                    <option value="1-2_weeks">1-2 weeks</option>
                    <option value="2-4_weeks">2-4 weeks</option>
                    <option value="1-2_months">1-2 months</option>
                    <option value="2-3_months">2-3 months</option>
                    <option value="3+_months">3+ months</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
                      { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
                      { value: 'high', label: 'High', color: 'bg-red-100 text-red-800' }
                    ].map((priority) => (
                      <button
                        key={priority.value}
                        type="button"
                        onClick={() => setAssessmentData(prev => ({ ...prev, priority: priority.value as any }))}
                        className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                          assessmentData.priority === priority.value
                            ? priority.color
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {priority.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={assessmentData.notes}
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

      case 5:
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Review Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Project Information</h4>
                    <p className="text-sm text-gray-600">Project ID: {assessmentData.projectId || 'Not specified'}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Fixtures Assessed</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {fixtureTypes.map((fixture) => {
                        const fixtureData = assessmentData.fixtures[fixture.key as keyof AssessmentData['fixtures']]
                        return (
                          <div key={fixture.key} className="text-sm">
                            <span className="font-medium">{fixture.label}:</span>
                            <Badge className="ml-1" variant={fixtureData.condition === 'needs_replacement' ? 'destructive' : 'default'}>
                              {fixtureData.condition.replace('_', ' ')}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Client Requests</h4>
                    <div className="flex flex-wrap gap-1">
                      {assessmentData.clientRequests.map((request) => (
                        <Badge key={request} variant="secondary">
                          {request}
                        </Badge>
                      ))}
                    </div>
                  </div>
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
              <h1 className="text-lg font-semibold text-gray-900">Guest Bathroom Assessment</h1>
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
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

export default function GuestBathroomAssessment() {
  return (
    <ProtectedRoute>
      <GuestBathroomAssessmentContent />
    </ProtectedRoute>
  )
}
