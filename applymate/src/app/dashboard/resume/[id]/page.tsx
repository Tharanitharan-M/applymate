/**
 * Resume Detail Page
 *
 * Modern, polished design showing detailed ATS analysis for a specific resume
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface Resume {
  id: string;
  name: string | null;
  fileUrl: string;
  atsScore: number | null;
  atsGrade: string | null;
  improvementActions: string[];
  createdAt: string;
  updatedAt: string;
}

export default function ResumeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const resumeId = params.id as string;

  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (resumeId) {
      fetchResume();
    }
  }, [resumeId]);

  const fetchResume = async () => {
    try {
      const res = await fetch(`/api/resume/${resumeId}`);
      if (res.ok) {
        const data = await res.json();
        setResume(data.resume);
      } else {
        alert("Resume not found");
        router.push("/dashboard/resume");
      }
    } catch (error) {
      console.error("Failed to fetch resume:", error);
      alert("Failed to load resume");
      router.push("/dashboard/resume");
    } finally {
      setLoading(false);
    }
  };

  const handleReanalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch(`/api/resume/${resumeId}/analyze`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        setResume(data.resume);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to analyze resume");
      }
    } catch (error) {
      console.error("Analysis error:", error);
      alert("Failed to analyze resume");
    } finally {
      setAnalyzing(false);
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

  const getScoreBarColor = (score: number | null) => {
    if (score === null) return "bg-gray-200";
    if (score >= 90) return "bg-green-500";
    if (score >= 80) return "bg-blue-500";
    if (score >= 70) return "bg-yellow-500";
    if (score >= 60) return "bg-orange-500";
    return "bg-red-500";
  };

  const getScoreMessage = (score: number | null) => {
    if (score === null) return { title: "Analyzing...", description: "Please wait while we analyze your resume." };
    if (score >= 90) return { title: "Excellent!", description: "Your resume is highly optimized for ATS systems and should pass most filters with ease." };
    if (score >= 80) return { title: "Good!", description: "Your resume is well-optimized, but there's room for improvement to maximize your chances." };
    if (score >= 70) return { title: "Fair", description: "Your resume needs some optimization to better pass ATS filters and stand out to recruiters." };
    if (score >= 60) return { title: "Needs Improvement", description: "Consider implementing the suggestions below to significantly improve your ATS compatibility." };
    return { title: "Requires Attention", description: "Your resume needs significant optimization to pass ATS filters. Follow the detailed suggestions below." };
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-6xl">
          <div className="text-center py-12">
            <div className="w-12 h-12 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-black/60">Loading resume...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!resume) {
    return null;
  }

  const scoreMessage = getScoreMessage(resume.atsScore);

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        {/* Back Button */}
        <button
          onClick={() => router.push("/dashboard/resume")}
          className="mb-6 flex items-center gap-2 text-black/60 hover:text-black transition-colors"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Resumes
        </button>

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {resume.name || "Resume"}
            </h1>
            <p className="text-black/60">
              Uploaded on {new Date(resume.createdAt).toLocaleDateString()}
              {resume.updatedAt !== resume.createdAt && (
                <> • Updated {new Date(resume.updatedAt).toLocaleDateString()}</>
              )}
            </p>
          </div>
          <a
            href={resume.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-medium hover:bg-black/80 transition-colors rounded-lg"
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
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            View PDF
          </a>
        </div>

        {/* ATS Score Card */}
        <div className="bg-white border border-black/10 rounded-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">ATS Score</h2>
            <button
              onClick={handleReanalyze}
              disabled={analyzing}
              className="px-4 py-2 border border-black/20 hover:border-black/40 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </span>
              ) : (
                "Re-analyze"
              )}
            </button>
          </div>

          {resume.atsScore !== null ? (
            <>
              <div className="mb-6">
                <div className="flex items-end gap-4 mb-4">
                  <div>
                    <span
                      className={`text-6xl font-bold ${getScoreColor(
                        resume.atsScore
                      )}`}
                    >
                      {resume.atsScore}
                    </span>
                    <span className="text-2xl text-black/40 ml-2">/ 100</span>
                  </div>
                  {resume.atsGrade && (
                    <div
                      className={`px-6 py-3 rounded-lg font-bold text-xl ${getGradeColor(
                        resume.atsGrade
                      )}`}
                    >
                      Grade: {resume.atsGrade}
                    </div>
                  )}
                </div>

                {/* Score Bar */}
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${getScoreBarColor(
                      resume.atsScore
                    )}`}
                    style={{ width: `${resume.atsScore}%` }}
                  />
                </div>
              </div>

              {/* Score Interpretation */}
              <div className="bg-black/5 rounded-lg p-4">
                <p className="text-sm text-black/70">
                  {scoreMessage.description}
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-2 border-black/20 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-black/60">Analyzing resume...</p>
              <p className="text-sm text-black/40 mt-2">
                This may take a few moments. The page will update automatically.
              </p>
            </div>
          )}
        </div>

        {/* Improvement Actions */}
        {resume.improvementActions && resume.improvementActions.length > 0 && (
          <div className="bg-white border border-black/10 rounded-lg p-8">
            <h2 className="text-2xl font-semibold mb-6">
              Actions to Improve Your ATS Score
            </h2>
            <div className="space-y-4">
              {resume.improvementActions.map((action, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 bg-black/5 rounded-lg hover:bg-black/10 transition-colors"
                >
                  <div className="flex-shrink-0 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-sm font-semibold mt-0.5">
                    {index + 1}
                  </div>
                  <p className="flex-1 text-black/80 leading-relaxed">
                    {action}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-black/10">
              <div className="flex items-start gap-3 p-4 bg-black/5 rounded-lg">
                <svg className="w-5 h-5 text-black/60 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-black/90 mb-1">Pro Tip</p>
                  <p className="text-sm text-black/70">
                    Implement these suggestions one at a time, then re-analyze your resume to track your progress. 
                    Focus on high-impact changes first.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
