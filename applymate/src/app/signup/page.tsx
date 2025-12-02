/**
 * Signup Page
 * 
 * A beautiful, animated signup page with comprehensive form validation.
 * Includes email verification step after successful registration.
 * 
 * THOUGHT PROCESS:
 * - Two-step process: signup form → verification code
 * - Password strength indicator for better UX
 * - GSAP animations for engaging experience
 * - All Cognito password requirements enforced
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";
import { signupSchema, verifyEmailSchema } from "@/lib/auth/schemas";
import { useAuth } from "@/lib/auth/context";

/**
 * Form state type for signup
 */
interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function SignupPage() {
  // ===========================================================================
  // REFS FOR GSAP ANIMATIONS
  // ===========================================================================
  const containerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const verifyFormRef = useRef<HTMLFormElement>(null);

  // ===========================================================================
  // STATE
  // ===========================================================================

  // Current step: "signup" or "verify"
  const [step, setStep] = useState<"signup" | "verify">("signup");

  // Signup form data
  const [formData, setFormData] = useState<SignupFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Verification code (6 digits)
  const [verificationCode, setVerificationCode] = useState("");

  // Errors for current form
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ===========================================================================
  // HOOKS
  // ===========================================================================
  const router = useRouter();
  const { signup, verifyEmail, resendCode, isAuthenticated, isLoading } = useAuth();

  // ===========================================================================
  // REDIRECT IF ALREADY AUTHENTICATED
  // ===========================================================================
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  // ===========================================================================
  // GSAP ANIMATIONS
  // ===========================================================================
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Container fade in
      tl.from(containerRef.current, {
        opacity: 0,
        duration: 0.3,
      });

      // Decorative shapes
      tl.from(
        ".decorative-shape",
        {
          scale: 0,
          rotation: 180,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "back.out(1.7)",
        },
        "-=0.2"
      );

      // Title
      tl.from(
        titleRef.current,
        {
          y: 40,
          opacity: 0,
          duration: 0.6,
        },
        "-=0.4"
      );

      // Form fields
      tl.from(
        ".form-field",
        {
          y: 30,
          opacity: 0,
          duration: 0.5,
          stagger: 0.08,
        },
        "-=0.3"
      );

      // Submit button
      tl.from(
        ".submit-btn",
        {
          y: 20,
          opacity: 0,
          duration: 0.4,
        },
        "-=0.2"
      );

      // Floating animation
      gsap.to(".decorative-shape", {
        y: -15,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
        stagger: 0.2,
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // ===========================================================================
  // STEP TRANSITION ANIMATION
  // ===========================================================================
  useEffect(() => {
    if (step === "verify") {
      // Animate transition to verification step
      gsap.fromTo(
        verifyFormRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
      );
    }
  }, [step]);

  // ===========================================================================
  // PASSWORD STRENGTH CALCULATION
  // 
  // Calculates strength based on Cognito requirements.
  // Returns a score from 0-5 and a color for the indicator.
  // 
  // Score mapping:
  // 0 = Very Weak (no requirements met)
  // 1 = Weak (1 requirement)
  // 2 = Fair (2 requirements)
  // 3 = Good (3 requirements)
  // 4 = Strong (4 requirements)
  // 5 = Very Strong (all 5 requirements met)
  // ===========================================================================
  const calculatePasswordStrength = (password: string) => {
    let score = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };

    // Count how many checks pass
    if (checks.length) score++;
    if (checks.uppercase) score++;
    if (checks.lowercase) score++;
    if (checks.number) score++;
    if (checks.special) score++;

    // 6 colors for scores 0-5
    const colors = [
      "bg-red-500",     // 0: Very Weak
      "bg-orange-500",  // 1: Weak
      "bg-yellow-500",  // 2: Fair
      "bg-lime-500",    // 3: Good
      "bg-green-500",   // 4: Strong
      "bg-emerald-500", // 5: Very Strong
    ];

    // 6 labels for scores 0-5
    const labels = [
      "Very Weak",   // 0
      "Weak",        // 1
      "Fair",        // 2
      "Good",        // 3
      "Strong",      // 4
      "Very Strong", // 5
    ];

    return {
      score,
      maxScore: 5,
      color: colors[score],
      label: labels[score],
      checks,
    };
  };

  const passwordStrength = calculatePasswordStrength(formData.password);

  // ===========================================================================
  // FORM HANDLERS
  // ===========================================================================

  /**
   * Handle input changes for signup form
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors when user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    if (serverError) {
      setServerError("");
    }
  };

  /**
   * Handle verification code input
   * Only allows 6 digits
   */
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setVerificationCode(value);

    if (errors.code) {
      setErrors({});
    }
    if (serverError) {
      setServerError("");
    }
  };

  /**
   * Validate signup form with Zod
   */
  const validateSignupForm = (): boolean => {
    const result = signupSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};

      // Using Zod 4 API - issues instead of errors
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
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
   * Handle signup form submission
   */
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateSignupForm()) {
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
      const result = await signup(
        formData.name,
        formData.email,
        formData.password,
        formData.confirmPassword
      );

      if (result.success) {
        if (result.needsVerification) {
          // Animate out signup form
          await gsap.to(formRef.current, {
            opacity: 0,
            x: -50,
            duration: 0.3,
          });

          // Switch to verification step
          setStep("verify");
          setSuccessMessage("Account created! Check your email for the verification code.");
        } else {
          // No verification needed, redirect to login
          router.push("/login");
        }
      } else {
        setServerError(result.error || "Signup failed");
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

  /**
   * Handle verification code submission
   */
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate code
    const result = verifyEmailSchema.safeParse({
      email: formData.email,
      code: verificationCode,
    });

    if (!result.success) {
      setErrors({ code: result.error.issues[0].message });
      gsap.to(verifyFormRef.current, {
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
      const verifyResult = await verifyEmail(formData.email, verificationCode);

      if (verifyResult.success) {
        // Success animation and redirect
        setSuccessMessage("Email verified! Redirecting to login...");

        gsap.to(verifyFormRef.current, {
          scale: 0.95,
          opacity: 0,
          duration: 0.3,
          onComplete: () => {
            router.push("/login");
          },
        });
      } else {
        setServerError(verifyResult.error || "Verification failed");
        gsap.to(verifyFormRef.current, {
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

  /**
   * Handle resend verification code
   */
  const handleResendCode = async () => {
    setIsSubmitting(true);
    setServerError("");

    try {
      const result = await resendCode(formData.email);

      if (result.success) {
        setSuccessMessage("New verification code sent!");
        // Clear after 5 seconds
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        setServerError(result.error || "Failed to resend code");
      }
    } catch (error) {
      setServerError("Failed to resend code");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===========================================================================
  // LOADING STATE
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
      {/* Decorative Background */}
      <div className="absolute inset-0 -z-10">
        {/* Circle - top left */}
        <div className="decorative-shape absolute -top-32 -left-32 w-96 h-96 border-2 border-black/10 rounded-full" />

        {/* Square - top right */}
        <div className="decorative-shape absolute top-20 right-10 w-20 h-20 bg-black/5 rotate-45" />

        {/* Small circle - bottom left */}
        <div className="decorative-shape absolute bottom-32 left-16 w-8 h-8 bg-black rounded-full" />

        {/* Rectangle outline - right */}
        <div className="decorative-shape absolute top-1/2 -right-16 w-40 h-20 border-2 border-black/10 -rotate-12" />

        {/* Diamond - bottom */}
        <div className="decorative-shape absolute bottom-16 right-1/4 w-16 h-16 border-2 border-black/10 rotate-45" />
      </div>

      {/* Main Content */}
      <div className="w-full max-w-md">
        {/* Back to home */}
        <Link
          href="/"
          className="form-field inline-flex items-center gap-2 text-sm text-black/60 hover:text-black transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to home
        </Link>

        {/* Title */}
        <h1 ref={titleRef} className="text-4xl sm:text-5xl font-bold tracking-tight mb-2">
          {step === "signup" ? "Create account" : "Verify your email"}
        </h1>
        <p className="form-field text-black/60 mb-8">
          {step === "signup"
            ? "Start your job search journey"
            : `We sent a code to ${formData.email}`}
        </p>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 text-green-700 text-sm">
            {successMessage}
          </div>
        )}

        {/* Server Error */}
        {serverError && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-700 text-sm">
            {serverError}
          </div>
        )}

        {/* =====================================================================
            SIGNUP FORM
        ===================================================================== */}
        {step === "signup" && (
          <form ref={formRef} onSubmit={handleSignupSubmit} className="space-y-5">
            {/* Name Field */}
            <div className="form-field">
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                autoComplete="name"
                className={`w-full px-4 py-3 border-2 transition-colors outline-none ${
                  errors.name ? "border-red-500" : "border-black/20 focus:border-black"
                }`}
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="form-field">
              <label htmlFor="email" className="block text-sm font-medium mb-2">
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
                  errors.email ? "border-red-500" : "border-black/20 focus:border-black"
                }`}
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Field with Strength Indicator */}
            <div className="form-field">
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="new-password"
                className={`w-full px-4 py-3 border-2 transition-colors outline-none ${
                  errors.password ? "border-red-500" : "border-black/20 focus:border-black"
                }`}
              />

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-3">
                  {/* Strength Bar */}
                  <div className="flex gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 transition-colors ${
                          i < passwordStrength.score
                            ? passwordStrength.color
                            : "bg-black/10"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Strength Label */}
                  <p className="text-xs text-black/60 mb-2">
                    Password strength: <span className="font-medium">{passwordStrength.label}</span>
                  </p>

                  {/* Requirements Checklist */}
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {[
                      { key: "length", label: "8+ characters" },
                      { key: "uppercase", label: "Uppercase letter" },
                      { key: "lowercase", label: "Lowercase letter" },
                      { key: "number", label: "Number" },
                      { key: "special", label: "Special character" },
                    ].map(({ key, label }) => (
                      <div
                        key={key}
                        className={`flex items-center gap-1 ${
                          passwordStrength.checks[key as keyof typeof passwordStrength.checks]
                            ? "text-green-600"
                            : "text-black/40"
                        }`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {passwordStrength.checks[key as keyof typeof passwordStrength.checks] ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          )}
                        </svg>
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="form-field">
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="new-password"
                className={`w-full px-4 py-3 border-2 transition-colors outline-none ${
                  errors.confirmPassword ? "border-red-500" : "border-black/20 focus:border-black"
                }`}
              />
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
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
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>
        )}

        {/* =====================================================================
            VERIFICATION FORM
        ===================================================================== */}
        {step === "verify" && (
          <form ref={verifyFormRef} onSubmit={handleVerifySubmit} className="space-y-6">
            {/* Verification Code Input */}
            <div>
              <label htmlFor="code" className="block text-sm font-medium mb-2">
                Verification Code
              </label>
              <input
                type="text"
                id="code"
                value={verificationCode}
                onChange={handleCodeChange}
                placeholder="000000"
                className={`w-full px-4 py-4 border-2 text-center text-2xl font-mono tracking-[0.5em] transition-colors outline-none ${
                  errors.code ? "border-red-500" : "border-black/20 focus:border-black"
                }`}
                maxLength={6}
              />
              {errors.code && (
                <p className="mt-2 text-sm text-red-600">{errors.code}</p>
              )}
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={isSubmitting || verificationCode.length !== 6}
              className="w-full py-4 bg-black text-white font-medium text-lg hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </button>

            {/* Resend Code */}
            <p className="text-center text-sm text-black/60">
              Didn&apos;t receive the code?{" "}
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isSubmitting}
                className="text-black font-medium hover:underline disabled:opacity-50"
              >
                Resend
              </button>
            </p>

            {/* Back to Signup */}
            <button
              type="button"
              onClick={() => setStep("signup")}
              className="w-full py-3 border-2 border-black/20 text-black/60 hover:border-black hover:text-black transition-colors"
            >
              Back to signup
            </button>
          </form>
        )}

        {/* Sign In Link */}
        {step === "signup" && (
          <p className="form-field mt-8 text-center text-black/60">
            Already have an account?{" "}
            <Link href="/login" className="text-black font-medium hover:underline">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

