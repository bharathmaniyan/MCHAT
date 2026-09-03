import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

const MuseumGallery = ({ images = [] }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Photos</h2>
        <p className="text-gray-500 italic">No photos available for this museum yet.</p>
      </div>
    );
  }

  const openLightbox = (index) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = 'auto';
  };

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Determine grid layout based on image count
  const getGridClasses = (index, total) => {
    if (total === 1) return 'col-span-2 md:col-span-4 row-span-2 aspect-[16/9]';
    if (total === 2) return 'col-span-1 md:col-span-2 row-span-2 aspect-[4/3]';
    if (total === 3) {
      if (index === 0) return 'col-span-2 md:col-span-2 row-span-2 aspect-[4/3]';
      return 'col-span-1 md:col-span-2 row-span-1 aspect-[4/3]';
    }
    // 4 or more
    if (index === 0) return 'col-span-2 md:col-span-2 row-span-2 aspect-[4/3] md:aspect-auto';
    if (index > 4) return 'hidden';
    return 'col-span-1 md:col-span-1 row-span-1 aspect-square';
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Photos</h2>
      
      {/* Collage Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 auto-rows-fr h-[400px] md:h-[500px]">
        {images.map((img, index) => {
          if (index > 4) return null; // Only show up to 5 images in grid
          
          const isLastVisible = index === 4 && images.length > 5;
          
          return (
            <div 
              key={img.id} 
              className={`relative rounded-xl overflow-hidden cursor-pointer group ${getGridClasses(index, images.length)}`}
              onClick={() => openLightbox(index)}
            >
              <img 
                src={img.imageUrl} 
                alt={img.caption || `Museum Photo ${index + 1}`} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              
              {/* Overlay for hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
              </div>
              
              {/* "See All" overlay for last image */}
              {isLastVisible && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                  <span className="text-2xl font-bold">+{images.length - 5}</span>
                  <span className="text-sm font-medium">View All</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center backdrop-blur-sm" onClick={closeLightbox}>
          <button 
            className="absolute top-6 right-6 p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors z-50"
            onClick={closeLightbox}
          >
            <X className="w-8 h-8" />
          </button>

          {images.length > 1 && (
            <button 
              className="absolute left-4 md:left-8 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50"
              onClick={prevImage}
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          <div className="max-w-6xl max-h-[90vh] w-full px-4 md:px-24 flex flex-col items-center justify-center relative" onClick={e => e.stopPropagation()}>
            <img 
              src={images[currentIndex].imageUrl} 
              alt={images[currentIndex].caption || `Photo ${currentIndex + 1}`} 
              className="max-w-full max-h-[80vh] object-contain select-none"
            />
            {images[currentIndex].caption && (
              <p className="text-white/90 text-center mt-4 text-lg bg-black/50 px-6 py-2 rounded-full">
                {images[currentIndex].caption}
              </p>
            )}
            <div className="absolute bottom-[-2rem] text-white/50 text-sm font-medium">
              {currentIndex + 1} / {images.length}
            </div>
          </div>

          {images.length > 1 && (
            <button 
              className="absolute right-4 md:right-8 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50"
              onClick={nextImage}
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MuseumGallery;
