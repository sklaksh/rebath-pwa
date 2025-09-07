'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { authService } from '@/lib/services'
import { supabase } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isActive: boolean | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isActive, setIsActive] = useState<boolean | null>(null)

  const checkUserStatus = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('approved, is_active')
        .eq('id', userId)
        .single()
      
      if (!error && profile) {
        // User is active if they are both approved AND is_active
        const isUserActive = profile.approved && profile.is_active
        setIsActive(isUserActive)
      } else {
        // If there's an error or no profile, assume user is NOT active
        // This prevents unauthorized access
        console.warn('Could not check user status, assuming inactive:', error)
        setIsActive(false)
      }
    } catch (error) {
      console.error('Error checking user status:', error)
      // Assume user is NOT active to prevent unauthorized access
      setIsActive(false)
    }
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { session, error } = await authService.getCurrentSession()
      if (!error && session) {
        setSession(session)
        setUser(session.user ?? null)
        if (session.user) {
          await checkUserStatus(session.user.id)
        }
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          await checkUserStatus(session.user.id)
        } else {
          setIsActive(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    try {
      console.log('AuthProvider signOut called')
      const { error } = await authService.signOut()
      console.log('AuthService signOut result:', { error })
      if (!error) {
        setUser(null)
        setSession(null)
        setIsActive(null)
        console.log('AuthProvider state cleared')
      } else {
        console.error('Sign out error:', error)
      }
    } catch (error) {
      console.error('Sign out exception:', error)
    }
  }

  const value = {
    user,
    session,
    loading,
    isActive,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
