import React from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

const FilterPanel = ({ filters, onFilterChange, isOpen, onClose, className = '' }) => {
  const categories = ['ART', 'HISTORY', 'SCIENCE', 'HERITAGE', 'NATURAL_HISTORY', 'TECHNOLOGY', 'MILITARY', 'CHILDREN', 'GENERAL'];
  const amenitiesList = ['PARKING', 'WHEELCHAIR', 'WASHROOMS', 'CAFE', 'GIFT_SHOP', 'PHOTOGRAPHY_ALLOWED', 'GUIDED_TOURS', 'AUDIO_GUIDE'];

  const handleCategoryToggle = (category) => {
    onFilterChange({ 
      ...filters, 
      category: filters.category === category ? '' : category 
    });
  };

  const handleAmenityToggle = (amenity) => {
    const currentAmenities = filters.amenities || [];
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter(a => a !== amenity)
      : [...currentAmenities, amenity];
      
    onFilterChange({ ...filters, amenities: newAmenities });
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <h3 className="font-semibold text-gray-900 flex items-center">
          <SlidersHorizontal className="w-4 h-4 mr-2 text-indigo-600" />
          Filters
        </h3>
        {isOpen && onClose && (
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-md md:hidden">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>
      
      <div className="p-4 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Sort By */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Sort By</h4>
          <select 
            className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={filters.sortBy || ''}
            onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value })}
          >
            <option value="">Recommended</option>
            <option value="rating">Highest Rated</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name">Name: A to Z</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Category</h4>
          <div className="space-y-2">
            {categories.map(category => (
              <label key={category} className="flex items-center group cursor-pointer">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  checked={filters.category === category}
                  onChange={() => handleCategoryToggle(category)}
                />
                <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-900 capitalize">
                  {category.replace('_', ' ').toLowerCase()}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Quick Filters */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Filters</h4>
          <div className="space-y-2">
            <label className="flex items-center group cursor-pointer">
              <input 
                type="checkbox" 
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                checked={filters.openNow || false}
                onChange={(e) => onFilterChange({ ...filters, openNow: e.target.checked })}
              />
              <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-900">Open Now</span>
            </label>
            <label className="flex items-center group cursor-pointer">
              <input 
                type="checkbox" 
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                checked={filters.maxPrice === 0}
                onChange={(e) => onFilterChange({ ...filters, maxPrice: e.target.checked ? 0 : null })}
              />
              <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-900">Free Entry</span>
            </label>
            <label className="flex items-center group cursor-pointer">
              <input 
                type="checkbox" 
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                checked={filters.hasAccessibility || false}
                onChange={(e) => onFilterChange({ ...filters, hasAccessibility: e.target.checked })}
              />
              <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-900">Wheelchair Accessible</span>
            </label>
          </div>
        </div>

        {/* Amenities */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Amenities</h4>
          <div className="space-y-2">
            {amenitiesList.map(amenity => (
              <label key={amenity} className="flex items-center group cursor-pointer">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  checked={(filters.amenities || []).includes(amenity)}
                  onChange={() => handleAmenityToggle(amenity)}
                />
                <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-900 capitalize">
                  {amenity.replace('_', ' ').toLowerCase()}
                </span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Reset Button */}
        <div className="pt-4 border-t border-gray-100">
          <button 
            onClick={() => onFilterChange({})}
            className="w-full py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
