import React from 'react';
import { BusinessSettingsRow } from '../../types/database';

interface FooterProps {
  settings: BusinessSettingsRow;
  operatingSummary: string;
  onNavigateAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  operatingSummary,
  onNavigateAdmin,
}) => {
  const cleanAddress = settings.business_address?.trim() || 'Pathein';

  return (
    <footer id="contact" className="bg-espresso-900 text-ivory-100 border-t border-espresso-800">
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-ivory-100/15">
          <div className="md:col-span-5 space-y-3">
            <p className="font-display text-2xl sm:text-3xl font-semibold text-ivory-50 tracking-wide">
              {settings.business_name}
            </p>
            <p className="text-sm text-champagne-200/80 max-w-sm leading-relaxed">
              Refined hotel booking, personal stay consultations, and tranquil hospitality care in the heart of {cleanAddress}.
            </p>
          </div>

          <div className="md:col-span-4 space-y-2.5 text-sm">
            <p className="text-xs font-semibold text-champagne-200 tracking-wide">
              Concierge &amp; Location
            </p>
            <p className="text-ivory-100">Address: {cleanAddress}</p>
            <p className="text-ivory-100 tabular-nums">
              Phone &amp; WhatsApp:{' '}
              <a href={`tel:${settings.business_phone}`} className="underline-offset-4 hover:underline">
                {settings.business_phone}
              </a>
            </p>
            {settings.business_email && (
              <p className="text-ivory-100">
                Email:{' '}
                <a href={`mailto:${settings.business_email}`} className="underline-offset-4 hover:underline">
                  {settings.business_email}
                </a>
              </p>
            )}
          </div>

          <div className="md:col-span-3 space-y-2.5 text-sm">
            <p className="text-xs font-semibold text-champagne-200 tracking-wide">
              Operating Hours
            </p>
            <p className="text-ivory-100/90 leading-relaxed tabular-nums">
              {operatingSummary}
            </p>
            <div className="pt-2 flex flex-wrap gap-4 text-xs text-champagne-200">
              <a href="#services" className="hover:text-ivory-50 underline-offset-4 hover:underline">
                Services
              </a>
              <a href="#booking" className="hover:text-ivory-50 underline-offset-4 hover:underline">
                Book Visit
              </a>
              <button
                type="button"
                onClick={onNavigateAdmin}
                className="hover:text-ivory-50 underline-offset-4 hover:underline cursor-pointer"
              >
                Admin Portal
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-champagne-200/70">
          <p>
            &copy; {new Date().getFullYear()} {settings.business_name}. All rights reserved.
          </p>
          <p>
            {cleanAddress} · Hospitality &amp; Suite Reservations
          </p>
        </div>
      </div>
    </footer>
  );
};
