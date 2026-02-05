"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const SidebarContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
}>({
  open: true,
  setOpen: () => {},
})

export function SidebarProvider({ children, defaultOpen = true }: { children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = React.useState(defaultOpen)
  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  return React.useContext(SidebarContext)
}

const sidebarVariants = cva(
  "relative h-screen transition-all duration-300 border-r bg-sidebar-background flex-shrink-0",
  {
    variants: {
      variant: {
        default: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof sidebarVariants> {
  collapsible?: "icon" | "offcanvas" | "none"
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, variant, collapsible = "none", ...props }, ref) => {
    const { open } = useSidebar()
    return (
      <div
        ref={ref}
        className={cn(
          sidebarVariants({ variant }),
          !open && collapsible === "icon" && "w-14",
          open && collapsible === "icon" && "w-64",
          className
        )}
        {...props}
      />
    )
  }
)
Sidebar.displayName = "Sidebar"

const SidebarHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center px-4 py-4", className)} {...props} />
  )
)
SidebarHeader.displayName = "SidebarHeader"

const SidebarContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex-1 overflow-y-auto px-2 py-4", className)} {...props} />
  )
)
SidebarContent.displayName = "SidebarContent"

const SidebarGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-1", className)} {...props} />
  )
)
SidebarGroup.displayName = "SidebarGroup"

const SidebarGroupLabel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-3 py-2 text-xs font-semibold text-muted-foreground uppercase", className)} {...props} />
  )
)
SidebarGroupLabel.displayName = "SidebarGroupLabel"

export const SidebarGroupContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-1", className)} {...props} />
  )
)
SidebarGroupContent.displayName = "SidebarGroupContent"

const SidebarMenu = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn("space-y-1", className)} {...props} />
  )
)
SidebarMenu.displayName = "SidebarMenu"

const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.HTMLAttributes<HTMLLIElement>>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn("", className)} {...props} />
  )
)
SidebarMenuItem.displayName = "SidebarMenuItem"

const sidebarMenuButtonVariants = cva(
  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
  {
    variants: {
      variant: {
        default: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface SidebarMenuButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof sidebarMenuButtonVariants> {
  asChild?: boolean
}

const SidebarMenuButton = React.forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        ref={ref}
        className={cn(sidebarMenuButtonVariants({ variant }), className)}
        {...props}
      />
    )
  }
)
SidebarMenuButton.displayName = "SidebarMenuButton"

const SidebarTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => {
    const { open, setOpen } = useSidebar()
    return (
      <button
        ref={ref}
        onClick={() => setOpen(!open)}
        className={cn("inline-flex items-center justify-center rounded-md p-2 hover:bg-accent", className)}
        {...props}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
    )
  }
)
SidebarTrigger.displayName = "SidebarTrigger"

export {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
}

