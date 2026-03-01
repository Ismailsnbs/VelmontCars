import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Status variants (transit, inStock, reserved, sold, cancelled) MUST stay
// in sync with STATUS_BADGE_CLASSES in @/lib/design-tokens.ts.
// If you change a colour here, update the token file too (and vice-versa).
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gray-900 text-gray-50 hover:bg-gray-900/80",
        secondary:
          "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-100/80",
        destructive:
          "border-transparent bg-red-500 text-gray-50 hover:bg-red-600",
        outline: "text-gray-950 border-gray-200",
        success:
          "border-transparent bg-green-500 text-gray-50 hover:bg-green-600",
        warning:
          "border-transparent bg-yellow-500 text-gray-50 hover:bg-yellow-600",
        transit:
          "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200",
        inStock:
          "bg-green-100 text-green-800 hover:bg-green-100 border-green-200",
        reserved:
          "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200",
        sold:
          "bg-gray-100 text-gray-600 hover:bg-gray-100 border-gray-200",
        cancelled:
          "bg-red-100 text-red-800 hover:bg-red-100 border-red-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
