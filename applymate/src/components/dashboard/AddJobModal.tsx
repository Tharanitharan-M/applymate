/**
 * Add Job Modal Component
 *
 * Modal for adding jobs with two options:
 * 1. Add by URL (parse job posting)
 * 2. Manual form entry
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedJob {
  jobTitle: string;
  company: string;
  location?: string;
  jobDescription?: string;
  responsibilities?: string[];
  requirements?: string[];
}

interface Resume {
  id: string;
  name: string | null;
}

export default function AddJobModal({ isOpen, onClose, onSuccess }: AddJobModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"url" | "manual">("url");
  const [loading, setLoading] = useState(false);
  const [parsingUrl, setParsingUrl] = useState(false);
  const [resumes, setResumes] = useState<Resume[]>([]);

  // URL mode state
  const [jobUrl, setJobUrl] = useState("");
  const [parsedJob, setParsedJob] = useState<ParsedJob | null>(null);

  // Manual mode state
  const [formData, setFormData] = useState({
    company: "",
    role: "",
    location: "",
    jobDescription: "",
    jobUrl: "",
    status: "saved" as const,
    resumeId: "",
  });

  useEffect(() => {
    if (isOpen) {
      fetchResumes();
    }
  }, [isOpen]);

  const fetchResumes = async () => {
    try {
      const res = await fetch("/api/resume");
      if (res.ok) {
        const data = await res.json();
        setResumes(data.resumes || []);
        if (data.resumes?.length > 0 && !formData.resumeId) {
          setFormData((prev) => ({
            ...prev,
            resumeId: data.resumes[0].id,
          }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch resumes:", error);
    }
  };

  const handleParseUrl = async () => {
    if (!jobUrl.trim()) {
      alert("Please enter a job URL");
      return;
    }

    setParsingUrl(true);
    try {
      const res = await fetch("/api/jobs/parse-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jobUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        setParsedJob(data.job);
        setFormData({
          company: data.job.company || "",
          role: data.job.jobTitle || "",
          location: data.job.location || "",
          jobDescription: data.job.jobDescription || "",
          jobUrl: jobUrl,
          status: "saved",
          resumeId: resumes[0]?.id || "",
        });
      } else {
        const error = await res.json();
        alert(error.error || "Failed to parse job URL. Please try adding manually.");
      }
    } catch (error) {
      console.error("Failed to parse URL:", error);
      alert("Failed to parse job URL. Please try adding manually.");
    } finally {
      setParsingUrl(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.company || !formData.role || !formData.resumeId) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/jobs/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: formData.company,
          role: formData.role,
          location: formData.location || undefined,
          jobUrl: formData.jobUrl || undefined,
          jobDescription: formData.jobDescription || undefined,
          status: formData.status,
          resumeId: formData.resumeId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onSuccess();
        router.push(`/dashboard/jobs/${data.job.id}`);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to add job");
      }
    } catch (error) {
      console.error("Failed to add job:", error);
      alert("Failed to add job");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-black/10">
          <h2 className="text-2xl font-bold">Add Job</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/5 rounded-lg transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-black/10">
          <button
            onClick={() => setMode("url")}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              mode === "url"
                ? "border-b-2 border-black text-black"
                : "text-black/60 hover:text-black"
            }`}
          >
            Add by URL
          </button>
          <button
            onClick={() => setMode("manual")}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              mode === "manual"
                ? "border-b-2 border-black text-black"
                : "text-black/60 hover:text-black"
            }`}
          >
            Add Manually
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {mode === "url" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Job Posting URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-4 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                  <button
                    onClick={handleParseUrl}
                    disabled={parsingUrl || !jobUrl.trim()}
                    className="px-6 py-2 bg-black text-white rounded-lg hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {parsingUrl ? "Parsing..." : "Parse"}
                  </button>
                </div>
              </div>

              {parsedJob && (
                <div className="border border-black/10 rounded-lg p-4 bg-black/5">
                  <h3 className="font-semibold mb-3">Parsed Job Information</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Title:</span> {parsedJob.jobTitle}
                    </p>
                    <p>
                      <span className="font-medium">Company:</span> {parsedJob.company}
                    </p>
                    {parsedJob.location && (
                      <p>
                        <span className="font-medium">Location:</span> {parsedJob.location}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-black/60 mt-3">
                    Review and edit the information below, then select a resume and save.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Company <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Job Description
                  </label>
                  <textarea
                    value={formData.jobDescription}
                    onChange={(e) =>
                      setFormData({ ...formData, jobDescription: e.target.value })
                    }
                    rows={6}
                    className="w-full px-4 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Resume to Use <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.resumeId}
                    onChange={(e) =>
                      setFormData({ ...formData, resumeId: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
                  >
                    <option value="">Select a resume</option>
                    {resumes.map((resume) => (
                      <option key={resume.id} value={resume.id}>
                        {resume.name || "Untitled Resume"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Company <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Job URL</label>
                <input
                  type="url"
                  value={formData.jobUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, jobUrl: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full px-4 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Job Description
                </label>
                <textarea
                  value={formData.jobDescription}
                  onChange={(e) =>
                    setFormData({ ...formData, jobDescription: e.target.value })
                  }
                  rows={6}
                  className="w-full px-4 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as typeof formData.status,
                    })
                  }
                  className="w-full px-4 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
                >
                  <option value="saved">Saved</option>
                  <option value="applied">Applied</option>
                  <option value="interviewing">Interviewing</option>
                  <option value="offer">Offer</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Resume to Use <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.resumeId}
                  onChange={(e) =>
                    setFormData({ ...formData, resumeId: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-black/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/20"
                >
                  <option value="">Select a resume</option>
                  {resumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.name || "Untitled Resume"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-black/10">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-black/20 rounded-lg hover:bg-black/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.company || !formData.role || !formData.resumeId}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Saving..." : "Save Job"}
          </button>
        </div>
      </div>
    </div>
  );
}





