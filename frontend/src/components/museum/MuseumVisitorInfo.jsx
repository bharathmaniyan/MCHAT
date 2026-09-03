import React from 'react';
import { Phone, Mail, Globe, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const MuseumVisitorInfo = ({ museum }) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-8">Visitor Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          
          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Contact</h3>
            <ul className="space-y-4">
              {museum.publicPhone && (
                <li className="flex items-center text-gray-600">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mr-3 text-indigo-600">
                    <Phone className="w-5 h-5" />
                  </div>
                  {museum.publicPhone}
                </li>
              )}
              {museum.publicEmail && (
                <li className="flex items-center text-gray-600">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mr-3 text-indigo-600">
                    <Mail className="w-5 h-5" />
                  </div>
                  {museum.publicEmail}
                </li>
              )}
              {museum.websiteUrl && (
                <li className="flex items-center text-gray-600">
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center mr-3 text-indigo-600">
                    <Globe className="w-5 h-5" />
                  </div>
                  <a href={museum.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                    {museum.websiteUrl.replace(/^https?:\/\//, '')}
                  </a>
                </li>
              )}
              {!museum.publicPhone && !museum.publicEmail && !museum.websiteUrl && (
                <li className="text-gray-500">Contact information not provided.</li>
              )}
            </ul>
          </div>

          {/* Social Links */}
          {(museum.instagramUrl || museum.facebookUrl || museum.youtubeUrl) && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Social Media</h3>
              <div className="flex gap-3">
                {museum.instagramUrl && (
                  <a href={museum.instagramUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
                    Instagram
                  </a>
                )}
                {museum.facebookUrl && (
                  <a href={museum.facebookUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
                    Facebook
                  </a>
                )}
                {museum.youtubeUrl && (
                  <a href={museum.youtubeUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
                    YouTube
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Amenities */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Amenities & Features</h3>
            {museum.amenities && museum.amenities.length > 0 ? (
              <ul className="grid grid-cols-2 gap-3">
                {museum.amenities.map(amenity => (
                  <li key={amenity} className="flex items-center text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    <span className="capitalize">{amenity.replace('_', ' ').toLowerCase()}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No amenities listed.</p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          
          {/* Business Hours */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-indigo-600" />
              Opening Hours
            </h3>
            
            {museum.businessHours && museum.businessHours.length > 0 ? (
              <ul className="space-y-3">
                {museum.businessHours.map(bh => (
                  <li key={bh.dayOfWeek} className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-700">{days[bh.dayOfWeek]}</span>
                    {bh.isClosed ? (
                      <span className="text-red-500 font-medium">Closed</span>
                    ) : (
                      <span className="text-gray-600">{bh.openTime} - {bh.closeTime}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-2">Detailed hours not provided.</p>
                <p className="font-medium text-gray-900">
                  Standard Timing: {museum.openingTime || '9:00'} - {museum.closingTime || '17:00'}
                </p>
              </div>
            )}
          </div>

          {/* Guidelines */}
          {museum.visitorGuidelines && (
            <div className="bg-amber-50 rounded-2xl border border-amber-100 p-6">
              <h3 className="text-lg font-bold text-amber-900 mb-2 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-amber-600" />
                Visitor Guidelines
              </h3>
              <div className="text-sm text-amber-800 whitespace-pre-line leading-relaxed">
                {museum.visitorGuidelines}
              </div>
            </div>
          )}

          {/* Accessibility */}
          {museum.accessibilityNotes && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Accessibility Notes</h3>
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                {museum.accessibilityNotes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MuseumVisitorInfo;
