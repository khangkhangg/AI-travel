'use client';

import { useState, useRef, useEffect } from 'react';
import {
  X,
  Lock,
  Globe,
  Building2,
  Star,
  Copy,
  Check,
  Link,
  ChevronDown,
  Compass,
  Car,
  Heart,
  Sparkles,
  Hotel,
} from 'lucide-react';
import {
  ItineraryVisibility,
  CuratorIsLocal,
  CuratorYearsLived,
  CuratorExperience,
  CuratorInfo,
} from '@/lib/types/user';

type ServiceNeedType = 'guide' | 'hotel' | 'transport' | 'experience' | 'health';

interface MarketplaceSettings {
  serviceNeeds: ServiceNeedType[];
  budgetMin?: number;
  budgetMax?: number;
  notes?: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  currentVisibility: ItineraryVisibility;
  curatorInfo?: CuratorInfo;
  marketplaceSettings?: MarketplaceSettings;
  onUpdateVisibility: (visibility: ItineraryVisibility, curatorInfo?: CuratorInfo, marketplaceSettings?: MarketplaceSettings) => void;
  isUpdating?: boolean;
  anchorRef?: React.RefObject<HTMLElement>;
}

const visibilityOptions = [
  {
    value: 'private' as ItineraryVisibility,
    label: 'Private',
    description: 'Only you can access',
    icon: Lock,
  },
  {
    value: 'public' as ItineraryVisibility,
    label: 'Public',
    description: 'Anyone can view and comment',
    icon: Globe,
  },
  {
    value: 'marketplace' as ItineraryVisibility,
    label: 'Marketplace',
    description: 'Travel companies can bid on your trip',
    icon: Building2,
  },
  {
    value: 'curated' as ItineraryVisibility,
    label: 'Curated Itinerary',
    description: 'Share as local expert, earn tips',
    icon: Star,
  },
];

const isLocalOptions: { value: CuratorIsLocal; label: string }[] = [
  { value: 'yes_live_here', label: 'Yes, I live here' },
  { value: 'visited_multiple', label: 'No, but I\'ve visited multiple times' },
  { value: 'first_detailed_trip', label: 'No, this is my first detailed trip' },
];

const yearsLivedOptions: { value: CuratorYearsLived; label: string }[] = [
  { value: 'less_than_1', label: 'Less than 1 year' },
  { value: '1_2_years', label: '1-2 years' },
  { value: '3_5_years', label: '3-5 years' },
  { value: '5_plus_years', label: '5+ years' },
  { value: 'na_visitor', label: 'N/A (visitor)' },
];

const experienceOptions: { value: CuratorExperience; label: string }[] = [
  { value: 'first_time', label: 'First time visitor' },
  { value: 'visited_2_5', label: 'Visited 2-5 times' },
  { value: 'visited_10_plus', label: 'Visited 10+ times' },
  { value: 'local_expert', label: 'Local expert / Tour guide' },
];

const marketplaceServiceTypes = [
  { id: 'guide' as ServiceNeedType, label: 'Tour Guide', icon: Compass, description: 'Local guide services' },
  { id: 'hotel' as ServiceNeedType, label: 'Hotel', icon: Hotel, description: 'Accommodation booking' },
  { id: 'transport' as ServiceNeedType, label: 'Transport', icon: Car, description: 'Rides & transfers' },
  { id: 'experience' as ServiceNeedType, label: 'Experience', icon: Sparkles, description: 'Activities & tours' },
  { id: 'health' as ServiceNeedType, label: 'Health', icon: Heart, description: 'Travel health services' },
];

export default function ShareModal({
  isOpen,
  onClose,
  shareUrl,
  currentVisibility,
  curatorInfo,
  marketplaceSettings,
  onUpdateVisibility,
  isUpdating = false,
  anchorRef,
}: ShareModalProps) {
  const [selectedVisibility, setSelectedVisibility] = useState<ItineraryVisibility>(currentVisibility);
  const [localCuratorInfo, setLocalCuratorInfo] = useState<CuratorInfo>(
    curatorInfo || {
      isLocal: 'visited_multiple',
      yearsLived: 'na_visitor',
      experience: 'visited_2_5',
    }
  );
  const [localMarketplaceSettings, setLocalMarketplaceSettings] = useState<MarketplaceSettings>(
    marketplaceSettings || {
      serviceNeeds: [],
      budgetMin: undefined,
      budgetMax: undefined,
      notes: '',
    }
  );
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedVisibility(currentVisibility);
    if (curatorInfo) {
      setLocalCuratorInfo(curatorInfo);
    }
    if (marketplaceSettings) {
      setLocalMarketplaceSettings(marketplaceSettings);
    }
  }, [currentVisibility, curatorInfo, marketplaceSettings]);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
  };

  const toggleServiceNeed = (serviceId: ServiceNeedType) => {
    setLocalMarketplaceSettings(prev => ({
      ...prev,
      serviceNeeds: prev.serviceNeeds.includes(serviceId)
        ? prev.serviceNeeds.filter(s => s !== serviceId)
        : [...prev.serviceNeeds, serviceId],
    }));
  };

  const handleUpdateVisibility = () => {
    if (selectedVisibility === 'curated') {
      onUpdateVisibility(selectedVisibility, localCuratorInfo, undefined);
    } else if (selectedVisibility === 'marketplace') {
      onUpdateVisibility(selectedVisibility, undefined, localMarketplaceSettings);
    } else {
      onUpdateVisibility(selectedVisibility);
    }
  };

  const hasChanges = selectedVisibility !== currentVisibility ||
    (selectedVisibility === 'curated' && JSON.stringify(localCuratorInfo) !== JSON.stringify(curatorInfo)) ||
    (selectedVisibility === 'marketplace' && JSON.stringify(localMarketplaceSettings) !== JSON.stringify(marketplaceSettings));

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      className="absolute right-0 top-full mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Share Your Itinerary</h3>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Visibility Options */}
      <div className="p-4 space-y-2">
        {visibilityOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedVisibility === option.value;

          return (
            <div key={option.value}>
              <button
                onClick={() => setSelectedVisibility(option.value)}
                className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all ${
                  isSelected
                    ? 'bg-teal-50 border-2 border-teal-500'
                    : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                }`}
              >
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-teal-100' : 'bg-gray-200'}`}>
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-teal-600' : 'text-gray-500'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${isSelected ? 'text-teal-900' : 'text-gray-700'}`}>
                      {option.label}
                    </span>
                    {option.value === 'curated' && (
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    )}
                  </div>
                  <p className={`text-sm ${isSelected ? 'text-teal-700' : 'text-gray-500'}`}>
                    {option.description}
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isSelected ? 'border-teal-500 bg-teal-500' : 'border-gray-300'
                }`}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>

              {/* Marketplace Fields - shown when marketplace is selected */}
              {option.value === 'marketplace' && isSelected && (
                <div className="mt-3 ml-12 p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-4">
                  <p className="text-sm font-medium text-blue-800">What services do you need?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {marketplaceServiceTypes.map(service => {
                      const ServiceIcon = service.icon;
                      const isChecked = localMarketplaceSettings.serviceNeeds.includes(service.id);
                      return (
                        <button
                          key={service.id}
                          onClick={() => toggleServiceNeed(service.id)}
                          className={`flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-all ${
                            isChecked
                              ? 'bg-blue-100 border border-blue-300'
                              : 'bg-white border border-gray-200 hover:border-blue-200'
                          }`}
                        >
                          <ServiceIcon className={`w-4 h-4 ${isChecked ? 'text-blue-600' : 'text-gray-400'}`} />
                          <span className={isChecked ? 'text-blue-700 font-medium' : 'text-gray-600'}>
                            {service.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1.5">
                      Budget range (optional)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min $"
                        value={localMarketplaceSettings.budgetMin || ''}
                        onChange={(e) => setLocalMarketplaceSettings(prev => ({
                          ...prev,
                          budgetMin: e.target.value ? parseInt(e.target.value) : undefined
                        }))}
                        className="flex-1 px-3 py-1.5 text-sm bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300/50"
                      />
                      <span className="text-gray-400 self-center">-</span>
                      <input
                        type="number"
                        placeholder="Max $"
                        value={localMarketplaceSettings.budgetMax || ''}
                        onChange={(e) => setLocalMarketplaceSettings(prev => ({
                          ...prev,
                          budgetMax: e.target.value ? parseInt(e.target.value) : undefined
                        }))}
                        className="flex-1 px-3 py-1.5 text-sm bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1.5">
                      Notes for providers (optional)
                    </label>
                    <textarea
                      placeholder="Any specific requirements or preferences..."
                      value={localMarketplaceSettings.notes || ''}
                      onChange={(e) => setLocalMarketplaceSettings(prev => ({
                        ...prev,
                        notes: e.target.value
                      }))}
                      rows={2}
                      className="w-full px-3 py-2 text-sm bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300/50 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Curator Fields - shown when curated is selected */}
              {option.value === 'curated' && isSelected && (
                <div className="mt-3 ml-12 p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-4">
                  <p className="text-sm font-medium text-amber-800">Your Local Expertise</p>

                  {/* Is Local */}
                  <div>
                    <label className="block text-xs font-medium text-amber-700 mb-1.5">
                      Are you a local?
                    </label>
                    <div className="relative">
                      <select
                        value={localCuratorInfo.isLocal}
                        onChange={(e) => setLocalCuratorInfo(prev => ({
                          ...prev,
                          isLocal: e.target.value as CuratorIsLocal
                        }))}
                        className="w-full px-3 py-2 pr-8 text-sm bg-white border border-amber-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                      >
                        {isLocalOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-600 pointer-events-none" />
                    </div>
                  </div>

                  {/* Years Lived */}
                  <div>
                    <label className="block text-xs font-medium text-amber-700 mb-1.5">
                      How long have you lived/stayed here?
                    </label>
                    <div className="relative">
                      <select
                        value={localCuratorInfo.yearsLived}
                        onChange={(e) => setLocalCuratorInfo(prev => ({
                          ...prev,
                          yearsLived: e.target.value as CuratorYearsLived
                        }))}
                        className="w-full px-3 py-2 pr-8 text-sm bg-white border border-amber-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                      >
                        {yearsLivedOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-600 pointer-events-none" />
                    </div>
                  </div>

                  {/* Experience */}
                  <div>
                    <label className="block text-xs font-medium text-amber-700 mb-1.5">
                      Your experience with this destination
                    </label>
                    <div className="relative">
                      <select
                        value={localCuratorInfo.experience}
                        onChange={(e) => setLocalCuratorInfo(prev => ({
                          ...prev,
                          experience: e.target.value as CuratorExperience
                        }))}
                        className="w-full px-3 py-2 pr-8 text-sm bg-white border border-amber-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                      >
                        {experienceOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-600 pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Share URL */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-gray-200">
          <Link className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="flex-1 text-sm text-gray-600 bg-transparent truncate focus:outline-none"
          />
          <button
            onClick={handleCopyUrl}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium text-gray-700 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Action Button */}
      <div className="px-4 py-3 border-t border-gray-100">
        <button
          onClick={handleUpdateVisibility}
          disabled={!hasChanges || isUpdating}
          className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all ${
            hasChanges && !isUpdating
              ? 'bg-teal-600 hover:bg-teal-700 text-white'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isUpdating ? 'Updating...' : 'Update Sharing'}
        </button>
      </div>
    </div>
  );
}
