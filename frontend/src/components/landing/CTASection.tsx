import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

const CTASection = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = async () => {
    if (!user) {
      navigate("/login?signup=true");
      return;
    }

    try {
      await refreshUser();
      navigate("/dashboard");
    } catch {
      navigate("/login");
    }
  };

  return (
    <section className="py-10 md:py-14 lg:py-20 px-6 bg-primary text-center">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary-foreground mb-4 text-balance">
          Ready to maximize your link potential?
        </h2>
        <p className="text-primary-foreground/70 mb-10 text-lg">
          Join over 100,000 users shortening millions of links every day.
        </p>
        <div className="flex items-center justify-center">
          <Button size="hero" variant="secondary" onClick={handleGetStarted}>
            Get Started for Free
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
