'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, ArrowLeft, ExternalLink, MapPin, Loader2, Trash2, RotateCcw } from 'lucide-react';
import { CollaborateActivity, PlaceData } from '@/lib/types/collaborate';
import ProposalSystemMessage from './ProposalSystemMessage';
import SuggestionSystemMessage from './SuggestionSystemMessage';

interface ActivityMetadata {
  activity: {
    id: string;
    title: string;
    day_number: number;
    category?: string;
    estimated_cost?: number;
    location_name?: string;
  };
  deleted_by_name?: string;
  restored_at?: string;
  restored_by_name?: string;
}

interface Discussion {
  id: string;
  content: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  created_at: string;
  replies?: Discussion[];
  url_preview?: PlaceData | null;
  message_type?:
    | 'message'
    | 'deleted_activity'
    | 'proposal_created'
    | 'proposal_accepted'
    | 'proposal_declined'
    | 'proposal_withdrawn'
    | 'proposal_withdrawal_requested'
    | 'suggestion_created'
    | 'suggestion_used'
    | 'suggestion_dismissed';
  metadata?: any;
}

// URL detection regex
const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const GOOGLE_MAPS_REGEX = /(https?:\/\/(maps\.app\.goo\.gl|maps\.google\.com|google\.com\/maps|goo\.gl\/maps)[^\s]*)/g;

interface DiscussionSidebarProps {
  tripId: string;
  selectedActivityId: string | null;
  activities: CollaborateActivity[];
  onClearSelection: () => void;
  onActivityRestored?: () => void;
  refreshKey?: number;
  isOwner?: boolean;
}

export default function DiscussionSidebar({
  tripId,
  selectedActivityId,
  activities,
  onClearSelection,
  onActivityRestored,
  refreshKey = 0,
  isOwner = false,
}: DiscussionSidebarProps) {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedActivity = selectedActivityId
    ? activities.find(a => a.id === selectedActivityId)
    : null;

  // Fetch discussions
  useEffect(() => {
    const fetchDiscussions = async () => {
      setLoading(true);
      try {
        const url = selectedActivityId
          ? `/api/trips/${tripId}/discussions?itemId=${selectedActivityId}`
          : `/api/trips/${tripId}/discussions`;

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setDiscussions(data.discussions || []);
        }
      } catch (error) {
        console.error('Failed to fetch discussions:', error);
      } finally {
        setLoading(false);
      }
    };

    if (tripId) {
      fetchDiscussions();
    }
  }, [tripId, selectedActivityId, refreshKey]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [discussions]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch(`/api/trips/${tripId}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newMessage,
          itemId: selectedActivityId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDiscussions(prev => [...prev, data.discussion]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRestore = async (discussionId: string) => {
    if (restoringId) return;
    setRestoringId(discussionId);

    try {
      const response = await fetch(`/api/trips/${tripId}/discussions/${discussionId}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        // Refresh discussions to show updated state
        const url = selectedActivityId
          ? `/api/trips/${tripId}/discussions?itemId=${selectedActivityId}`
          : `/api/trips/${tripId}/discussions`;
        const refreshResponse = await fetch(url);
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setDiscussions(data.discussions || []);
        }
        // Notify parent to refresh activities
        onActivityRestored?.();
      } else {
        const data = await response.json();
        console.error('Failed to restore:', data.error);
      }
    } catch (error) {
      console.error('Failed to restore activity:', error);
    } finally {
      setRestoringId(null);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return '?';
  };

  // Check if text contains a URL
  const containsUrl = (text: string): boolean => {
    return URL_REGEX.test(text);
  };

  // Check if URL is a Google Maps URL
  const isGoogleMapsUrl = (url: string): boolean => {
    return url.includes('maps.app.goo.gl') ||
           url.includes('maps.google.com') ||
           url.includes('google.com/maps') ||
           url.includes('goo.gl/maps');
  };

  // Extract first URL from text
  const extractFirstUrl = (text: string): string | null => {
    const match = text.match(URL_REGEX);
    return match ? match[0] : null;
  };

  // Render message with link detection
  const MessageContent = ({ content }: { content: string }) => {
    const url = extractFirstUrl(content);
    const isMapsUrl = url ? isGoogleMapsUrl(url) : false;

    return (
      <div>
        <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap break-words">
          {content}
        </p>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
              isMapsUrl
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
          >
            {isMapsUrl ? (
              <MapPin className="w-4 h-4" />
            ) : (
              <ExternalLink className="w-4 h-4" />
            )}
            <span className="truncate max-w-[200px]">
              {isMapsUrl ? 'View on Google Maps' : 'Open Link'}
            </span>
          </a>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        {selectedActivity ? (
          <div className="flex items-center gap-3">
            <button
              onClick={onClearSelection}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 truncate">
                {selectedActivity.title}
              </h3>
              <p className="text-xs text-gray-500">Activity Discussion</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-gray-900">Trip Discussion</h3>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
          </div>
        ) : discussions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">
              {selectedActivity
                ? `No comments yet on "${selectedActivity.title}"`
                : 'Start a conversation about this trip'}
            </p>
          </div>
        ) : (
          discussions.map((discussion) => {
            // Proposal System Messages
            if (discussion.message_type?.startsWith('proposal_')) {
              return (
                <ProposalSystemMessage
                  key={discussion.id}
                  discussion={discussion}
                  tripId={tripId}
                  isOwner={isOwner}
                  onStatusChange={() => fetchDiscussions()}
                />
              );
            }

            // Suggestion System Messages
            if (discussion.message_type?.startsWith('suggestion_')) {
              return (
                <SuggestionSystemMessage
                  key={discussion.id}
                  discussion={discussion}
                  tripId={tripId}
                  isOwner={isOwner}
                  onStatusChange={() => fetchDiscussions()}
                />
              );
            }

            // Deleted Activity System Message
            if (discussion.message_type === 'deleted_activity') {
              return (
              <div key={discussion.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-red-600 mb-1">Activity Removed</div>
                    <div className="font-medium text-gray-900 text-sm">
                      "{discussion.metadata?.activity?.title}"
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Day {discussion.metadata?.activity?.day_number}
                      {discussion.metadata?.activity?.estimated_cost ? ` • $${discussion.metadata.activity.estimated_cost}` : ''}
                      {discussion.metadata?.activity?.category ? ` • ${discussion.metadata.activity.category}` : ''}
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      Removed by {discussion.metadata?.deleted_by_name || 'someone'} • {formatTime(discussion.created_at)}
                    </div>
                    {discussion.metadata?.restored_at ? (
                      <div className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
                        <RotateCcw className="w-3 h-3" />
                        Restored by {discussion.metadata.restored_by_name || 'someone'}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRestore(discussion.id)}
                        disabled={restoringId === discussion.id}
                        className="mt-2 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        {restoringId === discussion.id ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Restoring...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-3 h-3" />
                            Restore Activity
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              );
            }

            // Regular Message
            return (
              <div key={discussion.id} className="flex gap-3">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-medium flex-shrink-0">
                  {getInitials(discussion.user_name, discussion.user_email)}
                </div>

                {/* Message */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-medium text-gray-900 text-sm">
                      {discussion.user_name || discussion.user_email || 'User'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTime(discussion.created_at)}
                    </span>
                  </div>
                  <MessageContent content={discussion.content} />
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              selectedActivity
                ? `Comment on ${selectedActivity.title}...`
                : 'Message the group...'
            }
            rows={1}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="p-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
