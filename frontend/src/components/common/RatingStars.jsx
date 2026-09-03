import React from 'react';
import { Star, StarHalf } from 'lucide-react';

const RatingStars = ({ rating = 0, count = 0, size = 16, showCount = true }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return (
    <div className="flex items-center space-x-1">
      <div className="flex text-amber-400">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} size={size} fill="currentColor" stroke="currentColor" />
        ))}
        {hasHalfStar && <StarHalf size={size} fill="currentColor" stroke="currentColor" />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} size={size} className="text-gray-300" stroke="currentColor" />
        ))}
      </div>
      {showCount && (
        <span className="text-sm text-gray-500 ml-1">
          {rating.toFixed(1)} ({count})
        </span>
      )}
    </div>
  );
};

export default RatingStars;
