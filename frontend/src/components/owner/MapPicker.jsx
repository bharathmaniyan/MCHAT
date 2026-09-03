import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Search, Navigation, Crosshair, Loader2, CheckCircle2 } from 'lucide-react';
import { locationAPI } from '../../services/api';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon path issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle clicks on map
const MapEvents = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Component to programmatically change center and zoom
const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || map.getZoom(), { animate: true });
    }
  }, [center, zoom, map]);
  return null;
};

const MapPicker = ({ initialLat, initialLng, onLocationSelect }) => {
  const defaultCenter = [20.5937, 78.9629]; // Default India
  const hasInitial = !!(initialLat && initialLng);

  const [position, setPosition] = useState(
    hasInitial ? [initialLat, initialLng] : defaultCenter
  );
  const [zoomLevel, setZoomLevel] = useState(hasInitial ? 15 : 5);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationDetails, setLocationDetails] = useState(null);
  const [geoStatus, setGeoStatus] = useState(null); // 'loading' | 'success' | 'error'
  const [geoMessage, setGeoMessage] = useState('');

  const searchTimeoutRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search using backend proxy
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      setNoResults(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      setNoResults(false);
      try {
        const response = await locationAPI.search(searchQuery);
        const results = response.data || [];
        setSuggestions(results);
        setShowSuggestions(true);
        setNoResults(results.length === 0);
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
        setShowSuggestions(true);
        setNoResults(true);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchQuery]);

  // Reverse geocode using backend proxy
  const reverseGeocode = useCallback(async (lat, lon, zoomIn = false) => {
    try {
      const response = await locationAPI.reverseGeocode(lat, lon);
      const data = response.data || {};

      const locData = {
        latitude: lat,
        longitude: lon,
        address: data.displayName || '',
        city: data.city || '',
        state: data.state || '',
        pincode: data.pincode || '',
        placeName: data.name || '',
        landmark: data.name || '',
      };

      setLocationDetails(locData);
      onLocationSelect(locData);
      setPosition([lat, lon]);
      if (zoomIn) setZoomLevel(16);
    } catch (error) {
      console.error('Reverse geocode error:', error);
      // Fallback - just set coordinates
      const locData = {
        latitude: lat, longitude: lon,
        address: '', city: '', state: '', pincode: '', placeName: '', landmark: '',
      };
      setLocationDetails(locData);
      onLocationSelect(locData);
      setPosition([lat, lon]);
      if (zoomIn) setZoomLevel(16);
    }
  }, [onLocationSelect]);

  // Handle suggestion selection
  // Uses Mapbox data only temporarily for selection (lat/lng + display name).
  // Calls reverseGeocode (Nominatim / open data) to get the address info we permanently store.
  const handleSuggestionSelect = (suggestion) => {
    const lat = suggestion.latitude;
    const lon = suggestion.longitude;

    setSearchQuery(suggestion.name || suggestion.displayName?.split(',')[0] || '');
    setShowSuggestions(false);
    setNoResults(false);

    // Move the map immediately for responsiveness
    setPosition([lat, lon]);
    setZoomLevel(16);

    // Reverse-geocode via backend (Nominatim) to get open-data address for permanent storage
    reverseGeocode(lat, lon, false);
  };

  // Get current location via browser GPS
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('error');
      setGeoMessage('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setGeoStatus('loading');
    setGeoMessage('Finding your location…');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setGeoStatus('success');
        setGeoMessage('Location set to your current position.');
        const { latitude, longitude } = pos.coords;
        reverseGeocode(latitude, longitude, true);

        // Clear success message after 4 seconds
        setTimeout(() => setGeoStatus(null), 4000);
      },
      (err) => {
        setIsLocating(false);
        setGeoStatus('error');
        if (err.code === 1) {
          setGeoMessage('Location permission was denied. Search for a place or pick a point on the map instead.');
        } else if (err.code === 2) {
          setGeoMessage("We couldn't determine your location. Please try again or select it on the map.");
        } else {
          setGeoMessage("Location request timed out. Please try again or select it on the map.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Map click handler
  const handleMapClick = (lat, lng) => {
    reverseGeocode(lat, lng);
  };

  // Pin drag handler
  const markerRef = useRef(null);
  const handleDragEnd = () => {
    const marker = markerRef.current;
    if (marker != null) {
      const pos = marker.getLatLng();
      reverseGeocode(pos.lat, pos.lng);
    }
  };

  // Recenter map on the pin
  const handleRecenter = () => {
    if (position[0] && position[1]) {
      setZoomLevel(16);
      setPosition([...position]);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── 1. Place Search ── */}
      <div className="relative" ref={searchContainerRef}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Search for museum, landmark, area or place
        </label>
        <div className="relative flex items-center">
          <Search className="absolute left-3 text-gray-400 w-5 h-5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0 || noResults) setShowSuggestions(true);
            }}
            placeholder="Search e.g. Museum of Madurai, Gandhi Museum…"
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm"
            aria-label="Search for museum, landmark, area or place"
            role="combobox"
            aria-expanded={showSuggestions}
            aria-autocomplete="list"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 w-5 h-5 text-indigo-500 animate-spin" />
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {showSuggestions && (
          <div
            className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-y-auto"
            role="listbox"
          >
            {suggestions.length > 0 ? (
              suggestions.map((suggestion, idx) => {
                const mainText = suggestion.name || suggestion.displayName?.split(',')[0] || '';
                const subText = suggestion.displayName || '';
                return (
                  <div
                    key={idx}
                    className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                    onClick={() => handleSuggestionSelect(suggestion)}
                    role="option"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleSuggestionSelect(suggestion)}
                  >
                    <p className="font-semibold text-gray-800 truncate">{mainText}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{subText}</p>
                  </div>
                );
              })
            ) : noResults ? (
              <div className="px-4 py-4 text-center">
                <p className="text-sm text-gray-500 mb-2">
                  Can't find the place? Use your current location or select it manually on the map.
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* ── 2. Use Current Location ── */}
      <button
        type="button"
        onClick={handleCurrentLocation}
        disabled={isLocating}
        className="w-full flex items-center justify-center py-2.5 px-4 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl font-medium transition-colors disabled:opacity-70"
      >
        {isLocating ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Finding your location…
          </>
        ) : (
          <>
            <Navigation className="w-5 h-5 mr-2" />
            📍 Use My Current Location
          </>
        )}
      </button>

      {/* Geolocation Status Message */}
      {geoStatus && geoStatus !== 'loading' && (
        <div
          className={`text-sm px-4 py-2 rounded-lg ${
            geoStatus === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {geoMessage}
        </div>
      )}

      {/* ── Selected Location Card ── */}
      {locationDetails && locationDetails.latitude && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start">
          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="min-w-0">
            <h4 className="font-semibold text-green-900 truncate">
              {locationDetails.placeName || 'Selected Location'}
            </h4>
            <p className="text-sm text-green-800 mt-1 line-clamp-2">{locationDetails.address}</p>
            {(locationDetails.city || locationDetails.state || locationDetails.pincode) && (
              <p className="text-xs text-green-700 mt-1">
                {[locationDetails.city, locationDetails.state, locationDetails.pincode].filter(Boolean).join(', ')}
              </p>
            )}
            <div className="flex gap-4 mt-2 text-xs text-green-700 font-mono">
              <span>Lat: {locationDetails.latitude.toFixed(6)}</span>
              <span>Lng: {locationDetails.longitude.toFixed(6)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Pick on Map ── */}
      <div>
        <p className="text-sm text-gray-500 flex items-center mb-2">
          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
          Or choose the exact location on the map.
        </p>
        <div className="relative h-[400px] w-full rounded-xl overflow-hidden border border-gray-200 z-0 shadow-inner">
          <MapContainer
            center={position}
            zoom={zoomLevel}
            className="h-full w-full z-0"
          >
            <ChangeView center={position} zoom={zoomLevel} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapEvents onMapClick={handleMapClick} />
            <Marker
              position={position}
              draggable={true}
              eventHandlers={{ dragend: handleDragEnd }}
              ref={markerRef}
            />
          </MapContainer>

          {/* Recenter Button */}
          <button
            type="button"
            onClick={handleRecenter}
            className="absolute bottom-4 right-4 z-[400] bg-white p-2 rounded-full shadow-md border border-gray-200 hover:bg-gray-50 text-gray-700"
            title="Recenter Map"
          >
            <Crosshair className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapPicker;
