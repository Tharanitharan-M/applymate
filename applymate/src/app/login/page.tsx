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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Eye, EyeOff, Loader2, Zap } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);

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
      className="min-h-screen bg-gradient-to-br from-gray-50 to-white text-black flex items-center justify-center px-4 py-12 relative overflow-hidden"
    >
      {/* =====================================================================
          DECORATIVE BACKGROUND ELEMENTS
      ===================================================================== */}
      <div ref={decorativeRef} className="absolute inset-0 -z-10">
        <div className="decorative-shape absolute -top-20 -right-20 w-80 h-80 border-2 border-black/10 rounded-full" />
        <div className="decorative-shape absolute bottom-20 left-10 w-16 h-16 bg-black/5 rotate-12" />
        <div className="decorative-shape absolute top-32 left-20 w-24 h-24 border-2 border-black/10 -rotate-12" />
        <div className="decorative-shape absolute bottom-40 right-20 w-12 h-12 bg-black rounded-full" />
        <div className="decorative-shape absolute top-1/2 -left-12 w-32 h-32 border-2 border-black/10 rotate-45" />
      </div>

      {/* =====================================================================
          MAIN CONTENT
      ===================================================================== */}
      <div className="w-full max-w-md">
        {/* Back to home link */}
        <Link
          href="/"
          className="form-field inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <Card className="border-2">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-6 h-6" />
              <CardTitle ref={titleRef} className="text-3xl font-bold">Welcome back</CardTitle>
            </div>
            <CardDescription className="form-field text-base">
              Sign in to continue to your dashboard
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* Server Error Message */}
            {serverError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {serverError}
              </div>
            )}

            {/* Login Form */}
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="form-field space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="form-field space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={errors.password ? "border-red-500 focus-visible:ring-red-500 pr-10" : "pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition-colors focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Forgot Password Link */}
              <div className="form-field text-right">
                <Link
                  href="/forgot-password"
                  className="text-sm text-gray-600 hover:text-black transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="submit-btn w-full h-11"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            {/* Sign Up Link */}
            <p className="form-field mt-6 text-center text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-black font-medium hover:underline"
              >
                Create one
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

