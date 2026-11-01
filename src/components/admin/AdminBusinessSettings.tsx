import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BusinessSettingsRow } from '../../types/database';

interface AdminBusinessSettingsProps {
  settings: BusinessSettingsRow;
  loading: boolean;
  onRefresh: () => Promise<void>;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminBusinessSettings: React.FC<AdminBusinessSettingsProps> = ({
  settings,
  loading,
  onRefresh,
  onNotify,
}) => {
  const [businessName, setBusinessName] = useState(settings.business_name);
  const [businessEmail, setBusinessEmail] = useState(settings.business_email);
  const [businessPhone, setBusinessPhone] = useState(settings.business_phone);
  const [businessAddress, setBusinessAddress] = useState(settings.business_address);
  const [slotIntervalMinutes, setSlotIntervalMinutes] = useState(settings.slot_interval_minutes);
  const [bookingNoticeHours, setBookingNoticeHours] = useState(settings.booking_notice_hours);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setBusinessName(settings.business_name);
    setBusinessEmail(settings.business_email);
    setBusinessPhone(settings.business_phone);
    setBusinessAddress(settings.business_address);
    setSlotIntervalMinutes(settings.slot_interval_minutes);
    setBookingNoticeHours(settings.booking_notice_hours);
  }, [settings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!businessName.trim()) {
      onNotify('Business Name cannot be empty.', 'error');
      return;
    }
    if (Number(slotIntervalMinutes) < 5) {
      onNotify('Slot Interval must be at least 5 minutes.', 'error');
      return;
    }
    if (Number(bookingNoticeHours) < 0) {
      onNotify('Booking Notice cannot be negative.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        business_name: businessName.trim(),
        business_email: businessEmail.trim(),
        business_phone: businessPhone.trim(),
        business_address: businessAddress,
        slot_interval_minutes: Number(slotIntervalMinutes),
        booking_notice_hours: Number(bookingNoticeHours),
      };

      if (settings.id && !settings.id.startsWith('default-')) {
        const { error } = await supabase
          .from('business_settings')
          .update(payload)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { data: existing } = await supabase
          .from('business_settings')
          .select('id')
          .limit(1)
          .maybeSingle();

        if (existing?.id) {
          const { error } = await supabase
            .from('business_settings')
            .update(payload)
            .eq('id', existing.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('business_settings').insert(payload);
          if (error) throw error;
        }
      }

      onNotify('Business settings saved and synced to the public website.', 'success');
      await onRefresh();
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Unable to save business settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSaveSettings} className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-espresso-900">
            Hospitality Property &amp; Booking Rules
          </h2>
          <p className="text-xs text-umber-600 mt-0.5">
            Stored in <code className="font-mono">business_settings</code> and reflected live across the public storefront and availability engine.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving || loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rosebronze-500 hover:bg-rosebronze-600 disabled:opacity-60 text-ivory-50 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      <div className="rounded-xl border border-taupe-300 bg-ivory-50 p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label htmlFor="bs-name" className="block text-xs font-semibold text-espresso-900 mb-1.5">
              Business Name
            </label>
            <input
              id="bs-name"
              type="text"
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-taupe-300 bg-ivory-100/50 text-sm text-espresso-900 focus:outline-none focus:border-rosebronze-500"
            />
          </div>

          <div>
            <label htmlFor="bs-email" className="block text-xs font-semibold text-espresso-900 mb-1.5">
              Business Email
            </label>
            <input
              id="bs-email"
              type="email"
              value={businessEmail}
              onChange={(e) => setBusinessEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-taupe-300 bg-ivory-100/50 text-sm text-espresso-900 focus:outline-none focus:border-rosebronze-500"
            />
          </div>

          <div>
            <label htmlFor="bs-phone" className="block text-xs font-semibold text-espresso-900 mb-1.5">
              Business Phone
            </label>
            <input
              id="bs-phone"
              type="text"
              value={businessPhone}
              onChange={(e) => setBusinessPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-taupe-300 bg-ivory-100/50 text-sm text-espresso-900 focus:outline-none focus:border-rosebronze-500"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="bs-address" className="block text-xs font-semibold text-espresso-900 mb-1.5">
              Business Address
            </label>
            <input
              id="bs-address"
              type="text"
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-taupe-300 bg-ivory-100/50 text-sm text-espresso-900 focus:outline-none focus:border-rosebronze-500"
            />
          </div>
        </div>

        <div className="pt-5 border-t border-champagne-200 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="bs-interval" className="block text-xs font-semibold text-espresso-900 mb-1.5">
              Slot Interval (Minutes)
            </label>
            <input
              id="bs-interval"
              type="number"
              min={5}
              step={5}
              required
              value={slotIntervalMinutes}
              onChange={(e) => setSlotIntervalMinutes(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-taupe-300 bg-ivory-100/50 text-sm font-mono text-espresso-900 focus:outline-none focus:border-rosebronze-500"
            />
            <p className="text-[11px] text-umber-600 mt-1">
              Step interval between generated booking start times (e.g. 30 mins).
            </p>
          </div>

          <div>
            <label htmlFor="bs-notice" className="block text-xs font-semibold text-espresso-900 mb-1.5">
              Booking Notice (Hours)
            </label>
            <input
              id="bs-notice"
              type="number"
              min={0}
              step={1}
              required
              value={bookingNoticeHours}
              onChange={(e) => setBookingNoticeHours(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-taupe-300 bg-ivory-100/50 text-sm font-mono text-espresso-900 focus:outline-none focus:border-rosebronze-500"
            />
            <p className="text-[11px] text-umber-600 mt-1">
              Minimum advance lead time required before a slot can be booked.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
};
