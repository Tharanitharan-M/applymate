/**
 * Jobs Page
 *
 * Page for managing job applications.
 * Scaffold - content to be added later.
 */

"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function JobsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Jobs</h1>
          <p className="text-black/60">
            Track and manage all your job applications in one place.
          </p>
        </div>

        {/* Empty State */}
        <div className="border-2 border-dashed border-black/20 rounded-lg p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-black/5 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-black/40"
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
          </div>
          <h2 className="text-xl font-semibold mb-2">No jobs yet</h2>
          <p className="text-black/60 mb-6 max-w-md mx-auto">
            Start tracking your job applications. Add your first job to get
            started.
          </p>
          <button className="px-6 py-3 bg-black text-white font-medium hover:bg-black/80 transition-colors rounded-lg">
            Add Your First Job
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}


