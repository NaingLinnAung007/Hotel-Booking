import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { formatDateStringDisplay, formatTimeStringDisplay } from '../../lib/availability';
import { supabase } from '../../lib/supabase';
import { AppointmentRow, AppointmentStatus, ServiceRow } from '../../types/database';

interface AdminAppointmentsProps {
  appointments: AppointmentRow[];
  services: ServiceRow[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onNotify: (msg: string, type?: 'success' | 'error') => void;
}

const STATUS_OPTIONS: AppointmentStatus[] = ['pending', 'confirmed', 'completed', 'cancelled'];

export const AdminAppointments: React.FC<AdminAppointmentsProps> = ({
  appointments,
  services,
  loading,
  onRefresh,
  onNotify,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | AppointmentStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const serviceMap = useMemo(() => new Map(services.map((s) => [s.id, s.name])), [services]);

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((appt) => (statusFilter === 'all' ? true : appt.status === statusFilter))
      .filter((appt) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const sName = (serviceMap.get(appt.service_id) || '').toLowerCase();
        return (
          appt.full_name.toLowerCase().includes(q) ||
          appt.email.toLowerCase().includes(q) ||
          appt.phone.toLowerCase().includes(q) ||
          sName.includes(q) ||
          appt.appointment_date.includes(q)
        );
      })
      .sort((a, b) => {
        if (a.appointment_date !== b.appointment_date) {
          return b.appointment_date.localeCompare(a.appointment_date);
        }
        return b.start_time.localeCompare(a.start_time);
      });
  }, [appointments, statusFilter, searchQuery, serviceMap]);

  const handleStatusChange = async (appointmentId: string, nextStatus: AppointmentStatus) => {
    setUpdatingId(appointmentId);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: nextStatus })
        .eq('id', appointmentId);

      if (error) throw error;
      onNotify(`Appointment marked as ${nextStatus}.`, 'success');
      await onRefresh();
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : 'Failed to update status.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Interactive Segmented Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-champagne-100 border border-taupe-300 rounded-xl">
          {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((tab) => {
            const active = statusFilter === tab;
            const count =
              tab === 'all'
                ? appointments.length
                : appointments.filter((a) => a.status === tab).length;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                  active
                    ? 'bg-ivory-50 text-espresso-900 shadow-2xs'
                    : 'text-umber-600 hover:text-espresso-900'
                }`}
              >
                {tab} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-umber-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            placeholder="Search guest, phone, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-taupe-300 bg-ivory-50 text-xs text-espresso-900 focus:outline-none focus:border-rosebronze-500"
          />
        </div>
      </div>

      {/* Appointments Table */}
      <div className="rounded-xl border border-taupe-300 bg-ivory-50 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-12 rounded-lg bg-champagne-100 animate-pulse" />
            ))}
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-espresso-900">
              No Matching Appointments Found
            </p>
            <p className="text-xs text-umber-600 mt-1">
              {statusFilter !== 'all' || searchQuery
                ? 'Try clearing your status filter or search query.'
                : 'Guest reservation requests will appear here as soon as they are booked.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-champagne-200 bg-ivory-100/70 text-umber-600">
                  <th className="py-3.5 px-5 font-semibold">Client Details</th>
                  <th className="py-3.5 px-4 font-semibold">Service</th>
                  <th className="py-3.5 px-4 font-semibold">Date &amp; Time</th>
                  <th className="py-3.5 px-4 font-semibold">Guest Notes</th>
                  <th className="py-3.5 px-5 font-semibold text-right">Status Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-champagne-200/80">
                {filteredAppointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-ivory-100/50 transition-colors align-top">
                    <td className="py-4 px-5">
                      <p className="font-semibold text-espresso-900 text-sm">{appt.full_name}</p>
                      <p className="text-umber-600 mt-0.5">{appt.email}</p>
                      <p className="text-umber-600 font-mono tabular-nums mt-0.5">{appt.phone}</p>
                    </td>

                    <td className="py-4 px-4 font-medium text-espresso-900">
                      {serviceMap.get(appt.service_id) || 'Service'}
                    </td>

                    <td className="py-4 px-4 tabular-nums whitespace-nowrap">
                      <p className="font-semibold text-espresso-900">
                        {formatDateStringDisplay(appt.appointment_date)}
                      </p>
                      <p className="text-rosebronze-600 font-mono mt-0.5">
                        {formatTimeStringDisplay(appt.start_time)} – {formatTimeStringDisplay(appt.end_time)}
                      </p>
                    </td>

                    <td className="py-4 px-4 max-w-xs text-umber-600">
                      {appt.notes ? (
                        <p className="leading-relaxed">{appt.notes}</p>
                      ) : (
                        <span className="text-umber-600/50">No notes provided</span>
                      )}
                    </td>

                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <label htmlFor={`status-${appt.id}`} className="sr-only">
                        Update status for {appt.full_name}
                      </label>
                      <select
                        id={`status-${appt.id}`}
                        disabled={updatingId === appt.id}
                        value={appt.status}
                        onChange={(e) =>
                          handleStatusChange(appt.id, e.target.value as AppointmentStatus)
                        }
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold capitalize focus:outline-none cursor-pointer ${
                          appt.status === 'confirmed'
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                            : appt.status === 'pending'
                            ? 'border-amber-300 bg-amber-50 text-amber-900'
                            : appt.status === 'completed'
                            ? 'border-stone-300 bg-stone-100 text-stone-800'
                            : 'border-red-200 bg-red-50 text-red-800'
                        }`}
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
