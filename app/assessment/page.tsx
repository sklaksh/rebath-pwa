'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ProtectedRoute } from '@/components/protected-route'
import { roomService, type RoomType } from '@/lib/services'
import { toast } from 'react-hot-toast'

function AssessmentSelectionContent() {
  const router = useRouter()
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const { roomTypes: fetchedRoomTypes, error } = await roomService.getRoomTypes()
        if (error) {
          toast.error('Failed to load room types')
          return
        }
        setRoomTypes(fetchedRoomTypes)
      } catch (error) {
        toast.error('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchRoomTypes()
  }, [])

  const filteredRoomTypes = roomTypes.filter(roomType =>
    roomType.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (roomType.description && roomType.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleRoomTypeSelect = (roomType: RoomType) => {
    router.push(`/assessment/${roomType.name}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading room types...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">New Assessment</h1>
              <p className="text-sm text-gray-500">Select a room type to assess</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search room types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Room Types Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoomTypes.map((roomType) => (
              <Card 
                key={roomType.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleRoomTypeSelect(roomType)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <span className="text-2xl">{roomType.icon}</span>
                    <span>{roomType.displayName}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {roomType.description && (
                    <p className="text-sm text-gray-600 mb-4">
                      {roomType.description}
                    </p>
                  )}
                  <Button className="w-full" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Start Assessment
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRoomTypes.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No room types found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search terms.' : 'No room types are available at the moment.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AssessmentSelection() {
  return (
    <ProtectedRoute>
      <AssessmentSelectionContent />
    </ProtectedRoute>
  )
}
