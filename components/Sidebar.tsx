"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/group-stage", label: "Group Stage", icon: "grid_view" },
  { href: "/knockout", label: "Knockout", icon: "account_tree" },
  { href: "/schedule", label: "Schedule", icon: "calendar_today" },
  { href: "/statistics", label: "Statistics", icon: "leaderboard" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col h-screen w-72 shrink-0 bg-surface-container border-r border-outline-variant p-4 gap-2 sticky top-0 overflow-y-auto">
      {/* Brand */}
      <div className="flex items-center gap-4 mb-6 px-4">
        <div className="w-10 h-10 rounded-lg bg-surface-variant flex items-center justify-center border border-outline-variant text-secondary shrink-0">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
        </div>
        <div>
          <h2 className="font-headline-md text-headline-md text-primary leading-tight">Fifa World Cup</h2>
          <p className="font-label-md text-label-md text-on-surface-variant">2026</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
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

      {/* CTA */}
      {/* <button className="w-full bg-primary-container text-on-primary-container py-3 rounded-xl font-label-md text-label-md font-bold glow-active hover:scale-105 transition-transform mb-4 flex items-center justify-center gap-2">
        <span className="material-symbols-outlined text-sm">add</span>
        New Simulation
      </button> */}


    </aside>
  );
}
