/**
 * Network Page
 *
 * Page for managing networking contacts with search, filters, and contact list.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AddContactModal from "@/components/dashboard/AddContactModal";
import DeleteConfirmationModal from "@/components/dashboard/DeleteConfirmationModal";

interface Contact {
  id: string;
  name: string;
  company: string | null;
  role: string | null;
  linkedInUrl: string | null;
  email: string | null;
  notes: string | null;
  status: string;
  lastContactedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lastInteraction: {
    id: string;
    type: string;
    createdAt: string;
  } | null;
  nextReminder: {
    id: string;
    title: string;
    dueDate: string;
  } | null;
}

export default function NetworkPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [groupByCompany, setGroupByCompany] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);
  const [upcomingReminders, setUpcomingReminders] = useState<Array<{
    id: string;
    title: string;
    description: string | null;
    dueDate: string;
    contact: {
      id: string;
      name: string;
      company: string | null;
    };
  }>>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    fetchContacts();
    fetchUpcomingReminders();
    checkNotificationPermission();
    
    // Check for due reminders every minute
    const interval = setInterval(() => {
      checkDueReminders();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [statusFilter, sortBy, searchQuery, groupByCompany]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (sortBy) params.append("sort", sortBy);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (groupByCompany) params.append("groupByCompany", "true");

      const res = await fetch(`/api/contacts?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
        // Refresh reminders after contacts are loaded
        fetchUpcomingReminders();
      }
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "not_contacted":
        return "bg-gray-100 text-gray-700";
      case "messaged":
        return "bg-blue-100 text-blue-700";
      case "replied":
        return "bg-green-100 text-green-700";
      case "connected":
        return "bg-purple-100 text-purple-700";
      case "meeting":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "not_contacted":
        return "Not Contacted";
      case "messaged":
        return "Messaged";
      case "replied":
        return "Replied";
      case "connected":
        return "Connected";
      case "meeting":
        return "Meeting";
      default:
        return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleContactClick = (contactId: string) => {
    router.push(`/dashboard/network/${contactId}`);
  };

  const handleDeleteClick = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation to contact detail
    setContactToDelete({ id: contact.id, name: contact.name });
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!contactToDelete) return;

    setDeletingContactId(contactToDelete.id);
    try {
      const res = await fetch(`/api/contacts/${contactToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchContacts(); // Refresh the list
        setDeleteModalOpen(false);
        setContactToDelete(null);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete contact");
      }
    } catch (error) {
      console.error("Failed to delete contact:", error);
      alert("Failed to delete contact");
    } finally {
      setDeletingContactId(null);
    }
  };

  const fetchUpcomingReminders = async () => {
    try {
      const res = await fetch("/api/contacts/reminders/upcoming?limit=5&includeOverdue=true");
      if (res.ok) {
        const data = await res.json();
        setUpcomingReminders(data.reminders || []);
      }
    } catch (error) {
      console.error("Failed to fetch upcoming reminders:", error);
    }
  };

  const checkNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = Notification.permission;
      setNotificationPermission(permission);
      
      if (permission === "default") {
        // Request permission when user first visits
        try {
          const newPermission = await Notification.requestPermission();
          setNotificationPermission(newPermission);
        } catch (error) {
          console.error("Error requesting notification permission:", error);
        }
      }
    }
  };

  const checkDueReminders = async () => {
    try {
      const res = await fetch("/api/contacts/reminders/upcoming?limit=50&includeOverdue=true");
      if (res.ok) {
        const data = await res.json();
        const now = new Date();
        
        // Find reminders that are due now or just passed (within 5 minutes window to catch them)
        const dueNow = data.reminders.filter((reminder: any) => {
          const dueDate = new Date(reminder.dueDate);
          const timeDiff = dueDate.getTime() - now.getTime();
          // Check if reminder is due (within 5 minutes past due time, but not more than 1 hour ago to avoid old reminders)
          return timeDiff <= 300000 && timeDiff > -3600000;
        });

        // Show browser notification for due reminders
        if (dueNow.length > 0 && "Notification" in window && Notification.permission === "granted") {
          dueNow.forEach((reminder: any) => {
            const notificationKey = `reminder-${reminder.id}-${Math.floor(new Date(reminder.dueDate).getTime() / 60000)}`;
            const lastShown = localStorage.getItem(notificationKey);
            
            // Only show notification if we haven't shown it for this reminder at this time
            if (!lastShown || Date.now() - parseInt(lastShown) > 300000) {
              new Notification(`Reminder: ${reminder.title}`, {
                body: reminder.description || `Time to follow up with ${reminder.contact.name}${reminder.contact.company ? ` at ${reminder.contact.company}` : ""}`,
                icon: "/favicon.ico",
                tag: notificationKey, // Prevent duplicate notifications
                requireInteraction: false,
              });
              localStorage.setItem(notificationKey, Date.now().toString());
            }
          });
        }

        // Update the reminders list
        setUpcomingReminders(data.reminders || []);
      }
    } catch (error) {
      console.error("Failed to check due reminders:", error);
    }
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === "granted") {
          alert("Notifications enabled! You'll be notified when reminders are due.");
        }
      } catch (error) {
        console.error("Error requesting notification permission:", error);
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Network</h1>
            <p className="text-black/60">
              Manage your networking contacts and stay organized.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-black text-white font-medium hover:bg-black/80 transition-colors rounded-lg flex items-center gap-2"
          >
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Contact
          </button>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-black/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by name, company, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
          >
            <option value="all">All Status</option>
            <option value="not_contacted">Not Contacted</option>
            <option value="messaged">Messaged</option>
            <option value="replied">Replied</option>
            <option value="connected">Connected</option>
            <option value="meeting">Meeting</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>

          {/* Group by Company Toggle */}
          <label className="flex items-center gap-2 px-4 py-2 border border-black/20 rounded-lg cursor-pointer hover:bg-black/5 transition-colors">
            <input
              type="checkbox"
              checked={groupByCompany}
              onChange={(e) => setGroupByCompany(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Group by Company</span>
          </label>
        </div>

        {/* Upcoming Reminders Widget */}
        {upcomingReminders.length > 0 && (
          <div className="mb-6 bg-white border border-black/10 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold">Upcoming Reminders</h2>
                {notificationPermission !== "granted" && (
                  <button
                    onClick={requestNotificationPermission}
                    className="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"
                  >
                    Enable Notifications
                  </button>
                )}
              </div>
              <button
                onClick={fetchUpcomingReminders}
                className="text-sm text-black/60 hover:text-black"
              >
                Refresh
              </button>
            </div>
            <div className="space-y-3">
              {upcomingReminders.slice(0, 5).map((reminder) => {
                const dueDate = new Date(reminder.dueDate);
                const now = new Date();
                const isOverdue = dueDate < now;
                const timeUntilDue = dueDate.getTime() - now.getTime();
                const hoursUntil = Math.floor(timeUntilDue / (1000 * 60 * 60));
                const minutesUntil = Math.floor((timeUntilDue % (1000 * 60 * 60)) / (1000 * 60));

                return (
                  <div
                    key={reminder.id}
                    onClick={() => router.push(`/dashboard/network/${reminder.contact.id}`)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      isOverdue
                        ? "bg-orange-50 border-orange-200"
                        : timeUntilDue < 3600000 // Less than 1 hour
                        ? "bg-yellow-50 border-yellow-200"
                        : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{reminder.title}</span>
                          {isOverdue && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-orange-200 text-orange-800 rounded-full">
                              Overdue
                            </span>
                          )}
                          {!isOverdue && timeUntilDue < 3600000 && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-yellow-200 text-yellow-800 rounded-full">
                              Due Soon
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-black/70 mb-1">
                          {reminder.contact.name}
                          {reminder.contact.company && ` • ${reminder.contact.company}`}
                        </p>
                        {reminder.description && (
                          <p className="text-xs text-black/60 mb-2">{reminder.description}</p>
                        )}
                        <p className="text-xs text-black/50">
                          {isOverdue
                            ? `Overdue by ${Math.abs(hoursUntil)}h ${Math.abs(minutesUntil)}m`
                            : hoursUntil > 0
                            ? `Due in ${hoursUntil}h ${minutesUntil}m`
                            : `Due in ${minutesUntil}m`}
                        </p>
                      </div>
                      <div className="text-xs text-black/50">
                        {dueDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {upcomingReminders.length > 5 && (
              <button
                onClick={() => {
                  // Could navigate to a reminders page or show all
                  alert(`You have ${upcomingReminders.length} total reminders. View all on the contact pages.`);
                }}
                className="mt-4 text-sm text-black/60 hover:text-black"
              >
                View all {upcomingReminders.length} reminders →
              </button>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-black/60">Loading contacts...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && contacts.length === 0 && (
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">No contacts yet</h2>
            <p className="text-black/60 mb-6 max-w-md mx-auto">
              Start building your network by adding your first contact.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-black text-white font-medium hover:bg-black/80 transition-colors rounded-lg"
            >
              Add Your First Contact
            </button>
          </div>
        )}

        {/* Contacts List */}
        {!loading && contacts.length > 0 && (
          <div className="grid gap-4">
            {groupByCompany ? (
              // Grouped by company
              (() => {
                const grouped = contacts.reduce((acc, contact) => {
                  const company = contact.company || "No Company";
                  if (!acc[company]) {
                    acc[company] = [];
                  }
                  acc[company].push(contact);
                  return acc;
                }, {} as Record<string, Contact[]>);

                return Object.entries(grouped).map(([company, companyContacts]) => (
                  <div key={company} className="mb-6">
                    <h2 className="text-lg font-semibold mb-3 text-black/80">
                      {company} ({companyContacts.length})
                    </h2>
                    <div className="grid gap-4">
                      {companyContacts.map((contact) => (
                        <ContactCard
                          key={contact.id}
                          contact={contact}
                          onClick={() => handleContactClick(contact.id)}
                          onDelete={(e) => handleDeleteClick(contact, e)}
                          getStatusColor={getStatusColor}
                          getStatusLabel={getStatusLabel}
                          formatDate={formatDate}
                        />
                      ))}
                    </div>
                  </div>
                ));
              })()
            ) : (
              // Regular list
              contacts.map((contact) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  onClick={() => handleContactClick(contact.id)}
                  onDelete={(e) => handleDeleteClick(contact, e)}
                  getStatusColor={getStatusColor}
                  getStatusLabel={getStatusLabel}
                  formatDate={formatDate}
                />
              ))
            )}
          </div>
        )}

        {/* Add Contact Modal */}
        <AddContactModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchContacts}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setContactToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Contact"
          message="Are you sure you want to delete this contact?"
          itemName={contactToDelete ? contactToDelete.name : undefined}
          isLoading={deletingContactId !== null}
        />
      </div>
    </DashboardLayout>
  );
}

// Contact Card Component
interface ContactCardProps {
  contact: Contact;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
  formatDate: (dateString: string | null) => string | null;
}

function ContactCard({
  contact,
  onClick,
  onDelete,
  getStatusColor,
  getStatusLabel,
  formatDate,
}: ContactCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-black/10 rounded-lg p-6 hover:border-black/30 hover:shadow-md transition-all cursor-pointer relative group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold truncate">{contact.name}</h3>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                contact.status
              )}`}
            >
              {getStatusLabel(contact.status)}
            </span>
          </div>
          {contact.role && (
            <p className="text-black/70 mb-1">{contact.role}</p>
          )}
          {contact.company && (
            <p className="text-black/60 text-sm mb-3">{contact.company}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm text-black/50">
            {contact.linkedInUrl && (
              <a
                href={contact.linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="hover:text-black flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                LinkedIn
              </a>
            )}
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                onClick={(e) => e.stopPropagation()}
                className="hover:text-black flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Email
              </a>
            )}
            {contact.lastContactedAt && (
              <span>Last contacted: {formatDate(contact.lastContactedAt)}</span>
            )}
            {contact.nextReminder && (
              <span className="text-orange-600">
                Reminder: {formatDate(contact.nextReminder.dueDate)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-lg text-red-600 hover:text-red-700"
            title="Delete contact"
          >
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
          <svg
            className="w-5 h-5 text-black/40 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
