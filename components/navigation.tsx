'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, FolderOpen, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Navigation() {
  const pathname = usePathname()

  // Don't show navigation on login page
  if (pathname === '/login') {
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        <Link href="/">
          <Button
            variant={pathname === '/' ? 'default' : 'ghost'}
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2 px-3"
          >
            <Home className="h-5 w-5" />
            <span className="text-xs">Home</span>
          </Button>
        </Link>
        
        <Link href="/projects">
          <Button
            variant={pathname.startsWith('/projects') ? 'default' : 'ghost'}
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2 px-3"
          >
            <FolderOpen className="h-5 w-5" />
            <span className="text-xs">Projects</span>
          </Button>
        </Link>
        
        <Link href="/projects/new">
          <Button
            variant={pathname === '/projects/new' ? 'default' : 'ghost'}
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2 px-3"
          >
            <Plus className="h-5 w-5" />
            <span className="text-xs">New Project</span>
          </Button>
        </Link>
      </div>
    </nav>
  )
}
