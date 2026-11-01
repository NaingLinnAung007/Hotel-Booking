import React, { useCallback, useEffect, useState } from 'react';
import {
  CalendarCheck,
  CalendarOff,
  Clock,
  ExternalLink,
  LayoutDashboard,
  Layers,
  LogOut,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  AppointmentRow,
  BlockedDateRow,
  BusinessHourRow,
  BusinessSettingsRow,
  ServiceRow,
} from '../../types/database';
import { AdminAppointments } from './AdminAppointments';
import { AdminBlockedDates } from './AdminBlockedDates';
import { AdminBusinessHours } from './AdminBusinessHours';
import { AdminBusinessSettings } from './AdminBusinessSettings';
import { AdminOverview } from './AdminOverview';
import { AdminServices } from './AdminServices';

export type AdminTabKey = 'overview' | 'appointments' | 'services' | 'hours' | 'blocked' | 'settings';

interface AdminDashboardProps {
  userEmail: string | undefined;
  onSignOut: () => Promise<void>;
  onNavigatePublic: () => void;
  publicSettings: BusinessSettingsRow;
  onGlobalRefreshPublicData: () => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  userEmail,
  onSignOut,
  onNavigatePublic,
  publicSettings,
  onGlobalRefreshPublicData,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTabKey>('overview');
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [allServices, setAllServices] = useState<ServiceRow[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHourRow[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDateRow[]>([]);
  const [settings, setSettings] = useState<BusinessSettingsRow>(publicSettings);

  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 3500);
  }, []);

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [apptsRes, svcsRes, hoursRes, blockedRes, settingsRes] = await Promise.all([
        supabase.from('appointments').select('*').order('appointment_date', { ascending: false }),
        supabase.from('services').select('*').order('created_at', { ascending: true }),
        supabase.from('business_hours').select('*').order('weekday', { ascending: true }),
        supabase.from('blocked_dates').select('*').order('blocked_date', { ascending: true }),
        supabase.from('business_settings').select('*').limit(1).maybeSingle(),
      ]);

      if (!apptsRes.error && apptsRes.data) {
        setAppointments(apptsRes.data as AppointmentRow[]);
      }
      if (!svcsRes.error && svcsRes.data) {
        setAllServices(svcsRes.data as ServiceRow[]);
      }
      if (!hoursRes.error && hoursRes.data) {
        setBusinessHours(hoursRes.data as BusinessHourRow[]);
      }
      if (!blockedRes.error && blockedRes.data) {
        setBlockedDates(blockedRes.data as BlockedDateRow[]);
      }
      if (!settingsRes.error && settingsRes.data) {
        setSettings(settingsRes.data as BusinessSettingsRow);
      }

      await onGlobalRefreshPublicData();
    } finally {
      setLoading(false);
    }
  }, [onGlobalRefreshPublicData]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const navItems: { key: AdminTabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'appointments', label: 'Appointments', icon: CalendarCheck },
    { key: 'services', label: 'Services', icon: Layers },
    { key: 'hours', label: 'Business Hours', icon: Clock },
    { key: 'blocked', label: 'Blocked Dates', icon: CalendarOff },
    { key: 'settings', label: 'Business Settings', icon: Settings },
  ];

  const activeTitle = navItems.find((n) => n.key === activeTab)?.label || 'Overview';

  return (
    <div className="min-h-screen bg-ivory-100/60 text-espresso-900 flex flex-col lg:flex-row">
      {/* Left Sidebar (260px) */}
      <aside className="w-full lg:w-64 shrink-0 bg-ivory-50 border-b lg:border-b-0 lg:border-r border-taupe-300 flex flex-col justify-between">
        <div>
          <div className="px-6 h-16 flex items-center border-b border-champagne-200">
            <span className="font-display text-xl font-semibold text-espresso-900 truncate">
              {settings.business_name}
            </span>
          </div>

          <nav className="p-3 flex lg:flex-col gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveTab(item.key)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-espresso-900 text-ivory-50'
                      : 'text-umber-600 hover:text-espresso-900 hover:bg-champagne-100/70'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="hidden lg:block p-4 border-t border-champagne-200 space-y-3">
          {userEmail && (
            <div className="px-2">
              <p className="text-[11px] text-umber-600">Signed in Manager</p>
              <p className="text-xs font-semibold text-espresso-900 truncate">{userEmail}</p>
            </div>
          )}
          <button
            type="button"
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl border border-taupe-300 hover:border-espresso-800 text-xs font-semibold text-espresso-900 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Workspace Header */}
        <header className="h-16 bg-ivory-50 border-b border-taupe-300 px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-umber-600 truncate">
            <span>Management</span>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-espresso-900 text-sm">{activeTitle}</span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={fetchAdminData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-taupe-300 bg-ivory-50 hover:bg-champagne-100 text-xs font-medium text-espresso-900 transition-colors cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={onNavigatePublic}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-espresso-900 hover:bg-rosebronze-600 text-ivory-50 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Public Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onSignOut}
              className="lg:hidden inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-taupe-300 text-xs font-semibold text-espresso-900 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Inline Toast Notification */}
        {toast && (
          <div className="px-6 pt-4">
            <div
              role="status"
              className={`px-4 py-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                toast.type === 'success'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                  : 'border-red-300 bg-red-50 text-red-950'
              }`}
            >
              <span>{toast.message}</span>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="underline ml-4 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Active Dashboard Page Content */}
        <main className="p-6 md:p-8 flex-1 overflow-y-auto">
          {activeTab === 'overview' && (
            <AdminOverview
              appointments={appointments}
              services={allServices}
              loading={loading}
              onNavigateTab={(t) => setActiveTab(t)}
            />
          )}
          {activeTab === 'appointments' && (
            <AdminAppointments
              appointments={appointments}
              services={allServices}
              loading={loading}
              onRefresh={fetchAdminData}
              onNotify={showToast}
            />
          )}
          {activeTab === 'services' && (
            <AdminServices
              services={allServices}
              loading={loading}
              onRefresh={fetchAdminData}
              onNotify={showToast}
            />
          )}
          {activeTab === 'hours' && (
            <AdminBusinessHours
              businessHours={businessHours}
              loading={loading}
              onRefresh={fetchAdminData}
              onNotify={showToast}
            />
          )}
          {activeTab === 'blocked' && (
            <AdminBlockedDates
              blockedDates={blockedDates}
              loading={loading}
              onRefresh={fetchAdminData}
              onNotify={showToast}
            />
          )}
          {activeTab === 'settings' && (
            <AdminBusinessSettings
              settings={settings}
              loading={loading}
              onRefresh={fetchAdminData}
              onNotify={showToast}
            />
          )}
        </main>
      </div>
    </div>
  );
};
