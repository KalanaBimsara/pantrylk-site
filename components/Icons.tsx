type P = { size?: number; className?: string };
const base = (size: number) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, "aria-hidden": true as const });

export const ArrowUpRight = ({ size = 12, className }: P) => (
  <svg {...base(size)} viewBox="0 0 12 12" strokeWidth={1.5} className={className}><path d="M4 2h6v6M10 2 2 10" /></svg>
);
export const ArrowRight = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const WhatsAppIcon = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}><path d="M3.5 20.5 5 16a8 8 0 1 1 3 3l-4.5 1.5Z" /><path d="M9 9.5c.3 2 2.5 4.2 4.5 4.5l1.2-1.2 1.8.8v1.5c-3.6.6-8.4-4.2-7.8-7.8H10l.8 1.8Z" /></svg>
);
export const PhoneIcon = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /></svg>
);
export const MailIcon = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}><rect x="3" y="5" width="18" height="14" /><path d="m3 6 9 7 9-7" /></svg>
);
export const PinIcon = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}><path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12Z" /><circle cx="12" cy="9" r="2.5" /></svg>
);
export const ClockIcon = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const MenuIcon = ({ size = 22, className }: P) => (
  <svg {...base(size)} strokeWidth={1.5} className={className}><path d="M3 7h18M3 12h18M3 17h18" /></svg>
);
export const CloseIcon = ({ size = 22, className }: P) => (
  <svg {...base(size)} strokeWidth={1.5} className={className}><path d="M5 5l14 14M19 5 5 19" /></svg>
);
export const ChevronLeft = ({ size = 22, className }: P) => (
  <svg {...base(size)} strokeWidth={1.5} className={className}><path d="M15 5 8 12l7 7" /></svg>
);
export const ChevronRight = ({ size = 22, className }: P) => (
  <svg {...base(size)} strokeWidth={1.5} className={className}><path d="m9 5 7 7-7 7" /></svg>
);
export const SearchIcon = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
);
export const ExpandIcon = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}><path d="M4 9V4h5M20 15v5h-5M4 4l6 6M20 20l-6-6" /></svg>
);
export const CheckIcon = ({ size = 22, className }: P) => (
  <svg {...base(size)} strokeWidth={1.8} className={className}><path d="m5 12 5 5 9-10" /></svg>
);
export const AlertIcon = ({ size = 16, className }: P) => (
  <svg {...base(size)} strokeWidth={2} className={className}><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5v.5" /></svg>
);
export const SpinnerIcon = ({ size = 16, className }: P) => (
  <svg {...base(size)} strokeWidth={2} className={className}><path d="M21 12a9 9 0 1 1-6.2-8.6" /></svg>
);
export const FacebookIcon = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8Z" /></svg>
);
export const InstagramIcon = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /></svg>
);
export const TikTokIcon = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.5 2.7 2.3 4.3 5 4.5" /></svg>
);
