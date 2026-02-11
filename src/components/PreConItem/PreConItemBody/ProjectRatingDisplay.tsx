"use client";

import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getProjectRating, saveProjectRating } from '@/lib/api/project-ratings';

interface ProjectRatingDisplayProps {
  propertyId: string;
}

const ProjectRatingDisplay: React.FC<ProjectRatingDisplayProps> = ({ propertyId }) => {
  const [userRating, setUserRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [ratingData, setRatingData] = useState<{
    ratings: number[];
    average: number;
    total: number;
  }>({
    ratings: [],
    average: 0,
    total: 0
  });
  const [hasRated, setHasRated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load ratings from database on mount
  useEffect(() => {
    const loadRatings = async () => {
      setIsLoading(true);
      try {
        const data = await getProjectRating(propertyId);
        setRatingData({
          ratings: data.ratings,
          average: data.average,
          total: data.total
        });
        if (data.userRating) {
          setUserRating(data.userRating);
          setHasRated(true);
        }
      } catch (error) {
        console.error('Error loading ratings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRatings();
  }, [propertyId]);

  const handleStarClick = async (rating: number) => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      await saveProjectRating(propertyId, rating);
      
      // Update local state
      setUserRating(rating);
      setHasRated(true);
      
      // Reload ratings to get updated average and total
      const updatedData = await getProjectRating(propertyId);
      setRatingData({
        ratings: updatedData.ratings,
        average: updatedData.average,
        total: updatedData.total
      });
    } catch (error) {
      console.error('Error saving rating:', error);
      // You could show a toast notification here
    } finally {
      setIsSaving(false);
    }
  };

  const handleStarHover = (rating: number) => {
    if (!hasRated || userRating === 0) {
      setHoveredRating(rating);
    }
  };

  const handleMouseLeave = () => {
    setHoveredRating(0);
  };

  const displayRating = hoveredRating || userRating || 0;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-1.5 my-1.5">
        <div className="flex items-center gap-1 sm:gap-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 my-1.5 sm:my-2">
      {/* Star Rating */}
      <div 
        className="flex items-center gap-0.5 sm:gap-1"
        onMouseLeave={handleMouseLeave}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = star <= displayRating;
          const isHovered = star <= hoveredRating;
          const isAverage = star <= Math.round(ratingData.average);
          
          return (
            <button
              key={star}
              type="button"
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => handleStarHover(star)}
              disabled={isSaving}
              className={cn(
                "transition-all duration-150",
                "hover:scale-110",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded",
                isSaving && "opacity-50 cursor-not-allowed"
              )}
              aria-label={`Rate ${star} out of 5 stars`}
            >
            <Star
              className={cn(
                "h-4 w-4 sm:h-5 sm:w-5 transition-colors",
                isActive || isHovered
                  ? "text-yellow-400 fill-yellow-400"
                  : isAverage && ratingData.average > 0 && !hasRated
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-primary/50 hover:text-yellow-300"
              )}
            />
            </button>
          );
        })}
      </div>
      
      {/* Rating Stats - Professional One-Line Format */}
      {ratingData.total > 0 && (
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
          <span className="font-semibold text-foreground">
            {ratingData.average.toFixed(1)}
          </span>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">5</span>
          <span className="text-muted-foreground">
            ({ratingData.total} {ratingData.total === 1 ? 'vote' : 'votes'})
          </span>
        </div>
      )}
      
      
    </div>
  );
};

export default ProjectRatingDisplay;

