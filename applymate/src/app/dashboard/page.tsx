/**
 * Dashboard Page
 *
 * Main dashboard overview with stats, goals, and reminders.
 * Uses shared DashboardLayout for consistent navigation.
 */

"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AddJobModal from "@/components/dashboard/AddJobModal";
import { useAuth } from "@/lib/auth/context";

interface DashboardStats {
  jobsByStatus: Record<string, number>;
  totalJobs: number;
  totalJobsApplied: number;
  jobsAppliedToday: number;
  jobsAppliedThisWeek: number;
  totalContacts: number;
  contactsAddedToday: number;
  contactsAddedThisWeek: number;
  totalResumes: number;
}

interface Goal {
  jobsDaily: number;
  jobsWeekly: number;
  networkingDaily: number;
  networkingWeekly: number;
}

interface Reminder {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  contact: {
    id: string;
    name: string;
    company: string | null;
  };
}

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  saved: { bg: "bg-gray-100", text: "text-gray-700", icon: "💾" },
  applied: { bg: "bg-blue-100", text: "text-blue-700", icon: "📝" },
  interview: { bg: "bg-yellow-100", text: "text-yellow-700", icon: "💬" },
  offer: { bg: "bg-green-100", text: "text-green-700", icon: "🎉" },
  rejected: { bg: "bg-red-100", text: "text-red-700", icon: "❌" },
};

const STATUS_LABELS: Record<string, string> = {
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [goals, setGoals] = useState<Goal>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dashboard-goals");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // Invalid JSON, use defaults
        }
      }
    }
    return {
      jobsDaily: 5,
      jobsWeekly: 20,
      networkingDaily: 3,
      networkingWeekly: 10,
    };
  });
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<{
    type: "jobs" | "networking";
    period: "daily" | "weekly";
  } | null>(null);

  // Refs for animated numbers
  const numberRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    fetchStats();
    fetchReminders();
  }, []);

  useEffect(() => {
    if (stats) {
      // Small delay to ensure refs are set
      const timer = setTimeout(() => {
        animateNumbers();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [stats]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("dashboard-goals", JSON.stringify(goals));
    }
  }, [goals]);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReminders = async () => {
    try {
      const res = await fetch("/api/contacts/reminders/upcoming?limit=5&includeOverdue=true");
      if (res.ok) {
        const data = await res.json();
        setReminders(data.reminders || []);
      }
    } catch (error) {
      console.error("Failed to fetch reminders:", error);
    }
  };

  const animateNumbers = () => {
    if (!stats) return;

    Object.keys(numberRefs.current).forEach((key) => {
      const element = numberRefs.current[key];
      if (!element) return;

      const targetValue = getValueForKey(key);
      if (targetValue === null) return;

      // Reset to 0
      gsap.set(element, { textContent: 0 });

      // Animate to target
      gsap.to(element, {
        textContent: targetValue,
        duration: 1.5,
        ease: "power2.out",
        snap: { textContent: 1 },
        stagger: 0.1,
        onUpdate: function () {
          const value = Math.round(parseFloat(element.textContent || "0"));
          element.textContent = value.toString();
        },
      });
    });
  };

  const getValueForKey = (key: string): number | null => {
    if (!stats) return null;

    switch (key) {
      case "totalContacts":
        return stats.totalContacts;
      case "totalResumes":
        return stats.totalResumes;
      case "totalJobsApplied":
        return stats.totalJobsApplied;
      case "jobsAppliedToday":
        return stats.jobsAppliedToday;
      case "contactsAddedToday":
        return stats.contactsAddedToday;
      default:
        if (key.startsWith("status-")) {
          const status = key.replace("status-", "");
          return stats.jobsByStatus[status] || 0;
        }
        return null;
    }
  };

  const getProgress = (current: number, goal: number): number => {
    if (goal === 0) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? "s" : ""} overdue`;
    } else if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Tomorrow";
    } else {
      return `In ${diffDays} days`;
    }
  };

  const openGoalModal = (type: "jobs" | "networking", period: "daily" | "weekly") => {
    setEditingGoal({ type, period });
    setShowGoalModal(true);
  };

  const saveGoal = () => {
    if (!editingGoal) return;

    const key = `${editingGoal.type}${editingGoal.period.charAt(0).toUpperCase() + editingGoal.period.slice(1)}` as keyof Goal;
    const input = document.getElementById(`goal-input-${editingGoal.type}-${editingGoal.period}`) as HTMLInputElement;
    if (input) {
      const value = parseInt(input.value) || 0;
      setGoals((prev) => ({ ...prev, [key]: value }));
    }
    setShowGoalModal(false);
    setEditingGoal(null);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-black/60">Loading...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Welcome back, {user?.name || "there"}!
          </h1>
          <p className="text-black/60">
            Here&apos;s an overview of your job search progress.
          </p>
        </div>

        {/* Main Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white p-6 border border-black/10 rounded-lg hover:border-black/30 transition-colors">
            <div className="text-2xl mb-2">👥</div>
            <div
              ref={(el) => {
                numberRefs.current["totalContacts"] = el;
              }}
              className="text-3xl font-bold mb-1"
            >
              0
            </div>
            <div className="text-sm text-black/60">People Networked</div>
          </div>

          <div className="bg-white p-6 border border-black/10 rounded-lg hover:border-black/30 transition-colors">
            <div className="text-2xl mb-2">📄</div>
            <div
              ref={(el) => {
                numberRefs.current["totalResumes"] = el;
              }}
              className="text-3xl font-bold mb-1"
            >
              0
            </div>
            <div className="text-sm text-black/60">Resumes</div>
          </div>

          <div className="bg-white p-6 border border-black/10 rounded-lg hover:border-black/30 transition-colors">
            <div className="text-2xl mb-2">📝</div>
            <div
              ref={(el) => {
                numberRefs.current["totalJobsApplied"] = el;
              }}
              className="text-3xl font-bold mb-1"
            >
              0
            </div>
            <div className="text-sm text-black/60">Jobs Applied</div>
          </div>
        </div>

        {/* Goals Section */}
        <div className="bg-white border border-black/10 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Your Goals</h2>
            <button
              onClick={() => setShowGoalModal(true)}
              className="text-sm text-black/60 hover:text-black transition-colors"
            >
              Edit Goals
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Jobs Goals */}
            <div>
              <h3 className="text-sm font-semibold mb-4 text-black/80">Job Applications</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-black/60">Daily Goal</span>
                    <button
                      onClick={() => openGoalModal("jobs", "daily")}
                      className="text-xs text-black/40 hover:text-black/60"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${getProgress(stats?.jobsAppliedToday || 0, goals.jobsDaily)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium min-w-[60px] text-right">
                      {stats?.jobsAppliedToday || 0} / {goals.jobsDaily}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-black/60">Weekly Goal</span>
                    <button
                      onClick={() => openGoalModal("jobs", "weekly")}
                      className="text-xs text-black/40 hover:text-black/60"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${getProgress(stats?.jobsAppliedThisWeek || 0, goals.jobsWeekly)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium min-w-[60px] text-right">
                      {stats?.jobsAppliedThisWeek || 0} / {goals.jobsWeekly}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Networking Goals */}
            <div>
              <h3 className="text-sm font-semibold mb-4 text-black/80">Networking</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-black/60">Daily Goal</span>
                    <button
                      onClick={() => openGoalModal("networking", "daily")}
                      className="text-xs text-black/40 hover:text-black/60"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-green-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${getProgress(stats?.contactsAddedToday || 0, goals.networkingDaily)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium min-w-[60px] text-right">
                      {stats?.contactsAddedToday || 0} / {goals.networkingDaily}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-black/60">Weekly Goal</span>
                    <button
                      onClick={() => openGoalModal("networking", "weekly")}
                      className="text-xs text-black/40 hover:text-black/60"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-green-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${getProgress(stats?.contactsAddedThisWeek || 0, goals.networkingWeekly)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium min-w-[60px] text-right">
                      {stats?.contactsAddedThisWeek || 0} / {goals.networkingWeekly}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs by Status with Animation */}
        {stats && Object.keys(stats.jobsByStatus).length > 0 && (
          <div className="bg-white border border-black/10 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-6">Jobs by Status</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {Object.entries(stats.jobsByStatus)
                .sort(([a], [b]) => {
                  const order = ["saved", "applied", "interview", "offer", "rejected"];
                  return order.indexOf(a) - order.indexOf(b);
                })
                .map(([status, count]) => {
                  const colors = STATUS_COLORS[status] || STATUS_COLORS.saved;
                  return (
                    <div
                      key={status}
                      className={`${colors.bg} p-4 rounded-lg transition-transform hover:scale-105`}
                    >
                      <div className="text-2xl mb-2">{colors.icon}</div>
                      <div
                        ref={(el) => {
                          numberRefs.current[`status-${status}`] = el;
                        }}
                        className={`text-3xl font-bold mb-1 ${colors.text}`}
                      >
                        0
                      </div>
                      <div className={`text-sm ${colors.text} opacity-80`}>
                        {STATUS_LABELS[status] || status}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Reminders Section */}
        {reminders.length > 0 && (
          <div className="bg-white border border-black/10 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Upcoming Reminders</h2>
              <button
                onClick={() => router.push("/dashboard/network")}
                className="text-sm text-black/60 hover:text-black transition-colors"
              >
                View All →
              </button>
            </div>
            <div className="space-y-3">
              {reminders.slice(0, 5).map((reminder) => {
                const isOverdue = new Date(reminder.dueDate) < new Date();
                return (
                  <div
                    key={reminder.id}
                    className={`p-4 rounded-lg border ${
                      isOverdue
                        ? "border-red-200 bg-red-50"
                        : "border-black/10 bg-white"
                    } hover:border-black/30 transition-colors cursor-pointer`}
                    onClick={() => router.push(`/dashboard/network/${reminder.contact.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold mb-1">{reminder.title}</div>
                        {reminder.description && (
                          <div className="text-sm text-black/60 mb-2">
                            {reminder.description}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-black/60">
                            {reminder.contact.name}
                            {reminder.contact.company && ` • ${reminder.contact.company}`}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`text-sm font-medium ${
                          isOverdue ? "text-red-600" : "text-black/60"
                        }`}
                      >
                        {formatDate(reminder.dueDate)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={() => setShowAddJobModal(true)}
            className="bg-black text-white p-6 rounded-lg hover:bg-black/80 transition-colors text-left"
          >
            <div className="text-2xl mb-2">➕</div>
            <div className="font-semibold mb-1">Add Job Application</div>
            <div className="text-sm text-white/70">
              Track a new job opportunity
            </div>
          </button>

          <button
            onClick={() => router.push("/dashboard/network")}
            className="bg-white border border-black text-black p-6 rounded-lg hover:bg-black hover:text-white transition-colors text-left"
          >
            <div className="text-2xl mb-2">👥</div>
            <div className="font-semibold mb-1">Add Contact</div>
            <div className="text-sm text-black/60">
              Expand your network
            </div>
          </button>
        </div>

        {/* Add Job Modal */}
        <AddJobModal
          isOpen={showAddJobModal}
          onClose={() => setShowAddJobModal(false)}
          onSuccess={() => {
            setShowAddJobModal(false);
            fetchStats();
          }}
        />

        {/* Goal Modal */}
        {showGoalModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">
                {editingGoal
                  ? `Edit ${editingGoal.type === "jobs" ? "Job" : "Networking"} ${
                      editingGoal.period === "daily" ? "Daily" : "Weekly"
                    } Goal`
                  : "Set Your Goals"}
              </h3>

              {editingGoal ? (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Goal ({editingGoal.period === "daily" ? "per day" : "per week"})
                  </label>
                  <input
                    id={`goal-input-${editingGoal.type}-${editingGoal.period}`}
                    type="number"
                    min="0"
                    defaultValue={
                      goals[
                        `${editingGoal.type}${editingGoal.period.charAt(0).toUpperCase() + editingGoal.period.slice(1)}` as keyof Goal
                      ]
                    }
                    className="w-full px-4 py-2 border border-black/20 rounded-lg mb-4"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={saveGoal}
                      className="flex-1 bg-black text-white py-2 rounded-lg hover:bg-black/80 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setShowGoalModal(false);
                        setEditingGoal(null);
                      }}
                      className="flex-1 border border-black/20 py-2 rounded-lg hover:bg-black/5 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Jobs Daily Goal
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={goals.jobsDaily}
                      onChange={(e) =>
                        setGoals((prev) => ({
                          ...prev,
                          jobsDaily: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-4 py-2 border border-black/20 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Jobs Weekly Goal
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={goals.jobsWeekly}
                      onChange={(e) =>
                        setGoals((prev) => ({
                          ...prev,
                          jobsWeekly: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-4 py-2 border border-black/20 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Networking Daily Goal
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={goals.networkingDaily}
                      onChange={(e) =>
                        setGoals((prev) => ({
                          ...prev,
                          networkingDaily: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-4 py-2 border border-black/20 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Networking Weekly Goal
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={goals.networkingWeekly}
                      onChange={(e) =>
                        setGoals((prev) => ({
                          ...prev,
                          networkingWeekly: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-4 py-2 border border-black/20 rounded-lg"
                    />
                  </div>
                  <button
                    onClick={() => setShowGoalModal(false)}
                    className="w-full bg-black text-white py-2 rounded-lg hover:bg-black/80 transition-colors mt-4"
                  >
                    Save Goals
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
