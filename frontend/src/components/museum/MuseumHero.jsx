import React, { useState, useEffect } from 'react';
import { MapPin, Image as ImageIcon } from 'lucide-react';
import RatingStars from '../common/RatingStars';

const MuseumHero = ({ museum }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Compile all unique cover images
  const allImages = [];
  if (museum.coverImages && museum.coverImages.length > 0) {
    museum.coverImages.forEach(img => {
      if (!allImages.includes(img.imageUrl)) {
        allImages.push(img.imageUrl);
      }
    });
  } else if (museum.coverImageUrl) {
    allImages.push(museum.coverImageUrl);
  }
  
  // Fallback if absolutely no images exist
  if (allImages.length === 0) {
    allImages.push('https://images.unsplash.com/photo-1518998053401-a4141508db8c?auto=format&fit=crop&q=80&w=2000');
  }

  // Automatic slideshow effect
  useEffect(() => {
    if (allImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % allImages.length);
    }, 5000); // 5 second shift
    return () => clearInterval(timer);
  }, [allImages.length]);

  return (
    <div className="relative bg-black">
      {/* Cover Image Slideshow */}
      <div className="h-[40vh] md:h-[50vh] lg:h-[60vh] w-full relative overflow-hidden bg-black">
        {allImages.map((src, idx) => (
          <img 
            key={src}
            src={src} 
            alt={`${museum.museumName} Preview ${idx + 1}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
              idx === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
      </div>
      
      {/* Content Overlay */}
      <div className="absolute bottom-0 left-0 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 md:pb-12">
          
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {museum.category && (
              <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-md uppercase tracking-wider">
                {museum.category.replace('_', ' ')}
              </span>
            )}
            {!museum.bookingStatus && (
              <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-md uppercase tracking-wider">
                Closed Today
              </span>
            )}
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 leading-tight">
            {museum.museumName}
          </h1>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-white/90">
            <div className="flex items-center text-lg">
              <MapPin className="w-5 h-5 mr-1 text-indigo-400" />
              {museum.city && museum.state ? `${museum.city}, ${museum.state}` : (museum.location || 'Location TBA')}
            </div>
            
            <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-white/30"></div>
            
            <RatingStars rating={museum.averageRating || 0} count={museum.reviewCount || 0} size={18} />
          </div>
        </div>
      </div>
      
      {/* View Photos Button */}
      {museum.galleryImages && museum.galleryImages.length > 0 && (
        <button 
          onClick={() => {
            document.getElementById('photos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className="absolute bottom-8 right-8 hidden md:flex items-center bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <ImageIcon className="w-4 h-4 mr-2" />
          View Photos ({museum.galleryImages.length})
        </button>
      )}
    </div>
  );
};

export default MuseumHero;
