"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/payments", label: "Client payments" },
  { href: "/savings", label: "Business savings" },
  { href: "/expenses", label: "Expenses" },
  { href: "/promotions", label: "Promotions" },
  { href: "/team", label: "Team" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col">
      {LINKS.map(({ href, label }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm ${
              active ? "bg-surface-2 text-ink" : "text-ink-2 hover:bg-surface-2/60"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
