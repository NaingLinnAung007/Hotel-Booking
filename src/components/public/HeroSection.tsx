import React from 'react';
import { ArrowRight } from 'lucide-react';
import { HOTEL_IMAGES } from '../../config/brandAssets';
import { BusinessSettingsRow } from '../../types/database';
import { ResilientImage } from '../common/ResilientImage';

interface HeroSectionProps {
  settings: BusinessSettingsRow;
  operatingSummary: string;
  onBookNow: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  settings,
  operatingSummary,
  onBookNow,
}) => {
  const cleanAddress = settings.business_address?.trim() || 'Pathein';

  return (
    <section id="top" className="relative overflow-hidden bg-gradient-to-b from-ivory-50 via-ivory-100 to-champagne-100/60 pt-8 pb-16 md:pt-14 md:pb-24">
      <div className="max-w-7xl mx-auto px-6">
        {/* 2-Column Editorial Asymmetric Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          {/* Left Editorial Column */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
            <div className="flex items-center gap-2 text-xs font-medium text-umber-600">
              <span>Boutique Hotel Booking</span>
              <span aria-hidden="true">·</span>
              <span>{cleanAddress}</span>
              <span aria-hidden="true">·</span>
              <span>Personal Concierge Care</span>
            </div>

            <h1 className="font-display text-[clamp(2.35rem,4vw,3.75rem)] leading-[1.08] font-semibold text-espresso-900 text-balance">
              Serene Stays &amp; Attentive Hotel Reservations in {cleanAddress}
            </h1>

            <p className="text-base md:text-[17px] leading-relaxed text-umber-600 max-w-xl">
              Experience calm, refined hospitality at <strong className="font-semibold text-espresso-800">{settings.business_name}</strong>. Schedule your visit, personal suite consultation, or signature reservation session with effortless real-time availability.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onBookNow}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-rosebronze-500 hover:bg-rosebronze-600 text-ivory-50 text-sm font-semibold transition-all duration-150 shadow-sm cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rosebronze-600"
              >
                <span>Book Your Appointment</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#services"
                className="inline-flex items-center px-5 py-3.5 rounded-xl border border-taupe-300 hover:border-espresso-800 text-espresso-900 text-sm font-medium transition-colors whitespace-nowrap shrink-0"
              >
                Explore Services
              </a>
            </div>
          </div>

          {/* Right High-Impact 16:9 Architectural Hotel Lobby Visual */}
          <div className="lg:col-span-7 relative rounded-2xl overflow-hidden border border-taupe-300/80 shadow-md min-h-[320px] sm:min-h-[420px]">
            <ResilientImage
              src={HOTEL_IMAGES.heroLobby.src}
              alt={HOTEL_IMAGES.heroLobby.alt}
              priority
              className="w-full h-full object-cover aspect-video lg:aspect-auto"
              fallbackLabel={settings.business_name}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-espresso-900/75 via-espresso-900/20 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-ivory-50">
              <div>
                <p className="text-xs text-champagne-200 font-medium">
                  Signature Hospitality Sanctuary
                </p>
                <p className="font-display text-2xl font-medium mt-0.5">
                  Warmth, Privacy &amp; Tailored Arrival Care
                </p>
              </div>
              <div className="text-xs text-ivory-100/90 tabular-nums sm:text-right">
                <p>{settings.business_phone}</p>
                <p className="text-champagne-200 mt-0.5">{cleanAddress}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width Hospitality Details Strip Below Split */}
        <div className="mt-10 pt-8 border-t border-taupe-300/70 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-xs font-medium text-umber-600">Location &amp; Sanctuary</p>
            <p className="mt-1 text-sm font-semibold text-espresso-900">
              {cleanAddress}, Myanmar
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-umber-600">Direct Concierge &amp; WhatsApp</p>
            <p className="mt-1 text-sm font-semibold text-espresso-900 tabular-nums">
              {settings.business_phone}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium text-umber-600">Reception &amp; Booking Hours</p>
            <p className="mt-1 text-sm font-semibold text-espresso-900 tabular-nums">
              {operatingSummary}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
