"use client"

import { Button } from "@/components/ui/button"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ActionButtonProps {
  label: string
  icon?: LucideIcon
  onClick: () => void
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  disabled?: boolean
}

export function ActionButton({
  label,
  icon: Icon,
  onClick,
  variant = "default",
  size = "default",
  className,
  disabled = false,
}: ActionButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      className={cn(className)}
      disabled={disabled}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {label}
    </Button>
  )
}

