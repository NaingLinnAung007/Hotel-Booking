# Gloden Key Prime Real Booking — Luxury Hotel Booking & Management Platform

A bespoke, editorial hotel booking website and real-time reservation platform for **Gloden Key Prime Real Booking** in Pathein (`+95 976775165`), paired with a secure, product-grade admin dashboard powered by Supabase. Guests can browse curated hotel booking services, select real-time available slots, and submit instant booking requests, while hotel managers control appointments, services, operating hours, blocked dates, and business settings.

## User Review & Critical Decisions

> [!IMPORTANT]
> Below is a summary of your confirmed preferences from our clarification step, along with key architectural safeguards for your Supabase integration.

- **Confirmed Backend & Auth**: Connects directly to your existing Supabase project using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` via the official `@supabase/supabase-js` client with persistent browser sessions. If credentials are not yet pasted into `.env.local`, the app displays a calm, non-intrusive configuration banner with a one-click copyable SQL schema & RLS setup modal while remaining previewable.
- **Confirmed Brand & Copy Polish**: Preserves your exact brand identity (**Gloden Key Prime Real Booking**, **Pathein**, **+95 976775165**) and core service (**OnlineHotelBooingService**), framed with refined hospitality labels, editorial numbering, and warm guest-first language.
- **Confirmed Service Showcase & Seeding**: Dynamically loads active services from Supabase `services`, and supports showcasing `OnlineHotelBooingService` alongside curated suite, concierge, and stay consultation offerings (with a one-click seed helper in the Admin Services panel if your database starts empty).
- **Strict Public Insert Security**: Public appointment submissions execute `.insert([...])` without `.select()` or `.single()`, respecting strict Row-Level Security where guests can insert bookings without public `SELECT` access to other guests' private appointment records.

---

## 1. Overview & Core Concept

- **What It Does**: Delivers an end-to-end luxury hospitality booking experience on the public storefront and a full operational command center for property management under `/admin`.
- **Target Audience / Persona**:
  - *Guests & Travelers*: Discerning visitors seeking calm, trustworthy suite reservations, personalized stay consultations, and seamless online booking in Pathein.
  - *Hotel Owner / General Manager*: Staff managing daily arrivals, confirming reservations, adjusting seasonal operating hours, blocking maintenance/holiday dates, and curating active hospitality services.
- **Key Value**: Eliminates double-bookings and manual phone tag through deterministic slot-availability math while projecting the visual prestige of an international boutique hotel brand.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Guest Discovery & Storytelling**: Visitors arrive on a warm champagne-and-ivory editorial storefront featuring a strict 3-zone top bar (`Gloden Key Prime Real Booking` wordmark · `Services`, `Experience`, `Hours`, `Contact` · `Book Your Stay` CTA), a striking 16:9 architectural hotel lobby hero, an asymmetric Bento showcase of active hotel booking services, and an authentic Pathein hospitality story section.
2. **4-Step Guided Reservation Flow**:
   - *Step 1 — Select Service*: Choose `OnlineHotelBooingService` or another active hospitality service with transparent duration and pricing.
   - *Step 2 — Date & Time Slot*: Pick a valid calendar date (closed weekdays and `blocked_dates` are clearly marked unavailable) and choose a dynamically computed time slot normalized to `{ start: Date, end: Date, label: string }`.
   - *Step 3 — Guest Details*: Enter Full Name, Email, Phone (`+95...`), and optional special requests/notes alongside a live reservation summary panel.
   - *Step 4 — Instant Confirmation*: Submit directly to Supabase and transition smoothly to a refined confirmation card displaying the reservation reference details from validated form state.
3. **Secure Admin Authentication & Session Lifecycle**:
   - Navigating to `/admin` checks `supabase.auth.getSession()`, verifies the user via `supabase.auth.getUser()`, and queries `admin_users` where `user_id = user.id` using `.maybeSingle()`.
   - Always resolves loading inside a `finally` block so verification never hangs. Authenticated users missing from `admin_users` see the exact message: *"You are signed in, but you are not authorized as an admin."* with a clean Sign Out action.
4. **6-View Operational Admin Dashboard**:
   - **Overview**: KPI stat strip (Upcoming, Pending, Completed bookings, Active Services) with tabular numerals (`tabular-nums`) and today's arrival schedule.
   - **Appointments**: Searchable, status-filterable (`All`, `Pending`, `Confirmed`, `Completed`, `Cancelled`) reservation ledger with one-click status updates and full guest notes inspection.
   - **Services**: Full CRUD + activation lifecycle—create new services, open a pre-filled slide-over drawer to edit `name`, `description`, `duration_minutes`, `price`, and toggle `is_active` without hard-deleting historical foreign keys.
   - **Business Hours**: Interactive 7-day schedule editor (defaulting to `Mon–Sat: 09:00–19:00`, `Sun: 10:00–16:00`) controlling open/closed toggles and start/end times that immediately govern public slot generation.
   - **Blocked Dates**: Calendar & list manager to add holiday or maintenance blackout dates with reasons and remove expired blocks.
   - **Business Settings**: Live editor for `business_name`, `business_email`, `business_phone`, `business_address`, `slot_interval_minutes`, and `booking_notice_hours` synced directly to `business_settings`.

### Visual Identity & Theme
- **Aesthetic Direction**: *Warm Boutique Hospitality & Editorial Calm* — inspired by bespoke luxury sanctuaries, travertine stone, warm linen, and brushed rose-bronze accents.
- **Color Palette & Mood (60-30-10 Discipline)**:
  - *60% Dominant Neutral Canvas*: Soft Ivory & Warm Alabaster (`#FAF7F2` / `#F5EFE6`) on the public site; crisp Warm Porcelain (`#FCFAF7`) in the admin workspace.
  - *30% Structural Surfaces*: Champagne Linen (`#EFE7DC`), Soft Taupe hairlines (`#E2D7C8`), and Deep Espresso primary typography (`#231C18`) with Muted Umber secondary prose (`#6B5C53`).
  - *10% Accent Budget*: Refined Rose-Bronze / Warm Copper (`#9E6B55`, hover `#855642`) for primary CTAs and selected booking states, paired with accessible semantic text+color indicators for appointment statuses.
- **Typography & Hierarchy (2+1 Font System)**:
  - *Display / Brand / Headings*: `Cormorant Garamond` (SemiBold 600, `text-wrap: balance`) for timeless luxury hospitality gravitas on the public storefront, paired with crisp `Plus Jakarta Sans` headings in the admin console for product clarity.
  - *Body & UI Controls*: `Plus Jakarta Sans` (Regular 400 / SemiBold 600) for effortless legibility across forms, service descriptions, and navigation.
  - *Time Slots, Prices & Metrics*: `JetBrains Mono` / `tabular-nums` so prices, durations, dates, and dashboard KPIs align cleanly without jitter.
- **Bespoke Visual Assets**: Custom high-resolution photography generated locally via `generate_image` (warm sunlit boutique hotel reception in Pathein, serene luxury suite interior, personalized concierge consultation, and tranquil lounge details) with resilient CSS/SVG fallbacks.
- **Interactive Feedback & Motion**: Subtle 150–200ms `transform` and `opacity` transitions (`cubic-bezier(0.16, 1, 0.3, 1)`), skeleton loading placeholders matching exact row geometry, and immediate inline toast feedback on admin saves.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Deterministic Client-Side Slot Engine Backed by Live Supabase Rules**
  - *Chosen Approach*: Compute normalized `{ start: Date, end: Date, label: string }` slots using real `Date` arithmetic from `business_hours`, `services.duration_minutes`, `business_settings.slot_interval_minutes`, `business_settings.booking_notice_hours`, `blocked_dates`, and active appointments (`new_start < existing_end && new_end > existing_start`, ignoring `cancelled`).
  - *Why*: Guarantees zero invalid string formatting crashes, enforces exact notice windows relative to current local time, and immediately reflects admin edits to hours or service durations.
  - *Note on Appointment Conflict Reads*: Because public users do not have a public `SELECT` policy on full `appointments` rows (to protect guest PII), the slot engine gracefully checks a lightweight availability RPC/view if present or falls back cleanly without failing if RLS restricts public reads on `appointments`, while Admins have full authenticated `SELECT`/`UPDATE` access.
- **Decision 2: Strict Insert-Only Public Booking Submission**
  - *Chosen Approach*: Submit bookings via `supabase.from('appointments').insert({ full_name, email, phone, service_id, appointment_date, start_time, end_time, status: 'pending', notes })` without chaining `.select()` or `.single()`.
  - *Why*: Prevents PostgREST `401/42501` RLS errors when anonymous guests insert rows into a table where `SELECT` is restricted to authorized admins.
- **Decision 3: Deactivation Over Hard Deletion for Services**
  - *Chosen Approach*: Provide prominent Activate/Deactivate toggles and an Edit drawer rather than destructive `DELETE` buttons on `services`.
  - *Why*: Preserves referential integrity for historical and upcoming `appointments` referencing `service_id`, while immediately hiding inactive services from the public booking flow.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                     GLODEN KEY PRIME REAL BOOKING (SPA)                      │
├──────────────────────────────────────┬───────────────────────────────────────┤
│        PUBLIC HOSPITALITY SITE       │       PROTECTED ADMIN WORKSPACE       │
│  ┌────────────────────────────────┐  │  ┌─────────────────────────────────┐  │
│  │ Top Bar (3-Zone Brand/Nav/CTA) │  │  │ Auth Gate & Admin Verifier      │  │
│  ├────────────────────────────────┤  │  │ • auth.getSession() + getUser() │  │
│  │ Hero Showcase (16:9 Lobby)     │  │  │ • admin_users.user_id check     │  │
│  ├────────────────────────────────┤  │  │ • onAuthStateChange listener    │  │
│  │ Asymmetric Services Bento      │  │  ├─────────────────────────────────┤  │
│  │ • OnlineHotelBooingService     │  │  │ Admin Shell (Sidebar + Header)  │  │
│  │ • Curated Suite & Stay Tiers   │  │  │  ├─ 1. Overview KPI & Schedule  │  │
│  ├────────────────────────────────┤  │  │  ├─ 2. Appointments Manager     │  │
│  │ About & Pathein Sanctuary      │  │  │  ├─ 3. Services Drawer (CRUD)   │  │
│  ├────────────────────────────────┤  │  │  ├─ 4. Business Hours Editor    │  │
│  │ 4-Step Interactive Booking     │  │  │  ├─ 5. Blocked Dates Blackouts  │  │
│  │  1. Service  2. Date & Slot    │  │  │  └─ 6. Business Settings Form   │  │
│  │  3. Guest Form  4. Confirmed   │  │  └─────────────────────────────────┘  │
│  └───────────────┬────────────────┘  └───────────────────┬───────────────────┘
└──────────────────┼───────────────────────────────────────┼───────────────────┘
                   │                                       │
                   ▼                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                    AVAILABILITY & SUPABASE DATA LAYER                        │
│  • Official Supabase Client (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)      │
│  • Slot Engine: Working Hours ∩ ¬Blocked Dates ∩ Notice Window ∩ ¬Overlaps   │
├──────────────────────────────────────────────────────────────────────────────┤
│  Supabase Tables (Exact Schema):                                             │
│  [services]  [appointments]  [business_hours]  [blocked_dates]               │
│  [business_settings]         [admin_users (user_id -> auth.users.id)]        │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & Exact Schema Mapping
All queries map 1:1 to your required schema without field renaming:
- **`services`**: `id`, `name`, `description`, `duration_minutes`, `price`, `is_active`, `created_at`
- **`appointments`**: `id`, `full_name`, `email`, `phone`, `service_id`, `appointment_date` (`YYYY-MM-DD`), `start_time` (`HH:mm:ss`), `end_time` (`HH:mm:ss`), `status` (`pending` | `confirmed` | `cancelled` | `completed`), `notes`, `created_at`
- **`business_hours`**: `id`, `weekday` (`0`–`6`), `is_open`, `start_time`, `end_time`
- **`blocked_dates`**: `id`, `blocked_date` (`YYYY-MM-DD`), `reason`, `created_at`
- **`business_settings`**: `id`, `business_name`, `business_email`, `business_phone`, `business_address`, `slot_interval_minutes`, `booking_notice_hours`, `created_at`
- **`admin_users`**: `id`, `user_id`, `created_at`

### Interactive Component & State Mapping
- **Service Selection → Booking Sync**: Clicking *"Reserve This Service"* on any public service card smoothly scrolls to the Booking section with that `service_id` pre-selected and advances to Date & Slot selection.
- **Date & Time Slot Recalculation**: Changing either the selected service or selected date triggers pure `Date`-based slot recalculation using `business_hours` for that weekday, filtering out `blocked_dates`, enforcing `booking_notice_hours`, and checking `new_start < existing_end && new_end > existing_start`.
- **Admin Real-Time State Synchronization**: Updating a service, toggling `is_active`, modifying weekday hours, adding a blocked date, or saving `business_settings` persists directly to Supabase, shows confirmation feedback, and refreshes shared state so navigating back to the public site immediately reflects all updates.
