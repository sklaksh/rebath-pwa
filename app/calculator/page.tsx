'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Calculator, 
  DollarSign, 
  Percent, 
  FileText,
  Download,
  Send,
  ShoppingCart,
  Clock,
  CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ProtectedRoute } from '@/components/protected-route'
import { pricingService, type CalculatorPricingData, type SelectedFixture } from '@/lib/services'
import type { FixtureOption } from '@/lib/services/pricing.service'
import { toast } from 'react-hot-toast'

function PricingCalculatorContent() {
  const router = useRouter()
  const [pricingData, setPricingData] = useState<CalculatorPricingData>({
    fixtures: [],
    laborRate: 85,
    discountPercent: 0,
    taxRate: 8.25,
    projectName: '',
    clientName: '',
    notes: ''
  })

  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showQuote, setShowQuote] = useState(false)

  const [fixtureOptions, setFixtureOptions] = useState<FixtureOption[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string; icon: string }[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch fixture options and categories on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fixturesResult, categoriesResult] = await Promise.all([
          pricingService.getFixtureOptions(),
          pricingService.getFixtureCategories()
        ])
        
        if (fixturesResult.fixtures) {
          setFixtureOptions(fixturesResult.fixtures)
        }
        
        if (categoriesResult.categories) {
          setCategories(categoriesResult.categories)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  const filteredFixtures = pricingService.filterFixturesByCategory(fixtureOptions, selectedCategory)

  const addFixture = (fixture: FixtureOption) => {
    const existingIndex = pricingData.fixtures.findIndex(f => f.fixture.id === fixture.id)
    if (existingIndex >= 0) {
      setPricingData(prev => ({
        ...prev,
        fixtures: prev.fixtures.map((f, i) => 
          i === existingIndex ? { ...f, quantity: f.quantity + 1 } : f
        )
      }))
    } else {
      setPricingData(prev => ({
        ...prev,
        fixtures: [...prev.fixtures, { fixture, quantity: 1 }]
      }))
    }
  }

  const removeFixture = (fixtureId: string) => {
    setPricingData(prev => ({
      ...prev,
      fixtures: prev.fixtures.filter(f => f.fixture.id !== fixtureId)
    }))
  }

  const updateFixtureQuantity = (fixtureId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFixture(fixtureId)
      return
    }
    
    setPricingData(prev => ({
      ...prev,
      fixtures: prev.fixtures.map(f => 
        f.fixture.id === fixtureId ? { ...f, quantity } : f
      )
    }))
  }

  const updateFixturePrice = (fixtureId: string, customPrice: number) => {
    setPricingData(prev => ({
      ...prev,
      fixtures: prev.fixtures.map(f => 
        f.fixture.id === fixtureId ? { ...f, customPrice } : f
      )
    }))
  }

  // Calculate totals using pricing service
  const calculations = pricingService.calculatePricing(pricingData)
  const { subtotal, laborCost, discountAmount, taxAmount, total, totalLaborHours } = calculations

  const generateQuote = async () => {
    // Convert calculator data to SelectedFixture format for quote generation
    const selectedFixtures: SelectedFixture[] = pricingData.fixtures.map(item => ({
      fixtureId: item.fixture.id,
      name: item.fixture.name,
      brand: item.fixture.brand,
      model: item.fixture.name,
      basePrice: item.customPrice || item.fixture.basePrice,
      installationCost: item.fixture.laborHours * pricingData.laborRate,
      quantity: item.quantity,
      totalPrice: (item.customPrice || item.fixture.basePrice) * item.quantity
    }))
    
    const result = await pricingService.generateQuote('temp-project-id', selectedFixtures)
    if (result.error) {
      toast.error(result.error.message)
    } else {
      setShowQuote(true)
      toast.success('Quote generated successfully!')
    }
  }

  const downloadQuote = async () => {
    // TODO: Get the generated quote from state
    toast('PDF download feature coming soon!')
  }

  const sendQuote = async () => {
    // TODO: Get the generated quote from state
    toast('Email feature coming soon!')
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
              <h1 className="text-lg font-semibold text-gray-900">Pricing Calculator</h1>
              <p className="text-sm text-gray-500">Calculate project costs and generate quotes</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={generateQuote}
              disabled={pricingData.fixtures.length === 0}
            >
              <FileText className="h-4 w-4 mr-2" />
              Generate Quote
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading fixtures and categories...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Project Information */}
        <Card>
          <CardHeader>
            <CardTitle>Project Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                <Input
                  value={pricingData.projectName}
                  onChange={(e) => setPricingData(prev => ({ ...prev, projectName: e.target.value }))}
                  placeholder="e.g., Smith Master Bath Remodel"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Name
                </label>
                <Input
                  value={pricingData.clientName}
                  onChange={(e) => setPricingData(prev => ({ ...prev, clientName: e.target.value }))}
                  placeholder="Client name"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={pricingData.notes}
                onChange={(e) => setPricingData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                rows={3}
                placeholder="Additional project notes..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Fixture Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Fixtures</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Category Filter */}
            <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{category.icon}</span>
                  <span>{category.name}</span>
                </button>
              ))}
            </div>

            {/* Fixture Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFixtures.map((fixture) => (
                <div
                  key={fixture.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{fixture.name}</h3>
                      <p className="text-sm text-gray-500">{fixture.brand}</p>
                    </div>
                    <Badge variant="secondary">{fixture.category}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{fixture.description}</p>
                  <div className="flex justify-between items-center mb-3">
                    <div className="text-lg font-semibold text-gray-900">
                      ${fixture.basePrice}
                    </div>
                    <div className="text-sm text-gray-500">
                      <Clock className="h-4 w-4 inline mr-1" />
                      {fixture.laborHours}h labor
                    </div>
                  </div>
                  <Button
                    onClick={() => addFixture(fixture)}
                    className="w-full"
                    size="sm"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Project
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Selected Fixtures */}
        {pricingData.fixtures.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Selected Fixtures</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pricingData.fixtures.map((item) => (
                  <div
                    key={item.fixture.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.fixture.name}</h4>
                      <p className="text-sm text-gray-500">{item.fixture.brand}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Qty
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateFixtureQuantity(item.fixture.id, parseInt(e.target.value) || 1)}
                          className="w-16 text-center"
                        />
                      </div>
                      <div className="text-center">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Price
                        </label>
                        <Input
                          type="number"
                          value={item.customPrice || item.fixture.basePrice}
                          onChange={(e) => updateFixturePrice(item.fixture.id, parseFloat(e.target.value) || item.fixture.basePrice)}
                          className="w-20 text-center"
                        />
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          ${((item.customPrice || item.fixture.basePrice) * item.quantity).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.fixture.laborHours * item.quantity}h labor
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFixture(item.fixture.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Labor Rate ($/hr)
                </label>
                <Input
                  type="number"
                  value={pricingData.laborRate}
                  onChange={(e) => setPricingData(prev => ({ ...prev, laborRate: parseFloat(e.target.value) || 0 }))}
                  className="text-center"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount (%)
                </label>
                <Input
                  type="number"
                  value={pricingData.discountPercent}
                  onChange={(e) => setPricingData(prev => ({ ...prev, discountPercent: parseFloat(e.target.value) || 0 }))}
                  className="text-center"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Rate (%)
                </label>
                <Input
                  type="number"
                  value={pricingData.taxRate}
                  onChange={(e) => setPricingData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                  className="text-center"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Fixtures Subtotal:</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Labor ({totalLaborHours}h @ ${pricingData.laborRate}/hr):</span>
                <span className="font-medium">${laborCost.toFixed(2)}</span>
              </div>
              {pricingData.discountPercent > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({pricingData.discountPercent}%):</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Tax ({pricingData.taxRate}%):</span>
                <span className="font-medium">${taxAmount.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
          </>
        )}
      </div>

      {/* Quote Modal */}
      {showQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Project Quote</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQuote(false)}
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Project Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Project:</span>
                      <p className="font-medium">{pricingData.projectName || 'Unnamed Project'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Client:</span>
                      <p className="font-medium">{pricingData.clientName || 'Not specified'}</p>
                    </div>
                  </div>
                  {pricingData.notes && (
                    <div className="mt-2">
                      <span className="text-sm text-gray-500">Notes:</span>
                      <p className="text-sm">{pricingData.notes}</p>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Selected Fixtures</h3>
                  <div className="space-y-2">
                    {pricingData.fixtures.map((item) => (
                      <div key={item.fixture.id} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.fixture.name}</span>
                        <span>${((item.customPrice || item.fixture.basePrice) * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Cost Breakdown</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Fixtures Subtotal:</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Labor:</span>
                      <span>${laborCost.toFixed(2)}</span>
                    </div>
                    {pricingData.discountPercent > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>${taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Total:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button onClick={downloadQuote} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button onClick={sendQuote} className="flex-1">
                    <Send className="h-4 w-4 mr-2" />
                    Send to Client
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PricingCalculator() {
  return (
    <ProtectedRoute>
      <PricingCalculatorContent />
    </ProtectedRoute>
  )
}
