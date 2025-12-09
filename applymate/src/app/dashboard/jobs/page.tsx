/**
 * Jobs Page
 *
 * Page for managing job applications with filters, search, and job cards.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Search, 
  Briefcase, 
  Calendar, 
  FileText as FileTextIcon, 
  Trash2, 
  ChevronRight 
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import AddJobModal from "@/components/dashboard/AddJobModal";
import DeleteConfirmationModal from "@/components/dashboard/DeleteConfirmationModal";

interface Job {
  id: string;
  company: string;
  role: string;
  location: string | null;
  jobUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  resumeUsed: string | null;
  resumeId: string | null;
  matchScore: number | null;
}

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<{ id: string; role: string; company: string } | null>(null);

  useEffect(() => {
    fetchJobs();
  }, [statusFilter, sortBy, searchQuery]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (sortBy) params.append("sort", sortBy);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "saved":
        return "bg-gray-100 text-gray-700";
      case "applied":
        return "bg-blue-100 text-blue-700";
      case "interviewing":
        return "bg-purple-100 text-purple-700";
      case "offer":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
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

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-gray-400";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const handleDeleteClick = (job: Job, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation to job detail
    setJobToDelete({ id: job.id, role: job.role, company: job.company });
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!jobToDelete) return;

    setDeletingJobId(jobToDelete.id);
    try {
      const res = await fetch(`/api/jobs/${jobToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchJobs(); // Refresh the list
        setDeleteModalOpen(false);
        setJobToDelete(null);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete job");
      }
    } catch (error) {
      console.error("Failed to delete job:", error);
      alert("Failed to delete job");
    } finally {
      setDeletingJobId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Jobs</h1>
            <p className="text-black/60">
              Track and manage all your job applications in one place.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-3 bg-black text-white font-medium hover:bg-black/80 transition-all hover:shadow-lg rounded-lg flex items-center gap-2"
          >
            <Plus size={20} strokeWidth={2} />
            Add Job
          </button>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-black/40" strokeWidth={2} />
              <input
                type="text"
                placeholder="Search by company or title..."
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
            <option value="saved">Saved</option>
            <option value="applied">Applied</option>
            <option value="interviewing">Interviewing</option>
            <option value="offer">Offer</option>
            <option value="rejected">Rejected</option>
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
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-black/60">Loading jobs...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && jobs.length === 0 && (
          <div className="border-2 border-dashed border-black/20 rounded-lg p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-black/5 rounded-full flex items-center justify-center">
              <Briefcase className="w-8 h-8 text-black/40" strokeWidth={1.5} />
            </div>
            <h2 className="text-xl font-semibold mb-2">No jobs yet</h2>
            <p className="text-black/60 mb-6 max-w-md mx-auto">
              {searchQuery || statusFilter !== "all"
                ? "No jobs match your filters. Try adjusting your search or filters."
                : "Start tracking your job applications. Add your first job to get started."}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-6 py-3 bg-black text-white font-medium hover:bg-black/80 transition-all hover:shadow-lg rounded-lg"
              >
                Add Your First Job
              </button>
            )}
          </div>
        )}

        {/* Jobs List */}
        {!loading && jobs.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                onClick={() => router.push(`/dashboard/jobs/${job.id}`)}
                className="bg-white border border-black/10 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer relative group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold mb-1 truncate">
                          {job.role}
                        </h3>
                        <p className="text-base text-black/70 mb-1">{job.company}</p>
                        {job.location && (
                          <p className="text-sm text-black/50 mb-2">
                            {job.location}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(
                          job.status
                        )}`}
                      >
                        {getStatusLabel(job.status)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap text-sm text-black/60">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" strokeWidth={2} />
                        {new Date(job.createdAt).toLocaleDateString()}
                      </div>
                      {job.resumeUsed && (
                        <div className="flex items-center gap-1">
                          <FileTextIcon className="w-4 h-4" strokeWidth={2} />
                          {job.resumeUsed}
                        </div>
                      )}
                      {job.matchScore !== null && (
                        <div className="flex items-center gap-1">
                          <span className={`font-semibold ${getScoreColor(job.matchScore)}`}>
                            Match: {job.matchScore}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => handleDeleteClick(job, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-lg text-red-600 hover:text-red-700"
                      title="Delete job"
                    >
                      <Trash2 className="w-5 h-5" strokeWidth={2} />
                    </button>
                    <ChevronRight className="w-5 h-5 text-black/40" strokeWidth={2} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Job Modal */}
        <AddJobModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            setIsAddModalOpen(false);
            fetchJobs();
          }}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setJobToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Delete Job Listing"
          message="Are you sure you want to delete this job listing?"
          itemName={jobToDelete ? `${jobToDelete.role} at ${jobToDelete.company}` : undefined}
          isLoading={deletingJobId !== null}
        />
      </div>
    </DashboardLayout>
  );
}
