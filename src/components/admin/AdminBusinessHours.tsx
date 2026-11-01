import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { DEFAULT_BUSINESS_HOURS, WEEKDAY_NAMES } from '../../config/brandAssets';
import { supabase } from '../../lib/supabase';
import { BusinessHourRow } from '../../types/database';

interface AdminBusinessHoursProps {
  businessHours: BusinessHourRow[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

interface EditableDayHour {
  id?: string;
  weekday: number;
  is_open: boolean;
  start_time: string; // HH:mm
  end_time: string;   // HH:mm
}

function normalizeToHHMM(timeStr: string): string {
  if (!timeStr) return '09:00';
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  return '09:00';
}

export const AdminBusinessHours: React.FC<AdminBusinessHoursProps> = ({
  businessHours,
  loading,
  onRefresh,
  onNotify,
}) => {
  const [days, setDays] = useState<EditableDayHour[]>([]);
  const [saving, setSaving] = useState(false);

  // Order Monday (1) -> Saturday (6), then Sunday (0) for intuitive hotel reception editing
  const orderedWeekdays = [1, 2, 3, 4, 5, 6, 0];

  useEffect(() => {
    const mapped: EditableDayHour[] = orderedWeekdays.map((w) => {
      const existing = businessHours.find((bh) => Number(bh.weekday) === w);
      const fallback = DEFAULT_BUSINESS_HOURS.find((d) => d.weekday === w)!;
      if (existing && !existing.id.startsWith('default-')) {
        return {
          id: existing.id,
          weekday: w,
          is_open: Boolean(existing.is_open),
          start_time: normalizeToHHMM(existing.start_time),
          end_time: normalizeToHHMM(existing.end_time),
        };
      }
      return {
        weekday: w,
        is_open: existing ? Boolean(existing.is_open) : fallback.is_open,
        start_time: normalizeToHHMM(existing ? existing.start_time : fallback.start_time),
        end_time: normalizeToHHMM(existing ? existing.end_time : fallback.end_time),
      };
    });
    setDays(mapped);
  }, [businessHours]);

  const updateDay = (weekday: number, patch: Partial<EditableDayHour>) => {
    setDays((prev) =>
      prev.map((d) => (d.weekday === weekday ? { ...d, ...patch } : d))
    );
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();

    for (const d of days) {
      if (d.is_open && d.end_time <= d.start_time) {
        onNotify(
          `${WEEKDAY_NAMES[d.weekday]}: Closing time must be later than opening time.`,
          'error'
        );
        return;
      }
    }

    setSaving(true);
    try {
      for (const d of days) {
        const payload = {
          weekday: d.weekday,
          is_open: d.is_open,
          start_time: `${d.start_time}:00`,
          end_time: `${d.end_time}:00`,
        };

        if (d.id) {
          const { error } = await supabase
            .from('business_hours')
            .update(payload)
            .eq('id', d.id);
          if (error) throw error;
        } else {
          // Check if row for weekday exists first
          const { data: existingRow } = await supabase
            .from('business_hours')
            .select('id')
            .eq('weekday', d.weekday)
            .maybeSingle();

          if (existingRow?.id) {
            const { error } = await supabase
              .from('business_hours')
              .update(payload)
              .eq('id', existingRow.id);
            if (error) throw error;
          } else {
            const { error } = await supabase.from('business_hours').insert(payload);
            if (error) throw error;
          }
        }
      }

      onNotify('Operating schedule updated. Public booking slots recalculated.', 'success');
      await onRefresh();
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Failed to save business hours.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSaveAll} className="space-y-6 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-espresso-900">
            Weekly Operating &amp; Reception Schedule
          </h2>
          <p className="text-xs text-umber-600 mt-0.5">
            Changes immediately govern available appointment time slots on the public booking calendar.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving || loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rosebronze-500 hover:bg-rosebronze-600 disabled:opacity-60 text-ivory-50 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving Schedule...' : 'Save Operating Hours'}</span>
        </button>
      </div>

      <div className="rounded-xl border border-taupe-300 bg-ivory-50 divide-y divide-champagne-200">
        {days.map((day) => (
          <div
            key={day.weekday}
            className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4 min-w-44">
              <label className="inline-flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={day.is_open}
                  onChange={(e) => updateDay(day.weekday, { is_open: e.target.checked })}
                  className="w-4 h-4 accent-rosebronze-600 rounded"
                />
                <span className="text-sm font-semibold text-espresso-900">
                  {WEEKDAY_NAMES[day.weekday]}
                </span>
              </label>
              <span
                className={`text-xs font-medium ${
                  day.is_open ? 'text-emerald-700' : 'text-umber-600'
                }`}
              >
                {day.is_open ? 'Open' : 'Closed'}
              </span>
            </div>

            {day.is_open ? (
              <div className="flex items-center gap-3">
                <div>
                  <label htmlFor={`start-${day.weekday}`} className="sr-only">
                    {WEEKDAY_NAMES[day.weekday]} Opening Time
                  </label>
                  <input
                    id={`start-${day.weekday}`}
                    type="time"
                    value={day.start_time}
                    onChange={(e) => updateDay(day.weekday, { start_time: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-taupe-300 bg-ivory-100/50 text-xs font-mono text-espresso-900 focus:outline-none focus:border-rosebronze-500"
                  />
                </div>
                <span className="text-xs text-umber-600">to</span>
                <div>
                  <label htmlFor={`end-${day.weekday}`} className="sr-only">
                    {WEEKDAY_NAMES[day.weekday]} Closing Time
                  </label>
                  <input
                    id={`end-${day.weekday}`}
                    type="time"
                    value={day.end_time}
                    onChange={(e) => updateDay(day.weekday, { end_time: e.target.value })}
                    className="px-3 py-2 rounded-lg border border-taupe-300 bg-ivory-100/50 text-xs font-mono text-espresso-900 focus:outline-none focus:border-rosebronze-500"
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-umber-600 italic">
                No public appointment slots generated on {WEEKDAY_NAMES[day.weekday]}
              </p>
            )}
          </div>
        ))}
      </div>
    </form>
  );
};
