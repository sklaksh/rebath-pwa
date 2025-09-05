import { createClient } from '@/lib/supabase/client'
import type { RoomType as DbRoomType } from '@/lib/supabase/types'

export interface RoomType {
  id: string
  name: string
  displayName: string
  description?: string
  icon?: string
  displayOrder: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface RoomTypeError {
  message: string
  code?: string
}

class RoomService {
  private supabase = createClient()

  // Get all active room types
  async getRoomTypes(): Promise<{ roomTypes: RoomType[]; error: RoomTypeError | null }> {
    try {
      const { data, error } = await this.supabase
        .from('room_types')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (error) {
        return {
          roomTypes: [],
          error: { message: error.message, code: error.code }
        }
      }

      const roomTypes = data.map(this.mapDbRoomTypeToRoomType)
      return { roomTypes, error: null }
    } catch (error) {
      return {
        roomTypes: [],
        error: { message: 'Failed to fetch room types' }
      }
    }
  }

  // Get all room types (including inactive) - for admin use
  async getAllRoomTypes(): Promise<{ roomTypes: RoomType[]; error: RoomTypeError | null }> {
    try {
      const { data, error } = await this.supabase
        .from('room_types')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) {
        return {
          roomTypes: [],
          error: { message: error.message, code: error.code }
        }
      }

      const roomTypes = data.map(this.mapDbRoomTypeToRoomType)
      return { roomTypes, error: null }
    } catch (error) {
      return {
        roomTypes: [],
        error: { message: 'Failed to fetch all room types' }
      }
    }
  }

  // Get a specific room type by name
  async getRoomType(name: string): Promise<{ roomType: RoomType | null; error: RoomTypeError | null }> {
    try {
      const { data, error } = await this.supabase
        .from('room_types')
        .select('*')
        .eq('name', name)
        .eq('is_active', true)
        .single()

      if (error) {
        return {
          roomType: null,
          error: { message: error.message, code: error.code }
        }
      }

      const roomType = this.mapDbRoomTypeToRoomType(data)
      return { roomType, error: null }
    } catch (error) {
      return {
        roomType: null,
        error: { message: 'Failed to fetch room type' }
      }
    }
  }

  // Create a new room type (admin only)
  async createRoomType(roomType: Omit<RoomType, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; error: RoomTypeError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { success: false, error: { message: 'User not authenticated' } }
      }

      // Check if user is admin (you might want to implement proper role checking)
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        return { success: false, error: { message: 'Insufficient permissions' } }
      }

      const roomTypeData = {
        name: roomType.name,
        display_name: roomType.displayName,
        description: roomType.description,
        icon: roomType.icon,
        display_order: roomType.displayOrder,
        is_active: roomType.isActive
      }

      const { error } = await this.supabase
        .from('room_types')
        .insert(roomTypeData)

      if (error) {
        return {
          success: false,
          error: { message: error.message, code: error.code }
        }
      }

      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error: { message: 'Failed to create room type' }
      }
    }
  }

  // Update a room type (admin only)
  async updateRoomType(id: string, updates: Partial<Omit<RoomType, 'id' | 'createdAt' | 'updatedAt'>>): Promise<{ success: boolean; error: RoomTypeError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { success: false, error: { message: 'User not authenticated' } }
      }

      // Check if user is admin
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        return { success: false, error: { message: 'Insufficient permissions' } }
      }

      const updateData: any = {}
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.displayName !== undefined) updateData.display_name = updates.displayName
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.icon !== undefined) updateData.icon = updates.icon
      if (updates.displayOrder !== undefined) updateData.display_order = updates.displayOrder
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive

      const { error } = await this.supabase
        .from('room_types')
        .update(updateData)
        .eq('id', id)

      if (error) {
        return {
          success: false,
          error: { message: error.message, code: error.code }
        }
      }

      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error: { message: 'Failed to update room type' }
      }
    }
  }

  // Delete a room type (admin only)
  async deleteRoomType(id: string): Promise<{ success: boolean; error: RoomTypeError | null }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { success: false, error: { message: 'User not authenticated' } }
      }

      // Check if user is admin
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'admin') {
        return { success: false, error: { message: 'Insufficient permissions' } }
      }

      // Check if room type is being used in assessments
      const { data: assessments } = await this.supabase
        .from('assessments')
        .select('id')
        .eq('room_type', id)
        .limit(1)

      if (assessments && assessments.length > 0) {
        return {
          success: false,
          error: { message: 'Cannot delete room type that is being used in assessments' }
        }
      }

      const { error } = await this.supabase
        .from('room_types')
        .delete()
        .eq('id', id)

      if (error) {
        return {
          success: false,
          error: { message: error.message, code: error.code }
        }
      }

      return { success: true, error: null }
    } catch (error) {
      return {
        success: false,
        error: { message: 'Failed to delete room type' }
      }
    }
  }

  // Map database room type to application room type
  private mapDbRoomTypeToRoomType(dbRoomType: DbRoomType): RoomType {
    return {
      id: dbRoomType.id,
      name: dbRoomType.name,
      displayName: dbRoomType.display_name,
      description: dbRoomType.description || undefined,
      icon: dbRoomType.icon || undefined,
      displayOrder: dbRoomType.display_order,
      isActive: dbRoomType.is_active,
      createdAt: dbRoomType.created_at,
      updatedAt: dbRoomType.updated_at
    }
  }
}

export const roomService = new RoomService()
