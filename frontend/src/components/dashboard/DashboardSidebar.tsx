import { Link, useLocation, useNavigate } from "react-router-dom";
import { Link2, LayoutGrid, LinkIcon, BarChart3, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { name: "Overview", icon: LayoutGrid, path: "/dashboard" },
  { name: "My Links", icon: LinkIcon, path: "/shortener" },
  { name: "Analytics", icon: BarChart3, path: "/analytics" },
  { name: "Settings", icon: Settings, path: "/dashboard" },
];

const DashboardSidebar = () => {
  const location = useLocation();
  // console.log("Current:", location);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch {
      // still redirect
      navigate("/login");
    }
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";
  return (
    <aside className="hidden md:flex flex-col w-56 bg-card border-r border-border h-screen sticky top-0 p-4">
      <Link to="/" className="flex items-center gap-2 font-bold text-lg mb-1 px-2">
        <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
          <Link2 size={14} className="text-primary-foreground" />
        </div>
        <span>Shortly</span>
      </Link>
      <p className="text-xs text-muted-foreground px-2 mb-6">Link Management</p>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.path ||
            (item.path === "/analytics" && location.pathname.startsWith("/analytics"));
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 px-3 py-3 border-t border-border mt-4 pt-4">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{user?.name || "User"}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
        </div>
        <button onClick={handleLogout} title="Logout">
          <LogOut size={16} className="text-muted-foreground hover:text-foreground cursor-pointer" />
        </button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
