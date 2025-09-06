'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { AlertTriangle, X } from 'lucide-react'

interface DeleteConfirmationProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  itemName?: string
  loading?: boolean
}

export function DeleteConfirmation({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'DELETE',
  itemName = 'item',
  loading = false
}: DeleteConfirmationProps) {
  const [inputText, setInputText] = useState('')

  const handleConfirm = () => {
    if (inputText === confirmText) {
      onConfirm()
      setInputText('')
    }
  }

  const handleClose = () => {
    setInputText('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              {title}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={loading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">{description}</p>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Type <span className="font-mono bg-gray-100 px-1 rounded">{confirmText}</span> to confirm:
            </label>
            <Input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Type ${confirmText} to confirm`}
              className="font-mono"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={loading || inputText !== confirmText}
            >
              {loading ? 'Deleting...' : `Delete ${itemName}`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

