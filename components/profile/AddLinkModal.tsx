'use client';

import { useState } from 'react';
import { X, Check } from 'lucide-react';
import {
  SocialPlatform,
  PaymentPlatform,
  SOCIAL_PLATFORMS,
  PAYMENT_PLATFORMS,
} from '@/lib/types/user';

type LinkType = 'social' | 'payment';

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkType: LinkType;
  onSave: (platform: string, value: string, isPrimary?: boolean) => Promise<void>;
  existingPlatforms?: string[];
}

export default function AddLinkModal({
  isOpen,
  onClose,
  linkType,
  onSave,
  existingPlatforms = [],
}: AddLinkModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [value, setValue] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the appropriate platforms based on link type
  const socialPlatformKeys = Object.keys(SOCIAL_PLATFORMS) as SocialPlatform[];
  const paymentPlatformKeys = Object.keys(PAYMENT_PLATFORMS) as PaymentPlatform[];
  const platformKeys = linkType === 'social' ? socialPlatformKeys : paymentPlatformKeys;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlatform || !value) {
      setError('Please select a platform and enter a value');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave(selectedPlatform, value, linkType === 'payment' ? isPrimary : undefined);
      onClose();
      // Reset form
      setSelectedPlatform(null);
      setValue('');
      setIsPrimary(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const selectedPlatformInfo = selectedPlatform
    ? linkType === 'social'
      ? SOCIAL_PLATFORMS[selectedPlatform as SocialPlatform]
      : PAYMENT_PLATFORMS[selectedPlatform as PaymentPlatform]
    : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">
            Add {linkType === 'social' ? 'Social Link' : 'Tip Method'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Platform Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Platform
            </label>
            <div className="grid grid-cols-3 gap-2">
              {platformKeys.map((key) => {
                const platform = linkType === 'social'
                  ? SOCIAL_PLATFORMS[key as SocialPlatform]
                  : PAYMENT_PLATFORMS[key as PaymentPlatform];
                const isExisting = existingPlatforms.includes(key);
                const isSelected = selectedPlatform === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => !isExisting && setSelectedPlatform(key)}
                    disabled={isExisting}
                    className={`relative p-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50'
                        : isExisting
                          ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                          : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="text-2xl mb-1">{platform.icon}</div>
                    <div className="text-xs font-medium text-gray-700 truncate">
                      {platform.label}
                    </div>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {isExisting && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs text-gray-500 bg-white px-1 rounded">Added</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Value Input */}
          {selectedPlatform && selectedPlatformInfo && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {selectedPlatformInfo.label}
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={selectedPlatformInfo.placeholder}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-100 border border-transparent focus:border-emerald-300 focus:bg-white focus:outline-none"
              />

              {/* Primary toggle for payment links */}
              {linkType === 'payment' && (
                <label className="flex items-center gap-2 mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrimary}
                    onChange={(e) => setIsPrimary(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-600">Set as primary tip method</span>
                </label>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !selectedPlatform || !value}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Add Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
