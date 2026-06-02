import { Link, useNavigate } from "react-router-dom";
import { Link2, Menu, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";

const Navbar = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleAuthNavigation = async (target: "signup" | "login" | "dashboard") => {
    if (!user) {
      if (target === "signup") {
        navigate("/login?signup=true");
      } else {
        navigate("/login");
      }
      return;
    }

    try {
      await refreshUser();
      navigate("/dashboard");
    } catch {
      navigate("/login");
    }
  };

  return (
    <nav className="flex items-center justify-between px-6 md:px-8 h-16 max-w-7xl mx-auto">
      <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Link2 size={18} className="text-primary-foreground" />
        </div>
        <span>Shortly</span>
      </Link>
      
      {/* Desktop Menu */}
      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
        <Link to="/" className="hover:text-foreground transition-colors">Features</Link>
        <Link to="/" className="hover:text-foreground transition-colors">Pricing</Link>
        <Link to="/" className="hover:text-foreground transition-colors">Analytics</Link>
        <Link to="/" className="hover:text-foreground transition-colors">Enterprise</Link>
      </div>

      <div className="hidden md:flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-muted-foreground hover:text-foreground mr-1"
          title={theme === "light" ? "Dark Mode" : "Light Mode"}
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </Button>

        {user ? (
          <Button size="sm" onClick={() => handleAuthNavigation("dashboard")}>Dashboard</Button>
        ) : (
          <>
            <Button variant="ghost" size="sm" onClick={() => handleAuthNavigation("login")}>Log in</Button>
            <Button size="sm" onClick={() => handleAuthNavigation("signup")}>Sign Up Free</Button>
          </>
        )}
      </div>

      {/* Mobile Menu */}
      <div className="md:hidden flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-muted-foreground hover:text-foreground"
          title={theme === "light" ? "Dark Mode" : "Light Mode"}
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </Button>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu size={20} />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[350px]">
            <div className="flex flex-col gap-6 pt-10">
              <div className="flex flex-col gap-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Navigation</h2>
                <SheetClose asChild>
                  <Link to="/" className="text-base font-medium hover:text-primary transition-colors py-1.5">Features</Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link to="/" className="text-base font-medium hover:text-primary transition-colors py-1.5">Pricing</Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link to="/" className="text-base font-medium hover:text-primary transition-colors py-1.5">Analytics</Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link to="/" className="text-base font-medium hover:text-primary transition-colors py-1.5">Enterprise</Link>
                </SheetClose>
              </div>

              <div className="h-px bg-border my-2" />

              <div className="flex flex-col gap-3">
                {user ? (
                  <SheetClose asChild>
                    <Button 
                      className="w-full font-semibold"
                      onClick={() => handleAuthNavigation("dashboard")}
                    >
                      Dashboard
                    </Button>
                  </SheetClose>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Button 
                        variant="outline" 
                        className="w-full font-semibold"
                        onClick={() => handleAuthNavigation("login")}
                      >
                        Log in
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button 
                        className="w-full font-semibold text-white"
                        style={{
                          background: "linear-gradient(135deg, #2563EB 0%, #3b82f6 100%)",
                          boxShadow: "0 2px 10px rgba(37,99,235,0.2)",
                        }}
                        onClick={() => handleAuthNavigation("signup")}
                      >
                        Sign Up Free
                      </Button>
                    </SheetClose>
                  </>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
};

export default Navbar;
