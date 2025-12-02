"use client"

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Clock, AlertCircle } from 'lucide-react'

interface RecoveryDialogProps {
  open: boolean
  onRestore: () => void
  onDiscard: () => void
  savedAt?: string | null
}

export function RecoveryDialog({
  open,
  onRestore,
  onDiscard,
  savedAt,
}: RecoveryDialogProps) {
  const [timeAgo, setTimeAgo] = useState<string>('')

  useEffect(() => {
    if (!savedAt) return

    const updateTimeAgo = () => {
      const saved = new Date(savedAt)
      const now = new Date()
      const diffMs = now.getTime() - saved.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)

      if (diffMins < 1) {
        setTimeAgo('just now')
      } else if (diffMins < 60) {
        setTimeAgo(`${diffMins} minute${diffMins > 1 ? 's' : ''} ago`)
      } else if (diffHours < 24) {
        setTimeAgo(`${diffHours} hour${diffHours > 1 ? 's' : ''} ago`)
      } else {
        setTimeAgo(`${diffDays} day${diffDays > 1 ? 's' : ''} ago`)
      }
    }

    updateTimeAgo()
    const interval = setInterval(updateTimeAgo, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [savedAt])

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle>Recover Unsaved Changes?</DialogTitle>
              <DialogDescription className="mt-1">
                We found unsaved form data from a previous session.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground mb-1">
                Last saved: {timeAgo || 'Unknown'}
              </p>
              <p className="text-xs text-muted-foreground">
                You can restore your previous work or start fresh with a new form.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onDiscard}
            className="sm:mr-2"
          >
            Start Fresh
          </Button>
          <Button onClick={onRestore} className="bg-primary hover:bg-primary/90">
            Restore Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

