'use client';

import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Star, Building2, Phone, Mail } from 'lucide-react';
import type { Proposal } from '@/lib/types/marketplace';

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  guide: 'Tour Guide',
  hotel: 'Hotel',
  transport: 'Transport',
  experience: 'Experience',
  health: 'Health & Wellness',
};

interface AcceptedProposalBannerProps {
  proposal: Proposal;
  expanded: boolean;
  onToggle: () => void;
}

export default function AcceptedProposalBanner({
  proposal,
  expanded,
  onToggle,
}: AcceptedProposalBannerProps) {
  return (
    <div className="mb-3 border-2 border-green-200 bg-green-50 rounded-lg overflow-hidden">
      {/* Collapsed header */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-green-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" />
          <span className="font-medium text-green-900">
            Booked with {proposal.business_name}
          </span>
          <span className="text-green-700">·</span>
          <span className="font-semibold text-green-800">
            {proposal.currency === 'USD' ? '$' : proposal.currency}
            {proposal.total_price.toLocaleString()}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-green-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-green-600" />
        )}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-green-200 pt-3">
          {/* Business info */}
          <div className="flex items-center gap-2">
            {proposal.logo_url ? (
              <img
                src={proposal.logo_url}
                alt={proposal.business_name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-green-600" />
              </div>
            )}
            <div>
              <div className="font-medium text-gray-900">{proposal.business_name}</div>
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <span>{BUSINESS_TYPE_LABELS[proposal.business_type] || proposal.business_type}</span>
                {proposal.rating && proposal.rating > 0 && (
                  <>
                    <span>·</span>
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span>{proposal.rating.toFixed(1)}</span>
                      {proposal.review_count && proposal.review_count > 0 && (
                        <span className="text-gray-500">({proposal.review_count})</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Services included */}
          {proposal.services_offered && proposal.services_offered.length > 0 && (
            <div>
              <div className="text-sm font-medium text-gray-900 mb-1.5">📦 Includes:</div>
              <ul className="space-y-1">
                {proposal.services_offered.map((service: any, idx: number) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-1.5">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>{service.service_name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Proposal message */}
          {proposal.message && (
            <p className="text-sm text-gray-700 italic border-l-2 border-green-300 pl-3">
              &quot;{proposal.message}&quot;
            </p>
          )}

          {/* Contact info - if available */}
          {(proposal.contact_email || proposal.contact_phone) && (
            <div className="text-sm text-gray-600 space-y-1">
              {proposal.contact_phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  <a
                    href={`tel:${proposal.contact_phone}`}
                    className="hover:text-green-700 transition-colors"
                  >
                    {proposal.contact_phone}
                  </a>
                </div>
              )}
              {proposal.contact_email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <a
                    href={`mailto:${proposal.contact_email}`}
                    className="hover:text-green-700 transition-colors"
                  >
                    {proposal.contact_email}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
