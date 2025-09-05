'use client'

import { useState } from 'react'
import { Camera, Upload, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PhotoPreview } from '@/components/photo-preview'
import { photoService } from '@/lib/services/photo.service'
import { toast } from 'react-hot-toast'

interface PhotoUploadProps {
  photos: string[]
  onPhotosChange: (photos: string[]) => void
  assessmentId?: string
  disabled?: boolean
}

export function PhotoUpload({ photos, onPhotosChange, assessmentId, disabled }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    if (!assessmentId) {
      toast.error('Assessment ID is required for photo upload')
      return
    }

    setUploading(true)
    try {
      const fileArray = Array.from(files)
      const results = await photoService.uploadMultiplePhotos(fileArray, assessmentId)
      
      const successfulUploads = results
        .filter(result => result.success)
        .map(result => result.url!)
      
      if (successfulUploads.length > 0) {
        onPhotosChange([...photos, ...successfulUploads])
        toast.success(`${successfulUploads.length} photo(s) uploaded successfully`)
      }
      
      const failedUploads = results.filter(result => !result.success)
      if (failedUploads.length > 0) {
        const errorMessages = failedUploads.map(result => result.error).filter(Boolean)
        console.error('Failed uploads:', errorMessages)
        toast.error(`Failed to upload ${failedUploads.length} photo(s): ${errorMessages[0] || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Photo upload error:', error)
      toast.error('Failed to upload photos')
    } finally {
      setUploading(false)
    }
  }

  const removePhoto = async (index: number) => {
    const photoUrl = photos[index]
    
    // If it's a Supabase Storage URL, delete it from storage
    if (photoUrl.includes('supabase')) {
      const result = await photoService.deletePhoto(photoUrl)
      if (!result.success) {
        toast.error('Failed to delete photo from storage')
        return
      }
    }
    
    // Remove from local state
    onPhotosChange(photos.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Add Photos
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Take or upload photos of the room</p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
            id="photo-upload"
            disabled={disabled || uploading}
          />
          <label
            htmlFor="photo-upload"
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white cursor-pointer ${
              disabled || uploading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {uploading ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-pulse" />
                Uploading...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-2" />
                Choose Photos
              </>
            )}
          </label>
        </div>
      </div>
      
      {photos.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Added Photos ({photos.length})
          </h4>
          <PhotoPreview
            photos={photos}
            onRemove={removePhoto}
            disabled={disabled}
            showRemoveButton={true}
          />
        </div>
      )}
      
      {!assessmentId && (
        <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">
            Photos will be uploaded after saving the assessment
          </span>
        </div>
      )}
    </div>
  )
}
