import React, { useState, useEffect } from 'react';
import { publicAPI } from '../../services/api';
import RatingStars from '../common/RatingStars';
import ReviewComposer from './ReviewComposer';
import { MessageSquare, User, Calendar, CornerDownRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const MuseumReviews = ({ museumId, slug, initialRating = 0, initialCount = 0 }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  // Real-time rating/count display (optimistic updates could be added here)
  const [stats, setStats] = useState({ rating: initialRating, count: initialCount });

  useEffect(() => {
    if (slug) {
      fetchReviews(0);
    }
  }, [slug]);

  const fetchReviews = async (pageNum, append = false) => {
    try {
      setLoading(true);
      const res = await publicAPI.getMuseumReviews(slug, pageNum, 5);
      // Spring Data JPA Page response has content and !last
      const newReviews = res?.content || (res?.data?.content) || [];
      const isLast = res?.last ?? (res?.data?.last) ?? true;
      
      setReviews(prev => append ? [...prev, ...newReviews] : newReviews);
      setHasMore(!isLast);
      setPage(pageNum);
    } catch (error) {
      console.error("Failed to fetch reviews", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchReviews(page + 1, true);
    }
  };

  const handleReviewSuccess = () => {
    setShowComposer(false);
    // Refresh first page to show new review
    fetchReviews(0);
    // Optimistically update count (real rating requires backend recalculation)
    setStats(prev => ({ ...prev, count: prev.count + 1 }));
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-6 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Visitor Reviews</h2>
          <div className="flex items-center">
            <span className="text-3xl font-extrabold text-gray-900 mr-4">{stats.rating.toFixed(1)}</span>
            <RatingStars rating={stats.rating} count={stats.count} size={20} showCount={false} />
            <span className="text-gray-500 ml-3 font-medium">Based on {stats.count} reviews</span>
          </div>
        </div>
        
        <div className="mt-4 sm:mt-0">
          {!showComposer && (
            <button 
              onClick={() => setShowComposer(true)}
              className="px-6 py-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition-colors flex items-center"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Write a Review
            </button>
          )}
        </div>
      </div>

      {showComposer && (
        <ReviewComposer 
          museumId={museumId} 
          onSuccess={handleReviewSuccess} 
          onCancel={() => setShowComposer(false)} 
        />
      )}

      {/* Review List */}
      <div className="space-y-6">
        {reviews.length === 0 && !loading ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No reviews yet</h3>
            <p className="text-gray-500">Be the first to share your experience!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold mr-3">
                    {review.visitorName ? review.visitorName.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">
                      {review.visitorName || 'Anonymous Visitor'}
                    </h4>
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      {review.createdAt ? formatDistanceToNow(new Date(review.createdAt), { addSuffix: true }) : 'Recently'}
                    </div>
                  </div>
                </div>
                <RatingStars rating={review.rating} size={14} showCount={false} />
              </div>
              
              {review.title && <h5 className="font-bold text-gray-900 mb-2">{review.title}</h5>}
              
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{review.content}</p>
              
              {/* Owner Response */}
              {/* Note: The backend model ReviewResponse is separate, you'd typically join or include it in the review DTO. 
                  Assuming it's included as `response` property for this mock. */}
              {review.response && (
                <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-start">
                  <CornerDownRight className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <h6 className="font-bold text-gray-900 text-sm mb-1">Response from Museum</h6>
                    <p className="text-sm text-gray-700 leading-relaxed">{review.response.responseText}</p>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Load More */}
      {hasMore && (
        <div className="mt-8 text-center">
          <button 
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Show more reviews'}
          </button>
        </div>
      )}
    </div>
  );
};

export default MuseumReviews;
