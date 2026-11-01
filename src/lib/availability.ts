import {
  AppointmentRow,
  BlockedDateRow,
  BusinessHourRow,
  BusinessSettingsRow,
  NormalizedTimeSlot,
  ServiceRow,
} from '../types/database';

/**
 * Safely parses a "YYYY-MM-DD" string into local year, month (0-indexed), day numbers.
 */
export function parseLocalDateParts(dateStr: string): { year: number; monthIndex: number; day: number } | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.trim().split('-');
  if (parts.length !== 3) return null;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, monthIndex: month - 1, day };
}

/**
 * Safely parses "HH:mm" or "HH:mm:ss" into hours and minutes.
 */
export function parseTimeParts(timeStr: string): { hours: number; minutes: number } | null {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return null;
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes };
}

/**
 * Combines a "YYYY-MM-DD" date string and "HH:mm[:ss]" time string into a valid local Date object.
 */
export function combineDateAndTime(dateStr: string, timeStr: string): Date | null {
  const dateParts = parseLocalDateParts(dateStr);
  const timeParts = parseTimeParts(timeStr);
  if (!dateParts || !timeParts) return null;
  const combined = new Date(
    dateParts.year,
    dateParts.monthIndex,
    dateParts.day,
    timeParts.hours,
    timeParts.minutes,
    0,
    0
  );
  if (Number.isNaN(combined.getTime())) return null;
  return combined;
}

/**
 * Formats a real Date object as a Supabase-compatible date string: "YYYY-MM-DD"
 */
export function toSupabaseDate(dateObj: Date): string {
  if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) {
    throw new Error('Invalid Date object passed to toSupabaseDate');
  }
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Formats a real Date object as a Supabase-compatible time string: "HH:mm:ss"
 */
export function toSupabaseTime(dateObj: Date): string {
  if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) {
    throw new Error('Invalid Date object passed to toSupabaseTime');
  }
  const hh = String(dateObj.getHours()).padStart(2, '0');
  const mm = String(dateObj.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}:00`;
}

/**
 * Formats a real Date object into a friendly 12-hour label (e.g. "9:30 AM").
 */
export function formatTimeLabel(dateObj: Date): string {
  if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(dateObj);
}

/**
 * Formats a "HH:mm[:ss]" string into a readable 12-hour display string using a real Date object.
 */
export function formatTimeStringDisplay(timeStr: string): string {
  const combined = combineDateAndTime('2026-01-01', timeStr);
  if (!combined) return timeStr;
  return formatTimeLabel(combined);
}

/**
 * Formats a "YYYY-MM-DD" string into a full readable date (e.g. "Monday, November 2, 2026") using a real Date.
 */
export function formatDateStringDisplay(dateStr: string): string {
  const parts = parseLocalDateParts(dateStr);
  if (!parts) return dateStr;
  const dateObj = new Date(parts.year, parts.monthIndex, parts.day, 12, 0, 0);
  if (Number.isNaN(dateObj.getTime())) return dateStr;
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(dateObj);
}

export interface SlotGenerationParams {
  selectedDateStr: string; // YYYY-MM-DD
  service: ServiceRow;
  businessHours: BusinessHourRow[];
  businessSettings: Pick<BusinessSettingsRow, 'slot_interval_minutes' | 'booking_notice_hours'>;
  blockedDates: BlockedDateRow[];
  existingAppointments: Pick<AppointmentRow, 'appointment_date' | 'start_time' | 'end_time' | 'status'>[];
  now?: Date;
}

export interface SlotGenerationResult {
  slots: NormalizedTimeSlot[];
  reasonIfEmpty: 'blocked_date' | 'closed_weekday' | 'past_date' | 'no_slots_available' | null;
}

/**
 * Generates normalized available booking slots strictly following:
 * - business_hours
 * - services.duration_minutes
 * - business_settings.slot_interval_minutes
 * - business_settings.booking_notice_hours
 * - blocked_dates
 * - existing appointments (ignoring cancelled, enforcing new_start < existing_end && new_end > existing_start)
 */
export function generateAvailableSlots({
  selectedDateStr,
  service,
  businessHours,
  businessSettings,
  blockedDates,
  existingAppointments,
  now = new Date(),
}: SlotGenerationParams): SlotGenerationResult {
  const dateParts = parseLocalDateParts(selectedDateStr);
  if (!dateParts) {
    return { slots: [], reasonIfEmpty: 'no_slots_available' };
  }

  // Check if selected date is strictly before today
  const startOfSelectedDay = new Date(dateParts.year, dateParts.monthIndex, dateParts.day, 0, 0, 0, 0);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  if (startOfSelectedDay.getTime() < startOfToday.getTime()) {
    return { slots: [], reasonIfEmpty: 'past_date' };
  }

  // 1. Skip blocked dates
  const isBlocked = blockedDates.some((b) => b.blocked_date === selectedDateStr);
  if (isBlocked) {
    return { slots: [], reasonIfEmpty: 'blocked_date' };
  }

  // 2. Check business_hours for selected weekday
  const weekday = startOfSelectedDay.getDay();
  const daySchedule = businessHours.find((bh) => Number(bh.weekday) === weekday);
  if (!daySchedule || !daySchedule.is_open) {
    return { slots: [], reasonIfEmpty: 'closed_weekday' };
  }

  const dayOpenDate = combineDateAndTime(selectedDateStr, daySchedule.start_time);
  const dayCloseDate = combineDateAndTime(selectedDateStr, daySchedule.end_time);

  if (!dayOpenDate || !dayCloseDate || dayCloseDate.getTime() <= dayOpenDate.getTime()) {
    return { slots: [], reasonIfEmpty: 'closed_weekday' };
  }

  const durationMinutes = Math.max(5, Number(service.duration_minutes) || 60);
  const intervalMinutes = Math.max(5, Number(businessSettings.slot_interval_minutes) || 30);
  const noticeHours = Math.max(0, Number(businessSettings.booking_notice_hours) || 0);

  // Earliest permissible booking timestamp given booking_notice_hours
  const earliestAllowedStartMs = now.getTime() + noticeHours * 60 * 60 * 1000;

  // Pre-parse active (non-cancelled) appointments on selectedDateStr
  const activeIntervalsForDay = existingAppointments
    .filter((appt) => appt.appointment_date === selectedDateStr && appt.status !== 'cancelled')
    .map((appt) => {
      const start = combineDateAndTime(selectedDateStr, appt.start_time);
      const end = combineDateAndTime(selectedDateStr, appt.end_time);
      if (!start || !end) return null;
      return { startMs: start.getTime(), endMs: end.getTime() };
    })
    .filter((item): item is { startMs: number; endMs: number } => item !== null);

  const slots: NormalizedTimeSlot[] = [];
  let cursorMs = dayOpenDate.getTime();
  const dayCloseMs = dayCloseDate.getTime();
  const durationMs = durationMinutes * 60 * 1000;
  const stepMs = intervalMinutes * 60 * 1000;

  while (cursorMs + durationMs <= dayCloseMs) {
    const newStartMs = cursorMs;
    const newEndMs = cursorMs + durationMs;

    // Respect booking notice window
    if (newStartMs >= earliestAllowedStartMs) {
      // Overlap check: new_start < existing_end AND new_end > existing_start
      const hasOverlap = activeIntervalsForDay.some(
        (existing) => newStartMs < existing.endMs && newEndMs > existing.startMs
      );

      if (!hasOverlap) {
        const startObj = new Date(newStartMs);
        const endObj = new Date(newEndMs);
        slots.push({
          start: startObj,
          end: endObj,
          label: `${formatTimeLabel(startObj)} – ${formatTimeLabel(endObj)}`,
        });
      }
    }

    cursorMs += stepMs;
  }

  return {
    slots,
    reasonIfEmpty: slots.length === 0 ? 'no_slots_available' : null,
  };
}
