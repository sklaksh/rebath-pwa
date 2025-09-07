'use client'

import { useState } from 'react'
import { X, ChevronLeft, ChevronRight, Palette, Trash2 } from 'lucide-react'
import { PhotoSketchCanvas } from './sketch-canvas'

interface PhotoPreviewProps {
  photos: string[]
  onRemove?: (index: number) => void
  onUpdate?: (index: number, newPhotoUrl: string) => void
  disabled?: boolean
  showRemoveButton?: boolean
}

export function PhotoPreview({ photos, onRemove, onUpdate, disabled, showRemoveButton = true }: PhotoPreviewProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isSketching, setIsSketching] = useState(false)

  const openLightbox = (index: number) => {
    setSelectedIndex(index)
  }

  const closeLightbox = () => {
    setSelectedIndex(null)
  }

  const goToPrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex > 0 ? selectedIndex - 1 : photos.length - 1)
    }
  }

  const goToNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex < photos.length - 1 ? selectedIndex + 1 : 0)
    }
  }

  const openSketch = () => {
    setIsSketching(true)
  }

  const closeSketch = () => {
    setIsSketching(false)
  }

  const saveSketch = (sketchedImageUrl: string) => {
    if (selectedIndex !== null && onUpdate) {
      onUpdate(selectedIndex, sketchedImageUrl)
    }
    setIsSketching(false)
  }



  if (photos.length === 0) {
    return <p className="text-sm text-gray-500">No photos added</p>
  }

  return (
    <>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo, index) => (
          <div key={index} className="relative group">
            <div 
              className="aspect-square overflow-hidden rounded-lg border-2 border-gray-200 hover:border-primary-300 transition-colors cursor-pointer relative"
              style={{ pointerEvents: 'auto', zIndex: 1 }}
              onClick={() => openLightbox(index)}
            >
              <img
                src={photo}
                alt={`Room photo ${index + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  // Show a placeholder for broken images
                  e.currentTarget.style.display = 'none'
                  const placeholder = document.createElement('div')
                  placeholder.className = 'w-full h-full bg-gray-200 flex items-center justify-center text-gray-500'
                  placeholder.innerHTML = `
                    <div class="text-center">
                      <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      <p class="text-sm">Click to view</p>
                    </div>
                  `
                  e.currentTarget.parentNode?.appendChild(placeholder)
                }}
              />
              {/* Click indicator overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-95 rounded-lg p-3 text-center">
                  <svg className="w-8 h-8 text-gray-700 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                  <p className="text-sm font-medium text-gray-700">Click to view</p>
                </div>
              </div>
            </div>
            {showRemoveButton && onRemove && (
              <button
                onClick={(e) => onRemove(index)}
                disabled={disabled}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 disabled:opacity-50 shadow-lg transition-all duration-200 hover:scale-110 z-10 border-2 border-white group opacity-70 hover:opacity-100"
                title="Delete photo"
              >
                <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
              </button>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <img
              src={photos[selectedIndex]}
              alt={`Room photo ${selectedIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            
            {/* Close button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            
            
            {/* Sketch button */}
            <button
              onClick={openSketch}
              className="absolute top-4 right-16 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-colors"
              title="Sketch on photo"
            >
              <Palette className="h-6 w-6" />
            </button>
            
            
            {/* Navigation buttons */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
            
            {/* Photo counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
              {selectedIndex + 1} of {photos.length}
            </div>
          </div>
        </div>
      )}

      {/* Sketch Canvas Modal */}
      {isSketching && selectedIndex !== null && (
        <PhotoSketchCanvas
          imageUrl={photos[selectedIndex]}
          onSave={saveSketch}
          onCancel={closeSketch}
        />
      )}

    </>
  )
}

