// Galeri Panel layout — sidebar sol, header ust, main icerik
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar, BottomTabBar } from "@/components/shared/sidebar"
import { Header } from "@/components/shared/header"
import { FAB } from "@/components/shared/fab"
import { useAuthStore } from "@/stores/authStore"
import { useSocketNotifications } from "@/hooks/useSocketNotifications"
import { PageTransition } from "@/components/shared/motion"

const GALLERY_ROLES = [
  "GALLERY_OWNER",
  "GALLERY_MANAGER",
  "SALES",
  "ACCOUNTANT",
  "STAFF",
] as const

type GalleryRole = typeof GALLERY_ROLES[number]

function isGalleryRole(role: string): role is GalleryRole {
  return (GALLERY_ROLES as readonly string[]).includes(role)
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, initialize } = useAuthStore()

  // Real-time socket bildirimlerini baslat
  useSocketNotifications()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      router.replace("/login")
      return
    }

    if (user?.role === "MASTER_ADMIN") {
      router.replace("/master")
      return
    }

    if (!user?.role || !isGalleryRole(user.role) || !user.galleryId) {
      router.replace("/login")
    }
  }, [isLoading, isAuthenticated, user, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated || !user?.role || !isGalleryRole(user.role) || !user.galleryId) {
    return null
  }

  return (
    <div className="flex h-screen">
      <aside className="hidden w-64 lg:block">
        <Sidebar type="gallery" />
      </aside>
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header sidebarType="gallery" />
        <main className="flex-1 overflow-y-auto p-6 pb-20 lg:pb-6">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
      <FAB />
      <BottomTabBar type="gallery" />
    </div>
  )
}
