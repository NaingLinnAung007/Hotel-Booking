import React, { useState } from 'react';
import { CalendarOff, Plus, Trash2 } from 'lucide-react';
import { formatDateStringDisplay, toSupabaseDate } from '../../lib/availability';
import { supabase } from '../../lib/supabase';
import { BlockedDateRow } from '../../types/database';

interface AdminBlockedDatesProps {
  blockedDates: BlockedDateRow[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminBlockedDates: React.FC<AdminBlockedDatesProps> = ({
  blockedDates,
  loading,
  onRefresh,
  onNotify,
}) => {
  const [dateInput, setDateInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleAddBlockedDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateInput) {
      onNotify('Please select a date to block.', 'error');
      return;
    }
    if (blockedDates.some((b) => b.blocked_date === dateInput)) {
      onNotify('That date is already blocked.', 'error');
      return;
    }

    setAdding(true);
    try {
      const { error } = await supabase.from('blocked_dates').insert({
        blocked_date: dateInput,
        reason: reasonInput.trim() || null,
      });
      if (error) throw error;
      setDateInput('');
      setReasonInput('');
      onNotify(`Blocked ${formatDateStringDisplay(dateInput)} from online bookings.`, 'success');
      await onRefresh();
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Unable to block date.', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveBlockedDate = async (row: BlockedDateRow) => {
    setRemovingId(row.id);
    try {
      const { error } = await supabase.from('blocked_dates').delete().eq('id', row.id);
      if (error) throw error;
      onNotify(`Removed blackout on ${formatDateStringDisplay(row.blocked_date)}.`, 'success');
      await onRefresh();
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Unable to remove blocked date.', 'error');
    } finally {
      setRemovingId(null);
    }
  };

  const sortedBlocked = [...blockedDates].sort((a, b) =>
    a.blocked_date.localeCompare(b.blocked_date)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl items-start">
      {/* Add Blocked Date Form */}
      <form
        onSubmit={handleAddBlockedDate}
        className="lg:col-span-5 rounded-xl border border-taupe-300 bg-ivory-50 p-6 space-y-5"
      >
        <div>
          <h2 className="text-base font-semibold text-espresso-900">
            Add Blackout or Holiday Date
          </h2>
          <p className="text-xs text-umber-600 mt-0.5">
            Prevent new guest appointments on maintenance days, private property buyouts, or public holidays.
          </p>
        </div>

        <div>
          <label htmlFor="block-date-input" className="block text-xs font-semibold text-espresso-900 mb-1.5">
            Date to Block *
          </label>
          <input
            id="block-date-input"
            type="date"
            required
            min={toSupabaseDate(new Date())}
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-taupe-300 bg-ivory-100/50 text-sm font-mono text-espresso-900 focus:outline-none focus:border-rosebronze-500"
          />
        </div>

        <div>
          <label htmlFor="block-reason-input" className="block text-xs font-semibold text-espresso-900 mb-1.5">
            Reason (Shown to Guests)
          </label>
          <input
            id="block-reason-input"
            type="text"
            placeholder="e.g. Thingyan Holiday Closure or Private Event Buyout"
            value={reasonInput}
            onChange={(e) => setReasonInput(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-taupe-300 bg-ivory-100/50 text-sm text-espresso-900 focus:outline-none focus:border-rosebronze-500"
          />
        </div>

        <button
          type="submit"
          disabled={adding}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rosebronze-500 hover:bg-rosebronze-600 disabled:opacity-60 text-ivory-50 text-xs font-semibold transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{adding ? 'Adding Blocked Date...' : 'Block Selected Date'}</span>
        </button>
      </form>

      {/* Active Blocked Dates List */}
      <div className="lg:col-span-7 rounded-xl border border-taupe-300 bg-ivory-50 overflow-hidden">
        <div className="px-6 py-4 border-b border-champagne-200">
          <h3 className="text-sm font-semibold text-espresso-900">
            Scheduled Blocked Dates ({sortedBlocked.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2].map((n) => (
              <div key={n} className="h-12 rounded-lg bg-champagne-100 animate-pulse" />
            ))}
          </div>
        ) : sortedBlocked.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarOff className="w-6 h-6 text-rosebronze-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-espresso-900">No Blocked Dates Configured</p>
            <p className="text-xs text-umber-600 mt-1">
              All regular open weekdays are currently available for booking.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-champagne-200">
            {sortedBlocked.map((item) => (
              <li
                key={item.id}
                className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-ivory-100/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-espresso-900">
                    {formatDateStringDisplay(item.blocked_date)}
                  </p>
                  <p className="text-xs text-umber-600 mt-0.5">
                    {item.reason || 'Closed for bookings'}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={removingId === item.id}
                  onClick={() => handleRemoveBlockedDate(item)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-800 text-xs font-semibold transition-colors cursor-pointer shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
