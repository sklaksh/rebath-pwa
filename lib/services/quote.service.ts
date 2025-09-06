import { createClient } from '@/lib/supabase/client'
import type { Quote as DbQuote, Inserts as QuoteInsert, Updates as QuoteUpdate } from '@/lib/supabase/types'

export interface QuoteItem {
  id: string
  type: 'fixture' | 'labor'
  fixtureId?: string // Only for fixture items
  name: string
  description?: string
  brand?: string // Only for fixture items
  model?: string // Only for fixture items
  size?: string // Only for fixture items
  material?: string // Only for fixture items
  color?: string // Only for fixture items
  quantity: number
  unitPrice: number
  installationCost?: number // Only for fixture items
  totalPrice: number
  notes?: string
}

export interface QuoteData {
  id?: string
  projectId: string
  assessmentId?: string
  quoteNumber: string
  items: QuoteItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  discountPercentage: number
  discountAmount: number
  total: number
  validUntil: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  notes?: string
  createdAt?: string
  updatedAt?: string
  userId?: string
}

export interface QuoteError {
  message: string
  code?: string
}

class QuoteService {
  private supabase = createClient()

  // Generate quote number
  private generateQuoteNumber(): string {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `Q-${year}${month}${day}-${random}`
  }

  // Create a new quote
  async createQuote(quote: Omit<QuoteData, 'id' | 'quoteNumber' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<{ quote: QuoteData | null; success: boolean; error: QuoteError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { quote: null, success: false, error: { message: 'User not authenticated' } }
      }

      const quoteNumber = this.generateQuoteNumber()
      const validUntil = new Date()
      validUntil.setDate(validUntil.getDate() + 30) // 30 days from now

      const quoteData: QuoteInsert<'quotes'> = {
        project_id: quote.projectId,
        user_id: user.id,
        assessment_id: quote.assessmentId || null,
        quote_number: quoteNumber,
        items: quote.items as any,
        subtotal: quote.subtotal,
        tax_rate: quote.taxRate,
        tax_amount: quote.taxAmount,
        discount_percentage: quote.discountPercentage,
        discount_amount: quote.discountAmount,
        total: quote.total,
        valid_until: validUntil.toISOString().split('T')[0],
        status: quote.status || 'draft',
        notes: quote.notes || null
      }

      const { data, error } = await this.supabase
        .from('quotes')
        .insert(quoteData)
        .select()
        .single()

      if (error) {
        return {
          quote: null,
          success: false,
          error: { message: error.message, code: error.code }
        }
      }

      const newQuote = this.mapDbQuoteToQuote(data)
      return { quote: newQuote, success: true, error: null }
    } catch (error) {
      return {
        quote: null,
        success: false,
        error: { message: 'Failed to create quote' }
      }
    }
  }

  // Get all quotes for the current user
  async getQuotes(): Promise<{ quotes: QuoteData[]; error: QuoteError | null }> {
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
  async getQuotesByProject(projectId: string): Promise<{ quotes: QuoteData[]; error: QuoteError | null }> {
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
  async getQuote(id: string): Promise<{ quote: QuoteData | null; error: QuoteError | null }> {
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

  // Update a quote
  async updateQuote(id: string, updates: Partial<QuoteData>): Promise<{ quote: QuoteData | null; error: QuoteError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { quote: null, error: { message: 'User not authenticated' } }
      }

      const updateData: QuoteUpdate<'quotes'> = {}
      
      if (updates.items !== undefined) updateData.items = updates.items as any
      if (updates.subtotal !== undefined) updateData.subtotal = updates.subtotal
      if (updates.taxRate !== undefined) updateData.tax_rate = updates.taxRate
      if (updates.taxAmount !== undefined) updateData.tax_amount = updates.taxAmount
      if (updates.discountPercentage !== undefined) updateData.discount_percentage = updates.discountPercentage
      if (updates.discountAmount !== undefined) updateData.discount_amount = updates.discountAmount
      if (updates.total !== undefined) updateData.total = updates.total
      if (updates.validUntil !== undefined) updateData.valid_until = updates.validUntil
      if (updates.status !== undefined) updateData.status = updates.status
      if (updates.notes !== undefined) updateData.notes = updates.notes

      const { data, error } = await this.supabase
        .from('quotes')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
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
        error: { message: 'Failed to update quote' }
      }
    }
  }

  // Delete a quote
  async deleteQuote(id: string): Promise<{ success: boolean; error: QuoteError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { success: false, error: { message: 'User not authenticated' } }
      }

      const { error } = await this.supabase
        .from('quotes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

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

  // Calculate quote totals
  calculateTotals(items: QuoteItem[], taxRate: number = 0.08, discountPercentage: number = 0): {
    subtotal: number
    taxAmount: number
    discountAmount: number
    total: number
  } {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0)
    const discountAmount = subtotal * discountPercentage
    const taxableAmount = subtotal - discountAmount
    const taxAmount = taxableAmount * taxRate
    const total = taxableAmount + taxAmount

    return {
      subtotal,
      taxAmount,
      discountAmount,
      total
    }
  }

  // Send quote (change status to sent)
  async sendQuote(id: string): Promise<{ success: boolean; error: QuoteError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { success: false, error: { message: 'User not authenticated' } }
      }

      const { error } = await this.supabase
        .from('quotes')
        .update({ status: 'sent' })
        .eq('id', id)
        .eq('user_id', user.id)

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
        error: { message: 'Failed to send quote' }
      }
    }
  }

  // Accept quote (change status to accepted)
  async acceptQuote(id: string): Promise<{ success: boolean; error: QuoteError | null }> {
    try {
      const { error } = await this.supabase
        .from('quotes')
        .update({ status: 'accepted' })
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
        error: { message: 'Failed to accept quote' }
      }
    }
  }

  // Reject quote (change status to rejected)
  async rejectQuote(id: string): Promise<{ success: boolean; error: QuoteError | null }> {
    try {
      const { error } = await this.supabase
        .from('quotes')
        .update({ status: 'rejected' })
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
        error: { message: 'Failed to reject quote' }
      }
    }
  }

  // Update quote status
  async updateQuoteStatus(id: string, status: string): Promise<{ success: boolean; error: QuoteError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { success: false, error: { message: 'User not authenticated' } }
      }

      const { error } = await this.supabase
        .from('quotes')
        .update({ status })
        .eq('id', id)
        .eq('user_id', user.id)

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
        error: { message: 'Failed to update quote status' }
      }
    }
  }

  // Map database quote to application quote
  private mapDbQuoteToQuote(dbQuote: DbQuote): QuoteData {
    return {
      id: dbQuote.id,
      projectId: dbQuote.project_id,
      assessmentId: dbQuote.assessment_id || undefined,
      quoteNumber: dbQuote.quote_number,
      items: dbQuote.items as unknown as QuoteItem[],
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
      updatedAt: dbQuote.updated_at,
      userId: dbQuote.user_id
    }
  }
}

export const quoteService = new QuoteService()
