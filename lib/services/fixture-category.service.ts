import { supabase } from '@/lib/supabase/client'
import type { FixtureCategory } from '@/lib/supabase/types'

export interface FixtureCategoryError {
  message: string
  code?: string
}

export interface CreateFixtureCategoryData {
  name: string
  description?: string
  display_order?: number
}

export interface UpdateFixtureCategoryData {
  name?: string
  description?: string
  display_order?: number
}

class FixtureCategoryService {
  private supabase = supabase

  // Get all fixture categories
  async getCategories(): Promise<{ categories: FixtureCategory[]; error: FixtureCategoryError | null }> {
    try {
      const { data, error } = await this.supabase
        .from('fixture_categories')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) {
        return {
          categories: [],
          error: { message: error.message, code: error.code }
        }
      }

      return { categories: data || [], error: null }
    } catch (error) {
      return {
        categories: [],
        error: { message: 'Failed to fetch fixture categories' }
      }
    }
  }

  // Create a new fixture category
  async createCategory(data: CreateFixtureCategoryData): Promise<{ category: FixtureCategory | null; error: FixtureCategoryError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { category: null, error: { message: 'User not authenticated' } }
      }

      const { data: category, error } = await this.supabase
        .from('fixture_categories')
        .insert([data])
        .select()
        .single()

      if (error) {
        return {
          category: null,
          error: { message: error.message, code: error.code }
        }
      }

      return { category, error: null }
    } catch (error) {
      return {
        category: null,
        error: { message: 'Failed to create fixture category' }
      }
    }
  }

  // Update a fixture category
  async updateCategory(id: string, data: UpdateFixtureCategoryData): Promise<{ category: FixtureCategory | null; error: FixtureCategoryError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { category: null, error: { message: 'User not authenticated' } }
      }

      const { data: category, error } = await this.supabase
        .from('fixture_categories')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return {
          category: null,
          error: { message: error.message, code: error.code }
        }
      }

      return { category, error: null }
    } catch (error) {
      return {
        category: null,
        error: { message: 'Failed to update fixture category' }
      }
    }
  }

  // Delete a fixture category
  async deleteCategory(id: string): Promise<{ success: boolean; error: FixtureCategoryError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { success: false, error: { message: 'User not authenticated' } }
      }

      const { error } = await this.supabase
        .from('fixture_categories')
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
        error: { message: 'Failed to delete fixture category' }
      }
    }
  }
}

export const fixtureCategoryService = new FixtureCategoryService()
