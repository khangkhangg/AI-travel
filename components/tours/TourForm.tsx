'use client';

import { useState, useEffect } from 'react';
import {
  X, Plus, Trash2, Save, Eye, EyeOff, Globe, Lock, Upload,
  MapPin, Clock, DollarSign, Users, Calendar, FileText, Info
} from 'lucide-react';
import { Tour, TourTag, TourActivity, CreateTourRequest } from '@/lib/types/tour';

interface TourFormProps {
  tour?: Tour;
  onSave: (data: CreateTourRequest) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
}

const ACTIVITY_TYPES = [
  { value: 'activity', label: 'Activity', icon: '🎯' },
  { value: 'food', label: 'Food & Dining', icon: '🍜' },
  { value: 'transport', label: 'Transport', icon: '🚗' },
  { value: 'accommodation', label: 'Accommodation', icon: '🏨' },
  { value: 'free_time', label: 'Free Time', icon: '☕' },
  { value: 'meeting', label: 'Meeting Point', icon: '📍' },
];

export default function TourForm({ tour, onSave, onCancel, isSaving = false }: TourFormProps) {
  const [tags, setTags] = useState<TourTag[]>([]);
  const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'activities' | 'settings'>('basic');

  // Form state
  const [formData, setFormData] = useState<CreateTourRequest>({
    name: tour?.name || '',
    description: tour?.description || '',
    highlights: tour?.highlights || [],
    city: tour?.city || '',
    country: tour?.country || '',
    meetingPoint: tour?.meetingPoint || '',
    durationDays: tour?.durationDays || 1,
    durationHours: tour?.durationHours || 0,
    pricePerPerson: tour?.pricePerPerson || 0,
    priceCurrency: tour?.priceCurrency || 'USD',
    maxGroupSize: tour?.maxGroupSize || 10,
    minGroupSize: tour?.minGroupSize || 1,
    whatIncluded: tour?.whatIncluded || [],
    whatNotIncluded: tour?.whatNotIncluded || [],
    requirements: tour?.requirements || [],
    notes: tour?.notes || '',
    instructions: tour?.instructions || '',
    cancellationPolicy: tour?.cancellationPolicy || '',
    visibility: tour?.visibility || 'public',
    tagIds: tour?.tags?.map(t => t.id) || [],
    images: tour?.images?.map(img => ({ url: img.url, altText: img.altText, caption: img.caption, isCover: img.isCover })) || [],
    activities: tour?.activities || [],
  });

  // Temp inputs for array fields
  const [newHighlight, setNewHighlight] = useState('');
  const [newIncluded, setNewIncluded] = useState('');
  const [newNotIncluded, setNewNotIncluded] = useState('');
  const [newRequirement, setNewRequirement] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  // Fetch tags on mount
  useEffect(() => {
    fetch('/api/tours/tags')
      .then(res => res.json())
      .then(data => setTags(data.tags || []))
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  const addToArray = (field: keyof CreateTourRequest, value: string, setValue: (v: string) => void) => {
    if (!value.trim()) return;
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), value.trim()],
    }));
    setValue('');
  };

  const removeFromArray = (field: keyof CreateTourRequest, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index),
    }));
  };

  const toggleTag = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tagIds: prev.tagIds?.includes(tagId)
        ? prev.tagIds.filter(id => id !== tagId)
        : [...(prev.tagIds || []), tagId],
    }));
  };

  const addActivity = () => {
    const newActivity: Omit<TourActivity, 'id' | 'tourId'> = {
      dayNumber: 1,
      orderIndex: (formData.activities?.length || 0),
      title: '',
      activityType: 'activity',
      isOptional: false,
    };
    setFormData(prev => ({
      ...prev,
      activities: [...(prev.activities || []), newActivity as any],
    }));
  };

  const updateActivity = (index: number, updates: Partial<TourActivity>) => {
    setFormData(prev => ({
      ...prev,
      activities: prev.activities?.map((act, i) => i === index ? { ...act, ...updates } : act),
    }));
  };

  const removeActivity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      activities: prev.activities?.filter((_, i) => i !== index),
    }));
  };

  const addImage = () => {
    if (!newImageUrl.trim()) return;
    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), { url: newImageUrl.trim(), isCover: prev.images?.length === 0 }],
    }));
    setNewImageUrl('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-teal-600 to-cyan-600">
          <h2 className="text-xl font-bold text-white">
            {tour ? 'Edit Tour' : 'Create New Tour'}
          </h2>
          <button onClick={onCancel} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {[
            { id: 'basic', label: 'Basic Info', icon: Info },
            { id: 'content', label: 'Content', icon: FileText },
            { id: 'activities', label: 'Activities', icon: Calendar },
            { id: 'settings', label: 'Settings', icon: Globe },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'text-teal-700 border-b-2 border-teal-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tour Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Sunrise Hike at Mount Batur"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 outline-none"
                />
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="e.g., Bali"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                  <input
                    type="text"
                    required
                    value={formData.country}
                    onChange={e => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="e.g., Indonesia"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 outline-none"
                  />
                </div>
              </div>

              {/* Duration & Price */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.durationDays}
                    onChange={e => setFormData(prev => ({ ...prev, durationDays: parseInt(e.target.value) || 1 }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price per Person *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      required
                      min={0}
                      step={0.01}
                      value={formData.pricePerPerson}
                      onChange={e => setFormData(prev => ({ ...prev, pricePerPerson: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Group Size</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.maxGroupSize}
                    onChange={e => setFormData(prev => ({ ...prev, maxGroupSize: parseInt(e.target.value) || 10 }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your tour experience..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 outline-none resize-none"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tour Categories</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        formData.tagIds?.includes(tag.id)
                          ? `${tag.color} text-white`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tag.icon} {tag.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tour Images</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={e => setNewImageUrl(e.target.value)}
                    placeholder="Enter image URL..."
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 outline-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={addImage}
                    className="px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {formData.images && formData.images.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img.url}
                          alt=""
                          className={`w-20 h-20 object-cover rounded-lg ${img.isCover ? 'ring-2 ring-teal-500' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            images: prev.images?.filter((_, i) => i !== idx),
                          }))}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        {img.isCover && (
                          <span className="absolute bottom-1 left-1 text-[8px] bg-teal-500 text-white px-1 rounded">Cover</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              {/* Highlights */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tour Highlights</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newHighlight}
                    onChange={e => setNewHighlight(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addToArray('highlights', newHighlight, setNewHighlight))}
                    placeholder="Add a highlight..."
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-1 focus:ring-teal-400 outline-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => addToArray('highlights', newHighlight, setNewHighlight)}
                    className="px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-1">
                  {formData.highlights?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                      <span className="text-teal-600">✓</span>
                      <span className="flex-1 text-sm">{item}</span>
                      <button type="button" onClick={() => removeFromArray('highlights', idx)} className="text-gray-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* What's Included */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">What's Included</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newIncluded}
                    onChange={e => setNewIncluded(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addToArray('whatIncluded', newIncluded, setNewIncluded))}
                    placeholder="e.g., Hotel pickup, Breakfast..."
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:border-teal-400 outline-none text-sm"
                  />
                  <button type="button" onClick={() => addToArray('whatIncluded', newIncluded, setNewIncluded)} className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-1">
                  {formData.whatIncluded?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
                      <span className="text-green-600">✓</span>
                      <span className="flex-1 text-sm">{item}</span>
                      <button type="button" onClick={() => removeFromArray('whatIncluded', idx)} className="text-gray-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* What's Not Included */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">What's Not Included</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newNotIncluded}
                    onChange={e => setNewNotIncluded(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addToArray('whatNotIncluded', newNotIncluded, setNewNotIncluded))}
                    placeholder="e.g., Flights, Personal expenses..."
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:border-teal-400 outline-none text-sm"
                  />
                  <button type="button" onClick={() => addToArray('whatNotIncluded', newNotIncluded, setNewNotIncluded)} className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-1">
                  {formData.whatNotIncluded?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg">
                      <span className="text-red-500">✗</span>
                      <span className="flex-1 text-sm">{item}</span>
                      <button type="button" onClick={() => removeFromArray('whatNotIncluded', idx)} className="text-gray-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Requirements */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Requirements / What to Bring</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newRequirement}
                    onChange={e => setNewRequirement(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addToArray('requirements', newRequirement, setNewRequirement))}
                    placeholder="e.g., Comfortable shoes, Sunscreen..."
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:border-teal-400 outline-none text-sm"
                  />
                  <button type="button" onClick={() => addToArray('requirements', newRequirement, setNewRequirement)} className="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-1">
                  {formData.requirements?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg">
                      <span className="text-amber-600">!</span>
                      <span className="flex-1 text-sm">{item}</span>
                      <button type="button" onClick={() => removeFromArray('requirements', idx)} className="text-gray-400 hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes & Instructions */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional information..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-400 outline-none resize-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instructions for Travelers</label>
                  <textarea
                    rows={3}
                    value={formData.instructions}
                    onChange={e => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                    placeholder="e.g., Meeting point details..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-400 outline-none resize-none text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Activities Tab */}
          {activeTab === 'activities' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Daily Itinerary</h3>
                <button
                  type="button"
                  onClick={addActivity}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Activity
                </button>
              </div>

              {formData.activities && formData.activities.length > 0 ? (
                <div className="space-y-3">
                  {formData.activities.map((activity, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col gap-2">
                          <select
                            value={activity.dayNumber}
                            onChange={e => updateActivity(idx, { dayNumber: parseInt(e.target.value) })}
                            className="px-2 py-1 rounded-lg border border-gray-200 text-sm"
                          >
                            {Array.from({ length: formData.durationDays || 1 }, (_, i) => (
                              <option key={i + 1} value={i + 1}>Day {i + 1}</option>
                            ))}
                          </select>
                          <select
                            value={activity.activityType}
                            onChange={e => updateActivity(idx, { activityType: e.target.value as any })}
                            className="px-2 py-1 rounded-lg border border-gray-200 text-sm"
                          >
                            {ACTIVITY_TYPES.map(type => (
                              <option key={type.value} value={type.value}>{type.icon} {type.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={activity.title}
                            onChange={e => updateActivity(idx, { title: e.target.value })}
                            placeholder="Activity title..."
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-teal-400 outline-none text-sm"
                          />
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={activity.timeStart || ''}
                              onChange={e => updateActivity(idx, { timeStart: e.target.value })}
                              placeholder="Start time"
                              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm"
                            />
                            <input
                              type="text"
                              value={activity.timeEnd || ''}
                              onChange={e => updateActivity(idx, { timeEnd: e.target.value })}
                              placeholder="End time"
                              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm"
                            />
                            <input
                              type="text"
                              value={activity.location || ''}
                              onChange={e => updateActivity(idx, { location: e.target.value })}
                              placeholder="Location"
                              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm"
                            />
                          </div>
                          <textarea
                            value={activity.description || ''}
                            onChange={e => updateActivity(idx, { description: e.target.value })}
                            placeholder="Description (optional)"
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-teal-400 outline-none text-sm resize-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => removeActivity(idx)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No activities yet. Click "Add Activity" to start building your itinerary.</p>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Visibility</label>
                <div className="flex gap-3">
                  {[
                    { value: 'public', label: 'Public', icon: Globe, desc: 'Anyone can find and book' },
                    { value: 'unlisted', label: 'Unlisted', icon: EyeOff, desc: 'Only accessible via direct link' },
                    { value: 'private', label: 'Private', icon: Lock, desc: 'Only you can see' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, visibility: opt.value as any }))}
                      className={`flex-1 p-4 rounded-xl border-2 transition-all text-left ${
                        formData.visibility === opt.value
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <opt.icon className={`w-5 h-5 mb-2 ${formData.visibility === opt.value ? 'text-teal-600' : 'text-gray-400'}`} />
                      <p className="font-medium text-gray-900">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Meeting Point */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Point</label>
                <input
                  type="text"
                  value={formData.meetingPoint}
                  onChange={e => setFormData(prev => ({ ...prev, meetingPoint: e.target.value }))}
                  placeholder="e.g., Hotel lobby, Airport terminal 2..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-400 outline-none"
                />
              </div>

              {/* Cancellation Policy */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cancellation Policy</label>
                <textarea
                  rows={3}
                  value={formData.cancellationPolicy}
                  onChange={e => setFormData(prev => ({ ...prev, cancellationPolicy: e.target.value }))}
                  placeholder="e.g., Free cancellation up to 24 hours before..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-400 outline-none resize-none"
                />
              </div>

              {/* Group Size */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Group Size</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.minGroupSize}
                    onChange={e => setFormData(prev => ({ ...prev, minGroupSize: parseInt(e.target.value) || 1 }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Group Size</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.maxGroupSize}
                    onChange={e => setFormData(prev => ({ ...prev, maxGroupSize: parseInt(e.target.value) || 10 }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-400 outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium"
          >
            Cancel
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors font-medium"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Tour'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
