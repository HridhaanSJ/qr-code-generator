import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  adminPrincipal?: string | null;
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
  adminPrincipal,
}: ProtectedRouteProps) {
  const { identity, isInitializing } = useInternetIdentity();

  // Still loading identity from storage
  if (isInitializing) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return <Navigate to="/" />;
  }

  if (requireAdmin && adminPrincipal !== undefined) {
    const userPrincipal = identity.getPrincipal().toString();
    if (!adminPrincipal || userPrincipal !== adminPrincipal) {
      return <Navigate to="/" />;
    }
  }

  return <>{children}</>;
}
