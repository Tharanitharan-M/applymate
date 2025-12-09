/**
 * Job Detail Page
 *
 * Modern, animated page showing detailed job information, resume match score, and chat assistant.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { 
  ArrowLeft, 
  MapPin, 
  FileText, 
  ExternalLink, 
  ChevronDown, 
  StickyNote, 
  Upload, 
  Eye, 
  BarChart3, 
  MessageSquare, 
  Send 
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DeleteConfirmationModal from "@/components/dashboard/DeleteConfirmationModal";

interface Job {
  id: string;
  company: string;
  role: string;
  location: string | null;
  jobUrl: string | null;
  jobDescription: string | null;
  notes: string | null;
  status: string;
  uploadedResumeUrl: string | null;
  uploadedCoverLetterUrl: string | null;
  createdAt: string;
  updatedAt: string;
  resume: {
    id: string;
    name: string | null;
    fileUrl: string;
  } | null;
  aiResult: {
    id: string;
    matchScore: number | null;
    missingSkills: string[]; // This stores missingItems for backwards compatibility
    suggestedBullets: string[];
    improvedSummary: string | null;
    atsKeywords: string[]; // This stores skillsMatched for backwards compatibility
    relevantExperience: string[] | null;
    improvements: Array<{
      type: string;
      current: string;
      suggested: string;
      explanation: string;
    }> | null;
  } | null;
  chats: Array<{
    id: string;
    role: string;
    message: string;
    createdAt: string;
  }>;
}

interface MatchAnalysis {
  matchScore: number;
  missingItems: string[];
  skillsMatched: string[];
  suggestedBullets: string[];
  improvedSummary: string;
  relevantExperience: string[];
  improvements: Array<{
    type: string;
    current: string;
    suggested: string;
    explanation: string;
  }>;
}

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [matchAnalysis, setMatchAnalysis] = useState<MatchAnalysis | null>(null);
  const [calculatingScore, setCalculatingScore] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Job>>({});
  const [saving, setSaving] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<Job["chats"]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [resumes, setResumes] = useState<Array<{ id: string; name: string | null }>>([]);
  const [deleting, setDeleting] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingCoverLetter, setUploadingCoverLetter] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (jobId) {
      fetchJob();
      fetchResumes();
    }
  }, [jobId]);


  const fetchJob = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (res.ok) {
        const data = await res.json();
        setJob(data.job);
        setChatMessages(data.job.chats || []);
        setEditData(data.job);
        
        // Load stored analysis data from aiResult if it exists
        if (data.job.aiResult && data.job.aiResult.matchScore !== null) {
          const storedAnalysis: MatchAnalysis = {
            matchScore: data.job.aiResult.matchScore,
            missingItems: data.job.aiResult.missingSkills || [],
            skillsMatched: data.job.aiResult.atsKeywords || [],
            suggestedBullets: data.job.aiResult.suggestedBullets || [],
            improvedSummary: data.job.aiResult.improvedSummary || "",
            relevantExperience: data.job.aiResult.relevantExperience || [],
            improvements: (data.job.aiResult.improvements as MatchAnalysis["improvements"]) || [],
          };
          setMatchAnalysis(storedAnalysis);
        }
      } else {
        router.push("/dashboard/jobs");
      }
    } catch (error) {
      console.error("Failed to fetch job:", error);
      router.push("/dashboard/jobs");
    } finally {
      setLoading(false);
    }
  };

  const fetchResumes = async () => {
    try {
      const res = await fetch("/api/resume");
      if (res.ok) {
        const data = await res.json();
        setResumes(data.resumes || []);
      }
    } catch (error) {
      console.error("Failed to fetch resumes:", error);
    }
  };


  const calculateMatchScore = async () => {
    if (!job?.resume || !job?.jobDescription) {
      alert("Resume and job description are required to calculate match score");
      return;
    }

    setCalculatingScore(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/match-score`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        setMatchAnalysis(data.analysis);
        fetchJob();
      } else {
        alert("Failed to calculate match score");
      }
    } catch (error) {
      console.error("Failed to calculate match score:", error);
      alert("Failed to calculate match score");
    } finally {
      setCalculatingScore(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatePayload: {
        company?: string;
        role?: string;
        location?: string | null;
        jobUrl?: string | null;
        jobDescription?: string | null;
        notes?: string | null;
        status?: string;
        resumeId?: string;
      } = {
        company: editData.company,
        role: editData.role,
        location: editData.location ?? null,
        jobUrl: editData.jobUrl ?? null,
        jobDescription: editData.jobDescription ?? null,
        notes: editData.notes ?? null,
        status: editData.status,
      };

      if (editData.resume?.id && editData.resume.id !== job?.resume?.id) {
        updatePayload.resumeId = editData.resume.id;
      }

      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      if (res.ok) {
        await fetchJob();
        setEditing(false);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to update job");
      }
    } catch (error) {
      console.error("Failed to update job:", error);
      alert("Failed to update job");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/dashboard/jobs");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete job");
        setDeleteModalOpen(false);
      }
    } catch (error) {
      console.error("Failed to delete job:", error);
      alert("Failed to delete job");
      setDeleteModalOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    setSendingMessage(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: chatInput, role: "user" }),
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages([...chatMessages, data.userMessage, data.assistantMessage]);
        setChatInput("");
        
        // Scroll chat to bottom
        setTimeout(() => {
          const chatContainer = document.querySelector('[data-chat-container]');
          if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
          }
        }, 100);
      } else {
        alert("Failed to send message");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleFileUpload = async (file: File, type: "resume" | "coverLetter") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    if (type === "resume") {
      setUploadingResume(true);
    } else {
      setUploadingCoverLetter(true);
    }

    try {
      const res = await fetch(`/api/jobs/${jobId}/upload`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        await fetchJob(); // Refresh job data
      } else {
        const error = await res.json();
        alert(error.error || `Failed to upload ${type === "resume" ? "resume" : "cover letter"}`);
      }
    } catch (error) {
      console.error(`Failed to upload ${type}:`, error);
      alert(`Failed to upload ${type === "resume" ? "resume" : "cover letter"}`);
    } finally {
      if (type === "resume") {
        setUploadingResume(false);
      } else {
        setUploadingCoverLetter(false);
      }
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === job?.status) return;

    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        await fetchJob();
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "saved":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "applied":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "interviewing":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "offer":
        return "bg-green-100 text-green-700 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "saved":
        return "Saved";
      case "applied":
        return "Applied";
      case "interviewing":
        return "Interviewing";
      case "offer":
        return "Offer";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-green-500 to-emerald-600";
    if (score >= 60) return "from-yellow-500 to-orange-600";
    return "from-red-500 to-pink-600";
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-lg text-black/60 font-medium">Loading job details...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return null;
  }

  // Extract missingItems from matchAnalysis or fallback to aiResult
  const missingItems = matchAnalysis?.missingItems || job.aiResult?.missingSkills || [];
  
  // Extract skillsMatched from matchAnalysis or fallback to aiResult (stored as atsKeywords)
  const skillsMatched = matchAnalysis?.skillsMatched || job.aiResult?.atsKeywords || [];
  
  // Extract improvedSummary from matchAnalysis or aiResult
  const improvedSummary = matchAnalysis?.improvedSummary || job.aiResult?.improvedSummary || null;
  
  // Extract suggestedBullets from matchAnalysis or aiResult
  const suggestedBullets = matchAnalysis?.suggestedBullets || job.aiResult?.suggestedBullets || [];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => router.push("/dashboard/jobs")}
          className="mb-6 flex items-center gap-2 text-black/60 hover:text-black transition-all duration-200 group"
        >
          <ArrowLeft 
            className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" 
            strokeWidth={2} 
          />
          <span className="font-medium">Back to Jobs</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Left Column - Job Overview & Match Score */}
          <div className="lg:col-span-3 space-y-6">
            {/* Job Overview Card */}
            <div className="bg-white rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
              <div className="p-6 lg:p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h1 className="text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-black to-black/80 bg-clip-text text-transparent">
                      {job.role}
                    </h1>
                    <p className="text-xl lg:text-2xl text-black/70 font-medium mb-2">{job.company}</p>
                    {job.location && (
                      <p className="text-sm text-black/50 flex items-center gap-1">
                        <MapPin className="w-4 h-4" strokeWidth={2} />
                        {job.location}
                      </p>
                    )}
                  </div>
                  {!editing && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => setEditing(true)}
                        className="px-4 py-2 border-2 border-black/20 rounded-xl hover:bg-black hover:text-white hover:border-black transition-all duration-200 font-medium text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={handleDeleteClick}
                        className="px-4 py-2 border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-200 font-medium text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {editing ? (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-black/70">Company</label>
                        <input
                          type="text"
                          value={editData.company || ""}
                          onChange={(e) => setEditData({ ...editData, company: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:outline-none focus:border-black/30 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-black/70">Role</label>
                        <input
                          type="text"
                          value={editData.role || ""}
                          onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:outline-none focus:border-black/30 transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-black/70">Location</label>
                      <input
                        type="text"
                        value={editData.location || ""}
                        onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:outline-none focus:border-black/30 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-black/70">Status</label>
                      <select
                        value={editData.status || ""}
                        onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:outline-none focus:border-black/30 transition-colors"
                      >
                        <option value="saved">Saved</option>
                        <option value="applied">Applied</option>
                        <option value="interviewing">Interviewing</option>
                        <option value="offer">Offer</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-black/70">Resume</label>
                      <select
                        value={editData.resume?.id || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            resume: { id: e.target.value, name: null, fileUrl: "" },
                          })
                        }
                        className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:outline-none focus:border-black/30 transition-colors"
                      >
                        {resumes.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name || "Untitled Resume"}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-black/70">Job URL</label>
                      <input
                        type="url"
                        value={editData.jobUrl || ""}
                        onChange={(e) => setEditData({ ...editData, jobUrl: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:outline-none focus:border-black/30 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-black/70">Job Description</label>
                      <textarea
                        value={editData.jobDescription || ""}
                        onChange={(e) => setEditData({ ...editData, jobDescription: e.target.value })}
                        rows={6}
                        className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:outline-none focus:border-black/30 transition-colors resize-none"
                        placeholder="Job description..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-black/70">Notes</label>
                      <textarea
                        value={editData.notes || ""}
                        onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 border-2 border-black/10 rounded-xl focus:outline-none focus:border-black/30 transition-colors resize-none"
                        placeholder="Add your notes about this job..."
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-3 bg-black text-white rounded-xl hover:bg-black/90 disabled:opacity-50 font-medium transition-all duration-200 shadow-lg shadow-black/10"
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        onClick={() => {
                          setEditing(false);
                          setEditData(job);
                        }}
                        className="px-6 py-3 border-2 border-black/20 rounded-xl hover:bg-black/5 font-medium transition-all duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <select
                        value={job.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        disabled={updatingStatus}
                        className={`px-4 py-2 rounded-full text-sm font-semibold border-2 cursor-pointer transition-all hover:shadow-md ${getStatusColor(
                          job.status
                        )} disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-black/20`}
                      >
                        <option value="saved">Saved</option>
                        <option value="applied">Applied</option>
                        <option value="interviewing">Interviewing</option>
                        <option value="offer">Offer</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      {job.resume && (
                        <span className="text-sm text-black/60 flex items-center gap-2">
                          <FileText className="w-4 h-4" strokeWidth={2} />
                          {job.resume.name || "Untitled"}
                        </span>
                      )}
                      <span className="text-sm text-black/50">
                        Added {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {job.jobUrl && (
                      <a
                        href={job.jobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-all duration-200 font-medium text-sm"
                      >
                        View Job Posting
                        <ExternalLink className="w-4 h-4" strokeWidth={2} />
                      </a>
                    )}

                    {job.jobDescription && (
                      <details className="group">
                        <summary className="cursor-pointer font-semibold text-black/80 hover:text-black transition-colors py-2 list-none">
                          <span className="flex items-center gap-2">
                            Job Description
                            <ChevronDown
                              className="w-4 h-4 transform group-open:rotate-180 transition-transform"
                              strokeWidth={2}
                            />
                          </span>
                        </summary>
                        <div className="mt-3 p-4 bg-black/5 rounded-xl whitespace-pre-wrap text-sm text-black/70 leading-relaxed">
                          {job.jobDescription}
                        </div>
                      </details>
                    )}

                    {job.notes && (
                      <div className="p-4 bg-amber-50 border-2 border-amber-100 rounded-xl">
                        <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                          <StickyNote className="w-4 h-4" strokeWidth={2} />
                          Notes
                        </h3>
                        <p className="text-sm text-amber-800 whitespace-pre-wrap">{job.notes}</p>
                      </div>
                    )}

                    {/* File Upload Section - Only show if status is "applied" or later */}
                    {(job.status === "applied" || job.status === "interviewing" || job.status === "offer" || job.status === "rejected") && (
                      <div className="mt-6 pt-6 border-t border-black/10">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                          <FileText className="w-5 h-5" strokeWidth={2} />
                          Uploaded Files
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Resume Upload */}
                          <div className="p-4 border-2 border-black/10 rounded-xl">
                            <label className="block text-sm font-semibold mb-2 text-black/70">
                              Resume PDF
                            </label>
                            {job.uploadedResumeUrl ? (
                              <div className="space-y-2">
                                <a
                                  href={`/api/jobs/${jobId}/files/resume`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                                >
                                  <Eye className="w-4 h-4" strokeWidth={2} />
                                  View Resume
                                </a>
                                <label className="block">
                                  <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleFileUpload(file, "resume");
                                    }}
                                    disabled={uploadingResume}
                                    className="hidden"
                                  />
                                  <span className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-black/5 hover:bg-black/10 rounded-lg transition-colors text-sm font-medium text-black/70">
                                    {uploadingResume ? "Uploading..." : "Replace Resume"}
                                  </span>
                                </label>
                              </div>
                            ) : (
                              <label className="block">
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(file, "resume");
                                  }}
                                  disabled={uploadingResume}
                                  className="hidden"
                                />
                                <span className="cursor-pointer inline-flex items-center gap-2 px-4 py-3 border-2 border-dashed border-black/20 rounded-lg hover:border-black/40 hover:bg-black/5 transition-colors text-sm font-medium">
                                  {uploadingResume ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                      Uploading...
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="w-5 h-5" strokeWidth={2} />
                                      Upload Resume PDF
                                    </>
                                  )}
                                </span>
                              </label>
                            )}
                          </div>

                          {/* Cover Letter Upload */}
                          <div className="p-4 border-2 border-black/10 rounded-xl">
                            <label className="block text-sm font-semibold mb-2 text-black/70">
                              Cover Letter PDF
                            </label>
                            {job.uploadedCoverLetterUrl ? (
                              <div className="space-y-2">
                                <a
                                  href={`/api/jobs/${jobId}/files/coverLetter`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                                >
                                  <Eye className="w-4 h-4" strokeWidth={2} />
                                  View Cover Letter
                                </a>
                                <label className="block">
                                  <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleFileUpload(file, "coverLetter");
                                    }}
                                    disabled={uploadingCoverLetter}
                                    className="hidden"
                                  />
                                  <span className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-black/5 hover:bg-black/10 rounded-lg transition-colors text-sm font-medium text-black/70">
                                    {uploadingCoverLetter ? "Uploading..." : "Replace Cover Letter"}
                                  </span>
                                </label>
                              </div>
                            ) : (
                              <label className="block">
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(file, "coverLetter");
                                  }}
                                  disabled={uploadingCoverLetter}
                                  className="hidden"
                                />
                                <span className="cursor-pointer inline-flex items-center gap-2 px-4 py-3 border-2 border-dashed border-black/20 rounded-lg hover:border-black/40 hover:bg-black/5 transition-colors text-sm font-medium">
                                  {uploadingCoverLetter ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                      Uploading...
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="w-5 h-5" strokeWidth={2} />
                                      Upload Cover Letter PDF
                                    </>
                                  )}
                                </span>
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Resume Match Score Card */}
            <div className="bg-white rounded-2xl border border-black/5 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
              <div className="p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Resume Match Score</h2>
                  <button
                    onClick={calculateMatchScore}
                    disabled={calculatingScore || !job.resume || !job.jobDescription}
                    className="px-4 py-2 bg-black text-white rounded-xl hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all duration-200 shadow-lg shadow-black/10"
                  >
                    {calculatingScore ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Calculating...
                      </span>
                    ) : (
                      "Recalculate"
                    )}
                  </button>
                </div>

                {job.aiResult?.matchScore !== null && job.aiResult?.matchScore !== undefined ? (
                  <div className="space-y-8">
                    {/* Score Display */}
                    <div className="text-center py-8">
                      <div
                        className={`inline-block text-7xl lg:text-8xl font-black mb-3 bg-gradient-to-br ${getScoreGradient(
                          job.aiResult.matchScore
                        )} bg-clip-text text-transparent`}
                      >
                        {job.aiResult.matchScore}
                      </div>
                      <div className="text-xl font-semibold text-black/60">Match Score</div>
                      <div className="mt-4 w-full max-w-xs mx-auto h-2 bg-black/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${getScoreGradient(
                            job.aiResult.matchScore
                          )} transition-all duration-1000 ease-out`}
                          style={{ width: `${job.aiResult.matchScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-6 border-t border-black/10 pt-6">
                      {/* Skills Matched */}
                      {skillsMatched.length > 0 && (
                        <div>
                          <h3 className="font-bold text-lg mb-3 text-green-700 flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Skills Matched
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {skillsMatched.map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-4 py-2 bg-green-50 text-green-700 rounded-xl text-sm font-medium border-2 border-green-100"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Missing Items */}
                      {missingItems.length > 0 && (
                        <div>
                          <h3 className="font-bold text-lg mb-3 text-orange-700 flex items-center gap-2">
                            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                            Missing Skills & Keywords
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {missingItems.map((item, idx) => (
                              <span
                                key={idx}
                                className="px-4 py-2 bg-orange-50 text-orange-700 rounded-xl text-sm font-medium border-2 border-orange-100"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Relevant Experience */}
                      {matchAnalysis?.relevantExperience && matchAnalysis.relevantExperience.length > 0 && (
                        <div>
                          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            Relevant Experience
                          </h3>
                          <div className="space-y-2">
                            {matchAnalysis.relevantExperience.map((exp, idx) => (
                              <div
                                key={idx}
                                className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg text-sm text-black/80"
                              >
                                {exp}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Improved Summary */}
                      {improvedSummary && (
                        <div>
                          <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                            Improved Summary
                          </h3>
                          <div className="p-4 bg-purple-50 border-2 border-purple-100 rounded-xl text-sm text-black/80 leading-relaxed whitespace-pre-line">
                            {improvedSummary}
                          </div>
                        </div>
                      )}

                      {/* Improvements */}
                      {matchAnalysis?.improvements && matchAnalysis.improvements.length > 0 && (
                        <div>
                          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                            Suggested Improvements
                          </h3>
                          <div className="space-y-3">
                            {matchAnalysis.improvements.map((improvement, idx) => (
                              <div
                                key={idx}
                                className="p-4 bg-indigo-50 border-2 border-indigo-100 rounded-xl"
                              >
                                <div className="text-xs font-bold text-indigo-700 mb-2 uppercase tracking-wide">
                                  {improvement.type.replace("_", " ")}
                                </div>
                                {improvement.current && (
                                  <div className="text-sm mb-2 text-black/70 line-through">
                                    {improvement.current}
                                  </div>
                                )}
                                {improvement.suggested && (
                                  <div className="text-sm mb-2 font-semibold text-indigo-900">
                                    → {improvement.suggested}
                                  </div>
                                )}
                                {improvement.explanation && (
                                  <div className="text-xs text-black/60 mt-2 italic">
                                    {improvement.explanation}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {!matchAnalysis && skillsMatched.length === 0 && missingItems.length === 0 && !improvedSummary && (
                        <div className="text-center py-8 text-black/50">
                          <p className="mb-2">Click "Recalculate" to see detailed breakdown and suggestions.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto mb-4 bg-black/5 rounded-full flex items-center justify-center">
                      <BarChart3 className="w-10 h-10 text-black/40" strokeWidth={1.5} />
                    </div>
                    <p className="text-lg font-medium text-black/70 mb-6">No match score calculated yet</p>
                    <button
                      onClick={calculateMatchScore}
                      disabled={calculatingScore || !job.resume || !job.jobDescription}
                      className="px-8 py-4 bg-black text-white rounded-xl hover:bg-black/90 disabled:opacity-50 font-semibold transition-all duration-200 shadow-lg shadow-black/10"
                    >
                      {calculatingScore ? "Calculating..." : "Calculate Match Score"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Chat Assistant */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-black/5 shadow-sm flex flex-col h-[calc(100vh-180px)] lg:h-[calc(100vh-120px)]">
              <div className="p-6 border-b border-black/10">
                <h2 className="text-xl font-bold mb-1">Job Chat Assistant</h2>
                <p className="text-sm text-black/60">
                  Get personalized advice for this role
                </p>
              </div>

              <div
                data-chat-container
                className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth"
              >
                {chatMessages.length === 0 ? (
                  <div className="text-center py-8 text-black/50">
                    <div className="w-16 h-16 mx-auto mb-4 bg-black/5 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-8 h-8 text-black/40" strokeWidth={1.5} />
                    </div>
                    <p className="font-medium mb-4">Start a conversation!</p>
                    <div className="text-xs space-y-1.5 text-left max-w-xs mx-auto">
                      <p className="font-semibold text-black/70 mb-2">Try asking:</p>
                      <div className="space-y-1.5">
                        <div className="p-2 bg-black/5 rounded-lg text-black/70">"Write a cover letter"</div>
                        <div className="p-2 bg-black/5 rounded-lg text-black/70">"Interview talking points"</div>
                        <div className="p-2 bg-black/5 rounded-lg text-black/70">"Resume improvements"</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                      style={{ animationDelay: `${idx * 0.1}s` }}
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
                          <div className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                                ul: ({ children }) => <ul className="mb-3 ml-4 list-disc space-y-1">{children}</ul>,
                                ol: ({ children }) => <ol className="mb-3 ml-4 list-decimal space-y-1">{children}</ol>,
                                li: ({ children }) => <li className="ml-2">{children}</li>,
                                strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                                em: ({ children }) => <em className="italic">{children}</em>,
                                code: ({ children, className }) => {
                                  const isInline = !className;
                                  return isInline ? (
                                    <code className="px-1.5 py-0.5 bg-black/10 rounded text-xs font-mono">{children}</code>
                                  ) : (
                                    <code className="block p-3 bg-black/10 rounded-lg text-xs font-mono overflow-x-auto">{children}</code>
                                  );
                                },
                                pre: ({ children }) => <pre className="mb-3 last:mb-0">{children}</pre>,
                                h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-4 first:mt-0">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-sm font-bold mb-2 mt-3 first:mt-0">{children}</h3>,
                                blockquote: ({ children }) => (
                                  <blockquote className="border-l-4 border-black/20 pl-4 my-3 italic">{children}</blockquote>
                                ),
                                a: ({ children, href }) => (
                                  <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                                    {children}
                                  </a>
                                ),
                              }}
                            >
                              {msg.message}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 border-t border-black/10">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Ask a question..."
                    className="flex-1 px-4 py-3 border-2 border-black/10 rounded-xl focus:outline-none focus:border-black/30 transition-colors"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sendingMessage || !chatInput.trim()}
                    className="px-5 py-3 bg-black text-white rounded-xl hover:bg-black/90 disabled:opacity-50 font-medium transition-all duration-200 shadow-lg shadow-black/10"
                  >
                    {sendingMessage ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" strokeWidth={2} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Job Listing"
        message="Are you sure you want to delete this job listing?"
        itemName={job ? `${job.role} at ${job.company}` : undefined}
        isLoading={deleting}
      />

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </DashboardLayout>
  );
}
