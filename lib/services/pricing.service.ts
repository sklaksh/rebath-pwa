import { createClient } from '@/lib/supabase/client'
import type { Quote as DbQuote, FixtureOption as DbFixtureOption, FixtureCategory as DbFixtureCategory, Inserts as QuoteInsert, Updates as QuoteUpdate } from '@/lib/supabase/types'

export interface FixtureOption {
  id: string
  name: string
  brand: string
  category: string
  basePrice: number
  laborHours: number
  description: string
  image?: string
}

export interface SelectedFixture {
  fixtureId: string
  name: string
  brand: string
  model: string
  size?: string
  material?: string
  color?: string
  basePrice: number
  installationCost: number
  quantity: number
  totalPrice: number
}

// Interface for calculator page data structure
export interface CalculatorPricingData {
  fixtures: Array<{
    fixture: FixtureOption
    quantity: number
    customPrice?: number
  }>
  laborRate: number
  discountPercent: number
  taxRate: number
  projectName: string
  clientName: string
  notes: string
}

export interface PricingData {
  items: SelectedFixture[]
  subtotal: number
  taxRate: number
  taxAmount: number
  discountPercentage: number
  discountAmount: number
  total: number
}

export interface QuoteData {
  id: string
  projectId: string
  assessmentId?: string
  quoteNumber: string
  items: SelectedFixture[]
  subtotal: number
  taxRate: number
  taxAmount: number
  discountPercentage: number
  discountAmount: number
  total: number
  validUntil: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface PricingError {
  message: string
  code?: string
}

class PricingService {
  private supabase = createClient()

  // Calculate pricing breakdown
  calculatePricing(
    items: SelectedFixture[] | CalculatorPricingData, 
    taxRate: number = 8.5, 
    discountPercentage: number = 0
  ): {
    subtotal: number
    laborCost: number
    discountAmount: number
    subtotalAfterDiscount: number
    taxAmount: number
    total: number
    totalLaborHours: number
  } {
    // Handle calculator data structure
    if ('fixtures' in items) {
      const calculatorData = items as CalculatorPricingData
      const subtotal = calculatorData.fixtures.reduce((sum, item) => {
        const price = item.customPrice || item.fixture.basePrice
        return sum + (price * item.quantity)
      }, 0)
      
      const totalLaborHours = calculatorData.fixtures.reduce((sum, item) => {
        return sum + (item.fixture.laborHours * item.quantity)
      }, 0)
      
      const laborCost = totalLaborHours * calculatorData.laborRate
      const discountAmount = (subtotal + laborCost) * (calculatorData.discountPercent / 100)
      const subtotalAfterDiscount = subtotal + laborCost - discountAmount
      const taxAmount = subtotalAfterDiscount * (calculatorData.taxRate / 100)
      const total = subtotalAfterDiscount + taxAmount

      return {
        subtotal,
        laborCost,
        discountAmount,
        subtotalAfterDiscount,
        taxAmount,
        total,
        totalLaborHours
      }
    }
    
    // Handle original SelectedFixture[] structure
    const selectedFixtures = items as SelectedFixture[]
    const subtotal = selectedFixtures.reduce((sum, item) => sum + item.totalPrice, 0)
    const discountAmount = subtotal * (discountPercentage / 100)
    const subtotalAfterDiscount = subtotal - discountAmount
    const taxAmount = subtotalAfterDiscount * (taxRate / 100)
    const total = subtotalAfterDiscount + taxAmount

    return {
      subtotal,
      laborCost: 0, // Not calculated for SelectedFixture structure
      discountAmount,
      subtotalAfterDiscount,
      taxAmount,
      total,
      totalLaborHours: 0 // Not calculated for SelectedFixture structure
    }
  }

  // Generate quote
  async generateQuote(projectId: string, items: SelectedFixture[], assessmentId?: string): Promise<{ quote: QuoteData; error: PricingError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { quote: {} as QuoteData, error: { message: 'User not authenticated' } }
      }

      const calculations = this.calculatePricing(items)
      const quoteNumber = this.generateQuoteNumber()
      
      const quoteData: QuoteInsert<'quotes'> = {
        project_id: projectId,
        user_id: user.id,
        assessment_id: assessmentId || null,
        quote_number: quoteNumber,
        items: items as any,
        subtotal: calculations.subtotal,
        tax_rate: 8.5, // Default tax rate
        tax_amount: calculations.taxAmount,
        discount_percentage: 0, // Default discount
        discount_amount: calculations.discountAmount,
        total: calculations.total,
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        status: 'draft',
        notes: null
      }

      const { data, error } = await this.supabase
        .from('quotes')
        .insert(quoteData)
        .select()
        .single()

      if (error) {
        return {
          quote: {} as QuoteData,
          error: { message: error.message, code: error.code }
        }
      }

      const quote = this.mapDbQuoteToQuote(data)
      return { quote, error: null }
    } catch (error) {
      return {
        quote: {} as QuoteData,
        error: { message: 'Failed to generate quote' }
      }
    }
  }

  // Save quote to database
  async saveQuote(quote: QuoteData): Promise<{ success: boolean; error: PricingError | null }> {
    try {
      const quoteData: QuoteUpdate<'quotes'> = {
        items: quote.items as any,
        subtotal: quote.subtotal,
        tax_rate: quote.taxRate,
        tax_amount: quote.taxAmount,
        discount_percentage: quote.discountPercentage,
        discount_amount: quote.discountAmount,
        total: quote.total,
        status: quote.status,
        notes: quote.notes
      }

      const { error } = await this.supabase
        .from('quotes')
        .update(quoteData)
        .eq('id', quote.id)

      if (error) {
        return {
          success: false,
          error: { message: error.message, code: error.code }
        }
      }
      
      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error: { message: 'Failed to save quote' }
      }
    }
  }

  // Get all quotes for the current user
  async getQuotes(): Promise<{ quotes: QuoteData[]; error: PricingError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { quotes: [], error: { message: 'User not authenticated' } }
      }

      const { data, error } = await this.supabase
        .from('quotes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        return {
          quotes: [],
          error: { message: error.message, code: error.code }
        }
      }

      const quotes = data.map(this.mapDbQuoteToQuote)
      return { quotes, error: null }
    } catch (error) {
      return {
        quotes: [],
        error: { message: 'Failed to fetch quotes' }
      }
    }
  }

  // Get quotes by project
  async getQuotesByProject(projectId: string): Promise<{ quotes: QuoteData[]; error: PricingError | null }> {
    try {
      const { data, error } = await this.supabase
        .from('quotes')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) {
        return {
          quotes: [],
          error: { message: error.message, code: error.code }
        }
      }

      const quotes = data.map(this.mapDbQuoteToQuote)
      return { quotes, error: null }
    } catch (error) {
      return {
        quotes: [],
        error: { message: 'Failed to fetch project quotes' }
      }
    }
  }

  // Get a specific quote by ID
  async getQuote(id: string): Promise<{ quote: QuoteData | null; error: PricingError | null }> {
    try {
      const { data, error } = await this.supabase
        .from('quotes')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        return {
          quote: null,
          error: { message: error.message, code: error.code }
        }
      }

      const quote = this.mapDbQuoteToQuote(data)
      return { quote, error: null }
    } catch (error) {
      return {
        quote: null,
        error: { message: 'Failed to fetch quote' }
      }
    }
  }

  // Delete a quote
  async deleteQuote(id: string): Promise<{ success: boolean; error: PricingError | null }> {
    try {
      const { error } = await this.supabase
        .from('quotes')
        .delete()
        .eq('id', id)

      if (error) {
        return {
          success: false,
          error: { message: error.message, code: error.code }
        }
      }
      
      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error: { message: 'Failed to delete quote' }
      }
    }
  }

  // Get fixture options from database
  async getFixtureOptions(): Promise<{ fixtures: FixtureOption[]; error: PricingError | null }> {
    try {
      const { data, error } = await this.supabase
        .from('fixture_options')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) {
        return {
          fixtures: [],
          error: { message: error.message, code: error.code }
        }
      }

      const fixtures = data.map(this.mapDbFixtureToFixture)
      return { fixtures, error: null }
    } catch (error) {
      return {
        fixtures: [],
        error: { message: 'Failed to fetch fixture options' }
      }
    }
  }

  // Get fixture categories from database
  async getFixtureCategories(): Promise<{ categories: { id: string; name: string; icon: string }[]; error: PricingError | null }> {
    try {
      const { data, error } = await this.supabase
        .from('fixture_categories')
        .select('*')
        .order('display_order')

      if (error) {
        return {
          categories: [],
          error: { message: error.message, code: error.code }
        }
      }

      const categories = data.map((cat: DbFixtureCategory) => ({
        id: cat.id,
        name: cat.name,
        icon: this.getCategoryIcon(cat.name)
      }))

      // Add "All" category at the beginning
      categories.unshift({ id: 'all', name: 'All Fixtures', icon: '🏠' })

      return { categories, error: null }
    } catch (error) {
      return {
        categories: [],
        error: { message: 'Failed to fetch fixture categories' }
      }
    }
  }

  // Filter fixtures by category
  filterFixturesByCategory(fixtures: FixtureOption[], categoryId: string): FixtureOption[] {
    if (categoryId === 'all') {
      return fixtures
    }
    return fixtures.filter(fixture => fixture.category === categoryId)
  }

  // Generate PDF quote (placeholder)
  async generatePDFQuote(quote: QuoteData): Promise<{ success: boolean; error: PricingError | null }> {
    try {
      // TODO: Implement PDF generation
      console.log('Generating PDF for quote:', quote.id)
      
      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error: { message: 'Failed to generate PDF quote' }
      }
    }
  }

  // Send quote via email (placeholder)
  async sendQuoteEmail(quote: QuoteData, email: string): Promise<{ success: boolean; error: PricingError | null }> {
    try {
      // TODO: Implement email sending
      console.log('Sending quote to:', email, quote.id)
      
      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error: { message: 'Failed to send quote email' }
      }
    }
  }

  // Get pricing statistics
  async getPricingStats(): Promise<{ stats: { totalQuotes: number; totalValue: number; averageQuoteValue: number }; error: PricingError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { 
          stats: { totalQuotes: 0, totalValue: 0, averageQuoteValue: 0 },
          error: { message: 'User not authenticated' }
        }
      }

      const { data, error } = await this.supabase
        .from('quotes')
        .select('*')
        .eq('user_id', user.id)

      if (error) {
        return {
          stats: { totalQuotes: 0, totalValue: 0, averageQuoteValue: 0 },
          error: { message: error.message, code: error.code }
        }
      }

      const totalQuotes = data.length
      const totalValue = data.reduce((sum: number, q: DbQuote) => sum + (q.total || 0), 0)
      const averageQuoteValue = totalQuotes > 0 ? totalValue / totalQuotes : 0

      return { 
        stats: { totalQuotes, totalValue, averageQuoteValue }, 
        error: null 
      }
    } catch (error) {
      return {
        stats: { totalQuotes: 0, totalValue: 0, averageQuoteValue: 0 },
        error: { message: 'Failed to get pricing statistics' }
      }
    }
  }

  // Generate unique quote number
  private generateQuoteNumber(): string {
    const timestamp = Date.now().toString().slice(-8)
    const random = Math.random().toString(36).substr(2, 4).toUpperCase()
    return `QT-${timestamp}-${random}`
  }

  // Get category icon
  private getCategoryIcon(categoryName: string): string {
    const icons: { [key: string]: string } = {
      'Faucets': '🚰',
      'Sinks': '🪞',
      'Toilets': '🚽',
      'Tubs & Showers': '🚿',
      'Cabinets & Vanities': '🗄️',
      'Countertops': '🏠',
      'Lighting': '💡',
      'Hardware': '🔧'
    }
    return icons[categoryName] || '🏠'
  }

  // Map database fixture to application fixture
  private mapDbFixtureToFixture(dbFixture: DbFixtureOption): FixtureOption {
    return {
      id: dbFixture.id,
      name: dbFixture.name,
      brand: dbFixture.brand,
      category: dbFixture.category_id, // Using category_id as category for now
      basePrice: dbFixture.base_price,
      laborHours: dbFixture.installation_cost / 50, // Rough estimate: $50/hour
      description: dbFixture.description || '',
      image: dbFixture.image_url || undefined
    }
  }

  // Map database quote to application quote
  private mapDbQuoteToQuote(dbQuote: DbQuote): QuoteData {
    return {
      id: dbQuote.id,
      projectId: dbQuote.project_id,
      assessmentId: dbQuote.assessment_id || undefined,
      quoteNumber: dbQuote.quote_number,
      items: dbQuote.items as unknown as SelectedFixture[],
      subtotal: dbQuote.subtotal,
      taxRate: dbQuote.tax_rate,
      taxAmount: dbQuote.tax_amount,
      discountPercentage: dbQuote.discount_percentage,
      discountAmount: dbQuote.discount_amount,
      total: dbQuote.total,
      validUntil: dbQuote.valid_until,
      status: dbQuote.status,
      notes: dbQuote.notes || undefined,
      createdAt: dbQuote.created_at,
      updatedAt: dbQuote.updated_at
    }
  }
}

export const pricingService = new PricingService()
