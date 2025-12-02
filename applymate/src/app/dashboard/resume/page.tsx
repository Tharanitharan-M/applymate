/**
 * Resume Page
 *
 * Page for managing resumes and getting AI analysis.
 * Scaffold - content to be added later.
 */

"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function ResumePage() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Resume</h1>
          <p className="text-black/60">
            Upload and manage your resumes. Get AI-powered analysis and
            optimization tips.
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">No resumes uploaded</h2>
          <p className="text-black/60 mb-6 max-w-md mx-auto">
            Upload your resume to get started. We&apos;ll analyze it and provide
            suggestions for improvement.
          </p>
          <button className="px-6 py-3 bg-black text-white font-medium hover:bg-black/80 transition-colors rounded-lg">
            Upload Resume
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

