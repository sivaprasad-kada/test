import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MousePointerClick, Users, Globe, Loader2, ArrowLeft, Monitor, Smartphone, RefreshCw, Lock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Button } from "@/components/ui/button";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import api from "@/api/axios";
import { useAuth } from "@/context/AuthContext";

interface AnalyticsEntry {
  _id: string;
  shortId: string;
  date: string;
  totalClicks: number;
  uniqueVisitors: number;
  countries: Record<string, number>;
  browsers: Record<string, number>;
  devices: Record<string, number>;
}

interface UrlItem {
  _id: string;
  shortId: string;
  longUrl: string;
  clicks: number;
}

const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

const AnalyticsPage = () => {
  const { shortId } = useParams<{ shortId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPro = user?.plan === "PRO";
 
  const [analytics, setAnalytics] = useState<AnalyticsEntry[]>([]);
  const [urlInfo, setUrlInfo] = useState<UrlItem | null>(null);
  const [urls, setUrls] = useState<UrlItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Fetch all user URLs for the selector view
  const fetchUserUrls = useCallback(async () => {
    try {
      const res = await api.get("/url");
      setUrls(res.data);
    } catch (err: unknown) {
      const axiosError = err as { response?: { status?: number } };
      if (axiosError.response?.status === 401) navigate("/login");
    }
  }, [navigate]);

  // Fetch analytics for a specific shortId
  const fetchAnalytics = useCallback(async (id: string, isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    else setRefreshing(true);
    setError("");

    try {
      const [analyticsRes, urlsRes] = await Promise.all([
        api.get(`/url/${id}/analytics`),
        api.get("/url"),
      ]);
      setAnalytics(analyticsRes.data);
      setUrls(urlsRes.data);
      const found = urlsRes.data.find((u: UrlItem) => u.shortId === id);
      setUrlInfo(found || null);
    } catch (err: unknown) {
      const axiosError = err as { response?: { status?: number } };
      if (axiosError.response?.status === 401) {
        navigate("/login");
      } else if (!isRefresh) {
        setError("Failed to load analytics data.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate]);

  // Initial fetch
  useEffect(() => {
    if (shortId) {
      fetchAnalytics(shortId);
    } else {
      fetchUserUrls().then(() => setLoading(false));
    }
  }, [shortId, fetchAnalytics, fetchUserUrls]);

  // Auto-refresh analytics every 30 seconds
  useEffect(() => {
    if (!shortId) return;

    const interval = setInterval(() => {
      fetchAnalytics(shortId, true);
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [shortId, fetchAnalytics]);

  // Manual refresh
  const handleRefresh = () => {
    if (shortId) {
      fetchAnalytics(shortId, true);
    } else {
      fetchUserUrls();
    }
  };

  // Aggregate analytics across all entries
  const totalClicks = analytics.reduce((s, a) => s + a.totalClicks, 0);
  const totalUnique = analytics.reduce((s, a) => s + a.uniqueVisitors, 0);

  const allCountries: Record<string, number> = {};
  const allBrowsers: Record<string, number> = {};
  const allDevices: Record<string, number> = {};

  analytics.forEach((a) => {
    Object.entries(a.countries || {}).forEach(([k, v]) => {
      allCountries[k] = (allCountries[k] || 0) + v;
    });
    Object.entries(a.browsers || {}).forEach(([k, v]) => {
      allBrowsers[k] = (allBrowsers[k] || 0) + v;
    });
    Object.entries(a.devices || {}).forEach(([k, v]) => {
      allDevices[k] = (allDevices[k] || 0) + v;
    });
  });

  const chartData = analytics
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((a) => ({
      date: a.date,
      clicks: a.totalClicks,
      visitors: a.uniqueVisitors,
    }));

  const countryData = Object.entries(allCountries)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, clicks]) => ({ name, clicks }));

  const browserData = Object.entries(allBrowsers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, clicks]) => ({ name, clicks }));

  const deviceData = Object.entries(allDevices)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, clicks]) => ({ name, clicks }));

  // If no shortId provided, show URL selector
  if (!shortId) {
    return (
      <div className="flex flex-col lg:flex-row min-h-screen bg-background">
        <DashboardSidebar />
        <main className="flex-1 p-6 md:p-10 overflow-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-black text-foreground">Analytics</h1>
            <Button variant="ghost" size="sm" onClick={handleRefresh} className="gap-2">
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
            </Button>
          </div>
          <p className="text-muted-foreground mb-8">Select a link to view its analytics</p>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : urls.length === 0 ? (
            <div className="text-center py-16">
              <MousePointerClick size={48} className="mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground mb-4">No links found. Create one first!</p>
              <Button onClick={() => navigate("/shortener")}>Create a Link</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {urls.map((u) => (
                <button
                  key={u._id}
                  onClick={() => navigate(`/analytics/${u.shortId}`)}
                  className="bg-card rounded-xl border border-border shadow-card p-5 text-left hover:border-primary/50 hover:shadow-md transition-all group"
                >
                  <p className="text-primary font-bold text-sm group-hover:underline">{u.shortId}</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate" title={u.longUrl}>{u.longUrl}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <MousePointerClick size={14} className="text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">{(u.clicks || 0).toLocaleString()} clicks</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <div className="mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/analytics")} className="gap-2 text-muted-foreground">
            <ArrowLeft size={16} /> Back to Links
          </Button>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
              LINKS &gt; {shortId}
            </p>
            <h1 className="text-3xl font-black text-foreground">Analytics for {shortId}</h1>
            {urlInfo && (
              <p className="text-muted-foreground mt-1 text-sm truncate max-w-lg" title={urlInfo.longUrl}>
                → {urlInfo.longUrl}
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={handleRefresh} className="gap-2">
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : error ? (
          <p className="text-destructive text-center py-16">{error}</p>
        ) : analytics.length === 0 ? (
          <div className="text-center py-16">
            <MousePointerClick size={48} className="mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-lg font-semibold text-foreground mb-1">No analytics yet</p>
            <p className="text-muted-foreground">This link hasn't received any clicks. Share it to start tracking!</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Clicks", value: totalClicks.toLocaleString(), icon: MousePointerClick, locked: false },
                { label: "Unique Visitors", value: totalUnique.toLocaleString(), icon: Users, locked: false },
                { label: "Top Country", value: isPro ? (countryData[0]?.name || "N/A") : "PRO Only", icon: Globe, locked: !isPro },
                { label: "Top Device", value: isPro ? (deviceData[0]?.name || "N/A") : "PRO Only", icon: Monitor, locked: !isPro },
              ].map((stat) => (
                <div key={stat.label} className="bg-card rounded-xl border border-border shadow-card p-5 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      {stat.locked ? <Lock size={14} className="text-amber-500" /> : <stat.icon size={16} />}
                    </div>
                  </div>
                  <p className={`text-2xl font-black ${stat.locked ? "text-amber-500" : "text-foreground"}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Clicks Chart */}
            {chartData.length > 0 && (
              <div className="bg-card rounded-xl border border-border shadow-card p-6 mb-8">
                <h3 className="text-lg font-bold text-foreground mb-1">Click Traffic Over Time</h3>
                <p className="text-sm text-muted-foreground mb-6">Daily click and visitor counts</p>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(243, 75%, 59%)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="hsl(243, 75%, 59%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'hsl(220, 8.9%, 46.1%)' }} />
                    <YAxis tick={{ fontSize: 12, fill: 'hsl(220, 8.9%, 46.1%)' }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="visitors" stroke="hsl(220, 8.9%, 46.1%)" strokeWidth={1.5} strokeDasharray="4 4" fill="transparent" />
                    <Area type="monotone" dataKey="clicks" stroke="hsl(243, 75%, 59%)" strokeWidth={2.5} fill="url(#colorCurrent)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Bottom row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {!isPro ? (
                <div className="md:col-span-3 bg-card rounded-xl border border-border shadow-card p-8 text-center flex flex-col items-center justify-center min-h-[280px]">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                    <Lock className="text-amber-500 animate-pulse" size={24} />
                  </div>
                  <h3 className="text-lg font-black text-foreground mb-2">Detailed Analytics Locked</h3>
                  <p className="text-sm text-muted-foreground max-w-md mb-6">
                    Unlock detailed click breakdowns including Country origin, User Browsers, and Device types with a PRO subscription.
                  </p>
                  <Button onClick={() => navigate("/dashboard/billing")} className="shadow-md">
                    Upgrade to Pro (₹299/mo)
                  </Button>
                </div>
              ) : (
                <>
                  {/* Countries */}
                  {countryData.length > 0 && (
                    <div className="bg-card rounded-xl border border-border shadow-card p-6">
                      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <Globe size={18} /> Countries
                      </h3>
                      <div className="space-y-3">
                        {countryData.map((c) => (
                          <div key={c.name} className="flex items-center justify-between">
                            <span className="text-sm text-foreground">{c.name}</span>
                            <span className="text-sm font-bold text-foreground">{c.clicks}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Browsers */}
                  {browserData.length > 0 && (
                    <div className="bg-card rounded-xl border border-border shadow-card p-6">
                      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <Monitor size={18} /> Browsers
                      </h3>
                      <div className="space-y-3">
                        {browserData.map((b) => (
                          <div key={b.name} className="flex items-center justify-between">
                            <span className="text-sm text-foreground">{b.name}</span>
                            <span className="text-sm font-bold text-foreground">{b.clicks}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Devices */}
                  {deviceData.length > 0 && (
                    <div className="bg-card rounded-xl border border-border shadow-card p-6">
                      <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <Smartphone size={18} /> Devices
                      </h3>
                      <div className="space-y-3">
                        {deviceData.map((d) => (
                          <div key={d.name} className="flex items-center justify-between">
                            <span className="text-sm text-foreground">{d.name}</span>
                            <span className="text-sm font-bold text-foreground">{d.clicks}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        <footer className="mt-12 py-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">© 2024 Shortly Inc. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
};

export default AnalyticsPage;
