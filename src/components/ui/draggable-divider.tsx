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
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const container = getContainer();
      if (!container) return;

      const rect = container.getBoundingClientRect();
      
      if (orientation === 'vertical') {
        const x = e.clientX - rect.left;
        const percentage = (x / rect.width) * 100;
        const constrainedPercentage = Math.max(minPosition, Math.min(maxPosition, percentage));
        setPosition(constrainedPercentage);
      } else {
        const y = e.clientY - rect.top;
        const percentage = (y / rect.height) * 100;
        const constrainedPercentage = Math.max(minPosition, Math.min(maxPosition, percentage));
        setPosition(constrainedPercentage);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = orientation === 'vertical' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, minPosition, maxPosition, orientation, containerRef]);

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
          [isVertical ? 'height' : 'width']: '100%'
        }}
      >
        {showIcon && (
          <div
            className={cn(
              "flex items-center justify-center rounded-lg transition-all duration-200",
              isDragging
                ? "bg-secondary shadow-lg scale-110"
                : "bg-gray-300 hover:bg-secondary/80 shadow-md hover:shadow-lg"
            )}
            style={{
              width: isVertical ? '40px' : '60px',
              height: isVertical ? '60px' : '40px'
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
