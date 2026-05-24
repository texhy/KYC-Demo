"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import DcfLogo from "@/components/brand/DcfLogo";

type NavItem = { href: string; label: string; icon: ReactNode };

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 3v4a1 1 0 0 0 1 1h4M5 3h9l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" strokeLinejoin="round" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" />
    </svg>
  );
}

const MAIN: NavItem[] = [{ href: "/", label: "Applications", icon: <FileIcon /> }];
const ADMIN: NavItem[] = [
  { href: "/settings", label: "Settings", icon: <GearIcon /> },
  { href: "/profile", label: "Profile", icon: <UserIcon /> },
];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-white/10 text-white"
          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
      }`}
    >
      {item.icon}
      {item.label}
    </Link>
  );
}

export default function AppShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" || pathname.startsWith("/new") || pathname.startsWith("/results") || pathname.startsWith("/evaluations") : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col bg-brand-navy text-slate-200">
        <div className="px-6 pb-2 pt-6">
          <DcfLogo className="h-24 w-auto" />
        </div>
        <nav className="flex-1 space-y-6 px-3 py-4">
          <div>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Main
            </p>
            <div className="space-y-1">
              {MAIN.map((i) => (
                <NavLink key={i.href} item={i} active={isActive(i.href)} />
              ))}
            </div>
          </div>
          <div>
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Admin
            </p>
            <div className="space-y-1">
              {ADMIN.map((i) => (
                <NavLink key={i.href} item={i} active={isActive(i.href)} />
              ))}
            </div>
          </div>
        </nav>
        <div className="m-3 flex items-center gap-3 rounded-xl bg-brand-navy-2 px-3 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-crimson to-brand-teal text-xs font-bold text-white">
            JA
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">John Admin</p>
            <p className="text-xs text-slate-400">Administrator</p>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-screen flex-1 flex-col pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-8">
          <h1 className="text-xl font-bold text-slate-800">{title}</h1>
          <div className="flex items-center gap-4 text-slate-400">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="9" />
              <path d="M9.5 9a2.5 2.5 0 0 1 4.5 1.5c0 1.5-2 2-2 3" strokeLinecap="round" />
              <circle cx="12" cy="17" r="0.6" fill="currentColor" />
            </svg>
            <span className="relative">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5 2 6H4c.5-1 2-2 2-6Z" strokeLinejoin="round" />
                <path d="M10 20a2 2 0 0 0 4 0" strokeLinecap="round" />
              </svg>
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-brand-crimson" />
            </span>
          </div>
        </header>
        <main className="flex-1 px-8 py-8">{children}</main>
        <footer className="flex items-center justify-between border-t border-slate-200 bg-white px-8 py-4 text-xs text-slate-400">
          <span>© {new Date().getFullYear()} Direct Credit Funding. All rights reserved.</span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> System operational
          </span>
        </footer>
      </div>
    </div>
  );
}
