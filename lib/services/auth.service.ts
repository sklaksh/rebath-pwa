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
            full_name: data.fullName,
            role: 'employee'
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
      const { data: profile, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        return { profile: null, error: { message: error.message } }
      }

      return { profile, error: null }
    } catch (error) {
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
    const { profile } = await this.getUserProfile(user.id)
    return { ...user, profile: profile || undefined }
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback)
  }
}

export const authService = new AuthService()
