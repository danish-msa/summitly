import * as React from 'react'
import { cn } from '@/lib/utils'

interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  cols?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    '2xl'?: number
  }
  gap?: 'sm' | 'md' | 'lg' | 'xl'
}

const gapClasses = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
}

export function ResponsiveGrid({ 
  children, 
  className,
  cols = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 'md'
}: ResponsiveGridProps) {
  const gridCols = React.useMemo(() => {
    const classes = []
    
    if (cols.default) {
      classes.push(`grid-cols-${cols.default}`)
    }
    if (cols.sm) {
      classes.push(`sm:grid-cols-${cols.sm}`)
    }
    if (cols.md) {
      classes.push(`md:grid-cols-${cols.md}`)
    }
    if (cols.lg) {
      classes.push(`lg:grid-cols-${cols.lg}`)
    }
    if (cols.xl) {
      classes.push(`xl:grid-cols-${cols.xl}`)
    }
    if (cols['2xl']) {
      classes.push(`2xl:grid-cols-${cols['2xl']}`)
    }
    
    return classes.join(' ')
  }, [cols])

  return (
    <div className={cn(
      'grid',
      gridCols,
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  )
}

// Specialized grid components for common use cases
export function PropertyGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <ResponsiveGrid 
      cols={{ default: 1, sm: 2, lg: 3, xl: 4 }}
      gap="lg"
      className={className}
    >
      {children}
    </ResponsiveGrid>
  )
}

export function AgentGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <ResponsiveGrid 
      cols={{ default: 1, sm: 2, md: 3, lg: 4 }}
      gap="lg"
      className={className}
    >
      {children}
    </ResponsiveGrid>
  )
}

export function FeatureGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <ResponsiveGrid 
      cols={{ default: 1, sm: 2, md: 3 }}
      gap="md"
      className={className}
    >
      {children}
    </ResponsiveGrid>
  )
}
