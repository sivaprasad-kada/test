import { useState, useRef, Suspense, lazy, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link2, ArrowRight, Copy, Check, Zap, BarChart2, Globe } from "lucide-react";

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

const stats = [
  { icon: Globe, label: "10M+ links created" },
  { icon: Zap, label: "99.9% uptime" },
  { icon: BarChart2, label: "Real-time analytics" },
];

// ──────────────────────────────────────────────
// HeroSection
// ──────────────────────────────────────────────
const HeroSection = () => {
  const [url, setUrl] = useState("");
  const [shortened, setShortened] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleShorten = () => {
    if (!url.trim()) {
      inputRef.current?.focus();
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      const slug = Math.random().toString(36).substring(2, 8);
      setShortened(`shrt.ly/${slug}`);
      setIsLoading(false);
    }, 600);
  };

  const handleCopy = () => {
    if (shortened) {
      navigator.clipboard.writeText(`https://${shortened}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
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
    <section
      className="relative min-h-[calc(100vh-64px)] flex overflow-hidden"
    >

      {/* Main content container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-10 lg:px-16 pt-12 md:pt-16 pb-16 md:pb-20 flex flex-col">
        <div className="flex flex-col lg:flex-row items-center lg:items-center gap-12 lg:gap-16">

          {/* ── LEFT CONTENT ─────────────────────────── */}
          <motion.div 
            className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left max-w-2xl mx-auto lg:mx-0 relative z-20"
            style={{ x: isDesktop ? textXDesktop : 0 }}
          >

            {/* Badge */}
            <motion.div
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mb-6"
            >
              <span
                className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase px-3.5 py-1.5 rounded-full border"
                style={{
                  color: "#2563EB",
                  borderColor: "rgba(37,99,235,0.2)",
                  background: "rgba(37,99,235,0.05)",
                  letterSpacing: "0.08em",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: "#2563EB" }}
                />
                Smart URL Management
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              custom={0.1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="text-5xl sm:text-6xl lg:text-[3.8rem] xl:text-[4.2rem] font-black tracking-tight leading-[1.05] mb-5"
              style={{ color: "#0F172A" }}
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
              className="text-base sm:text-lg leading-relaxed mb-8 max-w-lg"
              style={{ color: "#64748B" }}
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
                className="flex items-center gap-2 p-1.5 rounded-2xl w-full"
                style={{
                  background: "#FFFFFF",
                  border: "1.5px solid rgba(37,99,235,0.15)",
                  boxShadow: "0 2px 20px rgba(37,99,235,0.07), 0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <div className="flex items-center gap-2.5 flex-1 pl-4">
                  <Link2 size={17} style={{ color: "#94a3b8", flexShrink: 0 }} />
                  <input
                    ref={inputRef}
                    type="url"
                    placeholder="Paste your long URL here..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleShorten()}
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: "#0F172A" }}
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

              {/* Shortened result */}
              {shortened && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-3 flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{
                    background: "rgba(37,99,235,0.04)",
                    border: "1px solid rgba(37,99,235,0.15)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: "rgba(37,99,235,0.1)" }}
                    >
                      <Check size={14} style={{ color: "#2563EB" }} />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#2563EB" }}>
                        Link ready
                      </p>
                      <p className="text-sm font-bold" style={{ color: "#0F172A" }}>
                        {shortened}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
                    style={{
                      background: copied ? "rgba(37,99,235,0.12)" : "rgba(37,99,235,0.07)",
                      color: "#2563EB",
                    }}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </motion.div>
              )}
            </motion.div>

            {/* Stats row */}
            <motion.div
              custom={0.42}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="flex flex-wrap items-center justify-center lg:justify-start gap-5 mt-7"
            >
              {stats.map(({ icon: Icon, label }, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(37,99,235,0.07)" }}
                  >
                    <Icon size={14} style={{ color: "#2563EB" }} />
                  </div>
                  <span className="text-xs font-medium" style={{ color: "#64748B" }}>
                    {label}
                  </span>
                  {i < stats.length - 1 && (
                    <span className="text-slate-200 text-sm ml-1">·</span>
                  )}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* ── RIGHT — 3D GLOBE ────────────────────── */}
          <motion.div
            className="flex-1 relative w-full z-0 pointer-events-none lg:pointer-events-auto"
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
