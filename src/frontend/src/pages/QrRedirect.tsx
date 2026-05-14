import { useActor } from "@caffeineai/core-infrastructure";
import { useEffect, useState } from "react";
import { createActor } from "../backend";

type State = "loading" | "redirecting" | "error";

function LoadingView({ redirecting }: { redirecting: boolean }) {
  return (
    <div
      data-ocid="qr-redirect.loading_state"
      className="flex flex-col items-center gap-5 text-center px-6"
    >
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full border-[3px] border-primary/20" />
        <div className="absolute inset-0 rounded-full border-[3px] border-primary border-t-transparent animate-spin" />
      </div>
      <div className="space-y-1">
        <p className="text-lg font-display font-semibold text-foreground tracking-tight">
          {redirecting ? "Redirecting…" : "Loading…"}
        </p>
        <p className="text-sm text-muted-foreground">
          Taking you to your destination
        </p>
      </div>
    </div>
  );
}

function ErrorView() {
  return (
    <div
      data-ocid="qr-redirect.error_state"
      className="flex flex-col items-center gap-6 text-center px-6 max-w-sm"
    >
      <div
        role="img"
        aria-label="Warning icon"
        className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-destructive"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <div className="space-y-2">
        <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
          QR Code Not Found
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This QR code link may have expired or been removed. Check that you
          have the correct link and try again.
        </p>
      </div>
      <a
        href="/"
        data-ocid="qr-redirect.link"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition-smooth hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Go to QR Code Generator
      </a>
    </div>
  );
}

export function QrRedirectPage({ id }: { id: string }) {
  const { actor, isFetching } = useActor(
    createActor as Parameters<typeof useActor>[0],
  );
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    if (!actor || isFetching) return;

    let cancelled = false;

    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (actor as any).getQrForRedirect(id);
        if (cancelled) return;

        // Motoko Option: [] = None, [{url: string}] = Some
        if (Array.isArray(result) && result.length > 0 && result[0]?.url) {
          setState("redirecting");
          window.location.href = result[0].url;
        } else {
          setState("error");
        }
      } catch {
        if (!cancelled) setState("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [actor, isFetching, id]);

  return (
    <div
      data-ocid="qr-redirect.page"
      className="min-h-screen flex flex-col items-center justify-center bg-background"
    >
      {(state === "loading" || state === "redirecting") && (
        <LoadingView redirecting={state === "redirecting"} />
      )}
      {state === "error" && <ErrorView />}
    </div>
  );
}
