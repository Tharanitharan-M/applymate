/**
 * Dashboard Layout Component
 *
 * Shared layout for all dashboard pages with a fixed sidebar navigation.
 * Includes responsive design with mobile hamburger menu.
 * 
 * Navigation feels like a single-page app - sidebar stays fixed,
 * only the main content area changes.
 *
 * NAVIGATION:
 * - Dashboard (home)
 * - Jobs
 * - Resume
 * - Network
 * - Profile
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/context";

// ===========================================================================
// NAVIGATION ITEMS
// ===========================================================================
const navItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
        />
      </svg>
    ),
  },
  {
    name: "Jobs",
    href: "/dashboard/jobs",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    name: "Resume",
    href: "/dashboard/resume",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    name: "Network",
    href: "/dashboard/network",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
  {
    name: "Profile",
    href: "/dashboard/profile",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
];

// ===========================================================================
// PROPS
// ===========================================================================
interface DashboardLayoutProps {
  children: React.ReactNode;
}

// ===========================================================================
// COMPONENT
// ===========================================================================
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  // ===========================================================================
  // REDIRECT IF NOT AUTHENTICATED
  // ===========================================================================
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // ===========================================================================
  // LOGOUT HANDLER
  // ===========================================================================
  const handleLogout = () => {
    logout();
  };

  // ===========================================================================
  // LOADING STATE
  // ===========================================================================
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-black/60">Loading...</p>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // NOT AUTHENTICATED STATE
  // ===========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-black/60">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // RENDER
  // ===========================================================================
  return (
    <div className="min-h-screen bg-[#fafafa] text-black">
      {/* =====================================================================
          MOBILE HEADER
      ===================================================================== */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-black/10 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold tracking-tight">
            ApplyMate
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-black/5 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* =====================================================================
          MOBILE MENU OVERLAY
      ===================================================================== */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* =====================================================================
          SIDEBAR - Fixed, never animates on navigation
      ===================================================================== */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-[#ffffff] border-r border-[#e5e7eb]
          lg:translate-x-0
          ${mobileMenuOpen ? "translate-x-0 transition-transform duration-200" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{ color: '#000000' }}
      >
        {/* Logo */}
        <div className="p-6 border-b border-[#e5e7eb]">
          <Link
            href="/dashboard"
            className="text-2xl font-bold tracking-tight block text-[#000000]"
          >
            ApplyMate
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-colors duration-150
                  ${
                    isActive
                      ? "bg-[#000000] text-[#ffffff]"
                      : "text-[#374151] hover:bg-[#f3f4f6] hover:text-[#000000]"
                  }
                `}
              >
                {item.icon}
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#e5e7eb] bg-[#ffffff]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#000000] text-[#ffffff] rounded-full flex items-center justify-center font-medium text-sm">
              {(user?.name || user?.email)?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate text-sm text-[#000000]">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-[#6b7280] truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 border border-[#d1d5db] text-[#000000] hover:border-[#000000] hover:bg-[#000000] hover:text-[#ffffff] transition-all text-sm rounded-lg"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* =====================================================================
          MAIN CONTENT
      ===================================================================== */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

