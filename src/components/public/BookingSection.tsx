import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { formatServiceTitle } from '../../config/brandAssets';
import {
  formatDateStringDisplay,
  formatTimeLabel,
  generateAvailableSlots,
  toSupabaseDate,
  toSupabaseTime,
} from '../../lib/availability';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import {
  AppointmentRow,
  BlockedDateRow,
  BusinessHourRow,
  BusinessSettingsRow,
  NormalizedTimeSlot,
  ServiceRow,
} from '../../types/database';

interface BookingSectionProps {
  services: ServiceRow[];
  businessHours: BusinessHourRow[];
  blockedDates: BlockedDateRow[];
  settings: BusinessSettingsRow;
  preselectedServiceId: string | null;
  onBookingCreatedLocalRecord?: (record: Pick<AppointmentRow, 'appointment_date' | 'start_time' | 'end_time' | 'status'>) => void;
  localBookedIntervals: Pick<AppointmentRow, 'appointment_date' | 'start_time' | 'end_time' | 'status'>[];
}

interface ConfirmedBookingSummary {
  serviceName: string;
  durationMinutes: number;
  price: number;
  appointmentDateDisplay: string;
  slotLabel: string;
  fullName: string;
  email: string;
  phone: string;
  notes: string;
}

export const BookingSection: React.FC<BookingSectionProps> = ({
  services,
  businessHours,
  blockedDates,
  settings,
  preselectedServiceId,
  onBookingCreatedLocalRecord,
  localBookedIntervals,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => toSupabaseDate(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<NormalizedTimeSlot | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [remoteDayAppointments, setRemoteDayAppointments] = useState<
    Pick<AppointmentRow, 'appointment_date' | 'start_time' | 'end_time' | 'status'>[]
  >([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmedSummary, setConfirmedSummary] = useState<ConfirmedBookingSummary | null>(null);

  // Sync initial or externally selected service
  useEffect(() => {
    if (preselectedServiceId && services.some((s) => s.id === preselectedServiceId)) {
      setSelectedServiceId(preselectedServiceId);
      setSelectedSlot(null);
      setStep((prev) => (prev === 4 ? 2 : Math.max(prev, 2) as 1 | 2 | 3 | 4));
    } else if (!selectedServiceId && services.length > 0) {
      setSelectedServiceId(services[0].id);
    }
  }, [preselectedServiceId, services, selectedServiceId]);

  const selectedService = useMemo(
    () => services.find((s) => s.id === selectedServiceId) || services[0] || null,
    [services, selectedServiceId]
  );

  // Best-effort check of existing appointments if an authenticated session (e.g. manager testing) can read them;
  // gracefully returns empty array for anonymous guests since public SELECT on appointments is intentionally disabled.
  useEffect(() => {
    let active = true;
    async function loadDayConflicts() {
      if (!isSupabaseConfigured || !selectedDateStr) {
        setRemoteDayAppointments([]);
        return;
      }
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session) {
          if (active) setRemoteDayAppointments([]);
          return;
        }
        const { data, error } = await supabase
          .from('appointments')
          .select('appointment_date, start_time, end_time, status')
          .eq('appointment_date', selectedDateStr)
          .neq('status', 'cancelled');

        if (!error && data && active) {
          setRemoteDayAppointments(data as Pick<AppointmentRow, 'appointment_date' | 'start_time' | 'end_time' | 'status'>[]);
        }
      } catch {
        if (active) setRemoteDayAppointments([]);
      }
    }
    loadDayConflicts();
    return () => {
      active = false;
    };
  }, [selectedDateStr]);

  // Combine any known session appointments with local bookings made in this browser session
  const combinedExistingAppointments = useMemo(() => {
    return [...remoteDayAppointments, ...localBookedIntervals];
  }, [remoteDayAppointments, localBookedIntervals]);

  // Generate 14-day quick selector pills + full date input
  const upcomingDates = useMemo(() => {
    const list: { dateStr: string; dayShort: string; dayNum: string; monthShort: string; isBlocked: boolean; isClosed: boolean }[] = [];
    const base = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i, 12, 0, 0);
      const dateStr = toSupabaseDate(d);
      const weekday = d.getDay();
      const dayConfig = businessHours.find((bh) => Number(bh.weekday) === weekday);
      const isClosed = !dayConfig || !dayConfig.is_open;
      const isBlocked = blockedDates.some((b) => b.blocked_date === dateStr);
      list.push({
        dateStr,
        dayShort: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d),
        dayNum: String(d.getDate()).padStart(2, '0'),
        monthShort: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(d),
        isBlocked,
        isClosed,
      });
    }
    return list;
  }, [businessHours, blockedDates]);

  const slotResult = useMemo(() => {
    if (!selectedService || !selectedDateStr) {
      return { slots: [], reasonIfEmpty: 'no_slots_available' as const };
    }
    return generateAvailableSlots({
      selectedDateStr,
      service: selectedService,
      businessHours,
      businessSettings: settings,
      blockedDates,
      existingAppointments: combinedExistingAppointments,
      now: new Date(),
    });
  }, [selectedDateStr, selectedService, businessHours, settings, blockedDates, combinedExistingAppointments]);

  // Clear selectedSlot if it no longer exists in recalculated slots
  useEffect(() => {
    if (selectedSlot) {
      const stillValid = slotResult.slots.some(
        (s) => s.start.getTime() === selectedSlot.start.getTime() && s.end.getTime() === selectedSlot.end.getTime()
      );
      if (!stillValid) {
        setSelectedSlot(null);
      }
    }
  }, [slotResult.slots, selectedSlot]);

  const blockedReasonText = useMemo(() => {
    const found = blockedDates.find((b) => b.blocked_date === selectedDateStr);
    return found?.reason || 'Reserved for private property maintenance or holiday closure.';
  }, [blockedDates, selectedDateStr]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedService) {
      setFormError('Please select a hospitality service first.');
      return;
    }
    if (!selectedSlot) {
      setFormError('Please choose an available date and time slot.');
      return;
    }
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const trimmedNotes = notes.trim();

    if (!trimmedName) {
      setFormError('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (trimmedPhone.length < 6) {
      setFormError('Please enter a reachable phone or WhatsApp number.');
      return;
    }

    if (!isSupabaseConfigured) {
      setFormError(
        'Supabase credentials are not configured yet. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local to submit live bookings.'
      );
      return;
    }

    if (selectedService.id.startsWith('showcase-')) {
      setFormError(
        'Your Supabase services table does not have seeded rows yet. Sign in to the Management Dashboard → Services and click "Seed Initial Services" first.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const appointmentDateFormatted = toSupabaseDate(selectedSlot.start);
      const startTimeFormatted = toSupabaseTime(selectedSlot.start);
      const endTimeFormatted = toSupabaseTime(selectedSlot.end);

      // CRITICAL RULE: Insert ONLY — do NOT chain .select() or .single() because public users do not have SELECT permission on appointments.
      const { error } = await supabase.from('appointments').insert({
        full_name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        service_id: selectedService.id,
        appointment_date: appointmentDateFormatted,
        start_time: startTimeFormatted,
        end_time: endTimeFormatted,
        status: 'pending',
        notes: trimmedNotes ? trimmedNotes : null,
      });

      if (error) {
        throw error;
      }

      onBookingCreatedLocalRecord?.({
        appointment_date: appointmentDateFormatted,
        start_time: startTimeFormatted,
        end_time: endTimeFormatted,
        status: 'pending',
      });

      setConfirmedSummary({
        serviceName: selectedService.name,
        durationMinutes: selectedService.duration_minutes,
        price: Number(selectedService.price || 0),
        appointmentDateDisplay: formatDateStringDisplay(appointmentDateFormatted),
        slotLabel: `${formatTimeLabel(selectedSlot.start)} – ${formatTimeLabel(selectedSlot.end)}`,
        fullName: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        notes: trimmedNotes,
      });

      setStep(4);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unable to submit your reservation right now. Please try again.';
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookAnother = () => {
    setSelectedSlot(null);
    setNotes('');
    setConfirmedSummary(null);
    setFormError(null);
    setStep(1);
  };

  return (
    <section id="booking" className="py-20 md:py-28 bg-ivory-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-medium text-rosebronze-600">
            Online Hotel Reservation
          </p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl md:text-[42px] font-semibold text-espresso-900 leading-tight text-balance">
            Schedule Your Visit &amp; Suite Consultation
          </h2>
          <p className="mt-3 text-sm sm:text-base text-umber-600 leading-relaxed">
            Select your preferred hotel booking service, choose an available time window, and our Pathein concierge team will prepare your reservation.
          </p>
        </div>

        {/* Step Progress Bar */}
        <div className="mb-10 grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-champagne-200 pb-6">
          {[
            { num: 1, title: 'Select Service' },
            { num: 2, title: 'Date & Time' },
            { num: 3, title: 'Guest Details' },
            { num: 4, title: 'Confirmation' },
          ].map((item) => {
            const isActive = step === item.num;
            const isCompleted = step > item.num;
            return (
              <button
                key={item.num}
                type="button"
                disabled={item.num === 4 || (item.num === 3 && !selectedSlot) || (item.num === 2 && !selectedService)}
                onClick={() => {
                  if (item.num < 4) setStep(item.num as 1 | 2 | 3);
                }}
                className={`flex items-center gap-3 text-left p-3 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-champagne-100 text-espresso-900'
                    : isCompleted
                    ? 'text-espresso-800 hover:bg-ivory-100 cursor-pointer'
                    : 'text-umber-600/60 cursor-default'
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold tabular-nums shrink-0 ${
                    isActive
                      ? 'bg-rosebronze-500 text-ivory-50'
                      : isCompleted
                      ? 'bg-espresso-900 text-ivory-50'
                      : 'border border-taupe-300 text-umber-600'
                  }`}
                >
                  {item.num}
                </span>
                <span className="text-xs sm:text-sm font-semibold whitespace-nowrap truncate">
                  {item.title}
                </span>
              </button>
            );
          })}
        </div>

        {step === 4 && confirmedSummary ? (
          /* Step 4: Elegant Confirmation Screen */
          <div className="max-w-3xl mx-auto rounded-2xl border border-taupe-300 bg-ivory-100/80 p-8 sm:p-12">
            <div className="flex items-center gap-3 text-rosebronze-600">
              <CheckCircle2 className="w-7 h-7 shrink-0" />
              <span className="text-xs font-semibold tracking-wide">
                Reservation Request Received
              </span>
            </div>

            <h3 className="mt-3 font-display text-3xl sm:text-4xl font-semibold text-espresso-900">
              Thank You, {confirmedSummary.fullName}
            </h3>
            <p className="mt-2 text-sm sm:text-base text-umber-600 leading-relaxed">
              Your appointment request with <strong className="font-semibold text-espresso-900">{settings.business_name}</strong> has been recorded. Our concierge desk in {settings.business_address?.trim() || 'Pathein'} will reach out if any arrival preferences are needed.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-y border-taupe-300/80 text-sm">
              <div>
                <p className="text-xs text-umber-600">Selected Service</p>
                <p className="mt-1 font-semibold text-espresso-900">
                  {confirmedSummary.serviceName}
                </p>
                <p className="text-xs text-umber-600 mt-0.5 tabular-nums">
                  {confirmedSummary.durationMinutes} mins · ${confirmedSummary.price.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-umber-600">Scheduled Date &amp; Time</p>
                <p className="mt-1 font-semibold text-espresso-900">
                  {confirmedSummary.appointmentDateDisplay}
                </p>
                <p className="text-xs text-rosebronze-600 font-mono mt-0.5 tabular-nums">
                  {confirmedSummary.slotLabel}
                </p>
              </div>
              <div>
                <p className="text-xs text-umber-600">Guest Contact</p>
                <p className="mt-1 font-medium text-espresso-900">{confirmedSummary.email}</p>
                <p className="text-xs text-umber-600 mt-0.5 tabular-nums">{confirmedSummary.phone}</p>
              </div>
              <div>
                <p className="text-xs text-umber-600">Property Concierge</p>
                <p className="mt-1 font-medium text-espresso-900">
                  {settings.business_address?.trim() || 'Pathein'}
                </p>
                <p className="text-xs text-umber-600 mt-0.5 tabular-nums">{settings.business_phone}</p>
              </div>
              {confirmedSummary.notes && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-umber-600">Special Guest Notes</p>
                  <p className="mt-1 text-espresso-800">{confirmedSummary.notes}</p>
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs text-umber-600">
                Need immediate assistance? Call or WhatsApp <span className="font-semibold text-espresso-900 tabular-nums">{settings.business_phone}</span>
              </p>
              <button
                type="button"
                onClick={handleBookAnother}
                className="px-5 py-2.5 rounded-xl bg-espresso-900 hover:bg-rosebronze-600 text-ivory-50 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Schedule Another Booking
              </button>
            </div>
          </div>
        ) : (
          /* Interactive Steps 1-3 + Sticky Summary Sidebar */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-8 rounded-2xl border border-taupe-300 bg-ivory-100/60 p-6 sm:p-8">
              {/* STEP 1: SERVICE SELECTION */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display text-2xl font-semibold text-espresso-900">
                      1. Choose Your Hospitality Service
                    </h3>
                    <p className="text-xs sm:text-sm text-umber-600 mt-1">
                      Select a service below to view real-time availability.
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    {services.map((service) => {
                      const isSelected = selectedService?.id === service.id;
                      const { displayTitle, subtitleTag } = formatServiceTitle(service.name);
                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => {
                            setSelectedServiceId(service.id);
                            setSelectedSlot(null);
                          }}
                          className={`w-full text-left p-5 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-rosebronze-500 bg-blush-50/90 shadow-xs'
                              : 'border-taupe-300/90 bg-ivory-50 hover:border-taupe-400'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <p className="font-display text-xl font-semibold text-espresso-900">
                                {displayTitle}
                              </p>
                              {subtitleTag && (
                                <p className="text-xs font-medium text-rosebronze-600 mt-0.5">
                                  {subtitleTag}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-mono font-medium text-espresso-900 tabular-nums shrink-0">
                              <span>{service.duration_minutes} min</span>
                              <span aria-hidden="true">·</span>
                              <span>${Number(service.price || 0).toFixed(2)}</span>
                            </div>
                          </div>
                          {service.description && (
                            <p className="mt-2.5 text-xs sm:text-sm text-umber-600 leading-relaxed">
                              {service.description}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      disabled={!selectedService}
                      onClick={() => setStep(2)}
                      className="px-6 py-3 rounded-xl bg-rosebronze-500 hover:bg-rosebronze-600 disabled:opacity-50 text-ivory-50 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Continue to Date &amp; Time
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: DATE & AVAILABLE TIME SLOTS */}
              {step === 2 && (
                <div className="space-y-7">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-display text-2xl font-semibold text-espresso-900">
                        2. Select Date &amp; Available Time
                      </h3>
                      <p className="text-xs sm:text-sm text-umber-600 mt-1">
                        Showing available windows for <strong className="text-espresso-900">{selectedService?.name}</strong> ({selectedService?.duration_minutes} mins).
                      </p>
                    </div>
                    <div className="shrink-0">
                      <label htmlFor="custom-booking-date" className="sr-only">
                        Pick any calendar date
                      </label>
                      <input
                        id="custom-booking-date"
                        type="date"
                        min={toSupabaseDate(new Date())}
                        value={selectedDateStr}
                        onChange={(e) => {
                          if (e.target.value) {
                            setSelectedDateStr(e.target.value);
                            setSelectedSlot(null);
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl border border-taupe-300 bg-ivory-50 text-xs font-mono text-espresso-900 focus:outline-none focus:border-rosebronze-500"
                      />
                    </div>
                  </div>

                  {/* Quick 14-Day Horizontal Date Strip */}
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {upcomingDates.map((d) => {
                      const isSelected = d.dateStr === selectedDateStr;
                      const isUnavailable = d.isBlocked || d.isClosed;
                      return (
                        <button
                          key={d.dateStr}
                          type="button"
                          onClick={() => {
                            setSelectedDateStr(d.dateStr);
                            setSelectedSlot(null);
                          }}
                          className={`p-2.5 rounded-xl border text-center transition-colors cursor-pointer ${
                            isSelected
                              ? 'border-rosebronze-500 bg-rosebronze-500 text-ivory-50'
                              : isUnavailable
                              ? 'border-champagne-200 bg-champagne-100/50 text-umber-600/50'
                              : 'border-taupe-300 bg-ivory-50 hover:border-rosebronze-500/60 text-espresso-900'
                          }`}
                        >
                          <p className="text-[11px] font-medium">{d.dayShort}</p>
                          <p className="text-base font-semibold tabular-nums mt-0.5">{d.dayNum}</p>
                          <p className="text-[10px] opacity-80">{d.monthShort}</p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Available Time Slots Grid */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-espresso-900 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-rosebronze-600" />
                        <span>Available Slots for {formatDateStringDisplay(selectedDateStr)}</span>
                      </p>
                      <span className="text-xs text-umber-600 tabular-nums">
                        Notice required: {settings.booking_notice_hours}h
                      </span>
                    </div>

                    {slotResult.slots.length === 0 ? (
                      <div className="rounded-xl border border-taupe-300 bg-ivory-50 p-8 text-center">
                        <Calendar className="w-6 h-6 text-rosebronze-500 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-espresso-900">
                          {slotResult.reasonIfEmpty === 'blocked_date'
                            ? 'Selected Date Is Unavailable'
                            : slotResult.reasonIfEmpty === 'closed_weekday'
                            ? 'Reception Closed on Selected Day'
                            : 'No Open Time Slots Remaining'}
                        </p>
                        <p className="mt-1 text-xs text-umber-600 max-w-md mx-auto">
                          {slotResult.reasonIfEmpty === 'blocked_date'
                            ? blockedReasonText
                            : slotResult.reasonIfEmpty === 'closed_weekday'
                            ? 'Please select an operating day to view available booking windows.'
                            : 'All booking windows within notice hours have passed or been reserved for this date. Please select another date above.'}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                        {slotResult.slots.map((slot) => {
                          const isChosen =
                            selectedSlot &&
                            selectedSlot.start.getTime() === slot.start.getTime();
                          return (
                            <button
                              key={slot.start.toISOString()}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              className={`px-3.5 py-3 rounded-xl border text-xs font-mono tabular-nums transition-all cursor-pointer whitespace-nowrap ${
                                isChosen
                                  ? 'border-rosebronze-600 bg-rosebronze-500 text-ivory-50 font-semibold shadow-xs'
                                  : 'border-taupe-300 bg-ivory-50 hover:border-rosebronze-500 text-espresso-900'
                              }`}
                            >
                              {formatTimeLabel(slot.start)}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex items-center justify-between gap-4 border-t border-champagne-200">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 py-2.5 rounded-xl border border-taupe-300 text-xs font-semibold text-espresso-800 hover:bg-ivory-50 transition-colors cursor-pointer"
                    >
                      Back to Services
                    </button>
                    <button
                      type="button"
                      disabled={!selectedSlot}
                      onClick={() => setStep(3)}
                      className="px-6 py-3 rounded-xl bg-rosebronze-500 hover:bg-rosebronze-600 disabled:opacity-50 text-ivory-50 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      Continue to Guest Details
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: CLIENT / GUEST DETAILS FORM */}
              {step === 3 && (
                <form onSubmit={handleBookingSubmit} className="space-y-6">
                  <div>
                    <h3 className="font-display text-2xl font-semibold text-espresso-900">
                      3. Enter Your Guest Information
                    </h3>
                    <p className="text-xs sm:text-sm text-umber-600 mt-1">
                      Please share your contact details so our hospitality desk can confirm your reservation.
                    </p>
                  </div>

                  {formError && (
                    <div
                      role="alert"
                      className="p-4 rounded-xl border border-red-300 bg-red-50 text-red-900 text-xs sm:text-sm"
                    >
                      {formError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <label htmlFor="guest-full-name" className="block text-xs font-semibold text-espresso-900 mb-1.5">
                        Full Name *
                      </label>
                      <input
                        id="guest-full-name"
                        type="text"
                        required
                        placeholder="e.g. U Aung Kyaw"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-taupe-300 bg-ivory-50 text-sm text-espresso-900 placeholder:text-umber-600/50 focus:outline-none focus:border-rosebronze-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="guest-email" className="block text-xs font-semibold text-espresso-900 mb-1.5">
                        Email Address *
                      </label>
                      <input
                        id="guest-email"
                        type="email"
                        required
                        placeholder="guest@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-taupe-300 bg-ivory-50 text-sm text-espresso-900 placeholder:text-umber-600/50 focus:outline-none focus:border-rosebronze-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="guest-phone" className="block text-xs font-semibold text-espresso-900 mb-1.5">
                        Phone / WhatsApp *
                      </label>
                      <input
                        id="guest-phone"
                        type="tel"
                        required
                        placeholder="+95 9..."
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-taupe-300 bg-ivory-50 text-sm text-espresso-900 placeholder:text-umber-600/50 focus:outline-none focus:border-rosebronze-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="guest-notes" className="block text-xs font-semibold text-espresso-900 mb-1.5">
                        Special Preferences or Arrival Notes (Optional)
                      </label>
                      <textarea
                        id="guest-notes"
                        rows={3}
                        placeholder="Let us know your suite preference, quiet floor request, or arrival timing..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-taupe-300 bg-ivory-50 text-sm text-espresso-900 placeholder:text-umber-600/50 focus:outline-none focus:border-rosebronze-500 resize-none"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between gap-4 border-t border-champagne-200">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-4 py-2.5 rounded-xl border border-taupe-300 text-xs font-semibold text-espresso-800 hover:bg-ivory-50 transition-colors cursor-pointer"
                    >
                      Back to Time Slots
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-3.5 rounded-xl bg-rosebronze-500 hover:bg-rosebronze-600 disabled:opacity-60 text-ivory-50 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {submitting ? 'Confirming Reservation...' : 'Confirm Booking Request'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Live Appointment Summary Card */}
            <aside className="lg:col-span-4 rounded-2xl border border-taupe-300 bg-champagne-100/60 p-6 sm:p-7 space-y-5">
              <div className="flex items-center gap-2 text-rosebronze-600">
                <Sparkles className="w-4 h-4" />
                <h4 className="text-xs font-semibold tracking-wide uppercase">
                  Reservation Summary
                </h4>
              </div>

              <div className="space-y-4 text-sm border-y border-taupe-300/80 py-5">
                <div>
                  <p className="text-xs text-umber-600">Hospitality Property</p>
                  <p className="font-semibold text-espresso-900 mt-0.5">
                    {settings.business_name}
                  </p>
                  <p className="text-xs text-umber-600">
                    {settings.business_address?.trim() || 'Pathein'} · {settings.business_phone}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-umber-600">Selected Service</p>
                  <p className="font-semibold text-espresso-900 mt-0.5 break-words">
                    {selectedService ? selectedService.name : 'Not selected yet'}
                  </p>
                  {selectedService && (
                    <p className="text-xs font-mono text-umber-600 mt-0.5 tabular-nums">
                      {selectedService.duration_minutes} minutes · ${Number(selectedService.price || 0).toFixed(2)}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-xs text-umber-600">Date &amp; Time Window</p>
                  <p className="font-medium text-espresso-900 mt-0.5">
                    {selectedDateStr ? formatDateStringDisplay(selectedDateStr) : 'Choose a date'}
                  </p>
                  <p className="text-xs font-mono text-rosebronze-600 mt-0.5 tabular-nums">
                    {selectedSlot ? selectedSlot.label : 'Select an open time slot'}
                  </p>
                </div>
              </div>

              <p className="text-xs text-umber-600 leading-relaxed">
                No advance card charge is taken online. Our Pathein reception team reviews and confirms every appointment promptly.
              </p>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
};
