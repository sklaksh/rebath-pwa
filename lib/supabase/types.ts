export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'admin' | 'user'
          approved: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'user'
          approved?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'user'
          approved?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          user_name: string | null
          client_name: string
          client_email: string | null
          client_phone: string | null
          address: string
          project_type: 'bathroom' | 'kitchen' | 'full_remodel'
          status: 'assessment' | 'quote_ready' | 'started' | 'in_progress' | 'completed' | 'cancelled'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          estimated_start_date: string | null
          estimated_completion_date: string | null
          actual_start_date: string | null
          actual_completion_date: string | null
          total_budget: number | null
          job_description: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          user_name?: string | null
          client_name: string
          client_email?: string | null
          client_phone?: string | null
          address: string
          project_type: 'bathroom' | 'kitchen' | 'full_remodel'
          status?: 'assessment' | 'quote_ready' | 'started' | 'in_progress' | 'completed' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          estimated_start_date?: string | null
          estimated_completion_date?: string | null
          actual_start_date?: string | null
          actual_completion_date?: string | null
          total_budget?: number | null
          job_description?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          user_name?: string | null
          client_name?: string
          client_email?: string | null
          client_phone?: string | null
          address?: string
          project_type?: 'bathroom' | 'kitchen' | 'full_remodel'
          status?: 'assessment' | 'quote_ready' | 'started' | 'in_progress' | 'completed' | 'cancelled'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          estimated_start_date?: string | null
          estimated_completion_date?: string | null
          actual_start_date?: string | null
          actual_completion_date?: string | null
          total_budget?: number | null
          job_description?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      project_permissions: {
        Row: {
          id: string
          project_id: string
          user_id: string
          permission_type: 'view' | 'edit' | 'admin'
          granted_by: string
          granted_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          permission_type?: 'view' | 'edit' | 'admin'
          granted_by: string
          granted_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          permission_type?: 'view' | 'edit' | 'admin'
          granted_by?: string
          granted_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      room_types: {
        Row: {
          id: string
          name: string
          display_name: string
          description: string | null
          icon: string | null
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          description?: string | null
          icon?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          description?: string | null
          icon?: string | null
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      assessments: {
        Row: {
          id: string
          project_id: string
          user_id: string
          room_type: string
          room_name: string
          fixtures: Json
          measurements: Json
          photos: string[] | null
          notes: string | null
          status: 'draft' | 'submitted' | 'reviewed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          room_type: string
          room_name: string
          fixtures: Json
          measurements: Json
          photos?: string[] | null
          notes?: string | null
          status?: 'draft' | 'submitted' | 'reviewed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          room_type?: string
          room_name?: string
          fixtures?: Json
          measurements?: Json
          photos?: string[] | null
          notes?: string | null
          status?: 'draft' | 'submitted' | 'reviewed'
          created_at?: string
          updated_at?: string
        }
      }
      quotes: {
        Row: {
          id: string
          project_id: string
          user_id: string
          assessment_id: string | null
          quote_number: string
          items: Json
          subtotal: number
          tax_rate: number
          tax_amount: number
          discount_percentage: number
          discount_amount: number
          total: number
          valid_until: string
          status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          assessment_id?: string | null
          quote_number?: string
          items: Json
          subtotal: number
          tax_rate?: number
          tax_amount?: number
          discount_percentage?: number
          discount_amount?: number
          total: number
          valid_until?: string
          status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          assessment_id?: string | null
          quote_number?: string
          items?: Json
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          discount_percentage?: number
          discount_amount?: number
          total?: number
          valid_until?: string
          status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      fixture_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      fixture_options: {
        Row: {
          id: string
          category_id: string
          name: string
          description: string | null
          brand: string
          model: string
          size: string | null
          material: string | null
          color: string | null
          base_price: number
          installation_cost: number
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          name: string
          description?: string | null
          brand: string
          model: string
          size?: string | null
          material?: string | null
          color?: string | null
          base_price: number
          installation_cost?: number
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          name?: string
          description?: string | null
          brand?: string
          model?: string
          size?: string | null
          material?: string | null
          color?: string | null
          base_price?: number
          installation_cost?: number
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      offline_drafts: {
        Row: {
          id: string
          user_id: string
          type: 'assessment' | 'quote' | 'project'
          data: Json
          sync_status: 'pending' | 'synced' | 'failed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'assessment' | 'quote' | 'project'
          data: Json
          sync_status?: 'pending' | 'synced' | 'failed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'assessment' | 'quote' | 'project'
          data?: Json
          sync_status?: 'pending' | 'synced' | 'failed'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Type helpers
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific table types
export type Profile = Tables<'profiles'>
export type Project = Tables<'projects'>
export type Assessment = Tables<'assessments'>
export type Quote = Tables<'quotes'>
export type FixtureCategory = Tables<'fixture_categories'>
export type FixtureOption = Tables<'fixture_options'>
export type OfflineDraft = Tables<'offline_drafts'>

// Extended types for the application
export interface FixtureData {
  id: string
  name: string
  brand: string
  model: string
  size?: string
  material?: string
  color?: string
  condition: 'excellent' | 'good' | 'fair' | 'poor'
  notes?: string
}

export interface AssessmentData {
  id: string
  projectId: string
  roomType: 'guest_bathroom' | 'master_bathroom' | 'kitchen' | 'other'
  roomName: string
  fixtures: FixtureData[]
  measurements: {
    width: number
    length: number
    height: number
    notes?: string
  }
  photos: string[]
  notes?: string
  status: 'draft' | 'submitted' | 'reviewed'
  createdAt: string
  updatedAt: string
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

export type RoomType = Database['public']['Tables']['room_types']['Row']
