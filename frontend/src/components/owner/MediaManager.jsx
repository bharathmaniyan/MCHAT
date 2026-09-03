import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Image as ImageIcon, UploadCloud, X, Trash2, CheckCircle2 } from 'lucide-react';
import { ownerAPI } from '../../services/api';
import toast from 'react-hot-toast';

const MediaManager = ({ images = [], onUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('GALLERY'); // COVER, DISPLAY, GALLERY

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    setUploading(true);
    let successCount = 0;
    
    try {
      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('imageType', activeTab);
        
        await ownerAPI.uploadImage(formData);
        successCount++;
      }
      
      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} image(s)`);
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      toast.error('Failed to upload some images');
    } finally {
      setUploading(false);
    }
  }, [activeTab, onUpdate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: { 'image/*': [] },
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    
    try {
      await ownerAPI.deleteImage(id);
      toast.success('Image deleted');
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Failed to delete image');
    }
  };

  const filteredImages = images.filter(img => img.imageType === activeTab);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <ImageIcon className="w-5 h-5 mr-2 text-indigo-600" />
          Media Management
        </h3>
      </div>
      
      <div className="p-6">
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl mb-6 max-w-md">
          {['GALLERY', 'COVER', 'DISPLAY'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Info text */}
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            {activeTab === 'COVER' && 'Cover image is the large hero image at the top of your profile. High resolution landscape (16:9) recommended.'}
            {activeTab === 'DISPLAY' && 'Display image is used as the thumbnail in search results. Square or 4:3 aspect ratio recommended.'}
            {activeTab === 'GALLERY' && 'Gallery images showcase your exhibits and facilities to visitors.'}
          </p>
        </div>
        
        {/* Dropzone */}
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors mb-8 ${
            isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <UploadCloud className={`w-12 h-12 mx-auto mb-4 ${isDragActive ? 'text-indigo-600' : 'text-gray-400'}`} />
          <p className="text-gray-700 font-medium mb-1">
            {isDragActive ? 'Drop files here...' : 'Drag & drop images here'}
          </p>
          <p className="text-sm text-gray-500">
            or click to browse from your computer (Max 5MB)
          </p>
        </div>

        {/* Uploading Indicator */}
        {uploading && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-center mb-8">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-600 border-t-transparent mr-3"></div>
            <span className="text-indigo-700 font-medium">Uploading images...</span>
          </div>
        )}

        {/* Image Grid */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            Uploaded {activeTab.charAt(0) + activeTab.slice(1).toLowerCase()} Images ({filteredImages.length})
          </h4>
          
          {filteredImages.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-gray-500">No images uploaded for this category yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredImages.map((img) => (
                <div key={img.id} className="group relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
                  <img 
                    src={img.imageUrl} 
                    alt={img.originalFilename} 
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                    <div className="flex justify-end">
                      <button 
                        onClick={() => handleDelete(img.id)}
                        className="p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                        title="Delete image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <p className="text-white text-xs truncate" title={img.originalFilename}>
                        {img.originalFilename}
                      </p>
                      <p className="text-white/70 text-xs">
                        {(img.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default MediaManager;
