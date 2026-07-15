'use client';

import { useState, useEffect } from 'react';

interface WhatsAppButtonProps {
  /** Digits-only WhatsApp id (no hardcoded default — hide FAB when unset). */
  phoneNumber: string;
  defaultMessage?: string;
}

export function WhatsAppButton({
  phoneNumber,
  defaultMessage = 'Hello! I have a question about your accessories.',
}: WhatsAppButtonProps) {
  const [showGreeting, setShowGreeting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (!phoneNumber) return;

    const frame = requestAnimationFrame(() => {
      setIsMounted(true);
    });

    // Show elegant greeting bubble after 3.5 seconds
    const greetingTimer = setTimeout(() => {
      setShowGreeting(true);
    }, 3500);

    // Auto-hide greeting bubble after 10 seconds to keep screen clean
    const hideTimer = setTimeout(() => {
      setShowGreeting(false);
    }, 12000);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(greetingTimer);
      clearTimeout(hideTimer);
    };
  }, [phoneNumber]);

  if (!phoneNumber || !isMounted) return null;

  const encodedMessage = encodeURIComponent(defaultMessage);
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

  return (
    <div className="fixed bottom-6 right-6 z-9999 flex flex-col items-end gap-3 font-sans select-none pointer-events-none">
      {/* Premium Luxury Greeting Bubble */}
      <div
        className={`transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] transform origin-bottom-right pointer-events-auto max-w-70 ${
          showGreeting
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-4 scale-90 pointer-events-none'
        }`}
      >
        <div className="relative bg-[#fdfaf7] text-[#2b2226] p-4 rounded-2xl shadow-[0_10px_30px_rgba(43,34,38,0.12)] border border-[#eddfd9] text-sm flex flex-col gap-2">
          {/* Close button */}
          <button
            onClick={() => setShowGreeting(false)}
            className="absolute top-2.5 right-2.5 text-[#a4949a] hover:text-[#2b2226] transition-colors cursor-pointer"
            aria-label="Close message"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-[11px] text-[#c9a24b] uppercase tracking-wider">
              Personal Stylist
            </span>
          </div>
          
          <p className="text-[13px] leading-relaxed text-[#6b5a60] font-normal pr-2">
            Need assistance with sizing or styling our accessories? We are here to help you.
          </p>
          
          {/* Subtle elegant arrow at the bottom right */}
          <div className="absolute -bottom-1.5 right-8 w-3 h-3 bg-[#fdfaf7] border-r border-b border-[#eddfd9] transform rotate-45"></div>
        </div>
      </div>

      {/* The Floating Luxury Concierge Button */}
      <div className="relative pointer-events-auto group">
        {/* Soft elegant radial ambient glow */}
        <span className="absolute -inset-1 rounded-full bg-linear-to-tr from-[#c9a24b]/20 to-[#b4536a]/10 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Main Anchor Link (Pill shape style) */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setShowGreeting(false)}
          className="relative flex items-center gap-2.5 pl-4 pr-5 py-3 rounded-full bg-[#fdfaf7]/90 backdrop-blur-md border border-[#c9a24b]/60 text-[#2b2226] shadow-[0_4px_20px_rgba(43,34,38,0.08)] hover:border-[#c9a24b] hover:shadow-[0_8px_30px_rgba(201,162,75,0.18)] transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
          aria-label="Chat on WhatsApp"
        >
          {/* WhatsApp Icon wrapper with soft green-gold gradient background */}
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#128C7E] text-white shadow-inner transition-transform duration-500 group-hover:rotate-360">
            <svg
              className="w-4.5 h-4.5 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12.031 2a9.967 9.967 0 0 0-9.953 9.953c0 1.614.386 3.197 1.124 4.625L2 22l5.602-1.472a9.912 9.912 0 0 0 4.429 1.053 9.967 9.967 0 0 0 9.953-9.953A9.967 9.967 0 0 0 12.031 2zm4.704 12.98c-.198.554-1.12 1.018-1.536 1.056-.412.033-.822.183-2.65-.544-2.187-.872-3.585-3.08-3.695-3.228-.109-.147-.893-1.185-.893-2.262 0-1.077.563-1.607.762-1.822.2-.215.437-.268.583-.268.147 0 .293.002.421.008.135.006.316-.05.474.329.163.39.557 1.353.606 1.453.048.1.08.217.016.347-.064.13-.096.212-.192.324-.096.113-.203.25-.29.34-.099.102-.203.214-.087.412.117.198.522.86.11.77 1.25.79 1.109.199.247.1.32-.147.45-.098.156-.197.66-.75.877-.96.216-.21.432-.163.607-.065.176.1.986.486 1.234.61.248.124.412.186.474.293.062.108.062.623-.136 1.177z" />
            </svg>
          </div>
          
          <div className="flex flex-col text-left">
            <span className="text-[12px] font-semibold text-[#2b2226] leading-none tracking-wide">
              Concierge
            </span>
            <span className="text-[9px] text-[#6b5a60] font-normal leading-none mt-0.5">
              Online Assistance
            </span>
          </div>
        </a>
      </div>
    </div>
  );
}
