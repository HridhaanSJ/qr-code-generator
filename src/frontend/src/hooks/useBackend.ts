import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createActor } from "../backend";
import type {
  DripTemplate,
  EmailSignup,
  QrEntry,
  StylePreset,
  TickerMessage,
} from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useBackendActor() {
  return useActor(createActor as Parameters<typeof useActor>[0]);
}

// ─── QR Entries ─────────────────────────────────────────────────────────────

export function useMyQrEntries() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<QrEntry[]>({
    queryKey: ["myQrEntries"],
    queryFn: async () => {
      if (!actor) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).getMyQrEntries();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (result as any[]).map((e: any) => ({
        id: e.id,
        userId: e.userId.toString(),
        url: e.url,
        generatedAt: e.generatedAt,
        notes: e.notes,
        // compositeImage is stored as opt text in backend; unwrap Motoko opt []
        compositeImage:
          Array.isArray(e.compositeImage) && e.compositeImage.length > 0
            ? (e.compositeImage[0] as string)
            : typeof e.compositeImage === "string"
              ? e.compositeImage
              : undefined,
      })) as QrEntry[];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveQrEntry() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      url: string;
      notes: string;
      compositeImageData?: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).saveQrEntry(
        params.url,
        params.notes,
        params.compositeImageData ?? null,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myQrEntries"] });
    },
  });
}

export function useDeleteQrEntry() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).deleteQrEntry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myQrEntries"] });
    },
  });
}

// ─── My Stats ────────────────────────────────────────────────────────────────

export interface StatsDatum {
  date: string; // "YYYY-MM-DD"
  count: number;
}

export function useGetMyStats() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<StatsDatum[]>({
    queryKey: ["myStats"],
    queryFn: async () => {
      if (!actor) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).getMyStats();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (result as any[]).map((item: any) => ({
        date: item.date as string,
        count: Number(item.count),
      })) as StatsDatum[];
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Email Signups ───────────────────────────────────────────────────────────

export function useSignUpForEmail() {
  const { actor } = useBackendActor();
  return useMutation({
    mutationFn: async (params: { firstName: string; email: string }) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).signUpForEmail(params.firstName, params.email);
    },
  });
}

export function useEmailSignups() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<EmailSignup[]>({
    queryKey: ["emailSignups"],
    queryFn: async () => {
      if (!actor) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).getEmailSignups();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (result as any[]).map((e: any) => ({
        firstName: e.firstName as string,
        email: e.email as string,
        signedUpAt: e.signedUpAt,
      })) as EmailSignup[];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRemoveEmailSignup() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (email: string) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).removeEmailSignup(email);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailSignups"] });
    },
  });
}

// ─── Ticker Messages ─────────────────────────────────────────────────────────

export function useTickerMessages() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<TickerMessage[]>({
    queryKey: ["tickerMessages"],
    queryFn: async () => {
      if (!actor) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).getTickerMessages();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (result as any[]).map((m: any) => ({
        id: m.id,
        message: m.message,
      })) as TickerMessage[];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddTickerMessage() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (message: string) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).addTickerMessage(message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickerMessages"] });
    },
  });
}

export function useUpdateTickerMessage() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: bigint; message: string }) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).updateTickerMessage(params.id, params.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickerMessages"] });
    },
  });
}

export function useDeleteTickerMessage() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).deleteTickerMessage(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickerMessages"] });
    },
  });
}

// ─── Admin Stats ─────────────────────────────────────────────────────────────

export function useGetAdminStats() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<{ date: string; count: number }[]>({
    queryKey: ["adminStats"],
    queryFn: async () => {
      if (!actor) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).getAdminStats();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (result as any[]).map((e: any) => ({
        date: e.date as string,
        count: Number(e.count),
      }));
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export function useClaimAdmin() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).claimAdmin();
    },
    onSuccess: () => {
      // refetchQueries forces an immediate re-fetch rather than just marking stale
      queryClient.refetchQueries({ queryKey: ["adminPrincipal"] });
    },
  });
}

export function useAdminPrincipal() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<string | null>({
    queryKey: ["adminPrincipal"],
    queryFn: async () => {
      if (!actor) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).getAdminPrincipal();
      // getAdminPrincipal() returns Principal | null directly (not an array)
      if (!result) return null;
      return result.toString();
    },
    enabled: !!actor && !isFetching,
    // No staleTime — admin principal must always be fresh so claim + refetch works immediately
  });
}

// ─── Style Presets ───────────────────────────────────────────────────────────

export function useGetStylePresets() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<StylePreset[]>({
    queryKey: ["stylePresets"],
    queryFn: async () => {
      if (!actor) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).getStylePresets();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (result as any[]).map((p: any) => ({
        id: p.id,
        name: p.name as string,
        dotColor: p.dotColor as string,
        bgColor: p.bgColor as string,
        logoData: typeof p.logoData === "string" ? p.logoData : null,
      })) as StylePreset[];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveStylePreset() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      name: string;
      dotColor: string;
      bgColor: string;
      logoData: string | null;
    }) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).saveStylePreset(
        params.name,
        params.dotColor,
        params.bgColor,
        params.logoData,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stylePresets"] });
    },
  });
}

export function useDeleteStylePreset() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).deleteStylePreset(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stylePresets"] });
    },
  });
}

// ─── Drip Email Templates ─────────────────────────────────────────────────────

export function useGetDripTemplates() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<DripTemplate[]>({
    queryKey: ["dripTemplates"],
    queryFn: async () => {
      if (!actor) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).getDripTemplates();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (result as any[]).map((t: any) => ({
        id: t.id,
        name: t.name as string,
        delayDays: t.delayDays,
        subject: t.subject as string,
        htmlBody: t.htmlBody as string,
        version: t.version,
        updatedAt: t.updatedAt,
      })) as DripTemplate[];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateDripTemplate() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: bigint;
      subject: string;
      htmlBody: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).updateDripTemplate(
        params.id,
        params.subject,
        params.htmlBody,
      );
      // Backend returns async Bool: true = success, false = failure
      if (result === false) throw new Error("Failed to update template");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dripTemplates"] });
    },
  });
}

// ─── Analytics Access ─────────────────────────────────────────────────────────

export function useGetAnalyticsAccess() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<boolean>({
    queryKey: ["analyticsAccess"],
    queryFn: async () => {
      if (!actor) return false;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getAnalyticsAccess() as Promise<boolean>;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMyClickCounts() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<Map<string, number>>({
    queryKey: ["myClickCounts"],
    queryFn: async () => {
      if (!actor) return new Map();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (await (actor as any).getMyClickCounts()) as Array<
        [string, bigint]
      >;
      return new Map(result.map(([k, v]) => [k, Number(v)]));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUnlockAnalytics() {
  const { actor } = useBackendActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (blockHeight: bigint) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).unlockAnalytics(blockHeight);
      if (result && result.__kind__ === "err") throw new Error(result.err);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analyticsAccess"] });
    },
  });
}

// ─── Payment Ledger ───────────────────────────────────────────────────────────

export interface PaymentRecord {
  userId: string;
  timestamp: bigint;
  amountE8s: bigint;
}

export function useGetPaymentLedger() {
  const { actor, isFetching } = useBackendActor();
  return useQuery<PaymentRecord[]>({
    queryKey: ["paymentLedger"],
    queryFn: async () => {
      if (!actor) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).getPaymentLedger();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (result as any[]).map((r: any) => ({
        userId: r.userId.toString(),
        timestamp: BigInt(r.timestamp),
        amountE8s: BigInt(r.amountE8s),
      })) as PaymentRecord[];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useBroadcastToSubscribers() {
  const { actor } = useBackendActor();
  return useMutation({
    mutationFn: async (params: {
      subject: string;
      body: string;
    }): Promise<number> => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = await (actor as any).broadcastToSubscribers(
        params.subject,
        params.body,
      );
      // Backend returns a JSON-encoded Result: '{"ok":42}' or '{"err":"..."}'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let parsed: any;
      try {
        parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      } catch {
        parsed = raw;
      }
      if (parsed && "err" in parsed) throw new Error(String(parsed.err));
      if (parsed && "ok" in parsed) return Number(parsed.ok);
      // Fallback: if raw is already a number
      return Number(raw);
    },
  });
}
