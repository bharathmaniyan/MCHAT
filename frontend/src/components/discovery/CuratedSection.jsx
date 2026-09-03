import React from 'react';
import MuseumCard from './MuseumCard';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const CuratedSection = ({ title, subtitle, museums = [], viewAllLink, isLoading = false }) => {
  if (!isLoading && (!museums || museums.length === 0)) {
    return null;
  }

  return (
    <section className="py-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {viewAllLink && (
          <Link 
            to={viewAllLink} 
            className="hidden sm:flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            View all <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading
          ? [...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl p-4 border border-gray-100 h-80 flex flex-col">
                <div className="bg-gray-200 rounded-xl h-40 w-full mb-4"></div>
                <div className="bg-gray-200 h-4 w-3/4 rounded mb-2"></div>
                <div className="bg-gray-200 h-3 w-1/2 rounded mb-4"></div>
                <div className="mt-auto flex justify-between">
                  <div className="bg-gray-200 h-3 w-1/4 rounded"></div>
                  <div className="bg-gray-200 h-3 w-1/4 rounded"></div>
                </div>
              </div>
            ))
          : museums.slice(0, 4).map((museum) => (
              <MuseumCard key={museum.id} museum={museum} />
            ))
        }
      </div>
      
      {viewAllLink && (
        <div className="mt-6 text-center sm:hidden">
          <Link 
            to={viewAllLink} 
            className="inline-flex items-center justify-center w-full px-4 py-2 bg-indigo-50 text-indigo-600 font-medium rounded-xl hover:bg-indigo-100 transition-colors"
          >
            View all {title}
          </Link>
        </div>
      )}
    </section>
  );
};

export default CuratedSection;
