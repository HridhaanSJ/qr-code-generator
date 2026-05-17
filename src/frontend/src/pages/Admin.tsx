import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  BarChart2,
  CreditCard,
  MessageSquare,
  Pencil,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import {
  type PaymentRecord,
  useAddTickerMessage,
  useAdminPrincipal,
  useClaimAdmin,
  useDeleteTickerMessage,
  useGetAdminStats,
  useGetPaymentLedger,
  useTickerMessages,
  useUpdateTickerMessage,
} from "../hooks/useBackend";
import { useIsAdmin } from "../hooks/useIsAdmin";
import type { TickerMessage } from "../types";

const MAX_TICKER = 5;
const MAX_TICKER_CHARS = 150;

// ─── Claim Admin Gate ─────────────────────────────────────────────────────────
function ClaimAdminGate({ adminPrincipal }: { adminPrincipal: string | null }) {
  const claimAdmin = useClaimAdmin();

  async function handleClaim() {
    try {
      await claimAdmin.mutateAsync();
      toast.success("Admin role claimed successfully!");
    } catch {
      toast.error("Failed to claim admin. An admin may already be set.");
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center py-24">
      <Card className="max-w-sm w-full text-center shadow-lg border-border">
        <CardContent className="pt-10 pb-10 flex flex-col items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="w-7 h-7 text-destructive" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">
              Not Authorized
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {adminPrincipal
                ? "An admin is already set and your account doesn't have access."
                : "No admin has been set yet. Claim the admin role to get started."}
            </p>
          </div>
          {!adminPrincipal && (
            <Button
              className="w-full"
              onClick={handleClaim}
              disabled={claimAdmin.isPending}
              data-ocid="claim-admin-btn"
            >
              {claimAdmin.isPending ? "Claiming…" : "Claim Admin Role"}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Ticker Messages Panel ────────────────────────────────────────────────────
function TickerPanel() {
  const { data: messages = [], isLoading } = useTickerMessages();
  const addMsg = useAddTickerMessage();
  const updateMsg = useUpdateTickerMessage();
  const deleteMsg = useDeleteTickerMessage();

  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [editText, setEditText] = useState("");

  const canAdd = messages.length < MAX_TICKER;

  async function handleAdd() {
    const trimmed = newText.trim();
    if (!trimmed || trimmed.length > MAX_TICKER_CHARS) return;
    try {
      await addMsg.mutateAsync(trimmed);
      setNewText("");
      toast.success("Ticker message added.");
    } catch {
      toast.error("Failed to add message.");
    }
  }

  function startEdit(m: TickerMessage) {
    setEditingId(m.id);
    setEditText(m.message);
  }

  async function handleSaveEdit(id: bigint) {
    const trimmed = editText.trim();
    if (!trimmed || trimmed.length > MAX_TICKER_CHARS) return;
    try {
      await updateMsg.mutateAsync({ id, message: trimmed });
      setEditingId(null);
      toast.success("Message updated.");
    } catch {
      toast.error("Failed to update message.");
    }
  }

  async function handleDelete(id: bigint) {
    try {
      await deleteMsg.mutateAsync(id);
      toast.success("Message deleted.");
    } catch {
      toast.error("Failed to delete message.");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add new */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-display font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" />
            Add Ticker Message
            <Badge
              variant={canAdd ? "outline" : "destructive"}
              className="ml-auto text-xs"
              data-ocid="ticker-count-badge"
            >
              {messages.length} / {MAX_TICKER}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Input
              placeholder="Enter up to 150 characters…"
              value={newText}
              onChange={(e) =>
                setNewText(e.target.value.slice(0, MAX_TICKER_CHARS))
              }
              disabled={!canAdd}
              data-ocid="new-ticker-input"
            />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>
                {!canAdd
                  ? "Maximum 5 messages reached. Delete one to add another."
                  : "Messages display randomly in the homepage ticker."}
              </span>
              <span
                className={
                  newText.length >= MAX_TICKER_CHARS
                    ? "text-destructive font-medium"
                    : ""
                }
              >
                {newText.length} / {MAX_TICKER_CHARS}
              </span>
            </div>
          </div>
          <Button
            onClick={handleAdd}
            disabled={!canAdd || !newText.trim() || addMsg.isPending}
            size="sm"
            data-ocid="add-ticker-btn"
          >
            {addMsg.isPending ? "Adding…" : "Add Message"}
          </Button>
        </CardContent>
      </Card>

      {/* List */}
      {messages.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground"
          data-ocid="ticker-empty-state"
        >
          <MessageSquare className="w-10 h-10 opacity-30" />
          <p className="text-sm">No ticker messages yet. Add one above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <Card
              key={m.id.toString()}
              className="border-border bg-card shadow-sm"
              data-ocid={`ticker-row-${m.id}`}
            >
              <CardContent className="py-3 px-4">
                {editingId === m.id ? (
                  <div className="space-y-2">
                    <Input
                      value={editText}
                      onChange={(e) =>
                        setEditText(e.target.value.slice(0, MAX_TICKER_CHARS))
                      }
                      autoFocus
                      data-ocid={`ticker-edit-input-${m.id}`}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {editText.length} / {MAX_TICKER_CHARS}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(m.id)}
                          disabled={
                            !editText.trim() ||
                            editText.length > MAX_TICKER_CHARS ||
                            updateMsg.isPending
                          }
                          data-ocid={`ticker-save-btn-${m.id}`}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 min-w-0">
                    <p className="flex-1 min-w-0 text-sm text-foreground truncate">
                      {m.message}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => startEdit(m)}
                        aria-label="Edit message"
                        data-ocid={`ticker-edit-btn-${m.id}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(m.id)}
                        disabled={deleteMsg.isPending}
                        aria-label="Delete message"
                        data-ocid={`ticker-delete-btn-${m.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Stats Panel ──────────────────────────────────────────────────────────────
interface TooltipPayload {
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-md text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-display font-bold text-primary text-sm">
        {payload[0].value}{" "}
        <span className="font-normal text-foreground">QR codes</span>
      </p>
    </div>
  );
}

function StatsPanel() {
  const { data: stats = [], isLoading } = useGetAdminStats();

  const total = stats.reduce((sum, d) => sum + d.count, 0);
  const peak = stats.reduce((max, d) => Math.max(max, d.count), 0);

  // Format x-axis labels: show only day/month for brevity
  function formatDate(dateStr: string) {
    const parts = dateStr.split("-");
    if (parts.length === 3) return `${parts[1]}/${parts[2]}`;
    return dateStr;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-primary/10 rounded-xl px-5 py-4 border border-primary/20">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Total (30 days)
          </p>
          <p className="text-3xl font-display font-bold text-primary mt-1">
            {total.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            QR codes generated
          </p>
        </div>
        <div className="bg-card rounded-xl px-5 py-4 border border-border">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Peak Day
          </p>
          <p className="text-3xl font-display font-bold text-foreground mt-1">
            {peak.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            highest single day
          </p>
        </div>
        <div className="bg-card rounded-xl px-5 py-4 border border-border col-span-2 sm:col-span-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Daily Average
          </p>
          <p className="text-3xl font-display font-bold text-foreground mt-1">
            {stats.length > 0
              ? Math.round(total / stats.length).toLocaleString()
              : 0}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">codes per day</p>
        </div>
      </div>

      {/* Chart */}
      <Card
        className="border-border bg-card shadow-sm overflow-hidden"
        data-ocid="admin-stats-chart"
      >
        <CardHeader className="bg-primary/5 border-b border-border pb-3">
          <CardTitle className="text-base font-display font-semibold flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            QR Codes Generated — Last 30 Days
            <Badge variant="outline" className="ml-auto text-xs">
              All Users
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 pb-4 px-2 sm:px-4">
          {stats.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground"
              data-ocid="stats-empty-state"
            >
              <BarChart2 className="w-10 h-10 opacity-30" />
              <p className="text-sm">
                No activity data yet for the last 30 days.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={stats}
                margin={{ top: 4, right: 8, left: -8, bottom: 0 }}
                barCategoryGap="30%"
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{
                    fontSize: 11,
                    fill: "oklch(var(--muted-foreground))",
                  }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{
                    fontSize: 11,
                    fill: "oklch(var(--muted-foreground))",
                  }}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                />
                <Tooltip
                  content={<CustomChartTooltip />}
                  cursor={{ fill: "oklch(var(--muted) / 0.4)", radius: 4 }}
                />
                <Bar
                  dataKey="count"
                  name="QR Codes"
                  fill="oklch(var(--primary))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Payments Panel ───────────────────────────────────────────────────────────

const ICP_DECIMALS = 100_000_000n;

function formatIcp(amountE8s: bigint): string {
  const whole = amountE8s / ICP_DECIMALS;
  const frac = amountE8s % ICP_DECIMALS;
  const fracStr = frac.toString().padStart(8, "0").slice(0, 2);
  return `${whole.toString()}.${fracStr}`;
}

function formatNanoTimestamp(nanos: bigint): string {
  const ms = Number(nanos / 1_000_000n);
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function truncatePrincipal(principal: string): string {
  if (principal.length <= 16) return principal;
  return `${principal.slice(0, 8)}…${principal.slice(-6)}`;
}

function PaymentsPanel() {
  const { data: payments = [], isLoading } = useGetPaymentLedger();

  const totalE8s = payments.reduce((sum, p) => sum + p.amountE8s, 0n);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full rounded-lg" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Running total KPI */}
      <div className="bg-primary/10 rounded-xl px-6 py-5 border border-primary/20 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <CreditCard className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Total ICP Collected
          </p>
          <p className="text-3xl font-display font-bold text-primary mt-0.5">
            {formatIcp(totalE8s)} ICP
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {payments.length} payment{payments.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {/* Payments table */}
      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-border pb-3">
          <CardTitle className="text-base font-display font-semibold flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            Analytics Unlocks
            <Badge className="ml-auto bg-primary text-primary-foreground text-xs">
              {payments.length} {payments.length === 1 ? "payment" : "payments"}
            </Badge>
          </CardTitle>
        </CardHeader>

        {payments.length === 0 ? (
          <CardContent
            className="py-16 flex flex-col items-center gap-3 text-muted-foreground"
            data-ocid="payments-empty-state"
          >
            <CreditCard className="w-10 h-10 opacity-30" />
            <p className="text-sm">No payments yet.</p>
            <p className="text-xs text-center max-w-xs">
              When users unlock analytics with ICP, their payments will appear
              here.
            </p>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-ocid="payments-table">
              <thead>
                <tr className="bg-primary/10 border-b border-border">
                  <th className="text-left px-4 py-3 font-display font-semibold text-primary text-xs uppercase tracking-wide">
                    User Principal
                  </th>
                  <th className="text-left px-4 py-3 font-display font-semibold text-primary text-xs uppercase tracking-wide">
                    Date Paid
                  </th>
                  <th className="text-right px-4 py-3 font-display font-semibold text-primary text-xs uppercase tracking-wide">
                    ICP Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p: PaymentRecord, idx: number) => (
                  <tr
                    key={`${p.userId}-${p.timestamp}`}
                    className={idx % 2 === 0 ? "bg-card" : "bg-muted/30"}
                    data-ocid={`payment-row-${idx + 1}`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-foreground">
                      <span title={p.userId}>
                        {truncatePrincipal(p.userId)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {formatNanoTimestamp(p.timestamp)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-display font-semibold text-primary text-sm">
                        {formatIcp(p.amountE8s)}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ICP
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
function AdminDashboard() {
  const { data: adminPrincipal } = useAdminPrincipal();
  const { data: messages = [] } = useTickerMessages();
  const { data: stats = [] } = useGetAdminStats();
  const { data: payments = [] } = useGetPaymentLedger();

  const totalQrCodes = stats.reduce((sum, d) => sum + d.count, 0);
  const totalIcpE8s = payments.reduce((sum, p) => sum + p.amountE8s, 0n);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage ticker messages and view platform stats.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="bg-primary/10 rounded-lg px-4 py-2 text-center">
            <p className="text-2xl font-display font-bold text-primary">
              {totalQrCodes.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">QR (30d)</p>
          </div>
          <div className="bg-primary/10 rounded-lg px-4 py-2 text-center">
            <p className="text-2xl font-display font-bold text-primary">
              {messages.length}/{MAX_TICKER}
            </p>
            <p className="text-xs text-muted-foreground">Ticker Msgs</p>
          </div>
          <div className="bg-primary/10 rounded-lg px-4 py-2 text-center">
            <p className="text-2xl font-display font-bold text-primary">
              {formatIcp(totalIcpE8s)}
            </p>
            <p className="text-xs text-muted-foreground">ICP Collected</p>
          </div>
        </div>
      </div>

      {/* Admin principal notice */}
      {adminPrincipal && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 border border-border rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-primary" />
          <span className="font-mono truncate">Admin: {adminPrincipal}</span>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="stats" data-ocid="admin-tabs">
        <TabsList className="bg-muted/60 border border-border w-full sm:w-auto">
          <TabsTrigger
            value="stats"
            className="flex items-center gap-1.5"
            data-ocid="tab-stats"
          >
            <BarChart2 className="w-4 h-4" />
            Stats
          </TabsTrigger>
          <TabsTrigger
            value="ticker"
            className="flex items-center gap-1.5"
            data-ocid="tab-ticker"
          >
            <MessageSquare className="w-4 h-4" />
            Ticker Messages
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="flex items-center gap-1.5"
            data-ocid="tab-payments"
          >
            <CreditCard className="w-4 h-4" />
            Payments
          </TabsTrigger>
        </TabsList>
        <TabsContent value="stats" className="mt-6">
          <StatsPanel />
        </TabsContent>
        <TabsContent value="ticker" className="mt-6">
          <TickerPanel />
        </TabsContent>
        <TabsContent value="payments" className="mt-6">
          <PaymentsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Page Entry Point ─────────────────────────────────────────────────────────
export function AdminPage() {
  const { isAdmin } = useIsAdmin();
  const { data: adminPrincipal, isLoading: adminLoading } = useAdminPrincipal();

  if (adminLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!adminPrincipal) {
    return <ClaimAdminGate adminPrincipal={null} />;
  }

  if (!isAdmin) {
    return <ClaimAdminGate adminPrincipal={adminPrincipal} />;
  }

  return <AdminDashboard />;
}
