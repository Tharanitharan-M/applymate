"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { 
  ClipboardCheck, 
  Sparkles, 
  FileStack, 
  Users,
  ArrowRight,
  CheckCircle2,
  Zap,
  ChevronDown,
  MessageSquare
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href') || '');
        if (target) {
          const navHeight = 72; // Nav bar height
          const targetPosition = target.offsetTop - navHeight;
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });

    const ctx = gsap.context(() => {
      // Scroll progress bar animation
      gsap.to(progressBarRef.current, {
        width: "100%",
        ease: "none",
        scrollTrigger: {
          trigger: "body",
          start: "top top",
          end: "bottom bottom",
          scrub: 0.3,
        }
      });

      // Hero animations with enhanced easing
      gsap.from(titleRef.current, {
        opacity: 0,
        y: 80,
        duration: 1.4,
        ease: "power4.out",
      });

      gsap.from(subtitleRef.current, {
        opacity: 0,
        y: 40,
        duration: 1.2,
        delay: 0.3,
        ease: "power3.out",
      });

      gsap.from(ctaRef.current, {
        opacity: 0,
        y: 30,
        duration: 1,
        delay: 0.6,
        ease: "power2.out",
      });

      // Animated background grid with parallax
      const gridItems = document.querySelectorAll(".grid-item");
      gsap.from(gridItems, {
        opacity: 0,
        scale: 0.8,
        duration: 0.6,
        stagger: 0.05,
        ease: "back.out(1.7)",
        delay: 0.8,
      });

      // Parallax effect for background grid
      gsap.to(".parallax-bg", {
        y: () => window.innerHeight * 0.3,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        }
      });

      // Parallax floating elements - different speeds
      gsap.to(".parallax-slow", {
        y: -100,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 2,
        }
      });

      gsap.to(".parallax-medium", {
        y: -150,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1.5,
        }
      });

      gsap.to(".parallax-fast", {
        y: -200,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        }
      });

      // Features title animation on scroll
      gsap.from(".features-title", {
        opacity: 0,
        y: -50,
        scale: 0.9,
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top center",
          end: "top top",
          scrub: 1,
        }
      });

      // Horizontal scroll features section (Desktop only)
      const featuresSection = featuresRef.current;
      const featureCards = gsap.utils.toArray(".feature-card");
      
      // Only apply horizontal scroll on desktop
      if (window.innerWidth >= 768 && featuresSection && featureCards.length > 0) {
        // Calculate the total horizontal distance to travel
        const totalScrollDistance = (featureCards.length - 1) * window.innerWidth;
        
        // Pin the section and animate horizontal scroll with smoother scrub
        gsap.to(featureCards, {
          xPercent: -100 * (featureCards.length - 1),
          ease: "none",
          scrollTrigger: {
            trigger: featuresSection,
            pin: true,
            scrub: 1, // Responsive to scroll
            snap: {
              snapTo: 1 / (featureCards.length - 1),
              duration: 0.3,
              ease: "power1.inOut"
            },
            end: () => "+=" + totalScrollDistance, // Much faster - 1 viewport height per card
          }
        });

        // Individual card animations as they come into view
        featureCards.forEach((card: any, index) => {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: card,
              containerAnimation: gsap.getById("horizontal-scroll"),
              start: "left center",
              toggleActions: "play none none reverse",
            }
          });

          // Animate card content
          tl.from(card.querySelector(".feature-number"), {
            scale: 0.5,
            opacity: 0,
            rotation: -180,
            duration: 0.8,
            ease: "back.out(2)",
          })
          .from(card.querySelector(".feature-title"), {
            y: 50,
            opacity: 0,
            duration: 0.6,
            ease: "power3.out",
          }, "-=0.4")
          .from(card.querySelector(".feature-description"), {
            y: 30,
            opacity: 0,
            duration: 0.6,
            ease: "power2.out",
          }, "-=0.3")
          .from(card.querySelector(".feature-icon"), {
            scale: 0,
            rotation: 180,
            opacity: 0,
            duration: 0.7,
            ease: "elastic.out(1, 0.5)",
          }, "-=0.5");

          // Parallax effect for background elements
          gsap.to(card.querySelector(".feature-bg"), {
            x: () => (index % 2 === 0 ? -50 : 50),
            scrollTrigger: {
              trigger: card,
              scrub: 2,
            }
          });

          // Hover effect with GSAP
          card.addEventListener("mouseenter", () => {
            gsap.to(card, {
              scale: 1.02,
              duration: 0.3,
              ease: "power2.out",
            });
            gsap.to(card.querySelector(".feature-icon"), {
              rotation: 360,
              scale: 1.2,
              duration: 0.5,
              ease: "back.out(1.7)",
            });
          });

          card.addEventListener("mouseleave", () => {
            gsap.to(card, {
              scale: 1,
              duration: 0.3,
              ease: "power2.out",
            });
            gsap.to(card.querySelector(".feature-icon"), {
              rotation: 0,
              scale: 1,
              duration: 0.5,
              ease: "back.out(1.7)",
            });
          });
        });
      }

      // Mobile feature cards animation
      const mobileFeatureCards = gsap.utils.toArray(".feature-card-mobile");
      mobileFeatureCards.forEach((card: any) => {
        gsap.from(card, {
          opacity: 0,
          y: 50,
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            end: "top 60%",
            scrub: 1,
          }
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

      // Scroll indicator fade out on scroll
      gsap.to(".scroll-indicator", {
        opacity: 0,
        y: 20,
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        }
      });

      // CTA section animations
      const ctaSection = document.querySelector(".cta-content");
      if (ctaSection) {
        gsap.from(ctaSection.querySelector("h2"), {
          opacity: 0,
          y: 60,
          scrollTrigger: {
            trigger: ctaSection,
            start: "top 80%",
            end: "top 50%",
            scrub: 1,
          }
        });

        gsap.from(ctaSection.querySelector("p"), {
          opacity: 0,
          y: 40,
          scrollTrigger: {
            trigger: ctaSection,
            start: "top 75%",
            end: "top 45%",
            scrub: 1,
          }
        });

        gsap.from(ctaSection.querySelector("a"), {
          opacity: 0,
          y: 30,
          scale: 0.9,
          scrollTrigger: {
            trigger: ctaSection,
            start: "top 70%",
            end: "top 40%",
            scrub: 1,
          }
        });
      }
    }, heroRef);

    return () => {
      ctx.revert();
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);

  return (
    <main ref={heroRef} className="min-h-screen bg-white text-black overflow-x-hidden scroll-smooth">
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-black/5 z-[101]">
        <div 
          ref={progressBarRef}
          className="h-full bg-black origin-left"
          style={{ width: '0%' }}
        />
      </div>

      {/* Animated Background Grid with Parallax */}
      <div className="fixed inset-0 -z-10 opacity-[0.03] parallax-bg">
        <div className="grid grid-cols-12 gap-px h-full">
          {Array.from({ length: 144 }).map((_, i) => (
            <div key={i} className="grid-item border border-black" />
          ))}
        </div>
      </div>

      {/* Navigation - Fixed with proper z-index */}
      <nav className="fixed top-1 left-0 right-0 z-[100] bg-white/90 backdrop-blur-lg border-b border-black/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight">ApplyMate</span>
          </div>
          <div className="flex gap-3 sm:gap-4 md:gap-6 items-center">
            <a 
              href="#features" 
              className="hidden md:flex items-center gap-1 hover:opacity-60 transition-opacity smooth-scroll text-sm md:text-base"
            >
              Features
              <ArrowRight className="w-4 h-4" />
            </a>
            <a 
              href="/login" 
              className="hover:opacity-60 transition-opacity text-sm md:text-base flex items-center py-2"
            >
              Sign In
            </a>
            <a
              href="/signup"
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 md:px-6 py-2 bg-black text-white hover:bg-black/80 active:scale-95 transition-all hover:scale-105 border border-black whitespace-nowrap text-sm md:text-base"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 pt-24 pb-8 relative overflow-hidden">
        {/* Parallax floating decorative elements - hidden on mobile */}
        <div className="absolute top-1/4 left-10 w-20 h-20 border-2 border-black float-element parallax-slow hidden md:block" />
        <div className="absolute top-1/3 right-20 w-16 h-16 bg-black float-element parallax-fast hidden md:block" />
        <div className="absolute bottom-1/4 left-1/4 w-12 h-12 border-2 border-black rotate-45 float-element parallax-medium hidden lg:block" />
        
        {/* Additional parallax elements */}
        <div className="absolute top-1/2 right-1/4 w-24 h-24 border-2 border-black/20 rounded-full parallax-slow hidden lg:block" />
        <div className="absolute bottom-1/3 right-10 w-14 h-14 bg-black/10 rotate-12 parallax-fast hidden md:block" />

        <div className="max-w-5xl w-full text-center relative z-10">
          <h1
            ref={titleRef}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-9xl font-bold tracking-tighter leading-[1.1] mb-4 sm:mb-6 md:mb-8 px-2"
          >
            Your Career,
            <br />
            <span className="italic font-light">Simplified</span>
          </h1>

          <p
            ref={subtitleRef}
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-black/60 max-w-2xl mx-auto mb-8 sm:mb-10 md:mb-12 leading-relaxed px-4"
          >
            Track applications, optimize resumes with AI-powered ATS analysis,
            manage networking contacts, and land your dream job—all in one platform.
          </p>

          <div ref={ctaRef} className="flex gap-3 sm:gap-4 justify-center flex-wrap px-4 mb-12 sm:mb-16">
            <a
              href="/signup"
              className="w-full sm:w-auto text-center group px-6 sm:px-8 py-3 sm:py-4 bg-black text-white text-base sm:text-lg font-medium hover:bg-white hover:text-black transition-all border-2 border-black relative overflow-hidden"
            >
              Start Free Trial
            </a>
            <a
              href="#demo"
              className="w-full sm:w-auto text-center px-6 sm:px-8 py-3 sm:py-4 bg-white text-black text-base sm:text-lg font-medium hover:bg-black hover:text-white transition-all border-2 border-black"
            >
              Watch Demo
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 md:gap-12 mt-12 sm:mt-16 md:mt-24 mb-8 sm:mb-12 md:mb-16 max-w-3xl mx-auto px-4">
            <div className="group cursor-pointer bg-white/50 backdrop-blur-sm p-6 rounded-lg border border-black/5 hover:border-black/20 transition-all">
              <CheckCircle2 className="w-8 h-8 mb-3 mx-auto text-green-600 group-hover:scale-110 transition-transform" />
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold">
                <span className="stat-number">98</span>%
              </div>
              <div className="text-xs sm:text-sm text-black/60 mt-2">Success Rate</div>
            </div>
            <div className="group cursor-pointer bg-white/50 backdrop-blur-sm p-6 rounded-lg border border-black/5 hover:border-black/20 transition-all">
              <Sparkles className="w-8 h-8 mb-3 mx-auto text-purple-600 group-hover:scale-110 transition-transform" />
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold">
                <span className="stat-number">10</span>K+
              </div>
              <div className="text-xs sm:text-sm text-black/60 mt-2">Users</div>
            </div>
            <div className="group cursor-pointer bg-white/50 backdrop-blur-sm p-6 rounded-lg border border-black/5 hover:border-black/20 transition-all">
              <Zap className="w-8 h-8 mb-3 mx-auto text-yellow-600 group-hover:scale-110 transition-transform" />
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold">
                <span className="stat-number">500</span>K+
              </div>
              <div className="text-xs sm:text-sm text-black/60 mt-2">Applications</div>
            </div>
          </div>

          {/* Scroll Indicator - Hidden on small mobile */}
          <div className="hidden sm:block mt-8 scroll-indicator">
            <a 
              href="#features" 
              className="flex flex-col items-center gap-2 text-black/40 hover:text-black transition-colors group"
            >
              <span className="text-sm font-medium">Scroll to explore</span>
              <ChevronDown className="w-6 h-6 animate-bounce" />
            </a>
          </div>
        </div>
      </section>

      {/* Features Section - Horizontal Scroll on Desktop, Vertical on Mobile */}
      <section id="features" ref={featuresRef} className="relative bg-black text-white">
        {/* Desktop: Horizontal Scroll, Mobile: Vertical Stack */}
        <div className="hidden md:block">
          <div className="sticky top-0 h-screen flex items-center overflow-hidden">
            <div className="absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 z-10 features-title">
              <h2 className="text-5xl md:text-6xl font-bold text-center whitespace-nowrap px-4">
                Everything You Need
              </h2>
            </div>

          <div className="flex h-full items-center">
            {/* Feature 1 */}
            <div className="feature-card min-w-[100vw] h-full flex items-center justify-center px-8 sm:px-16 relative overflow-hidden">
              <div className="feature-bg absolute inset-0 opacity-5">
                <div className="absolute top-20 left-20 w-64 h-64 border-4 border-white rotate-12" />
                <div className="absolute bottom-20 right-20 w-48 h-48 bg-white/10" />
              </div>
              
              <div className="max-w-3xl relative z-10">
                <div className="feature-icon mb-8 inline-block">
                  <ClipboardCheck className="w-20 h-20 sm:w-28 sm:h-28 stroke-[1.5]" />
                </div>
                <div className="feature-number text-8xl sm:text-9xl font-bold mb-6 opacity-20">
                  01
                </div>
                <h3 className="feature-title text-5xl sm:text-6xl md:text-7xl font-bold mb-6">
                  Smart Tracking
                </h3>
                <p className="feature-description text-xl sm:text-2xl md:text-3xl opacity-80 leading-relaxed">
                  Never lose track of where you applied. Organize applications by status,
                  dates, and priority with our intuitive dashboard.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="feature-card min-w-[100vw] h-full flex items-center justify-center px-8 sm:px-16 relative overflow-hidden">
              <div className="feature-bg absolute inset-0 opacity-5">
                <div className="absolute top-32 right-32 w-72 h-72 border-4 border-white rounded-full" />
                <div className="absolute bottom-32 left-32 w-56 h-56 bg-white/10 rotate-45" />
              </div>
              
              <div className="max-w-3xl relative z-10">
                <div className="feature-icon mb-8 inline-block">
                  <Sparkles className="w-20 h-20 sm:w-28 sm:h-28 stroke-[1.5]" />
                </div>
                <div className="feature-number text-8xl sm:text-9xl font-bold mb-6 opacity-20">
                  02
                </div>
                <h3 className="feature-title text-5xl sm:text-6xl md:text-7xl font-bold mb-6">
                  AI Resume Analysis
                </h3>
                <p className="feature-description text-xl sm:text-2xl md:text-3xl opacity-80 leading-relaxed">
                  Get instant ATS compatibility scores, keyword optimization, and
                  personalized suggestions powered by advanced AI.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="feature-card min-w-[100vw] h-full flex items-center justify-center px-8 sm:px-16 relative overflow-hidden">
              <div className="feature-bg absolute inset-0 opacity-5">
                <div className="absolute top-24 left-24 w-80 h-80 border-4 border-white" />
                <div className="absolute bottom-24 right-24 w-64 h-64 bg-white/10 rounded-full" />
              </div>
              
              <div className="max-w-3xl relative z-10">
                <div className="feature-icon mb-8 inline-block">
                  <FileStack className="w-20 h-20 sm:w-28 sm:h-28 stroke-[1.5]" />
                </div>
                <div className="feature-number text-8xl sm:text-9xl font-bold mb-6 opacity-20">
                  03
                </div>
                <h3 className="feature-title text-5xl sm:text-6xl md:text-7xl font-bold mb-6">
                  Multiple Resumes
                </h3>
                <p className="feature-description text-xl sm:text-2xl md:text-3xl opacity-80 leading-relaxed">
                  Store unlimited resume versions. Tailor each one for specific roles
                  and track which resume you used for each application.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="feature-card min-w-[100vw] h-full flex items-center justify-center px-8 sm:px-16 relative overflow-hidden">
              <div className="feature-bg absolute inset-0 opacity-5">
                <div className="absolute top-28 right-28 w-60 h-60 border-4 border-white rotate-45" />
                <div className="absolute bottom-28 left-28 w-72 h-72 bg-white/10" />
              </div>
              
              <div className="max-w-3xl relative z-10">
                <div className="feature-icon mb-8 inline-block">
                  <Users className="w-20 h-20 sm:w-28 sm:h-28 stroke-[1.5]" />
                </div>
                <div className="feature-number text-8xl sm:text-9xl font-bold mb-6 opacity-20">
                  04
                </div>
                <h3 className="feature-title text-5xl sm:text-6xl md:text-7xl font-bold mb-6">
                  Network & Connect
                </h3>
                <p className="feature-description text-xl sm:text-2xl md:text-3xl opacity-80 leading-relaxed">
                  Manage networking contacts, track interactions, set follow-up reminders,
                  and get AI-powered outreach suggestions.
                </p>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Mobile: Vertical Stack */}
        <div className="block md:hidden py-16 px-4">
          <h2 className="text-4xl font-bold text-center mb-16">
            Everything You Need
          </h2>

          {/* Mobile Feature 1 */}
          <div className="feature-card-mobile mb-16 py-12 px-6 relative overflow-hidden border-2 border-white/20">
            <div className="feature-bg absolute inset-0 opacity-5">
              <div className="absolute top-10 left-10 w-32 h-32 border-2 border-white rotate-12" />
            </div>
            
            <div className="relative z-10">
              <ClipboardCheck className="w-16 h-16 mb-6 stroke-[1.5]" />
              <div className="text-6xl font-bold mb-4 opacity-20">01</div>
              <h3 className="text-3xl font-bold mb-4">Smart Tracking</h3>
              <p className="text-lg opacity-80 leading-relaxed">
                Never lose track of where you applied. Organize applications by status,
                dates, and priority with our intuitive dashboard.
              </p>
            </div>
          </div>

          {/* Mobile Feature 2 */}
          <div className="feature-card-mobile mb-16 py-12 px-6 relative overflow-hidden border-2 border-white/20">
            <div className="feature-bg absolute inset-0 opacity-5">
              <div className="absolute top-10 right-10 w-32 h-32 border-2 border-white rounded-full" />
            </div>
            
            <div className="relative z-10">
              <Sparkles className="w-16 h-16 mb-6 stroke-[1.5]" />
              <div className="text-6xl font-bold mb-4 opacity-20">02</div>
              <h3 className="text-3xl font-bold mb-4">AI Resume Analysis</h3>
              <p className="text-lg opacity-80 leading-relaxed">
                Get instant ATS compatibility scores, keyword optimization, and
                personalized suggestions powered by advanced AI.
              </p>
            </div>
          </div>

          {/* Mobile Feature 3 */}
          <div className="feature-card-mobile mb-16 py-12 px-6 relative overflow-hidden border-2 border-white/20">
            <div className="feature-bg absolute inset-0 opacity-5">
              <div className="absolute bottom-10 left-10 w-32 h-32 border-2 border-white" />
            </div>
            
            <div className="relative z-10">
              <FileStack className="w-16 h-16 mb-6 stroke-[1.5]" />
              <div className="text-6xl font-bold mb-4 opacity-20">03</div>
              <h3 className="text-3xl font-bold mb-4">Multiple Resumes</h3>
              <p className="text-lg opacity-80 leading-relaxed">
                Store unlimited resume versions. Tailor each one for specific roles
                and track which resume you used for each application.
              </p>
            </div>
          </div>

          {/* Mobile Feature 4 */}
          <div className="feature-card-mobile py-12 px-6 relative overflow-hidden border-2 border-white/20">
            <div className="feature-bg absolute inset-0 opacity-5">
              <div className="absolute top-10 right-10 w-32 h-32 border-2 border-white rotate-45" />
            </div>
            
            <div className="relative z-10">
              <Users className="w-16 h-16 mb-6 stroke-[1.5]" />
              <div className="text-6xl font-bold mb-4 opacity-20">04</div>
              <h3 className="text-3xl font-bold mb-4">Network & Connect</h3>
              <p className="text-lg opacity-80 leading-relaxed">
                Manage networking contacts, track interactions, set follow-up reminders,
                and get AI-powered outreach suggestions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 md:py-32 px-4 sm:px-6 relative overflow-hidden">
        {/* Parallax background elements - hidden on mobile */}
        <div className="hidden md:block absolute top-10 left-10 w-32 h-32 border-2 border-black/10 rotate-45 parallax-slow" />
        <div className="hidden md:block absolute bottom-10 right-10 w-24 h-24 bg-black/5 parallax-fast" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10 cta-content">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 md:mb-8 leading-tight px-2">
            Ready to Transform
            <br />
            Your Job Search?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-black/60 mb-8 sm:mb-10 md:mb-12 px-4 max-w-2xl mx-auto">
            Stop juggling spreadsheets and notes. Organize your entire job search with AI-powered insights and smart tracking.
          </p>
          <a
            href="/signup"
            className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 bg-black text-white text-base sm:text-lg md:text-xl font-medium hover:scale-105 active:scale-95 transition-all border-2 border-black group"
          >
            Get Started for Free
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-black py-8 sm:py-12 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2 text-xl sm:text-2xl font-bold">
            <Zap className="w-6 h-6" />
            <span>ApplyMate</span>
          </div>
          <div className="flex gap-4 sm:gap-8 text-sm sm:text-base flex-wrap justify-center">
            <a href="/about" className="hover:opacity-60 hover:translate-y-[-2px] transition-all">
              About
            </a>
            <a href="/privacy" className="hover:opacity-60 hover:translate-y-[-2px] transition-all">
              Privacy
            </a>
            <a href="/terms" className="hover:opacity-60 hover:translate-y-[-2px] transition-all">
              Terms
            </a>
            <a href="/contact" className="hover:opacity-60 hover:translate-y-[-2px] transition-all">
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