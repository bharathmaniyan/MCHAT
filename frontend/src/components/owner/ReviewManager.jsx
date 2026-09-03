import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, CornerDownRight, Send } from 'lucide-react';
import { ownerAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const ReviewManager = ({ reviews = [], onUpdate }) => {
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('ALL'); // ALL, UNREPLIED

  const handleReplySubmit = async (reviewId) => {
    if (!replyText.trim()) return;
    
    setSubmitting(true);
    try {
      await ownerAPI.respondToReview(reviewId, { responseText: replyText });
      toast.success('Reply posted successfully');
      setReplyingTo(null);
      setReplyText('');
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReviews = reviews.filter(r => {
    if (filter === 'UNREPLIED') return !r.response;
    return true;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 flex items-center">
          <MessageSquare className="w-5 h-5 mr-2 text-indigo-600" />
          Visitor Reviews
        </h3>
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          className="text-sm border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 py-1.5 pl-3 pr-8"
        >
          <option value="ALL">All Reviews</option>
          <option value="UNREPLIED">Awaiting Reply</option>
        </select>
      </div>
      
      <div className="p-0">
        {filteredReviews.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No reviews found matching the selected filter.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredReviews.map((review) => (
              <div key={review.id} className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900">{review.visitorName || 'Anonymous'}</h4>
                    <div className="flex items-center mt-1">
                      <div className="flex text-amber-400 mr-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">
                        {review.createdAt ? formatDistanceToNow(new Date(review.createdAt), { addSuffix: true }) : 'Recently'}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 font-mono">
                    Ticket #{review.ticketId}
                  </div>
                </div>
                
                {review.title && <h5 className="font-semibold text-gray-800 mb-1">{review.title}</h5>}
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{review.content}</p>
                
                {/* Existing Response */}
                {review.response ? (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-start ml-4">
                    <CornerDownRight className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-gray-900 bg-gray-200 px-2 py-0.5 rounded uppercase">Your Reply</span>
                        <span className="text-xs text-gray-500">
                          {review.response.createdAt ? formatDistanceToNow(new Date(review.response.createdAt), { addSuffix: true }) : ''}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{review.response.responseText}</p>
                    </div>
                  </div>
                ) : (
                  /* Reply Action Area */
                  <div className="ml-4">
                    {replyingTo === review.id ? (
                      <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                        <textarea
                          rows={3}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write a public response to this visitor..."
                          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 text-sm resize-none mb-3"
                        />
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => { setReplyingTo(null); setReplyText(''); }}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => handleReplySubmit(review.id)}
                            disabled={submitting || !replyText.trim()}
                            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {submitting ? 'Posting...' : <><Send className="w-4 h-4 mr-1.5" /> Post Reply</>}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => { setReplyingTo(review.id); setReplyText(''); }}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center"
                      >
                        <CornerDownRight className="w-4 h-4 mr-1" />
                        Reply to this review
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewManager;
