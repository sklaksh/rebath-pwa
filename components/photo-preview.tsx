'use client'

import { useState, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, Edit3, Save, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PhotoPreviewProps {
  photos: string[]
  onRemove?: (index: number) => void
  onUpdate?: (index: number, newPhotoUrl: string) => void
  disabled?: boolean
  showRemoveButton?: boolean
}

export function PhotoPreview({ photos, onRemove, onUpdate, disabled, showRemoveButton = true }: PhotoPreviewProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const openLightbox = (index: number) => {
    console.log('openLightbox called with index:', index)
    console.log('Current photos:', photos)
    setSelectedIndex(index)
    console.log('selectedIndex should be set to:', index)
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

  const openEditor = () => {
    setIsEditing(true)
  }

  const closeEditor = () => {
    setIsEditing(false)
  }

  const saveEditedPhoto = (editedImageUrl: string) => {
    if (selectedIndex !== null && onUpdate) {
      onUpdate(selectedIndex, editedImageUrl)
    }
    setIsEditing(false)
  }

  if (photos.length === 0) {
    return <p className="text-sm text-gray-500">No photos added</p>
  }

  return (
    <>
      {/* Test button */}
      <div className="mb-4">
        <button 
          onClick={() => {
            console.log('Test button clicked!')
            alert('Test button works!')
            openLightbox(0)
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Test Click (should open first photo)
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo, index) => (
          <div key={index} className="relative group">
            <div 
              className="aspect-square overflow-hidden rounded-lg border-2 border-gray-200 hover:border-primary-300 transition-colors cursor-pointer relative"
              style={{ pointerEvents: 'auto', zIndex: 1 }}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('Photo clicked:', index, photo)
                console.log('Event:', e)
                alert(`Photo ${index + 1} clicked! Check console for details.`)
                openLightbox(index)
              }}
              onMouseDown={(e) => {
                console.log('Mouse down on photo:', index)
              }}
              onMouseUp={(e) => {
                console.log('Mouse up on photo:', index)
              }}
            >
              <img
                src={photo}
                alt={`Room photo ${index + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  console.error('Image failed to load:', photo)
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
                onLoad={() => {
                  console.log('Image loaded successfully:', photo)
                }}
              />
              {/* Click indicator overlay - temporarily disabled for debugging */}
              {/* <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-95 rounded-lg p-3 text-center">
                  <svg className="w-8 h-8 text-gray-700 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                  <p className="text-sm font-medium text-gray-700">Click to view</p>
                </div>
              </div>
              
              <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-50 text-white text-xs text-center py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Click to open & edit
              </div> */}
            </div>
            {showRemoveButton && onRemove && (
              <button
                onClick={() => onRemove(index)}
                disabled={disabled}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 disabled:opacity-50 shadow-lg transition-all duration-200 hover:scale-110"
                title="Remove photo"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {console.log('Rendering lightbox, selectedIndex:', selectedIndex)}
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
            
            {/* Edit button */}
            <button
              onClick={openEditor}
              className="absolute top-4 right-16 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-colors"
              title="Edit photo"
            >
              <Edit3 className="h-6 w-6" />
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

      {/* Photo Editor Modal */}
      {isEditing && selectedIndex !== null && (
        <PhotoEditor
          imageUrl={photos[selectedIndex]}
          onSave={saveEditedPhoto}
          onCancel={closeEditor}
        />
      )}
    </>
  )
}

// Photo Editor Component
interface PhotoEditorProps {
  imageUrl: string
  onSave: (editedImageUrl: string) => void
  onCancel: () => void
}

function PhotoEditor({ imageUrl, onSave, onCancel }: PhotoEditorProps) {
  const [tool, setTool] = useState<'crop' | 'draw' | 'text' | 'filter'>('crop')
  const [isDrawing, setIsDrawing] = useState(false)
  const [brushSize, setBrushSize] = useState(5)
  const [brushColor, setBrushColor] = useState('#000000')
  const [cropArea, setCropArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'crop') {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        setDragStart({ x, y })
        setIsDragging(true)
        setCropArea({ x, y, width: 0, height: 0 })
      }
    } else if (tool === 'draw') {
      setIsDrawing(true)
      draw(e)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'crop' && isDragging && dragStart) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (rect) {
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        setCropArea({
          x: Math.min(dragStart.x, x),
          y: Math.min(dragStart.y, y),
          width: Math.abs(x - dragStart.x),
          height: Math.abs(y - dragStart.y)
        })
      }
    } else if (tool === 'draw' && isDrawing) {
      draw(e)
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setIsDrawing(false)
    setDragStart(null)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = brushColor
    ctx.lineWidth = brushSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (isDrawing) {
      ctx.lineTo(x, y)
      ctx.stroke()
    } else {
      ctx.beginPath()
      ctx.moveTo(x, y)
    }
  }

  const applyCrop = () => {
    if (!cropArea || !imageRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw cropped image
    ctx.drawImage(
      imageRef.current,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height,
      0, 0, canvas.width, canvas.height
    )
  }

  const saveImage = () => {
    if (!canvasRef.current) return
    
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9)
    onSave(dataUrl)
  }

  const resetImage = () => {
    if (!imageRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = imageRef.current.naturalWidth
    canvas.height = imageRef.current.naturalHeight
    ctx.drawImage(imageRef.current, 0, 0)
    setCropArea(null)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-full overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Edit Photo</h3>
          <div className="flex gap-2">
            <Button onClick={onCancel} variant="outline">
              Cancel
            </Button>
            <Button onClick={saveImage} className="bg-primary-600 hover:bg-primary-700">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        <div className="flex gap-4 h-96">
          {/* Toolbar */}
          <div className="w-48 bg-gray-50 rounded-lg p-4 space-y-4">
            <div>
              <h4 className="font-medium mb-2">Tools</h4>
              <div className="space-y-2">
                <button
                  onClick={() => setTool('crop')}
                  className={`w-full p-2 rounded text-left ${tool === 'crop' ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'}`}
                >
                  Crop
                </button>
                <button
                  onClick={() => setTool('draw')}
                  className={`w-full p-2 rounded text-left ${tool === 'draw' ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'}`}
                >
                  Draw
                </button>
                <button
                  onClick={() => setTool('text')}
                  className={`w-full p-2 rounded text-left ${tool === 'text' ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'}`}
                >
                  Text
                </button>
                <button
                  onClick={() => setTool('filter')}
                  className={`w-full p-2 rounded text-left ${tool === 'filter' ? 'bg-primary-100 text-primary-700' : 'hover:bg-gray-100'}`}
                >
                  Filters
                </button>
              </div>
            </div>

            {tool === 'draw' && (
              <div>
                <h4 className="font-medium mb-2">Brush Settings</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Size</label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={brushSize}
                      onChange={(e) => setBrushSize(Number(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-500">{brushSize}px</span>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Color</label>
                    <input
                      type="color"
                      value={brushColor}
                      onChange={(e) => setBrushColor(e.target.value)}
                      className="w-full h-8 rounded border"
                    />
                  </div>
                </div>
              </div>
            )}

            {tool === 'crop' && cropArea && (
              <div>
                <Button onClick={applyCrop} className="w-full mb-2">
                  Apply Crop
                </Button>
                <Button onClick={() => setCropArea(null)} variant="outline" className="w-full">
                  Cancel Crop
                </Button>
              </div>
            )}

            <Button onClick={resetImage} variant="outline" className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 bg-gray-100 rounded-lg p-4 flex items-center justify-center">
            <div className="relative">
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Edit"
                className="max-w-full max-h-80 object-contain rounded"
                onLoad={() => {
                  if (imageRef.current && canvasRef.current) {
                    const canvas = canvasRef.current
                    const ctx = canvas.getContext('2d')
                    if (ctx) {
                      canvas.width = imageRef.current!.naturalWidth
                      canvas.height = imageRef.current!.naturalHeight
                      ctx.drawImage(imageRef.current!, 0, 0)
                    }
                  }
                }}
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
              {tool === 'crop' && cropArea && (
                <div
                  className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20"
                  style={{
                    left: cropArea.x,
                    top: cropArea.y,
                    width: cropArea.width,
                    height: cropArea.height
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
