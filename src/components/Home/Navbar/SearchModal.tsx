'use client';

import React from 'react';
import { Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AutocompleteSearch } from '@/components/common/AutocompleteSearch';

export interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-0 gap-0 overflow-hidden sm:rounded-2xl">
        <DialogHeader className="px-6 pr-12 pt-6 pb-4 space-y-2 text-left border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Search className="h-5 w-5" aria-hidden />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
                Search properties & locations
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Find homes for sale or rent, or search by city, address, or neighbourhood.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="px-6 py-5">
          <AutocompleteSearch
            placeholder="Search by address, city, or MLS® number..."
            className="w-full"
            inputClassName="h-11 text-sm bg-muted/30 border-slate-200 focus:ring-primary/30 focus:border-primary rounded-xl"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
