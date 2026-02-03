'use client';

import { useState } from 'react';
import {
  Compass,
  Star,
  MapPin,
  Loader2,
  Check,
  X,
  DollarSign,
  Calendar,
} from 'lucide-react';

interface GuideDetails {
  experience_level?: 'beginner' | 'intermediate' | 'expert';
  specialties?: string[];
  coverage_areas?: string[];
  hourly_rate?: number;
  bio?: string;
  calendar_embed_code?: string;
}

interface GuideModePanelProps {
  isGuide: boolean;
  guideDetails: GuideDetails;
  googleCalendarEnabled?: boolean;
  onToggleGuideMode: () => Promise<void>;
  onSaveGuideDetails: (details: GuideDetails) => Promise<void>;
}

export default function GuideModePanel({
  isGuide,
  guideDetails,
  googleCalendarEnabled = false,
  onToggleGuideMode,
  onSaveGuideDetails,
}: GuideModePanelProps) {
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<GuideDetails>(guideDetails);

  const handleToggle = async () => {
    setSaving(true);
    try {
      await onToggleGuideMode();
      if (!isGuide) {
        setIsEditing(true);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Clean up: trim all items and filter empty ones before saving
      const cleanedForm = {
        ...editForm,
        specialties: editForm.specialties?.map(s => s.trim()).filter(Boolean),
        coverage_areas: editForm.coverage_areas?.map(s => s.trim()).filter(Boolean),
      };
      await onSaveGuideDetails(cleanedForm);
      setEditForm(cleanedForm);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm(guideDetails);
    setIsEditing(false);
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900">Guide Mode</h2>
        {isGuide && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Edit Details
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Guide Mode Toggle Card */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Compass className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Become a Local Guide</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Share your local expertise with travelers visiting your area.
                  Enable guide mode to receive booking requests.
                </p>
              </div>
            </div>
            <button
              onClick={handleToggle}
              disabled={saving}
              className={`relative w-14 h-8 rounded-full transition-colors disabled:opacity-50 flex-shrink-0 ${
                isGuide ? 'bg-amber-500' : 'bg-gray-300'
              }`}
            >
              {saving ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                </div>
              ) : (
                <div
                  className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all ${
                    isGuide ? 'left-7' : 'left-1'
                  }`}
                />
              )}
            </button>
          </div>
        </div>

        {/* Guide Details */}
        {isGuide && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Guide Profile</h3>

            {isEditing ? (
              <div className="space-y-4">
                {/* Experience Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Experience Level
                  </label>
                  <select
                    value={editForm.experience_level || ''}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        experience_level: e.target.value as any,
                      }))
                    }
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
                  >
                    <option value="">Select experience level</option>
                    <option value="beginner">Beginner (1-2 years)</option>
                    <option value="intermediate">Intermediate (3-5 years)</option>
                    <option value="expert">Expert (5+ years)</option>
                  </select>
                </div>

                {/* Specialties */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Specialties
                  </label>
                  <input
                    type="text"
                    value={editForm.specialties?.join(', ') || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Split by comma but preserve spaces - only trim completely empty items
                      const items = value.split(',').map((s, i, arr) => {
                        // Don't trim the last item (user is currently typing it)
                        if (i === arr.length - 1) return s;
                        return s.trim();
                      }).filter((s, i, arr) => i === arr.length - 1 || s.length > 0);
                      setEditForm((prev) => ({ ...prev, specialties: items }));
                    }}
                    placeholder="e.g., Food tours, History, Adventure, Photography"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
                  />
                  <p className="text-xs text-gray-400 mt-1">Separate with commas</p>
                </div>

                {/* Coverage Areas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Coverage Areas
                  </label>
                  <input
                    type="text"
                    value={editForm.coverage_areas?.join(', ') || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Split by comma but preserve spaces - only trim completely empty items
                      const items = value.split(',').map((s, i, arr) => {
                        // Don't trim the last item (user is currently typing it)
                        if (i === arr.length - 1) return s;
                        return s.trim();
                      }).filter((s, i, arr) => i === arr.length - 1 || s.length > 0);
                      setEditForm((prev) => ({ ...prev, coverage_areas: items }));
                    }}
                    placeholder="e.g., Ho Chi Minh City, Da Nang, Hanoi"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
                  />
                  <p className="text-xs text-gray-400 mt-1">Cities or regions you can guide in</p>
                </div>

                {/* Hourly Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Hourly Rate (USD)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={editForm.hourly_rate || ''}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          hourly_rate: e.target.value ? parseInt(e.target.value) : undefined,
                        }))
                      }
                      placeholder="50"
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Guide Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Guide Bio
                  </label>
                  <textarea
                    value={editForm.bio || ''}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, bio: e.target.value }))
                    }
                    placeholder="Tell travelers about your experience, what makes your tours unique..."
                    rows={4}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors resize-none"
                  />
                </div>

                {/* Google Calendar Embed */}
                {googleCalendarEnabled && (
                  <div className="pt-4 border-t border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Google Calendar Booking Link
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={editForm.calendar_embed_code || ''}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            calendar_embed_code: e.target.value,
                          }))
                        }
                        placeholder="Paste your Google Calendar appointment scheduling link..."
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Get this from Google Calendar → Appointment schedules → Share → Copy link
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 rounded-lg transition-colors"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Save Details
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {guideDetails.experience_level && (
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-amber-500" />
                    <span className="text-gray-700">
                      {guideDetails.experience_level.charAt(0).toUpperCase() +
                        guideDetails.experience_level.slice(1)}{' '}
                      Guide
                    </span>
                  </div>
                )}

                {guideDetails.specialties && guideDetails.specialties.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Specialties</p>
                    <div className="flex flex-wrap gap-2">
                      {guideDetails.specialties.map((specialty, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {guideDetails.coverage_areas && guideDetails.coverage_areas.length > 0 && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Coverage Areas</p>
                      <p className="text-gray-700">{guideDetails.coverage_areas.join(', ')}</p>
                    </div>
                  </div>
                )}

                {guideDetails.hourly_rate && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-emerald-500" />
                    <span className="text-lg font-semibold text-gray-900">
                      ${guideDetails.hourly_rate}/hour
                    </span>
                  </div>
                )}

                {guideDetails.bio && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">About</p>
                    <p className="text-gray-700 whitespace-pre-wrap">{guideDetails.bio}</p>
                  </div>
                )}

                {!guideDetails.experience_level &&
                  !guideDetails.specialties?.length &&
                  !guideDetails.coverage_areas?.length && (
                    <div className="text-center py-6">
                      <Compass className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm text-gray-500 mb-2">No guide details set</p>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-sm text-amber-600 hover:underline"
                      >
                        Add your guide information
                      </button>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}

        {/* Benefits Info */}
        {!isGuide && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Guide Benefits</h3>
            <ul className="space-y-3">
              {[
                'Receive booking requests from travelers',
                'Set your own hourly rate and availability',
                'Showcase your specialties and experience',
                'Build your reputation with reviews',
                'Connect with travelers directly',
              ].map((benefit, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
