'use client'

import { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Set initial state
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      // Trigger sync of offline data
      // This would typically sync IndexedDB data with the server
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate sync
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  if (isOnline) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-warning-500 text-white px-3 py-2 rounded-full text-sm font-medium shadow-lg flex items-center space-x-2">
      <WifiOff className="h-4 w-4" />
      <span>Offline</span>
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className="ml-2 p-1 rounded-full hover:bg-warning-600 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  )
}
