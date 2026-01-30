"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const VerticalTabs = TabsPrimitive.Root

interface VerticalTabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  className?: string
}

const VerticalTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  VerticalTabsListProps
>(({ className, ...props }, ref) => {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        // Mobile: horizontal scrollable
        "flex flex-row items-center gap-2 w-full overflow-x-auto scrollbar-hide pb-2",
        // Desktop: vertical sidebar
        "md:flex-col md:items-start md:justify-start md:w-80 md:flex-shrink-0 md:overflow-visible md:pb-0",
        className
      )}
      {...props}
    />
  )
})
VerticalTabsList.displayName = "VerticalTabsList"

interface VerticalTabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  className?: string
}

const VerticalTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  VerticalTabsTriggerProps
>(({ className, ...props }, ref) => {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        // Mobile: pill-style horizontal tabs
        "px-4 py-2.5 text-sm font-medium rounded-full flex-shrink-0",
        "text-zinc-600 bg-muted/40 hover:text-zinc-900 hover:bg-zinc-100",
        "data-[state=active]:text-primary data-[state=active]:bg-secondary/20 data-[state=active]:font-semibold",
        // Desktop: full-width vertical tabs
        "md:px-5 md:py-7 md:text-base md:rounded-none md:rounded-tr-full md:rounded-br-full md:w-full md:justify-start md:text-left",
        "md:text-zinc-700 md:bg-muted/20 md:hover:bg-zinc-50",
        className
      )}
      {...props}
    />
  )
})
VerticalTabsTrigger.displayName = "VerticalTabsTrigger"

interface VerticalTabsContentProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> {
  className?: string
}

const VerticalTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  VerticalTabsContentProps
>(({ className, ...props }, ref) => {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        "flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-left-2",
        className
      )}
      {...props}
    />
  )
})
VerticalTabsContent.displayName = "VerticalTabsContent"

// Container component for the vertical tabs layout
interface VerticalTabsContainerProps {
  children: React.ReactNode
  className?: string
}

const VerticalTabsContainer: React.FC<VerticalTabsContainerProps> = ({ children, className }) => {
  return (
    <div className={cn(
      // Mobile: stacked layout
      "flex flex-col gap-4 w-full",
      // Desktop: side-by-side layout
      "md:flex-row md:gap-10",
      className
    )}>
      {children}
    </div>
  )
}

export {
  VerticalTabs,
  VerticalTabsList,
  VerticalTabsTrigger,
  VerticalTabsContent,
  VerticalTabsContainer
}
