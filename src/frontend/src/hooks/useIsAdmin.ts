import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useAdminPrincipal } from "./useBackend";

/**
 * Returns { isAdmin, isLoading } for the currently signed-in user.
 *
 * isLoading is ONLY true while the adminPrincipal query is actively fetching.
 * Once the query resolves (even to null = no admin set), isLoading becomes false.
 */
export function useIsAdmin(): { isAdmin: boolean; isLoading: boolean } {
  const { identity } = useInternetIdentity();
  const { data: adminPrincipal, isLoading } = useAdminPrincipal();

  // Still fetching admin principal from backend — report loading
  if (isLoading) {
    return { isAdmin: false, isLoading: true };
  }

  // Query done. If no admin is set yet, user is not admin (but not loading)
  if (!adminPrincipal) {
    return { isAdmin: false, isLoading: false };
  }

  // No identity → not admin
  if (!identity) {
    return { isAdmin: false, isLoading: false };
  }

  const principalStr = identity.getPrincipal().toString();
  // Anonymous principal — never admin
  if (!principalStr || principalStr === "2vxsx-fae") {
    return { isAdmin: false, isLoading: false };
  }

  const isAdmin = principalStr === adminPrincipal;
  return { isAdmin, isLoading: false };
}
