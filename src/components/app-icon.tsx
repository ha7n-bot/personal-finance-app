import type { ReactNode, SVGProps } from "react";

export type AppIconName =
  | "home"
  | "transactions"
  | "accounts"
  | "budget"
  | "repeat"
  | "reports"
  | "debt"
  | "goal"
  | "shield"
  | "investment"
  | "advisor"
  | "settings"
  | "logout"
  | "cloud"
  | "plus"
  | "income"
  | "expense"
  | "calendar"
  | "check"
  | "info"
  | "text"
  | "contrast"
  | "sync"
  | "user"
  | "lock"
  | "arrow";

type Props = Omit<SVGProps<SVGSVGElement>, "name"> & {
  name: AppIconName;
  size?: number;
};

export function AppIcon({ name, size = 20, ...props }: Props) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}

const paths: Record<AppIconName, ReactNode> = {
  home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></>,
  transactions: <><path d="M7 7h13"/><path d="m16 3 4 4-4 4"/><path d="M17 17H4"/><path d="m8 13-4 4 4 4"/></>,
  accounts: <><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18"/><path d="M16 15h2"/></>,
  budget: <><circle cx="12" cy="12" r="9"/><path d="M12 7v10"/><path d="M15 9.5c-.7-.7-1.7-1-3-1-1.7 0-3 .8-3 2s1.2 1.8 3 2 3 .8 3 2-1.3 2-3 2c-1.3 0-2.3-.3-3-1"/></>,
  repeat: <><path d="m17 2 4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="m7 22-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/></>,
  reports: <><path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/></>,
  debt: <><path d="M6 2h12v20l-3-2-3 2-3-2-3 2Z"/><path d="M9 7h6"/><path d="M9 11h6"/><path d="M9 15h3"/></>,
  goal: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-5"/></>,
  investment: <><path d="M4 20V10"/><path d="M10 20V6"/><path d="M16 20V3"/><path d="m3 8 6-4 5 2 7-4"/></>,
  advisor: <><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 13a6 6 0 1 1 10 0c-1 1-2 2-2 4H9c0-2-1-3-2-4Z"/><path d="M9 9h6"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
  logout: <><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/></>,
  cloud: <><path d="M17.5 19H7a5 5 0 1 1 1.3-9.8A7 7 0 0 1 21 13a4 4 0 0 1-3.5 6Z"/><path d="m9 14 2 2 4-4"/></>,
  plus: <><path d="M12 5v14"/><path d="M5 12h14"/></>,
  income: <><path d="M12 3v14"/><path d="m6 9 6-6 6 6"/><path d="M5 21h14"/></>,
  expense: <><path d="M12 21V7"/><path d="m18 15-6 6-6-6"/><path d="M5 3h14"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4"/><path d="M8 3v4"/><path d="M3 10h18"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/></>,
  text: <><path d="M4 6V4h16v2"/><path d="M9 20h6"/><path d="M12 4v16"/></>,
  contrast: <><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18Z"/></>,
  sync: <><path d="M20 7h-5V2"/><path d="M4 17h5v5"/><path d="M6.1 8A7 7 0 0 1 20 7"/><path d="M17.9 16A7 7 0 0 1 4 17"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
  arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
};
