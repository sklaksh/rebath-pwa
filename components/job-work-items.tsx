'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Save, X, Clock, AlertCircle, CheckCircle, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { jobWorkService, JobWorkItem, CreateJobWorkItemData, UpdateJobWorkItemData, roomService, RoomType } from '@/lib/services'

interface JobWorkItemsProps {
  projectId: string
  onWorkItemsChange?: (workItems: JobWorkItem[]) => void
}

export function JobWorkItems({ projectId, onWorkItemsChange }: JobWorkItemsProps) {
  const [workItems, setWorkItems] = useState<JobWorkItem[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [newItem, setNewItem] = useState<CreateJobWorkItemData>({
    projectId,
    roomType: '',
    workDescription: '',
    estimatedHours: undefined,
    priority: 'medium'
  })
  const [editingData, setEditingData] = useState<UpdateJobWorkItemData>({})

  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    setLoading(true)
    try {
      console.log('Loading data for project:', projectId)
      
      const [workItemsResult, roomTypesResult] = await Promise.all([
        jobWorkService.getWorkItemsByProject(projectId),
        roomService.getRoomTypes()
      ])

      console.log('Work items result:', workItemsResult)
      console.log('Room types result:', roomTypesResult)

      if (workItemsResult.error) {
        console.error('Failed to load work items:', workItemsResult.error)
      } else {
        setWorkItems(workItemsResult.data || [])
        onWorkItemsChange?.(workItemsResult.data || [])
      }

      if (roomTypesResult.error) {
        console.error('Failed to load room types:', roomTypesResult.error)
      } else {
        console.log('Loaded room types:', roomTypesResult.roomTypes)
        setRoomTypes(roomTypesResult.roomTypes || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddWorkItem = async () => {
    if (!newItem.roomType || !newItem.workDescription.trim()) {
      return
    }

    const result = await jobWorkService.createWorkItem(newItem)
    if (result.error) {
      console.error('Failed to create work item:', result.error)
      return
    }

    setWorkItems(prev => [...prev, result.data!])
    onWorkItemsChange?.([...workItems, result.data!])
    
    // Reset form
    setNewItem({
      projectId,
      roomType: '',
      workDescription: '',
      estimatedHours: undefined,
      priority: 'medium'
    })
  }

  const handleUpdateWorkItem = async (itemId: string) => {
    const result = await jobWorkService.updateWorkItem(itemId, editingData)
    if (result.error) {
      console.error('Failed to update work item:', result.error)
      return
    }

    setWorkItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, ...editingData, updatedAt: new Date().toISOString() }
        : item
    ))
    onWorkItemsChange?.(workItems.map(item => 
      item.id === itemId 
        ? { ...item, ...editingData, updatedAt: new Date().toISOString() }
        : item
    ))

    setEditingItem(null)
    setEditingData({})
  }

  const handleDeleteWorkItem = async (itemId: string) => {
    const result = await jobWorkService.deleteWorkItem(itemId)
    if (result.error) {
      console.error('Failed to delete work item:', result.error)
      return
    }

    setWorkItems(prev => prev.filter(item => item.id !== itemId))
    onWorkItemsChange?.(workItems.filter(item => item.id !== itemId))
  }

  const startEditing = (item: JobWorkItem) => {
    setEditingItem(item.id)
    setEditingData({
      roomType: item.roomType,
      workDescription: item.workDescription,
      estimatedHours: item.estimatedHours,
      priority: item.priority,
      status: item.status
    })
  }

  const cancelEditing = () => {
    setEditingItem(null)
    setEditingData({})
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'in_progress': return <Clock className="w-4 h-4" />
      case 'cancelled': return <X className="w-4 h-4" />
      case 'pending': return <Circle className="w-4 h-4" />
      default: return <Circle className="w-4 h-4" />
    }
  }

  const groupedWorkItems = workItems.reduce((acc, item) => {
    if (!acc[item.roomType]) {
      acc[item.roomType] = []
    }
    acc[item.roomType].push(item)
    return acc
  }, {} as Record<string, JobWorkItem[]>)

  if (loading) {
    return <div className="text-center py-4">Loading work items...</div>
  }

  return (
    <div className="space-y-6">
      {/* Add New Work Item */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Add Work Item</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Room Type
            </label>
            <select
              value={newItem.roomType}
              onChange={(e) => setNewItem(prev => ({ ...prev, roomType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select room...</option>
              {roomTypes.map(room => (
                <option key={room.id} value={room.name}>
                  {room.displayName}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Work Description
            </label>
            <Input
              value={newItem.workDescription}
              onChange={(e) => setNewItem(prev => ({ ...prev, workDescription: e.target.value }))}
              placeholder="e.g., Remove old vanity, install new one"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Hours
            </label>
            <Input
              type="number"
              value={newItem.estimatedHours || ''}
              onChange={(e) => setNewItem(prev => ({ 
                ...prev, 
                estimatedHours: e.target.value ? parseInt(e.target.value) : undefined 
              }))}
              placeholder="e.g., 4"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={newItem.priority}
              onChange={(e) => setNewItem(prev => ({ 
                ...prev, 
                priority: e.target.value as 'low' | 'medium' | 'high' 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4">
          <Button onClick={handleAddWorkItem} disabled={!newItem.roomType || !newItem.workDescription.trim()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Work Item
          </Button>
        </div>
      </Card>

      {/* Work Items by Room */}
      {Object.keys(groupedWorkItems).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(groupedWorkItems).map(([roomType, items]) => (
            <Card key={roomType} className="p-4">
              <h4 className="text-lg font-semibold mb-3 flex items-center">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm mr-2">
                  {roomType}
                </span>
                <span className="text-sm text-gray-500">
                  {items.length} work item{items.length !== 1 ? 's' : ''}
                </span>
              </h4>
              
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                    {editingItem === item.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Room Type
                            </label>
                            <select
                              value={editingData.roomType || ''}
                              onChange={(e) => setEditingData(prev => ({ ...prev, roomType: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {roomTypes.map(room => (
                                <option key={room.id} value={room.name}>
                                  {room.displayName}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Priority
                            </label>
                            <select
                              value={editingData.priority || ''}
                              onChange={(e) => setEditingData(prev => ({ 
                                ...prev, 
                                priority: e.target.value as 'low' | 'medium' | 'high' 
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Work Description
                          </label>
                          <textarea
                            value={editingData.workDescription || ''}
                            onChange={(e) => setEditingData(prev => ({ ...prev, workDescription: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={2}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Estimated Hours
                            </label>
                            <Input
                              type="number"
                              value={editingData.estimatedHours || ''}
                              onChange={(e) => setEditingData(prev => ({ 
                                ...prev, 
                                estimatedHours: e.target.value ? parseInt(e.target.value) : undefined 
                              }))}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Status
                            </label>
                            <select
                              value={editingData.status || ''}
                              onChange={(e) => setEditingData(prev => ({ 
                                ...prev, 
                                status: e.target.value as 'pending' | 'in_progress' | 'completed' | 'cancelled' 
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button onClick={() => handleUpdateWorkItem(item.id)} size="sm">
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </Button>
                          <Button onClick={cancelEditing} variant="outline" size="sm">
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-gray-900 font-medium">{item.workDescription}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={getPriorityColor(item.priority)}>
                              {item.priority}
                            </Badge>
                            <Badge className={getStatusColor(item.status)}>
                              <span className="flex items-center gap-1">
                                {getStatusIcon(item.status)}
                                {item.status.replace('_', ' ')}
                              </span>
                            </Badge>
                            {item.estimatedHours && (
                              <span className="text-sm text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {item.estimatedHours}h
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-1">
                          <Button onClick={() => startEditing(item)} variant="outline" size="sm">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button onClick={() => handleDeleteWorkItem(item.id)} variant="outline" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Work Items Yet</h3>
          <p className="text-gray-500">
            Add work items above to define the specific tasks for each room in this project.
          </p>
        </Card>
      )}
    </div>
  )
}
