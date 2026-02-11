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
        const childProps = child.props as { className?: string } & React.HTMLAttributes<HTMLButtonElement>;
        return React.cloneElement(child, {
          className: cn(
            childProps.className,
            "flex-shrink-0 whitespace-nowrap "
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
            "inline-flex min-w-max md:min-w-0 h-auto items-center gap-1 text-zinc-600 w-fit",
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
      "inline-flex h-auto items-center justify-center text-zinc-600 w-fit gap-1",
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
      "inline-flex items-center gap-2 justify-center whitespace-nowrap px-4 py-4 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      // Inactive state: dark grey text, transparent background
      "text-zinc-700 bg-transparent hover:text-zinc-900 hover:bg-zinc-50",
      // Active state: blue text, white background with rounded corners
      "data-[state=active]:text-secondary data-[state=active]:bg-secondary/10 data-[state=active]:rounded-tl-lg rounded-tr-lg data-[state=active]:border-b-2 data-[state=active]:border-secondary data-[state=active]:shadow-sm data-[state=active]:shadow-bottom-0 ",
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
    default: "mt-6 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    borderless: "mt-4 focus-visible:outline-none",
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
