import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "bg-[#e0ffe0] border border-green-400 text-green-700",
        active:
          "bg-[#e0ffe0] border border-green-400 text-green-700",
        sold:
          "bg-red-50 border border-red-400 text-red-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode
  showDot?: boolean
}

function Badge({ className, variant, icon, showDot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {icon && (
        <span className="flex-shrink-0 flex items-center justify-center">
          {icon}
        </span>
      )}
      {showDot && !icon && (
        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-current" />
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
