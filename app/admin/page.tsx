'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/page-header'
import { ProtectedRoute } from '@/components/protected-route'
import { authService, fixtureCategoryService, fixtureOptionService, roomService } from '@/lib/services'
import { createClient } from '@/lib/supabase/client'
import type { FixtureCategory, FixtureOption, RoomType } from '@/lib/supabase/types'
import { 
  Users, 
  Settings, 
  Package, 
  Home, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  UserPlus
} from 'lucide-react'

function AdminContent() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [categories, setCategories] = useState<FixtureCategory[]>([])
  const [options, setOptions] = useState<FixtureOption[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [editingCategory, setEditingCategory] = useState<FixtureCategory | null>(null)
  const [editingRoomType, setEditingRoomType] = useState<RoomType | null>(null)
  const [editingOption, setEditingOption] = useState<FixtureOption | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDescription, setNewCategoryDescription] = useState('')
  const [newRoomTypeName, setNewRoomTypeName] = useState('')
  const [newRoomTypeDescription, setNewRoomTypeDescription] = useState('')
  const [newOptionName, setNewOptionName] = useState('')
  const [newOptionDescription, setNewOptionDescription] = useState('')
  const [newOptionCategoryId, setNewOptionCategoryId] = useState('')
  const [newOptionBrand, setNewOptionBrand] = useState('')
  const [newOptionModel, setNewOptionModel] = useState('')
  const [newOptionSize, setNewOptionSize] = useState('')
  const [newOptionMaterial, setNewOptionMaterial] = useState('')
  const [newOptionColor, setNewOptionColor] = useState('')
  const [newOptionBasePrice, setNewOptionBasePrice] = useState('')
  const [newOptionInstallationCost, setNewOptionInstallationCost] = useState('')
  const [newOptionImageUrl, setNewOptionImageUrl] = useState('')
  const [newOptionIsActive, setNewOptionIsActive] = useState(true)
  const [activeTab, setActiveTab] = useState('users')
  const [editingUser, setEditingUser] = useState<any | null>(null)
  const [newUserFullName, setNewUserFullName] = useState('')
  const [newUserApproved, setNewUserApproved] = useState(true)
  const [newUserActive, setNewUserActive] = useState(true)

  useEffect(() => {
    const checkAdminAndLoadData = async () => {
      try {
        const adminStatus = await authService.isAdmin()
        if (!adminStatus) {
          toast.error('Admin access required')
          router.push('/')
          return
        }
        
        setIsAdmin(true)
        await loadAllData()
      } catch (error) {
        console.error('Error checking admin status:', error)
        toast.error('Failed to verify admin access')
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    checkAdminAndLoadData()
  }, [router])

  const loadAllData = async () => {
    try {
      // Load users
      const { users: fetchedUsers } = await authService.getAllUsers()
      setUsers(fetchedUsers)

      // Load fixture categories
      const { categories: fetchedCategories } = await fixtureCategoryService.getCategories()
      setCategories(fetchedCategories)

      // Load fixture options
      const { options: fetchedOptions } = await fixtureOptionService.getOptions()
      setOptions(fetchedOptions)

      // Load room types
      const { roomTypes: fetchedRoomTypes } = await roomService.getRoomTypes()
      setRoomTypes(fetchedRoomTypes)
    } catch (error) {
      console.error('Error loading admin data:', error)
      toast.error('Failed to load admin data')
    }
  }

  const handleApproveUser = async (userId: string) => {
    try {
      const { success, error } = await authService.approveUser(userId)
      if (error) {
        toast.error(`Failed to approve user: ${error.message}`)
      } else {
        toast.success('User approved successfully!')
        await loadAllData()
      }
    } catch (error) {
      console.error('Error approving user:', error)
      toast.error('An unexpected error occurred')
    }
  }

  const handleMakeAdmin = async (userId: string) => {
    try {
      const { success, error } = await authService.makeAdmin(userId)
      if (error) {
        toast.error(`Failed to make user admin: ${error.message}`)
      } else {
        toast.success('User promoted to admin!')
        await loadAllData()
      }
    } catch (error) {
      console.error('Error making user admin:', error)
      toast.error('An unexpected error occurred')
    }
  }

  const handleEditCategory = (category: FixtureCategory) => {
    setEditingCategory(category)
    setNewCategoryName(category.name)
    setNewCategoryDescription(category.description || '')
  }

  const handleSaveCategory = async () => {
    if (!editingCategory) return
    
    try {
      const { category, error } = await fixtureCategoryService.updateCategory(editingCategory.id, {
        name: newCategoryName,
        description: newCategoryDescription
      })
      
      if (error) {
        toast.error(`Failed to update category: ${error.message}`)
      } else {
        toast.success('Category updated successfully!')
        setEditingCategory(null)
        setNewCategoryName('')
        setNewCategoryDescription('')
        await loadAllData()
      }
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error('An unexpected error occurred')
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return
    
    try {
      const { success, error } = await fixtureCategoryService.deleteCategory(categoryId)
      if (error) {
        toast.error(`Failed to delete category: ${error.message}`)
      } else {
        toast.success('Category deleted successfully!')
        await loadAllData()
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('An unexpected error occurred')
    }
  }

  const handleEditRoomType = (roomType: RoomType) => {
    setEditingRoomType(roomType)
    setNewRoomTypeName(roomType.display_name)
    setNewRoomTypeDescription(roomType.description || '')
  }

  const handleSaveRoomType = async () => {
    if (!editingRoomType) return
    
    try {
      const { roomType, error } = await roomService.updateRoomType(editingRoomType.id, {
        display_name: newRoomTypeName,
        description: newRoomTypeDescription
      })
      
      if (error) {
        toast.error(`Failed to update room type: ${error.message}`)
      } else {
        toast.success('Room type updated successfully!')
        setEditingRoomType(null)
        setNewRoomTypeName('')
        setNewRoomTypeDescription('')
        await loadAllData()
      }
    } catch (error) {
      console.error('Error updating room type:', error)
      toast.error('An unexpected error occurred')
    }
  }

  const handleDeleteRoomType = async (roomTypeId: string) => {
    if (!confirm('Are you sure you want to delete this room type?')) return
    
    try {
      const { success, error } = await roomService.deleteRoomType(roomTypeId)
      if (error) {
        toast.error(`Failed to delete room type: ${error.message}`)
      } else {
        toast.success('Room type deleted successfully!')
        await loadAllData()
      }
    } catch (error) {
      console.error('Error deleting room type:', error)
      toast.error('An unexpected error occurred')
    }
  }

  const handleEditOption = (option: FixtureOption) => {
    setEditingOption(option)
    setNewOptionName(option.name)
    setNewOptionDescription(option.description || '')
    setNewOptionCategoryId(option.category_id)
    setNewOptionBrand(option.brand)
    setNewOptionModel(option.model)
    setNewOptionSize(option.size || '')
    setNewOptionMaterial(option.material || '')
    setNewOptionColor(option.color || '')
    setNewOptionBasePrice(option.base_price.toString())
    setNewOptionInstallationCost(option.installation_cost.toString())
    setNewOptionImageUrl(option.image_url || '')
    setNewOptionIsActive(option.is_active)
  }

  const handleSaveOption = async () => {
    if (!editingOption) return
    
    try {
      const { option, error } = await fixtureOptionService.updateOption(editingOption.id, {
        name: newOptionName,
        description: newOptionDescription,
        category_id: newOptionCategoryId,
        brand: newOptionBrand,
        model: newOptionModel,
        size: newOptionSize || null,
        material: newOptionMaterial || null,
        color: newOptionColor || null,
        base_price: parseFloat(newOptionBasePrice) || 0,
        installation_cost: parseFloat(newOptionInstallationCost) || 0,
        image_url: newOptionImageUrl || null,
        is_active: newOptionIsActive
      })
      
      if (error) {
        toast.error(`Failed to update option: ${error.message}`)
      } else {
        toast.success('Option updated successfully!')
        setEditingOption(null)
        // Reset all fields
        setNewOptionName('')
        setNewOptionDescription('')
        setNewOptionCategoryId('')
        setNewOptionBrand('')
        setNewOptionModel('')
        setNewOptionSize('')
        setNewOptionMaterial('')
        setNewOptionColor('')
        setNewOptionBasePrice('')
        setNewOptionInstallationCost('')
        setNewOptionImageUrl('')
        setNewOptionIsActive(true)
        await loadAllData()
      }
    } catch (error) {
      console.error('Error updating option:', error)
      toast.error('An unexpected error occurred')
    }
  }

  const handleDeleteOption = async (optionId: string) => {
    if (!confirm('Are you sure you want to delete this option?')) return
    
    try {
      const { success, error } = await fixtureOptionService.deleteOption(optionId)
      if (error) {
        toast.error(`Failed to delete option: ${error.message}`)
      } else {
        toast.success('Option deleted successfully!')
        await loadAllData()
      }
    } catch (error) {
      console.error('Error deleting option:', error)
      toast.error('An unexpected error occurred')
    }
  }

  const handleEditUser = (user: any) => {
    setEditingUser(user)
    setNewUserFullName(user.full_name || '')
    setNewUserApproved(user.approved)
    setNewUserActive(user.is_active !== false) // Default to true if undefined
  }

  const handleSaveUser = async () => {
    if (!editingUser) return
    
    try {
      // Update user profile in the database
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: newUserFullName,
          approved: newUserApproved,
          is_active: newUserActive
        })
        .eq('id', editingUser.id)

      if (error) {
        toast.error(`Failed to update user: ${error.message}`)
      } else {
        toast.success('User updated successfully!')
        setEditingUser(null)
        setNewUserFullName('')
        setNewUserApproved(true)
        setNewUserActive(true)
        await loadAllData()
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('An unexpected error occurred')
    }
  }



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Admin Dashboard" 
        showBackButton={true}
        showQuickNav={true}
      />

      <div className="p-4 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Categories</p>
                  <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Options</p>
                  <p className="text-2xl font-bold text-gray-900">{options.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Home className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Room Types</p>
                  <p className="text-2xl font-bold text-gray-900">{roomTypes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'users', label: 'User Management', icon: '👥' },
              { id: 'categories', label: 'Fixture Categories', icon: '📂' },
              { id: 'options', label: 'Fixture Options', icon: '🔧' },
              { id: 'roomtypes', label: 'Room Types', icon: '🏠' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'users' && (
          <div>
            {/* User Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>User Management</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="p-3 border rounded-lg">
                  {editingUser?.id === user.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                          <span className="text-xs text-gray-500 ml-1">(User's display name)</span>
                        </label>
                        <Input
                          value={newUserFullName}
                          onChange={(e) => setNewUserFullName(e.target.value)}
                          placeholder="Enter full name"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="approved"
                            checked={newUserApproved}
                            onChange={(e) => setNewUserApproved(e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <label htmlFor="approved" className="text-sm text-gray-700">
                            <span className="font-medium">Approved:</span> 
                            <span className="text-xs text-gray-500 ml-1">
                              {newUserApproved ? 'Can access the system' : 'Pending admin approval'}
                            </span>
                          </label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="active"
                            checked={newUserActive}
                            onChange={(e) => setNewUserActive(e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <label htmlFor="active" className="text-sm text-gray-700">
                            <span className="font-medium">Active:</span> 
                            <span className="text-xs text-gray-500 ml-1">
                              {newUserActive ? 'Account is active' : 'Account is deactivated'}
                            </span>
                          </label>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={handleSaveUser}>
                          Save Changes
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setEditingUser(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-medium">{user.full_name || 'No name'}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Badge className={user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}>
                            {user.role}
                          </Badge>
                          <Badge className={user.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {user.approved ? 'Approved' : 'Pending'}
                          </Badge>
                          {user.is_active === false && (
                            <Badge className="bg-red-100 text-red-800">Inactive</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditUser(user)}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        {!user.approved && (
                          <Button
                            size="sm"
                            onClick={() => handleApproveUser(user.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        )}
                        {user.role !== 'admin' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMakeAdmin(user.id)}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Make Admin
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
          </div>
        )}

        {activeTab === 'categories' && (
          <div>
            {/* Fixture Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Fixture Categories</span>
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Category
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category.id} className="p-3 border rounded-lg">
                  {editingCategory?.id === category.id ? (
                    <div className="space-y-3">
                      <Input
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Category name"
                      />
                      <Input
                        value={newCategoryDescription}
                        onChange={(e) => setNewCategoryDescription(e.target.value)}
                        placeholder="Description (optional)"
                      />
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={handleSaveCategory}>
                          Save
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setEditingCategory(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{category.name}</p>
                        {category.description && (
                          <p className="text-sm text-gray-600">{category.description}</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
          </div>
        )}

        {activeTab === 'options' && (
          <div>
            {/* Fixture Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Fixture Options</span>
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Option
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {options.map((option) => (
                <div key={option.id} className="p-3 border rounded-lg">
                  {editingOption?.id === option.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Option Name *
                            <span className="text-xs text-gray-500 ml-1">(e.g., "Standard Faucet", "Premium Shower")</span>
                          </label>
                          <Input
                            value={newOptionName}
                            onChange={(e) => setNewOptionName(e.target.value)}
                            placeholder="Enter option name"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category *
                            <span className="text-xs text-gray-500 ml-1">(Faucets, Showers, Toilets, etc.)</span>
                          </label>
                          <select
                            value={newOptionCategoryId}
                            onChange={(e) => setNewOptionCategoryId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">Select Category</option>
                            {categories.map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                          <span className="text-xs text-gray-500 ml-1">(Detailed product description, features, specifications)</span>
                        </label>
                        <Input
                          value={newOptionDescription}
                          onChange={(e) => setNewOptionDescription(e.target.value)}
                          placeholder="Enter detailed description"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Brand *
                            <span className="text-xs text-gray-500 ml-1">(Manufacturer: Kohler, Delta, Moen, etc.)</span>
                          </label>
                          <Input
                            value={newOptionBrand}
                            onChange={(e) => setNewOptionBrand(e.target.value)}
                            placeholder="Enter brand name"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Model *
                            <span className="text-xs text-gray-500 ml-1">(Specific model number or name)</span>
                          </label>
                          <Input
                            value={newOptionModel}
                            onChange={(e) => setNewOptionModel(e.target.value)}
                            placeholder="Enter model name/number"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Size
                            <span className="text-xs text-gray-500 ml-1">(Dimensions: 24" x 18", 60" x 30", etc.)</span>
                          </label>
                          <Input
                            value={newOptionSize}
                            onChange={(e) => setNewOptionSize(e.target.value)}
                            placeholder="Enter size/dimensions"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Material
                            <span className="text-xs text-gray-500 ml-1">(Brass, Chrome, Porcelain, etc.)</span>
                          </label>
                          <Input
                            value={newOptionMaterial}
                            onChange={(e) => setNewOptionMaterial(e.target.value)}
                            placeholder="Enter material type"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Color
                            <span className="text-xs text-gray-500 ml-1">(Chrome, Brushed Nickel, White, etc.)</span>
                          </label>
                          <Input
                            value={newOptionColor}
                            onChange={(e) => setNewOptionColor(e.target.value)}
                            placeholder="Enter color/finish"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Base Price *
                            <span className="text-xs text-gray-500 ml-1">(Product cost before installation)</span>
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            value={newOptionBasePrice}
                            onChange={(e) => setNewOptionBasePrice(e.target.value)}
                            placeholder="0.00"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Installation Cost *
                            <span className="text-xs text-gray-500 ml-1">(Labor cost to install this item)</span>
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            value={newOptionInstallationCost}
                            onChange={(e) => setNewOptionInstallationCost(e.target.value)}
                            placeholder="0.00"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Image URL
                          <span className="text-xs text-gray-500 ml-1">(Link to product image for quotes and catalogs)</span>
                        </label>
                        <Input
                          value={newOptionImageUrl}
                          onChange={(e) => setNewOptionImageUrl(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                        <input
                          type="checkbox"
                          id="isActive"
                          checked={newOptionIsActive}
                          onChange={(e) => setNewOptionIsActive(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor="isActive" className="text-sm text-gray-700">
                          <span className="font-medium">Active Status:</span> 
                          <span className="text-xs text-gray-500 ml-1">
                            {newOptionIsActive ? 'Available for selection in assessments' : 'Hidden from selection'}
                          </span>
                        </label>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={handleSaveOption}>
                          Save
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setEditingOption(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">{option.name}</p>
                          {!option.is_active && (
                            <Badge className="bg-gray-100 text-gray-600 text-xs">Inactive</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{option.brand} {option.model}</p>
                        {option.description && (
                          <p className="text-sm text-gray-500">{option.description}</p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                          <span>Category: {categories.find(c => c.id === option.category_id)?.name || 'Unknown'}</span>
                          {option.size && <span>Size: {option.size}</span>}
                          {option.material && <span>Material: {option.material}</span>}
                          {option.color && <span>Color: {option.color}</span>}
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                          <span>Base Price: ${option.base_price}</span>
                          <span>Installation: ${option.installation_cost}</span>
                          <span>Total: ${(option.base_price + option.installation_cost).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditOption(option)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteOption(option.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
          </div>
        )}

        {activeTab === 'roomtypes' && (
          <div>
            {/* Room Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Home className="h-5 w-5" />
                <span>Room Types</span>
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Room Type
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {roomTypes.map((roomType) => (
                <div key={roomType.id} className="p-3 border rounded-lg">
                  {editingRoomType?.id === roomType.id ? (
                    <div className="space-y-3">
                      <Input
                        value={newRoomTypeName}
                        onChange={(e) => setNewRoomTypeName(e.target.value)}
                        placeholder="Room type name"
                      />
                      <Input
                        value={newRoomTypeDescription}
                        onChange={(e) => setNewRoomTypeDescription(e.target.value)}
                        placeholder="Description (optional)"
                      />
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={handleSaveRoomType}>
                          Save
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => setEditingRoomType(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{roomType.display_name}</p>
                        {roomType.description && (
                          <p className="text-sm text-gray-600">{roomType.description}</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditRoomType(roomType)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteRoomType(roomType.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminContent />
    </ProtectedRoute>
  )
}
