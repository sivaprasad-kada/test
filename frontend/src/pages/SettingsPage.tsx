import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Mail, ShieldAlert } from "lucide-react";

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch {
      navigate("/login");
    }
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <div className="max-w-2xl mx-auto w-full">
          <h1 className="text-3xl font-black text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account settings and preferences.</p>

          <div className="mt-8 space-y-6">
            {/* Profile Section */}
            <div className="bg-card rounded-xl border border-border shadow-card p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
                    {initials}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{user?.name || "User"}</h3>
                    <p className="text-sm text-muted-foreground">{user?.email || "No email provided"}</p>
                  </div>
                </div>
                <Button variant="destructive" onClick={handleLogout} className="gap-2 self-start sm:self-auto">
                  <LogOut size={16} /> Logout
                </Button>
              </div>

              <div className="space-y-4 border-t border-border pt-6">
                <div className="flex items-center gap-3">
                  <User size={16} className="text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Name</p>
                    <p className="text-foreground font-medium mt-0.5">{user?.name || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Address</p>
                    <p className="text-foreground font-medium mt-0.5">{user?.email || "N/A"}</p>
                  </div>
                </div>

                {user?.provider && (
                  <div className="flex items-center gap-3">
                    <ShieldAlert size={16} className="text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Authentication Provider</p>
                      <p className="text-foreground font-medium mt-0.5 capitalize">{user.provider}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Preferences Section */}
            <div className="bg-card rounded-xl border border-border shadow-card p-6">
              <h3 className="text-lg font-bold text-foreground mb-1">Preferences</h3>
              <p className="text-sm text-muted-foreground mb-4">Customize your dashboard experience.</p>
              <div className="flex items-center justify-between py-2 border-t border-border pt-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Developer Mode</p>
                  <p className="text-xs text-muted-foreground">Show advanced API information for shortened URLs.</p>
                </div>
                <Button variant="outline" size="sm" disabled>Disabled</Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
