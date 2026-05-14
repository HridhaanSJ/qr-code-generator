import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  AlertCircle,
  BarChart2,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  Mail,
  MessageSquare,
  Pencil,
  Plus,
  Send,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  X,
  XCircle,
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
  useBroadcastToSubscribers,
  useClaimAdmin,
  useDeleteTickerMessage,
  useEmailSignups,
  useGetAdminStats,
  useGetDripTemplates,
  useGetPaymentLedger,
  useRemoveEmailSignup,
  useTickerMessages,
  useUpdateDripTemplate,
  useUpdateTickerMessage,
} from "../hooks/useBackend";
import { useIsAdmin } from "../hooks/useIsAdmin";
import type { DripTemplate, EmailSignup, TickerMessage } from "../types";
import { toDate } from "../types";

const MAX_TICKER = 5;
const MAX_TICKER_CHARS = 150;

// ─── Not-Logged-In Gate ───────────────────────────────────────────────────────
function LoginGate() {
  const { login } = useInternetIdentity();
  return (
    <div className="flex-1 flex items-center justify-center py-24">
      <Card className="max-w-sm w-full text-center shadow-lg border-border">
        <CardContent className="pt-10 pb-10 flex flex-col items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <ShieldAlert className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">
              Admin Access Required
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Sign in with Internet Identity to continue.
            </p>
          </div>
          <Button
            className="w-full"
            onClick={() => login()}
            data-ocid="admin-login-btn"
          >
            Sign In
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

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

// ─── Email Signups Panel ──────────────────────────────────────────────────────
function EmailSignupsPanel() {
  const { data: signups = [], isLoading } = useEmailSignups();
  const removeSignup = useRemoveEmailSignup();
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);

  async function handleDelete(email: string) {
    try {
      await removeSignup.mutateAsync(email);
      setConfirmEmail(null);
      toast.success("Subscriber removed.");
    } catch {
      toast.error("Failed to remove subscriber.");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-lg" />
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-border pb-3">
          <CardTitle className="text-base font-display font-semibold flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            Email Subscribers
            <Badge className="ml-auto bg-primary text-primary-foreground text-xs">
              {signups.length}{" "}
              {signups.length === 1 ? "subscriber" : "subscribers"}
            </Badge>
          </CardTitle>
        </CardHeader>
        {signups.length === 0 ? (
          <CardContent className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
            <Mail className="w-10 h-10 opacity-30" />
            <p className="text-sm" data-ocid="signups-empty-state">
              No email signups yet.
            </p>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-ocid="signups-table">
              <thead>
                <tr className="bg-primary/10 border-b border-border">
                  <th className="text-left px-4 py-3 font-display font-semibold text-primary text-xs uppercase tracking-wide">
                    First Name
                  </th>
                  <th className="text-left px-4 py-3 font-display font-semibold text-primary text-xs uppercase tracking-wide">
                    Email Address
                  </th>
                  <th className="text-left px-4 py-3 font-display font-semibold text-primary text-xs uppercase tracking-wide">
                    Signed Up
                  </th>
                  <th className="text-right px-4 py-3 font-display font-semibold text-primary text-xs uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {signups.map((s: EmailSignup, idx: number) => (
                  <tr
                    key={s.email}
                    className={idx % 2 === 0 ? "bg-card" : "bg-muted/30"}
                    data-ocid={`signup-row-${idx + 1}`}
                  >
                    <td className="px-4 py-3 text-foreground text-xs font-medium">
                      {s.firstName}
                    </td>
                    <td className="px-4 py-3 text-foreground font-mono text-xs">
                      {s.email}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {toDate(s.signedUpAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {confirmEmail === s.email ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-muted-foreground">
                            Remove?
                          </span>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 px-2 text-xs"
                            onClick={() => handleDelete(s.email)}
                            disabled={removeSignup.isPending}
                            data-ocid={`signup-confirm-delete-${idx + 1}`}
                          >
                            Yes
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={() => setConfirmEmail(null)}
                            data-ocid={`signup-cancel-delete-${idx + 1}`}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => setConfirmEmail(s.email)}
                          aria-label={`Remove ${s.email}`}
                          data-ocid={`signup-delete-btn-${idx + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
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

// ─── Broadcast Panel ──────────────────────────────────────────────────────────
function BroadcastPanel({ subscriberCount }: { subscriberCount: number }) {
  const broadcast = useBroadcastToSubscribers();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [result, setResult] = useState<
    | { type: "success"; count: number }
    | { type: "error"; message: string }
    | null
  >(null);

  async function handleSend() {
    if (!subject.trim() || !body.trim()) return;
    setResult(null);
    try {
      const count = await broadcast.mutateAsync({
        subject: subject.trim(),
        body: body.trim(),
      });
      setResult({ type: "success", count });
      setSubject("");
      setBody("");
      toast.success(
        `Broadcast sent to ${count} subscriber${count === 1 ? "" : "s"}!`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Broadcast failed.";
      setResult({ type: "error", message: msg });
      toast.error(msg);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-border bg-card shadow-sm overflow-hidden">
        <CardHeader className="bg-primary/5 border-b border-border pb-3">
          <CardTitle className="text-base font-display font-semibold flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" />
            Send to All Subscribers
            <Badge className="ml-auto bg-primary text-primary-foreground text-xs">
              {subscriberCount}{" "}
              {subscriberCount === 1 ? "recipient" : "recipients"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5 space-y-4">
          {subscriberCount === 0 && (
            <div
              className="flex items-center gap-2 rounded-lg bg-muted/50 border border-border px-4 py-3 text-sm text-muted-foreground"
              data-ocid="broadcast-no-subscribers"
            >
              <Mail className="w-4 h-4 shrink-0" />
              <span>
                No subscribers yet. The form is ready for when people sign up.
              </span>
            </div>
          )}

          {/* Feedback banner */}
          {result?.type === "success" && (
            <div
              className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400"
              data-ocid="broadcast-success-state"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                Sent to <strong>{result.count}</strong> subscriber
                {result.count === 1 ? "" : "s"}!
              </span>
            </div>
          )}
          {result?.type === "error" && (
            <div
              className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive"
              data-ocid="broadcast-error-state"
            >
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{result.message}</span>
            </div>
          )}

          {/* Subject */}
          <div className="space-y-1.5">
            <label
              htmlFor="broadcast-subject"
              className="text-xs font-medium text-foreground uppercase tracking-wide"
            >
              Subject
            </label>
            <Input
              id="broadcast-subject"
              placeholder="e.g. Welcome to QRGen updates!"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setResult(null);
              }}
              disabled={broadcast.isPending}
              data-ocid="broadcast-subject-input"
            />
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <label
              htmlFor="broadcast-body"
              className="text-xs font-medium text-foreground uppercase tracking-wide"
            >
              Message
            </label>
            <Textarea
              id="broadcast-body"
              placeholder="Write your message to subscribers here…"
              rows={6}
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                setResult(null);
              }}
              disabled={broadcast.isPending}
              className="resize-y min-h-[96px]"
              data-ocid="broadcast-body-textarea"
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={
              broadcast.isPending ||
              !subject.trim() ||
              !body.trim() ||
              subscriberCount === 0
            }
            className="w-full sm:w-auto"
            data-ocid="broadcast-send-button"
          >
            {broadcast.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send to All Subscribers
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Drip Email Templates Panel ───────────────────────────────────────────────

const DRIP_DELAY_LABELS: Record<number, string> = {
  0: "Sent immediately",
  10: "Sent 10 days after signup",
  30: "Sent 30 days after signup",
  40: "Sent 40 days after signup",
};

interface EditModalProps {
  template: DripTemplate;
  onClose: () => void;
  onSaved: () => void;
}

function DripEditModal({ template, onClose, onSaved }: EditModalProps) {
  const updateTemplate = useUpdateDripTemplate();
  const [subject, setSubject] = useState(template.subject);
  const [htmlBody, setHtmlBody] = useState(template.htmlBody);
  const [saveResult, setSaveResult] = useState<
    { type: "success" } | { type: "error"; message: string } | null
  >(null);

  async function handleSave() {
    if (!subject.trim() || !htmlBody.trim()) return;
    setSaveResult(null);
    try {
      await updateTemplate.mutateAsync({
        id: template.id,
        subject: subject.trim(),
        htmlBody: htmlBody.trim(),
      });
      setSaveResult({ type: "success" });
      toast.success("Template saved.");
      onSaved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save.";
      setSaveResult({ type: "error", message: msg });
      toast.error(msg);
    }
  }

  const delayLabel =
    DRIP_DELAY_LABELS[Number(template.delayDays)] ??
    `Sent ${template.delayDays} days after signup`;

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <dialog
      open
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 m-0 max-w-none max-h-none w-full h-full border-0 bg-transparent"
      data-ocid="drip-edit-dialog"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg flex flex-col gap-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 bg-primary/5 border-b border-border px-5 py-4">
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-foreground text-base truncate">
              Edit — {template.name}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {delayLabel} &nbsp;·&nbsp; v{template.version.toString()}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            aria-label="Close"
            data-ocid="drip-edit-close-button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4 overflow-y-auto max-h-[60vh]">
          {/* Feedback */}
          {saveResult?.type === "success" && (
            <div
              className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-2.5 text-sm text-emerald-700 dark:text-emerald-400"
              data-ocid="drip-edit-success-state"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Template saved! Changes apply to future subscribers.</span>
            </div>
          )}
          {saveResult?.type === "error" && (
            <div
              className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2.5 text-sm text-destructive"
              data-ocid="drip-edit-error-state"
            >
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{saveResult.message}</span>
            </div>
          )}

          {/* Subject */}
          <div className="space-y-1.5">
            <label
              htmlFor="drip-subject"
              className="text-xs font-medium text-foreground uppercase tracking-wide"
            >
              Subject
            </label>
            <input
              id="drip-subject"
              type="text"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Email subject line…"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setSaveResult(null);
              }}
              disabled={updateTemplate.isPending}
              data-ocid="drip-subject-input"
            />
          </div>

          {/* HTML Body */}
          <div className="space-y-1.5">
            <label
              htmlFor="drip-htmlbody"
              className="text-xs font-medium text-foreground uppercase tracking-wide"
            >
              HTML Body
            </label>
            <Textarea
              id="drip-htmlbody"
              rows={10}
              className="resize-y min-h-[160px] font-mono text-xs"
              placeholder="Write your HTML email body here…"
              value={htmlBody}
              onChange={(e) => {
                setHtmlBody(e.target.value);
                setSaveResult(null);
              }}
              disabled={updateTemplate.isPending}
              data-ocid="drip-htmlbody-textarea"
            />
            <p className="text-xs text-muted-foreground">
              Supported placeholders:{" "}
              <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
                {"{{firstName}}"}
              </code>{" "}
              and{" "}
              <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
                {"{{UNSUBSCRIBE_URL}}"}
              </code>{" "}
              (required).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 bg-muted/30 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            data-ocid="drip-edit-cancel-button"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={
              updateTemplate.isPending || !subject.trim() || !htmlBody.trim()
            }
            data-ocid="drip-edit-save-button"
          >
            {updateTemplate.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>
    </dialog>
  );
}

function DripEmailsPanel() {
  const { data: templates = [], isLoading } = useGetDripTemplates();
  const [editingTemplate, setEditingTemplate] = useState<DripTemplate | null>(
    null,
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
        <Mail className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          These templates are sent automatically at the scheduled delay. Edits
          apply only to future subscribers — existing subscribers receive the
          version that was active when they signed up.
        </p>
      </div>

      {templates.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground"
          data-ocid="drip-empty-state"
        >
          <Mail className="w-10 h-10 opacity-30" />
          <p className="text-sm">No drip templates found.</p>
        </div>
      ) : (
        <div className="space-y-3" data-ocid="drip-templates-list">
          {templates.map((t, idx) => {
            const delayLabel =
              DRIP_DELAY_LABELS[Number(t.delayDays)] ??
              `Sent ${t.delayDays} days after signup`;
            return (
              <Card
                key={t.id.toString()}
                className="border-border bg-card shadow-sm"
                data-ocid={`drip-template-item.${idx + 1}`}
              >
                <CardContent className="py-4 px-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-semibold text-foreground text-sm">
                          {t.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-xs shrink-0"
                          data-ocid={`drip-version-badge.${idx + 1}`}
                        >
                          v{t.version.toString()}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3 shrink-0" />
                        {delayLabel}
                      </p>
                      <p className="text-xs text-foreground/70 truncate">
                        Subject:{" "}
                        <span className="text-foreground">{t.subject}</span>
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 flex items-center gap-1.5"
                      onClick={() => setEditingTemplate(t)}
                      data-ocid={`drip-edit-button.${idx + 1}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {editingTemplate && (
        <DripEditModal
          template={editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSaved={() => setEditingTemplate(null)}
        />
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
  const { data: signups = [] } = useEmailSignups();
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
            Manage ticker messages, email subscribers, and view platform stats.
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
              {signups.length}
            </p>
            <p className="text-xs text-muted-foreground">Subscribers</p>
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
            value="signups"
            className="flex items-center gap-1.5"
            data-ocid="tab-signups"
          >
            <Mail className="w-4 h-4" />
            Email Signups
          </TabsTrigger>
          <TabsTrigger
            value="broadcast"
            className="flex items-center gap-1.5"
            data-ocid="tab-broadcast"
          >
            <Send className="w-4 h-4" />
            Broadcast{signups.length > 0 ? ` (${signups.length})` : ""}
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="flex items-center gap-1.5"
            data-ocid="tab-payments"
          >
            <CreditCard className="w-4 h-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger
            value="drip"
            className="flex items-center gap-1.5"
            data-ocid="tab-drip"
          >
            <Clock className="w-4 h-4" />
            Drip Emails
          </TabsTrigger>
        </TabsList>
        <TabsContent value="stats" className="mt-6">
          <StatsPanel />
        </TabsContent>
        <TabsContent value="ticker" className="mt-6">
          <TickerPanel />
        </TabsContent>
        <TabsContent value="signups" className="mt-6">
          <EmailSignupsPanel />
        </TabsContent>
        <TabsContent value="broadcast" className="mt-6">
          <BroadcastPanel subscriberCount={signups.length} />
        </TabsContent>
        <TabsContent value="drip" className="mt-6">
          <DripEmailsPanel />
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
  const { identity } = useInternetIdentity();
  const { isAdmin } = useIsAdmin();
  const { data: adminPrincipal, isLoading: adminLoading } = useAdminPrincipal();

  // Only block rendering while the adminPrincipal query is in-flight.
  // Do NOT block on isInitializing — identity state is irrelevant to showing ClaimAdminGate.
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

  // No admin claimed yet — show Claim gate regardless of sign-in state.
  // LoginGate is shown inside ClaimAdminGate if identity is missing.
  if (!adminPrincipal) {
    if (!identity) {
      return <LoginGate />;
    }
    return <ClaimAdminGate adminPrincipal={null} />;
  }

  // Admin is set. Check if this user is the admin.
  if (!identity) {
    return <LoginGate />;
  }

  if (!isAdmin) {
    return <ClaimAdminGate adminPrincipal={adminPrincipal} />;
  }

  return <AdminDashboard />;
}
