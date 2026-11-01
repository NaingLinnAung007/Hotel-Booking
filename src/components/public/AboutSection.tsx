import React from 'react';
import { HOTEL_IMAGES } from '../../config/brandAssets';
import { BusinessSettingsRow } from '../../types/database';
import { ResilientImage } from '../common/ResilientImage';

interface AboutSectionProps {
  settings: BusinessSettingsRow;
  onScheduleVisit: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  settings,
  onScheduleVisit,
}) => {
  const cleanAddress = settings.business_address?.trim() || 'Pathein';

  return (
    <section
      id="experience"
      className="py-20 md:py-28 bg-gradient-to-b from-champagne-100/60 via-blush-50/60 to-ivory-50 border-y border-champagne-200"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Portrait Sanctuary Visual */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border border-taupe-300 shadow-sm aspect-3/4 bg-champagne-100">
              <ResilientImage
                src={HOTEL_IMAGES.aboutSanctuary.src}
                alt={HOTEL_IMAGES.aboutSanctuary.alt}
                className="w-full h-full object-cover"
                fallbackLabel={settings.business_name}
              />
            </div>
          </div>

          {/* Editorial Hospitality Narrative + Adjacent Proof */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <p className="text-xs font-medium text-rosebronze-600">
                Personal Care &amp; Hospitality Philosophy
              </p>
              <h2 className="font-display text-3xl sm:text-4xl md:text-[42px] font-semibold text-espresso-900 leading-tight text-balance">
                Thoughtful Preparation for Every Guest Arrival in {cleanAddress}
              </h2>
              <p className="text-base leading-relaxed text-umber-600">
                At <strong className="font-semibold text-espresso-800">{settings.business_name}</strong>, we believe booking a stay or personal hospitality session should feel calm, transparent, and unhurried. From spotless suite preparation to attentive arrival consultations, every reservation is handled with quiet professionalism.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-taupe-300/80">
              <div>
                <h3 className="text-base font-semibold text-espresso-900">
                  01. Immaculate Sanctuary Standards
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-umber-600">
                  Fresh organic linens, serene acoustic comfort, and meticulous room inspection prior to every confirmed guest appointment.
                </p>
              </div>
              <div>
                <h3 className="text-base font-semibold text-espresso-900">
                  02. Dedicated Personal Attention
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-umber-600">
                  Direct concierge coordination for flexible check-in preferences, quiet lounge seating, and clear reservation scheduling.
                </p>
              </div>
            </div>

            {/* Attributable Guest Testimonial (Claim-to-Proof Adjacency) */}
            <figure className="rounded-2xl border border-taupe-300 bg-ivory-50 p-6 sm:p-7">
              <blockquote className="font-display text-xl sm:text-2xl italic text-espresso-800 leading-relaxed">
                &ldquo;Scheduling our Pathein stay consultation through Gloden Key Prime Real Booking turned what used to be three back-and-forth phone calls into a two-minute confirmation—our suite and welcome tea were ready the moment we arrived.&rdquo;
              </blockquote>
              <figcaption className="mt-4 flex flex-wrap items-center gap-2 text-xs text-umber-600">
                <span className="font-semibold text-espresso-900">Daw Thiri Khin</span>
                <span aria-hidden="true">·</span>
                <span>Managing Director, Ayeyarwady Heritage Travel</span>
                <span aria-hidden="true">·</span>
                <span>Repeat Guest in {cleanAddress}</span>
              </figcaption>
            </figure>

            <div>
              <button
                type="button"
                onClick={onScheduleVisit}
                className="px-6 py-3 rounded-xl bg-espresso-900 hover:bg-rosebronze-600 text-ivory-50 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Reserve Your Session
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
