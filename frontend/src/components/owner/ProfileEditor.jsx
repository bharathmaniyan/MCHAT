import React, { useState, useEffect } from 'react';
import { ownerAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Save, Loader } from 'lucide-react';
import MapPicker from './MapPicker';
import BusinessHoursEditor from './BusinessHoursEditor';

const ProfileEditor = ({ profile, onUpdate }) => {
  const [formData, setFormData] = useState({
    museumName: '',
    email: '',
    phone: '',
    slug: '',
    tagline: '',
    description: '',
    establishedYear: '',
    recommendedDurationMinutes: '',
    adultPrice: 0,
    childPrice: 0,
    bookingStatus: true,
    
    // Location
    address: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    latitude: '',
    longitude: '',
    
    // Contact & Public Info
    publicPhone: '',
    publicEmail: '',
    websiteUrl: '',
    instagramUrl: '',
    facebookUrl: '',
    
    // Visitor Info
    visitorGuidelines: '',
    accessibilityNotes: '',
    
    // Enums
    category: 'GENERAL',
  });
  
  const [amenities, setAmenities] = useState([]);
  const [businessHours, setBusinessHours] = useState([]);
  const [saving, setSaving] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Initialize form
  useEffect(() => {
    if (profile && !initialLoaded) {
      setFormData({
        museumName: profile.museumName || '',
        email: profile.email || '',
        phone: profile.phone || '',
        slug: profile.slug || '',
        tagline: profile.tagline || '',
        description: profile.description || '',
        establishedYear: profile.establishedYear || '',
        recommendedDurationMinutes: profile.recommendedDurationMinutes || '',
        adultPrice: profile.adultPrice ?? profile.adultTicketPrice ?? 0,
        childPrice: profile.childPrice ?? profile.childTicketPrice ?? 0,
        bookingStatus: profile.bookingStatus ?? true,
        
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        pincode: profile.pincode || '',
        landmark: profile.landmark || '',
        latitude: profile.latitude || '',
        longitude: profile.longitude || '',
        
        publicPhone: profile.publicPhone || '',
        publicEmail: profile.publicEmail || '',
        websiteUrl: profile.websiteUrl || '',
        instagramUrl: profile.instagramUrl || '',
        facebookUrl: profile.facebookUrl || '',
        
        visitorGuidelines: profile.visitorGuidelines || '',
        accessibilityNotes: profile.accessibilityNotes || '',
        category: profile.category || 'GENERAL',
      });
      setAmenities(profile.amenities || []);
      setBusinessHours(profile.businessHours || []);
      setInitialLoaded(true);
    }
  }, [profile, initialLoaded]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLocationSelect = (locData) => {
    if (!locData) return;
    setFormData(prev => ({
      ...prev,
      latitude: locData.latitude,
      longitude: locData.longitude,
      ...(locData.address && { address: locData.address }),
      ...(locData.city && { city: locData.city }),
      ...(locData.state && { state: locData.state }),
      ...(locData.pincode && { pincode: locData.pincode }),
      ...(locData.landmark && { landmark: locData.landmark }),
    }));
  };

  const toggleAmenity = (amenity) => {
    setAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const payload = {
        ...formData,
        amenities,
        businessHours
      };
      
      await ownerAPI.updateProfile(payload);
      toast.success('Profile updated successfully!');
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const categories = ['ART', 'HISTORY', 'SCIENCE', 'HERITAGE', 'NATURAL_HISTORY', 'TECHNOLOGY', 'MILITARY', 'CHILDREN', 'GENERAL'];
  const allAmenities = ['PARKING', 'WHEELCHAIR', 'WASHROOMS', 'CAFE', 'GIFT_SHOP', 'PHOTOGRAPHY_ALLOWED', 'GUIDED_TOURS', 'AUDIO_GUIDE'];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header Actions */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm sticky top-0 z-10">
        <h2 className="text-xl font-bold text-gray-900">Museum Profile</h2>
        <button
          type="submit"
          disabled={saving || !formData.latitude || !formData.longitude}
          className="flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          title={(!formData.latitude || !formData.longitude) ? "Please select a location on the map first" : ""}
        >
          {saving ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Basic Info */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Museum Name *</label>
            <input type="text" name="museumName" required value={formData.museumName} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Custom URL Slug</label>
            <div className="flex items-center">
              <span className="bg-gray-100 text-gray-500 px-3 py-2.5 border border-r-0 border-gray-300 rounded-l-lg text-sm">museumqr.com/</span>
              <input type="text" name="slug" value={formData.slug} onChange={handleChange} placeholder="e.g. louvre-paris" className="flex-1 rounded-r-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
          <input type="text" name="tagline" value={formData.tagline} onChange={handleChange} placeholder="A short, catchy phrase about your museum" className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Description</label>
          <textarea name="description" rows={5} value={formData.description} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border resize-none"></textarea>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select name="category" value={formData.category} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border bg-white">
              {categories.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Established Year</label>
            <input type="number" name="establishedYear" value={formData.establishedYear} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Suggested Visit Time (mins)</label>
            <input type="number" name="recommendedDurationMinutes" value={formData.recommendedDurationMinutes} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" />
          </div>
        </div>
      </div>

      {/* Ticketing & Status */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Ticketing & Status</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adult Ticket Price (₹)</label>
            <input type="number" name="adultPrice" min="0" required value={formData.adultPrice} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Child Ticket Price (₹)</label>
            <input type="number" name="childPrice" min="0" required value={formData.childPrice} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" />
          </div>
        </div>

        <div className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-200">
          <input
            type="checkbox"
            id="bookingStatus"
            name="bookingStatus"
            checked={formData.bookingStatus}
            onChange={handleChange}
            className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="bookingStatus" className="ml-3 block text-sm font-medium text-gray-900">
            Accept Online Bookings Currently
            <p className="text-gray-500 font-normal mt-0.5">Uncheck this if the museum is temporarily closed or full.</p>
          </label>
        </div>
      </div>

      {/* Location */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Location & Map</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input type="text" name="state" value={formData.state} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
            <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Landmark</label>
            <input type="text" name="landmark" value={formData.landmark} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" />
          </div>
        </div>

        <div className="pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">Pinpoint Location on Map</label>
          <MapPicker 
            initialLat={formData.latitude} 
            initialLng={formData.longitude} 
            onLocationSelect={handleLocationSelect} 
          />
        </div>
      </div>

      {/* Business Hours */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
        <BusinessHoursEditor 
          businessHours={businessHours} 
          onChange={setBusinessHours} 
        />
      </div>

      {/* Amenities & Contact */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Amenities</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {allAmenities.map(amenity => (
            <label key={amenity} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={amenities.includes(amenity)}
                onChange={() => toggleAmenity(amenity)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="ml-3 text-sm font-medium text-gray-700 capitalize">
                {amenity.replace('_', ' ').toLowerCase()}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Public Contact Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Public Phone</label>
            <input type="text" name="publicPhone" value={formData.publicPhone} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Public Email</label>
            <input type="email" name="publicEmail" value={formData.publicEmail} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
            <input type="url" name="websiteUrl" value={formData.websiteUrl} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
            <input type="url" name="instagramUrl" value={formData.instagramUrl} onChange={handleChange} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2.5 border" />
          </div>
        </div>
      </div>

    </form>
  );
};

export default ProfileEditor;
