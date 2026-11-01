import React from 'react';
import { ArrowRight, CalendarCheck2, Clock3, Layers, Sparkles } from 'lucide-react';
import { formatDateStringDisplay, formatTimeStringDisplay, toSupabaseDate } from '../../lib/availability';
import { AppointmentRow, ServiceRow } from '../../types/database';

interface AdminOverviewProps {
  appointments: AppointmentRow[];
  services: ServiceRow[];
  loading: boolean;
  onNavigateTab: (tab: 'appointments' | 'services' | 'hours' | 'blocked' | 'settings') => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  appointments,
  services,
  loading,
  onNavigateTab,
}) => {
  const todayStr = toSupabaseDate(new Date());

  const upcomingCount = appointments.filter(
    (a) => a.appointment_date >= todayStr && (a.status === 'pending' || a.status === 'confirmed')
  ).length;

  const pendingCount = appointments.filter((a) => a.status === 'pending').length;
  const completedCount = appointments.filter((a) => a.status === 'completed').length;
  const activeServicesCount = services.filter((s) => s.is_active).length;

  const serviceMap = new Map(services.map((s) => [s.id, s.name]));

  const upcomingList = appointments
    .filter((a) => a.appointment_date >= todayStr && a.status !== 'cancelled')
    .sort((a, b) => {
      if (a.appointment_date !== b.appointment_date) {
        return a.appointment_date.localeCompare(b.appointment_date);
      }
      return a.start_time.localeCompare(b.start_time);
    })
    .slice(0, 6);

  return (
    <div className="space-y-8">
      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="rounded-xl border border-taupe-300 bg-ivory-50 p-5">
          <div className="flex items-center justify-between text-umber-600">
            <span className="text-xs font-medium">Upcoming Bookings</span>
            <CalendarCheck2 className="w-4 h-4 text-rosebronze-600" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-espresso-900 font-mono tabular-nums">
            {loading ? '—' : upcomingCount}
          </p>
          <p className="mt-1 text-xs text-umber-600">Scheduled from today onward</p>
        </div>

        <div className="rounded-xl border border-taupe-300 bg-ivory-50 p-5">
          <div className="flex items-center justify-between text-umber-600">
            <span className="text-xs font-medium">Pending Requests</span>
            <Clock3 className="w-4 h-4 text-amber-700" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-espresso-900 font-mono tabular-nums">
            {loading ? '—' : pendingCount}
          </p>
          <p className="mt-1 text-xs text-umber-600">Awaiting concierge confirmation</p>
        </div>

        <div className="rounded-xl border border-taupe-300 bg-ivory-50 p-5">
          <div className="flex items-center justify-between text-umber-600">
            <span className="text-xs font-medium">Completed Visits</span>
            <Sparkles className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-espresso-900 font-mono tabular-nums">
            {loading ? '—' : completedCount}
          </p>
          <p className="mt-1 text-xs text-umber-600">Fulfilled guest reservations</p>
        </div>

        <div className="rounded-xl border border-taupe-300 bg-ivory-50 p-5">
          <div className="flex items-center justify-between text-umber-600">
            <span className="text-xs font-medium">Active Services</span>
            <Layers className="w-4 h-4 text-rosebronze-600" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-espresso-900 font-mono tabular-nums">
            {loading ? '—' : activeServicesCount}
          </p>
          <p className="mt-1 text-xs text-umber-600">Live on public booking flow</p>
        </div>
      </div>

      {/* Upcoming Schedule & Quick Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 rounded-xl border border-taupe-300 bg-ivory-50 overflow-hidden">
          <div className="px-6 py-4 border-b border-champagne-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-espresso-900">
                Upcoming Guest Arrivals
              </h2>
              <p className="text-xs text-umber-600 mt-0.5">
                Next confirmed and pending hospitality appointments
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('appointments')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rosebronze-600 hover:text-espresso-900 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-11 rounded-lg bg-champagne-100 animate-pulse" />
              ))}
            </div>
          ) : upcomingList.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-semibold text-espresso-900">
                No Upcoming Appointments Scheduled
              </p>
              <p className="text-xs text-umber-600 mt-1">
                New reservations submitted from the public booking page will appear here immediately.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-champagne-200 text-umber-600 bg-ivory-100/60">
                    <th className="py-3 px-5 font-semibold">Guest</th>
                    <th className="py-3 px-4 font-semibold">Service</th>
                    <th className="py-3 px-4 font-semibold">Date &amp; Time</th>
                    <th className="py-3 px-5 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-champagne-200/80">
                  {upcomingList.map((appt) => (
                    <tr key={appt.id} className="hover:bg-ivory-100/70 transition-colors">
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-espresso-900">{appt.full_name}</p>
                        <p className="text-umber-600 tabular-nums">{appt.phone}</p>
                      </td>
                      <td className="py-3.5 px-4 text-espresso-800">
                        {serviceMap.get(appt.service_id) || 'Hospitality Service'}
                      </td>
                      <td className="py-3.5 px-4 tabular-nums">
                        <p className="text-espresso-900 font-medium">
                          {formatDateStringDisplay(appt.appointment_date)}
                        </p>
                        <p className="text-umber-600 font-mono">
                          {formatTimeStringDisplay(appt.start_time)} – {formatTimeStringDisplay(appt.end_time)}
                        </p>
                      </td>
                      <td className="py-3.5 px-5 text-right capitalize font-semibold">
                        <span
                          className={
                            appt.status === 'confirmed'
                              ? 'text-emerald-700'
                              : appt.status === 'pending'
                              ? 'text-amber-700'
                              : 'text-umber-600'
                          }
                        >
                          {appt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 rounded-xl border border-taupe-300 bg-ivory-50 p-6 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-espresso-900">
              Property Configuration Shortcuts
            </h2>
            <p className="text-xs text-umber-600 mt-0.5">
              Manage booking availability and hospitality offerings
            </p>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => onNavigateTab('services')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-taupe-300 hover:border-rosebronze-500 bg-ivory-100/50 text-left transition-colors cursor-pointer"
            >
              <div>
                <p className="text-xs font-semibold text-espresso-900">Manage Hotel Services</p>
                <p className="text-[11px] text-umber-600 mt-0.5">
                  Add, edit, or toggle active services
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-rosebronze-600 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('hours')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-taupe-300 hover:border-rosebronze-500 bg-ivory-100/50 text-left transition-colors cursor-pointer"
            >
              <div>
                <p className="text-xs font-semibold text-espresso-900">Adjust Reception Hours</p>
                <p className="text-[11px] text-umber-600 mt-0.5">
                  Update weekday open &amp; close windows
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-rosebronze-600 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('blocked')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-taupe-300 hover:border-rosebronze-500 bg-ivory-100/50 text-left transition-colors cursor-pointer"
            >
              <div>
                <p className="text-xs font-semibold text-espresso-900">Block Maintenance Dates</p>
                <p className="text-[11px] text-umber-600 mt-0.5">
                  Prevent bookings on specific dates
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-rosebronze-600 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('settings')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl border border-taupe-300 hover:border-rosebronze-500 bg-ivory-100/50 text-left transition-colors cursor-pointer"
            >
              <div>
                <p className="text-xs font-semibold text-espresso-900">Business Settings</p>
                <p className="text-[11px] text-umber-600 mt-0.5">
                  Phone, Pathein address &amp; slot intervals
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-rosebronze-600 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
