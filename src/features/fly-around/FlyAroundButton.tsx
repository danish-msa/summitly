"use client";

import React, { useState } from "react";
import { Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlyAroundView } from "./FlyAroundView";

export interface FlyAroundButtonProps {
  latitude: number;
  longitude: number;
  address?: string;
  /** Button label or use default "Fly around" */
  label?: string;
  variant?: "default" | "secondary" | "outline" | "ghost" | "link" | "destructive" | "white";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  /** Render as icon-only (no text). */
  iconOnly?: boolean;
  /** Tooltip title (e.g. for icon-only buttons). */
  title?: string;
}

export function FlyAroundButton({
  latitude,
  longitude,
  address,
  label = "Fly around",
  variant = "secondary",
  size = "default",
  className,
  iconOnly = false,
  title: titleProp,
}: FlyAroundButtonProps) {
  const [open, setOpen] = useState(false);
  const title = titleProp ?? (iconOnly ? "Fly around" : undefined);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
        aria-label={iconOnly ? title ?? "Open fly around view" : undefined}
        title={title}
      >
        <Plane className={iconOnly ? "h-4 w-4" : "mr-2 h-4 w-4"} aria-hidden />
        {!iconOnly && label}
      </Button>
      {open && (
        <FlyAroundView
          latitude={latitude}
          longitude={longitude}
          address={address}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
