"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ReactNode } from "react"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

export interface Column<T> {
  key: string
  header: string | ReactNode
  render?: (item: T) => ReactNode
  className?: string
  sortable?: boolean
  sortKey?: string // Optional: use different key for sorting than display key
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (item: T) => string
  emptyMessage?: string
  className?: string
  onRowClick?: (item: T) => void
  sortBy?: string
  sortOrder?: "asc" | "desc"
  onSort?: (key: string) => void
  getRowClassName?: (item: T) => string
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = "No data available",
  className,
  onRowClick,
  sortBy,
  sortOrder,
  onSort,
  getRowClassName,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <Card className={cn("p-8 text-center", className)}>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </Card>
    )
  }

  const handleSort = (column: Column<T>) => {
    if (column.sortable && onSort) {
      onSort(column.sortKey || column.key)
    }
  }

  const getSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null
    
    const sortKey = column.sortKey || column.key
    const isActive = sortBy === sortKey

    if (!isActive) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
    }

    if (sortOrder === "asc") {
      return <ArrowUp className="ml-2 h-4 w-4 text-primary" />
    }

    return <ArrowDown className="ml-2 h-4 w-4 text-primary" />
  }

  return (
    <Card className={className}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead 
                key={column.key} 
                className={cn(
                  column.className,
                  column.sortable && "cursor-pointer select-none"
                )}
                onClick={() => handleSort(column)}
              >
                <div className="flex items-center">
                  {typeof column.header === 'string' ? column.header : column.header}
                  {getSortIcon(column)}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow
              key={keyExtractor(item)}
              onClick={() => onRowClick?.(item)}
              className={cn(
                onRowClick ? "cursor-pointer" : "",
                getRowClassName?.(item)
              )}
            >
              {columns.map((column) => (
                <TableCell key={column.key} className={column.className}>
                  {column.render
                    ? column.render(item)
                    : (item[column.key as keyof T] as ReactNode)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

