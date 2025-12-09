/**
 * Resume Page
 *
 * Page for managing resumes and getting AI analysis.
 * Allows users to upload, view, and delete resumes.
 */

"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DeleteConfirmationModal from "@/components/dashboard/DeleteConfirmationModal";

interface Resume {
  id: string;
  name: string | null;
  fileUrl: string;
  atsScore: number | null;
  atsGrade: string | null;
  improvementActions: string[];
  createdAt: string;
}

export default function ResumePage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState<{ id: string; name: string | null } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch resumes on mount
  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const res = await fetch("/api/resume");
      if (res.ok) {
        const data = await res.json();
        setResumes(data.resumes || []);
      }
    } catch (error) {
      console.error("Failed to fetch resumes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        await fetchResumes(); // Refresh the list
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        const error = await res.json();
        alert(error.error || "Failed to upload resume");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload resume");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (resume: Resume, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation to resume detail
    setResumeToDelete({ id: resume.id, name: resume.name });
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!resumeToDelete) return;

    setDeletingId(resumeToDelete.id);
    try {
      const res = await fetch(`/api/resume/${resumeToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchResumes(); // Refresh the list
        setDeleteModalOpen(false);
        setResumeToDelete(null);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete resume");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete resume");
    } finally {
      setDeletingId(null);
    }
  };

  const getGradeColor = (grade: string | null) => {
    if (!grade) return "bg-gray-100 text-gray-600";
    switch (grade.toUpperCase()) {
      case "A":
        return "bg-green-100 text-green-700";
      case "B":
        return "bg-blue-100 text-blue-700";
      case "C":
        return "bg-yellow-100 text-yellow-700";
      case "D":
        return "bg-orange-100 text-orange-700";
      case "F":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-gray-500";
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Resume</h1>
            <p className="text-black/60">
              Upload and manage your resumes. Get AI-powered ATS analysis and
              optimization tips.
            </p>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleUpload}
              className="hidden"
              id="resume-upload"
            />
            <label
              htmlFor="resume-upload"
              className={`inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-medium hover:bg-black/80 transition-all hover:shadow-lg rounded-lg cursor-pointer ${
                uploading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={20} strokeWidth={2} />
                  Upload Resume
                </>
              )}
            </label>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-black/60">Loading resumes...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && resumes.length === 0 && (
          <div className="border-2 border-dashed border-black/20 rounded-lg p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-black/5 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-black/40" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-semibold mb-2">No resumes uploaded</h2>
            <p className="text-black/60 mb-6 max-w-md mx-auto">
              Upload your resume to get started. We&apos;ll analyze it and provide
              suggestions for improvement.
            </p>
            <label
              htmlFor="resume-upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-medium hover:bg-black/80 transition-all hover:shadow-lg rounded-lg cursor-pointer"
            >
              <Upload size={20} strokeWidth={2} />
              Upload Resume
            </label>
          </div>
        )}

        {/* Resume List */}
        {!loading && resumes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className="bg-white border border-black/10 rounded-lg p-6 hover:shadow-lg hover:border-black/30 transition-all cursor-pointer group"
                onClick={() => router.push(`/dashboard/resume/${resume.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold mb-1 truncate">
                      {resume.name || "Untitled Resume"}
                    </h3>
                    <p className="text-sm text-black/60">
                      {new Date(resume.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteClick(resume, e)}
                    className="ml-2 p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600 hover:text-red-700 opacity-0 group-hover:opacity-100"
                    title="Delete resume"
                  >
                    <Trash2 className="w-5 h-5" strokeWidth={2} />
                  </button>
                </div>

                {/* ATS Score */}
                {resume.atsScore !== null ? (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-black/60">
                        ATS Score
                      </span>
                      <span
                        className={`text-2xl font-bold ${getScoreColor(
                          resume.atsScore
                        )}`}
                      >
                        {resume.atsScore}
                      </span>
                    </div>
                    {resume.atsGrade && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-black/60">Grade:</span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${getGradeColor(
                            resume.atsGrade
                          )}`}
                        >
                          {resume.atsGrade}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-sm text-black/40">
                      <div className="w-4 h-4 border-2 border-black/20 border-t-transparent rounded-full animate-spin" />
                      Analyzing...
                    </div>
                  </div>
                )}

                {/* View Details Link */}
                <div className="pt-4 border-t border-black/10">
                  <span className="text-sm text-black/60 hover:text-black transition-colors">
                    View details →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setResumeToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Resume"
          message="Are you sure you want to delete this resume?"
          itemName={resumeToDelete?.name || undefined}
          isLoading={deletingId !== null}
        />
      </div>
    </DashboardLayout>
  );
}
