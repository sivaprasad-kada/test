import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { Link2, Eye, EyeOff, Zap, Shield, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";

const LoginPage = () => {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  // Backend base URL for OAuth
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // If already logged in, redirect to dashboard
  if (user) return <Navigate to="/dashboard" replace />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      await login(loginEmail, loginPassword);
      navigate("/dashboard");
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData?.details && Array.isArray(errorData.details)) {
        setLoginError(errorData.details.map((d: any) => d.message).join(". "));
      } else {
        setLoginError(errorData?.error || "Login failed. Please try again.");
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    if (regPassword.length < 6) {
      setRegError("Password must be at least 6 characters.");
      return;
    }
    setRegLoading(true);
    try {
      await register(regName, regEmail, regPassword);
      navigate("/dashboard");
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData?.details && Array.isArray(errorData.details)) {
        setRegError(errorData.details.map((d: any) => d.message).join(". "));
      } else {
        setRegError(errorData?.error || "Registration failed. Please try again.");
      }
    } finally {
      setRegLoading(false);
    }
  };

  const handleOAuth = (provider: "google" | "github") => {
    window.location.href = `${apiBase}/auth/${provider}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="flex items-center justify-between px-6 md:px-8 h-16 max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Link2 size={18} className="text-primary-foreground" />
          </div>
          <span>Shortly</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <a href="#" className="text-muted-foreground hover:text-foreground">Resources</a>
          <Button size="sm">Support</Button>
        </div>
      </nav>

      <div className="w-full max-w-md mx-auto px-6 py-16">
        {isLogin ? (
          <div className="bg-card rounded-2xl border border-border shadow-card p-10 animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-3xl font-black text-foreground mb-2">Welcome Back</h2>
            <p className="text-muted-foreground mb-8">Continue your journey with Shortly.</p>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Email Address</label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  className="w-full h-12 px-4 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="w-full h-12 px-4 pr-12 rounded-lg border border-border bg-background text-foreground outline-none focus:ring-2 focus:ring-ring text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {loginError && (
                <p className="text-sm text-destructive font-medium bg-destructive/10 rounded-lg px-3 py-2">{loginError}</p>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={loginLoading}>
                {loginLoading ? <><Loader2 size={18} className="animate-spin mr-2" /> Logging In...</> : "Log In"}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-center text-sm text-muted-foreground mb-4">Or continue with</p>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-12 flex items-center gap-2 font-medium" onClick={() => handleOAuth("google")}>
                  <FcGoogle className="text-xl" /> Google
                </Button>
                <Button variant="outline" className="h-12 flex items-center gap-2 font-medium" onClick={() => handleOAuth("github")}>
                  <FaGithub className="text-xl" /> GitHub
                </Button>
              </div>
            </div>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button type="button" onClick={() => setIsLogin(false)} className="text-primary font-medium hover:underline">
                Sign up
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border shadow-card p-10 animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-3xl font-black text-foreground mb-2">Join Shortly Today</h2>
            <p className="text-muted-foreground mb-8">Create an account to start shortening links. Free forever.</p>

            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Full Name</label>
                <input
                  type="text"
                  placeholder="Alex Johnson"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                  className="w-full h-12 px-4 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Work Email</label>
                <input
                  type="email"
                  placeholder="alex@company.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                  className="w-full h-12 px-4 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Password</label>
                <input
                  type="password"
                  placeholder="Create a strong password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  className="w-full h-12 px-4 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2">Must be at least 6 characters.</p>
              </div>

              {regError && (
                <p className="text-sm text-destructive font-medium bg-destructive/10 rounded-lg px-3 py-2">{regError}</p>
              )}

              <p className="text-xs text-muted-foreground">
                By clicking "Create Account", you agree to our <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
              </p>
              <Button type="submit" size="lg" className="w-full bg-foreground text-background hover:bg-foreground/90" disabled={regLoading}>
                {regLoading ? <><Loader2 size={18} className="animate-spin mr-2" /> Creating...</> : "Create Account"}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-center text-sm text-muted-foreground mb-4">Or sign up with</p>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-12 flex items-center gap-2 font-medium" onClick={() => handleOAuth("google")}>
                  <FcGoogle className="text-xl" /> Google
                </Button>
                <Button variant="outline" className="h-12 flex items-center gap-2 font-medium" onClick={() => handleOAuth("github")}>
                  <FaGithub className="text-xl" /> GitHub
                </Button>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              {[
                { icon: Zap, label: "FAST SETUP" },
                { icon: Shield, label: "SECURE" },
                { icon: RefreshCw, label: "SYNC EVERYWHERE" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <Icon size={20} className="text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button type="button" onClick={() => setIsLogin(true)} className="text-primary font-medium hover:underline">
                Log in
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="py-8 px-6 text-center border-t border-border">
        <p className="text-sm text-muted-foreground mb-4">© 2024 Shortly Inc. All rights reserved. Trusted by over 10,000+ teams worldwide.</p>
        <div className="flex justify-center gap-6">
          {["Privacy", "Terms", "Cookies", "Contact"].map((link) => (
            <a key={link} href="#" className="text-sm text-muted-foreground hover:text-foreground">{link}</a>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
