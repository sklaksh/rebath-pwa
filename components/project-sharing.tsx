'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { projectService } from '@/lib/services'
import { toast } from 'react-hot-toast'
import { UserPlus, UserMinus, Users, Eye, Edit, Shield } from 'lucide-react'

interface ProjectSharingProps {
  projectId: string
  isOwner: boolean
  isAdmin: boolean
}

interface ProjectPermission {
  id: string
  user_id: string
  permission_type: 'view' | 'edit' | 'admin'
  granted_by: string
  granted_at: string
  profiles?: {
    full_name: string | null
    email: string
  }
}

interface User {
  id: string
  full_name: string | null
  email: string
  role: string
}

export function ProjectSharing({ projectId, isOwner, isAdmin }: ProjectSharingProps) {
  const [permissions, setPermissions] = useState<ProjectPermission[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [permissionType, setPermissionType] = useState<'view' | 'edit' | 'admin'>('view')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  const canManageSharing = isOwner || isAdmin

  useEffect(() => {
    if (canManageSharing) {
      loadPermissions()
      loadUsers()
    }
  }, [projectId, canManageSharing])

  const loadPermissions = async () => {
    setLoading(true)
    try {
      const result = await projectService.getProjectPermissions(projectId)
      if (result.error) {
        toast.error(result.error.message)
      } else {
        setPermissions(result.permissions)
      }
    } catch (error) {
      toast.error('Failed to load project permissions')
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const { data: { user } } = await (projectService as any).supabase.auth.getUser()
      if (!user) return

      // Get all users from profiles table
      const { data: profilesData, error } = await (projectService as any).supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .order('full_name')

      if (error) {
        console.error('Error loading users:', error)
        return
      }

      setUsers(profilesData || [])
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }

  const handleShareProject = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user')
      return
    }

    setLoading(true)
    try {
      const result = await projectService.shareProject(projectId, selectedUserId, permissionType)
      if (result.error) {
        toast.error(result.error.message)
      } else {
        toast.success('Project shared successfully!')
        setSelectedUserId('')
        loadPermissions()
      }
    } catch (error) {
      toast.error('Failed to share project')
    } finally {
      setLoading(false)
    }
  }

  const handleRevokeAccess = async (userId: string) => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type "DELETE" to confirm')
      return
    }

    setLoading(true)
    try {
      const result = await projectService.revokeProjectAccess(projectId, userId)
      if (result.error) {
        toast.error(result.error.message)
      } else {
        toast.success('Access revoked successfully!')
        loadPermissions()
        setShowDeleteConfirm(null)
        setDeleteConfirmText('')
      }
    } catch (error) {
      toast.error('Failed to revoke access')
    } finally {
      setLoading(false)
    }
  }

  const startRevokeAccess = (userId: string) => {
    setShowDeleteConfirm(userId)
    setDeleteConfirmText('')
  }

  const cancelRevokeAccess = () => {
    setShowDeleteConfirm(null)
    setDeleteConfirmText('')
  }

  const getPermissionIcon = (type: string) => {
    switch (type) {
      case 'view': return <Eye className="h-4 w-4" />
      case 'edit': return <Edit className="h-4 w-4" />
      case 'admin': return <Shield className="h-4 w-4" />
      default: return <Eye className="h-4 w-4" />
    }
  }

  const getPermissionColor = (type: string) => {
    switch (type) {
      case 'view': return 'bg-blue-100 text-blue-800'
      case 'edit': return 'bg-yellow-100 text-yellow-800'
      case 'admin': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!canManageSharing) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Project Sharing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Share with new user */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Share with user</label>
          <div className="flex gap-2">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select a user...</option>
              {users
                .filter(user => !permissions.some(p => p.user_id === user.id))
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || 'Unknown'} ({user.email}) - {user.role}
                  </option>
                ))}
              {users.filter(user => !permissions.some(p => p.user_id === user.id)).length === 0 && (
                <option value="" disabled>All users already have access</option>
              )}
            </select>
            <select
              value={permissionType}
              onChange={(e) => setPermissionType(e.target.value as 'view' | 'edit' | 'admin')}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="view">View</option>
              <option value="edit">Edit</option>
              <option value="admin">Admin</option>
            </select>
            <Button
              onClick={handleShareProject}
              disabled={loading || !selectedUserId}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        {/* Current permissions */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Current access</label>
          {loading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : permissions.length === 0 ? (
            <div className="text-sm text-gray-500">No shared access</div>
          ) : (
            <div className="space-y-2">
              {permissions.map((permission) => (
                <div
                  key={permission.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getPermissionIcon(permission.permission_type)}
                      <Badge className={getPermissionColor(permission.permission_type)}>
                        {permission.permission_type}
                      </Badge>
                    </div>
                    <div>
                      <div className="font-medium">
                        {permission.profiles?.full_name || 'Unknown User'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {permission.profiles?.email}
                      </div>
                    </div>
                  </div>
                  {showDeleteConfirm === permission.user_id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        placeholder="Type DELETE to confirm"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        className="w-40 text-sm"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRevokeAccess(permission.user_id)}
                        disabled={loading || deleteConfirmText !== 'DELETE'}
                        className="flex items-center gap-2"
                      >
                        <UserMinus className="h-4 w-4" />
                        Confirm
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelRevokeAccess}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startRevokeAccess(permission.user_id)}
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      <UserMinus className="h-4 w-4" />
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
