'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Home, 
  Bath, 
  ChefHat, 
  Calculator, 
  Calendar, 
  Settings, 
  User,
  Plus,
  Search,
  Filter,
  LogOut,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ProtectedRoute } from '@/components/protected-route'
import { useAuth } from '@/components/auth-provider'
import { projectService, roomService } from '@/lib/services'
import { toast } from 'react-hot-toast'
import type { Project, RoomType } from '@/lib/services'

function DashboardContent() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [recentProjects, setRecentProjects] = useState<Project[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load recent projects
        const { projects, error: projectsError } = await projectService.getRecentProjects(3)
        if (projectsError) {
          toast.error('Failed to load recent projects')
          console.error('Error loading projects:', projectsError)
        } else {
          setRecentProjects(projects)
        }

        // Load room types for quick actions
        const { roomTypes: fetchedRoomTypes, error: roomTypesError } = await roomService.getRoomTypes()
        if (roomTypesError) {
          toast.error('Failed to load room types')
          console.error('Error loading room types:', roomTypesError)
        } else {
          // Take only the first 3 room types for quick actions
          setRoomTypes(fetchedRoomTypes.slice(0, 3))
        }
      } catch (error) {
        toast.error('Failed to load data')
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
      router.push('/login')
    } catch (error) {
      toast.error('Error signing out')
    }
  }

  const getQuickActions = () => {
    const actions = [
      {
        title: 'New Project',
        description: 'Start a new bath remodel project',
        icon: Plus,
        color: 'bg-primary-500',
        href: '/projects/new'
      },
      {
        title: 'All Assessments',
        description: 'View all available room types',
        icon: Search,
        color: 'bg-gray-500',
        href: '/assessment'
      }
    ]

    // Add room type assessments (limit to 2 to keep grid balanced)
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-green-500', 'bg-red-500', 'bg-indigo-500']
    roomTypes.slice(0, 2).forEach((roomType, index) => {
      actions.push({
        title: roomType.displayName,
        description: roomType.description || `Assess ${roomType.displayName.toLowerCase()} fixtures`,
        icon: Bath, // Default icon, could be made dynamic based on roomType.icon
        color: colors[index % colors.length],
        href: `/assessment/${roomType.name}`
      })
    })

    return actions
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'quote_ready':
        return 'bg-green-100 text-green-800'
      case 'assessment':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">ReBath PWA</h1>
            {user && (
              <p className="text-sm text-gray-600">Welcome, {user.email}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-gray-600 hover:text-red-600"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search projects, clients, or addresses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            {getQuickActions().map((action) => (
              <Card
                key={action.title}
                className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(action.href)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${action.color}`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/projects')}
            >
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                <span className="ml-2 text-gray-600">Loading projects...</span>
              </div>
            ) : recentProjects.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-500">No projects yet. Create your first project to get started.</p>
                <Button
                  className="mt-4"
                  onClick={() => router.push('/projects/new')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </Card>
            ) : (
              recentProjects.map((project) => (
                <Card
                  key={project.id}
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{project.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(project.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {project.progress}%
                      </div>
                      <div className="w-16 h-2 bg-gray-200 rounded-full mt-1">
                        <div
                          className="h-2 bg-primary-500 rounded-full"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Tools Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tools</h2>
          <div className="grid grid-cols-2 gap-4">
            <Card
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push('/calculator')}
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-green-500">
                  <Calculator className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Price Calculator</h3>
                  <p className="text-sm text-gray-500">Calculate project costs</p>
                </div>
              </div>
            </Card>
            <Card
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push('/schedule')}
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-purple-500">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Schedule</h3>
                  <p className="text-sm text-gray-500">View appointments</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-around">
          <button className="flex flex-col items-center space-y-1 p-2 text-primary-600">
            <Home className="h-6 w-6" />
            <span className="text-xs">Home</span>
          </button>
          <button 
            className="flex flex-col items-center space-y-1 p-2 text-gray-500 hover:text-primary-600"
            onClick={() => router.push('/projects')}
          >
            <Bath className="h-6 w-6" />
            <span className="text-xs">Projects</span>
          </button>
          <button 
            className="flex flex-col items-center space-y-1 p-2 text-gray-500 hover:text-primary-600"
            onClick={() => router.push('/calculator')}
          >
            <Calculator className="h-6 w-6" />
            <span className="text-xs">Calculator</span>
          </button>
          <button 
            className="flex flex-col items-center space-y-1 p-2 text-gray-500 hover:text-primary-600"
            onClick={() => router.push('/schedule')}
          >
            <Calendar className="h-6 w-6" />
            <span className="text-xs">Schedule</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
