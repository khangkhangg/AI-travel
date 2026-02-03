'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  Send,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface NotificationSettings {
  email_new_trips: boolean;
  email_proposal_updates: boolean;
  email_new_reviews: boolean;
  email_weekly_digest: boolean;
  telegram_id: string | null;
  telegram_verified: boolean;
  telegram_new_trips: boolean;
  telegram_proposal_updates: boolean;
  telegram_new_reviews: boolean;
  telegram_daily_summary: boolean;
}

export default function BusinessNotificationsPanel() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/businesses/notifications');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Failed to fetch notification settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof NotificationSettings, value: boolean | string) => {
    if (!settings) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/businesses/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update settings');
      }

      const data = await response.json();
      setSettings(data);
      setSuccess('Settings updated');
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTelegramVerify = async () => {
    if (!verificationCode.trim()) return;

    setVerifying(true);
    setError(null);

    try {
      const response = await fetch('/api/businesses/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verification_code: verificationCode }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to verify Telegram');
      }

      await fetchSettings();
      setVerificationCode('');
      setSuccess('Telegram connected successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  const ToggleSwitch = ({
    enabled,
    onChange,
    disabled,
  }: {
    enabled: boolean;
    onChange: () => void;
    disabled?: boolean;
  }) => (
    <button
      onClick={onChange}
      disabled={disabled || saving}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        enabled ? 'bg-emerald-600' : 'bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">Failed to load notification settings</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
        {saving && (
          <span className="flex items-center gap-1 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving...
          </span>
        )}
        {success && (
          <span className="flex items-center gap-1 text-sm text-emerald-600">
            <Check className="w-4 h-4" />
            {success}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Email Notifications */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Email Notifications</h3>
              <p className="text-sm text-gray-500">Receive updates via email</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-900">New Trip Requests</p>
                <p className="text-sm text-gray-500">Get notified when travelers post trips matching your criteria</p>
              </div>
              <ToggleSwitch
                enabled={settings.email_new_trips}
                onChange={() => updateSetting('email_new_trips', !settings.email_new_trips)}
              />
            </div>

            <div className="flex items-center justify-between py-2 border-t border-gray-50">
              <div>
                <p className="font-medium text-gray-900">Proposal Updates</p>
                <p className="text-sm text-gray-500">When proposals are accepted or rejected</p>
              </div>
              <ToggleSwitch
                enabled={settings.email_proposal_updates}
                onChange={() => updateSetting('email_proposal_updates', !settings.email_proposal_updates)}
              />
            </div>

            <div className="flex items-center justify-between py-2 border-t border-gray-50">
              <div>
                <p className="font-medium text-gray-900">New Reviews</p>
                <p className="text-sm text-gray-500">When customers leave reviews</p>
              </div>
              <ToggleSwitch
                enabled={settings.email_new_reviews}
                onChange={() => updateSetting('email_new_reviews', !settings.email_new_reviews)}
              />
            </div>

            <div className="flex items-center justify-between py-2 border-t border-gray-50">
              <div>
                <p className="font-medium text-gray-900">Weekly Digest</p>
                <p className="text-sm text-gray-500">Summary of your business activity</p>
              </div>
              <ToggleSwitch
                enabled={settings.email_weekly_digest}
                onChange={() => updateSetting('email_weekly_digest', !settings.email_weekly_digest)}
              />
            </div>
          </div>
        </div>

        {/* Telegram Notifications */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center">
              <Send className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Telegram Notifications</h3>
              <p className="text-sm text-gray-500">Receive instant alerts via Telegram</p>
            </div>
            {settings.telegram_verified && (
              <span className="ml-auto px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                Connected
              </span>
            )}
          </div>

          {/* Telegram Setup */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telegram Username
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={settings.telegram_id || ''}
                onChange={(e) => setSettings({ ...settings, telegram_id: e.target.value })}
                placeholder="@yourusername"
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <button
                onClick={() => updateSetting('telegram_id', settings.telegram_id || '')}
                disabled={saving}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>

          {/* Verification */}
          {settings.telegram_id && !settings.telegram_verified && (
            <div className="bg-amber-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-amber-700 mb-2">
                To verify, message our bot <strong>@TripConnectBot</strong> and enter the code below:
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Verification code"
                  className="flex-1 px-4 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
                <button
                  onClick={handleTelegramVerify}
                  disabled={verifying || !verificationCode.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Verify
                </button>
              </div>
            </div>
          )}

          {/* Telegram Settings - only show when verified */}
          {settings.telegram_verified && (
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-gray-900">New Trip Requests</p>
                  <p className="text-sm text-gray-500">Instant alerts for matching trips</p>
                </div>
                <ToggleSwitch
                  enabled={settings.telegram_new_trips}
                  onChange={() => updateSetting('telegram_new_trips', !settings.telegram_new_trips)}
                />
              </div>

              <div className="flex items-center justify-between py-2 border-t border-gray-50">
                <div>
                  <p className="font-medium text-gray-900">Proposal Updates</p>
                  <p className="text-sm text-gray-500">When proposals are accepted or rejected</p>
                </div>
                <ToggleSwitch
                  enabled={settings.telegram_proposal_updates}
                  onChange={() => updateSetting('telegram_proposal_updates', !settings.telegram_proposal_updates)}
                />
              </div>

              <div className="flex items-center justify-between py-2 border-t border-gray-50">
                <div>
                  <p className="font-medium text-gray-900">New Reviews</p>
                  <p className="text-sm text-gray-500">When customers leave reviews</p>
                </div>
                <ToggleSwitch
                  enabled={settings.telegram_new_reviews}
                  onChange={() => updateSetting('telegram_new_reviews', !settings.telegram_new_reviews)}
                />
              </div>

              <div className="flex items-center justify-between py-2 border-t border-gray-50">
                <div>
                  <p className="font-medium text-gray-900">Daily Summary</p>
                  <p className="text-sm text-gray-500">End-of-day activity summary</p>
                </div>
                <ToggleSwitch
                  enabled={settings.telegram_daily_summary}
                  onChange={() => updateSetting('telegram_daily_summary', !settings.telegram_daily_summary)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
