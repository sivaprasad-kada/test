import { useEffect, useState, useCallback } from "react";
import { Link2, MousePointerClick, Zap, Loader2, Trash2, ExternalLink, BarChart3, RefreshCw } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import api, { backendBase } from "@/api/axios";

interface UrlItem {
  _id: string;
  shortId: string;
  longUrl: string;
  clicks: number;
  createdAt: string;
}

const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [urls, setUrls] = useState<UrlItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);



  const fetchUrls = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await api.get("/url");
      setUrls(res.data);
      setError("");
    } catch (err: unknown) {
      const axiosError = err as { response?: { status?: number } };
      if (axiosError.response?.status === 401) {
        navigate("/login");
      } else {
        setError("Failed to fetch URLs.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate]);

  // Initial fetch
  useEffect(() => {
    fetchUrls();
  }, [fetchUrls]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUrls(true);
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchUrls]);

  const handleDelete = async (shortId: string) => {
    setDeleting(shortId);
    try {
      await api.delete(`/url/${shortId}`);
      setUrls((prev) => prev.filter((u) => u.shortId !== shortId));
    } catch {
      setError("Failed to delete URL.");
    } finally {
      setDeleting(null);
    }
  };

  const totalClicks = urls.reduce((sum, u) => sum + (u.clicks || 0), 0);
  const totalLinks = urls.length;

  // Build simple chart data from the most recent 10 URLs
  const chartData = urls
    .slice(0, 10)
    .reverse()
    .map((u) => ({
      date: new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
      clicks: u.clicks || 0,
    }));

  const stats = [
    { label: "Total Links", value: totalLinks.toLocaleString(), icon: Link2, color: "bg-primary/10 text-primary" },
    { label: "Total Clicks", value: totalClicks.toLocaleString(), icon: MousePointerClick, color: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400" },
    { label: "Active Links", value: totalLinks.toLocaleString(), icon: Zap, color: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400" },
  ];

  const firstName = user?.name?.split(" ")[0] || "User";

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-foreground">Welcome back, {firstName}.</h1>
            <p className="text-muted-foreground mt-1">Here's what's happening with your links today.</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => fetchUrls(true)} 
              className="gap-2"
              disabled={loading || refreshing}
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
            </Button>
            <Button onClick={() => navigate("/shortener")}>+ Create New Link</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-card rounded-xl border border-border shadow-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <stat.icon size={18} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="bg-card rounded-xl border border-border shadow-card p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-foreground">Link Performance Overview</h3>
                <p className="text-sm text-muted-foreground">Clicks per URL (most recent)</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(243, 75%, 59%)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(243, 75%, 59%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'hsl(220, 8.9%, 46.1%)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'hsl(220, 8.9%, 46.1%)' }} />
                <Tooltip />
                <Area type="monotone" dataKey="clicks" stroke="hsl(243, 75%, 59%)" strokeWidth={2.5} fill="url(#colorClicks)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* URLs Table */}
        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">Your Links</h3>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={28} className="animate-spin text-primary" />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive text-center py-8">{error}</p>
          ) : urls.length === 0 ? (
            <div className="text-center py-12">
              <Link2 size={40} className="mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No links created yet.</p>
              <Button className="mt-4" onClick={() => navigate("/shortener")}>Create Your First Link</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Short Link</th>
                    <th className="text-left py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Original URL</th>
                    <th className="text-left py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Clicks</th>
                    <th className="text-left py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Created</th>
                    <th className="text-right py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {urls.map((link) => (
                    <tr key={link._id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="py-4">
                        <a
                          href={`${backendBase}/${link.shortId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary font-medium hover:underline flex items-center gap-1"
                        >
                          {link.shortId}
                          <ExternalLink size={12} />
                        </a>
                      </td>
                      <td className="py-4 text-muted-foreground max-w-[260px] truncate" title={link.longUrl}>
                        {link.longUrl}
                      </td>
                      <td className="py-4 font-medium text-foreground">{(link.clicks || 0).toLocaleString()}</td>
                      <td className="py-4 text-muted-foreground text-xs">
                        {new Date(link.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => navigate(`/analytics/${link.shortId}`)}
                            title="View Analytics"
                          >
                            <BarChart3 size={15} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(link.shortId)}
                            disabled={deleting === link.shortId}
                            title="Delete"
                          >
                            {deleting === link.shortId ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
