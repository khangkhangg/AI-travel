'use client';

import { useState } from 'react';
import {
  Globe,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  Award,
  Check,
} from 'lucide-react';
import {
  UserSocialLink,
  UserPaymentLink,
  SocialPlatform,
  PaymentPlatform,
  SOCIAL_PLATFORMS,
  PAYMENT_PLATFORMS,
} from '@/lib/types/user';

interface LinksPanelProps {
  socialLinks: UserSocialLink[];
  paymentLinks: UserPaymentLink[];
  onAddSocialLink: () => void;
  onAddPaymentLink: () => void;
  onDeleteSocialLink: (id: string) => void;
  onDeletePaymentLink: (id: string) => void;
}

export default function LinksPanel({
  socialLinks,
  paymentLinks,
  onAddSocialLink,
  onAddPaymentLink,
  onDeleteSocialLink,
  onDeletePaymentLink,
}: LinksPanelProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (value: string, id: string) => {
    navigator.clipboard.writeText(value);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900">Links</h2>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Social Links */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Social Links</h3>
            <button
              onClick={onAddSocialLink}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {socialLinks.length > 0 ? (
            <div className="space-y-2">
              {socialLinks.map((link) => {
                const platform = SOCIAL_PLATFORMS[link.platform as SocialPlatform];
                return (
                  <div
                    key={link.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 group"
                  >
                    <span className="text-xl w-8 text-center">{platform?.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{platform?.label}</p>
                      <p className="text-sm text-gray-500 truncate">{link.value}</p>
                    </div>
                    <a
                      href={link.value.startsWith('http') ? link.value : `https://${link.value}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => onDeleteSocialLink(link.id)}
                      className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Globe className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500 mb-2">No social links added</p>
              <button
                onClick={onAddSocialLink}
                className="text-sm text-emerald-600 hover:underline"
              >
                Add your first social link
              </button>
            </div>
          )}
        </div>

        {/* Payment/Tip Links */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Tip Links</h3>
              <p className="text-sm text-gray-500">Let others support your travel content</p>
            </div>
            <button
              onClick={onAddPaymentLink}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          {paymentLinks.length > 0 ? (
            <div className="space-y-2">
              {paymentLinks.map((link) => {
                const platform = PAYMENT_PLATFORMS[link.platform as PaymentPlatform];
                const isCopied = copiedId === link.id;
                return (
                  <div
                    key={link.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 group"
                  >
                    <span className="text-xl w-8 text-center">{platform?.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{platform?.label}</p>
                        {link.isPrimary && (
                          <span className="px-1.5 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">{link.value}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(link.value, link.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Copy to clipboard"
                    >
                      {isCopied ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => onDeletePaymentLink(link.id)}
                      className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Award className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500 mb-2">No tip links added</p>
              <button
                onClick={onAddPaymentLink}
                className="text-sm text-emerald-600 hover:underline"
              >
                Add your first tip method
              </button>
            </div>
          )}
        </div>

        {/* Tips for visibility */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
          <h4 className="font-medium text-blue-900 mb-2">Pro tip</h4>
          <p className="text-sm text-blue-700">
            Links you add here will appear on your public profile. Social links help travelers
            connect with you, while tip links allow them to support your travel content.
          </p>
        </div>
      </div>
    </div>
  );
}
