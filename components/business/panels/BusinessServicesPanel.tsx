'use client';

import { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Loader2,
  DollarSign,
} from 'lucide-react';

interface Service {
  id: string;
  service_name: string;
  description: string;
  price_type: 'fixed' | 'hourly' | 'daily' | 'custom';
  base_price: number;
  currency: string;
  add_ons: { name: string; price: number }[];
  is_active: boolean;
}

interface BusinessServicesPanelProps {
  businessId: string;
}

export default function BusinessServicesPanel({ businessId }: BusinessServicesPanelProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState<{
    service_name: string;
    description: string;
    price_type: 'fixed' | 'hourly' | 'daily' | 'custom';
    base_price: number;
    currency: string;
    add_ons: { name: string; price: number }[];
  }>({
    service_name: '',
    description: '',
    price_type: 'fixed',
    base_price: 0,
    currency: 'USD',
    add_ons: [],
  });

  useEffect(() => {
    fetchServices();
  }, [businessId]);

  const fetchServices = async () => {
    try {
      const response = await fetch(`/api/businesses/${businessId}/services`);
      if (response.ok) {
        const data = await response.json();
        setServices(data.services || []);
      }
    } catch (err) {
      console.error('Failed to fetch services:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingId
        ? `/api/businesses/${businessId}/services/${editingId}`
        : `/api/businesses/${businessId}/services`;

      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchServices();
        resetForm();
      }
    } catch (err) {
      console.error('Failed to save service:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const response = await fetch(`/api/businesses/${businessId}/services/${serviceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchServices();
      }
    } catch (err) {
      console.error('Failed to delete service:', err);
    }
  };

  const handleEdit = (service: Service) => {
    setFormData({
      service_name: service.service_name,
      description: service.description,
      price_type: service.price_type,
      base_price: service.base_price,
      currency: service.currency,
      add_ons: service.add_ons || [],
    });
    setEditingId(service.id);
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      service_name: '',
      description: '',
      price_type: 'fixed',
      base_price: 0,
      currency: 'USD',
      add_ons: [],
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const addAddOn = () => {
    setFormData({
      ...formData,
      add_ons: [...formData.add_ons, { name: '', price: 0 }],
    });
  };

  const removeAddOn = (index: number) => {
    setFormData({
      ...formData,
      add_ons: formData.add_ons.filter((_, i) => i !== index),
    });
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const priceTypeLabels: Record<string, string> = {
    fixed: 'Fixed Price',
    hourly: 'Per Hour',
    daily: 'Per Day',
    custom: 'Custom',
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Services</h2>
          <p className="text-sm text-gray-500 mt-1">
            {services.length} {services.length === 1 ? 'service' : 'services'}
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Service
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">
              {editingId ? 'Edit Service' : 'Add New Service'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Name
                </label>
                <input
                  type="text"
                  value={formData.service_name}
                  onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., Airport Transfer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder="Describe what's included in this service..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Type
                  </label>
                  <select
                    value={formData.price_type}
                    onChange={(e) => setFormData({ ...formData, price_type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="fixed">Fixed Price</option>
                    <option value="hourly">Per Hour</option>
                    <option value="daily">Per Day</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base Price
                  </label>
                  <div className="flex">
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="px-3 py-2 border border-r-0 border-gray-200 rounded-l-lg bg-gray-50"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="VND">VND</option>
                    </select>
                    <input
                      type="number"
                      value={formData.base_price}
                      onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-r-lg focus:ring-2 focus:ring-emerald-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              {/* Add-ons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add-ons (Optional)
                </label>
                <div className="space-y-2">
                  {formData.add_ons.map((addOn, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={addOn.name}
                        onChange={(e) => {
                          const updated = [...formData.add_ons];
                          updated[index].name = e.target.value;
                          setFormData({ ...formData, add_ons: updated });
                        }}
                        placeholder="Add-on name"
                        className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                      />
                      <input
                        type="number"
                        value={addOn.price}
                        onChange={(e) => {
                          const updated = [...formData.add_ons];
                          updated[index].price = parseFloat(e.target.value) || 0;
                          setFormData({ ...formData, add_ons: updated });
                        }}
                        placeholder="Price"
                        className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                        min="0"
                        step="0.01"
                      />
                      <button
                        onClick={() => removeAddOn(index)}
                        className="p-1.5 text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addAddOn}
                    className="text-sm text-emerald-600 hover:text-emerald-700"
                  >
                    + Add add-on
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !formData.service_name}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editingId ? 'Update' : 'Add'} Service
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Services List */}
        {services.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No services yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Add services to show customers what you offer
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {services.map((service) => (
              <div
                key={service.id}
                className={`bg-white rounded-xl border p-5 ${
                  service.is_active ? 'border-gray-100' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{service.service_name}</h4>
                      {!service.is_active && (
                        <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs">
                          Inactive
                        </span>
                      )}
                    </div>
                    {service.description && (
                      <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                    )}

                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1 text-emerald-600">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold">
                          {formatPrice(service.base_price, service.currency)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {priceTypeLabels[service.price_type]}
                        </span>
                      </div>

                      {service.add_ons && service.add_ons.length > 0 && (
                        <span className="text-sm text-gray-500">
                          +{service.add_ons.length} add-ons
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(service)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
