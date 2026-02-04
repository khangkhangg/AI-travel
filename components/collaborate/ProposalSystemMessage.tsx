'use client';

import { useState } from 'react';
import { DollarSign, ChevronDown, ChevronUp, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ProposalMetadata {
  proposal_id: string;
  business_id: string;
  business_name: string;
  business_type: string;
  business_logo?: string;
  activity_id?: string;
  activity_title?: string;
  total_price: number;
  currency: string;
  message?: string;
  withdrawal_reason?: string;
  previous_status?: string;
}

interface Discussion {
  id: string;
  content: string;
  message_type?: string;
  metadata?: ProposalMetadata;
  created_at: string;
}

interface ProposalSystemMessageProps {
  discussion: Discussion;
}

export default function ProposalSystemMessage({ discussion }: ProposalSystemMessageProps) {
  const [expanded, setExpanded] = useState(false);
  const metadata = discussion.metadata as ProposalMetadata;

  const getIconAndColor = () => {
    switch (discussion.message_type) {
      case 'proposal_created':
        return {
          icon: DollarSign,
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-100',
          textColor: 'text-emerald-700',
          iconBg: 'bg-emerald-100',
          iconColor: 'text-emerald-600',
          label: 'Proposal Submitted',
        };
      case 'proposal_accepted':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-100',
          textColor: 'text-green-700',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          label: 'Proposal Accepted',
        };
      case 'proposal_declined':
        return {
          icon: XCircle,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-100',
          textColor: 'text-red-700',
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          label: 'Proposal Declined',
        };
      case 'proposal_withdrawn':
      case 'proposal_withdrawal_requested':
        return {
          icon: AlertCircle,
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-100',
          textColor: 'text-orange-700',
          iconBg: 'bg-orange-100',
          iconColor: 'text-orange-600',
          label: discussion.message_type === 'proposal_withdrawn' ? 'Proposal Withdrawn' : 'Withdrawal Requested',
        };
      default:
        return {
          icon: DollarSign,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-700',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
          label: 'Proposal Update',
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

  const { icon: Icon, bgColor, borderColor, textColor, iconBg, iconColor, label } = getIconAndColor();

  return (
    <div
      className={`${bgColor} border ${borderColor} rounded-lg p-3 transition-all duration-200 hover:shadow-sm`}
    >
      <div className="flex items-start gap-3">
        {/* Business Logo or Icon */}
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0 transition-transform duration-200 hover:scale-105`}>
          {metadata?.business_logo ? (
            <img
              src={metadata.business_logo}
              alt={metadata.business_name}
              className="w-8 h-8 rounded object-cover"
            />
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

          {/* Business Name */}
          <div className="font-semibold text-gray-900 text-sm mb-1 leading-tight">
            {metadata?.business_name}
          </div>

          {/* Content Text */}
          <div className="text-sm text-gray-700 leading-relaxed mb-2">
            {discussion.content}
          </div>

          {/* Price Badge and Activity Info */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full shadow-sm">
              <DollarSign className="w-3 h-3" />
              {metadata?.total_price} {metadata?.currency || 'USD'}
            </div>
            {metadata?.activity_title && (
              <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                for "{metadata.activity_title}"
              </span>
            )}
          </div>

          {/* Expandable Details Button */}
          {metadata?.message && (
            <button
              onClick={() => setExpanded(!expanded)}
              className={`mt-2 text-xs font-medium flex items-center gap-1 transition-colors ${textColor} hover:${textColor.replace('700', '900')}`}
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  Hide details
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  Show details
                </>
              )}
            </button>
          )}

          {/* Expanded Details */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              expanded ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0'
            }`}
          >
            {metadata?.message && (
              <div className="p-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 leading-relaxed shadow-inner">
                {metadata.message}
              </div>
            )}
          </div>

          {/* Withdrawal Reason Alert */}
          {metadata?.withdrawal_reason && (
            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-orange-800 mb-1">Withdrawal Reason:</p>
                  <p className="text-xs text-orange-700 leading-relaxed">{metadata.withdrawal_reason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="text-[11px] text-gray-400 mt-2.5 font-medium">
            {formatTime(discussion.created_at)}
          </div>
        </div>
      </div>
    </div>
  );
}
