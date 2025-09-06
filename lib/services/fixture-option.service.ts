import { supabase } from '@/lib/supabase/client'
import type { FixtureOption } from '@/lib/supabase/types'

export interface FixtureOptionError {
  message: string
  code?: string
}

export interface CreateFixtureOptionData {
  category_id: string
  name: string
  description?: string
  brand: string
  model: string
  size?: string
  material?: string
  color?: string
  base_price: number
  installation_cost?: number
  image_url?: string
  is_active?: boolean
}

export interface UpdateFixtureOptionData {
  category_id?: string
  name?: string
  description?: string
  brand?: string
  model?: string
  size?: string
  material?: string
  color?: string
  base_price?: number
  installation_cost?: number
  image_url?: string
  is_active?: boolean
}

class FixtureOptionService {
  private supabase = supabase

  // Get all fixture options
  async getOptions(): Promise<{ options: FixtureOption[]; error: FixtureOptionError | null }> {
    try {
      const { data, error } = await this.supabase
        .from('fixture_options')
        .select(`
          *,
          fixture_categories (
            id,
            name
          )
        `)
        .order('name', { ascending: true })

      if (error) {
        return {
          options: [],
          error: { message: error.message, code: error.code }
        }
      }

      return { options: data || [], error: null }
    } catch (error) {
      return {
        options: [],
        error: { message: 'Failed to fetch fixture options' }
      }
    }
  }

  // Get fixture options by category
  async getOptionsByCategory(categoryId: string): Promise<{ options: FixtureOption[]; error: FixtureOptionError | null }> {
    try {
      const { data, error } = await this.supabase
        .from('fixture_options')
        .select('*')
        .eq('category_id', categoryId)
        .order('name', { ascending: true })

      if (error) {
        return {
          options: [],
          error: { message: error.message, code: error.code }
        }
      }

      return { options: data || [], error: null }
    } catch (error) {
      return {
        options: [],
        error: { message: 'Failed to fetch fixture options' }
      }
    }
  }

  // Create a new fixture option
  async createOption(data: CreateFixtureOptionData): Promise<{ option: FixtureOption | null; error: FixtureOptionError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { option: null, error: { message: 'User not authenticated' } }
      }

      const { data: option, error } = await this.supabase
        .from('fixture_options')
        .insert([data])
        .select()
        .single()

      if (error) {
        return {
          option: null,
          error: { message: error.message, code: error.code }
        }
      }

      return { option, error: null }
    } catch (error) {
      return {
        option: null,
        error: { message: 'Failed to create fixture option' }
      }
    }
  }

  // Update a fixture option
  async updateOption(id: string, data: UpdateFixtureOptionData): Promise<{ option: FixtureOption | null; error: FixtureOptionError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { option: null, error: { message: 'User not authenticated' } }
      }

      const { data: option, error } = await this.supabase
        .from('fixture_options')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return {
          option: null,
          error: { message: error.message, code: error.code }
        }
      }

      return { option, error: null }
    } catch (error) {
      return {
        option: null,
        error: { message: 'Failed to update fixture option' }
      }
    }
  }

  // Delete a fixture option
  async deleteOption(id: string): Promise<{ success: boolean; error: FixtureOptionError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { success: false, error: { message: 'User not authenticated' } }
      }

      const { error } = await this.supabase
        .from('fixture_options')
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
        error: { message: 'Failed to delete fixture option' }
      }
    }
  }
}

export const fixtureOptionService = new FixtureOptionService()
