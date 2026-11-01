import { useCallback, useEffect, useMemo, useState } from 'react';
import { Database } from 'lucide-react';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminGate } from './components/admin/AdminGate';
import { SupabaseSetupModal } from './components/common/SupabaseSetupModal';
import { AboutSection } from './components/public/AboutSection';
import { BookingSection } from './components/public/BookingSection';
import { Footer } from './components/public/Footer';
import { HeroSection } from './components/public/HeroSection';
import { Navbar } from './components/public/Navbar';
import { ServicesSection } from './components/public/ServicesSection';
import {
  DEFAULT_BUSINESS_HOURS,
  DEFAULT_BUSINESS_SETTINGS,
  INITIAL_SHOWCASE_SERVICES,
} from './config/brandAssets';
import { formatTimeStringDisplay } from './lib/availability';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import {
  AppointmentRow,
  BlockedDateRow,
  BusinessHourRow,
  BusinessSettingsRow,
  ServiceRow,
} from './types/database';

function getInitialRoute(): 'public' | 'admin' {
  if (typeof window === 'undefined') return 'public';
  if (window.location.pathname.startsWith('/admin') || window.location.hash.startsWith('#/admin')) {
    return 'admin';
  }
  return 'public';
}

export default function App() {
  const [route, setRoute] = useState<'public' | 'admin'>(getInitialRoute);
  const [publicLoading, setPublicLoading] = useState<boolean>(true);
  const [setupModalOpen, setSetupModalOpen] = useState<boolean>(false);

  const [activeServices, setActiveServices] = useState<ServiceRow[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHourRow[]>(() =>
    DEFAULT_BUSINESS_HOURS.map((bh) => ({ ...bh, id: `default-${bh.weekday}` }))
  );
  const [blockedDates, setBlockedDates] = useState<BlockedDateRow[]>([]);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettingsRow>(() => ({
    id: 'default-settings',
    ...DEFAULT_BUSINESS_SETTINGS,
  }));

  const [preselectedServiceId, setPreselectedServiceId] = useState<string | null>(null);
  const [localBookedIntervals, setLocalBookedIntervals] = useState<
    Pick<AppointmentRow, 'appointment_date' | 'start_time' | 'end_time' | 'status'>[]
  >([]);

  // Browser navigation sync
  useEffect(() => {
    const onPopState = () => {
      setRoute(getInitialRoute());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigateTo = (nextRoute: 'public' | 'admin') => {
    setRoute(nextRoute);
    const nextPath = nextRoute === 'admin' ? '/admin' : '/';
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Load real active services, business_hours, blocked_dates, and business_settings from Supabase
  const loadPublicData = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setActiveServices(
        INITIAL_SHOWCASE_SERVICES.map((svc, idx) => ({
          ...svc,
          id: `showcase-${idx + 1}`,
        }))
      );
      setPublicLoading(false);
      return;
    }

    setPublicLoading(true);
    try {
      const [servicesRes, hoursRes, blockedRes, settingsRes] = await Promise.all([
        supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: true }),
        supabase
          .from('business_hours')
          .select('*')
          .order('weekday', { ascending: true }),
        supabase
          .from('blocked_dates')
          .select('*')
          .order('blocked_date', { ascending: true }),
        supabase
          .from('business_settings')
          .select('*')
          .limit(1)
          .maybeSingle(),
      ]);

      if (!servicesRes.error && servicesRes.data) {
        if (servicesRes.data.length > 0) {
          setActiveServices(servicesRes.data as ServiceRow[]);
        } else {
          // Check if the services table is completely unseeded vs intentionally all deactivated
          const { count } = await supabase
            .from('services')
            .select('id', { count: 'exact', head: true });

          if (count === 0) {
            setActiveServices(
              INITIAL_SHOWCASE_SERVICES.map((svc, idx) => ({
                ...svc,
                id: `showcase-${idx + 1}`,
              }))
            );
          } else {
            setActiveServices([]);
          }
        }
      }

      if (!hoursRes.error && hoursRes.data && hoursRes.data.length > 0) {
        setBusinessHours(hoursRes.data as BusinessHourRow[]);
      }

      if (!blockedRes.error && blockedRes.data) {
        setBlockedDates(blockedRes.data as BlockedDateRow[]);
      }

      if (!settingsRes.error && settingsRes.data) {
        setBusinessSettings(settingsRes.data as BusinessSettingsRow);
      }
    } catch {
      // Preserve clean fallback defaults if network temporarily unavailable
    } finally {
      setPublicLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPublicData();
  }, [loadPublicData]);

  // Summarize operating hours dynamically from business_hours
  const operatingHoursSummary = useMemo(() => {
    const mon = businessHours.find((b) => Number(b.weekday) === 1);
    const sat = businessHours.find((b) => Number(b.weekday) === 6);
    const sun = businessHours.find((b) => Number(b.weekday) === 0);

    if (
      mon?.is_open &&
      sat?.is_open &&
      mon.start_time === sat.start_time &&
      mon.end_time === sat.end_time
    ) {
      const monSatStr = `Mon - Sat: ${formatTimeStringDisplay(mon.start_time)} - ${formatTimeStringDisplay(mon.end_time)}`;
      const sunStr = sun?.is_open
        ? `Sun: ${formatTimeStringDisplay(sun.start_time)} - ${formatTimeStringDisplay(sun.end_time)}`
        : 'Sun: Closed';
      return `${monSatStr} | ${sunStr}`;
    }

    return 'Mon - Sat: 9:00 AM - 7:00 PM | Sun: 10:00 AM - 4:00 PM';
  }, [businessHours]);

  const scrollToBookingSection = (serviceId?: string) => {
    if (serviceId) {
      setPreselectedServiceId(serviceId);
    }
    const el = document.getElementById('booking');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (route === 'admin') {
    return (
      <AdminGate
        businessName={businessSettings.business_name}
        onBackToSite={() => navigateTo('public')}
      >
        {({ userEmail, onSignOut }) => (
          <AdminDashboard
            userEmail={userEmail}
            onSignOut={onSignOut}
            onNavigatePublic={() => navigateTo('public')}
            publicSettings={businessSettings}
            onGlobalRefreshPublicData={loadPublicData}
          />
        )}
      </AdminGate>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-ivory-50 text-espresso-900">
      <Navbar
        businessName={businessSettings.business_name}
        onNavigateAdmin={() => navigateTo('admin')}
        onScrollToBooking={() => scrollToBookingSection()}
      />

      {!isSupabaseConfigured && (
        <div className="bg-champagne-100 border-b border-taupe-300 px-6 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-espresso-800">
            <p className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-rosebronze-600 shrink-0" />
              <span>
                Connect your Supabase credentials in <code className="font-mono">.env.local</code> to activate live reservation persistence and admin login.
              </span>
            </p>
            <button
              type="button"
              onClick={() => setSetupModalOpen(true)}
              className="font-semibold text-rosebronze-600 hover:text-espresso-900 underline underline-offset-4 cursor-pointer whitespace-nowrap"
            >
              View SQL Schema &amp; Setup Guide
            </button>
          </div>
        </div>
      )}

      <main className="flex-1">
        <HeroSection
          settings={businessSettings}
          operatingSummary={operatingHoursSummary}
          onBookNow={() => scrollToBookingSection()}
        />

        <ServicesSection
          services={activeServices}
          isLoading={publicLoading}
          onSelectServiceForBooking={(serviceId) => scrollToBookingSection(serviceId)}
        />

        <AboutSection
          settings={businessSettings}
          onScheduleVisit={() => scrollToBookingSection()}
        />

        <BookingSection
          services={activeServices}
          businessHours={businessHours}
          blockedDates={blockedDates}
          settings={businessSettings}
          preselectedServiceId={preselectedServiceId}
          localBookedIntervals={localBookedIntervals}
          onBookingCreatedLocalRecord={(rec) =>
            setLocalBookedIntervals((prev) => [...prev, rec])
          }
        />
      </main>

      <Footer
        settings={businessSettings}
        operatingSummary={operatingHoursSummary}
        onNavigateAdmin={() => navigateTo('admin')}
      />

      <SupabaseSetupModal
        isOpen={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
      />
    </div>
  );
}
