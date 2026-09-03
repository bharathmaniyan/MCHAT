import React, { useState, useEffect } from 'react';
import { Search, MapPin } from 'lucide-react';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch({ query, location });
    }, 400);

    return () => clearTimeout(timer);
  }, [query, location, onSearch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch({ query, location });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-5xl mx-auto -mt-10 relative z-10">
      <div className="bg-white/95 backdrop-blur-xl rounded-[1.35rem] shadow-[0_20px_55px_rgba(28,25,23,0.18)] p-3 sm:p-4 border border-white">
        <div className="flex items-center justify-between px-2 pb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">
          <span>Plan your next visit</span>
          <span className="hidden sm:block text-indigo-600">Tickets ready at the door</span>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-2">
        
        {/* Main Search Input */}
        <div className="flex-1 w-full flex items-center px-4 py-3 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-opacity-20">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input 
            type="text" 
            placeholder="Search museums, categories, or exhibits..."
            className="w-full bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400 p-1"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Location Input */}
        <div className="flex-1 w-full md:max-w-[240px] flex items-center px-4 py-3 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-opacity-20">
          <MapPin className="w-5 h-5 text-gray-400 mr-3" />
          <input 
            type="text" 
            placeholder="Any location"
            className="w-full bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400 p-1"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        {/* Search Button */}
        <button 
          type="submit"
          className="w-full md:w-auto px-8 py-3.5 bg-stone-900 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors whitespace-nowrap shadow-md"
        >
          Search
        </button>
        </div>
      </div>
    </form>
  );
};

export default SearchBar;
