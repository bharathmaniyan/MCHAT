import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Building2, Star, MapIcon, Grid, List as ListIcon, Filter } from 'lucide-react';
import { publicAPI } from '../services/api';
import toast from 'react-hot-toast';

import SearchBar from '../components/discovery/SearchBar';
import FilterPanel from '../components/discovery/FilterPanel';
import MuseumCard from '../components/discovery/MuseumCard';
import MapView from '../components/discovery/MapView';
import CuratedSection from '../components/discovery/CuratedSection';
import EmptyState from '../components/common/EmptyState';
import Skeleton from '../components/common/Skeleton';

const Home = () => {
  const [museums, setMuseums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({ query: '', location: '' });
  const [filters, setFilters] = useState({});
  const [viewMode, setViewMode] = useState('grid'); // grid, map
  const [isFilterOpen, setIsFilterOpen] = useState(false);


  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fetchMuseums = useCallback(async () => {
    setLoading(true);
    try {
      // In a real app, we would pass searchParams and filters to the API
      const res = await publicAPI.searchMuseums();
      let list = res?.data ?? res ?? [];
      list = Array.isArray(list) ? list : [];
      
      // Client-side filtering for MVP
      if (searchParams.query) {
        const q = searchParams.query.toLowerCase();
        list = list.filter(m => m.museumName?.toLowerCase().includes(q) || m.tagline?.toLowerCase().includes(q));
      }
      if (searchParams.location) {
        const loc = searchParams.location.toLowerCase();
        list = list.filter(m => m.city?.toLowerCase().includes(loc) || m.location?.toLowerCase().includes(loc));
      }
      if (filters.category) {
        list = list.filter(m => m.category === filters.category);
      }
      if (filters.openNow) {
        list = list.filter(m => m.bookingStatus === true);
      }
      if (filters.maxPrice === 0) {
        list = list.filter(m => (m.adultPrice === 0 || m.adultPrice == null) && (m.childPrice === 0 || m.childPrice == null));
      }
      
      setMuseums(list);
    } catch {
      toast.error('Failed to fetch museums');
      setMuseums([]);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [searchParams, filters]);

  useEffect(() => {
    fetchMuseums();
  }, [fetchMuseums]);

  const handleSearch = useCallback((params) => {
    setSearchParams(params);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── HERO ── */}
      <div className="relative pt-24 pb-32 flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518998053401-a4141508db8c?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white/90 mb-8 border border-white/20">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-medium">Discover the world's finest collections</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight">
            Explore Culture & History
          </h1>

          <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto font-light">
            Book instant tickets to museums, galleries, and heritage sites. Skip the line and dive into discovery.
          </p>
        </div>
      </div>

      {/* ── SEARCH BAR ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Curated Sections (Only show if no search/filters active) */}
        {!searchParams.query && !searchParams.location && Object.keys(filters).length === 0 && (
          <div className="mb-16">
            <CuratedSection 
              title="Popular Destinations" 
              subtitle="Most visited museums this week"
              museums={museums.filter(m => m.averageRating >= 4.0 || m.bookingStatus)} 
              isLoading={isInitialLoad}
            />
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">All Museums</h2>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
          </div>

          {/* Filter Sidebar */}
          <div className={`lg:w-1/4 ${isFilterOpen ? 'block' : 'hidden'} lg:block`}>
            <div className="sticky top-24">
              <FilterPanel 
                filters={filters} 
                onFilterChange={setFilters} 
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
              />
            </div>
          </div>

          {/* Results Area */}
          <div className="lg:w-3/4 flex flex-col">
            {/* View Controls */}
            <div className="hidden lg:flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {searchParams.query || searchParams.location ? 'Search Results' : 'Explore'}
                </h2>
                <p className="text-gray-500 text-sm mt-1">Showing {museums.length} museums</p>
              </div>
              
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md flex items-center transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                  title="Grid View"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('map')}
                  className={`p-2 rounded-md flex items-center transition-colors ${viewMode === 'map' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                  title="Map View"
                >
                  <MapIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            {isInitialLoad ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 h-[380px] flex flex-col">
                    <Skeleton className="h-48 w-full rounded-xl mb-4" />
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6 mb-4" />
                    <div className="mt-auto flex justify-between">
                      <Skeleton className="h-8 w-1/3" />
                      <Skeleton className="h-8 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : museums.length === 0 ? (
              <EmptyState 
                title="No museums found" 
                message="Try adjusting your search or filters to find what you're looking for."
                action={
                  <button onClick={() => { setSearchParams({query: '', location: ''}); setFilters({}); }} className="text-indigo-600 font-medium hover:text-indigo-800">
                    Clear all filters
                  </button>
                }
              />
            ) : viewMode === 'map' ? (
              <MapView museums={museums} />
            ) : (
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-300 ${loading ? 'opacity-60' : 'opacity-100'}`}>
                {museums.map(museum => (
                  <MuseumCard key={museum.id} museum={museum} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* ── HOW IT WORKS (USER GUIDE) ── */}
      <div className="bg-white py-24 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">How MuseumQR Works</h2>
            <p className="text-lg text-gray-600">
              A seamless experience for both culture enthusiasts and museum curators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24 items-start">
            {/* For Visitors */}
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-50 rounded-3xl transform rotate-1 scale-105 -z-10"></div>
              <div className="bg-white rounded-3xl p-8 border border-indigo-100 shadow-sm relative z-10">
                <div className="inline-flex items-center justify-center p-3 bg-indigo-100 text-indigo-700 rounded-xl mb-6">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">For Visitors</h3>
                <ul className="space-y-6">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm mt-0.5">1</div>
                    <div className="ml-4">
                      <h4 className="text-lg font-bold text-gray-900">Discover & Browse</h4>
                      <p className="mt-1 text-gray-600">Search for museums, read reviews, and explore curated collections on our interactive map.</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm mt-0.5">2</div>
                    <div className="ml-4">
                      <h4 className="text-lg font-bold text-gray-900">Book via Chatbot</h4>
                      <p className="mt-1 text-gray-600">Click to book and chat with our smart assistant to select tickets and apply instant payments.</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm mt-0.5">3</div>
                    <div className="ml-4">
                      <h4 className="text-lg font-bold text-gray-900">Scan & Enter</h4>
                      <p className="mt-1 text-gray-600">Show your digital ticket at the entrance. The staff will verify your code in seconds. Skip the line!</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* For Owners */}
            <div className="relative">
              <div className="absolute inset-0 bg-purple-50 rounded-3xl transform -rotate-1 scale-105 -z-10"></div>
              <div className="bg-white rounded-3xl p-8 border border-purple-100 shadow-sm relative z-10">
                <div className="inline-flex items-center justify-center p-3 bg-purple-100 text-purple-700 rounded-xl mb-6">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">For Museum Owners</h3>
                <ul className="space-y-6">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-sm mt-0.5">1</div>
                    <div className="ml-4">
                      <h4 className="text-lg font-bold text-gray-900">Register & Customize</h4>
                      <p className="mt-1 text-gray-600">Create a stunning profile, upload gallery images, and set your ticket pricing instantly.</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-sm mt-0.5">2</div>
                    <div className="ml-4">
                      <h4 className="text-lg font-bold text-gray-900">Print Your QR Code</h4>
                      <p className="mt-1 text-gray-600">Download your unique QR code from the dashboard and place it at your entrance for walk-ins.</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-sm mt-0.5">3</div>
                    <div className="ml-4">
                      <h4 className="text-lg font-bold text-gray-900">Live Analytics</h4>
                      <p className="mt-1 text-gray-600">Watch bookings and revenue flow into your dashboard in real-time, and manage visitor reviews.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA SECTION ── */}
      <div className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-purple-900"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1574360773958-69cb50730bd0?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <Building2 className="w-16 h-16 text-indigo-300 mx-auto mb-6 drop-shadow-lg" />
          <h2 className="text-4xl font-extrabold text-white mb-6">Digitize Your Museum Today</h2>
          <p className="text-xl text-indigo-200 mb-10 max-w-2xl mx-auto font-light">
            Join hundreds of heritage sites offering instant QR ticketing. Setup takes less than 5 minutes and gives you a beautiful public profile.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register-museum" className="w-full sm:w-auto px-8 py-4 bg-white text-indigo-900 font-extrabold rounded-2xl hover:bg-gray-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 text-lg">
              Register Your Museum
            </Link>
            <Link to="/admin-login" className="w-full sm:w-auto px-8 py-4 bg-indigo-800/50 text-white font-bold rounded-2xl hover:bg-indigo-800 transition-all border border-indigo-400/30 text-lg backdrop-blur-sm">
              Owner Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
