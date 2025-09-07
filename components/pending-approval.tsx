'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Mail, LogOut } from 'lucide-react'
import { useAuth } from './auth-provider'
import { useRouter } from 'next/navigation'

export function PendingApproval() {
  const { signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      console.log('Sign out button clicked')
      await signOut()
      console.log('Sign out completed')
      // Redirect to login page after sign out
      router.push('/login')
    } catch (error) {
      console.error('Error during sign out:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
          <CardTitle className="text-xl">Account Pending Approval</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Your account has been created successfully, but it's currently pending approval from an administrator.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Mail className="h-4 w-4" />
            <span>You'll receive an email once your account is approved.</span>
          </div>
          <div className="pt-4">
            <p className="text-sm text-gray-500">
              If you have any questions, please contact your administrator.
            </p>
          </div>
          <div className="pt-4">
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
