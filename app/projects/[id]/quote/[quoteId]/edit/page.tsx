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
          // Separate fixture and labor items
          const fixtureItems = fetchedQuote.items.filter(item => item.type === 'fixture' || !item.type)
          const laborItems = fetchedQuote.items.filter(item => item.type === 'labor')
          
          setQuoteItems(fixtureItems)
          setLaborItems(laborItems)
          setTaxRate(fetchedQuote.taxRate)
          setDiscountPercentage(fetchedQuote.discountPercentage)
          setValidUntil(fetchedQuote.validUntil)
          setNotes(fetchedQuote.notes || '')
        }

        // Load fixture categories
        const { categories: fetchedCategories, error: categoriesError } = await fixtureService.getCategories()
        if (categoriesError) {
          toast.error('Failed to load fixture categories')
          console.error('Error loading categories:', categoriesError)
        } else {
          setCategories(fetchedCategories)
        }

        // Load all fixture options initially
        const { options: fetchedOptions, error: optionsError } = await fixtureService.getAllOptions()
        if (optionsError) {
          toast.error('Failed to load fixture options')
          console.error('Error loading options:', optionsError)
        } else {
          setFixtureOptions(fetchedOptions)
        }
      } catch (error) {
        toast.error('Failed to load data')
        router.push('/projects')
      } finally {
        setLoading(false)
      }
    }

    if (projectId && quoteId) {
      loadData()
    }
  }, [projectId, quoteId, router])

  const handleCategoryChange = async (categoryId: string) => {
    setSelectedCategory(categoryId)
    if (categoryId) {
      const { options, error } = await fixtureService.getOptionsByCategory(categoryId)
      if (error) {
        toast.error('Failed to load fixture options')
        console.error('Error loading options:', error)
      } else {
        setFixtureOptions(options)
      }
    } else {
      const { options, error } = await fixtureService.getAllOptions()
      if (error) {
        toast.error('Failed to load fixture options')
        console.error('Error loading options:', error)
      } else {
        setFixtureOptions(options)
      }
    }
  }

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      const { options, error } = await fixtureService.searchOptions(searchQuery.trim())
      if (error) {
        toast.error('Failed to search fixture options')
        console.error('Error searching options:', error)
      } else {
        setFixtureOptions(options)
      }
    } else {
      handleCategoryChange(selectedCategory)
    }
  }

  const addQuoteItem = (option: FixtureOption) => {
    const existingItem = quoteItems.find(item => item.fixtureId === option.id)
    
    if (existingItem) {
      // Update quantity
      setQuoteItems(prev => prev.map(item => 
        item.fixtureId === option.id 
          ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * (item.unitPrice + item.installationCost) }
          : item
      ))
    } else {
      // Add new item
      const newItem: QuoteItem = {
        id: `temp-${Date.now()}`,
        fixtureId: option.id,
        name: option.name,
        description: option.description,
        brand: option.brand,
        model: option.model,
        size: option.size,
        material: option.material,
        color: option.color,
        quantity: 1,
        unitPrice: option.basePrice,
        installationCost: option.installationCost,
        totalPrice: option.basePrice + option.installationCost,
        notes: ''
      }
      setQuoteItems(prev => [...prev, newItem])
    }
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeQuoteItem(itemId)
      return
    }
    
    setQuoteItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, quantity, totalPrice: quantity * (item.unitPrice + item.installationCost) }
        : item
    ))
  }

  const updateItemPrice = (itemId: string, field: 'unitPrice' | 'installationCost', value: number) => {
    setQuoteItems(prev => prev.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            [field]: value,
            totalPrice: item.quantity * (field === 'unitPrice' ? value + item.installationCost : item.unitPrice + value)
          }
        : item
    ))
  }

  const removeQuoteItem = (itemId: string) => {
    setQuoteItems(prev => prev.filter(item => item.id !== itemId))
  }

  const addLaborItem = () => {
    if (!newLaborItem.name.trim() || newLaborItem.unitPrice <= 0) {
      toast.error('Please enter labor item name and price')
      return
    }

    const laborItem: QuoteItem = {
      id: `labor-${Date.now()}`,
      type: 'labor',
      name: newLaborItem.name.trim(),
      description: newLaborItem.description.trim() || undefined,
      quantity: newLaborItem.quantity,
      unitPrice: newLaborItem.unitPrice,
      totalPrice: newLaborItem.quantity * newLaborItem.unitPrice
    }

    setLaborItems(prev => [...prev, laborItem])
    setNewLaborItem({ name: '', description: '', quantity: 1, unitPrice: 0 })
    toast.success('Labor item added')
  }

  const removeLaborItem = (itemId: string) => {
    setLaborItems(prev => prev.filter(item => item.id !== itemId))
  }

  const updateLaborQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeLaborItem(itemId)
      return
    }
    
    setLaborItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, quantity, totalPrice: quantity * item.unitPrice }
        : item
    ))
  }

  const calculateTotals = () => {
    const allItems = [...quoteItems, ...laborItems]
    return quoteService.calculateTotals(allItems, taxRate, discountPercentage)
  }

  const handleSaveQuote = async () => {
    if (quoteItems.length === 0 && laborItems.length === 0) {
      toast.error('Please add at least one item to the quote')
      return
    }

    setSaving(true)
    try {
      const totals = calculateTotals()
      
      const updates = {
        items: [...quoteItems, ...laborItems],
        subtotal: totals.subtotal,
        taxRate,
        taxAmount: totals.taxAmount,
        discountPercentage,
        discountAmount: totals.discountAmount,
        total: totals.total,
        validUntil,
        notes: notes.trim() || undefined
      }

      const { quote: updatedQuote, error } = await quoteService.updateQuote(quoteId, updates)
      
      if (error) {
        toast.error(`Failed to update quote: ${error.message}`)
      } else if (updatedQuote) {
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
    !searchQuery || 
    option.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    option.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    option.model.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totals = calculateTotals()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quote editor...</p>
        </div>
      </div>
    )
  }

  if (!project || !quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Quote Not Found</h2>
          <p className="text-gray-600 mb-4">The requested quote could not be found.</p>
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
        title={`Edit Quote ${quote.quoteNumber}`}
        showBackButton={true}
        showQuickNav={true}
      />

      <div className="p-4 space-y-6">
        {/* Quote Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <span>Edit Quote {quote.quoteNumber}</span>
              <Badge className="bg-yellow-100 text-yellow-800">
                Draft
              </Badge>
            </CardTitle>
            <p className="text-sm text-gray-600">
              Created {new Date(quote.createdAt!).toLocaleDateString()}
            </p>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fixture Selection */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Select Fixtures</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search fixtures..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Button onClick={handleSearch} variant="outline">
                    Search
                  </Button>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fixture Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {filteredOptions.map((option) => (
                    <div key={option.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{option.name}</h4>
                          <p className="text-sm text-gray-600">{option.brand} {option.model}</p>
                          {option.size && <p className="text-xs text-gray-500">Size: {option.size}</p>}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => addQuoteItem(option)}
                          className="ml-2"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            ${option.basePrice.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            + ${option.installationCost.toFixed(2)} install
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {categories.find(c => c.id === option.categoryId)?.name}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Labor Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wrench className="h-5 w-5" />
                  <span>Labor Items</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Labor Item Form */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Labor Type
                    </label>
                    <Input
                      placeholder="e.g., Installation, Demolition"
                      value={newLaborItem.name}
                      onChange={(e) => setNewLaborItem(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <Input
                      placeholder="Optional description"
                      value={newLaborItem.description}
                      onChange={(e) => setNewLaborItem(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit Price ($)
                    </label>
                    <div className="flex space-x-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newLaborItem.unitPrice}
                        onChange={(e) => setNewLaborItem(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
                      />
                      <Button onClick={addLaborItem} size="sm">
                        Add
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Labor Items List */}
                {laborItems.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Labor Items ({laborItems.length})</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {laborItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                            {item.description && (
                              <p className="text-xs text-gray-500">{item.description}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 ml-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateLaborQuantity(item.id, item.quantity - 1)}
                              className="h-6 w-6 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateLaborQuantity(item.id, item.quantity + 1)}
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <div className="text-right ml-2">
                              <p className="text-sm font-medium">${item.totalPrice.toFixed(2)}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeLaborItem(item.id)}
                              className="ml-2 text-red-600 hover:text-red-700"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quote Summary */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Quote Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quote Items */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Fixture Items ({quoteItems.length})</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {quoteItems.map((item) => (
                      <div key={item.id} className="p-2 bg-gray-50 rounded">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                            <p className="text-xs text-gray-500">{item.brand} {item.model}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeQuoteItem(item.id)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <label className="text-xs text-gray-500">Quantity</label>
                            <div className="flex items-center space-x-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="h-6 w-6 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="h-6 w-6 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Total</label>
                            <p className="text-sm font-medium">${item.totalPrice.toFixed(2)}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-500">Unit Price</label>
                            <Input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateItemPrice(item.id, 'unitPrice', Number(e.target.value))}
                              className="h-6 text-xs"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Install Cost</label>
                            <Input
                              type="number"
                              value={item.installationCost}
                              onChange={(e) => updateItemPrice(item.id, 'installationCost', Number(e.target.value))}
                              className="h-6 text-xs"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Labor Items Summary */}
                {laborItems.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Labor Items ({laborItems.length})</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {laborItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                            {item.description && (
                              <p className="text-xs text-gray-500">{item.description}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 ml-2">
                            <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                            <div className="text-right ml-2">
                              <p className="text-sm font-medium">${item.totalPrice.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Totals */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Subtotal:</span>
                    <span className="text-sm font-medium">${totals.subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Discount ({discountPercentage * 100}%):</span>
                    <span className="text-sm font-medium">-${totals.discountAmount.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tax ({taxRate * 100}%):</span>
                    <span className="text-sm font-medium">${totals.taxAmount.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium text-gray-900">Total:</span>
                    <span className="font-bold text-lg">${totals.total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Settings */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valid Until
                    </label>
                    <Input
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tax Rate (%)
                    </label>
                    <Input
                      type="number"
                      value={taxRate * 100}
                      onChange={(e) => setTaxRate(Number(e.target.value) / 100)}
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discount (%)
                    </label>
                    <Input
                      type="number"
                      value={discountPercentage * 100}
                      onChange={(e) => setDiscountPercentage(Number(e.target.value) / 100)}
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add quote notes..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Save Button */}
                <Button
                  onClick={handleSaveQuote}
                  disabled={saving || (quoteItems.length === 0 && laborItems.length === 0)}
                  className="w-full"
                >
                  {saving ? 'Saving Changes...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EditQuote() {
  return (
    <ProtectedRoute>
      <EditQuoteContent />
    </ProtectedRoute>
  )
}
