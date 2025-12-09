/**
 * Profile Page
 *
 * Page for managing user profile and settings.
 * Scaffold - content to be added later.
 */

"use client";

import { User, Mail, Settings } from "lucide-react";
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
        <div className="bg-white border border-black/10 rounded-lg p-8 mb-6 hover:border-black/30 transition-all">
          <div className="flex items-center gap-6 mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-black to-black/80 text-white rounded-full flex items-center justify-center text-3xl font-bold shadow-lg">
              {(user?.name || user?.email)?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">{user?.name || "User"}</h2>
              <p className="text-black/60 flex items-center gap-2">
                <Mail size={16} strokeWidth={2} />
                {user?.email}
              </p>
            </div>
          </div>

          <div className="border-t border-black/10 pt-6">
            <div className="flex items-center gap-2 mb-6">
              <User size={20} strokeWidth={2} className="text-black" />
              <h3 className="font-bold text-lg">Account Information</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black/60 mb-2 flex items-center gap-2">
                  <User size={16} strokeWidth={2} />
                  Name
                </label>
                <div className="px-4 py-3 bg-black/5 rounded-xl border border-black/10 font-medium">
                  {user?.name || "Not set"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-black/60 mb-2 flex items-center gap-2">
                  <Mail size={16} strokeWidth={2} />
                  Email
                </label>
                <div className="px-4 py-3 bg-black/5 rounded-xl border border-black/10 font-medium">
                  {user?.email}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Placeholder for future settings */}
        <div className="border-2 border-dashed border-black/20 rounded-lg p-12 text-center hover:border-black/30 transition-all">
          <div className="w-16 h-16 mx-auto mb-4 bg-black/5 rounded-full flex items-center justify-center">
            <Settings className="w-8 h-8 text-black/40" strokeWidth={1.5} />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-black/70">More Settings Coming Soon</h3>
          <p className="text-black/40">We're working on additional profile customization options</p>
        </div>
      </div>
    </DashboardLayout>
  );
}





