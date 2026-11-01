import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { formatServiceTitle, getServiceVisual } from '../../config/brandAssets';
import { ServiceRow } from '../../types/database';
import { ResilientImage } from '../common/ResilientImage';

interface ServicesSectionProps {
  services: ServiceRow[];
  isLoading: boolean;
  onSelectServiceForBooking: (serviceId: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  services,
  isLoading,
  onSelectServiceForBooking,
}) => {
  return (
    <section id="services" className="py-20 md:py-28 bg-ivory-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-rosebronze-600">
              Curated Hotel Booking Offerings
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl md:text-[42px] font-semibold text-espresso-900 leading-tight text-balance">
              Tailored Reservations &amp; Personal Hospitality Services
            </h2>
          </div>
          <p className="text-sm text-umber-600 max-w-md leading-relaxed">
            Every booking is prepared with personal attention, calm suite readiness, and transparent scheduling tailored around your arrival.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 h-96 rounded-2xl bg-champagne-100 animate-pulse" />
            <div className="lg:col-span-5 h-96 rounded-2xl bg-champagne-100 animate-pulse" />
          </div>
        ) : services.length === 0 ? (
          <div className="rounded-2xl border border-taupe-300 bg-ivory-100 p-12 text-center">
            <h3 className="font-display text-2xl font-semibold text-espresso-900">
              Reservation Services Updating
            </h3>
            <p className="mt-2 text-sm text-umber-600 max-w-md mx-auto">
              Our hospitality team is refreshing seasonal suite booking options. Please reach out directly by phone or check back momentarily.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {services.map((service, index) => {
              const isFeatured = index === 0;
              const colSpanClass =
                services.length === 1
                  ? 'lg:col-span-12'
                  : isFeatured
                  ? 'lg:col-span-7'
                  : index === 1
                  ? 'lg:col-span-5'
                  : 'lg:col-span-6';

              const visual = getServiceVisual(service.name, index);
              const { displayTitle, subtitleTag } = formatServiceTitle(service.name);
              const formattedNumber = String(index + 1).padStart(2, '0');
              const formattedPrice = Number(service.price || 0).toLocaleString('en-US', {
                minimumFractionDigits: Number(service.price) % 1 === 0 ? 0 : 2,
                maximumFractionDigits: 2,
              });

              return (
                <article
                  key={service.id}
                  className={`${colSpanClass} group flex flex-col justify-between rounded-2xl border border-taupe-300/90 bg-ivory-100/70 hover:border-rosebronze-500/70 transition-colors overflow-hidden`}
                >
                  <div>
                    <div className="relative overflow-hidden aspect-16/10 bg-champagne-100">
                      <ResilientImage
                        src={visual.src}
                        alt={`${displayTitle} — ${visual.alt}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        fallbackLabel={displayTitle}
                      />
                    </div>

                    <div className="p-6 sm:p-8">
                      {/* Unboxed clean metadata with typographic separators */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-umber-600 tabular-nums">
                        <span className="font-medium text-rosebronze-600">{formattedNumber}. Professional Service</span>
                        <span aria-hidden="true">·</span>
                        <span>{service.duration_minutes} mins</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono font-medium text-espresso-900">
                          ${formattedPrice}
                        </span>
                      </div>

                      <h3 className="mt-3 font-display text-2xl sm:text-[28px] font-semibold text-espresso-900 leading-snug break-words">
                        {displayTitle}
                      </h3>

                      {subtitleTag && (
                        <p className="mt-1 text-xs font-medium text-rosebronze-600">
                          {subtitleTag}
                        </p>
                      )}

                      <p className="mt-3 text-sm leading-relaxed text-umber-600">
                        {service.description ||
                          'Dedicated hotel reservation care, personal room readiness, and calm arrival coordination with our Pathein hospitality team.'}
                      </p>
                    </div>
                  </div>

                  <div className="px-6 pb-6 sm:px-8 sm:pb-8 pt-2 flex items-center justify-between border-t border-champagne-200/80 mt-2">
                    <div className="text-xs text-umber-600 tabular-nums">
                      <span>Duration: {service.duration_minutes} min</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectServiceForBooking(service.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-espresso-900 hover:bg-rosebronze-600 text-ivory-50 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <span>Schedule Visit</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
