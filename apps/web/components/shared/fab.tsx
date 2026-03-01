"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

const FAB_ROUTES: Record<string, { href: string; label: string }> = {
  "/dashboard/vehicles": { href: "/dashboard/vehicles/new", label: "Araç Ekle" },
}

export function FAB() {
  const pathname = usePathname()
  const config = FAB_ROUTES[pathname]

  if (!config) return null

  return (
    <Link
      href={config.href}
      className={cn(
        "fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center",
        "rounded-full bg-primary text-primary-foreground shadow-lg",
        "transition-transform active:scale-95 hover:shadow-xl",
        "lg:hidden"
      )}
      aria-label={config.label}
    >
      <Plus className="h-6 w-6" />
    </Link>
  )
}
