/**
 * Profile Page
 *
 * User profile and account management page.
 */

"use client";

import { 
  User, 
  Mail, 
  Settings, 
  Calendar,
  CheckCircle,
  Clock,
  LogOut,
  Shield,
  Bell,
  Lock,
  Globe
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/lib/auth/context";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out?")) {
      await logout();
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Profile & Settings</h1>
          <p className="text-black/60">
            Manage your account information and preferences.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <div className="bg-white border border-black/10 rounded-xl p-8 hover:border-black/30 transition-all hover:shadow-lg">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-black via-black/90 to-black/70 text-white rounded-full flex items-center justify-center text-4xl font-bold shadow-xl border-4 border-white ring-2 ring-black/10">
                  {(user?.name || user?.email)?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-2">{user?.name || "User"}</h2>
                  <p className="text-black/60 flex items-center gap-2 mb-2">
                    <Mail size={16} strokeWidth={2} />
                    {user?.email}
                  </p>
                  {user?.emailVerified && (
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle size={16} strokeWidth={2} />
                      <span className="font-medium">Verified Account</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-black/10 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <User size={20} strokeWidth={2} className="text-black" />
                  <h3 className="font-bold text-lg">Account Information</h3>
                </div>
                <div className="grid gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black/60 mb-2">
                      Full Name
                    </label>
                    <div className="px-4 py-3 bg-black/5 rounded-lg border border-black/10 font-medium">
                      {user?.name || "Not set"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black/60 mb-2">
                      Email Address
                    </label>
                    <div className="px-4 py-3 bg-black/5 rounded-lg border border-black/10 font-medium">
                      {user?.email}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black/60 mb-2">
                      Account Status
                    </label>
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
                      user?.emailVerified 
                        ? "bg-green-50 text-green-700 border border-green-200" 
                        : "bg-orange-50 text-orange-700 border border-orange-200"
                    }`}>
                      <CheckCircle size={16} strokeWidth={2} />
                      {user?.emailVerified ? "Verified" : "Pending Verification"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Quick Actions & Info */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white border border-black/10 rounded-xl p-6 hover:border-black/30 transition-all hover:shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Settings size={20} strokeWidth={2} className="text-black" />
                <h3 className="font-bold">Quick Actions</h3>
              </div>
              <div className="space-y-3">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 border-2 border-black/10 rounded-lg hover:border-red-200 hover:bg-red-50 transition-all group"
                >
                  <LogOut size={18} strokeWidth={2} className="text-black/60 group-hover:text-red-600 transition-colors" />
                  <span className="font-medium text-black/80 group-hover:text-red-600 transition-colors">Log Out</span>
                </button>
              </div>
            </div>

            {/* Security Info */}
            <div className="bg-white border border-black/10 rounded-xl p-6 hover:border-black/30 transition-all hover:shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <Shield size={20} strokeWidth={2} className="text-black" />
                <h3 className="font-bold">Security</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} strokeWidth={2} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Two-Factor Auth</p>
                    <p className="text-black/60 text-xs">Managed by AWS Cognito</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} strokeWidth={2} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Encrypted Connection</p>
                    <p className="text-black/60 text-xs">All data is encrypted</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} strokeWidth={2} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Secure Storage</p>
                    <p className="text-black/60 text-xs">Files stored in AWS S3</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}





