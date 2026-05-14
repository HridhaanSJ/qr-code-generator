import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  loadConfig,
  useInternetIdentity,
} from "@caffeineai/core-infrastructure";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { format } from "date-fns";
import JSZip from "jszip";
import {
  Archive,
  BarChart2,
  Calendar,
  Check,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Lock,
  MousePointerClick,
  QrCode,
  Search,
  Share2,
  Trash2,
  Unlock,
  X,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "../components/ProtectedRoute";
import {
  useDeleteQrEntry,
  useGetAnalyticsAccess,
  useGetMyClickCounts,
  useMyQrEntries,
  useUnlockAnalytics,
} from "../hooks/useBackend";
import { useIsAdmin } from "../hooks/useIsAdmin";
import type { QrEntry } from "../types";
import { toDate } from "../types";

interface ProfileSearch {
  query?: string;
}

// ─── Composite image generation (fallback) ────────────────────────────────────

const QR_SIZE = 220;
const PADDING = 24;
const TEXT_FONT_SIZE = 13;
const LINE_HEIGHT = 18;

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  let current = "";
  for (const ch of text) {
    const test = current + ch;
    if (ctx.measureText(test).width > maxWidth && current.length > 0) {
      lines.push(current);
      current = ch;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function buildCompositeFromCanvas(
  url: string,
  qrCanvas: HTMLCanvasElement,
): string {
  const offscreen = document.createElement("canvas");
  const octx = offscreen.getContext("2d")!;
  octx.font = `${TEXT_FONT_SIZE}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  const textMaxWidth = QR_SIZE + PADDING * 2 - 16;
  const lines = wrapText(octx, url, textMaxWidth);
  const textBlockHeight = lines.length * LINE_HEIGHT + 8;
  const totalWidth = QR_SIZE + PADDING * 2;
  const totalHeight = QR_SIZE + PADDING * 2 + textBlockHeight + PADDING;

  const out = document.createElement("canvas");
  out.width = totalWidth;
  out.height = totalHeight;
  const ctx = out.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, totalWidth, totalHeight);
  ctx.drawImage(qrCanvas, PADDING, PADDING, QR_SIZE, QR_SIZE);
  ctx.fillStyle = "#1a1a1a";
  ctx.font = `${TEXT_FONT_SIZE}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  const textStartY = PADDING + QR_SIZE + PADDING / 2 + TEXT_FONT_SIZE;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], PADDING + 8, textStartY + i * LINE_HEIGHT);
  }
  return out.toDataURL("image/png");
}

function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.split(",")[1] ?? "";
}

// ─── Analytics Unlock Modal ────────────────────────────────────────────────────

function UnlockAnalyticsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [blockHeight, setBlockHeight] = useState("");
  const [canisterId, setCanisterId] = useState<string>("Loading…");
  const unlockMutation = useUnlockAnalytics();

  useEffect(() => {
    loadConfig()
      .then((cfg) => setCanisterId(cfg.backend_canister_id))
      .catch(() => setCanisterId("unavailable — contact support"));
  }, []);

  const handleSubmit = async () => {
    const trimmed = blockHeight.trim();
    if (!trimmed || Number.isNaN(Number(trimmed))) {
      toast.error("Please enter a valid block height number.");
      return;
    }
    try {
      await unlockMutation.mutateAsync(BigInt(trimmed));
      toast.success("Analytics unlocked! Click counts are now visible.");
      setBlockHeight("");
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Verification failed. Please check the block height and try again.",
      );
    }
  };

  const handleClose = () => {
    setBlockHeight("");
    unlockMutation.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        className="sm:max-w-md"
        data-ocid="unlock-analytics-dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Unlock className="h-5 w-5 text-primary" />
            Unlock Click Analytics
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Get lifetime access to click tracking for all your QR codes — share
            them anywhere and see how many times each link is clicked.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Price callout */}
          <div className="rounded-lg bg-primary/8 border border-primary/20 px-4 py-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-primary">∞</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                One-time payment of exactly 0.5 ICP
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Lifetime access · No subscription · No renewal
              </p>
            </div>
          </div>

          {/* Step 1 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Step 1 — Send ICP from your wallet
            </Label>
            <div className="rounded-md bg-muted/50 border border-border px-3 py-2.5 flex items-center gap-2">
              <code className="text-xs font-mono text-foreground flex-1 break-all select-all">
                {canisterId}
              </code>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(canisterId);
                  toast.success("Canister ID copied");
                }}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Copy canister ID"
                data-ocid="copy-canister-id-btn"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Send <strong>exactly 0.5 ICP</strong> to this canister address
              from your Internet Identity wallet (NNS or any ICP wallet).
            </p>
          </div>

          {/* Step 2 */}
          <div className="space-y-1.5">
            <Label
              htmlFor="block-height-input"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wide"
            >
              Step 2 — Enter the block height from your wallet
            </Label>
            <Input
              id="block-height-input"
              type="number"
              value={blockHeight}
              onChange={(e) => setBlockHeight(e.target.value)}
              placeholder="e.g. 12345678"
              className="font-mono"
              data-ocid="block-height-input"
              min="0"
            />
            <p className="text-xs text-muted-foreground">
              After sending, your wallet shows a transaction block height. Paste
              it here to verify your payment.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={unlockMutation.isPending}
            data-ocid="unlock-cancel-button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={unlockMutation.isPending || !blockHeight.trim()}
            className="gap-2"
            data-ocid="unlock-confirm-button"
          >
            {unlockMutation.isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Verifying…
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Confirm Payment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Analytics Locked Banner ──────────────────────────────────────────────────

function AnalyticsLockedBanner({ onUnlock }: { onUnlock: () => void }) {
  return (
    <div
      className="mx-auto max-w-4xl px-4 sm:px-6 pt-6"
      data-ocid="analytics-locked-banner"
    >
      <div className="rounded-xl border border-primary/25 bg-primary/5 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Unlock click tracking for your QR codes
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Share QR codes via unique links and track clicks in real time.
              One-time 0.5 ICP fee — unlimited, lifetime access.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={onUnlock}
          className="gap-2 shrink-0 self-start sm:self-center"
          data-ocid="unlock-analytics-btn"
        >
          <BarChart2 className="h-4 w-4" />
          Unlock Analytics — 0.5 ICP
        </Button>
      </div>
    </div>
  );
}

// ─── QR Entry Card ────────────────────────────────────────────────────────────

function QrEntryCard({
  entry,
  onDelete,
  isDeleting,
  analyticsUnlocked,
  clickCount,
  index,
}: {
  entry: QrEntry;
  onDelete: (id: bigint) => void;
  isDeleting: boolean;
  analyticsUnlocked: boolean;
  clickCount?: number;
  index: number;
}) {
  const { id, url, generatedAt, notes, compositeImage } = entry;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const fallbackCanvasRef = useRef<HTMLDivElement>(null);

  const shareUrl = `${window.location.origin}/qr/${String(id)}`;

  const handleDownload = () => {
    if (compositeImage) {
      const a = document.createElement("a");
      a.href = compositeImage;
      a.download = `qr-code-${String(id)}.png`;
      a.click();
      return;
    }
    const qrCanvas = fallbackCanvasRef.current?.querySelector("canvas");
    if (!qrCanvas) {
      toast.error("Could not generate image. Please try again.");
      return;
    }
    const dataUrl = buildCompositeFromCanvas(url, qrCanvas);
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `qr-code-${String(id)}.png`;
    a.click();
  };

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Share link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link.");
    }
  };

  const displayUrl = url.length > 48 ? `${url.slice(0, 45)}…` : url;
  const formattedDate = format(toDate(generatedAt), "MMM d, yyyy • h:mm a");

  return (
    <Card
      className="group relative overflow-hidden border-border hover:border-primary/40 hover:shadow-md transition-all duration-200"
      data-ocid={`qr-entry-card.item.${index}`}
    >
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* QR thumbnail */}
          <div className="relative flex items-center justify-center bg-muted/40 p-4 shrink-0 sm:w-36 sm:h-36 w-full h-36 border-b sm:border-b-0 sm:border-r border-border">
            {compositeImage ? (
              <img
                src={compositeImage}
                alt="QR code with URL"
                className="w-full h-full object-contain rounded"
              />
            ) : (
              <>
                <QRCodeCanvas
                  id={`qr-${String(id)}`}
                  value={url}
                  size={96}
                  level="M"
                  bgColor="transparent"
                  fgColor="currentColor"
                  className="text-foreground rounded"
                />
                <div
                  ref={fallbackCanvasRef}
                  className="sr-only"
                  aria-hidden="true"
                >
                  <QRCodeCanvas
                    value={url}
                    size={QR_SIZE}
                    level="H"
                    bgColor="#ffffff"
                    fgColor="#000000"
                    style={{ display: "block" }}
                  />
                </div>
              </>
            )}

            {/* Click count badge — only when analytics unlocked */}
            {analyticsUnlocked && clickCount !== undefined && (
              <div className="absolute bottom-1.5 right-1.5">
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0.5 gap-1 font-medium"
                  data-ocid={`click-count-badge.item.${index}`}
                >
                  <MousePointerClick className="h-2.5 w-2.5" />
                  {clickCount}
                </Badge>
              </div>
            )}

            {/* Lock icon when analytics locked */}
            {!analyticsUnlocked && (
              <div className="absolute bottom-1.5 right-1.5">
                <div className="h-5 w-5 rounded-full bg-muted/80 border border-border flex items-center justify-center">
                  <Lock className="h-2.5 w-2.5 text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 p-4 flex flex-col justify-between gap-3">
            <div className="space-y-1.5">
              {/* URL */}
              <div className="flex items-start gap-2">
                <ExternalLink className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors break-all leading-snug"
                  title={url}
                  data-ocid={`qr-url-link.item.${index}`}
                >
                  {displayUrl}
                </a>
              </div>

              {/* Date */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>{formattedDate}</span>
              </div>

              {/* Notes */}
              {notes && (
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span className="line-clamp-1">{notes}</span>
                </div>
              )}

              {/* Click count text — unlocked */}
              {analyticsUnlocked && (
                <div className="flex items-center gap-2 text-xs">
                  <MousePointerClick className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="font-medium text-foreground">
                    {clickCount ?? 0} click{(clickCount ?? 0) !== 1 ? "s" : ""}
                  </span>
                  <span className="text-muted-foreground">via share link</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
                className="text-xs h-7 px-2.5 gap-1.5"
                data-ocid={`download-qr-btn.item.${index}`}
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>

              {/* Share / Copy Link button */}
              {analyticsUnlocked ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyShareLink}
                  className="text-xs h-7 px-2.5 gap-1.5"
                  data-ocid={`share-link-btn.item.${index}`}
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-primary" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Share2 className="h-3.5 w-3.5" />
                      Share
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyShareLink}
                  className="text-xs h-7 px-2.5 gap-1.5 text-muted-foreground"
                  title="Copy share link (analytics locked)"
                  data-ocid={`copy-share-link-btn.item.${index}`}
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-primary" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy Link
                    </>
                  )}
                </Button>
              )}

              {/* Delete */}
              {confirmDelete ? (
                <div
                  className="flex items-center gap-1.5"
                  data-ocid={`confirm-delete-controls.item.${index}`}
                >
                  <span className="text-xs text-destructive font-medium">
                    Delete?
                  </span>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      onDelete(id);
                      setConfirmDelete(false);
                    }}
                    disabled={isDeleting}
                    className="text-xs h-7 px-2"
                    data-ocid={`confirm-delete-yes.item.${index}`}
                  >
                    Yes, delete
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs h-7 px-2"
                    data-ocid={`confirm-delete-cancel.item.${index}`}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmDelete(true)}
                  className="text-xs h-7 px-2 text-muted-foreground hover:text-destructive"
                  data-ocid={`delete-qr-btn.item.${index}`}
                  aria-label="Delete QR code"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row">
              <Skeleton className="sm:w-36 sm:h-36 h-36 w-full shrink-0" />
              <div className="flex-1 p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="h-7 w-7" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
      data-ocid="profile-empty-state"
    >
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 shadow-sm">
        <QrCode className="h-8 w-8 text-primary" />
      </div>
      <h2 className="font-display text-xl font-bold text-foreground mb-2">
        No saved QR codes yet
      </h2>
      <p className="text-muted-foreground text-sm mb-6 max-w-xs leading-relaxed">
        Generate your first QR code and save it here. They'll appear with the
        URL, date, and your notes.
      </p>
      <Button asChild data-ocid="go-generate-btn">
        <Link to="/">
          <QrCode className="h-4 w-4 mr-2" />
          Generate a QR Code
        </Link>
      </Button>
    </div>
  );
}

// ─── No Results State ─────────────────────────────────────────────────────────

function NoResults({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
      data-ocid="profile-no-results"
    >
      <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4 shadow-sm">
        <Search className="h-7 w-7 text-muted-foreground" />
      </div>
      <h2 className="font-display text-lg font-bold text-foreground mb-1.5">
        No results for "{query}"
      </h2>
      <p className="text-muted-foreground text-sm mb-5 max-w-xs leading-relaxed">
        No saved QR codes match your search. Try a different URL or note
        keyword.
      </p>
      <Button
        variant="outline"
        onClick={onClear}
        className="font-display"
        data-ocid="no-results-clear-btn"
      >
        <X className="h-4 w-4 mr-2" />
        Clear search
      </Button>
    </div>
  );
}

// ─── Profile Content ──────────────────────────────────────────────────────────

function ProfileContent() {
  const { data: entries = [], isLoading } = useMyQrEntries();
  const { data: analyticsUnlockedByPaywall = false } = useGetAnalyticsAccess();
  const { isAdmin } = useIsAdmin();
  // Admin always has analytics unlocked — no paywall required
  const analyticsUnlocked = isAdmin || analyticsUnlockedByPaywall;
  const { data: clickCounts } = useGetMyClickCounts();
  const deleteEntry = useDeleteQrEntry();
  const navigate = useNavigate();
  const { query = "" } = useSearch({ strict: false }) as ProfileSearch;
  const [isZipping, setIsZipping] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  const handleDelete = (id: bigint) => {
    deleteEntry.mutate(id, {
      onSuccess: () => toast.success("QR code deleted"),
      onError: () => toast.error("Failed to delete QR code"),
    });
  };

  const handleSearchChange = (value: string) => {
    void navigate({
      to: "/profile",
      search: { query: value.trim() || undefined },
      replace: true,
    });
  };

  const handleClearSearch = () => {
    void navigate({
      to: "/profile",
      search: { query: undefined },
      replace: true,
    });
  };

  const handleDownloadAll = async () => {
    const withImages = entries.filter((e) => !!e.compositeImage);
    if (withImages.length === 0) {
      toast.error("No downloadable QR codes found.");
      return;
    }
    setIsZipping(true);
    try {
      const zip = new JSZip();
      withImages.forEach((entry, index) => {
        const b64 = dataUrlToBase64(entry.compositeImage!);
        zip.file(`qr-code-${index + 1}.png`, b64, { base64: true });
      });
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-qr-codes.zip";
      a.click();
      URL.revokeObjectURL(url);
      toast.success(
        `Downloaded ${withImages.length} QR code${withImages.length !== 1 ? "s" : ""} as ZIP`,
      );
    } catch {
      toast.error("Failed to create ZIP. Please try again.");
    } finally {
      setIsZipping(false);
    }
  };

  const filteredEntries = query.trim()
    ? entries.filter((e) => {
        const q = query.toLowerCase();
        return (
          e.url.toLowerCase().includes(q) ||
          (e.notes ?? "").toLowerCase().includes(q)
        );
      })
    : entries;

  const hasSearch = query.trim().length > 0;
  const hasEntries = !isLoading && entries.length > 0;

  return (
    <div className="flex-1 bg-background">
      {/* Page header zone */}
      <div className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">
                My QR Codes
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Your saved QR codes — download, share, or manage them anytime.
              </p>
            </div>

            {/* Badge + Download All */}
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
              {hasEntries && (
                <Badge
                  variant="secondary"
                  className="text-sm px-3 py-1"
                  data-ocid="qr-count-badge"
                >
                  {hasSearch
                    ? `${filteredEntries.length} of ${entries.length} codes`
                    : `${entries.length} saved`}
                </Badge>
              )}
              {hasEntries && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadAll}
                  disabled={isZipping}
                  className="gap-1.5 text-sm"
                  data-ocid="download-all-btn"
                >
                  <Archive className="h-4 w-4" />
                  {isZipping ? "Zipping…" : "Download All"}
                </Button>
              )}
            </div>
          </div>

          {/* Search bar */}
          {hasEntries || hasSearch ? (
            <div className="mt-4 relative" data-ocid="search-bar">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                value={query}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by URL or note…"
                className="pl-9 pr-9 h-10 text-sm bg-background"
                aria-label="Search saved QR codes"
                data-ocid="search-input"
              />
              {hasSearch && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                  data-ocid="search-clear-btn"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Analytics locked banner — shown when not yet unlocked */}
      {!analyticsUnlocked && entries.length > 0 && (
        <AnalyticsLockedBanner onUnlock={() => setShowUnlockModal(true)} />
      )}

      {/* Content zone */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {isLoading ? (
          <LoadingSkeleton />
        ) : entries.length === 0 ? (
          <EmptyState />
        ) : filteredEntries.length === 0 ? (
          <NoResults query={query} onClear={handleClearSearch} />
        ) : (
          <div
            className="grid gap-4 sm:grid-cols-2"
            data-ocid="qr-entries-grid"
          >
            {filteredEntries.map((entry, idx) => (
              <QrEntryCard
                key={String(entry.id)}
                entry={entry}
                onDelete={handleDelete}
                isDeleting={deleteEntry.isPending}
                analyticsUnlocked={analyticsUnlocked}
                clickCount={clickCounts?.get(String(entry.id))}
                index={idx + 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* Unlock Analytics Modal */}
      <UnlockAnalyticsModal
        open={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
      />
    </div>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────

export function ProfilePage() {
  const { identity } = useInternetIdentity();

  return (
    <ProtectedRoute>{identity ? <ProfileContent /> : null}</ProtectedRoute>
  );
}
