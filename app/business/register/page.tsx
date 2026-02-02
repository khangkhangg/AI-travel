'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  Building2,
  Car,
  Compass,
  Heart,
  Users,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Shield,
  Globe,
  Star,
  Phone,
  Mail,
  Instagram,
  Facebook,
} from 'lucide-react';

type BusinessType = 'guide' | 'hotel' | 'transport' | 'experience' | 'health';

interface BusinessFormData {
  business_type: BusinessType | '';
  business_name: string;
  description: string;
  logo_url: string;
  coverage_areas: { city: string; country?: string }[];
  contact_info: {
    phone?: string;
    email?: string;
    website?: string;
  };
  social_links: {
    instagram?: string;
    facebook?: string;
  };
  details: Record<string, any>;
  services: {
    service_name: string;
    description: string;
    price_type: 'fixed' | 'per_person' | 'per_hour' | 'per_day' | 'custom';
    base_price: number;
    currency: string;
  }[];
}

const BUSINESS_TYPES = [
  { id: 'guide' as const, label: 'Tour Guide', icon: Compass, color: 'teal', description: 'Lead tours and create experiences' },
  { id: 'hotel' as const, label: 'Hotel / Accommodation', icon: Building2, color: 'blue', description: 'Offer places to stay' },
  { id: 'transport' as const, label: 'Transportation', icon: Car, color: 'purple', description: 'Provide rides and transfers' },
  { id: 'experience' as const, label: 'Experience Provider', icon: Star, color: 'orange', description: 'Offer activities and experiences' },
  { id: 'health' as const, label: 'Health Services', icon: Heart, color: 'pink', description: 'Travel health and wellness' },
];

const POPULAR_CITIES = [
  'Tokyo', 'Paris', 'New York', 'London', 'Barcelona', 'Rome', 'Bangkok',
  'Dubai', 'Singapore', 'Sydney', 'Bali', 'Hanoi', 'Ho Chi Minh City',
];

export default function BusinessRegistrationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [existingBusiness, setExistingBusiness] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newCity, setNewCity] = useState('');

  const [formData, setFormData] = useState<BusinessFormData>({
    business_type: '',
    business_name: '',
    description: '',
    logo_url: '',
    coverage_areas: [],
    contact_info: {},
    social_links: {},
    details: {},
    services: [],
  });

  // Check authentication and existing business
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/businesses?self=true');
        const data = await response.json();

        if (data.isBusiness) {
          setExistingBusiness(data.business);
        }
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register business');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const addCoverageArea = (city: string) => {
    if (!formData.coverage_areas.some(a => a.city === city)) {
      setFormData(prev => ({
        ...prev,
        coverage_areas: [...prev.coverage_areas, { city }],
      }));
    }
    setNewCity('');
  };

  const removeCoverageArea = (city: string) => {
    setFormData(prev => ({
      ...prev,
      coverage_areas: prev.coverage_areas.filter(a => a.city !== city),
    }));
  };

  const addService = () => {
    setFormData(prev => ({
      ...prev,
      services: [...prev.services, {
        service_name: '',
        description: '',
        price_type: 'fixed',
        base_price: 0,
        currency: 'USD',
      }],
    }));
  };

  const updateService = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map((s, i) => i === index ? { ...s, [field]: value } : s),
    }));
  };

  const removeService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }));
  };

  const getTypeColor = () => {
    const type = BUSINESS_TYPES.find(t => t.id === formData.business_type);
    return type?.color || 'teal';
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-teal-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Sign In Required</h1>
          <p className="text-gray-600 mb-6">
            Please sign in to register your business on our marketplace.
          </p>
          <Link
            href="/api/auth/login?returnTo=/business/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
          >
            Sign In to Continue
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (existingBusiness) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Already Registered!</h1>
          <p className="text-gray-600 mb-6">
            You already have a business registered: <strong>{existingBusiness.business_name}</strong>
          </p>
          <Link
            href="/business"
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Welcome to the Marketplace!</h1>
          <p className="text-gray-600 mb-6">
            Your business is now registered. Start browsing trips and submitting proposals!
          </p>
          <Link
            href="/business"
            className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-teal-700 hover:text-teal-800">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Back to Home</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Step {step} of 4</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map(s => (
                  <div
                    key={s}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      s <= step ? 'bg-teal-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Hero Section */}
        {step === 1 && (
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm font-medium mb-6">
              <Building2 className="w-4 h-4" />
              Business Marketplace
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Join Our Travel Marketplace
            </h1>
            <p className="text-lg text-gray-600 max-w-lg mx-auto">
              Connect with travelers looking for your services. Submit proposals and grow your business.
            </p>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Step 1: Choose Business Type */}
          {step === 1 && (
            <div className="p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-2">What type of business are you?</h2>
              <p className="text-gray-500 mb-6">Select the category that best describes your services</p>

              <div className="grid gap-3">
                {BUSINESS_TYPES.map(type => {
                  const Icon = type.icon;
                  const isSelected = formData.business_type === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setFormData(prev => ({ ...prev, business_type: type.id }))}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? `border-${type.color}-500 bg-${type.color}-50`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isSelected ? `bg-${type.color}-100` : 'bg-gray-100'
                      }`}>
                        <Icon className={`w-6 h-6 ${isSelected ? `text-${type.color}-600` : 'text-gray-500'}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                          {type.label}
                        </h3>
                        <p className="text-sm text-gray-500">{type.description}</p>
                      </div>
                      {isSelected && (
                        <CheckCircle className={`w-6 h-6 text-${type.color}-500`} />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!formData.business_type}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Basic Info */}
          {step === 2 && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Business Details</h2>
                  <p className="text-sm text-gray-500">Tell travelers about your business</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.business_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                    placeholder="e.g., Sunrise Tours Tokyo"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your business, what you offer, and what makes you special..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Coverage Areas <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-3">Select cities where you provide services</p>

                  {formData.coverage_areas.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.coverage_areas.map(area => (
                        <span
                          key={area.city}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm"
                        >
                          <MapPin className="w-3 h-3" />
                          {area.city}
                          <button
                            onClick={() => removeCoverageArea(area.city)}
                            className="ml-1 hover:text-teal-900"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && newCity && addCoverageArea(newCity)}
                      placeholder="Add a city..."
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all text-sm"
                    />
                    <button
                      onClick={() => newCity && addCoverageArea(newCity)}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {POPULAR_CITIES.filter(c => !formData.coverage_areas.some(a => a.city === c)).slice(0, 8).map(city => (
                      <button
                        key={city}
                        onClick={() => addCoverageArea(city)}
                        className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200 transition-colors"
                      >
                        + {city}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!formData.business_name.trim() || !formData.description.trim() || formData.coverage_areas.length === 0}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Contact & Services */}
          {step === 3 && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Contact & Services</h2>
                  <p className="text-sm text-gray-500">How can travelers reach you and what do you offer?</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        value={formData.contact_info.phone || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          contact_info: { ...prev.contact_info, phone: e.target.value }
                        }))}
                        placeholder="+1 234 567 8900"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={formData.contact_info.email || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          contact_info: { ...prev.contact_info, email: e.target.value }
                        }))}
                        placeholder="contact@business.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.social_links.instagram || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          social_links: { ...prev.social_links, instagram: e.target.value }
                        }))}
                        placeholder="@yourbusiness"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="url"
                        value={formData.contact_info.website || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          contact_info: { ...prev.contact_info, website: e.target.value }
                        }))}
                        placeholder="https://yourbusiness.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Services */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">Services You Offer</h3>
                      <p className="text-sm text-gray-500">Add services with pricing (optional, can add later)</p>
                    </div>
                    <button
                      onClick={addService}
                      className="px-3 py-1.5 bg-teal-100 text-teal-700 rounded-lg text-sm font-medium hover:bg-teal-200 transition-colors"
                    >
                      + Add Service
                    </button>
                  </div>

                  {formData.services.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                      <p className="text-gray-500 text-sm">No services added yet. You can add them later from your dashboard.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.services.map((service, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-xl">
                          <div className="flex justify-between mb-3">
                            <span className="text-sm font-medium text-gray-700">Service #{index + 1}</span>
                            <button
                              onClick={() => removeService(index)}
                              className="text-red-500 text-sm hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="text"
                              value={service.service_name}
                              onChange={(e) => updateService(index, 'service_name', e.target.value)}
                              placeholder="Service name"
                              className="col-span-2 px-3 py-2 rounded-lg border border-gray-200 focus:border-teal-500 outline-none text-sm"
                            />
                            <select
                              value={service.price_type}
                              onChange={(e) => updateService(index, 'price_type', e.target.value)}
                              className="px-3 py-2 rounded-lg border border-gray-200 focus:border-teal-500 outline-none text-sm"
                            >
                              <option value="fixed">Fixed Price</option>
                              <option value="per_person">Per Person</option>
                              <option value="per_hour">Per Hour</option>
                              <option value="per_day">Per Day</option>
                              <option value="custom">Custom</option>
                            </select>
                            <input
                              type="number"
                              value={service.base_price}
                              onChange={(e) => updateService(index, 'base_price', parseFloat(e.target.value) || 0)}
                              placeholder="Price (USD)"
                              className="px-3 py-2 rounded-lg border border-gray-200 focus:border-teal-500 outline-none text-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {step === 4 && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Review & Submit</h2>
                  <p className="text-sm text-gray-500">Make sure everything looks good</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-500">Business Type</span>
                  <span className="font-medium text-gray-900">
                    {BUSINESS_TYPES.find(t => t.id === formData.business_type)?.label}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-500">Business Name</span>
                  <span className="font-medium text-gray-900">{formData.business_name}</span>
                </div>
                <div className="py-2 border-b border-gray-200">
                  <span className="text-gray-500 block mb-1">Description</span>
                  <span className="text-gray-900 text-sm">{formData.description}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-500">Coverage Areas</span>
                  <span className="font-medium text-gray-900">
                    {formData.coverage_areas.map(a => a.city).join(', ')}
                  </span>
                </div>
                {formData.contact_info.phone && (
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-500">Phone</span>
                    <span className="font-medium text-gray-900">{formData.contact_info.phone}</span>
                  </div>
                )}
                {formData.contact_info.email && (
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-500">Email</span>
                    <span className="font-medium text-gray-900">{formData.contact_info.email}</span>
                  </div>
                )}
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Services</span>
                  <span className="font-medium text-gray-900">{formData.services.length} services</span>
                </div>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      Complete Registration
                      <CheckCircle className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Benefits Section */}
        {step === 1 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Globe,
                title: 'Reach Travelers',
                description: 'Connect with travelers actively looking for services in your area.',
              },
              {
                icon: Users,
                title: 'Direct Proposals',
                description: 'Submit proposals directly to travelers planning their trips.',
              },
              {
                icon: Star,
                title: 'Build Reputation',
                description: 'Earn reviews and ratings to grow your business.',
              },
            ].map((benefit, index) => (
              <div key={index} className="bg-white/50 backdrop-blur-sm rounded-xl p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-6 h-6 text-teal-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-sm text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
