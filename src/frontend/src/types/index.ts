export interface QrEntry {
  id: bigint;
  userId: string; // Principal as string
  url: string;
  generatedAt: bigint; // Int as bigint (nanoseconds)
  notes: string;
  dotColor?: string;
  bgColor?: string;
  logoUrl?: string;
  compositeImage?: string; // base64 PNG data URL: QR + URL text beneath
}

export interface EmailSignup {
  firstName: string;
  email: string;
  signedUpAt: bigint; // Int as bigint (nanoseconds)
}

export interface TickerMessage {
  id: bigint;
  message: string;
}

export interface DayStat {
  date: string;
  count: bigint;
}

export interface StylePreset {
  id: bigint;
  name: string;
  dotColor: string;
  bgColor: string;
  logoData: string | null;
}

export interface DripTemplate {
  id: bigint;
  name: string; // "Welcome" | "Update 1" | "Update 2" | "Update 3"
  delayDays: bigint; // 0 = immediate, 10, 30, 40
  subject: string;
  htmlBody: string;
  version: bigint;
  updatedAt: bigint; // nanoseconds
}

export interface PaymentRecord {
  userId: string; // Principal as string
  timestamp: bigint; // nanoseconds
  amountE8s: bigint; // e8s (1 ICP = 100_000_000 e8s)
}

// Helper to convert nanosecond bigint timestamp to Date
export function toDate(nanos: bigint): Date {
  return new Date(Number(nanos / BigInt(1_000_000)));
}
