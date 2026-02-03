'use client';

import { useState, useRef } from 'react';
import {
  User,
  Mail,
  MapPin,
  Phone,
  Camera,
  Check,
  Edit3,
  X,
  Loader2,
} from 'lucide-react';

interface PersonalInfoPanelProps {
  user: {
    id: string;
    fullName?: string;
    username?: string;
    email: string;
    emailVerified?: boolean;
    avatarUrl?: string;
    location?: string;
    phone?: string;
    bio?: string;
  };
  onSave: (data: {
    fullName: string;
    username: string;
    location: string;
    phone: string;
    bio: string;
  }) => Promise<void>;
  onAvatarUpload: (file: File) => Promise<void>;
}

const MAX_BIO_WORDS = 600;

const countWords = (text: string): number => {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

export default function PersonalInfoPanel({
  user,
  onSave,
  onAvatarUpload,
}: PersonalInfoPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editForm, setEditForm] = useState({
    fullName: user.fullName || '',
    username: user.username || '',
    location: user.location || '',
    phone: user.phone || '',
    bio: user.bio || '',
  });

  const bioWordCount = countWords(editForm.bio);

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const words = countWords(newText);

    if (words <= MAX_BIO_WORDS) {
      setEditForm(prev => ({ ...prev, bio: newText }));
    } else {
      const wordsArray = newText.trim().split(/\s+/);
      const truncated = wordsArray.slice(0, MAX_BIO_WORDS).join(' ');
      setEditForm(prev => ({ ...prev, bio: truncated }));
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }

    setUploadingAvatar(true);
    setError(null);
    try {
      await onAvatarUpload(file);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(editForm);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm({
      fullName: user.fullName || '',
      username: user.username || '',
      location: user.location || '',
      phone: user.phone || '',
      bio: user.bio || '',
    });
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
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
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Save
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Avatar Section */}
        <div className="flex items-start gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-xl overflow-hidden bg-emerald-100">
              {uploadingAvatar ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                </div>
              ) : user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-12 h-12 text-emerald-600" />
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-2 -right-2 p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 disabled:opacity-50 transition-colors border border-gray-200"
              title="Change avatar"
            >
              <Camera className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="flex-1">
            <h3 className="font-medium text-gray-900">Profile Photo</h3>
            <p className="text-sm text-gray-500 mt-1">
              Upload a photo to personalize your profile. Max 5MB.
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editForm.fullName}
                onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Your name"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
              />
            ) : (
              <p className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900">
                {user.fullName || <span className="text-gray-400">Not set</span>}
              </p>
            )}
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            {isEditing ? (
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm(prev => ({
                    ...prev,
                    username: e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '')
                  }))}
                  placeholder="username"
                  className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
                />
              </div>
            ) : (
              <p className="px-4 py-2.5 bg-gray-50 rounded-lg text-gray-900">
                {user.username ? `@${user.username}` : <span className="text-gray-400">Not set</span>}
              </p>
            )}
            {isEditing && (
              <p className="text-xs text-gray-400 mt-1">
                3-30 characters, letters, numbers, underscores, dots
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-lg">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900">{user.email}</span>
              {user.emailVerified && (
                <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <Check className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            {isEditing ? (
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="City, Country"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-lg">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900">
                  {user.location || <span className="text-gray-400">Not set</span>}
                </span>
              </div>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            {isEditing ? (
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1 234 567 8900"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-lg">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900">
                  {user.phone || <span className="text-gray-400">Not set</span>}
                </span>
              </div>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            {isEditing ? (
              <div>
                <textarea
                  value={editForm.bio}
                  onChange={handleBioChange}
                  placeholder="Tell us about yourself, your travel experiences, favorite destinations..."
                  rows={5}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors resize-none"
                />
                <div className="flex justify-end mt-1">
                  <span className={`text-xs ${
                    bioWordCount > MAX_BIO_WORDS * 0.9
                      ? bioWordCount >= MAX_BIO_WORDS
                        ? 'text-red-500'
                        : 'text-amber-500'
                      : 'text-gray-400'
                  }`}>
                    {bioWordCount} / {MAX_BIO_WORDS} words
                  </span>
                </div>
              </div>
            ) : (
              <div className="px-4 py-2.5 bg-gray-50 rounded-lg min-h-[80px]">
                {user.bio ? (
                  <p className="text-gray-900 whitespace-pre-wrap">{user.bio}</p>
                ) : (
                  <p className="text-gray-400">No bio added yet</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
