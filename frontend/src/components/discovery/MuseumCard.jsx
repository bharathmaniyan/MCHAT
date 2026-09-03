import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, IndianRupee } from 'lucide-react';
import RatingStars from '../common/RatingStars';

const MuseumCard = ({ museum }) => {
  const imageUrl = museum.displayImageUrl || museum.coverImageUrl || 'https://images.unsplash.com/photo-1518998053401-a4141508db8c?auto=format&fit=crop&q=80&w=800';
  
  return (
    <Link 
      to={`/museums/${museum.slug || museum.id}`}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img 
          src={imageUrl} 
          alt={museum.museumName}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {museum.category && (
            <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-900 rounded-full">
              {museum.category}
            </span>
          )}
        </div>
        
        {/* Bottom Info overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{museum.museumName}</h3>
          <div className="flex items-center text-white/90 text-sm">
            <MapPin className="w-3.5 h-3.5 mr-1" />
            <span className="truncate">{museum.city || museum.location || 'Location TBA'}</span>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-3">
          <RatingStars rating={museum.averageRating || 0} count={museum.reviewCount || 0} size={14} />
          
          <div className="flex items-center font-semibold text-indigo-600">
            <IndianRupee className="w-4 h-4 mr-0.5" />
            {museum.adultPrice ? museum.adultPrice : 'Free'}
          </div>
        </div>
        
        <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-grow">
          {museum.tagline || 'Experience the wonders of history, art, and culture.'}
        </p>
        
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center">
            <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
            {museum.openingTime && museum.closingTime 
              ? `${museum.openingTime} - ${museum.closingTime}`
              : 'Check timings'}
          </div>
          
          <span className={`px-2 py-1 rounded-md font-medium ${museum.bookingStatus ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {museum.bookingStatus ? 'Open Today' : 'Closed'}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default MuseumCard;
