import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Sparkles } from 'lucide-react';
import { showAPI } from '../../services/api';
import EmptyState from '../common/EmptyState';

const MuseumShows = ({ museumId }) => {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (museumId) {
      fetchShows();
    }
  }, [museumId]);

  const fetchShows = async () => {
    try {
      const res = await showAPI.getActiveShows(museumId);
      const data = res?.data ?? res ?? [];
      setShows(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load shows", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>
          <div className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (shows.length === 0) {
    return null; // Don't show the section if there are no active shows
  }

  return (
    <div>
      <div className="flex items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mr-3">Special Shows & Events</h2>
        <span className="bg-pink-100 text-pink-700 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider flex items-center">
          <Sparkles className="w-3 h-3 mr-1" /> Active
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {shows.map((show) => (
          <div key={show.id} className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/40 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            
            <h3 className="text-xl font-bold text-indigo-900 mb-2 relative z-10">{show.title}</h3>
            
            <p className="text-indigo-800/70 text-sm mb-4 relative z-10">{show.description}</p>
            
            <div className="flex flex-col space-y-2 text-sm font-medium text-indigo-900 relative z-10">
              <div className="flex items-center bg-white/60 px-3 py-1.5 rounded-lg w-fit backdrop-blur-sm">
                <Calendar className="w-4 h-4 mr-2 text-indigo-600" />
                {new Date(show.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
              <div className="flex items-center bg-white/60 px-3 py-1.5 rounded-lg w-fit backdrop-blur-sm">
                <Clock className="w-4 h-4 mr-2 text-indigo-600" />
                {new Date(show.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {' - '}
                {new Date(show.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-indigo-200/50 relative z-10 flex justify-between items-center">
              <span className="text-sm font-bold text-indigo-900">Included with entry ticket</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MuseumShows;
