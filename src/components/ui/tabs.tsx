"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  mobileScrollable?: boolean
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, mobileScrollable = true, children, ...props }, ref) => {
  // Check if className contains grid (which needs mobile scrolling)
  const hasGrid = className?.includes('grid') || className?.includes('md:grid')
  
  // If mobileScrollable is true and has grid, wrap in scrollable container
  if (mobileScrollable && hasGrid) {
    // Clone children with flex-shrink-0 for mobile scrolling
    const enhancedChildren = React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child, {
          className: cn(
            child.props.className,
            "flex-shrink-0 whitespace-nowrap"
          )
        } as React.HTMLAttributes<HTMLButtonElement>)
      }
      return child
    })
    
    return (
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible">
        <TabsPrimitive.List
          ref={ref}
          className={cn(
            "inline-flex min-w-max md:min-w-0 h-auto items-center gap-2 rounded-lg bg-muted/50 p-1 text-muted-foreground w-fit",
            className
          )}
          {...props}
        >
          {enhancedChildren}
        </TabsPrimitive.List>
      </div>
    )
  }

  // Default behavior for non-grid layouts or when mobileScrollable is false
  return (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-12 items-center justify-center rounded-lg bg-muted/50 p-1 text-muted-foreground w-fit",
      className
    )}
    {...props}
    >
      {children}
    </TabsPrimitive.List>
  )
})
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-secondary data-[state=active]:text-white data-[state=active]:shadow",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

export type TabsContentVariant = "default" | "borderless"

export interface TabsContentProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> {
  variant?: TabsContentVariant
}

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  TabsContentProps
>(({ className, variant = "default", ...props }, ref) => {
  const variantClasses = {
    default: "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    borderless: "mt-2 focus-visible:outline-none",
  }

  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(variantClasses[variant], className)}
      {...props}
    />
  )
})
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
