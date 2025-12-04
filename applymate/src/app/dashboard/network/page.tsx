/**
 * Network Page
 *
 * Page for networking features.
 * Basic placeholder content for now.
 */

"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function NetworkPage() {
  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Network</h1>
          <p className="text-black/60">
            Connect and network with others in your industry.
          </p>
        </div>

        {/* Placeholder Content */}
        <div className="bg-white border border-black/10 rounded-lg p-8 text-center">
          <p className="text-black/60">Network features coming soon...</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

