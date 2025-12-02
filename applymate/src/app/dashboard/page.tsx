/**
 * Dashboard Page
 *
 * Main dashboard overview with stats and quick actions.
 * Uses shared DashboardLayout for consistent navigation.
 */

"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/lib/auth/context";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Welcome back, {user?.name || "there"}!
          </h1>
          <p className="text-black/60">
            Here&apos;s an overview of your job search progress.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Applications", value: "0", icon: "📝" },
            { label: "Interviews", value: "0", icon: "💬" },
            { label: "Offers", value: "0", icon: "🎉" },
            { label: "Resumes", value: "0", icon: "📄" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white p-6 border border-black/10 rounded-lg hover:border-black/30 transition-colors"
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-black/60">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Getting Started */}
        <div className="bg-white border border-black/10 rounded-lg p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-black/5 rounded-full animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center text-4xl">
              🚀
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-3">Ready to start?</h2>
          <p className="text-black/60 mb-6 max-w-md mx-auto">
            Add your first job application or upload a resume to get started
            with your job search journey.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <button className="px-6 py-3 bg-black text-white font-medium hover:bg-black/80 transition-colors rounded-lg">
              Add Application
            </button>
            <button className="px-6 py-3 border border-black text-black font-medium hover:bg-black hover:text-white transition-colors rounded-lg">
              Upload Resume
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
