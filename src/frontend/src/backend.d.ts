import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Timestamp = bigint;
export interface EmailSignup {
    email: string;
    signedUpAt: Timestamp;
    firstName: string;
}
export interface PaymentRecord {
    userId: UserId;
    timestamp: Timestamp;
    amountE8s: bigint;
}
export interface DripEmailLog {
    subscriberEmail: string;
    templateId: bigint;
    sentAt: Timestamp;
    versionSent: bigint;
}
export interface TickerMessage {
    id: bigint;
    message: string;
}
export interface DripTemplate {
    id: bigint;
    htmlBody: string;
    delayDays: bigint;
    subject: string;
    name: string;
    version: bigint;
    updatedAt: Timestamp;
}
export type UserId = Principal;
export interface DayStat {
    date: string;
    count: bigint;
}
export interface StylePreset {
    id: bigint;
    name: string;
    logoData?: string;
    dotColor: string;
    bgColor: string;
}
export interface QrEntry {
    id: bigint;
    url: string;
    compositeImage?: string;
    userId: UserId;
    generatedAt: Timestamp;
    notes: string;
}
export interface backendInterface {
    addTickerMessage(message: string): Promise<TickerMessage | null>;
    broadcastToSubscribers(subject: string, body: string): Promise<string>;
    claimAdmin(): Promise<boolean>;
    deleteQrEntry(entryId: bigint): Promise<boolean>;
    deleteStylePreset(id: bigint): Promise<boolean>;
    deleteTickerMessage(id: bigint): Promise<boolean>;
    getAdminPrincipal(): Promise<Principal | null>;
    getAdminStats(): Promise<Array<DayStat>>;
    getAnalyticsAccess(): Promise<boolean>;
    getDripEmailLog(): Promise<Array<DripEmailLog>>;
    getDripTemplates(): Promise<Array<DripTemplate>>;
    getEmailSignups(): Promise<Array<EmailSignup>>;
    getMyClickCounts(): Promise<Array<[string, bigint]>>;
    getMyQrEntries(): Promise<Array<QrEntry>>;
    getMyStats(): Promise<Array<DayStat>>;
    getPaymentLedger(): Promise<Array<PaymentRecord>>;
    getQrForRedirect(id: string): Promise<{
        url: string;
    } | null>;
    getStylePresets(): Promise<Array<StylePreset>>;
    getTickerMessages(): Promise<Array<TickerMessage>>;
    removeEmailSignup(email: string): Promise<boolean>;
    saveQrEntry(url: string, notes: string, compositeImage: string | null): Promise<QrEntry>;
    saveStylePreset(name: string, dotColor: string, bgColor: string, logoData: string | null): Promise<StylePreset>;
    signUpForEmail(firstName: string, email: string): Promise<boolean>;
    unlockAnalytics(blockHeight: bigint): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateDripTemplate(id: bigint, subject: string, htmlBody: string): Promise<boolean>;
    updateTickerMessage(id: bigint, message: string): Promise<boolean>;
}
