import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...p,
});

export const SearchIcon = (p: P) => (<svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>);
export const ShareIcon = (p: P) => (<svg {...base(p)}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></svg>);
export const QuoteIcon = (p: P) => (<svg {...base(p)}><path d="M4 4h16v12H7l-3 3z" /><path d="M8 9h8M8 12h5" /></svg>);
export const DownloadIcon = (p: P) => (<svg {...base(p)}><path d="M12 3v12m0 0-4-4m4 4 4-4" /><path d="M4 17v3h16v-3" /></svg>);
export const CheckIcon = (p: P) => (<svg {...base(p)}><path d="m5 12 5 5 9-10" /></svg>);
export const XIcon = (p: P) => (<svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>);
export const ArrowLeftIcon = (p: P) => (<svg {...base(p)}><path d="M19 12H5m6-6-6 6 6 6" /></svg>);
export const ArrowRightIcon = (p: P) => (<svg {...base(p)}><path d="M5 12h14m-6-6 6 6-6 6" /></svg>);
export const CopyIcon = (p: P) => (<svg {...base(p)}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></svg>);
export const MonitorIcon = (p: P) => (<svg {...base(p)}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg>);
export const UploadIcon = (p: P) => (<svg {...base(p)}><path d="M12 16V4m0 0-4 4m4-4 4 4" /><path d="M4 17v3h16v-3" /></svg>);
export const TrashIcon = (p: P) => (<svg {...base(p)}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>);
export const PlusIcon = (p: P) => (<svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>);
export const EyeIcon = (p: P) => (<svg {...base(p)}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>);
export const EyeOffIcon = (p: P) => (<svg {...base(p)}><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7c1.8 0 3.4-.5 4.8-1.3" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>);
export const AlertIcon = (p: P) => (<svg {...base(p)}><path d="M12 3 2 20h20L12 3z" /><path d="M12 10v4M12 17h.01" /></svg>);
export const ChevronUpIcon = (p: P) => (<svg {...base(p)}><path d="m6 15 6-6 6 6" /></svg>);
export const ChevronDownIcon = (p: P) => (<svg {...base(p)}><path d="m6 9 6 6 6-6" /></svg>);
export const FileIcon = (p: P) => (<svg {...base(p)}><path d="M14 3H6v18h12V7z" /><path d="M14 3v4h4" /></svg>);
export const LogoutIcon = (p: P) => (<svg {...base(p)}><path d="M15 4h4v16h-4M10 17l5-5-5-5M15 12H3" /></svg>);
export const StarIcon = (p: P) => (<svg {...base(p)}><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z" /></svg>);
export const DropletIcon = (p: P) => (<svg {...base(p)}><path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z" /></svg>);
export const SlidersIcon = (p: P) => (<svg {...base(p)}><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></svg>);
