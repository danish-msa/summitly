"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'onChange'> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  size?: "sm" | "md" | "lg"
  variant?: "default" | "primary" | "secondary"
}

const Toggle = React.forwardRef<HTMLInputElement, ToggleProps>(
  ({ 
    className, 
    checked = false, 
    onCheckedChange, 
    disabled = false,
    size = "md",
    variant = "default",
    ...props 
  }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return
      onCheckedChange?.(e.target.checked)
    }

    const sizeConfig = {
      sm: {
        container: "h-4 w-8",
        handle: "h-3 w-3",
        handleLeft: "left-[2px]",
        handleChecked: "left-[16px]"
      },
      md: {
        container: "h-6 w-11",
        handle: "h-4 w-4",
        handleLeft: "left-[3px]",
        handleChecked: "left-[26px]"
      },
      lg: {
        container: "h-8 w-16",
        handle: "h-6 w-6",
        handleLeft: "left-[4px]",
        handleChecked: "left-[36px]"
      }
    }

    const currentSize = sizeConfig[size]

    const variantStyles = {
      default: {
        unchecked: "bg-gray-300 shadow-[inset_0_0_0_2px_#d1d5db]",
        checked: "bg-gray-400 shadow-[inset_0_0_0_2px_#9ca3af]"
      },
      primary: {
        unchecked: "bg-gray-300 shadow-[inset_0_0_0_2px_#d1d5db]",
        checked: "bg-secondary shadow-[inset_0_0_0_2px_#17B0D9]"
      },
      secondary: {
        unchecked: "bg-gray-300 shadow-[inset_0_0_0_2px_#d1d5db]",
        checked: "bg-secondary shadow-[inset_0_0_0_2px_#17B0D9]"
      }
    }

    const currentVariant = variantStyles[variant]

    return (
      <label className={cn(
        "relative inline-block cursor-pointer",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}>
        <input
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only"
          ref={ref}
          {...props}
        />
        <div
          className={cn(
            "relative rounded-full transition-all duration-300 ease-in-out",
            currentSize.container,
            checked ? currentVariant.checked : currentVariant.unchecked
          )}
        >
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 rounded-full bg-white transition-all duration-300 ease-in-out",
              "shadow-[0_2px_5px_rgba(0,0,0,0.2)]",
              currentSize.handle,
              checked 
                ? currentSize.handleChecked 
                : currentSize.handleLeft,
              checked && variant !== "default" && "shadow-[0_2px_5px_rgba(0,0,0,0.2),0_0_0_3px_rgba(26,192,235,0.3)]"
            )}
          />
        </div>
      </label>
    )
  }
)

Toggle.displayName = "Toggle"

export { Toggle }

