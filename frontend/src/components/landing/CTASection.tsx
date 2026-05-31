import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-24 px-6 bg-primary">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary-foreground mb-4 text-balance">
          Ready to maximize your link potential?
        </h2>
        <p className="text-primary-foreground/70 mb-10 text-lg">
          Join over 100,000 users shortening millions of links every day.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="hero" variant="secondary">
            Get Started for Free
          </Button>
          <Button size="hero" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
            Request a Demo
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
