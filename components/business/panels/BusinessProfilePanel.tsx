'use client';

import { useState } from 'react';
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  Globe,
  Instagram,
  MessageCircle,
  Send,
  Check,
  Loader2,
  Upload,
  Link,
  AlertCircle,
} from 'lucide-react';

interface CoverageArea {
  city: string;
  country: string;
}

interface ContactInfo {
  email?: string;
  phone?: string;
  whatsapp?: string;
}

interface SocialLinks {
  website?: string;
  instagram?: string;
  telegram?: string;
}

interface BusinessProfilePanelProps {
  subSection: 'business-info' | 'contact-social';
  business: {
    id: string;
    businessName: string;
    businessType: string;
    description: string;
    logoUrl?: string;
    handle?: string;
    coverageAreas: CoverageArea[];
    contactInfo: ContactInfo;
    socialLinks: SocialLinks;
  };
  onSave: (data: Partial<{
    businessName: string;
    description: string;
    handle: string;
    coverageAreas: CoverageArea[];
    contactInfo: ContactInfo;
    socialLinks: SocialLinks;
  }>) => Promise<void>;
  onLogoUpload: (file: File) => Promise<void>;
}

export default function BusinessProfilePanel({
  subSection,
  business,
  onSave,
  onLogoUpload,
}: BusinessProfilePanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [handleError, setHandleError] = useState<string | null>(null);

  // Form states for business info
  const [businessName, setBusinessName] = useState(business.businessName);
  const [description, setDescription] = useState(business.description);
  const [handle, setHandle] = useState(business.handle || '');
  const [coverageAreas, setCoverageAreas] = useState<CoverageArea[]>(business.coverageAreas);

  // Form states for contact/social
  const [contactInfo, setContactInfo] = useState<ContactInfo>(business.contactInfo);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(business.socialLinks);

  const validateHandle = (value: string): boolean => {
    if (!value) return true; // Empty is allowed
    const handleRegex = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;
    return handleRegex.test(value);
  };

  const handleHandleChange = (value: string) => {
    // Auto-format: lowercase, replace spaces with hyphens
    const formatted = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setHandle(formatted);
    if (formatted && !validateHandle(formatted)) {
      setHandleError('3-50 characters. Only lowercase letters, numbers, and hyphens. Must start and end with letter or number.');
    } else {
      setHandleError(null);
    }
  };

  const handleSave = async () => {
    if (handle && !validateHandle(handle)) {
      setHandleError('Invalid handle format');
      return;
    }

    setSaving(true);
    setHandleError(null);
    try {
      if (subSection === 'business-info') {
        await onSave({ businessName, description, handle, coverageAreas });
      } else {
        await onSave({ contactInfo, socialLinks });
      }
      setIsEditing(false);
    } catch (error: any) {
      if (error.message?.includes('handle') || error.message?.includes('taken')) {
        setHandleError(error.message);
      } else {
        console.error('Failed to save:', error);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      await onLogoUpload(file);
    } catch (error) {
      console.error('Failed to upload logo:', error);
    } finally {
      setUploadingLogo(false);
    }
  };

  const addCoverageArea = () => {
    setCoverageAreas([...coverageAreas, { city: '', country: '' }]);
  };

  const removeCoverageArea = (index: number) => {
    setCoverageAreas(coverageAreas.filter((_, i) => i !== index));
  };

  if (subSection === 'business-info') {
    return (
      <div className="h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Business Info</h2>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            >
              Edit
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Logo */}
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
              {business.logoUrl ? (
                <img src={business.logoUrl} alt={business.businessName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Business Logo</h3>
              <p className="text-sm text-gray-500 mb-3">Recommended: 400x400px, JPG or PNG</p>
              <label className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
                {uploadingLogo ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Upload Logo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                  disabled={uploadingLogo}
                />
              </label>
            </div>
          </div>

          {/* Business Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
            {isEditing ? (
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900">{business.businessName}</p>
            )}
          </div>

          {/* Handle / Custom URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <Link className="w-4 h-4" />
                Custom URL Handle
              </span>
            </label>
            {isEditing ? (
              <div>
                <div className="flex items-center">
                  <span className="px-4 py-2.5 bg-gray-100 border border-r-0 border-gray-200 rounded-l-lg text-gray-500 text-sm">
                    /business/
                  </span>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => handleHandleChange(e.target.value)}
                    placeholder="your-business-name"
                    className={`flex-1 px-4 py-2.5 border rounded-r-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                      handleError ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                </div>
                {handleError && (
                  <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {handleError}
                  </p>
                )}
                <p className="mt-1.5 text-xs text-gray-500">
                  Create a memorable URL for your business profile. Leave empty to use the default ID.
                </p>
              </div>
            ) : (
              <div>
                {business.handle ? (
                  <p className="text-gray-900 font-mono text-sm">/business/{business.handle}</p>
                ) : (
                  <p className="text-gray-500 text-sm">Not set - using default ID</p>
                )}
              </div>
            )}
          </div>

          {/* Business Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
            <p className="text-gray-900 capitalize">{business.businessType.replace('_', ' ')}</p>
            <p className="text-xs text-gray-500 mt-1">Business type cannot be changed</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            {isEditing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                placeholder="Tell customers about your business..."
              />
            ) : (
              <p className="text-gray-900 whitespace-pre-wrap">{business.description || 'No description provided'}</p>
            )}
          </div>

          {/* Coverage Areas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Coverage Areas</label>
            {isEditing ? (
              <div className="space-y-2">
                {coverageAreas.map((area, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={area.city}
                      onChange={(e) => {
                        const updated = [...coverageAreas];
                        updated[index].city = e.target.value;
                        setCoverageAreas(updated);
                      }}
                      placeholder="City"
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      value={area.country}
                      onChange={(e) => {
                        const updated = [...coverageAreas];
                        updated[index].country = e.target.value;
                        setCoverageAreas(updated);
                      }}
                      placeholder="Country"
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      onClick={() => removeCoverageArea(index)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={addCoverageArea}
                  className="text-sm text-emerald-600 hover:text-emerald-700"
                >
                  + Add coverage area
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {coverageAreas.length > 0 ? (
                  coverageAreas.map((area, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-full text-sm"
                    >
                      <MapPin className="w-3 h-3 text-gray-500" />
                      {area.city}, {area.country}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">No coverage areas specified</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Contact & Social section
  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900">Contact & Social</h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Contact Information */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
          <div className="space-y-4">
            {/* Email */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                <Mail className="w-5 h-5 text-gray-500" />
              </div>
              {isEditing ? (
                <input
                  type="email"
                  value={contactInfo.email || ''}
                  onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                  placeholder="contact@business.com"
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                <span className="text-gray-900">{contactInfo.email || 'Not set'}</span>
              )}
            </div>

            {/* Phone */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                <Phone className="w-5 h-5 text-gray-500" />
              </div>
              {isEditing ? (
                <input
                  type="tel"
                  value={contactInfo.phone || ''}
                  onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                <span className="text-gray-900">{contactInfo.phone || 'Not set'}</span>
              )}
            </div>

            {/* WhatsApp */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-gray-500" />
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={contactInfo.whatsapp || ''}
                  onChange={(e) => setContactInfo({ ...contactInfo, whatsapp: e.target.value })}
                  placeholder="WhatsApp number"
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                <span className="text-gray-900">{contactInfo.whatsapp || 'Not set'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Social Links</h3>
          <div className="space-y-4">
            {/* Website */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                <Globe className="w-5 h-5 text-gray-500" />
              </div>
              {isEditing ? (
                <input
                  type="url"
                  value={socialLinks.website || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
                  placeholder="https://yourbusiness.com"
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                <span className="text-gray-900">{socialLinks.website || 'Not set'}</span>
              )}
            </div>

            {/* Instagram */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                <Instagram className="w-5 h-5 text-gray-500" />
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={socialLinks.instagram || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                  placeholder="@yourbusiness"
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                <span className="text-gray-900">{socialLinks.instagram || 'Not set'}</span>
              )}
            </div>

            {/* Telegram */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                <Send className="w-5 h-5 text-gray-500" />
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={socialLinks.telegram || ''}
                  onChange={(e) => setSocialLinks({ ...socialLinks, telegram: e.target.value })}
                  placeholder="@yourbusiness"
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                <span className="text-gray-900">{socialLinks.telegram || 'Not set'}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
