"use client"

import * as React from "react"
import { useState } from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface SearchableSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchable?: boolean
  searchPlaceholder?: string
  children: React.ReactNode
  disabled?: boolean
  className?: string
  triggerClassName?: string
  contentClassName?: string
  allowNone?: boolean
  noneLabel?: string
  maxHeight?: string
}

export function SearchableSelect({
  value,
  onValueChange,
  placeholder = "Select...",
  searchable = false,
  searchPlaceholder = "Search...",
  children,
  disabled = false,
  className,
  triggerClassName,
  contentClassName,
  allowNone = false,
  noneLabel = "None",
  maxHeight = "300px",
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // If not searchable, use regular Select
  if (!searchable) {
    return (
      <Select
        value={value || (allowNone && !value ? "none" : undefined)}
        onValueChange={(newValue) => {
          if (onValueChange) {
            onValueChange(newValue === "none" ? "" : newValue)
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger className={cn("rounded-lg", triggerClassName, className)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className={contentClassName}>
          {allowNone && (
            <SelectItem value="none">{noneLabel}</SelectItem>
          )}
          {children}
        </SelectContent>
      </Select>
    )
  }

  // Extract items from children for searchable mode
  const items: Array<{ value: string; label: string; children?: React.ReactNode }> = []
  
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === SelectItem) {
      const childValue = child.props.value
      const childLabel = typeof child.props.children === 'string' 
        ? child.props.children 
        : childValue
      items.push({
        value: childValue,
        label: childLabel,
        children: child.props.children,
      })
    }
  })

  // Filter items based on search query
  const filteredItems = searchQuery
    ? items.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items

  // Find selected item
  const selectedItem = items.find((item) => item.value === value)

  // Handle value change
  const handleValueChange = (newValue: string) => {
    if (onValueChange) {
      onValueChange(newValue === "none" ? "" : newValue)
    }
    setOpen(false)
    setSearchQuery("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between rounded-lg h-9",
            triggerClassName,
            className
          )}
        >
          <span className="truncate">
            {selectedItem ? selectedItem.label : placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-full p-0", contentClassName)} align="start">
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
              onKeyDown={(e) => {
                // Prevent closing popover when typing
                e.stopPropagation()
              }}
            />
          </div>
        </div>
        <div 
          className="overflow-y-auto" 
          style={{ maxHeight }}
        >
          {allowNone && (
            <div
              className={cn(
                "px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground flex items-center justify-between",
                value === "" || value === "none" ? "bg-accent" : ""
              )}
              onClick={() => handleValueChange("none")}
            >
              <span>{noneLabel}</span>
              {(value === "" || value === "none") && (
                <Check className="h-4 w-4" />
              )}
            </div>
          )}
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div
                key={item.value}
                className={cn(
                  "px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground flex items-center justify-between",
                  value === item.value ? "bg-accent" : ""
                )}
                onClick={() => handleValueChange(item.value)}
              >
                <span>{item.label}</span>
                {value === item.value && <Check className="h-4 w-4" />}
              </div>
            ))
          ) : (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              No results found.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// Export a helper component for items (for type safety)
export const SearchableSelectItem = SelectItem

