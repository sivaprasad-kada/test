import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import TechStack from "@/components/landing/TechStack";
import Architecture from "@/components/landing/Architecture";
import PricingSection from "@/components/landing/PricingSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";
import LandingGridBackground from "@/components/landing/GridBackground";

const Index = () => {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Full-page interactive grid — covers all sections */}
      <LandingGridBackground />

      {/* All page content sits above the grid (z-index via relative) */}
      <div className="relative z-10">
        <Navbar />
        <HeroSection />
        <TechStack />
        <Architecture />
        <PricingSection />
        <CTASection />
        <Footer />
      </div>
    </div>
  );
};

export default Index;
