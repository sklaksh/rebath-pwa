import { supabase } from '@/lib/supabase/client'

export interface PhotoUploadResult {
  success: boolean
  url?: string
  error?: string
}

export class PhotoService {
  private supabase = supabase

  // Upload a photo to Supabase Storage
  async uploadPhoto(file: File, assessmentId: string): Promise<PhotoUploadResult> {
    try {
      console.log('Starting photo upload:', { fileName: file.name, fileSize: file.size, assessmentId })
      
      // Validate file
      if (!file.type.startsWith('image/')) {
        return { success: false, error: 'File must be an image' }
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        return { success: false, error: 'File size must be less than 10MB' }
      }

      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        console.error('User not authenticated')
        return { success: false, error: 'User not authenticated' }
      }

      console.log('User authenticated:', user.id)

      // Create a unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${user.id}/${assessmentId}/${fileName}`

      console.log('Uploading to path:', filePath)

      // Upload the file to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from('assessment-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        return { success: false, error: `Upload failed: ${error.message}` }
      }

      console.log('Upload successful:', data)

      // Get the public URL
      const { data: urlData } = this.supabase.storage
        .from('assessment-photos')
        .getPublicUrl(filePath)

      console.log('Public URL:', urlData.publicUrl)

      return {
        success: true,
        url: urlData.publicUrl
      }
    } catch (error) {
      console.error('Photo upload error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // Upload multiple photos
  async uploadMultiplePhotos(files: File[], assessmentId: string): Promise<PhotoUploadResult[]> {
    const uploadPromises = files.map(file => this.uploadPhoto(file, assessmentId))
    return Promise.all(uploadPromises)
  }

  // Delete a photo from Supabase Storage
  async deletePhoto(photoUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Extract the file path from the URL
      const url = new URL(photoUrl)
      const pathParts = url.pathname.split('/')
      const filePath = pathParts.slice(-3).join('/') // Get user/assessment/filename

      const { error } = await this.supabase.storage
        .from('assessment-photos')
        .remove([filePath])

      if (error) {
        console.error('Delete error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Photo delete error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // Get photos for an assessment
  async getAssessmentPhotos(assessmentId: string): Promise<{ success: boolean; photos?: string[]; error?: string }> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      const { data, error } = await this.supabase.storage
        .from('assessment-photos')
        .list(`${user.id}/${assessmentId}`, {
          limit: 100,
          offset: 0
        })

      if (error) {
        console.error('List photos error:', error)
        return { success: false, error: error.message }
      }

      const photos = data.map(file => {
        const { data: urlData } = this.supabase.storage
          .from('assessment-photos')
          .getPublicUrl(`${user.id}/${assessmentId}/${file.name}`)
        return urlData.publicUrl
      })

      return { success: true, photos }
    } catch (error) {
      console.error('Get photos error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
}

export const photoService = new PhotoService()
