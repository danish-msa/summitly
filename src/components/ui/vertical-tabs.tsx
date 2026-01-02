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
        "flex flex-col items-start justify-start gap-2 w-80 flex-shrink-0",
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
        "inline-flex items-center justify-start whitespace-nowrap px-5 py-7 text-medium font-medium transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        // Inactive state
        "text-zinc-700 bg-muted/20 hover:text-zinc-900 hover:bg-zinc-50 rounded-tr-full rounded-br-full w-full text-left",
        // Active state
        "data-[state=active]:text-primary data-[state=active]:bg-secondary/10 data-[state=active]:font-semibold",
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
    <div className={cn("flex flex-row gap-10 w-full", className)}>
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

