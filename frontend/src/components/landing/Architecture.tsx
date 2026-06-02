import { motion } from "framer-motion";
import { User, Network, Server, Zap, Database } from "lucide-react";

const steps = [
  { name: "User", subtitle: "REQUEST", icon: User, color: "bg-secondary text-foreground" },
  { name: "Load Balancer", subtitle: "NGINX / ROUTE 53", icon: Network, color: "bg-primary/10 text-primary" },
  { name: "Node.js API Cluster", subtitle: "LOGIC", icon: Server, color: "bg-secondary text-foreground" },
  { name: "Redis Cache", subtitle: "CHECK FIRST", icon: Zap, color: "bg-red-50 text-red-600" },
  { name: "MongoDB", subtitle: "PERSISTENT STORAGE", icon: Database, color: "bg-green-50 text-green-700" },
];

const Architecture = () => {
  return (
    <section className="py-10 md:py-14 lg:py-20 px-6 bg-secondary/50">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">High-Level Architecture</h2>
        <p className="text-muted-foreground mb-16 max-w-lg mx-auto">
          Engineered for resilience and speed. Here's how we handle billions of redirects with zero friction.
        </p>
        <div className="flex flex-wrap justify-center items-center gap-4 md:gap-2">
          {steps.map((step, i) => (
            <motion.div
              key={step.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-2"
            >
              <div className="flex flex-col items-center gap-2 min-w-[100px]">
                <div className={`w-14 h-14 rounded-2xl ${step.color} flex items-center justify-center shadow-card`}>
                  <step.icon size={24} />
                </div>
                <span className="text-xs font-semibold text-foreground">{step.name}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{step.subtitle}</span>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:block w-8 h-px bg-border" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Architecture;
