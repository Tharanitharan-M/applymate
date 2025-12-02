/**
 * Dashboard Page
 * 
 * Protected dashboard that requires authentication.
 * Shows user info and provides logout functionality.
 * 
 * THOUGHT PROCESS:
 * - Protected route that redirects if not authenticated
 * - Beautiful empty state ready for future content
 * - GSAP animations for smooth entry
 * - Clean, modern dashboard layout
 */

"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useAuth } from "@/lib/auth/context";

export default function DashboardPage() {
  // ===========================================================================
  // REFS FOR GSAP ANIMATIONS
  // ===========================================================================
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // ===========================================================================
  // HOOKS
  // ===========================================================================
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  // ===========================================================================
  // REDIRECT IF NOT AUTHENTICATED
  // 
  // We wait for loading to complete before checking auth.
  // This prevents redirect loops during initial load.
  // ===========================================================================
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // ===========================================================================
  // GSAP ANIMATIONS
  // ===========================================================================
  useEffect(() => {
    // Only animate if user is authenticated
    if (!isAuthenticated) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Fade in container
      tl.from(containerRef.current, {
        opacity: 0,
        duration: 0.3,
      });

      // Header slide down
      tl.from(
        headerRef.current,
        {
          y: -20,
          opacity: 0,
          duration: 0.5,
        },
        "-=0.1"
      );

      // Background decorative elements
      tl.from(
        ".decorative-bg",
        {
          scale: 0,
          rotation: -90,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "back.out(1.7)",
        },
        "-=0.3"
      );

      // Content cards stagger
      tl.from(
        ".content-card",
        {
          y: 40,
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
        },
        "-=0.4"
      );

      // Floating animation for decorative elements
      gsap.to(".decorative-bg", {
        y: -20,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
        stagger: 0.5,
      });
    }, containerRef);

    return () => ctx.revert();
  }, [isAuthenticated]);

  // ===========================================================================
  // LOGOUT HANDLER
  // ===========================================================================
  const handleLogout = async () => {
    // Animate out before logout
    gsap.to(containerRef.current, {
      opacity: 0,
      duration: 0.3,
      onComplete: () => {
        logout();
      },
    });
  };

  // ===========================================================================
  // LOADING STATE
  // ===========================================================================
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-black/60">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // NOT AUTHENTICATED STATE
  // Shows briefly before redirect
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
  // RENDER AUTHENTICATED DASHBOARD
  // ===========================================================================
  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-white text-black relative overflow-hidden"
    >
      {/* =====================================================================
          DECORATIVE BACKGROUND
      ===================================================================== */}
      <div className="absolute inset-0 -z-10">
        {/* Large circle - top right */}
        <div className="decorative-bg absolute -top-40 -right-40 w-[500px] h-[500px] border-2 border-black/5 rounded-full" />

        {/* Medium circle - bottom left */}
        <div className="decorative-bg absolute -bottom-20 -left-20 w-80 h-80 border-2 border-black/5 rounded-full" />

        {/* Small square - top left */}
        <div className="decorative-bg absolute top-32 left-20 w-16 h-16 bg-black/3 rotate-12" />

        {/* Dot - right center */}
        <div className="decorative-bg absolute top-1/2 right-32 w-4 h-4 bg-black rounded-full" />

        {/* Grid pattern - subtle background */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="grid grid-cols-12 gap-px h-full">
            {Array.from({ length: 144 }).map((_, i) => (
              <div key={i} className="border border-black" />
            ))}
          </div>
        </div>
      </div>

      {/* =====================================================================
          HEADER
      ===================================================================== */}
      <header
        ref={headerRef}
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="text-xl sm:text-2xl font-bold tracking-tight">
            ApplyMate
          </div>

          {/* User Info & Actions */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* User greeting - hidden on mobile */}
            <div className="hidden sm:block text-right">
              <p className="text-sm text-black/60">Welcome back,</p>
              <p className="font-medium">{user?.name || user?.email}</p>
            </div>

            {/* User Avatar */}
            <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-medium">
              {(user?.name || user?.email)?.charAt(0).toUpperCase()}
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 border-2 border-black/20 hover:border-black hover:bg-black hover:text-white transition-all text-sm"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================================
          MAIN CONTENT
      ===================================================================== */}
      <main ref={contentRef} className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Welcome Section */}
        <div className="content-card mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4">
            Your Dashboard
          </h1>
          <p className="text-lg sm:text-xl text-black/60 max-w-2xl">
            Welcome to ApplyMate! This is your personal command center for managing
            job applications and optimizing your resumes.
          </p>
        </div>

        {/* Stats Cards - Empty State */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: "Applications", value: "0", icon: "📝" },
            { label: "Interviews", value: "0", icon: "💬" },
            { label: "Offers", value: "0", icon: "🎉" },
            { label: "Resumes", value: "0", icon: "📄" },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className="content-card p-6 border-2 border-black/10 hover:border-black transition-colors group"
            >
              <div className="text-3xl mb-3">{stat.icon}</div>
              <div className="text-4xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-black/60">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Empty State - Getting Started */}
        <div className="content-card border-2 border-dashed border-black/20 p-12 text-center">
          <div className="max-w-md mx-auto">
            {/* Illustration */}
            <div className="w-24 h-24 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-black/5 rounded-full animate-pulse" />
              <div className="absolute inset-2 bg-black/10 rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center text-4xl">
                🚀
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-3">
              Ready to start your journey?
            </h2>
            <p className="text-black/60 mb-8">
              Add your first job application or upload a resume to get started.
              We&apos;ll help you track everything and optimize your applications.
            </p>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center flex-wrap">
              <button className="px-6 py-3 bg-black text-white font-medium hover:bg-black/80 transition-colors">
                Add Application
              </button>
              <button className="px-6 py-3 border-2 border-black text-black font-medium hover:bg-black hover:text-white transition-colors">
                Upload Resume
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 grid sm:grid-cols-3 gap-6">
          {[
            {
              title: "Track Applications",
              description: "Keep all your job applications organized in one place",
              icon: "📊",
            },
            {
              title: "AI Resume Analysis",
              description: "Get instant feedback and ATS optimization tips",
              icon: "🤖",
            },
            {
              title: "Interview Prep",
              description: "Prepare for interviews with AI-powered insights",
              icon: "💡",
            },
          ].map((action) => (
            <div
              key={action.title}
              className="content-card p-6 border-2 border-black/10 hover:border-black transition-all cursor-pointer group"
            >
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">
                {action.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{action.title}</h3>
              <p className="text-black/60 text-sm">{action.description}</p>
            </div>
          ))}
        </div>
      </main>

      {/* =====================================================================
          FOOTER
      ===================================================================== */}
      <footer className="border-t border-black/10 py-8 px-4 sm:px-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-black/60">
          <div>© 2024 ApplyMate. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-black transition-colors">
              Help
            </a>
            <a href="#" className="hover:text-black transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-black transition-colors">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

