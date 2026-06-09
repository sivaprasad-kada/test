import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import api from "@/api/axios";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const PricingSection = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast({
          title: "Payment gateway error",
          description: "Failed to load payment gateway. Please check your internet connection.",
          variant: "destructive",
        });
        return;
      }

      const response = await api.post("/billing/create-subscription");
      const { subscriptionId, keyId } = response.data;

      const options = {
        key: keyId,
        subscription_id: subscriptionId,
        name: "Shortly Pro Plan",
        description: "₹299/month Subscription",
        handler: async function (response: any) {
          toast({
            title: "Success",
            description: "Thank you for upgrading to Pro!",
          });
          await refreshUser();
          navigate("/dashboard");
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: "#2563eb",
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (error: any) {
      console.error("[Pricing] Razorpay Upgrade Error:", error);
      toast({
        title: "Subscription Failed",
        description: error.response?.data?.error || "Unable to start checkout. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      name: "FREE",
      price: "₹0",
      period: "/month",
      description: "Perfect for side projects and personal brand building.",
      features: [
        "500 Links",
        "5000 Redirects / Month",
        "Total Click Analytics",
        "Unique Visitor Analytics",
      ],
      cta: user ? (user.plan === "PRO" ? "Downgrade" : "Current Plan") : "Get Started",
      disabled: !!user,
      highlighted: false,
      onClick: () => navigate("/login?signup=true"),
    },
    {
      name: "PRO",
      price: "₹299",
      period: "/month",
      description: "For creators and growing brands needing advanced capabilities.",
      features: [
        "2000 Links",
        "200000 Redirects / Month",
        "Custom Aliases",
        "QR Code Generation",
        "Advanced Analytics",
      ],
      cta: user ? (user.plan === "PRO" ? "Current Plan" : "Upgrade to Pro") : "Get Pro",
      disabled: user?.plan === "PRO",
      highlighted: true,
      onClick: handleUpgrade,
    },
  ];

  return (
    <section id="pricing" className="py-10 md:py-14 lg:py-20 px-6 scroll-mt-10">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
          Plans for teams of all sizes
        </h2>
        <p className="text-muted-foreground mb-16">
          Simple, transparent pricing to help you grow your brand's reach.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl p-8 text-left border flex flex-col justify-between ${
                plan.highlighted
                  ? "border-primary shadow-elevated bg-card/60 backdrop-blur-sm scale-105"
                  : "border-border shadow-card bg-card/40 backdrop-blur-sm"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider shadow-md">
                  Most Popular
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1 tracking-wider">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-4xl font-black text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <Check size={16} className="text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <Button
                variant={plan.highlighted ? "default" : "outline"}
                className="w-full"
                size="lg"
                disabled={plan.disabled || loading}
                onClick={plan.onClick}
              >
                {loading && plan.highlighted ? "Processing..." : plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
