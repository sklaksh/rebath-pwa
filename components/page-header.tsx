'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Home, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PageHeaderProps {
  title: string
  showBackButton?: boolean
  showQuickNav?: boolean
  backHref?: string
}

export function PageHeader({ 
  title, 
  showBackButton = true, 
  showQuickNav = true,
  backHref 
}: PageHeaderProps) {
  const router = useRouter()

  const handleBack = () => {
    if (backHref) {
      router.push(backHref)
    } else {
      router.back()
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        </div>
        
        {showQuickNav && (
          <div className="flex items-center space-x-2">
            <Link href="/">
              <Button variant="ghost" size="sm" className="p-2">
                <Home className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/projects">
              <Button variant="ghost" size="sm" className="p-2">
                <FolderOpen className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}
