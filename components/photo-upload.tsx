'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, Upload, AlertCircle, X } from 'lucide-react'
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
  const [showCamera, setShowCamera] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

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
    console.log('Removing photo at index:', index, 'URL:', photoUrl)
    console.log('Current photos array:', photos)
    
    // If it's a Supabase Storage URL, delete it from storage
    if (photoUrl.includes('supabase')) {
      console.log('Deleting photo from Supabase storage:', photoUrl)
      const result = await photoService.deletePhoto(photoUrl)
      if (!result.success) {
        console.error('Failed to delete photo from storage:', result.error)
        toast.error('Failed to delete photo from storage')
        return
      }
      console.log('Photo deleted from storage successfully')
    }
    
    // Remove from local state
    const updatedPhotos = photos.filter((_, i) => i !== index)
    console.log('Updated photos array:', updatedPhotos)
    onPhotosChange(updatedPhotos)
  }

  const startCamera = async () => {
    try {
      console.log('Starting camera...')
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      console.log('Camera stream obtained:', stream)
      streamRef.current = stream
      
      // Show the camera modal first
      setShowCamera(true)
      
      // Wait for the modal to render, then set the video source
      setTimeout(() => {
        if (videoRef.current) {
          console.log('Setting video source object')
          videoRef.current.srcObject = stream
          
          // Wait for video to load and play
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded, attempting to play')
            if (videoRef.current) {
              videoRef.current.play().then(() => {
                console.log('Video is now playing')
              }).catch(console.error)
            }
          }
        } else {
          console.error('Video ref is still null after timeout')
        }
      }, 100) // Small delay to ensure DOM is updated
      
    } catch (error) {
      console.error('Error accessing camera:', error)
      toast.error('Unable to access camera. Please check permissions.')
    }
  }

  const stopCamera = (clearCapturedImage = false) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setShowCamera(false)
    if (clearCapturedImage) {
      setCapturedImage(null)
    }
  }

  const capturePhoto = () => {
    console.log('Capturing photo...')
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current
      const context = canvas.getContext('2d')
      
      if (context) {
        console.log('Drawing image to canvas...')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0)
        
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8)
        console.log('Image captured, data URL length:', imageDataUrl.length)
        console.log('Setting captured image state...')
        setCapturedImage(imageDataUrl)
        console.log('Captured image state should be set now')
        stopCamera(false) // Don't clear captured image
      } else {
        console.error('Could not get canvas context')
      }
    } else {
      console.error('Video or canvas ref is null')
    }
  }

  const saveCapturedPhoto = async () => {
    if (!capturedImage) return

    console.log('Saving captured photo, assessmentId:', assessmentId)
    
    if (!assessmentId) {
      // If no assessmentId, just add the data URL to photos for now
      console.log('No assessmentId, adding data URL to photos')
      onPhotosChange([...photos, capturedImage])
      toast.success('Photo captured! It will be uploaded when you save the assessment.')
      setCapturedImage(null)
      return
    }

    setUploading(true)
    try {
      // Convert data URL to blob
      const response = await fetch(capturedImage)
      const blob = await response.blob()
      
      // Create a file from the blob
      const file = new File([blob], `camera-photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
      
      console.log('Uploading photo file:', file.name, file.size, 'bytes')
      
      // Upload the photo
      const result = await photoService.uploadMultiplePhotos([file], assessmentId)
      
      console.log('Upload result:', result)
      
      if (result[0]?.success && result[0]?.url) {
        onPhotosChange([...photos, result[0].url])
        toast.success('Photo captured and uploaded successfully')
        setCapturedImage(null)
      } else {
        console.error('Upload failed:', result[0]?.error)
        toast.error('Failed to upload captured photo')
      }
    } catch (error) {
      console.error('Error saving captured photo:', error)
      toast.error('Failed to save captured photo')
    } finally {
      setUploading(false)
    }
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    startCamera()
  }

  // Cleanup camera stream when component unmounts or camera is closed
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // Handle video loading when modal is shown
  useEffect(() => {
    if (showCamera && streamRef.current && videoRef.current) {
      console.log('Setting up video in useEffect')
      const video = videoRef.current
      video.srcObject = streamRef.current
      
      const handleLoadedMetadata = () => {
        console.log('Video metadata loaded in useEffect')
        video.play().catch(console.error)
      }
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata)
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      }
    }
  }, [showCamera])

  // Debug captured image state changes
  useEffect(() => {
    if (capturedImage) {
      console.log('Captured image state updated:', capturedImage.substring(0, 50) + '...')
      console.log('Captured image modal should be visible now')
    } else {
      console.log('Captured image state cleared')
    }
  }, [capturedImage])

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Add Photos
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Take or upload photos of the room</p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Photos
                </>
              )}
            </label>
            
            <Button
              type="button"
              onClick={startCamera}
              disabled={disabled || uploading}
              variant="outline"
              className="inline-flex items-center px-4 py-2"
            >
              <Camera className="h-4 w-4 mr-2" />
              Take Photo
            </Button>
          </div>
        </div>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Take Photo</h3>
              <Button
                type="button"
                onClick={() => stopCamera(true)}
                variant="outline"
                size="sm"
                className="text-gray-600 hover:text-gray-800"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="relative bg-gray-100 rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-96 object-cover bg-gray-900"
                style={{ transform: 'scaleX(-1)' }} // Mirror the video for better UX
                onLoadedMetadata={() => {
                  console.log('Video metadata loaded')
                  if (videoRef.current) {
                    videoRef.current.play().catch(console.error)
                  }
                }}
                onCanPlay={() => {
                  console.log('Video can play')
                }}
                onError={(e) => {
                  console.error('Video error:', e)
                }}
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Loading overlay */}
              {showCamera && !streamRef.current && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <div className="text-white text-center">
                    <Camera className="h-12 w-12 mx-auto mb-4 animate-pulse" />
                    <p className="text-lg">Starting camera...</p>
                    <p className="text-sm text-gray-300 mt-2">Please allow camera access</p>
                  </div>
                </div>
              )}
              
              {/* Camera status indicator */}
              {streamRef.current && (
                <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center">
                  <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                  Camera Active
                </div>
              )}
            </div>
            
            <div className="flex justify-center mt-6">
              <Button
                type="button"
                onClick={capturePhoto}
                disabled={!streamRef.current}
                className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 text-lg font-medium"
              >
                <Camera className="h-5 w-5 mr-2" />
                Capture Photo
              </Button>
            </div>
            
            <div className="mt-4 text-center text-sm text-gray-600">
              Position your camera and click "Capture Photo" to take a picture
            </div>
          </div>
        </div>
      )}

      {/* Captured Photo Preview */}
      {capturedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Review Captured Photo</h3>
              <Button
                type="button"
                onClick={() => setCapturedImage(null)}
                variant="outline"
                size="sm"
                className="text-gray-600 hover:text-gray-800"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="mb-6 bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-96 object-cover"
                onLoad={() => console.log('Captured image loaded successfully')}
                onError={(e) => console.error('Error loading captured image:', e)}
              />
            </div>
            
            <div className="flex gap-4 justify-center">
              <Button
                type="button"
                onClick={retakePhoto}
                variant="outline"
                className="px-6 py-2"
              >
                Retake Photo
              </Button>
              <Button
                type="button"
                onClick={saveCapturedPhoto}
                disabled={uploading || !assessmentId}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2"
              >
                {uploading ? 'Saving...' : 'Save Photo'}
              </Button>
            </div>
            
            {!assessmentId && (
              <div className="mt-4 text-center text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                Photo will be saved when you save the assessment
              </div>
            )}
          </div>
        </div>
      )}
      
      {photos.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Added Photos ({photos.length})
          </h4>
          <PhotoPreview
            photos={photos}
            onRemove={removePhoto}
            onUpdate={(index, newPhotoUrl) => {
              const updatedPhotos = [...photos]
              updatedPhotos[index] = newPhotoUrl
              onPhotosChange(updatedPhotos)
            }}
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
