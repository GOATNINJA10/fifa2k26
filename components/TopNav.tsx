"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/group-stage", label: "Group Stage", icon: "grid_view" },
  { href: "/schedule", label: "Schedule", icon: "calendar_month" },
  { href: "/knockout", label: "Knockout", icon: "account_tree" },
  { href: "/statistics", label: "Statistics", icon: "leaderboard" },
];

export default function TopNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav className="flex justify-between items-center w-full px-4 md:px-8 h-16 sticky top-0 z-50 border-b border-outline-variant bg-surface-container-lowest/60 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4 md:gap-8">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden text-on-surface hover:text-primary-container transition-colors p-2 -ml-2 rounded-lg hover:bg-surface-variant"
            aria-label="Open menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <Link href="/" className="font-headline-md text-headline-md font-extrabold text-primary-container tracking-tighter whitespace-nowrap">
            FIFA WORLD CUP - 2026 
          </Link>
          <div className="hidden md:flex gap-6">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`font-label-md text-label-md transition-colors duration-200 ${
                    active
                      ? "text-primary-container font-bold border-b-2 border-primary-container pb-1"
                      : "text-on-surface-variant font-medium hover:text-primary"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-surface-container-high border-2 border-outline-variant overflow-hidden cursor-pointer hover:border-primary-container transition-colors">
            <div className="w-full h-full bg-gradient-to-br from-surface-container-highest to-surface-variant flex items-center justify-center">
              <span className="material-symbols-outlined text-sm text-on-surface-variant">person</span>
            </div>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <aside
            onClick={(e) => e.stopPropagation()}
            className="relative flex flex-col h-full w-72 max-w-[85vw] bg-surface-container border-r border-outline-variant p-4 gap-2 overflow-y-auto animate-slide-in"
          >
            <div className="flex items-center justify-between mb-6 px-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-surface-variant flex items-center justify-center border border-outline-variant text-secondary shrink-0">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                </div>
                <div>
                  <h2 className="font-headline-md text-headline-md text-primary leading-tight">Fifa World Cup</h2>
                  <p className="font-label-md text-label-md text-on-surface-variant">2026</p>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-on-surface hover:text-primary-container transition-colors p-2 rounded-full hover:bg-surface-variant"
                aria-label="Close menu"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <nav className="flex-1 flex flex-col gap-1">
              {navLinks.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-full font-label-md text-label-md transition-all ${
                      active
                        ? "bg-primary-container text-on-primary-container border-l-4 border-primary"
                        : "text-on-surface-variant hover:bg-surface-variant"
                    }`}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* <button className="w-full bg-primary-container text-on-primary-container py-3 rounded-xl font-label-md text-label-md font-bold glow-active hover:scale-105 transition-transform mb-4 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">add</span>
              New Simulation
            </button> */}

            <div className="border-t border-outline-variant pt-4 flex flex-col gap-1">
              <button className="flex items-center gap-4 text-on-surface-variant px-4 py-2 hover:text-primary transition-colors font-label-md text-label-md w-full text-left">
                <span className="material-symbols-outlined">help</span>
                Help
              </button>
              <button className="flex items-center gap-4 text-error px-4 py-2 hover:text-on-surface transition-colors font-label-md text-label-md w-full text-left">
                <span className="material-symbols-outlined">logout</span>
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

    </>
  );
}
