'use client';

import { useState } from 'react';
import {
  Globe,
  Lock,
  Mail,
  Check,
  Loader2,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import { ProfileVisibility } from '@/lib/types/user';

interface PrivacyPanelProps {
  profileVisibility: ProfileVisibility;
  email: string;
  emailVerified: boolean;
  onToggleVisibility: () => Promise<void>;
  onResendVerification?: () => Promise<void>;
  onDeleteAccount?: () => void;
}

export default function PrivacyPanel({
  profileVisibility,
  email,
  emailVerified,
  onToggleVisibility,
  onResendVerification,
  onDeleteAccount,
}: PrivacyPanelProps) {
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);

  const handleToggleVisibility = async () => {
    setSavingVisibility(true);
    try {
      await onToggleVisibility();
    } finally {
      setSavingVisibility(false);
    }
  };

  const handleResendVerification = async () => {
    if (!onResendVerification) return;
    setSendingVerification(true);
    try {
      await onResendVerification();
    } finally {
      setSendingVerification(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900">Privacy & Security</h2>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Profile Visibility */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  profileVisibility === 'public'
                    ? 'bg-emerald-100'
                    : 'bg-gray-100'
                }`}
              >
                {profileVisibility === 'public' ? (
                  <Globe className="w-6 h-6 text-emerald-600" />
                ) : (
                  <Lock className="w-6 h-6 text-gray-500" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">Profile Visibility</p>
                <p className="text-sm text-gray-500">
                  {profileVisibility === 'public'
                    ? 'Anyone can view your public profile'
                    : 'Only you can see your profile'}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleVisibility}
              disabled={savingVisibility}
              className={`relative w-14 h-8 rounded-full transition-colors disabled:opacity-50 ${
                profileVisibility === 'public' ? 'bg-emerald-500' : 'bg-gray-300'
              }`}
            >
              {savingVisibility ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                </div>
              ) : (
                <div
                  className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all ${
                    profileVisibility === 'public' ? 'left-7' : 'left-1'
                  }`}
                />
              )}
            </button>
          </div>
        </div>

        {/* Email Verification */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  emailVerified ? 'bg-emerald-100' : 'bg-amber-100'
                }`}
              >
                <Mail
                  className={`w-6 h-6 ${
                    emailVerified ? 'text-emerald-600' : 'text-amber-600'
                  }`}
                />
              </div>
              <div>
                <p className="font-medium text-gray-900">Email Verification</p>
                <p className="text-sm text-gray-500">{email}</p>
              </div>
            </div>
            {emailVerified ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-emerald-700 bg-emerald-50 rounded-lg">
                <Check className="w-4 h-4" />
                Verified
              </span>
            ) : (
              <button
                onClick={handleResendVerification}
                disabled={sendingVerification || !onResendVerification}
                className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors disabled:opacity-50"
              >
                {sendingVerification ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </span>
                ) : (
                  'Verify Now'
                )}
              </button>
            )}
          </div>

          {!emailVerified && (
            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-sm text-amber-700">
                Please verify your email to unlock all features including public profile sharing
                and receiving tips from other travelers.
              </p>
            </div>
          )}
        </div>

        {/* Data & Privacy Info */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Your Data</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              Your personal information is stored securely and only shared according to your
              privacy settings.
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-500">
              <li>Public profile shows your name, bio, badges, and travel history</li>
              <li>Email and phone are always kept private</li>
              <li>You can download or delete your data at any time</li>
            </ul>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl border border-red-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-red-700">Danger Zone</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Deleting your account will permanently remove all your data, including itineraries,
            travel history, and badges. This action cannot be undone.
          </p>
          <button
            onClick={onDeleteAccount}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
