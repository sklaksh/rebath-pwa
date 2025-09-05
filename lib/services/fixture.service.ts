import { createClient } from '@/lib/supabase/client'
import type { FixtureCategory as DbFixtureCategory, FixtureOption as DbFixtureOption } from '@/lib/supabase/types'

export interface FixtureCategory {
  id: string
  name: string
  description?: string
  displayOrder: number
  createdAt: string
}

export interface FixtureOption {
  id: string
  categoryId: string
  name: string
  description?: string
  brand: string
  model: string
  size?: string
  material?: string
  color?: string
  basePrice: number
  installationCost: number
  imageUrl?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface FixtureError {
  message: string
  code?: string
}

class FixtureService {
  private supabase = createClient()

  // Get all fixture categories
  async getCategories(): Promise<{ categories: FixtureCategory[]; error: FixtureError | null }> {
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

      const categories = data.map(this.mapDbCategoryToCategory)
      return { categories, error: null }
    } catch (error) {
      return {
        categories: [],
        error: { message: 'Failed to fetch fixture categories' }
      }
    }
  }

  // Get fixture options by category
  async getOptionsByCategory(categoryId: string): Promise<{ options: FixtureOption[]; error: FixtureError | null }> {
    try {
      const { data, error } = await this.supabase
        .from('fixture_options')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('brand', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        return {
          options: [],
          error: { message: error.message, code: error.code }
        }
      }

      const options = data.map(this.mapDbOptionToOption)
      return { options, error: null }
    } catch (error) {
      return {
        options: [],
        error: { message: 'Failed to fetch fixture options' }
      }
    }
  }

  // Get all active fixture options
  async getAllOptions(): Promise<{ options: FixtureOption[]; error: FixtureError | null }> {
    try {
      const { data, error } = await this.supabase
        .from('fixture_options')
        .select('*')
        .eq('is_active', true)
        .order('brand', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        return {
          options: [],
          error: { message: error.message, code: error.code }
        }
      }

      const options = data.map(this.mapDbOptionToOption)
      return { options, error: null }
    } catch (error) {
      return {
        options: [],
        error: { message: 'Failed to fetch fixture options' }
      }
    }
  }

  // Get a specific fixture option by ID
  async getOption(id: string): Promise<{ option: FixtureOption | null; error: FixtureError | null }> {
    try {
      const { data, error } = await this.supabase
        .from('fixture_options')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        return {
          option: null,
          error: { message: error.message, code: error.code }
        }
      }

      const option = this.mapDbOptionToOption(data)
      return { option, error: null }
    } catch (error) {
      return {
        option: null,
        error: { message: 'Failed to fetch fixture option' }
      }
    }
  }

  // Search fixture options
  async searchOptions(query: string): Promise<{ options: FixtureOption[]; error: FixtureError | null }> {
    try {
      const { data, error } = await this.supabase
        .from('fixture_options')
        .select('*')
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,brand.ilike.%${query}%,model.ilike.%${query}%`)
        .order('brand', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        return {
          options: [],
          error: { message: error.message, code: error.code }
        }
      }

      const options = data.map(this.mapDbOptionToOption)
      return { options, error: null }
    } catch (error) {
      return {
        options: [],
        error: { message: 'Failed to search fixture options' }
      }
    }
  }

  // Get fixture options by price range
  async getOptionsByPriceRange(minPrice: number, maxPrice: number): Promise<{ options: FixtureOption[]; error: FixtureError | null }> {
    try {
      const { data, error } = await this.supabase
        .from('fixture_options')
        .select('*')
        .eq('is_active', true)
        .gte('base_price', minPrice)
        .lte('base_price', maxPrice)
        .order('base_price', { ascending: true })

      if (error) {
        return {
          options: [],
          error: { message: error.message, code: error.code }
        }
      }

      const options = data.map(this.mapDbOptionToOption)
      return { options, error: null }
    } catch (error) {
      return {
        options: [],
        error: { message: 'Failed to fetch fixture options by price range' }
      }
    }
  }

  // Get fixture options by brand
  async getOptionsByBrand(brand: string): Promise<{ options: FixtureOption[]; error: FixtureError | null }> {
    try {
      const { data, error } = await this.supabase
        .from('fixture_options')
        .select('*')
        .eq('is_active', true)
        .eq('brand', brand)
        .order('name', { ascending: true })

      if (error) {
        return {
          options: [],
          error: { message: error.message, code: error.code }
        }
      }

      const options = data.map(this.mapDbOptionToOption)
      return { options, error: null }
    } catch (error) {
      return {
        options: [],
        error: { message: 'Failed to fetch fixture options by brand' }
      }
    }
  }

  // Get all unique brands
  async getBrands(): Promise<{ brands: string[]; error: FixtureError | null }> {
    try {
      const { data, error } = await this.supabase
        .from('fixture_options')
        .select('brand')
        .eq('is_active', true)
        .order('brand', { ascending: true })

      if (error) {
        return {
          brands: [],
          error: { message: error.message, code: error.code }
        }
      }

      const brands = Array.from(new Set(data.map(item => item.brand))).filter(Boolean)
      return { brands, error: null }
    } catch (error) {
      return {
        brands: [],
        error: { message: 'Failed to fetch brands' }
      }
    }
  }

  // Calculate total price for a fixture option
  calculateTotalPrice(option: FixtureOption, quantity: number = 1): number {
    return (option.basePrice + option.installationCost) * quantity
  }

  // Map database category to application category
  private mapDbCategoryToCategory(dbCategory: DbFixtureCategory): FixtureCategory {
    return {
      id: dbCategory.id,
      name: dbCategory.name,
      description: dbCategory.description || undefined,
      displayOrder: dbCategory.display_order,
      createdAt: dbCategory.created_at
    }
  }

  // Map database option to application option
  private mapDbOptionToOption(dbOption: DbFixtureOption): FixtureOption {
    return {
      id: dbOption.id,
      categoryId: dbOption.category_id,
      name: dbOption.name,
      description: dbOption.description || undefined,
      brand: dbOption.brand,
      model: dbOption.model,
      size: dbOption.size || undefined,
      material: dbOption.material || undefined,
      color: dbOption.color || undefined,
      basePrice: dbOption.base_price,
      installationCost: dbOption.installation_cost,
      imageUrl: dbOption.image_url || undefined,
      isActive: dbOption.is_active,
      createdAt: dbOption.created_at,
      updatedAt: dbOption.updated_at
    }
  }
}

export const fixtureService = new FixtureService()
