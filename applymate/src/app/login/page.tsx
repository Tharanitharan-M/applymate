/**
 * Login Page
 * 
 * A beautiful, animated login page with form validation.
 * Uses GSAP for smooth animations and Zod for validation.
 * 
 * THOUGHT PROCESS:
 * - Minimalist design matching the existing aesthetic
 * - GSAP animations for engaging user experience
 * - Real-time validation feedback with Zod
 * - Accessible form with proper labels and error messages
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";
import { loginSchema, type LoginInput } from "@/lib/auth/schemas";
import { useAuth } from "@/lib/auth/context";

export default function LoginPage() {
  // ===========================================================================
  // REFS FOR GSAP ANIMATIONS
  // 
  // We use refs to target specific elements for animation.
  // This is more performant than querying the DOM each time.
  // ===========================================================================
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const decorativeRef = useRef<HTMLDivElement>(null);

  // ===========================================================================
  // STATE
  // 
  // - formData: Controlled form inputs
  // - errors: Validation errors per field
  // - isSubmitting: Prevents double submission
  // - serverError: API error messages
  // ===========================================================================
  const [formData, setFormData] = useState<LoginInput>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  // ===========================================================================
  // HOOKS
  // ===========================================================================
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();

  // ===========================================================================
  // REDIRECT IF ALREADY AUTHENTICATED
  // 
  // If user is already logged in, send them to the dashboard.
  // We wait for loading to finish to prevent flash.
  // ===========================================================================
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  // ===========================================================================
  // GSAP ANIMATIONS
  // 
  // These animations run once when the component mounts.
  // We use a context to properly clean up animations on unmount.
  // ===========================================================================
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Create a timeline for sequenced animations
      // Timelines make it easy to coordinate multiple animations
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Fade in the entire container first
      tl.from(containerRef.current, {
        opacity: 0,
        duration: 0.3,
      });

      // Animate the decorative background shapes
      // They slide in from different directions
      tl.from(
        ".decorative-shape",
        {
          scale: 0,
          rotation: -180,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1, // Each shape starts 0.1s after the previous
          ease: "back.out(1.7)", // Slight overshoot for playfulness
        },
        "-=0.2" // Start slightly before previous animation ends
      );

      // Animate the title with a reveal effect
      tl.from(
        titleRef.current,
        {
          y: 40,
          opacity: 0,
          duration: 0.6,
        },
        "-=0.4"
      );

      // Animate form fields staggered
      // Each input appears one after another
      tl.from(
        ".form-field",
        {
          y: 30,
          opacity: 0,
          duration: 0.5,
          stagger: 0.1,
        },
        "-=0.3"
      );

      // Animate the submit button last
      tl.from(
        ".submit-btn",
        {
          y: 20,
          opacity: 0,
          duration: 0.4,
        },
        "-=0.2"
      );

      // Continuous floating animation for decorative elements
      gsap.to(".decorative-shape", {
        y: -10,
        duration: 2,
        repeat: -1, // Infinite loop
        yoyo: true, // Reverse the animation each iteration
        ease: "power1.inOut",
        stagger: 0.3,
      });
    }, containerRef);

    // Cleanup function to kill animations on unmount
    // Prevents memory leaks and weird behavior
    return () => ctx.revert();
  }, []);

  // ===========================================================================
  // FORM HANDLERS
  // ===========================================================================

  /**
   * Handle input changes
   * 
   * Updates form state and clears errors for the field being edited.
   * This provides immediate feedback that the user is correcting an error.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name as keyof LoginInput]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }

    // Clear server error when user makes changes
    if (serverError) {
      setServerError("");
    }
  };

  /**
   * Validate form with Zod
   * 
   * Uses safeParse to get validation result without throwing.
   * Returns true if valid, false otherwise (and sets error state).
   */
  const validateForm = (): boolean => {
    const result = loginSchema.safeParse(formData);

    if (!result.success) {
      // Extract first error for each field using Zod 4 API
      const fieldErrors: Partial<Record<keyof LoginInput, string>> = {};
      const issues = result.error.issues;

      issues.forEach((issue) => {
        const field = issue.path[0] as keyof LoginInput;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      });

      setErrors(fieldErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  /**
   * Handle form submission
   * 
   * 1. Validate with Zod
   * 2. Call login API
   * 3. Handle success/error
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submitting
    if (!validateForm()) {
      // Shake animation for invalid form
      gsap.to(formRef.current, {
        keyframes: [
          { x: -10 },
          { x: 10 },
          { x: -10 },
          { x: 10 },
          { x: 0 },
        ],
        duration: 0.4,
        ease: "power2.inOut",
      });
      return;
    }

    setIsSubmitting(true);
    setServerError("");

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        // Success animation before redirect
        gsap.to(formRef.current, {
          scale: 0.95,
          opacity: 0,
          duration: 0.3,
          onComplete: () => {
            router.push("/dashboard");
          },
        });
      } else {
        setServerError(result.error || "Login failed");

        // Error shake animation
        gsap.to(formRef.current, {
          keyframes: [
            { x: -10 },
            { x: 10 },
            { x: -10 },
            { x: 10 },
            { x: 0 },
          ],
          duration: 0.4,
          ease: "power2.inOut",
        });
      }
    } catch (error) {
      setServerError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===========================================================================
  // LOADING STATE
  // 
  // Show nothing while checking auth status to prevent flash
  // ===========================================================================
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ===========================================================================
  // RENDER
  // ===========================================================================
  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-white text-black flex items-center justify-center px-4 py-12 relative overflow-hidden"
    >
      {/* =====================================================================
          DECORATIVE BACKGROUND ELEMENTS
          
          These shapes add visual interest and personality.
          They're positioned absolutely and animated with GSAP.
      ===================================================================== */}
      <div ref={decorativeRef} className="absolute inset-0 -z-10">
        {/* Large circle - top right */}
        <div className="decorative-shape absolute -top-20 -right-20 w-80 h-80 border-2 border-black/10 rounded-full" />

        {/* Small square - bottom left */}
        <div className="decorative-shape absolute bottom-20 left-10 w-16 h-16 bg-black/5 rotate-12" />

        {/* Medium square outline - top left */}
        <div className="decorative-shape absolute top-32 left-20 w-24 h-24 border-2 border-black/10 -rotate-12" />

        {/* Small circle - bottom right */}
        <div className="decorative-shape absolute bottom-40 right-20 w-12 h-12 bg-black rounded-full" />

        {/* Large rotated square - center left */}
        <div className="decorative-shape absolute top-1/2 -left-12 w-32 h-32 border-2 border-black/10 rotate-45" />
      </div>

      {/* =====================================================================
          MAIN CONTENT
      ===================================================================== */}
      <div className="w-full max-w-md">
        {/* Back to home link */}
        <Link
          href="/"
          className="form-field inline-flex items-center gap-2 text-sm text-black/60 hover:text-black transition-colors mb-8"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to home
        </Link>

        {/* Title */}
        <h1
          ref={titleRef}
          className="text-4xl sm:text-5xl font-bold tracking-tight mb-2"
        >
          Welcome back
        </h1>
        <p className="form-field text-black/60 mb-8">
          Sign in to continue to your dashboard
        </p>

        {/* Server Error Message */}
        {serverError && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-700 text-sm">
            {serverError}
          </div>
        )}

        {/* Login Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div className="form-field">
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-2"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              className={`w-full px-4 py-3 border-2 transition-colors outline-none ${
                errors.email
                  ? "border-red-500 focus:border-red-500"
                  : "border-black/20 focus:border-black"
              }`}
            />
            {errors.email && (
              <p className="mt-2 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="form-field">
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="current-password"
              className={`w-full px-4 py-3 border-2 transition-colors outline-none ${
                errors.password
                  ? "border-red-500 focus:border-red-500"
                  : "border-black/20 focus:border-black"
              }`}
            />
            {errors.password && (
              <p className="mt-2 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="form-field text-right">
            <Link
              href="/forgot-password"
              className="text-sm text-black/60 hover:text-black transition-colors"
            >
              Forgot your password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="submit-btn w-full py-4 bg-black text-white font-medium text-lg hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        {/* Sign Up Link */}
        <p className="form-field mt-8 text-center text-black/60">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-black font-medium hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

