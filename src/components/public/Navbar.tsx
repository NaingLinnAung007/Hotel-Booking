import React from 'react';

interface NavbarProps {
  businessName: string;
  onNavigateAdmin: () => void;
  onScrollToBooking: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  businessName,
  onNavigateAdmin,
  onScrollToBooking,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-ivory-50/95 backdrop-blur-md border-b border-champagne-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 h-16 md:h-20">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          className="font-display text-2xl md:text-[26px] font-semibold tracking-tight text-espresso-900 whitespace-nowrap shrink-0"
        >
          {businessName || 'Gloden Key Prime Real Booking'}
        </a>

        {/* Zone 2: 4-5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-umber-600">
          <a
            href="#services"
            className="hover:text-espresso-900 underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0"
          >
            Services
          </a>
          <a
            href="#experience"
            className="hover:text-espresso-900 underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0"
          >
            Sanctuary
          </a>
          <a
            href="#booking"
            className="hover:text-espresso-900 underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0"
          >
            Reservations
          </a>
          <a
            href="#contact"
            className="hover:text-espresso-900 underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0"
          >
            Contact
          </a>
          <button
            type="button"
            onClick={onNavigateAdmin}
            className="hover:text-espresso-900 underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Management
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onScrollToBooking}
            className="px-5 py-2.5 text-sm font-semibold text-ivory-50 bg-rosebronze-500 hover:bg-rosebronze-600 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rosebronze-600"
          >
            Book Appointment
          </button>
        </div>
      </div>
    </header>
  );
};
