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
      <div className="flex flex-col gap-2 my-2">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className="h-6 w-6 text-gray-300 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 my-2">
      {/* Star Rating */}
      <div 
        className="flex items-center gap-2"
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
                  "h-6 w-6 transition-colors",
                  isActive || isHovered
                    ? "text-yellow-400 fill-yellow-400"
                    : isAverage && ratingData.average > 0 && !hasRated
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-500 hover:text-yellow-300"
                )}
              />
            </button>
          );
        })}
      </div>
      
      {/* Rating Info Display */}
      {ratingData.total > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 rounded-full">
            <span className="text-xs font-semibold text-primary">
              {ratingData.total} {ratingData.total === 1 ? 'Vote' : 'Votes'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded-full">
            <span className="text-xs font-medium text-foreground">
              Average:
            </span>
            <span className="text-xs font-bold text-primary">
              {ratingData.average.toFixed(2)}
            </span>
            <span className="text-xs text-muted-foreground">
              out of 5
            </span>
          </div>
          {hasRated && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-full border border-green-200">
              <span className="text-xs font-medium text-green-700">
                ✓ Rated
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectRatingDisplay;

