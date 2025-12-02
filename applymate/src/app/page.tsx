"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero animations
      gsap.from(titleRef.current, {
        opacity: 0,
        y: 50,
        duration: 1.2,
        ease: "power4.out",
      });

      gsap.from(subtitleRef.current, {
        opacity: 0,
        y: 30,
        duration: 1,
        delay: 0.3,
        ease: "power3.out",
      });

      gsap.from(ctaRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.8,
        delay: 0.6,
        ease: "power2.out",
      });

      // Animated background grid
      const gridItems = document.querySelectorAll(".grid-item");
      gsap.from(gridItems, {
        opacity: 0,
        scale: 0.8,
        duration: 0.6,
        stagger: 0.05,
        ease: "back.out(1.7)",
        delay: 0.8,
      });

      // Feature cards modern stagger animation
      const featureCards = document.querySelectorAll(".feature-card");
      featureCards.forEach((card, index) => {
        gsap.fromTo(
          card,
          {
            opacity: 0,
            y: 60,
            scale: 0.95,
          },
          {
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              end: "top 60%",
              toggleActions: "play none none reverse",
            },
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: "power3.out",
            delay: index * 0.15,
          }
        );

        // Hover effect with GSAP
        card.addEventListener("mouseenter", () => {
          gsap.to(card, {
            y: -10,
            duration: 0.3,
            ease: "power2.out",
          });
        });

        card.addEventListener("mouseleave", () => {
          gsap.to(card, {
            y: 0,
            duration: 0.3,
            ease: "power2.out",
          });
        });
      });

      // Stats counter animation
      const stats = document.querySelectorAll(".stat-number");
      stats.forEach((stat) => {
        gsap.from(stat, {
          scrollTrigger: {
            trigger: stat,
            start: "top 85%",
          },
          textContent: 0,
          duration: 2,
          ease: "power1.inOut",
          snap: { textContent: 1 },
        });
      });

      // Floating animation for decorative elements
      gsap.to(".float-element", {
        y: -20,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
        stagger: 0.3,
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <main ref={heroRef} className="min-h-screen bg-white text-black overflow-x-hidden">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 -z-10 opacity-[0.03]">
        <div className="grid grid-cols-12 gap-px h-full">
          {Array.from({ length: 144 }).map((_, i) => (
            <div key={i} className="grid-item border border-black" />
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="text-xl sm:text-2xl font-bold tracking-tight">ApplyMate</div>
          <div className="flex gap-3 sm:gap-6 items-center text-sm sm:text-base">
            <a href="#features" className="hidden sm:block hover:opacity-60 transition-opacity">
              Features
            </a>
            <a href="/login" className="hover:opacity-60 transition-opacity">
              Sign In
            </a>
            <a
              href="/signup"
              className="px-4 sm:px-6 py-2 bg-black text-white hover:bg-black/80 transition-colors border border-black text-sm sm:text-base"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 pt-20 relative">
        {/* Floating decorative elements - hidden on mobile */}
        <div className="absolute top-1/4 left-10 w-20 h-20 border-2 border-black float-element hidden md:block" />
        <div className="absolute top-1/3 right-20 w-16 h-16 bg-black float-element hidden md:block" />
        <div className="absolute bottom-1/4 left-1/4 w-12 h-12 border-2 border-black rotate-45 float-element hidden lg:block" />

        <div className="max-w-5xl text-center relative z-10">
          <h1
            ref={titleRef}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-9xl font-bold tracking-tighter leading-none mb-6 sm:mb-8 px-4"
          >
            Your Career,
            <br />
            <span className="italic font-light">Simplified</span>
          </h1>

          <p
            ref={subtitleRef}
            className="text-lg sm:text-xl md:text-2xl text-black/60 max-w-2xl mx-auto mb-10 sm:mb-12 leading-relaxed px-4"
          >
            Track applications. Optimize resumes with AI. Land your dream job.
            All in one intelligent platform.
          </p>

          <div ref={ctaRef} className="flex gap-3 sm:gap-4 justify-center flex-wrap px-4">
            <a
              href="/signup"
              className="group px-6 sm:px-8 py-3 sm:py-4 bg-black text-white text-base sm:text-lg font-medium hover:bg-white hover:text-black transition-all border-2 border-black relative overflow-hidden"
            >
              Start Free Trial
            </a>
            <a
              href="#demo"
              className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-black text-base sm:text-lg font-medium hover:bg-black hover:text-white transition-all border-2 border-black"
            >
              Watch Demo
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mt-24 max-w-3xl mx-auto">
            <div>
              <div className="text-4xl md:text-5xl font-bold">
                <span className="stat-number">98</span>%
              </div>
              <div className="text-sm text-black/60 mt-2">Success Rate</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold">
                <span className="stat-number">10</span>K+
              </div>
              <div className="text-sm text-black/60 mt-2">Users</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold">
                <span className="stat-number">500</span>K+
              </div>
              <div className="text-sm text-black/60 mt-2">Applications</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" ref={featuresRef} className="py-20 sm:py-32 px-4 sm:px-6 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-12 sm:mb-20 text-center">
            Everything You Need
          </h2>

          <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
            <div className="feature-card border-2 border-white p-8 sm:p-12 hover:bg-white hover:text-black transition-all duration-300 group cursor-pointer">
              <div className="text-5xl sm:text-6xl font-bold mb-4 sm:mb-6 opacity-50 group-hover:opacity-100 transition-opacity">
                01
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Smart Tracking</h3>
              <p className="text-base sm:text-lg opacity-80 leading-relaxed">
                Never lose track of where you applied. Organize applications by status,
                dates, and priority with our intuitive dashboard.
              </p>
            </div>

            <div className="feature-card border-2 border-white p-8 sm:p-12 hover:bg-white hover:text-black transition-all duration-300 group cursor-pointer">
              <div className="text-5xl sm:text-6xl font-bold mb-4 sm:mb-6 opacity-50 group-hover:opacity-100 transition-opacity">
                02
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">AI Resume Analysis</h3>
              <p className="text-base sm:text-lg opacity-80 leading-relaxed">
                Get instant ATS compatibility scores, keyword optimization, and
                personalized suggestions powered by advanced AI.
              </p>
            </div>

            <div className="feature-card border-2 border-white p-8 sm:p-12 hover:bg-white hover:text-black transition-all duration-300 group cursor-pointer">
              <div className="text-5xl sm:text-6xl font-bold mb-4 sm:mb-6 opacity-50 group-hover:opacity-100 transition-opacity">
                03
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Multiple Resumes</h3>
              <p className="text-base sm:text-lg opacity-80 leading-relaxed">
                Store unlimited resume versions. Tailor each one for specific roles
                and track which resume you used for each application.
              </p>
            </div>

            <div className="feature-card border-2 border-white p-8 sm:p-12 hover:bg-white hover:text-black transition-all duration-300 group cursor-pointer">
              <div className="text-5xl sm:text-6xl font-bold mb-4 sm:mb-6 opacity-50 group-hover:opacity-100 transition-opacity">
                04
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Stay Organized</h3>
              <p className="text-base sm:text-lg opacity-80 leading-relaxed">
                Set reminders, add notes, track interview dates, and maintain a
                complete timeline of your job search journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 sm:mb-8 leading-tight">
            Ready to Transform
            <br />
            Your Job Search?
          </h2>
          <p className="text-lg sm:text-xl text-black/60 mb-10 sm:mb-12 px-4">
            Join thousands of professionals who landed their dream jobs with ApplyMate.
          </p>
          <a
            href="/signup"
            className="inline-block px-8 sm:px-12 py-4 sm:py-5 bg-black text-white text-lg sm:text-xl font-medium hover:scale-105 transition-transform border-2 border-black"
          >
            Get Started for Free
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-black py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
          <div className="text-xl sm:text-2xl font-bold">ApplyMate</div>
          <div className="flex gap-4 sm:gap-8 text-sm sm:text-base flex-wrap justify-center">
            <a href="/about" className="hover:opacity-60 transition-opacity">
              About
            </a>
            <a href="/privacy" className="hover:opacity-60 transition-opacity">
              Privacy
            </a>
            <a href="/terms" className="hover:opacity-60 transition-opacity">
              Terms
            </a>
            <a href="/contact" className="hover:opacity-60 transition-opacity">
              Contact
            </a>
          </div>
          <div className="text-black/60 text-sm sm:text-base text-center">
            © 2024 ApplyMate. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}