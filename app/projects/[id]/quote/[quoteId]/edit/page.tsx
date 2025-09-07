'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/page-header'
import { ProtectedRoute } from '@/components/protected-route'
import { projectService, quoteService, fixtureService } from '@/lib/services'
import type { Project, QuoteData, FixtureCategory, FixtureOption, QuoteItem } from '@/lib/services'
import { Plus, Minus, Search, DollarSign, Package, Wrench } from 'lucide-react'

function EditQuoteContent() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const quoteId = params.quoteId as string

  const [project, setProject] = useState<Project | null>(null)
  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [categories, setCategories] = useState<FixtureCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [fixtureOptions, setFixtureOptions] = useState<FixtureOption[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([])
  const [laborItems, setLaborItems] = useState<QuoteItem[]>([])
  const [taxRate, setTaxRate] = useState(0.08)
  const [discountPercentage, setDiscountPercentage] = useState(0)
  const [validUntil, setValidUntil] = useState('')
  const [notes, setNotes] = useState('')
  
  // Labor item form state
  const [newLaborItem, setNewLaborItem] = useState({
    name: '',
    description: '',
    quantity: 1,
    unitPrice: 0
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load project
        const { project: fetchedProject, error: projectError } = await projectService.getProject(projectId)
        if (projectError) {
          toast.error('Project not found')
          router.push('/projects')
          return
        }
        setProject(fetchedProject)

        // Load quote
        const { quote: fetchedQuote, error: quoteError } = await quoteService.getQuote(quoteId)
        if (quoteError) {
          toast.error('Quote not found')
          router.push(`/projects/${projectId}`)
          return
        }
        setQuote(fetchedQuote)

        if (fetchedQuote) {
          setQuoteItems(fetchedQuote.items || [])
          setLaborItems(fetchedQuote.laborItems || [])
          setTaxRate(fetchedQuote.taxRate || 0.08)
          setDiscountPercentage(fetchedQuote.discountPercentage || 0)
          setValidUntil(fetchedQuote.validUntil ? fetchedQuote.validUntil.split('T')[0] : '')
          setNotes(fetchedQuote.notes || '')
        }

        // Load categories
        const { categories: fetchedCategories, error: categoriesError } = await fixtureService.getCategories()
        if (categoriesError) {
          console.error('Failed to load categories:', categoriesError)
        } else {
          setCategories(fetchedCategories)
        }
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Failed to load quote data')
      } finally {
        setLoading(false)
      }
    }

    if (projectId && quoteId) {
      loadData()
    }
  }, [projectId, quoteId, router])

  const loadFixtureOptions = async (categoryId: string) => {
    try {
      const { options, error } = await fixtureService.getOptionsByCategory(categoryId)
      if (error) {
        console.error('Failed to load fixture options:', error)
      } else {
        setFixtureOptions(options)
      }
    } catch (error) {
      console.error('Error loading fixture options:', error)
    }
  }

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setSearchQuery('')
    if (categoryId) {
      loadFixtureOptions(categoryId)
    } else {
      setFixtureOptions([])
    }
  }

  const addQuoteItem = (option: FixtureOption) => {
    const newItem: QuoteItem = {
      id: Date.now().toString(),
      name: option.name,
      description: option.description || '',
      quantity: 1,
      unitPrice: option.price || 0,
      category: option.categoryName || ''
    }
    setQuoteItems(prev => [...prev, newItem])
  }

  const updateQuoteItem = (itemId: string, field: keyof QuoteItem, value: any) => {
    setQuoteItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ))
  }

  const removeQuoteItem = (itemId: string) => {
    setQuoteItems(prev => prev.filter(item => item.id !== itemId))
  }

  const addLaborItem = () => {
    if (!newLaborItem.name.trim()) return

    const newItem: QuoteItem = {
      id: Date.now().toString(),
      name: newLaborItem.name,
      description: newLaborItem.description,
      quantity: newLaborItem.quantity,
      unitPrice: newLaborItem.unitPrice,
      category: 'Labor'
    }
    setLaborItems(prev => [...prev, newItem])
    setNewLaborItem({ name: '', description: '', quantity: 1, unitPrice: 0 })
  }

  const updateLaborItem = (itemId: string, field: keyof QuoteItem, value: any) => {
    setLaborItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ))
  }

  const removeLaborItem = (itemId: string) => {
    setLaborItems(prev => prev.filter(item => item.id !== itemId))
  }

  const calculateSubtotal = () => {
    const itemsTotal = quoteItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    const laborTotal = laborItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    return itemsTotal + laborTotal
  }

  const calculateTax = () => {
    return calculateSubtotal() * taxRate
  }

  const calculateDiscount = () => {
    return calculateSubtotal() * (discountPercentage / 100)
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() - calculateDiscount()
  }

  const handleSave = async () => {
    if (!quote) return

    setSaving(true)
    try {
      const updatedQuote: Partial<QuoteData> = {
        items: quoteItems,
        laborItems: laborItems,
        taxRate: taxRate,
        discountPercentage: discountPercentage,
        validUntil: validUntil || undefined,
        notes: notes || undefined,
        subtotal: calculateSubtotal(),
        tax: calculateTax(),
        discount: calculateDiscount(),
        total: calculateTotal()
      }

      const { success, error } = await quoteService.updateQuote(quoteId, updatedQuote)
      
      if (error) {
        toast.error(`Failed to update quote: ${error.message}`)
      } else {
        toast.success('Quote updated successfully!')
        router.push(`/projects/${projectId}/quote/${quoteId}`)
      }
    } catch (error) {
      console.error('Error updating quote:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  const filteredOptions = fixtureOptions.filter(option =>
    option.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (option.description && option.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading quote...</p>
        </div>
      </div>
    )
  }

  if (!project || !quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Quote not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Edit Quote"
        backHref={`/projects/${projectId}/quote/${quoteId}`}
      />

      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Add Items */}
          <div className="lg:col-span-1 space-y-6">
            {/* Fixture Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Add Fixtures
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCategory && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Options
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search fixtures..."
                        className="pl-10"
                      />
                    </div>
                  </div>
                )}

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredOptions.map(option => (
                    <div key={option.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{option.name}</h4>
                          {option.description && (
                            <p className="text-xs text-gray-600 mt-1">{option.description}</p>
                          )}
                          <p className="text-sm font-medium text-primary-600 mt-1">
                            ${option.price?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => addQuoteItem(option)}
                          className="ml-2"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Labor Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wrench className="h-5 w-5 mr-2" />
                  Add Labor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Name
                  </label>
                  <Input
                    value={newLaborItem.name}
                    onChange={(e) => setNewLaborItem(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Installation, Demolition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <Input
                    value={newLaborItem.description}
                    onChange={(e) => setNewLaborItem(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={newLaborItem.quantity}
                      onChange={(e) => setNewLaborItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit Price
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newLaborItem.unitPrice}
                      onChange={(e) => setNewLaborItem(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
                    />
                  </div>
                </div>
                <Button onClick={addLaborItem} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Labor Item
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Quote Items and Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quote Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Quote Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Fixture Items */}
                  {quoteItems.map(item => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          )}
                          <Badge variant="outline" className="mt-2">{item.category}</Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeQuoteItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Quantity</label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateQuoteItem(item.id, 'quantity', Number(e.target.value))}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Unit Price</label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => updateQuoteItem(item.id, 'unitPrice', Number(e.target.value))}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Total</label>
                          <div className="p-2 bg-gray-50 rounded text-sm font-medium">
                            ${(item.quantity * item.unitPrice).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Labor Items */}
                  {laborItems.map(item => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                          )}
                          <Badge variant="outline" className="mt-2">Labor</Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeLaborItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Quantity</label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateLaborItem(item.id, 'quantity', Number(e.target.value))}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Unit Price</label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => updateLaborItem(item.id, 'unitPrice', Number(e.target.value))}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Total</label>
                          <div className="p-2 bg-gray-50 rounded text-sm font-medium">
                            ${(item.quantity * item.unitPrice).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {quoteItems.length === 0 && laborItems.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No items added yet</p>
                      <p className="text-sm">Add fixtures and labor items from the left panel</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quote Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Quote Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax Rate (%)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={taxRate * 100}
                      onChange={(e) => setTaxRate(Number(e.target.value) / 100)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount (%)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valid Until
                  </label>
                  <Input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                    rows={3}
                    placeholder="Additional notes for the quote..."
                  />
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({(taxRate * 100).toFixed(1)}%):</span>
                    <span>${calculateTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount ({discountPercentage.toFixed(1)}%):</span>
                    <span>-${calculateDiscount().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
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
                  'Save Quote'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EditQuotePage() {
  return (
    <ProtectedRoute>
      <EditQuoteContent />
    </ProtectedRoute>
  )
}