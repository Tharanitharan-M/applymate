/**
 * Profile Page
 *
 * Page for managing user profile and settings.
 * Scaffold - content to be added later.
 */

"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/lib/auth/context";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Profile</h1>
          <p className="text-black/60">
            Manage your account settings and preferences.
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white border border-black/10 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold">
              {(user?.name || user?.email)?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{user?.name || "User"}</h2>
              <p className="text-black/60">{user?.email}</p>
            </div>
          </div>

          <div className="border-t border-black/10 pt-6">
            <h3 className="font-semibold mb-4">Account Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-black/60 mb-1">Name</label>
                <div className="px-4 py-2 bg-black/5 rounded-lg">
                  {user?.name || "Not set"}
                </div>
              </div>
              <div>
                <label className="block text-sm text-black/60 mb-1">
                  Email
                </label>
                <div className="px-4 py-2 bg-black/5 rounded-lg">
                  {user?.email}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Placeholder for future settings */}
        <div className="border-2 border-dashed border-black/20 rounded-lg p-8 text-center">
          <p className="text-black/40">More settings coming soon...</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

