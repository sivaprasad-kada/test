import { motion } from "framer-motion";

interface Card {
  label: string;
  value: string;
  icon: string;
  delay: number;
  position: string;
}

const cards: Card[] = [
  {
    label: "Total Clicks",
    value: "1.2M",
    icon: "📈",
    delay: 0,
    position: "top-4 -left-6 md:-left-10",
  },
  {
    label: "Live Redirects",
    value: "Active",
    icon: "⚡",
    delay: 0.15,
    position: "top-1/3 -right-4 md:-right-8",
  },
  {
    label: "QR Scans",
    value: "+48%",
    icon: "📱",
    delay: 0.3,
    position: "bottom-1/3 -left-4 md:-left-8",
  },
  {
    label: "Active Links",
    value: "84.3K",
    icon: "🔗",
    delay: 0.45,
    position: "bottom-6 -right-4 md:-right-10",
  },
];

const FloatingCards = () => {
  return (
    <>
      {cards.map((card, i) => (
        <motion.div
          key={i}
          className={`absolute ${card.position} z-20`}
          initial={{ opacity: 0, scale: 0.85, y: 10 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: [0, -6, 0],
          }}
          transition={{
            opacity: { delay: 1.2 + card.delay, duration: 0.6 },
            scale: { delay: 1.2 + card.delay, duration: 0.6 },
            y: {
              delay: 1.2 + card.delay,
              duration: 3.5 + i * 0.4,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
        >
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-blue-100/60 shadow-lg"
            style={{
              background: "rgba(255,255,255,0.72)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              boxShadow:
                "0 4px 24px rgba(37,99,235,0.08), 0 1px 4px rgba(0,0,0,0.06)",
            }}
          >
            <span className="text-base leading-none">{card.icon}</span>
            <div>
              <p className="text-[10px] font-medium text-slate-400 leading-none mb-0.5">
                {card.label}
              </p>
              <p className="text-sm font-bold text-slate-800 leading-none">
                {card.value}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </>
  );
};

export default FloatingCards;
