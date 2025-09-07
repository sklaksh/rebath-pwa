import { createClient } from '@/lib/supabase/client'
import { User, Session } from '@supabase/supabase-js'
import type { Profile } from '@/lib/supabase/types'

export interface AuthError {
  message: string
  code?: string
}

export interface SignUpData {
  email: string
  password: string
  fullName?: string
}

export interface SignInData {
  email: string
  password: string
}

export interface AuthUser extends User {
  profile?: Profile
}

class AuthService {
  private supabase = createClient()

  async signUp(data: SignUpData): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data: result, error } = await this.supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName
          }
        }
      })

      if (error) {
        return {
          user: null,
          error: { message: error.message, code: error.name }
        }
      }

      if (result.user) {
        const userWithProfile = await this.getUserWithProfile(result.user)
        return {
          user: userWithProfile,
          error: null
        }
      }

      return {
        user: null,
        error: null
      }
    } catch (error) {
      return {
        user: null,
        error: { message: 'An unexpected error occurred during sign up' }
      }
    }
  }

  async signIn(data: SignInData): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data: result, error } = await this.supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        return {
          user: null,
          error: { message: error.message, code: error.name }
        }
      }

      if (result.user) {
        const userWithProfile = await this.getUserWithProfile(result.user)
        return {
          user: userWithProfile,
          error: null
        }
      }

      return {
        user: null,
        error: null
      }
    } catch (error) {
      return {
        user: null,
        error: { message: 'An unexpected error occurred during sign in' }
      }
    }
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await this.supabase.auth.signOut()
      
      if (error) {
        return {
          error: { message: error.message, code: error.name }
        }
      }

      return { error: null }
    } catch (error) {
      return {
        error: { message: 'An unexpected error occurred during sign out' }
      }
    }
  }

  async getCurrentSession(): Promise<{ session: Session | null; error: AuthError | null }> {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession()
      
      if (error) {
        return {
          session: null,
          error: { message: error.message, code: error.name }
        }
      }

      return {
        session,
        error: null
      }
    } catch (error) {
      return {
        session: null,
        error: { message: 'An unexpected error occurred while getting session' }
      }
    }
  }

  async getCurrentUser(): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser()
      
      if (error) {
        return {
          user: null,
          error: { message: error.message, code: error.name }
        }
      }

      if (user) {
        const userWithProfile = await this.getUserWithProfile(user)
        return {
          user: userWithProfile,
          error: null
        }
      }

      return {
        user: null,
        error: null
      }
    } catch (error) {
      return {
        user: null,
        error: { message: 'An unexpected error occurred while getting user' }
      }
    }
  }

  async getUserProfile(userId: string): Promise<{ profile: Profile | null; error: AuthError | null }> {
    try {
      console.log('Fetching profile for user ID:', userId)
      const { data: profile, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      console.log('Profile query result:', { profile, error })

      if (error) {
        console.error('Profile fetch error:', error)
        return { profile: null, error: { message: error.message } }
      }

      console.log('Profile data:', profile)
      return { profile, error: null }
    } catch (error) {
      console.error('Profile fetch exception:', error)
      return { profile: null, error: { message: 'An unexpected error occurred' } }
    }
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<{ profile: Profile | null; error: AuthError | null }> {
    try {
      const { data: profile, error } = await this.supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        return { profile: null, error: { message: error.message } }
      }

      return { profile, error: null }
    } catch (error) {
      return { profile: null, error: { message: 'An unexpected error occurred' } }
    }
  }

  private async getUserWithProfile(user: User): Promise<AuthUser> {
    console.log('Getting profile for user:', user.id)
    const { profile, error } = await this.getUserProfile(user.id)
    console.log('Profile result:', { profile, error })
    return { ...user, profile: profile || undefined }
  }

  // Check if current user is admin
  async isAdmin(): Promise<boolean> {
    try {
      const { user } = await this.getCurrentUser()
      console.log('isAdmin check - user:', user?.id, 'profile:', user?.profile)
      return user?.profile?.role === 'admin'
    } catch (error) {
      console.error('Error in isAdmin:', error)
      return false
    }
  }

  // Force refresh user profile (useful after role changes)
  async refreshUserProfile(): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { user: null, error: { message: 'No authenticated user' } }
      }

      // Force fetch fresh profile data
      const { profile, error } = await this.getUserProfile(user.id)
      if (error) {
        return { user: null, error }
      }

      const userWithProfile = { ...user, profile: profile || undefined }
      return { user: userWithProfile, error: null }
    } catch (error) {
      return { user: null, error: { message: 'Failed to refresh user profile' } }
    }
  }

  // Get all users (admin only)
  async getAllUsers(): Promise<{ users: any[]; error: AuthError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { users: [], error: { message: 'Not authenticated' } }
      }

      // Check if user is admin
      const { profile } = await this.getUserProfile(user.id)
      if (profile?.role !== 'admin') {
        return { users: [], error: { message: 'Admin access required' } }
      }

      const { data: profiles, error } = await this.supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        return { users: [], error: { message: error.message } }
      }

      return { users: profiles || [], error: null }
    } catch (error) {
      return { users: [], error: { message: 'An unexpected error occurred' } }
    }
  }

  // Approve user (admin only)
  async approveUser(userId: string): Promise<{ success: boolean; error: AuthError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { success: false, error: { message: 'Not authenticated' } }
      }

      // Check if user is admin
      const { profile } = await this.getUserProfile(user.id)
      if (profile?.role !== 'admin') {
        return { success: false, error: { message: 'Admin access required' } }
      }

      const { error } = await this.supabase
        .from('profiles')
        .update({ approved: true, is_active: true })
        .eq('id', userId)

      if (error) {
        return { success: false, error: { message: error.message } }
      }

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: { message: 'An unexpected error occurred' } }
    }
  }

  // Make user admin (admin only)
  async makeAdmin(userId: string): Promise<{ success: boolean; error: AuthError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { success: false, error: { message: 'Not authenticated' } }
      }

      // Check if user is admin
      const { profile } = await this.getUserProfile(user.id)
      if (profile?.role !== 'admin') {
        return { success: false, error: { message: 'Admin access required' } }
      }

      const { error } = await this.supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', userId)

      if (error) {
        return { success: false, error: { message: error.message } }
      }

      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: { message: 'An unexpected error occurred' } }
    }
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback)
  }
}

export const authService = new AuthService()
