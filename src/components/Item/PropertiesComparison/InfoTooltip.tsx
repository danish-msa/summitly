"use client"

import React from 'react'
import { Info } from 'lucide-react'
import * as Tooltip from '@radix-ui/react-tooltip'

interface InfoTooltipProps {
  content: string
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ content }) => {
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className="bg-popover text-popover-foreground p-2 rounded-md shadow-md max-w-xs z-50">
            <p>{content}</p>
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}

export default InfoTooltip
