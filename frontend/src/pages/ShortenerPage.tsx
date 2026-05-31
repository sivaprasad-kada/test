import { useState, useEffect } from "react";
import { Link2, Copy, Check, Loader2, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import api from "@/api/axios";
import { useNavigate } from "react-router-dom";

interface UrlItem {
  _id: string;
  shortId: string;
  longUrl: string;
  clicks: number;
  createdAt: string;
}

const ShortenerPage = () => {
  const [url, setUrl] = useState("");
  const [shortened, setShortened] = useState<{ shortId: string; shortUrl: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const [urls, setUrls] = useState<UrlItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const navigate = useNavigate();

  const backendBase = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/api$/, "")
    : "http://localhost:5000";

  const fetchUrls = async () => {
    try {
      const res = await api.get("/url");
      setUrls(res.data);
    } catch (err: any) {
      if (err.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUrls();
  }, []);

  const handleShorten = async () => {
    if (!url.trim()) return;
    setCreating(true);
    setCreateError("");
    setShortened(null);
    try {
      const res = await api.post("/url", { url: url.trim() });
      setShortened({ shortId: res.data.shortId, shortUrl: res.data.shortUrl });
      setUrl("");
      // refresh the list
      fetchUrls();
    } catch (err: any) {
      const errorData = err.response?.data;
      // Handle Zod validation errors
      if (errorData?.details && Array.isArray(errorData.details)) {
        setCreateError(errorData.details.map((d: any) => d.message).join(". "));
      } else {
        setCreateError(errorData?.error || "Failed to create short URL.");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = (text: string, idx?: number) => {
    navigator.clipboard.writeText(text);
    if (idx !== undefined) {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = async (shortId: string) => {
    setDeleting(shortId);
    try {
      await api.delete(`/url/${shortId}`);
      setUrls((prev) => prev.filter((u) => u.shortId !== shortId));
    } catch {
      // silent
    } finally {
      setDeleting(null);
    }
  };

  const recentUrls = urls.slice(0, 10);

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-black text-foreground mb-3">Shorten your links instantly</h1>
            <p className="text-muted-foreground">Make your URLs clean, manageable, and trackable.</p>
          </div>

          {/* Shortener input */}
          <div className="flex items-center gap-2 bg-card rounded-2xl p-2 shadow-card border border-border mb-4">
            <div className="flex items-center gap-2 flex-1 pl-4">
              <Link2 size={18} className="text-muted-foreground shrink-0" />
              <input
                type="url"
                placeholder="Paste your long link here"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleShorten()}
                className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-sm"
              />
            </div>
            <Button size="lg" onClick={handleShorten} disabled={creating}>
              {creating ? <><Loader2 size={16} className="animate-spin mr-2" /> Creating...</> : "Shorten Now"}
            </Button>
          </div>

          {createError && (
            <p className="text-sm text-destructive font-medium bg-destructive/10 rounded-lg px-3 py-2 mb-4">{createError}</p>
          )}

          {/* Result */}
          {shortened && (
            <div className="flex items-center justify-between bg-card rounded-xl p-4 border border-border shadow-card mb-6 animate-in fade-in-0 slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                  <Check size={16} className="text-success" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-success uppercase tracking-wide">Short Link Created</p>
                  <a href={shortened.shortUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-foreground hover:text-primary">
                    {shortened.shortUrl}
                  </a>
                </div>
              </div>
              <Button size="sm" className="gap-2" onClick={() => handleCopy(shortened.shortUrl)}>
                {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Link</>}
              </Button>
            </div>
          )}

          {/* Recent Links */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">Your Recent Links</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>View All</Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 size={28} className="animate-spin text-primary" />
              </div>
            ) : recentUrls.length === 0 ? (
              <div className="bg-card rounded-xl border border-border shadow-card p-8 text-center">
                <Link2 size={36} className="mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground">No links yet. Create your first one above!</p>
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Original Link</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Short Link</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Clicks</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUrls.map((link, i) => (
                      <tr key={link._id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                        <td className="px-5 py-4 text-muted-foreground max-w-[200px] truncate" title={link.longUrl}>{link.longUrl}</td>
                        <td className="px-5 py-4">
                          <a
                            href={`${backendBase}/${link.shortId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary font-medium hover:underline flex items-center gap-1"
                          >
                            {link.shortId} <ExternalLink size={12} />
                          </a>
                        </td>
                        <td className="px-5 py-4 font-medium text-foreground">{(link.clicks || 0).toLocaleString()}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleCopy(`${backendBase}/${link.shortId}`, i)}
                              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                              title="Copy"
                            >
                              {copiedIdx === i ? <Check size={15} /> : <Copy size={15} />}
                            </button>
                            <button
                              onClick={() => handleDelete(link.shortId)}
                              disabled={deleting === link.shortId}
                              className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                              title="Delete"
                            >
                              {deleting === link.shortId ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ShortenerPage;
