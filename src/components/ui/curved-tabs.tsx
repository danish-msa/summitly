import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const CurvedTabs = TabsPrimitive.Root

interface CurvedTabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  mobileScrollable?: boolean
}

const CurvedTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  CurvedTabsListProps
>(({ className, mobileScrollable = true, children, ...props }, ref) => {
  const hasGrid = className?.includes('grid') || className?.includes('md:grid')
  
  if (mobileScrollable && hasGrid) {
    const enhancedChildren = React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        const childProps = child.props as { className?: string } & React.HTMLAttributes<HTMLButtonElement>
        return React.cloneElement(child, {
          className: cn(childProps.className, "flex-shrink-0 whitespace-nowrap")
        } as React.HTMLAttributes<HTMLButtonElement>)
      }
      return child
    })
    
    return (
      <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible">
        <TabsPrimitive.List
          ref={ref}
          className={cn(
            "inline-flex min-w-max md:min-w-0 h-auto items-end gap-0 w-fit relative",
            className
          )}
          {...props}
        >
          {enhancedChildren}
        </TabsPrimitive.List>
      </div>
    )
  }

  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "inline-flex h-auto items-end justify-start w-fit gap-0 relative",
        className
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.List>
  )
})
CurvedTabsList.displayName = "CurvedTabsList"

interface CurvedTabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  activeColor?: "blue" | "cyan"
}

const CurvedTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  CurvedTabsTriggerProps
>(({ className, activeColor = "blue", ...props }, ref) => {
  const colorClasses = {
    blue: "data-[state=active]:text-blue-600",
    cyan: "data-[state=active]:text-cyan-500"
  }

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        // Base styles
        "left-7 relative inline-flex items-center justify-center whitespace-nowrap px-7 py-5 text-base font-medium transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        // Inactive state
        "text-zinc-500 bg-transparent hover:text-zinc-700",
        // Active state - white background with curved top corners and shadow
        "data-[state=active]:bg-white data-[state=active]:rounded-t-xl",
        "data-[state=active]:shadow-[0_-0.5rem_1.25rem_-1.25rem_#00000014,0.3rem_-0.3rem_0.75rem_-0.7rem_#0000000d,-0.5rem_-0.5rem_1.25rem_-0.7rem_#00000014]",
        // Active color
        colorClasses[activeColor],
        // Curved corner connectors for active state
        "data-[state=active]:before:absolute data-[state=active]:before:bottom-0 data-[state=active]:before:-left-3 data-[state=active]:before:h-3 data-[state=active]:before:w-3 data-[state=active]:before:bg-white",
        "data-[state=active]:before:[mask-image:radial-gradient(circle_12px_at_0_0,transparent_0,transparent_12px,black_12px)]",
        "data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:-right-3 data-[state=active]:after:h-3 data-[state=active]:after:w-3 data-[state=active]:after:bg-white",
        "data-[state=active]:after:[mask-image:radial-gradient(circle_12px_at_100%_0,transparent_0,transparent_12px,black_12px)]",
        className
      )}
      {...props}
    />
  )
})
CurvedTabsTrigger.displayName = "CurvedTabsTrigger"

export type CurvedTabsContentVariant = "default" | "borderless"

export interface CurvedTabsContentProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> {
  variant?: CurvedTabsContentVariant
}

const CurvedTabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  CurvedTabsContentProps
>(({ className, variant = "default", ...props }, ref) => {
  const variantClasses = {
    default: cn(
      "bg-white rounded-b-xl rounded-tr-xl rounded-tl-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)]",
      "p-8 pt-10 pl-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    ),
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
CurvedTabsContent.displayName = "CurvedTabsContent"

export { CurvedTabs, CurvedTabsList, CurvedTabsTrigger, CurvedTabsContent }

