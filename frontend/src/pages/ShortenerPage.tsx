import { useState, useEffect } from "react";
import { Link2, Copy, Check, Loader2, Trash2, ExternalLink, QrCode, Lock, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import api, { backendBase } from "@/api/axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface UrlItem {
  _id: string;
  shortId: string;
  longUrl: string;
  clicks: number;
  createdAt: string;
}

const ShortenerPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [url, setUrl] = useState("");
  const [shortened, setShortened] = useState<{ shortId: string; shortUrl: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const [urls, setUrls] = useState<UrlItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Custom Alias states
  const [useCustomAlias, setUseCustomAlias] = useState(false);
  const [customAlias, setCustomAlias] = useState("");
  const [aliasAvailable, setAliasAvailable] = useState<boolean | null>(null);
  const [checkingAlias, setCheckingAlias] = useState(false);

  // QR Code Modal states
  const [qrLink, setQrLink] = useState<{ id: string; shortId: string; shortUrl: string } | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);

  // Upgrade Modal state for Free users
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const isPro = user?.plan === "PRO";



  const fetchUrls = async () => {
    try {
      const res = await api.get("/url");
      setUrls(res.data);
    } catch (err: unknown) {
      const axiosError = err as { response?: { status?: number } };
      if (axiosError.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUrls();
  }, []);

  // Debounced Custom Alias checking
  useEffect(() => {
    if (!useCustomAlias || !customAlias.trim() || !isPro) {
      setAliasAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingAlias(true);
      try {
        const res = await api.get(`/alias/check/${customAlias.trim()}`);
        setAliasAvailable(res.data.available);
      } catch {
        setAliasAvailable(false);
      } finally {
        setCheckingAlias(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [customAlias, useCustomAlias, isPro]);

  // Securely fetch QR Code Blob using session cookies
  useEffect(() => {
    if (!qrModalOpen || !qrLink) {
      setQrImageUrl(null);
      return;
    }

    const fetchQrBlob = async () => {
      setLoadingQr(true);
      try {
        const res = await api.get(`/links/${qrLink.id}/qrcode`, {
          responseType: "blob",
        });
        const blobUrl = URL.createObjectURL(res.data);
        setQrImageUrl(blobUrl);
      } catch (err) {
        console.error("[QR Code] Error loading QR image:", err);
      } finally {
        setLoadingQr(false);
      }
    };

    fetchQrBlob();

    return () => {
      if (qrImageUrl) {
        URL.revokeObjectURL(qrImageUrl);
      }
    };
  }, [qrModalOpen, qrLink]);

  const handleShorten = async () => {
    if (!url.trim()) return;
    setCreating(true);
    setCreateError("");
    setShortened(null);
    try {
      const payload: any = { url: url.trim() };
      if (isPro && useCustomAlias && customAlias.trim()) {
        payload.customAlias = customAlias.trim();
      }

      const res = await api.post("/url", payload);
      setShortened({ shortId: res.data.shortId, shortUrl: res.data.shortUrl });
      setUrl("");
      setCustomAlias("");
      setUseCustomAlias(false);
      // refresh the list
      fetchUrls();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string; details?: Array<{ message: string }> } } };
      const errorData = axiosError.response?.data;
      if (errorData?.details && Array.isArray(errorData.details)) {
        setCreateError(errorData.details.map((d) => d.message).join(". "));
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

  const handleQrClick = (link: UrlItem) => {
    if (!isPro) {
      setUpgradeModalOpen(true);
    } else {
      setQrLink({
        id: link._id,
        shortId: link.shortId,
        shortUrl: `${backendBase}/${link.shortId}`,
      });
      setQrModalOpen(true);
    }
  };

  const handleDownloadQr = () => {
    if (!qrImageUrl || !qrLink) return;
    const a = document.createElement("a");
    a.href = qrImageUrl;
    a.download = `qrcode-${qrLink.shortId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const recentUrls = urls.slice(0, 10);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-auto animate-fade-in">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-black text-foreground mb-3">Shorten your links instantly</h1>
            <p className="text-muted-foreground">Make your URLs clean, manageable, and trackable.</p>
          </div>

          {/* Shortener input container */}
          <div className="bg-card rounded-2xl p-4 shadow-card border border-border mb-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-secondary/35 rounded-xl p-2 border border-border/50">
              <div className="flex items-center gap-2 flex-1 pl-3 py-1.5 sm:py-0">
                <Link2 size={18} className="text-muted-foreground shrink-0" />
                <input
                  type="url"
                  placeholder="Paste your long link here"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleShorten()}
                  className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-sm min-w-0"
                />
              </div>
              <Button size="lg" onClick={handleShorten} disabled={creating} className="shadow-md w-full sm:w-auto">
                {creating ? <><Loader2 size={16} className="animate-spin mr-2" /> Creating...</> : "Shorten Now"}
              </Button>
            </div>

            {/* Custom Alias section */}
            {!isPro ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-secondary/15 rounded-xl border border-border/60 mt-3">
                <div className="flex items-center gap-2">
                  <Lock size={14} className="text-amber-500" />
                  <span className="text-sm font-semibold text-foreground">Custom Suffix Alias</span>
                  <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Pro</span>
                </div>
                <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-1.5">
                  Upgrade to Pro to customize aliases.
                  <Button variant="link" size="sm" className="h-auto p-0 font-bold" onClick={() => navigate("/dashboard/billing")}>
                    Upgrade
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-3 pt-3 border-t border-border/40">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="use-alias"
                    checked={useCustomAlias}
                    onChange={(e) => setUseCustomAlias(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                  />
                  <label htmlFor="use-alias" className="text-sm font-semibold text-foreground cursor-pointer select-none">
                    Use Custom Alias Suffix
                  </label>
                </div>

                {useCustomAlias && (
                  <div className="flex flex-wrap items-center gap-2 bg-secondary/10 border border-border rounded-xl p-2 pl-4 max-w-md animate-in fade-in-30 slide-in-from-top-1">
                    <span className="text-xs text-muted-foreground select-none truncate max-w-[180px] sm:max-w-none">
                      {backendBase.replace(/^https?:\/\//, "")}/
                    </span>
                    <input
                      type="text"
                      placeholder="my-alias"
                      value={customAlias}
                      onChange={(e) => setCustomAlias(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ""))}
                      className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-sm min-w-[80px]"
                    />
                    {checkingAlias && <Loader2 size={16} className="animate-spin text-muted-foreground mr-2" />}
                    {!checkingAlias && customAlias.trim().length > 0 && aliasAvailable !== null && (
                      <span className={`text-xs font-bold mr-2 ${aliasAvailable ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {aliasAvailable ? 'Available' : 'Taken / Reserved'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {createError && (
            <p className="text-sm text-destructive font-medium bg-destructive/10 rounded-lg px-3 py-2 mb-4">{createError}</p>
          )}

          {/* Result Card */}
          {shortened && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card rounded-xl p-4 border border-border shadow-card mb-6 animate-in fade-in-0 slide-in-from-top-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Check size={16} className="text-emerald-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wide">Short Link Created</p>
                  <a href={shortened.shortUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-foreground hover:text-primary break-all">
                    {shortened.shortUrl}
                  </a>
                </div>
              </div>
              <Button size="sm" className="gap-2 w-full sm:w-auto shrink-0" onClick={() => handleCopy(shortened.shortUrl)}>
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
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-sm">
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
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* QR Code button */}
                              <button
                                onClick={() => handleQrClick(link)}
                                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors relative"
                                title="QR Code"
                              >
                                <QrCode size={15} />
                                {!isPro && (
                                  <Lock size={8} className="absolute -bottom-0.5 -right-0.5 text-amber-500 bg-background rounded-full" />
                                )}
                              </button>
                              
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
              </div>
            )}
          </div>
        </div>
      </main>

      {/* QR Code Modal for Pro Users */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">QR Code</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Dynamic QR Code for short link suffix: <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">{qrLink?.shortId}</code>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6 bg-secondary/20 rounded-xl border border-border/60">
            {loadingQr ? (
              <div className="h-48 w-48 flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              </div>
            ) : qrImageUrl ? (
              <img src={qrImageUrl} alt="QR Code" className="h-48 w-48 bg-white p-2 rounded-lg shadow-md border" />
            ) : (
              <p className="text-sm text-destructive">Failed to load QR code</p>
            )}
            {qrLink && (
              <a 
                href={qrLink.shortUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="text-xs text-primary font-semibold hover:underline mt-4 flex items-center gap-1"
              >
                {qrLink.shortUrl.replace(/^https?:\/\//, "")} <ArrowUpRight size={12} />
              </a>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
            <Button variant="outline" onClick={() => setQrModalOpen(false)}>
              Close
            </Button>
            <Button onClick={handleDownloadQr} disabled={!qrImageUrl}>
              Download PNG
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upgrade Callout Modal for Free Users */}
      <Dialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
        <DialogContent className="sm:max-w-sm bg-card border border-border">
          <div className="text-center p-4">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-6 w-6 text-amber-500" />
            </div>
            <DialogTitle className="text-xl font-black text-foreground mb-2">Unlock Dynamic QR Codes</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mb-6">
              QR Code generation and custom suffix aliases are features reserved exclusively for our shortly PRO members.
            </DialogDescription>
            <div className="flex flex-col gap-2">
              <Button onClick={() => { setUpgradeModalOpen(false); navigate("/dashboard/billing"); }} className="w-full">
                Upgrade to Pro (₹299/mo)
              </Button>
              <Button variant="ghost" onClick={() => setUpgradeModalOpen(false)} className="w-full">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShortenerPage;
