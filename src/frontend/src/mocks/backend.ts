import type {
  DripEmailLog,
  DripTemplate as BackendDripTemplate,
  _CaffeineEmailUnsubscribeArgs,
  _CaffeineEmailUnsubscribeResult,
  backendInterface,
} from "../backend";

const mockDripTemplates: BackendDripTemplate[] = [
  {
    id: BigInt(1),
    name: "Welcome",
    delayDays: BigInt(0),
    subject: "Welcome to QRGen!",
    htmlBody: "<p>Hi {{firstName}},</p><p>Welcome! <a href=\"{{UNSUBSCRIBE_URL}}\">Unsubscribe</a></p>",
    version: BigInt(1),
    updatedAt: BigInt(Date.now()) * BigInt(1_000_000),
  },
  {
    id: BigInt(2),
    name: "Update 1",
    delayDays: BigInt(10),
    subject: "Getting started with QRGen",
    htmlBody: "<p>Hi {{firstName}},</p><p>Here are some tips. <a href=\"{{UNSUBSCRIBE_URL}}\">Unsubscribe</a></p>",
    version: BigInt(1),
    updatedAt: BigInt(Date.now()) * BigInt(1_000_000),
  },
  {
    id: BigInt(3),
    name: "Update 2",
    delayDays: BigInt(30),
    subject: "New features in QRGen",
    htmlBody: "<p>Hi {{firstName}},</p><p>Check out what's new. <a href=\"{{UNSUBSCRIBE_URL}}\">Unsubscribe</a></p>",
    version: BigInt(1),
    updatedAt: BigInt(Date.now()) * BigInt(1_000_000),
  },
  {
    id: BigInt(4),
    name: "Update 3",
    delayDays: BigInt(40),
    subject: "Make the most of QRGen",
    htmlBody: "<p>Hi {{firstName}},</p><p>Advanced tips inside. <a href=\"{{UNSUBSCRIBE_URL}}\">Unsubscribe</a></p>",
    version: BigInt(1),
    updatedAt: BigInt(Date.now()) * BigInt(1_000_000),
  },
];

const mockQrEntries = [
  {
    id: BigInt(1),
    url: "https://example.com",
    userId: { toText: () => "user-1" } as any,
    generatedAt: BigInt(Date.now()) * BigInt(1_000_000),
    notes: "Example website",
  },
  {
    id: BigInt(2),
    url: "https://caffeine.ai",
    userId: { toText: () => "user-1" } as any,
    generatedAt: BigInt(Date.now() - 86400000) * BigInt(1_000_000),
    notes: "Caffeine platform",
  },
];

const mockTickerMessages = [
  { id: BigInt(1), message: "Welcome to QRGen — create and manage QR codes instantly!" },
  { id: BigInt(2), message: "Generate QR codes in seconds. No limits. No fuss." },
];

const mockEmailSignups = [
  { firstName: "Alice", email: "alice@example.com", signedUpAt: BigInt(Date.now()) * BigInt(1_000_000) },
  { firstName: "Bob", email: "bob@company.org", signedUpAt: BigInt(Date.now() - 172800000) * BigInt(1_000_000) },
];

export const mockBackend: backendInterface = {
  addTickerMessage: async (message: string) => ({
    id: BigInt(3),
    message,
  }),
  claimAdmin: async () => true,
  deleteQrEntry: async (_entryId: bigint) => true,
  deleteTickerMessage: async (_id: bigint) => true,
  getAdminPrincipal: async () => null,
  getEmailSignups: async () => mockEmailSignups,
  getMyQrEntries: async () => mockQrEntries,
  getTickerMessages: async () => mockTickerMessages,
  saveQrEntry: async (url: string, notes: string) => ({
    id: BigInt(3),
    url,
    userId: { toText: () => "user-1" } as any,
    generatedAt: BigInt(Date.now()) * BigInt(1_000_000),
    notes,
  }),
  signUpForEmail: async (_firstName: string, _email: string) => true,
  removeEmailSignup: async (_email: string) => true,
  updateTickerMessage: async (_id: bigint, _message: string) => true,
  getAdminStats: async () => [
    { date: "2026-04-08", count: BigInt(3) },
    { date: "2026-04-09", count: BigInt(5) },
    { date: "2026-04-10", count: BigInt(2) },
  ],
  getMyStats: async () => [
    { date: "2026-04-08", count: BigInt(2) },
    { date: "2026-04-09", count: BigInt(4) },
    { date: "2026-04-10", count: BigInt(1) },
  ],
  deleteStylePreset: async (_id: bigint) => true,
  getStylePresets: async () => [],
  saveStylePreset: async (
    name: string,
    dotColor: string,
    bgColor: string,
    _logoData: string | null,
  ) => ({ id: BigInt(1), name, dotColor, bgColor }),
  broadcastToSubscribers: async (
    _subject: string,
    _body: string,
  ): Promise<string> => JSON.stringify({ ok: 2 }),
  getDripTemplates: async (): Promise<BackendDripTemplate[]> => mockDripTemplates,
  getDripEmailLog: async (): Promise<DripEmailLog[]> => [],
  updateDripTemplate: async (
    _id: bigint,
    _subject: string,
    _htmlBody: string,
  ): Promise<boolean> => true,
  getAnalyticsAccess: async (): Promise<boolean> => false,
  getMyClickCounts: async (): Promise<Array<[string, bigint]>> => [],
  getPaymentLedger: async () => [],
  getQrForRedirect: async (_id: string) => null,
  unlockAnalytics: async (_blockHeight: bigint) => ({
    __kind__: "ok" as const,
    ok: null,
  }),
  _caffeineEmailUnsubscribeFromTopic: async (
    _args: _CaffeineEmailUnsubscribeArgs,
  ): Promise<_CaffeineEmailUnsubscribeResult> => ({
    __kind__: "Ok",
    Ok: {},
  }),
};
