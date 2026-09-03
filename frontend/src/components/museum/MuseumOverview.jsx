import React from 'react';

const MuseumOverview = ({ museum }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">About this museum</h2>
      
      {museum.tagline && (
        <p className="text-xl text-indigo-900 font-medium leading-relaxed mb-6 border-l-4 border-indigo-500 pl-4">
          {museum.tagline}
        </p>
      )}
      
      <div className="prose prose-lg prose-indigo max-w-none text-gray-600">
        {museum.description ? (
          // In a real app, you might want to use a markdown parser if the description supports markdown
          <div className="whitespace-pre-line leading-relaxed">
            {museum.description}
          </div>
        ) : (
          <p>This museum hasn't added a detailed description yet.</p>
        )}
      </div>
      
      {/* Highlights Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-100">
        {museum.establishedYear && (
          <div className="bg-white p-4 rounded-xl border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Established</p>
            <p className="font-bold text-gray-900">{museum.establishedYear}</p>
          </div>
        )}
        {museum.recommendedDurationMinutes && (
          <div className="bg-white p-4 rounded-xl border border-gray-100">
            <p className="text-sm text-gray-500 mb-1">Suggested Visit</p>
            <p className="font-bold text-gray-900">
              {Math.floor(museum.recommendedDurationMinutes / 60)}h {museum.recommendedDurationMinutes % 60}m
            </p>
          </div>
        )}
        <div className="bg-white p-4 rounded-xl border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Views</p>
          <p className="font-bold text-gray-900">{museum.publicViewCount || 0}</p>
        </div>
      </div>
    </div>
  );
};

export default MuseumOverview;
