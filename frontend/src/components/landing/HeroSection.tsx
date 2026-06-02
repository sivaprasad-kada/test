import { useState, useRef, Suspense, lazy, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

// Lazy-load heavy 3D scene only on landing page
const GlobeScene = lazy(() => import("./GlobeScene"));

// ──────────────────────────────────────────────
// Animation variants
// ──────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

// ──────────────────────────────────────────────
// HeroSection
// ──────────────────────────────────────────────
const HeroSection = () => {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const handleShorten = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setIsLoading(true);
    try {
      await refreshUser();
      navigate("/dashboard");
    } catch {
      navigate("/login");
    } finally {
      setIsLoading(false);
    }
  };

  const { scrollY } = useScroll();
  const globeX = useTransform(scrollY, [0, 400], [0, -300]);
  const globeOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const globeScale = useTransform(scrollY, [0, 300], [1, 0.8]);

  const [isDesktop, setIsDesktop] = useState(typeof window !== "undefined" ? window.innerWidth >= 1024 : true);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const textXDesktop = useTransform(scrollY, [0, 400], [0, 250]); // Move right to center

  return (
    <section className="relative min-h-[calc(100vh-64px)] flex overflow-hidden">
      {/* Main content container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-10 lg:px-16 pt-10 md:pt-14 lg:pt-20 pb-10 md:pb-14 lg:pb-20 flex flex-col justify-center">
        <div className="flex flex-col lg:flex-row items-center lg:items-center gap-12 lg:gap-16">
          {/* ── LEFT CONTENT ─────────────────────────── */}
          <motion.div 
            className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left max-w-2xl mx-auto lg:mx-0 relative z-20"
            style={{ x: isDesktop ? textXDesktop : 0 }}
          >
            {/* Heading */}
            <motion.h1
              custom={0.1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-5xl sm:text-6xl lg:text-[3.8rem] xl:text-[4.2rem] font-black tracking-tight leading-[1.05] mb-5 text-slate-900"
            >
              Shorten,{" "}
              <span
                className="relative inline-block"
                style={{
                  background: "linear-gradient(135deg, #2563EB 0%, #3b82f6 60%, #60a5fa 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Track
              </span>{" "}
              &amp; Share Links{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #2563EB 0%, #3b82f6 60%, #60a5fa 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Smarter
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              custom={0.2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-base sm:text-lg leading-relaxed mb-8 max-w-lg text-slate-500"
            >
              Create branded short links, monitor analytics in real-time, generate QR codes, and manage redirects globally.
            </motion.p>

            {/* URL Input + CTA */}
            <motion.div
              custom={0.3}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="w-full max-w-xl"
            >
              {/* Input row */}
              <div
                className="flex items-center gap-2 p-1.5 rounded-2xl w-full bg-white border border-blue-500/15"
                style={{
                  boxShadow: "0 2px 20px rgba(37,99,235,0.07), 0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <div className="flex items-center gap-2.5 flex-1 pl-4">
                  <Link2 size={17} className="text-slate-400 shrink-0" />
                  <input
                    ref={inputRef}
                    type="url"
                    placeholder="Paste your long URL here..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleShorten()}
                    className="flex-1 bg-transparent outline-none text-sm text-slate-900"
                  />
                </div>
                <button
                  onClick={handleShorten}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-70"
                  style={{
                    background: "linear-gradient(135deg, #2563EB 0%, #3b82f6 100%)",
                    boxShadow: "0 2px 12px rgba(37,99,235,0.35)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      "0 4px 20px rgba(37,99,235,0.5)";
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow =
                      "0 2px 12px rgba(37,99,235,0.35)";
                    (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                  }}
                >
                  {isLoading ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Shorten URL
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>

          {/* ── RIGHT — 3D GLOBE ────────────────────── */}
          {isDesktop && (
            <motion.div
              className="flex-1 relative w-full z-0 pointer-events-none lg:pointer-events-auto animate-in fade-in duration-700"
              style={{ 
                height: "500px",
                x: globeX,
                opacity: globeOpacity,
                scale: globeScale
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="w-full h-full relative"
              >
                {/* Soft radial glow behind globe */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(ellipse 85% 85% at 50% 50%, rgba(37,99,235,0.12) 0%, transparent 70%)",
                  }}
                />

                {/* Globe canvas */}
                <Suspense
                  fallback={
                    <div className="w-full h-full flex items-center justify-center">
                      <div
                        className="w-10 h-10 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin"
                      />
                    </div>
                  }
                >
                  <GlobeScene />
                </Suspense>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.95))",
        }}
      />
    </section>
  );
};

export default HeroSection;
