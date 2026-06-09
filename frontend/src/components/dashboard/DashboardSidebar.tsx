import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Link2, LayoutGrid, LinkIcon, BarChart3, Settings, LogOut, Menu, ChevronLeft, ChevronRight, Sun, Moon, CreditCard } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
 
const navItems = [
  { name: "Overview", icon: LayoutGrid, path: "/dashboard" },
  { name: "My Links", icon: LinkIcon, path: "/shortener" },
  { name: "Analytics", icon: BarChart3, path: "/analytics" },
  { name: "Billing", icon: CreditCard, path: "/dashboard/billing" },
  { name: "Settings", icon: Settings, path: "/settings" },
];

const DashboardSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Desktop collapse state
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved === "true";
  });

  const [isOpen, setIsOpen] = useState(false); // Mobile sheet state

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  };

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

  // Navigation menu rendering helper (shared between desktop and mobile sidebar)
  const renderNavLinks = (showText: boolean, onItemClick?: () => void) => (
    <nav className="flex-1 space-y-1">
      {navItems.map((item) => {
        const active = location.pathname === item.path ||
          (item.path === "/analytics" && location.pathname.startsWith("/analytics"));
        return (
          <Link
            key={item.name}
            to={item.path}
            onClick={onItemClick}
            title={!showText ? item.name : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            } ${!showText ? "justify-center px-0" : ""}`}
          >
            <item.icon size={18} className="shrink-0" />
            {showText && <span>{item.name}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* ─── Mobile / Tablet Header ──────────────────────── */}
      <header className="lg:hidden flex items-center justify-between h-16 px-4 bg-card border-b border-border w-full sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Link2 size={16} className="text-primary-foreground" />
          </div>
          <span>Shortly</span>
        </Link>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground"
            title={theme === "light" ? "Dark Mode" : "Light Mode"}
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </Button>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-foreground">
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col h-full w-64 bg-card border-r border-border p-4">
              <div className="flex items-center gap-2 font-bold text-lg mb-1 px-2">
                <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                  <Link2 size={14} className="text-primary-foreground" />
                </div>
                <SheetTitle className="text-lg font-bold text-foreground">Shortly</SheetTitle>
              </div>
              <p className="text-xs text-muted-foreground px-2 mb-6">Link Management</p>

              {renderNavLinks(true, () => setIsOpen(false))}

              <div className="flex items-center gap-3 px-3 py-3 border-t border-border mt-4 pt-4">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{user?.name || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={toggleTheme} title={theme === "light" ? "Dark Mode" : "Light Mode"}>
                    {theme === "light" ? <Moon size={16} className="text-muted-foreground hover:text-foreground cursor-pointer" /> : <Sun size={16} className="text-muted-foreground hover:text-foreground cursor-pointer" />}
                  </button>
                  <button onClick={handleLogout} title="Logout">
                    <LogOut size={16} className="text-muted-foreground hover:text-foreground cursor-pointer" />
                  </button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* ─── Desktop Sidebar ─────────────────────────────── */}
      <aside
        className={`hidden lg:flex flex-col bg-card border-r border-border h-screen sticky top-0 transition-all duration-300 z-30 p-4 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className={`flex items-center justify-between mb-1 px-2 ${isCollapsed ? "justify-center" : ""}`}>
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <Link2 size={14} className="text-primary-foreground" />
            </div>
            {!isCollapsed && <span>Shortly</span>}
          </Link>
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={toggleCollapse}
              title="Collapse sidebar"
            >
              <ChevronLeft size={16} />
            </Button>
          )}
        </div>

        {!isCollapsed && <p className="text-xs text-muted-foreground px-2 mb-6">Link Management</p>}
        {isCollapsed && (
          <div className="flex justify-center mb-6 mt-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={toggleCollapse}
              title="Expand sidebar"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        )}

        {renderNavLinks(!isCollapsed)}

        <div className={`flex flex-col border-t border-border mt-4 pt-4 gap-2 ${isCollapsed ? "items-center" : ""}`}>
          {isCollapsed && (
            <button
              onClick={toggleTheme}
              className="p-2 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg hover:bg-secondary"
              title={theme === "light" ? "Dark Mode" : "Light Mode"}
            >
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          )}
          <div className={`flex items-center w-full ${isCollapsed ? "justify-center animate-none" : "gap-3 px-3 py-3"}`}>
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0" title={`${user?.name || "User"} (${user?.email || ""})`}>
              {initials}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
              </div>
            )}
            {!isCollapsed && (
              <div className="flex items-center gap-2.5">
                <button onClick={toggleTheme} title={theme === "light" ? "Dark Mode" : "Light Mode"}>
                  {theme === "light" ? <Moon size={16} className="text-muted-foreground hover:text-foreground cursor-pointer" /> : <Sun size={16} className="text-muted-foreground hover:text-foreground cursor-pointer" />}
                </button>
                <button onClick={handleLogout} title="Logout">
                  <LogOut size={16} className="text-muted-foreground hover:text-foreground cursor-pointer" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;
