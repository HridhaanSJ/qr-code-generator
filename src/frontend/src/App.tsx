import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Suspense, lazy } from "react";
import { Layout } from "./components/Layout";
import { QrRedirectPage } from "./pages/QrRedirect";

// Lazy-load pages
const GeneratorPage = lazy(() =>
  import("./pages/Generator").then((m) => ({ default: m.GeneratorPage })),
);
const ProfilePage = lazy(() =>
  import("./pages/Profile").then((m) => ({ default: m.ProfilePage })),
);
const AdminPage = lazy(() =>
  import("./pages/Admin").then((m) => ({ default: m.AdminPage })),
);

function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center py-24">
      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// Single root — no Layout at root level so /qr/:id can bypass it
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Layout wrapper route — parent for all pages that need the full app shell
const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "layout",
  component: () => (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </Layout>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <GeneratorPage />
    </Suspense>
  ),
});

const profileRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/profile",
  validateSearch: (search: Record<string, unknown>) => ({
    query: typeof search.query === "string" ? search.query : undefined,
  }),
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <ProfilePage />
    </Suspense>
  ),
});

const adminRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/admin",
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <AdminPage />
    </Suspense>
  ),
});

// Public QR redirect — no Layout wrapper, no auth required
const qrRedirectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/qr/$id",
  component: function QrRedirectRoute() {
    const { id } = qrRedirectRoute.useParams();
    return <QrRedirectPage id={id} />;
  },
});

const routeTree = rootRoute.addChildren([
  layoutRoute.addChildren([indexRoute, profileRoute, adminRoute]),
  qrRedirectRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
