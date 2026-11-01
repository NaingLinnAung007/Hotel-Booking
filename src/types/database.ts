export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface ServiceRow {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  created_at?: string;
}

export interface AppointmentRow {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  service_id: string;
  appointment_date: string; // YYYY-MM-DD
  start_time: string;       // HH:mm:ss or HH:mm
  end_time: string;         // HH:mm:ss or HH:mm
  status: AppointmentStatus;
  notes: string | null;
  created_at?: string;
}

export interface AppointmentInsertPayload {
  full_name: string;
  email: string;
  phone: string;
  service_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  notes: string | null;
}

export interface BusinessHourRow {
  id: string;
  weekday: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  is_open: boolean;
  start_time: string; // HH:mm:ss or HH:mm
  end_time: string;   // HH:mm:ss or HH:mm
}

export interface BlockedDateRow {
  id: string;
  blocked_date: string; // YYYY-MM-DD
  reason: string | null;
  created_at?: string;
}

export interface BusinessSettingsRow {
  id: string;
  business_name: string;
  business_email: string;
  business_phone: string;
  business_address: string;
  slot_interval_minutes: number;
  booking_notice_hours: number;
  created_at?: string;
}

export interface AdminUserRow {
  id: string;
  user_id: string;
  created_at?: string;
}

export interface NormalizedTimeSlot {
  start: Date;
  end: Date;
  label: string;
}
