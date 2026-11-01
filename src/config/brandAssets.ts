import heroLobbyImg from '../assets/images/hero_luxury_hotel_lobby_1793555876885.jpg';
import serviceConciergeImg from '../assets/images/service_online_booking_concierge_1793555878009.jpg';
import serviceSuiteImg from '../assets/images/service_premier_suite_sanctuary_1793555879799.jpg';
import serviceWellnessImg from '../assets/images/service_private_lounge_wellness_1793555881358.jpg';
import aboutSanctuaryImg from '../assets/images/about_hospitality_consultation_1793555881043.jpg';
import { BusinessHourRow, BusinessSettingsRow, ServiceRow } from '../types/database';

/**
 * Centralized hotel imagery configuration so visuals remain easy to replace or customize.
 */
export const HOTEL_IMAGES = {
  heroLobby: {
    src: heroLobbyImg,
    alt: 'Sunlit travertine reception and calm guest lounge at Gloden Key Prime Real Booking in Pathein',
  },
  aboutSanctuary: {
    src: aboutSanctuaryImg,
    alt: 'Warm arched hospitality gallery and personal concierge desk at Gloden Key Prime Real Booking',
  },
  services: [
    {
      src: serviceConciergeImg,
      alt: 'Personal hotel reservation concierge assisting guests with OnlineHotelBooingService',
    },
    {
      src: serviceSuiteImg,
      alt: 'Refined boutique suite interior with warm organic linens and natural daylight',
    },
    {
      src: serviceWellnessImg,
      alt: 'Private hospitality personal care and relaxation suite with warm stone finishes',
    },
  ],
} as const;

export function getServiceVisual(serviceName: string, index: number) {
  const normalized = serviceName.toLowerCase();
  if (normalized.includes('online') || normalized.includes('booing') || normalized.includes('booking') || normalized.includes('concierge')) {
    return HOTEL_IMAGES.services[0];
  }
  if (normalized.includes('suite') || normalized.includes('stay') || normalized.includes('room')) {
    return HOTEL_IMAGES.services[1];
  }
  if (normalized.includes('care') || normalized.includes('wellness') || normalized.includes('lounge') || normalized.includes('retreat')) {
    return HOTEL_IMAGES.services[2];
  }
  return HOTEL_IMAGES.services[index % HOTEL_IMAGES.services.length];
}

export function formatServiceTitle(rawName: string): { displayTitle: string; subtitleTag?: string } {
  if (rawName === 'OnlineHotelBooingService') {
    return {
      displayTitle: 'OnlineHotelBooingService',
      subtitleTag: 'Signature Online Hotel Reservation & Concierge Session',
    };
  }
  return { displayTitle: rawName };
}

export const DEFAULT_BUSINESS_SETTINGS: Omit<BusinessSettingsRow, 'id' | 'created_at'> = {
  business_name: 'Gloden Key Prime Real Booking',
  business_email: 'reservations@glodenkeyprime.com',
  business_phone: '+95 976775165',
  business_address: ' Pathein',
  slot_interval_minutes: 30,
  booking_notice_hours: 2,
};

export const DEFAULT_BUSINESS_HOURS: Omit<BusinessHourRow, 'id'>[] = [
  { weekday: 0, is_open: true, start_time: '10:00:00', end_time: '16:00:00' }, // Sunday: 10:00 AM - 4:00 PM
  { weekday: 1, is_open: true, start_time: '09:00:00', end_time: '19:00:00' }, // Monday: 9:00 AM - 7:00 PM
  { weekday: 2, is_open: true, start_time: '09:00:00', end_time: '19:00:00' }, // Tuesday
  { weekday: 3, is_open: true, start_time: '09:00:00', end_time: '19:00:00' }, // Wednesday
  { weekday: 4, is_open: true, start_time: '09:00:00', end_time: '19:00:00' }, // Thursday
  { weekday: 5, is_open: true, start_time: '09:00:00', end_time: '19:00:00' }, // Friday
  { weekday: 6, is_open: true, start_time: '09:00:00', end_time: '19:00:00' }, // Saturday
];

export const INITIAL_SHOWCASE_SERVICES: Omit<ServiceRow, 'id' | 'created_at'>[] = [
  {
    name: 'OnlineHotelBooingService',
    description:
      'Personalized hotel reservation consultation and instant suite allocation with dedicated arrival preparation, welcome refreshments, and tailored room preferences in Pathein.',
    duration_minutes: 60,
    price: 85,
    is_active: true,
  },
  {
    name: 'Premier Sanctuary Suite Reservation',
    description:
      'Full-service private suite booking Consultation & Express Check-In arrangement featuring tranquil garden views, bespoke linen selection, and personal hospitality care.',
    duration_minutes: 90,
    price: 145,
    is_active: true,
  },
  {
    name: 'Executive Day Lounge & Personal Care Session',
    description:
      'Calm private hospitality suite access designed for restorative daytime relaxation, quiet lounge refreshments, and attentive guest concierge service.',
    duration_minutes: 120,
    price: 190,
    is_active: true,
  },
];

export const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const SUPABASE_SETUP_SQL = `-- Gloden Key Prime Real Booking — Exact Supabase Schema & RLS Setup

create extension if not exists "pgcrypto";

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  duration_minutes integer not null default 60,
  price numeric(10,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  service_id uuid not null references public.services(id) on delete restrict,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.business_hours (
  id uuid primary key default gen_random_uuid(),
  weekday integer not null unique check (weekday >= 0 and weekday <= 6),
  is_open boolean not null default true,
  start_time time not null default '09:00:00',
  end_time time not null default '19:00:00'
);

create table if not exists public.blocked_dates (
  id uuid primary key default gen_random_uuid(),
  blocked_date date not null unique,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.business_settings (
  id uuid primary key default gen_random_uuid(),
  business_name text not null default 'Gloden Key Prime Real Booking',
  business_email text not null default 'reservations@glodenkeyprime.com',
  business_phone text not null default '+95 976775165',
  business_address text not null default ' Pathein',
  slot_interval_minutes integer not null default 30,
  booking_notice_hours integer not null default 2,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.services enable row level security;
alter table public.appointments enable row level security;
alter table public.business_hours enable row level security;
alter table public.blocked_dates enable row level security;
alter table public.business_settings enable row level security;
alter table public.admin_users enable row level security;

-- Admin helper check
create or replace function public.is_admin_user()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

-- Public read access for configuration tables (NOT appointments)
create policy "Public read services" on public.services for select using (true);
create policy "Admin manage services" on public.services for all using (public.is_admin_user()) with check (public.is_admin_user());

create policy "Public insert appointments" on public.appointments for insert with check (true);
create policy "Admin read appointments" on public.appointments for select using (public.is_admin_user());
create policy "Admin update appointments" on public.appointments for update using (public.is_admin_user()) with check (public.is_admin_user());
create policy "Admin delete appointments" on public.appointments for delete using (public.is_admin_user());

create policy "Public read business_hours" on public.business_hours for select using (true);
create policy "Admin manage business_hours" on public.business_hours for all using (public.is_admin_user()) with check (public.is_admin_user());

create policy "Public read blocked_dates" on public.blocked_dates for select using (true);
create policy "Admin manage blocked_dates" on public.blocked_dates for all using (public.is_admin_user()) with check (public.is_admin_user());

create policy "Public read business_settings" on public.business_settings for select using (true);
create policy "Admin manage business_settings" on public.business_settings for all using (public.is_admin_user()) with check (public.is_admin_user());

create policy "Authenticated check own admin row" on public.admin_users for select to authenticated using (user_id = auth.uid());

-- Seed Initial Business Settings & Operating Hours
insert into public.business_settings (business_name, business_email, business_phone, business_address, slot_interval_minutes, booking_notice_hours)
select 'Gloden Key Prime Real Booking', 'reservations@glodenkeyprime.com', '+95 976775165', ' Pathein', 30, 2
where not exists (select 1 from public.business_settings);

insert into public.business_hours (weekday, is_open, start_time, end_time) values
  (0, true, '10:00:00', '16:00:00'),
  (1, true, '09:00:00', '19:00:00'),
  (2, true, '09:00:00', '19:00:00'),
  (3, true, '09:00:00', '19:00:00'),
  (4, true, '09:00:00', '19:00:00'),
  (5, true, '09:00:00', '19:00:00'),
  (6, true, '09:00:00', '19:00:00')
on conflict (weekday) do nothing;

insert into public.services (name, description, duration_minutes, price, is_active)
select 'OnlineHotelBooingService', 'Personalized hotel reservation consultation and instant suite allocation with dedicated arrival preparation and personal concierge care in Pathein.', 60, 85.00, true
where not exists (select 1 from public.services);
`;
