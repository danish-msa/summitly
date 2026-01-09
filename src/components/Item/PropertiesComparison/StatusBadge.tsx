"use client"

import React from 'react'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusBadgeColor = (status: string): string => {
    const statusLower = status?.toLowerCase() || ''
    if (statusLower.includes('active') || statusLower === 'a') {
      return 'bg-green-100 text-green-800'
    }
    if (statusLower.includes('sold') || statusLower === 's') {
      return 'bg-blue-100 text-blue-800'
    }
    if (statusLower.includes('pending') || statusLower === 'p') {
      return 'bg-yellow-100 text-yellow-800'
    }
    return 'bg-gray-100 text-gray-800'
  }

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
      getStatusBadgeColor(status)
    )}>
      {status}
    </span>
  )
}

export default StatusBadge
