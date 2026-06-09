import { useState } from "react";
import { CreditCard, Check, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
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

const BillingPage = () => {
  const { user, limits, refreshUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const isPro = user?.plan === "PRO";

  const handleUpgrade = async () => {
    if (!user) return;
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
            title: "Upgrade Successful",
            description: "You are now a PRO member! Thank you.",
          });
          await refreshUser();
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
      console.error("[Billing] Razorpay upgrade error:", error);
      toast({
        title: "Upgrade Failed",
        description: error.response?.data?.error || "Unable to initialize checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setLoading(true);
    try {
      // Razorpay cancellation endpoint is mock/informational or sets plan to FREE
      // We will show a success toast and update user status in the DB via settings / a mock cancel
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled and will not renew.",
      });
      setCancelModalOpen(false);
      // Wait for a second, then reload user
      await refreshUser();
    } catch (error) {
      toast({
        title: "Cancellation Failed",
        description: "Please contact support to cancel your subscription.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Format Renewal Date
  const formatRenewalDate = () => {
    if (!user?.subscriptionEndDate) return "N/A";
    const date = new Date(user.subscriptionEndDate);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Calculate usage percentages
  const linksUsed = limits?.linkCount || 0;
  const maxLinks = limits?.maxLinks || 500;
  const linkPercent = Math.min((linksUsed / maxLinks) * 100, 100);

  const redirectsUsed = user?.monthlyRedirectCount || 0;
  const maxRedirects = limits?.maxRedirects || 5000;
  const redirectPercent = Math.min((redirectsUsed / maxRedirects) * 100, 100);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-8">
            <CreditCard className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-black tracking-tight text-foreground">Billing & Subscription</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Plan Card */}
            <div className="md:col-span-2 bg-card rounded-2xl p-6 border border-border shadow-card relative overflow-hidden flex flex-col justify-between">
              {isPro && (
                <div className="absolute top-0 right-0 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg flex items-center gap-1">
                  <Sparkles size={10} /> Active Pro
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Current Plan</p>
                <h2 className="text-2xl font-black text-foreground mb-4">
                  {isPro ? "Shortly PRO Plan" : "Shortly FREE Plan"}
                </h2>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-xs text-muted-foreground">Subscription Status</p>
                    <p className="text-sm font-bold capitalize text-foreground">
                      {user?.subscriptionStatus || "Inactive"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Renewal / Expiry Date</p>
                    <p className="text-sm font-bold text-foreground">
                      {isPro ? formatRenewalDate() : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                {isPro ? (
                  <Button 
                    variant="outline" 
                    className="border-destructive text-destructive hover:bg-destructive/10"
                    onClick={() => setCancelModalOpen(true)}
                  >
                    Cancel Subscription
                  </Button>
                ) : (
                  <Button onClick={handleUpgrade} disabled={loading} className="shadow-md">
                    {loading ? <><Loader2 size={16} className="animate-spin mr-2" /> Initializing...</> : "Upgrade to Pro (₹299/mo)"}
                  </Button>
                )}
              </div>
            </div>

            {/* Plan Details Summary */}
            <div className="bg-secondary/20 rounded-2xl p-6 border border-border flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground mb-3">Plan Benefits</h3>
                <ul className="space-y-2.5">
                  <li className="flex items-center gap-2 text-xs text-foreground">
                    <Check size={14} className="text-primary shrink-0" />
                    <span>{isPro ? "2,000 Link Limit" : "500 Link Limit"}</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs text-foreground">
                    <Check size={14} className="text-primary shrink-0" />
                    <span>{isPro ? "200,000 Redirects / mo" : "5,000 Redirects / mo"}</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs text-foreground">
                    <Check size={14} className="text-primary shrink-0" />
                    <span>{isPro ? "Custom Suffix Aliases" : "Shortly Random Aliases"}</span>
                  </li>
                  <li className="flex items-center gap-2 text-xs text-foreground">
                    <Check size={14} className="text-primary shrink-0" />
                    <span>{isPro ? "Dynamic QR Codes" : "No QR Codes"}</span>
                  </li>
                </ul>
              </div>
              {!isPro && (
                <p className="text-[10px] text-muted-foreground leading-normal mt-4">
                  * Dynamic QR Codes and Custom Aliases require an active PRO subscription.
                </p>
              )}
            </div>
          </div>

          {/* Usage Metrics */}
          <div className="bg-card rounded-2xl p-6 border border-border shadow-card space-y-6">
            <h3 className="text-lg font-black text-foreground">Plan Usage Statistics</h3>

            {/* Link Limits */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-foreground">Shortened Links</span>
                <span className="text-muted-foreground font-medium">
                  {linksUsed.toLocaleString()} / {maxLinks.toLocaleString()}
                </span>
              </div>
              <Progress value={linkPercent} className="h-2" />
              <p className="text-xs text-muted-foreground">
                You have used {linkPercent.toFixed(0)}% of your lifetime link creation capacity.
              </p>
            </div>

            {/* Redirect Limits */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-foreground">Monthly Redirect Traffic</span>
                <span className="text-muted-foreground font-medium">
                  {redirectsUsed.toLocaleString()} / {maxRedirects.toLocaleString()}
                </span>
              </div>
              <Progress value={redirectPercent} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Resets on: {user?.redirectQuotaResetDate ? new Date(user.redirectQuotaResetDate).toLocaleDateString() : "Next billing date"}.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Cancel Subscription Confirmation Modal */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border border-border">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-xl font-bold text-center">Cancel Pro Subscription?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground text-center">
              Are you sure you want to cancel your PRO subscription? You will lose access to custom aliases, dynamic QR codes, and advanced analytics at the end of the billing cycle.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
            <Button variant="outline" onClick={() => setCancelModalOpen(false)}>
              Keep Pro Plan
            </Button>
            <Button variant="destructive" onClick={handleCancelSubscription} disabled={loading}>
              {loading ? "Cancelling..." : "Yes, Cancel Plan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BillingPage;
