import React, { useState } from 'react';
import { Edit3, Plus, Sparkles, X } from 'lucide-react';
import { INITIAL_SHOWCASE_SERVICES } from '../../config/brandAssets';
import { supabase } from '../../lib/supabase';
import { ServiceRow } from '../../types/database';

interface AdminServicesProps {
  services: ServiceRow[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

interface ServiceFormState {
  id: string | null;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
}

const EMPTY_FORM: ServiceFormState = {
  id: null,
  name: '',
  description: '',
  duration_minutes: 60,
  price: 85,
  is_active: true,
};

export const AdminServices: React.FC<AdminServicesProps> = ({
  services,
  loading,
  onRefresh,
  onNotify,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formState, setFormState] = useState<ServiceFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const openCreateDrawer = () => {
    setFormState(EMPTY_FORM);
    setDrawerOpen(true);
  };

  const openEditDrawer = (service: ServiceRow) => {
    setFormState({
      id: service.id,
      name: service.name,
      description: service.description || '',
      duration_minutes: Number(service.duration_minutes) || 60,
      price: Number(service.price) || 0,
      is_active: Boolean(service.is_active),
    });
    setDrawerOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formState.name.trim();
    if (!trimmedName) {
      onNotify('Service name is required.', 'error');
      return;
    }
    if (formState.duration_minutes < 5) {
      onNotify('Duration must be at least 5 minutes.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: trimmedName,
        description: formState.description.trim() || null,
        duration_minutes: Number(formState.duration_minutes),
        price: Number(formState.price),
        is_active: formState.is_active,
      };

      if (formState.id) {
        const { error } = await supabase
          .from('services')
          .update(payload)
          .eq('id', formState.id);
        if (error) throw error;
        onNotify(`Updated "${trimmedName}".`, 'success');
      } else {
        const { error } = await supabase.from('services').insert(payload);
        if (error) throw error;
        onNotify(`Added "${trimmedName}" to services.`, 'success');
      }

      setDrawerOpen(false);
      await onRefresh();
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Unable to save service.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (service: ServiceRow) => {
    setTogglingId(service.id);
    try {
      const nextActive = !service.is_active;
      const { error } = await supabase
        .from('services')
        .update({ is_active: nextActive })
        .eq('id', service.id);
      if (error) throw error;
      onNotify(
        `"${service.name}" ${nextActive ? 'activated for public booking' : 'deactivated from public booking'}.`,
        'success'
      );
      await onRefresh();
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Unable to update service status.', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleSeedInitialServices = async () => {
    setSeeding(true);
    try {
      const { error } = await supabase.from('services').insert(INITIAL_SHOWCASE_SERVICES);
      if (error) throw error;
      onNotify('Seeded OnlineHotelBooingService and curated hospitality services.', 'success');
      await onRefresh();
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Unable to seed initial services.', 'error');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-espresso-900">
            Hotel Booking Services Catalog
          </h2>
          <p className="text-xs text-umber-600 mt-0.5">
            Active services appear immediately in the public booking flow. Inactive services remain preserved for past appointment records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {services.length === 0 && !loading && (
            <button
              type="button"
              disabled={seeding}
              onClick={handleSeedInitialServices}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-taupe-300 bg-ivory-50 hover:border-rosebronze-500 text-xs font-semibold text-espresso-900 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-rosebronze-600" />
              <span>{seeding ? 'Seeding...' : 'Seed Initial Services'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={openCreateDrawer}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rosebronze-500 hover:bg-rosebronze-600 text-ivory-50 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Service</span>
          </button>
        </div>
      </div>

      {/* Services Table */}
      <div className="rounded-xl border border-taupe-300 bg-ivory-50 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-12 rounded-lg bg-champagne-100 animate-pulse" />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm font-semibold text-espresso-900">
              No Services in Database Yet
            </p>
            <p className="text-xs text-umber-600 max-w-md mx-auto">
              Add your first hotel booking service or seed the recommended starter catalog featuring OnlineHotelBooingService.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-champagne-200 bg-ivory-100/70 text-umber-600">
                  <th className="py-3.5 px-5 font-semibold">Service Name &amp; Description</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Duration</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Price</th>
                  <th className="py-3.5 px-4 font-semibold">Visibility</th>
                  <th className="py-3.5 px-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-champagne-200/80">
                {services.map((service) => (
                  <tr
                    key={service.id}
                    className={`hover:bg-ivory-100/60 transition-colors ${
                      !service.is_active ? 'opacity-70' : ''
                    }`}
                  >
                    <td className="py-4 px-5 max-w-md">
                      <p className="font-semibold text-sm text-espresso-900 break-words">
                        {service.name}
                      </p>
                      {service.description && (
                        <p className="text-umber-600 mt-1 leading-relaxed line-clamp-2">
                          {service.description}
                        </p>
                      )}
                    </td>

                    <td className="py-4 px-4 text-right font-mono tabular-nums text-espresso-900 whitespace-nowrap">
                      {service.duration_minutes} min
                    </td>

                    <td className="py-4 px-4 text-right font-mono tabular-nums font-semibold text-espresso-900 whitespace-nowrap">
                      ${Number(service.price || 0).toFixed(2)}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          service.is_active ? 'text-emerald-700' : 'text-umber-600'
                        }`}
                      >
                        {service.is_active ? 'Active (Public)' : 'Inactive (Hidden)'}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditDrawer(service)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-taupe-300 bg-ivory-50 hover:border-espresso-800 text-espresso-900 font-semibold transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          disabled={togglingId === service.id}
                          onClick={() => handleToggleActive(service)}
                          className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                            service.is_active
                              ? 'border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                              : 'border border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                          }`}
                        >
                          {service.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Service Slide-Over Drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-espresso-900/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-drawer-title"
        >
          <div className="w-full max-w-lg bg-ivory-50 h-full shadow-xl border-l border-taupe-300 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="px-6 py-5 border-b border-champagne-200 flex items-center justify-between bg-ivory-100">
                <h3 id="service-drawer-title" className="font-display text-2xl font-semibold text-espresso-900">
                  {formState.id ? 'Edit Hospitality Service' : 'Create Hospitality Service'}
                </h3>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-lg text-umber-600 hover:text-espresso-900 hover:bg-champagne-100 transition-colors cursor-pointer"
                  aria-label="Close panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form id="service-editor-form" onSubmit={handleSaveService} className="p-6 space-y-5">
                <div>
                  <label htmlFor="svc-name" className="block text-xs font-semibold text-espresso-900 mb-1.5">
                    Service Name *
                  </label>
                  <input
                    id="svc-name"
                    type="text"
                    required
                    placeholder="e.g. OnlineHotelBooingService"
                    value={formState.name}
                    onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-taupe-300 bg-ivory-50 text-sm text-espresso-900 focus:outline-none focus:border-rosebronze-500"
                  />
                </div>

                <div>
                  <label htmlFor="svc-desc" className="block text-xs font-semibold text-espresso-900 mb-1.5">
                    Description
                  </label>
                  <textarea
                    id="svc-desc"
                    rows={4}
                    placeholder="Describe what guests experience during this booking or stay consultation..."
                    value={formState.description}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-taupe-300 bg-ivory-50 text-sm text-espresso-900 focus:outline-none focus:border-rosebronze-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="svc-duration" className="block text-xs font-semibold text-espresso-900 mb-1.5">
                      Duration (Minutes) *
                    </label>
                    <input
                      id="svc-duration"
                      type="number"
                      min={5}
                      step={5}
                      required
                      value={formState.duration_minutes}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          duration_minutes: Number(e.target.value),
                        }))
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-taupe-300 bg-ivory-50 text-sm font-mono text-espresso-900 focus:outline-none focus:border-rosebronze-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="svc-price" className="block text-xs font-semibold text-espresso-900 mb-1.5">
                      Price (USD) *
                    </label>
                    <input
                      id="svc-price"
                      type="number"
                      min={0}
                      step="0.01"
                      required
                      value={formState.price}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          price: Number(e.target.value),
                        }))
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-taupe-300 bg-ivory-50 text-sm font-mono text-espresso-900 focus:outline-none focus:border-rosebronze-500"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer select-none p-3.5 rounded-xl border border-taupe-300 bg-ivory-100/60">
                    <input
                      type="checkbox"
                      checked={formState.is_active}
                      onChange={(e) =>
                        setFormState((prev) => ({ ...prev, is_active: e.target.checked }))
                      }
                      className="w-4 h-4 accent-rosebronze-600 rounded"
                    />
                    <div>
                      <p className="text-xs font-semibold text-espresso-900">
                        Active on Public Website
                      </p>
                      <p className="text-[11px] text-umber-600">
                        Allow visitors to select and reserve this service online
                      </p>
                    </div>
                  </label>
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-champagne-200 bg-ivory-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-taupe-300 text-xs font-semibold text-espresso-800 hover:bg-ivory-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="service-editor-form"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-rosebronze-500 hover:bg-rosebronze-600 disabled:opacity-60 text-ivory-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                {saving ? 'Saving...' : formState.id ? 'Save Changes' : 'Create Service'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
