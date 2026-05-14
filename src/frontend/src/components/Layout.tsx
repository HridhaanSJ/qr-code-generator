import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LogIn,
  LogOut,
  Menu,
  Moon,
  QrCode,
  ShieldCheck,
  Sun,
  User,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { type ReactNode, useEffect, useState } from "react";
import { TickerBar } from "./TickerBar";

interface LayoutProps {
  children: ReactNode;
}

function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render a placeholder to avoid layout shift
    return (
      <button
        type="button"
        className="p-2 rounded-md text-muted-foreground transition-colors"
        aria-label="Toggle theme"
      >
        <Sun className="h-4 w-4" />
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      data-ocid="theme-toggle"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export function Layout({ children }: LayoutProps) {
  const { identity, login, clear, isLoggingIn, isInitializing } =
    useInternetIdentity();
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouterState();
  const currentPath = router.location.pathname;

  const isLoggedIn = !!identity;

  const navLinks = [
    { to: "/", label: "Generator", icon: QrCode },
    ...(isLoggedIn ? [{ to: "/profile", label: "My QRs", icon: User }] : []),
    // Admin link shown to all authenticated users — /admin page handles its own access control
    ...(isLoggedIn
      ? [{ to: "/admin", label: "Admin", icon: ShieldCheck }]
      : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm group-hover:bg-primary/90 transition-colors">
              <QrCode className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-foreground tracking-tight hidden sm:inline">
              QRGen
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav
            className="hidden md:flex items-center gap-1 flex-1 justify-center"
            data-ocid="main-nav"
          >
            {navLinks.map(({ to, label, icon: Icon }) => {
              const active = currentPath === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right side: Theme toggle + Auth */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Theme toggle — visible on all screen sizes */}
            <ThemeToggle />

            {/* Auth button — desktop only */}
            {isLoggedIn ? (
              <Button
                variant="outline"
                size="sm"
                onClick={clear}
                className="hidden md:flex items-center gap-1.5 ml-1"
                data-ocid="logout-btn"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={login}
                disabled={isLoggingIn || isInitializing}
                className="hidden md:flex items-center gap-1.5 ml-1"
                data-ocid="login-btn"
              >
                <LogIn className="h-4 w-4" />
                {isLoggingIn ? "Signing in…" : "Sign In"}
              </Button>
            )}

            {/* Mobile menu toggle */}
            <button
              type="button"
              className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileOpen && (
          <div
            className="md:hidden border-t border-border bg-card px-4 py-3 space-y-1"
            data-ocid="mobile-nav"
          >
            {navLinks.map(({ to, label, icon: Icon }) => {
              const active = currentPath === to;
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
            <Separator className="my-2" />
            {isLoggedIn ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  clear();
                  setMobileOpen(false);
                }}
                className="w-full justify-start gap-2"
                data-ocid="mobile-logout-btn"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  login();
                  setMobileOpen(false);
                }}
                disabled={isLoggingIn || isInitializing}
                className="w-full justify-start gap-2"
                data-ocid="mobile-login-btn"
              >
                <LogIn className="h-4 w-4" />
                {isLoggingIn ? "Signing in…" : "Sign In"}
              </Button>
            )}
          </div>
        )}
      </header>

      {/* ── Main Content ────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col bg-background">{children}</main>

      {/* ── Ticker Bar ──────────────────────────────────────────── */}
      <TickerBar />

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="bg-card border-t border-border py-4 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} QRGen. All rights reserved.</span>
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Built with love using caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
