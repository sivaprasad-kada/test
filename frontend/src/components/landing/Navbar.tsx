import { Link } from "react-router-dom";
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const Navbar = () => {
  const { user } = useAuth();

  return (
    <nav className="flex items-center justify-between px-6 md:px-8 h-16 max-w-7xl mx-auto">
      <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Link2 size={18} className="text-primary-foreground" />
        </div>
        <span>Shortly</span>
      </Link>
      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
        <Link to="/" className="hover:text-foreground transition-colors">Features</Link>
        <Link to="/" className="hover:text-foreground transition-colors">Pricing</Link>
        <Link to="/" className="hover:text-foreground transition-colors">Analytics</Link>
        <Link to="/" className="hover:text-foreground transition-colors">Enterprise</Link>
      </div>
      <div className="hidden md:flex items-center gap-3">
        {user ? (
          <Link to="/dashboard">
            <Button size="sm">Dashboard</Button>
          </Link>
        ) : (
          <>
            <Link to="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link to="/login">
              <Button size="sm">Sign Up Free</Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
