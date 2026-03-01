// Shared sidebar — Master Panel ve Galeri Paneli icin ayri nav itemlari
"use client"

import { useTransition } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Receipt,
  DollarSign,
  Globe,
  Building2,
  Bell,
  ScrollText,
  Car,
  Ship,
  Calculator,
  Package,
  Users,
  ShoppingCart,
  BarChart3,
  Settings,
} from "lucide-react"
import { MoreHorizontal, Plus } from "lucide-react"
import { useAuthStore } from "@/stores/authStore"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  /** Roller — tanımlıysa sadece bu roller görebilir. Tanımsızsa herkes. */
  roles?: string[]
}

const masterNavItems: NavItem[] = [
  { title: "Dashboard", href: "/master", icon: LayoutDashboard },
  { title: "Vergi Oranları", href: "/master/tax-rates", icon: Receipt },
  { title: "Döviz Kurları", href: "/master/exchange-rates", icon: DollarSign },
  { title: "Ülkeler", href: "/master/countries", icon: Globe },
  { title: "Galeriler", href: "/master/galleries", icon: Building2 },
  { title: "Bildirimler", href: "/master/notifications", icon: Bell },
  { title: "Audit Log", href: "/master/audit-logs", icon: ScrollText },
]

// Rol matrisi (CLAUDE.md):
// GALLERY_OWNER/MANAGER: tümü
// SALES: araç ✅, maliyet ✅, ürün ✅, müşteri ✅, rapor 👁️ — ayar ❌
// ACCOUNTANT: araç 👁️, maliyet 👁️, ürün 👁️, müşteri 👁️, rapor ✅ — satış ❌, ayar ❌
// STAFF: araç 👁️, ürün 👁️ — hesap/müşteri/satış/rapor/ayar ❌
const galleryNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Araçlar", href: "/dashboard/vehicles", icon: Car },
  { title: "Transit", href: "/dashboard/vehicles/transit", icon: Ship },
  { title: "Hesaplayıcı", href: "/dashboard/calculator", icon: Calculator, roles: ["GALLERY_OWNER", "GALLERY_MANAGER", "SALES", "ACCOUNTANT"] },
  { title: "Ürünler", href: "/dashboard/products", icon: Package },
  { title: "Müşteriler", href: "/dashboard/customers", icon: Users, roles: ["GALLERY_OWNER", "GALLERY_MANAGER", "SALES", "ACCOUNTANT"] },
  { title: "Satışlar", href: "/dashboard/sales", icon: ShoppingCart, roles: ["GALLERY_OWNER", "GALLERY_MANAGER", "SALES"] },
  { title: "Raporlar", href: "/dashboard/reports", icon: BarChart3, roles: ["GALLERY_OWNER", "GALLERY_MANAGER", "SALES", "ACCOUNTANT"] },
  { title: "Ayarlar", href: "/dashboard/settings", icon: Settings, roles: ["GALLERY_OWNER", "GALLERY_MANAGER"] },
]

// Bottom tab bar items — 5 ana tab
const galleryBottomTabs: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Araçlar", href: "/dashboard/vehicles", icon: Car },
  { title: "Hesapla", href: "/dashboard/calculator", icon: Calculator },
  { title: "Stok", href: "/dashboard/products", icon: Package },
]

const masterBottomTabs: NavItem[] = [
  { title: "Dashboard", href: "/master", icon: LayoutDashboard },
  { title: "Vergiler", href: "/master/tax-rates", icon: Receipt },
  { title: "Döviz", href: "/master/exchange-rates", icon: DollarSign },
  { title: "Galeriler", href: "/master/galleries", icon: Building2 },
]

interface SidebarProps {
  type: "master" | "gallery"
  className?: string
}

export function Sidebar({ type, className }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuthStore()
  const [isPending, startTransition] = useTransition()
  const allItems = type === "master" ? masterNavItems : galleryNavItems
  const title = type === "master" ? "Master Panel" : "Galeri Paneli"

  // Rol bazlı filtreleme — roles tanımsızsa herkese açık
  const items = allItems.filter(item => !item.roles || (user?.role && item.roles.includes(user.role)))

  const handleNav = (href: string, e: React.MouseEvent) => {
    if (pathname === href) return
    e.preventDefault()
    startTransition(() => {
      router.push(href)
    })
  }

  return (
    <div className={cn("flex h-full flex-col border-r bg-background", className)}>
      <div className="flex h-16 items-center border-b px-6">
        <Link href={type === "master" ? "/master" : "/dashboard"} className="flex items-center gap-2">
          <Car className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">{title}</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/master" &&
              item.href !== "/dashboard" &&
              pathname.startsWith(item.href) &&
              !items.some(other =>
                other.href !== item.href &&
                other.href.length > item.href.length &&
                pathname.startsWith(other.href)
              ))
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => handleNav(item.href, e)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                isPending && !isActive && "opacity-60"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

// Mobile bottom tab bar — lg altında gösterilir
export function BottomTabBar({ type }: { type: "master" | "gallery" }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const tabs = type === "gallery" ? galleryBottomTabs : masterBottomTabs

  const handleNav = (href: string, e: React.MouseEvent) => {
    if (pathname === href) return
    e.preventDefault()
    startTransition(() => {
      router.push(href)
    })
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center border-t bg-background lg:hidden">
      {tabs.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/master" &&
            item.href !== "/dashboard" &&
            pathname.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={(e) => handleNav(item.href, e)}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-all duration-150",
              isActive ? "text-primary" : "text-muted-foreground",
              isPending && !isActive && "opacity-60"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.title}
          </Link>
        )
      })}
      <Link
        href={type === "gallery" ? "/dashboard/sales" : "/master/notifications"}
        className="flex flex-1 flex-col items-center justify-center gap-1 text-xs text-muted-foreground"
      >
        <MoreHorizontal className="h-5 w-5" />
        Daha Fazla
      </Link>
    </nav>
  )
}

// Mobile FAB — sağ alt köşe (+Araç Ekle)
export function MobileFAB({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg lg:hidden"
      aria-label={label}
    >
      <Plus className="h-6 w-6" />
    </Link>
  )
}
