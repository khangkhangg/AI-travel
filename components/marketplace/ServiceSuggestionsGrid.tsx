'use client';

import { useState } from 'react';
import { SERVICE_CATEGORIES, ViewMode, BidFormData, SuggestionFormData, Business } from '@/lib/types/marketplace';
import BidForm from './BidForm';
import SuggestionForm from './SuggestionForm';

interface ServiceSuggestionsGridProps {
  tripId: string;
  viewMode: ViewMode;
  business?: Business | null;
  onSubmitBid?: (serviceType: string, data: BidFormData) => Promise<void>;
  onSubmitSuggestion?: (serviceType: string, data: SuggestionFormData) => Promise<void>;
  isLoggedIn?: boolean;
  onAuthRequired?: () => void;
}

export default function ServiceSuggestionsGrid({
  tripId,
  viewMode,
  business,
  onSubmitBid,
  onSubmitSuggestion,
  isLoggedIn = true,
  onAuthRequired,
}: ServiceSuggestionsGridProps) {
  const [activeService, setActiveService] = useState<string | null>(null);

  if (viewMode === 'normal') return null;

  const isBusiness = viewMode === 'business';

  const handleServiceClick = (serviceId: string) => {
    setActiveService(activeService === serviceId ? null : serviceId);
  };

  const handleSubmitBid = async (data: BidFormData) => {
    if (activeService && onSubmitBid) {
      await onSubmitBid(activeService, data);
      setActiveService(null);
    }
  };

  const handleSubmitSuggestion = async (data: SuggestionFormData) => {
    if (activeService && onSubmitSuggestion) {
      await onSubmitSuggestion(activeService, data);
      setActiveService(null);
    }
  };

  return (
    <div className="mt-8 border-t border-gray-200 pt-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {isBusiness ? 'Offer Additional Services' : 'Suggest Additional Services'}
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        {isBusiness
          ? 'Select a service category to submit a bid for the trip.'
          : 'Suggest providers or places for additional services the traveler might need.'}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {SERVICE_CATEGORIES.map((service) => (
          <button
            key={service.id}
            onClick={() => handleServiceClick(service.id)}
            className={`p-4 rounded-xl border-2 transition-all ${
              activeService === service.id
                ? isBusiness
                  ? 'border-green-500 bg-green-50'
                  : 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="text-3xl mb-2">{service.icon}</div>
            <div className="text-sm font-medium text-gray-900">{service.label}</div>
            <div className={`text-xs mt-1 ${
              isBusiness ? 'text-green-600' : 'text-purple-600'
            }`}>
              {isBusiness ? 'Bid' : 'Suggest'}
            </div>
          </button>
        ))}
      </div>

      {/* Form for selected service */}
      {activeService && (
        <div className="mt-6">
          {isBusiness && business ? (
            <BidForm
              tripId={tripId}
              business={business}
              onSubmit={handleSubmitBid}
              onCancel={() => setActiveService(null)}
              isLoggedIn={isLoggedIn}
              onAuthRequired={onAuthRequired}
            />
          ) : (
            <SuggestionForm
              tripId={tripId}
              onSubmit={handleSubmitSuggestion}
              onCancel={() => setActiveService(null)}
              isLoggedIn={isLoggedIn}
              onAuthRequired={onAuthRequired}
            />
          )}
        </div>
      )}
    </div>
  );
}
