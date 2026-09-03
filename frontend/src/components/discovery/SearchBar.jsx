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
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto -mt-8 relative z-10">
      <div className="bg-white rounded-2xl shadow-xl p-2 flex flex-col md:flex-row items-center gap-2 border border-gray-100">
        
        {/* Main Search Input */}
        <div className="flex-1 w-full flex items-center px-4 py-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-opacity-20">
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
        <div className="flex-1 w-full md:max-w-[240px] flex items-center px-4 py-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-opacity-20">
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
          className="w-full md:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors whitespace-nowrap"
        >
          Search
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
