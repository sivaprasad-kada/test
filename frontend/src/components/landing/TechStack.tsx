import { motion } from "framer-motion";
import { Server, Code2, Database, Zap } from "lucide-react";

const techs = [
  { name: "Node.js", icon: Server, description: "Event-driven runtime for high-concurrency API performance.", color: "text-green-600 bg-green-50" },
  { name: "React", icon: Code2, description: "Dynamic dashboard for real-time engagement monitoring.", color: "text-blue-600 bg-blue-50" },
  { name: "Redis", icon: Zap, description: "Sub-millisecond latency link resolution via memory cache.", color: "text-red-600 bg-red-50" },
  { name: "MongoDB", icon: Database, description: "Flexible document storage for petabyte-scale link metadata.", color: "text-green-700 bg-green-50" },
];

const TechStack = () => {
  return (
    <section className="py-10 md:py-14 lg:py-20 px-6">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">Built on a Modern Stack</h2>
        <p className="text-muted-foreground mb-16 max-w-lg mx-auto">
          Leveraging the latest technologies to ensure maximum uptime and lightning-fast redirection for every click.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {techs.map((tech, i) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="bg-card rounded-xl p-6 shadow-card border border-border text-center"
            >
              <div className={`w-12 h-12 rounded-xl ${tech.color} flex items-center justify-center mx-auto mb-4`}>
                <tech.icon size={22} />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{tech.name}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{tech.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TechStack;
