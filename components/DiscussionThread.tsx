'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Send, Trash2, Reply } from 'lucide-react';
import { format } from 'date-fns';

interface Discussion {
  id: string;
  content: string;
  user_email: string;
  user_name: string | null;
  user_avatar: string | null;
  created_at: string;
  reply_count: number;
  replies?: Discussion[];
}

interface DiscussionThreadProps {
  tripId: string;
  itineraryItemId?: string;
}

export default function DiscussionThread({ tripId, itineraryItemId }: DiscussionThreadProps) {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDiscussions();
  }, [tripId]);

  const fetchDiscussions = async () => {
    try {
      const response = await fetch(`/api/trips/${tripId}/discussions`);
      const data = await response.json();
      setDiscussions(data.discussions || []);
    } catch (error) {
      console.error('Failed to fetch discussions:', error);
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          itineraryItemId
        })
      });

      if (response.ok) {
        setNewComment('');
        fetchDiscussions();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
      alert('Failed to post comment');
    } finally {
      setLoading(false);
    }
  };

  const handlePostReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          parentId,
          itineraryItemId
        })
      });

      if (response.ok) {
        setReplyContent('');
        setReplyTo(null);
        fetchDiscussions();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to post reply');
      }
    } catch (error) {
      console.error('Failed to post reply:', error);
      alert('Failed to post reply');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (discussionId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch(
        `/api/trips/${tripId}/discussions?discussionId=${discussionId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        fetchDiscussions();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('Failed to delete comment');
    }
  };

  const renderDiscussion = (discussion: Discussion, isReply = false) => (
    <div
      key={discussion.id}
      className={`${isReply ? 'ml-12 mt-4' : 'mb-6'} bg-white rounded-lg p-4 shadow-sm border border-gray-200`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {discussion.user_avatar ? (
            <img
              src={discussion.user_avatar}
              alt={discussion.user_name || discussion.user_email}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
              {(discussion.user_name || discussion.user_email).charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="font-medium text-gray-900">
                {discussion.user_name || discussion.user_email}
              </span>
              <span className="text-sm text-gray-500 ml-2">
                {format(new Date(discussion.created_at), 'MMM d, yyyy h:mm a')}
              </span>
            </div>
            <button
              onClick={() => handleDeleteComment(discussion.id)}
              className="text-gray-400 hover:text-red-600 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <p className="text-gray-700 whitespace-pre-wrap">{discussion.content}</p>

          {!isReply && (
            <button
              onClick={() => setReplyTo(replyTo === discussion.id ? null : discussion.id)}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <Reply className="w-4 h-4" />
              <span>Reply</span>
              {discussion.reply_count > 0 && (
                <span className="text-gray-500">({discussion.reply_count})</span>
              )}
            </button>
          )}

          {replyTo === discussion.id && (
            <div className="mt-4 flex space-x-2">
              <input
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handlePostReply(discussion.id);
                  }
                }}
              />
              <button
                onClick={() => handlePostReply(discussion.id)}
                disabled={loading || !replyContent.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Render replies */}
      {discussion.replies && discussion.replies.length > 0 && (
        <div className="mt-4">
          {discussion.replies.map((reply) => renderDiscussion(reply, true))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <MessageCircle className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Discussion ({discussions.length})
        </h3>
      </div>

      {/* New comment input */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Share your thoughts..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handlePostComment}
            disabled={loading || !newComment.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Post Comment</span>
          </button>
        </div>
      </div>

      {/* Discussion list */}
      <div className="space-y-4">
        {discussions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No comments yet. Be the first to share your thoughts!
          </div>
        ) : (
          discussions.map((discussion) => renderDiscussion(discussion))
        )}
      </div>
    </div>
  );
}
