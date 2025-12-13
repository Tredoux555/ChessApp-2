'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/useAuthStore'

export default function MobileNav() {
  const pathname = usePathname()
  const { user } = useAuthStore()

  const navItems = [
    { href: '/dashboard', icon: '🏠', label: 'Home' },
    { href: '/chat', icon: '💬', label: 'Chat' },
    { href: '/marketplace', icon: '🛒', label: 'Shop' },
    { href: '/profile', icon: '👤', label: 'Profile' },
  ]

  if (user?.isAdmin) {
    navItems.push({ href: '/admin', icon: '⚙️', label: 'Admin' })
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}





