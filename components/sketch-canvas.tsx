'use client'

import { useState, useRef, useEffect } from 'react'
import { ReactSketchCanvas, ReactSketchCanvasRef } from 'react-sketch-canvas'
import { Button } from '@/components/ui/button'
import { X, RotateCcw, Download, Palette } from 'lucide-react'

interface SketchCanvasProps {
  imageUrl: string
  onSave: (imageDataUrl: string) => void
  onCancel: () => void
}

export function PhotoSketchCanvas({ imageUrl, onSave, onCancel }: SketchCanvasProps) {
  const canvasRef = useRef<ReactSketchCanvasRef>(null)
  const [brushColor, setBrushColor] = useState('#000000')
  const [brushWidth, setBrushWidth] = useState(4)
  const [eraserWidth, setEraserWidth] = useState(8)
  const [currentTool, setCurrentTool] = useState<'brush' | 'eraser'>('brush')
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const [showCursor, setShowCursor] = useState(false)

  // Initialize drawing mode when component mounts
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.eraseMode(false)
      console.log('Canvas initialized')
    }
  }, [])

  // Initialize with black color
  useEffect(() => {
    setBrushColor('#000000')
  }, [])

  const colors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', 
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500',
    '#800080', '#008000', '#FFC0CB', '#A52A2A'
  ]

  const handleSave = async () => {
    if (canvasRef.current) {
      try {
        // Export the drawing layer
        const drawingDataUrl = await canvasRef.current.exportImage('png')
        
        // Create a new canvas to combine background image and drawing
        const combinedCanvas = document.createElement('canvas')
        const ctx = combinedCanvas.getContext('2d')
        
        if (!ctx) return
        
        // Load the background image
        const backgroundImg = new Image()
        backgroundImg.crossOrigin = 'anonymous'
        
        backgroundImg.onload = () => {
          // Set canvas size to match background image
          combinedCanvas.width = backgroundImg.width
          combinedCanvas.height = backgroundImg.height
          
          // Draw background image
          ctx.drawImage(backgroundImg, 0, 0)
          
          // Load and draw the sketch layer
          const sketchImg = new Image()
          sketchImg.crossOrigin = 'anonymous'
          
          sketchImg.onload = () => {
            // Draw sketch on top of background
            ctx.drawImage(sketchImg, 0, 0, combinedCanvas.width, combinedCanvas.height)
            
            // Export the combined image
            const combinedDataUrl = combinedCanvas.toDataURL('image/png', 0.9)
            onSave(combinedDataUrl)
          }
          
          sketchImg.onerror = () => {
            // If sketch loading fails, just use background
            onSave(backgroundImg.src)
          }
          
          sketchImg.src = drawingDataUrl
        }
        
        backgroundImg.onerror = () => {
          // If background loading fails, just use the drawing
          onSave(drawingDataUrl)
        }
        
        backgroundImg.src = imageUrl
      } catch (error) {
        console.error('Error saving sketch:', error)
      }
    }
  }

  const handleClear = () => {
    if (canvasRef.current) {
      canvasRef.current.clearCanvas()
    }
  }

  const handleBrush = () => {
    setCurrentTool('brush')
    console.log('Brush tool selected')
  }

  const handleEraser = () => {
    setCurrentTool('eraser')
    console.log('Eraser tool selected - always white')
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setCursorPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  const handleMouseEnter = () => {
    setShowCursor(true)
  }

  const handleMouseLeave = () => {
    setShowCursor(false)
  }

  const handleUndo = () => {
    if (canvasRef.current) {
      try {
        canvasRef.current.undo()
      } catch (error) {
        console.log('No strokes to undo')
      }
    }
  }

  const handleRedo = () => {
    if (canvasRef.current) {
      try {
        canvasRef.current.redo()
      } catch (error) {
        console.log('No strokes to redo')
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Sketch on Photo</h3>
          <div className="flex gap-2">
            <Button onClick={onCancel} variant="outline">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-primary-600 hover:bg-primary-700">
              <Download className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        <div className="flex gap-4 flex-1 min-h-0">
          {/* Toolbar */}
          <div className="w-64 bg-gray-50 rounded-lg p-4 space-y-4 overflow-y-auto">
            {/* Brush/Eraser Toggle */}
            <div>
              <h4 className="font-medium mb-2">Tool</h4>
              <div className="flex gap-2">
                <Button
                  onClick={handleBrush}
                  variant={currentTool === 'brush' ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                >
                  <Palette className="h-4 w-4 mr-1" />
                  Brush
                </Button>
                <Button
                  onClick={handleEraser}
                  variant={currentTool === 'eraser' ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                >
                  🧽 Eraser
                </Button>
              </div>
            </div>

            {/* Brush Size */}
            <div>
              <h4 className="font-medium mb-2">
                {currentTool === 'eraser' ? 'Eraser Size' : 'Brush Size'}
              </h4>
              <input
                type="range"
                min="1"
                max="20"
                value={currentTool === 'eraser' ? eraserWidth : brushWidth}
                onChange={(e) => {
                  if (currentTool === 'eraser') {
                    setEraserWidth(Number(e.target.value))
                  } else {
                    setBrushWidth(Number(e.target.value))
                  }
                }}
                className="w-full"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {currentTool === 'eraser' ? eraserWidth : brushWidth}px
                </span>
                <div 
                  className="border-2 border-gray-400 rounded-full"
                  style={{
                    width: Math.max(8, (currentTool === 'eraser' ? eraserWidth : brushWidth) * 2),
                    height: Math.max(8, (currentTool === 'eraser' ? eraserWidth : brushWidth) * 2),
                    backgroundColor: currentTool === 'eraser' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                    borderColor: currentTool === 'eraser' ? '#f97316' : '#374151'
                  }}
                />
              </div>
            </div>

            {/* Color Palette */}
            <div>
              <h4 className="font-medium mb-2">Colors</h4>
              <div className="grid grid-cols-4 gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setBrushColor(color)}
                    className={`w-8 h-8 rounded border-2 ${
                      brushColor === color ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <div className="mt-2">
                <label className="block text-sm text-gray-600 mb-1">Custom Color</label>
                <input
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="w-full h-8 rounded border"
                />
              </div>
            </div>

            {/* Actions */}
            <div>
              <h4 className="font-medium mb-2">Actions</h4>
              <div className="space-y-2">
                <Button onClick={handleUndo} variant="outline" size="sm" className="w-full">
                  Undo
                </Button>
                <Button onClick={handleRedo} variant="outline" size="sm" className="w-full">
                  Redo
                </Button>
                <Button onClick={handleClear} variant="outline" size="sm" className="w-full">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 bg-gray-100 rounded-lg p-4 flex items-center justify-center min-h-0">
            <div 
              className="relative w-full h-96 max-w-4xl"
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              
              {/* Custom Cursor */}
              {showCursor && (
                <div
                  className="absolute pointer-events-none z-20 border-2 border-gray-400 rounded-full"
                  style={{
                    left: cursorPosition.x - (currentTool === 'eraser' ? eraserWidth : brushWidth) / 2,
                    top: cursorPosition.y - (currentTool === 'eraser' ? eraserWidth : brushWidth) / 2,
                    width: currentTool === 'eraser' ? eraserWidth : brushWidth,
                    height: currentTool === 'eraser' ? eraserWidth : brushWidth,
                    backgroundColor: currentTool === 'eraser' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)',
                    borderColor: currentTool === 'eraser' ? '#f97316' : '#374151'
                  }}
                />
              )}
              
              <ReactSketchCanvas
                ref={canvasRef}
                width="100%"
                height="384px"
                strokeColor={currentTool === 'eraser' ? '#FFFFFF' : brushColor}
                strokeWidth={currentTool === 'eraser' ? eraserWidth : brushWidth}
                backgroundImage={imageUrl}
                style={{ border: '1px solid #ccc', borderRadius: '8px' }}
                canvasColor="transparent"
                allowOnlyPointerType="all"
                withTimestamp={true}
                exportWithBackgroundImage={false}
                preserveBackgroundImageAspectRatio="none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
