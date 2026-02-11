"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ChevronsLeftRight, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DraggableDividerProps {
  /**
   * Current position as a percentage (0-100)
   * @default 50
   */
  position?: number;
  
  /**
   * Callback when position changes
   */
  onPositionChange?: (position: number) => void;
  
  /**
   * Minimum position percentage (0-100)
   * @default 25
   */
  minPosition?: number;
  
  /**
   * Maximum position percentage (0-100)
   * @default 75
   */
  maxPosition?: number;
  
  /**
   * Orientation of the divider
   * @default 'vertical'
   */
  orientation?: 'vertical' | 'horizontal';
  
  /**
   * Container ref for calculating position
   * If not provided, will use parent container
   */
  containerRef?: React.RefObject<HTMLElement>;
  
  /**
   * Custom className for the divider
   */
  className?: string;
  
  /**
   * Show icon handle
   * @default true
   */
  showIcon?: boolean;
  
  /**
   * Icon to display
   * @default ChevronsLeftRight for vertical, GripVertical for horizontal
   */
  icon?: React.ReactNode;
}

export const DraggableDivider: React.FC<DraggableDividerProps> = ({
  position: controlledPosition,
  onPositionChange,
  minPosition = 25,
  maxPosition = 75,
  orientation = 'vertical',
  containerRef,
  className,
  showIcon = true,
  icon
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [internalPosition, setInternalPosition] = useState(50);
  const dividerRef = useRef<HTMLDivElement>(null);
  const localContainerRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);
  const pendingPositionRef = useRef<number | null>(null);
  
  // Use controlled or internal state
  const position = controlledPosition !== undefined ? controlledPosition : internalPosition;
  const setPosition = (newPosition: number) => {
    if (controlledPosition === undefined) {
      setInternalPosition(newPosition);
    }
    onPositionChange?.(newPosition);
  };

  // Get container ref (use provided or local)
  const getContainer = (): HTMLElement | null => {
    if (containerRef?.current) return containerRef.current;
    if (localContainerRef.current) return localContainerRef.current;
    // Fallback to parent element
    return dividerRef.current?.parentElement || null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  useEffect(() => {
    // Optimized mouse move handler - updates DOM directly for maximum smoothness
    let rafScheduled = false;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const container = getContainer();
      if (!container) return;

      const rect = container.getBoundingClientRect();
      let newPercentage: number;
      
      if (orientation === 'vertical') {
        const x = e.clientX - rect.left;
        newPercentage = (x / rect.width) * 100;
      } else {
        const y = e.clientY - rect.top;
        newPercentage = (y / rect.height) * 100;
      }
      
      const constrainedPercentage = Math.max(minPosition, Math.min(maxPosition, newPercentage));
      
      // Store pending position for state update
      pendingPositionRef.current = constrainedPercentage;
      
      // Schedule RAF only if not already scheduled (prevents queue buildup)
      if (!rafScheduled) {
        rafScheduled = true;
        rafIdRef.current = requestAnimationFrame(() => {
          rafScheduled = false;
          if (pendingPositionRef.current !== null) {
            setPosition(pendingPositionRef.current);
            pendingPositionRef.current = null;
          }
          rafIdRef.current = null;
        });
      }
    };

    const handleMouseUp = () => {
      // Ensure final position is applied
      if (pendingPositionRef.current !== null) {
        setPosition(pendingPositionRef.current);
        pendingPositionRef.current = null;
      }
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      setIsDragging(false);
    };

    if (isDragging) {
      // Use passive listeners for better performance
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp, { passive: true });
      document.body.style.cursor = orientation === 'vertical' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
      // Prevent text selection during drag
      document.body.style.pointerEvents = 'auto';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.pointerEvents = '';
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isDragging, minPosition, maxPosition, orientation]);

  // Default icon based on orientation
  const defaultIcon = orientation === 'vertical' 
    ? <ChevronsLeftRight className="w-5 h-5" />
    : <GripVertical className="w-5 h-5" />;
  
  const displayIcon = icon !== undefined ? icon : defaultIcon;

  const isVertical = orientation === 'vertical';

  return (
    <>
      {/* Hidden container ref for fallback */}
      {!containerRef && <div ref={localContainerRef} className="hidden" />}
      
      <div
        ref={dividerRef}
        className={cn(
          "flex items-center justify-center cursor-col-resize relative z-10 group",
          isVertical ? "flex-col" : "flex-row",
          className
        )}
        onMouseDown={handleMouseDown}
        style={{
          [isVertical ? 'width' : 'height']: '24px',
          [isVertical ? 'height' : 'width']: '100%',
          willChange: isDragging ? 'transform' : 'auto',
          touchAction: 'none' // Prevent touch scrolling during drag
        }}
      >
        {showIcon && (
          <div
            className={cn(
              "flex items-center justify-center rounded-xl",
              // Disable transitions during drag for better performance
              isDragging 
                ? "bg-secondary shadow-lg scale-110" 
                : "bg-gray-300 hover:bg-secondary/80 shadow-md hover:shadow-lg transition-all duration-200"
            )}
            style={{
              width: isVertical ? '25px' : '60px',
              height: isVertical ? '60px' : '40px',
              willChange: isDragging ? 'transform' : 'auto'
            }}
          >
            <div
              className={cn(
                "transition-colors duration-200",
                isDragging ? "text-white" : "text-gray-600 group-hover:text-white"
              )}
            >
              {displayIcon}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DraggableDivider;
