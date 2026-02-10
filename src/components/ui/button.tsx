import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-secondary text-white border-0 rounded-lg hover:bg-[#17B0D9] hover:text-white hover:shadow-[0_0_0_5px_rgba(26,192,235,0.2)] transition-all duration-300",
        destructive:
          "bg-[#fef2f2] text-[#dc2626] border-0 rounded-lg hover:bg-[#dc2626] hover:text-white hover:shadow-[0_0_0_5px_rgba(220,38,38,0.373)] transition-all duration-300",
        white:
          "bg-white text-secondary border-0 rounded-lg hover:bg-secondary/10 hover:text-secondary hover:border-secondary transition-all duration-300",
          outline:
          "bg-transparent text-secondary border-2 border-secondary rounded-lg hover:bg-secondary/10 hover:text-secondary hover:border-secondary transition-all duration-300",
        secondary:
          "bg-[#3b82f6] text-white border-0 rounded-lg hover:bg-[#3b82f6]/90 hover:text-white hover:shadow-[0_0_0_5px_rgba(59,131,246,0.373)] transition-all duration-300",
        ghost: 
          "bg-transparent text-[#001D3D] border-0 rounded-lg hover:bg-[#001D3D] hover:text-white hover:shadow-[0_0_0_5px_rgba(0,29,61,0.373)] transition-all duration-300",
        link: 
          "bg-transparent text-[#001D3D] border-0 rounded-lg hover:bg-[#001D3D] hover:text-white hover:shadow-[0_0_0_5px_rgba(0,29,61,0.373)] transition-all duration-300 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 rounded-full",
        sm: "h-8 rounded-full px-3 text-xs",
        lg: "h-10 rounded-full px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
