'use client';

import { useState } from 'react';
import { MessageSquare, ChevronDown, ChevronUp, CheckCircle, XCircle, ExternalLink, MapPin } from 'lucide-react';

interface SuggestionMetadata {
  suggestion_id: string;
  suggester_id: string;
  suggester_name: string;
  suggester_avatar?: string;
  activity_id?: string;
  activity_title?: string;
  place_name: string;
  reason: string;
  day_number?: number;
  category?: string;
  source_url?: string;
  previous_status?: string;
}

interface Discussion {
  id: string;
  content: string;
  message_type?: string;
  metadata?: SuggestionMetadata;
  created_at: string;
}

interface SuggestionSystemMessageProps {
  discussion: Discussion;
}

export default function SuggestionSystemMessage({ discussion }: SuggestionSystemMessageProps) {
  const [expanded, setExpanded] = useState(false);
  const metadata = discussion.metadata as SuggestionMetadata;

  const getIconAndColor = () => {
    switch (discussion.message_type) {
      case 'suggestion_created':
        return {
          icon: MessageSquare,
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-100',
          textColor: 'text-purple-700',
          iconBg: 'bg-purple-100',
          iconColor: 'text-purple-600',
          label: 'Place Suggested',
        };
      case 'suggestion_used':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-100',
          textColor: 'text-green-700',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          label: 'Suggestion Used',
        };
      case 'suggestion_dismissed':
        return {
          icon: XCircle,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-700',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
          label: 'Suggestion Dismissed',
        };
      default:
        return {
          icon: MessageSquare,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-700',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
          label: 'Suggestion Update',
        };
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const { icon: Icon, bgColor, borderColor, textColor, iconBg, iconColor, label } = getIconAndColor();

  return (
    <div
      className={`${bgColor} border ${borderColor} rounded-lg p-3 transition-all duration-200 hover:shadow-sm`}
    >
      <div className="flex items-start gap-3">
        {/* User Avatar or Icon */}
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0 transition-transform duration-200 hover:scale-105 overflow-hidden`}>
          {metadata?.suggester_avatar ? (
            <img
              src={metadata.suggester_avatar}
              alt={metadata.suggester_name}
              className="w-full h-full object-cover"
            />
          ) : metadata?.suggester_name ? (
            <span className={`text-xs font-bold ${iconColor}`}>
              {getInitials(metadata.suggester_name)}
            </span>
          ) : (
            <Icon className={`w-5 h-5 ${iconColor}`} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Label */}
          <div className={`text-[10px] font-semibold uppercase tracking-wider ${textColor} mb-1.5 flex items-center gap-1.5`}>
            <div className={`w-1.5 h-1.5 rounded-full ${iconColor.replace('text-', 'bg-')}`} />
            {label}
          </div>

          {/* Place Name */}
          <div className="font-semibold text-gray-900 text-sm mb-1 leading-tight">
            {metadata?.place_name}
          </div>

          {/* Content Text */}
          <div className="text-sm text-gray-700 leading-relaxed mb-2">
            {discussion.content}
          </div>

          {/* Badges: Day Number and Activity */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {metadata?.day_number && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full shadow-sm">
                <MapPin className="w-3 h-3" />
                Day {metadata.day_number}
              </div>
            )}
            {metadata?.activity_title && (
              <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                for "{metadata.activity_title}"
              </span>
            )}
            {metadata?.category && (
              <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded border border-purple-200">
                {metadata.category}
              </span>
            )}
          </div>

          {/* Expandable Reason Button */}
          {metadata?.reason && (
            <button
              onClick={() => setExpanded(!expanded)}
              className={`mt-2 text-xs font-medium flex items-center gap-1 transition-colors ${textColor} hover:${textColor.replace('700', '900')}`}
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  Hide reason
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  Show reason
                </>
              )}
            </button>
          )}

          {/* Expanded Reason */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              expanded ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0'
            }`}
          >
            {metadata?.reason && (
              <div className="p-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 leading-relaxed shadow-inner">
                {metadata.reason}
              </div>
            )}

            {/* Source URL */}
            {metadata?.source_url && expanded && (
              <a
                href={metadata.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors group"
              >
                <MapPin className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                View on map
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Timestamp */}
          <div className="text-[11px] text-gray-400 mt-2.5 font-medium">
            {formatTime(discussion.created_at)}
          </div>
        </div>
      </div>
    </div>
  );
}
