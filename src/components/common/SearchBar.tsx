"use client";

import React, { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Locate, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  showLocationButton?: boolean;
  showSearchButton?: boolean;
  animatedPlaceholder?: boolean;
  locationButtonProps?: {
    onClick: () => void;
    isLoading?: boolean;
    title?: string;
  };
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onFocus,
  onClear,
  placeholder = "Enter location",
  className,
  inputClassName,
  disabled = false,
  showLocationButton = true,
  showSearchButton = true,
  animatedPlaceholder = false,
  locationButtonProps,
}) => {
  const [animatedPlaceholderText, setAnimatedPlaceholderText] = React.useState('');
  const [currentTextIndex, setCurrentTextIndex] = React.useState(0);
  const [isTyping, setIsTyping] = React.useState(true);

  // Typing animation effect
  useEffect(() => {
    if (!animatedPlaceholder || !isTyping) return;

    const typingInterval = setInterval(() => {
      if (currentTextIndex < placeholder.length) {
        setAnimatedPlaceholderText(prev => prev + placeholder[currentTextIndex]);
        setCurrentTextIndex(prev => prev + 1);
      } else {
        setTimeout(() => {
          setIsTyping(false);
        }, 2000);
      }
    }, 100);

    return () => clearInterval(typingInterval);
  }, [currentTextIndex, placeholder, isTyping, animatedPlaceholder]);

  // Deleting animation effect
  useEffect(() => {
    if (!animatedPlaceholder || isTyping) return;

    const deletingInterval = setInterval(() => {
      if (animatedPlaceholderText.length > 0) {
        setAnimatedPlaceholderText(prev => prev.slice(0, -1));
      } else {
        setCurrentTextIndex(0);
        setIsTyping(true);
      }
    }, 50);

    return () => clearInterval(deletingInterval);
  }, [animatedPlaceholderText, isTyping, animatedPlaceholder]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleClear = () => {
    onChange('');
    if (onClear) {
      onClear();
    }
  };

  const displayPlaceholder = animatedPlaceholder ? animatedPlaceholderText : placeholder;

  return (
    <div className={cn("relative w-full", className)}>
      <div className="relative">
        <Input
          type="text"
          value={value}
          onChange={handleInput}
          disabled={disabled}
          placeholder={displayPlaceholder}
          onFocus={onFocus}
          className={cn("pl-12 pr-12 h-12 text-base", inputClassName)}
        />
        
        {/* Location detection button */}
        {showLocationButton && locationButtonProps && (
          <button
            type="button"
            onClick={locationButtonProps.onClick}
            disabled={locationButtonProps.isLoading || disabled}
            className="absolute inset-y-0 left-0 h-8 top-1/2 transform -translate-y-1/2 hover:bg-gray-100 flex items-center p-2 ml-2 hover:text-secondary rounded-full transition-colors"
            title={locationButtonProps.title || "Detect my location"}
          >
            {locationButtonProps.isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-secondary"></div>
            ) : (
              <Locate className="h-4 w-4 text-secondary" />
            )}
          </button>
        )}

        {/* Clear and Search buttons */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-1 space-x-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
              title="Clear location"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          )}
          {showSearchButton && (
            <Search className="h-10 w-10 p-2 rounded-full text-white btn-gradient-dark cursor-pointer transition-colors" />
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchBar;

