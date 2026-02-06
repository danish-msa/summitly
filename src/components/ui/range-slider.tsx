import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RangeSliderProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  minValue: number;
  maxValue: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
  formatValue?: (value: number) => string;
  minLabel?: string;
  maxLabel?: string;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  label,
  min,
  max,
  step = 1,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  formatValue = (v) => v.toString(),
  minLabel = "Min",
  maxLabel = "Max",
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);

  const getPercent = useCallback(
    (value: number) => ((value - min) / (max - min)) * 100,
    [min, max]
  );

  const minPercent = getPercent(minValue);
  const maxPercent = getPercent(maxValue);

  const handleIncrement = (type: 'min' | 'max') => {
    if (type === 'min') {
      const newValue = Math.min(minValue + step, maxValue - step);
      onMinChange(newValue);
    } else {
      const newValue = Math.min(maxValue + step, max);
      onMaxChange(newValue);
    }
  };

  const handleDecrement = (type: 'min' | 'max') => {
    if (type === 'min') {
      const newValue = Math.max(minValue - step, min);
      onMinChange(newValue);
    } else {
      const newValue = Math.max(maxValue - step, minValue + step);
      onMaxChange(newValue);
    }
  };

  const handleTrackClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const percent = ((e.clientX - rect.left) / rect.width) * 100;
      const value = Math.round((percent / 100) * (max - min) + min);
      
      const minDist = Math.abs(value - minValue);
      const maxDist = Math.abs(value - maxValue);
      
      if (minDist < maxDist) {
        onMinChange(Math.min(value, maxValue - step));
      } else {
        onMaxChange(Math.max(value, minValue + step));
      }
    },
    [min, max, minValue, maxValue, step, onMinChange, onMaxChange]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const rawValue = (percent / 100) * (max - min) + min;
      const value = Math.round(rawValue / step) * step;

      if (isDragging === 'min') {
        onMinChange(Math.max(min, Math.min(value, maxValue - step)));
      } else {
        onMaxChange(Math.min(max, Math.max(value, minValue + step)));
      }
    },
    [isDragging, min, max, step, minValue, maxValue, onMinChange, onMaxChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      
      {/* Slider with inline controls */}
      <div className="flex items-end gap-3">
        {/* Min Controls */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <span className="text-xs text-muted-foreground">{minLabel}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleDecrement('min')}
              className="h-8 w-8 rounded-md border border-border bg-background flex items-center justify-center hover:bg-secondary/50 transition-colors"
            >
              <Minus className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => handleIncrement('min')}
              className="h-8 w-8 rounded-md border border-border bg-background flex items-center justify-center hover:bg-secondary/50 transition-colors"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
        
        {/* Slider Track */}
        <div className="flex-1 relative pb-4">
          <div
            ref={trackRef}
            className="relative h-1.5 bg-muted rounded-full cursor-pointer"
            onClick={handleTrackClick}
          >
            {/* Active Range */}
            <div
              className="absolute h-full bg-secondary rounded-full"
              style={{
                left: `${minPercent}%`,
                width: `${maxPercent - minPercent}%`,
              }}
            />

            {/* Min Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing"
              style={{ left: `${minPercent}%` }}
              onMouseDown={() => setIsDragging('min')}
            >
              <div className="range-badge">{formatValue(minValue)}</div>
              <div className={cn(
                "w-5 h-5 rounded-full bg-secondary border-2 border-background shadow-md transition-transform",
                isDragging === 'min' && "scale-110"
              )} />
            </div>

            {/* Max Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing"
              style={{ left: `${maxPercent}%` }}
              onMouseDown={() => setIsDragging('max')}
            >
              <div className="range-badge">{formatValue(maxValue)}</div>
              <div className={cn(
                "w-5 h-5 rounded-full bg-secondary border-2 border-background shadow-md transition-transform",
                isDragging === 'max' && "scale-110"
              )} />
            </div>
          </div>
        </div>
        
        {/* Max Controls */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <span className="text-xs text-muted-foreground">{maxLabel}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleDecrement('max')}
              className="h-8 w-8 rounded-md border border-border bg-background flex items-center justify-center hover:bg-secondary/50 transition-colors"
            >
              <Minus className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => handleIncrement('max')}
              className="h-8 w-8 rounded-md border border-border bg-background flex items-center justify-center hover:bg-secondary/50 transition-colors"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RangeSlider;

