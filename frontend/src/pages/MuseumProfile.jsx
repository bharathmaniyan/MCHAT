import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { publicAPI } from '../services/api';
import toast from 'react-hot-toast';

import MuseumHero from '../components/museum/MuseumHero';
import MuseumOverview from '../components/museum/MuseumOverview';
import MuseumGallery from '../components/museum/MuseumGallery';
import MuseumReviews from '../components/museum/MuseumReviews';
import MuseumShows from '../components/museum/MuseumShows';
import MuseumLocation from '../components/museum/MuseumLocation';
import MuseumVisitorInfo from '../components/museum/MuseumVisitorInfo';
import Skeleton from '../components/common/Skeleton';

const MuseumProfile = () => {
  const { slug } = useParams();
  const [museum, setMuseum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchProfile();
    // Track page view
    publicAPI.trackProfileView(slug).catch(console.error);
  }, [slug]);

  const fetchProfile = async () => {
    try {
      const data = await publicAPI.getMuseumProfile(slug);
      setMuseum(data);
    } catch (error) {
      toast.error('Failed to load museum profile');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'photos', label: 'Photos' },
    { id: 'visitor-info', label: 'Visitor Info' },
    { id: 'location', label: 'Location' },
    { id: 'shows', label: 'Shows & Events' },
    { id: 'reviews', label: 'Reviews' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <Skeleton className="h-96 w-full rounded-none" />
        <div className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <div className="flex gap-4">
              <Skeleton className="h-10 w-24 rounded-full" />
              <Skeleton className="h-10 w-24 rounded-full" />
            </div>
            <Skeleton className="h-40 w-full" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-80 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!museum) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 flex flex-col items-center justify-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Museum Not Found</h2>
        <p className="text-gray-500 mb-8">The museum you are looking for does not exist or has been removed.</p>
        <Link to="/" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Hero Section */}
      <MuseumHero museum={museum} />

      {/* Sticky Tab Navigation */}
      <div className="sticky top-16 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto hide-scrollbar">
            <nav className="flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    document.getElementById(tab.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-12">
            
            <section id="overview" className="scroll-mt-32">
              <MuseumOverview museum={museum} />
            </section>
            
            <section id="photos" className="scroll-mt-32">
              <MuseumGallery images={museum.galleryImages} />
            </section>
            
            <section id="visitor-info" className="scroll-mt-32">
              <MuseumVisitorInfo museum={museum} />
            </section>
            
            <section id="location" className="scroll-mt-32">
              <MuseumLocation museum={museum} />
            </section>
            
            <section id="shows" className="scroll-mt-32">
              <MuseumShows museumId={museum.id} />
            </section>
            
            <section id="reviews" className="scroll-mt-32">
              <MuseumReviews museumId={museum.id} slug={slug} initialRating={museum.averageRating} initialCount={museum.reviewCount} />
            </section>
            
          </div>
          
          {/* Right Column - Booking Sidebar */}
          <div className="lg:col-span-1 relative">
            <div className="sticky top-32 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Plan Your Visit</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <span className="text-gray-600">Adult Ticket</span>
                  <span className="font-bold text-gray-900">₹{museum.adultPrice || 0}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <span className="text-gray-600">Child Ticket</span>
                  <span className="font-bold text-gray-900">₹{museum.childPrice || 0}</span>
                </div>
              </div>
              
              {!museum.bookingStatus && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-medium mb-6">
                  Online booking is currently closed for this museum.
                </div>
              )}
              
              <Link
                to={`/museum/${museum.id}`}
                className={`w-full flex items-center justify-center px-6 py-4 rounded-xl font-bold text-lg transition-all ${
                  museum.bookingStatus
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-1'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed pointer-events-none'
                }`}
              >
                {museum.bookingStatus ? 'Book Tickets via Chatbot' : 'Booking Closed'}
              </Link>
              
              <p className="text-center text-xs text-gray-500 mt-4">
                Instant confirmation. No scanners required at entry.
              </p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default MuseumProfile;
