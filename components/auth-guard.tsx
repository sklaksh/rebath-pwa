'use client'

import { useAuth } from './auth-provider'
import { PendingApproval } from './pending-approval'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, isActive } = useAuth()

  // Show loading while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If user is logged in but not active, show pending approval
  if (user && isActive === false) {
    return <PendingApproval />
  }

  // If user is logged in and active, or not logged in, show normal content
  return <>{children}</>
}
