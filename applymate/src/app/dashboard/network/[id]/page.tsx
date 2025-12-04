/**
 * Contact Detail Page
 *
 * Page showing full contact information, interactions timeline, reminders, and AI outreach helper.
 */

"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
  interactions: Array<{
    id: string;
    type: string;
    notes: string | null;
    createdAt: string;
  }>;
  reminders: Array<{
    id: string;
    title: string;
    description: string | null;
    dueDate: string;
    completed: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
}

interface ChatMessage {
  id: string;
  role: string;
  message: string;
  createdAt: string;
}

export default function ContactDetailPage() {
  const router = useRouter();
  const params = useParams();
  const contactId = params.id as string;
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Contact>>({});
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Interactions
  const [showAddInteraction, setShowAddInteraction] = useState(false);
  const [newInteraction, setNewInteraction] = useState({ type: "messaged", notes: "" });
  
  // Reminders
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminder, setNewReminder] = useState({ title: "", description: "", dueDate: "" });

  useEffect(() => {
    if (contactId) {
      fetchContact();
      fetchChatMessages();
    }
  }, [contactId]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const fetchContact = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}`);
      if (res.ok) {
        const data = await res.json();
        setContact(data.contact);
        setEditData(data.contact);
      }
    } catch (error) {
      console.error("Failed to fetch contact:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatMessages = async () => {
    try {
      const res = await fetch(`/api/contacts/${contactId}/chat`);
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Failed to fetch chat messages:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });

      if (res.ok) {
        const data = await res.json();
        setContact(data.contact);
        setEditing(false);
      }
    } catch (error) {
      console.error("Failed to update contact:", error);
      alert("Failed to update contact");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === contact?.status) return;

    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        await fetchContact();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || sendingMessage) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setSendingMessage(true);

    // Add user message immediately
    const tempUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      message: userMessage,
      createdAt: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, tempUserMessage]);

    try {
      const res = await fetch(`/api/contacts/${contactId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, role: "user" }),
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleAddInteraction = async () => {
    try {
      const res = await fetch(`/api/contacts/${contactId}/interactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newInteraction),
      });

      if (res.ok) {
        fetchContact();
        setShowAddInteraction(false);
        setNewInteraction({ type: "messaged", notes: "" });
      }
    } catch (error) {
      console.error("Failed to add interaction:", error);
      alert("Failed to add interaction");
    }
  };

  const handleAddReminder = async () => {
    if (!newReminder.title || !newReminder.dueDate) {
      alert("Please fill in title and due date");
      return;
    }

    try {
      // Convert datetime-local format to ISO datetime string
      const dueDateObj = new Date(newReminder.dueDate);
      if (isNaN(dueDateObj.getTime())) {
        alert("Please enter a valid date and time");
        return;
      }
      const dueDateISO = dueDateObj.toISOString();

      const res = await fetch(`/api/contacts/${contactId}/reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newReminder.title,
          description: newReminder.description || undefined,
          dueDate: dueDateISO,
        }),
      });

      if (res.ok) {
        fetchContact();
        setShowAddReminder(false);
        setNewReminder({ title: "", description: "", dueDate: "" });
      } else {
        const errorData = await res.json();
        const errorMessage = 
          errorData.error?.message || 
          (typeof errorData.error === 'string' ? errorData.error : null) ||
          (errorData.error && JSON.stringify(errorData.error)) ||
          "Failed to create reminder";
        console.error("Reminder creation error:", errorData);
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Failed to add reminder:", error);
      alert("Failed to add reminder");
    }
  };

  const handleToggleReminder = async (reminderId: string, completed: boolean) => {
    try {
      await fetch(`/api/contacts/${contactId}/reminders/${reminderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !completed }),
      });
      fetchContact();
    } catch (error) {
      console.error("Failed to update reminder:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "not_contacted":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "messaged":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "replied":
        return "bg-green-100 text-green-700 border-green-200";
      case "connected":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "meeting":
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-black/60">Loading contact...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!contact) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-black/60">Contact not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <button
            onClick={() => router.push("/dashboard/network")}
            className="text-black/60 hover:text-black mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Network
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Contact Info, Interactions, Reminders */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-lg border border-black/10 p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-bold">Contact Information</h2>
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-black/60 hover:text-black text-sm"
                  >
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditing(false);
                        setEditData(contact);
                      }}
                      className="text-black/60 hover:text-black text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="text-black hover:text-black/80 text-sm font-medium"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                )}
              </div>

              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input
                      type="text"
                      value={editData.name || ""}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-black/20 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Company</label>
                    <input
                      type="text"
                      value={editData.company || ""}
                      onChange={(e) => setEditData({ ...editData, company: e.target.value })}
                      className="w-full px-3 py-2 border border-black/20 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Role</label>
                    <input
                      type="text"
                      value={editData.role || ""}
                      onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                      className="w-full px-3 py-2 border border-black/20 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">LinkedIn URL</label>
                    <input
                      type="url"
                      value={editData.linkedInUrl || ""}
                      onChange={(e) => setEditData({ ...editData, linkedInUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-black/20 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={editData.email || ""}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-black/20 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={editData.status || "not_contacted"}
                      onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-black/20 rounded-lg"
                    >
                      <option value="not_contacted">Not Contacted</option>
                      <option value="messaged">Messaged</option>
                      <option value="replied">Replied</option>
                      <option value="connected">Connected</option>
                      <option value="meeting">Meeting</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Notes</label>
                    <textarea
                      value={editData.notes || ""}
                      onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-black/20 rounded-lg"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-black/60 mb-1">Name</div>
                    <div className="text-lg font-semibold">{contact.name}</div>
                  </div>
                  {contact.company && (
                    <div>
                      <div className="text-sm text-black/60 mb-1">Company</div>
                      <div>{contact.company}</div>
                    </div>
                  )}
                  {contact.role && (
                    <div>
                      <div className="text-sm text-black/60 mb-1">Role</div>
                      <div>{contact.role}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-black/60 mb-2">Status</div>
                    <select
                      value={contact.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      disabled={updatingStatus}
                      className={`px-4 py-2 rounded-full text-sm font-semibold border-2 cursor-pointer transition-all hover:shadow-md ${getStatusColor(
                        contact.status
                      )} disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-black/20`}
                    >
                      <option value="not_contacted">Not Contacted</option>
                      <option value="messaged">Messaged</option>
                      <option value="replied">Replied</option>
                      <option value="connected">Connected</option>
                      <option value="meeting">Meeting</option>
                    </select>
                  </div>
                  {contact.linkedInUrl && (
                    <div>
                      <div className="text-sm text-black/60 mb-1">LinkedIn</div>
                      <a
                        href={contact.linkedInUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View Profile
                      </a>
                    </div>
                  )}
                  {contact.email && (
                    <div>
                      <div className="text-sm text-black/60 mb-1">Email</div>
                      <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {contact.notes && (
                    <div>
                      <div className="text-sm text-black/60 mb-1">Notes</div>
                      <div className="text-sm whitespace-pre-wrap">{contact.notes}</div>
                    </div>
                  )}
                  {contact.lastContactedAt && (
                    <div>
                      <div className="text-sm text-black/60 mb-1">Last Contacted</div>
                      <div className="text-sm">{formatDate(contact.lastContactedAt)}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Interactions Timeline */}
            <div className="bg-white rounded-lg border border-black/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Interactions</h2>
                <button
                  onClick={() => setShowAddInteraction(true)}
                  className="text-black/60 hover:text-black text-sm"
                >
                  + Add
                </button>
              </div>
              {showAddInteraction && (
                <div className="mb-4 p-4 bg-black/5 rounded-lg space-y-3">
                  <select
                    value={newInteraction.type}
                    onChange={(e) => setNewInteraction({ ...newInteraction, type: e.target.value })}
                    className="w-full px-3 py-2 border border-black/20 rounded-lg"
                  >
                    <option value="messaged">Messaged</option>
                    <option value="replied">Replied</option>
                    <option value="scheduled_call">Scheduled Call</option>
                    <option value="met">Met</option>
                    <option value="connected">Connected</option>
                  </select>
                  <textarea
                    value={newInteraction.notes}
                    onChange={(e) => setNewInteraction({ ...newInteraction, notes: e.target.value })}
                    placeholder="Notes..."
                    rows={2}
                    className="w-full px-3 py-2 border border-black/20 rounded-lg"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddInteraction}
                      className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-black/80"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setShowAddInteraction(false);
                        setNewInteraction({ type: "messaged", notes: "" });
                      }}
                      className="px-4 py-2 border border-black/20 text-sm rounded-lg hover:bg-black/5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              <div className="space-y-3">
                {contact.interactions.length === 0 ? (
                  <p className="text-sm text-black/50 text-center py-4">No interactions yet</p>
                ) : (
                  contact.interactions.map((interaction) => (
                    <div key={interaction.id} className="border-l-2 border-black/20 pl-4 pb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{getStatusLabel(interaction.type)}</span>
                        <span className="text-xs text-black/50">{formatDate(interaction.createdAt)}</span>
                      </div>
                      {interaction.notes && (
                        <p className="text-sm text-black/70">{interaction.notes}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Reminders */}
            <div className="bg-white rounded-lg border border-black/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Reminders</h2>
                <button
                  onClick={() => setShowAddReminder(true)}
                  className="text-black/60 hover:text-black text-sm"
                >
                  + Add
                </button>
              </div>
              {showAddReminder && (
                <div className="mb-4 p-4 bg-black/5 rounded-lg space-y-3">
                  <input
                    type="text"
                    value={newReminder.title}
                    onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                    placeholder="Title..."
                    className="w-full px-3 py-2 border border-black/20 rounded-lg"
                  />
                  <textarea
                    value={newReminder.description}
                    onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
                    placeholder="Description..."
                    rows={2}
                    className="w-full px-3 py-2 border border-black/20 rounded-lg"
                  />
                  <input
                    type="datetime-local"
                    value={newReminder.dueDate}
                    onChange={(e) => setNewReminder({ ...newReminder, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-black/20 rounded-lg"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddReminder}
                      className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-black/80"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setShowAddReminder(false);
                        setNewReminder({ title: "", description: "", dueDate: "" });
                      }}
                      className="px-4 py-2 border border-black/20 text-sm rounded-lg hover:bg-black/5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              <div className="space-y-3">
                {contact.reminders.length === 0 ? (
                  <p className="text-sm text-black/50 text-center py-4">No reminders yet</p>
                ) : (
                  contact.reminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className={`p-3 rounded-lg border ${
                        reminder.completed
                          ? "bg-gray-50 border-gray-200"
                          : new Date(reminder.dueDate) < new Date()
                          ? "bg-orange-50 border-orange-200"
                          : "bg-white border-black/10"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <label className="flex items-center gap-2 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            checked={reminder.completed}
                            onChange={() => handleToggleReminder(reminder.id, reminder.completed)}
                            className="w-4 h-4"
                          />
                          <span className={`font-medium text-sm ${reminder.completed ? "line-through text-black/50" : ""}`}>
                            {reminder.title}
                          </span>
                        </label>
                      </div>
                      {reminder.description && (
                        <p className={`text-xs ml-6 ${reminder.completed ? "text-black/40" : "text-black/70"}`}>
                          {reminder.description}
                        </p>
                      )}
                      <p className="text-xs ml-6 text-black/50 mt-1">
                        Due: {formatDate(reminder.dueDate)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - AI Outreach Helper */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-black/10 shadow-sm flex flex-col h-[calc(100vh-180px)] lg:h-[calc(100vh-120px)]">
              <div className="p-6 border-b border-black/10">
                <h2 className="text-xl font-bold mb-1">AI Outreach Helper</h2>
                <p className="text-sm text-black/60">
                  Get personalized outreach message suggestions for {contact.name}
                </p>
              </div>

              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth"
              >
                {chatMessages.length === 0 ? (
                  <div className="text-center py-8 text-black/50">
                    <div className="w-16 h-16 mx-auto mb-4 bg-black/5 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-black/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <p className="font-medium mb-4">Start asking for help!</p>
                    <div className="text-xs space-y-1.5 text-left max-w-xs mx-auto">
                      <p className="font-semibold text-black/70 mb-2">Try asking:</p>
                      <div className="space-y-1.5">
                        <div className="p-2 bg-black/5 rounded-lg text-black/70">"Write a personalized outreach message"</div>
                        <div className="p-2 bg-black/5 rounded-lg text-black/70">"Give me a follow-up message"</div>
                        <div className="p-2 bg-black/5 rounded-lg text-black/70">"Help me write a thank-you message"</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[90%] rounded-2xl p-4 ${
                          msg.role === "user"
                            ? "bg-black text-white"
                            : "bg-black/5 text-black border-2 border-black/5"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</div>
                        ) : (
                          <div className="text-sm leading-relaxed prose prose-sm max-w-none text-black">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.message}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendMessage} className="p-6 border-t border-black/10">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask for outreach help..."
                    className="flex-1 px-4 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
                    disabled={sendingMessage}
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || sendingMessage}
                    className="px-6 py-2 bg-black text-white font-medium rounded-lg hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingMessage ? "..." : "Send"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

