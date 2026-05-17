import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSearch } from "@tanstack/react-router";
import {
  AlertCircle,
  BookmarkIcon,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  ImageIcon,
  Link2,
  Palette,
  QrCode,
  Save,
  Share2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useDeleteStylePreset,
  useGetStylePresets,
  useSaveQrEntry,
  useSaveStylePreset,
} from "../hooks/useBackend";

const URL_REGEX = /^https?:\/\/.+/i;
const QR_SIZE = 220;
const LOGO_SIZE = 48;
const PADDING = 24;
const TEXT_FONT_SIZE = 13;
const LINE_HEIGHT = 20;
const URL_LABEL = "URL: ";

function isValidUrl(val: string): boolean {
  try {
    new URL(val);
    return URL_REGEX.test(val);
  } catch {
    return false;
  }
}

/** Wraps text to multiple lines at ~maxWidth pixels using canvas measurement */
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

/**
 * Waits for the next animation frame to ensure the QRCodeCanvas has
 * re-rendered with the latest props (colors, logo) before we read pixels.
 */
function waitForRender(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      // Second rAF ensures paint phase is also done
      requestAnimationFrame(() => resolve());
    });
  });
}

/**
 * Generates a composite PNG: the QR code canvas with the URL text wrapped below.
 * Returns a Promise<string> (data URL, image/png).
 */
async function generateCompositeImage(
  url: string,
  qrCanvas: HTMLCanvasElement,
): Promise<string> {
  const qrDataUrl = qrCanvas.toDataURL("image/png");

  const qrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = qrDataUrl;
  });

  const offscreen = document.createElement("canvas");
  offscreen.width = QR_SIZE + PADDING * 2;
  offscreen.height = 1;
  const octx = offscreen.getContext("2d")!;
  const fontSpec = `${TEXT_FONT_SIZE}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  octx.font = fontSpec;

  const textMaxWidth = QR_SIZE + PADDING * 2 - PADDING;
  const labeledUrl = URL_LABEL + url;
  const lines = wrapText(octx, labeledUrl, textMaxWidth);
  const textBlockHeight = lines.length * LINE_HEIGHT + 12;

  const totalWidth = QR_SIZE + PADDING * 2;
  const totalHeight = PADDING + QR_SIZE + PADDING / 2 + textBlockHeight;

  const out = document.createElement("canvas");
  out.width = totalWidth;
  out.height = totalHeight;
  const ctx = out.getContext("2d")!;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  ctx.drawImage(qrImg, PADDING, PADDING, QR_SIZE, QR_SIZE);

  const sepY = PADDING + QR_SIZE + PADDING / 4;
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING, sepY);
  ctx.lineTo(PADDING + QR_SIZE, sepY);
  ctx.stroke();

  ctx.fillStyle = "#374151";
  ctx.font = fontSpec;
  ctx.textBaseline = "top";
  const textStartY = PADDING + QR_SIZE + PADDING / 2;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], PADDING, textStartY + i * LINE_HEIGHT);
  }

  return out.toDataURL("image/png");
}

// Route search params type
interface GeneratorSearch {
  url?: string;
  dotColor?: string;
  bgColor?: string;
}

export function GeneratorPage() {
  // Read URL search params to pre-populate from a shared link
  const search = useSearch({ strict: false }) as GeneratorSearch;

  const [inputUrl, setInputUrl] = useState(search.url ?? "");
  const [activeUrl, setActiveUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  // Customization state — pre-populate from share params
  const [dotColor, setDotColor] = useState(search.dotColor ?? "#000000");
  const [bgColor, setBgColor] = useState(search.bgColor ?? "#ffffff");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState<string | null>(null);
  const [showStyleEditor, setShowStyleEditor] = useState(false);

  // Preset state
  const [presetName, setPresetName] = useState("");

  // Share button state
  const [shareCopied, setShareCopied] = useState(false);

  const saveQr = useSaveQrEntry();
  const savePreset = useSaveStylePreset();
  const deletePreset = useDeleteStylePreset();
  const { data: presets = [] } = useGetStylePresets();

  const qrRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const urlValid = isValidUrl(inputUrl);

  // Auto-generate if a url param was provided via share link (run once on mount)
  const initialUrlRef = useRef(search.url);
  useEffect(() => {
    const u = initialUrlRef.current;
    if (u && isValidUrl(u)) {
      setActiveUrl(u);
    }
  }, []);

  function handleGenerate() {
    if (!urlValid) {
      setUrlError("Please enter a valid URL starting with http:// or https://");
      return;
    }
    setUrlError("");
    setActiveUrl(inputUrl);
    setIsSaved(false);
    setNotes("");
  }

  function handleUrlBlur() {
    if (inputUrl && !urlValid) {
      setUrlError("Please enter a valid URL starting with http:// or https://");
    } else {
      setUrlError("");
    }
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    setLogoFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoUrl(ev.target?.result as string);
      setIsSaved(false);
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveLogo() {
    setLogoUrl(null);
    setLogoFileName(null);
    setIsSaved(false);
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  async function handleDownload() {
    if (!activeUrl) return;
    // Wait for canvas to re-render with latest colors/logo
    await waitForRender();
    const qrCanvas = qrRef.current?.querySelector("canvas");
    if (!qrCanvas) return;
    try {
      const dataUrl = await generateCompositeImage(activeUrl, qrCanvas);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "qrcode.png";
      link.click();
      toast.success("QR code downloaded!");
    } catch {
      toast.error("Failed to generate image. Please try again.");
    }
  }

  async function handleSave() {
    if (!activeUrl) return;
    // Wait for canvas to re-render with latest colors/logo before capturing
    await waitForRender();
    const qrCanvas = qrRef.current?.querySelector("canvas");
    let compositeImageData: string | undefined;
    if (qrCanvas) {
      compositeImageData = await generateCompositeImage(activeUrl, qrCanvas);
    }
    try {
      await saveQr.mutateAsync({ url: activeUrl, notes, compositeImageData });
      setIsSaved(true);
      toast.success("QR code saved to your profile!");
    } catch {
      toast.error("Failed to save. Please try again.");
    }
  }

  async function handleSavePreset() {
    if (!presetName.trim()) {
      toast.error("Please enter a preset name.");
      return;
    }
    try {
      await savePreset.mutateAsync({
        name: presetName.trim(),
        dotColor,
        bgColor,
        logoData: logoUrl,
      });
      toast.success(`Preset "${presetName.trim()}" saved!`);
      setPresetName("");
    } catch {
      toast.error("Failed to save preset. Please try again.");
    }
  }

  function handleLoadPreset(preset: {
    dotColor: string;
    bgColor: string;
    logoData: string | null;
  }) {
    setDotColor(preset.dotColor);
    setBgColor(preset.bgColor);
    setLogoUrl(preset.logoData);
    setLogoFileName(preset.logoData ? "preset-logo" : null);
    setIsSaved(false);
    toast.success("Preset loaded!");
  }

  async function handleDeletePreset(id: bigint) {
    try {
      await deletePreset.mutateAsync(id);
      toast.success("Preset deleted.");
    } catch {
      toast.error("Failed to delete preset.");
    }
  }

  async function handleShare() {
    if (!activeUrl) return;
    const params = new URLSearchParams({
      url: activeUrl,
      dotColor,
      bgColor,
    });
    const shareUrl = `${window.location.origin}/?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleGenerate();
  }

  return (
    <div className="flex-1 bg-background">
      {/* ── Hero Input Section ─────────────────────────────── */}
      <section className="bg-card border-b border-border py-10 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold font-display uppercase tracking-wider mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            Free QR Generator
          </div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-foreground">
            Generate a QR Code Instantly
          </h1>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Paste any URL below and get a high-quality QR code in seconds.
            Download it or save it to your profile.
          </p>
        </div>

        <div className="max-w-2xl mx-auto mt-7 space-y-2">
          <Label
            htmlFor="url-input"
            className="text-sm font-medium font-display"
          >
            Website URL
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="url-input"
                type="url"
                value={inputUrl}
                onChange={(e) => {
                  setInputUrl(e.target.value);
                  if (urlError) setUrlError("");
                }}
                onBlur={handleUrlBlur}
                onKeyDown={handleKeyDown}
                placeholder="https://yourbusinesswebsite.com"
                className="pl-9 h-11 text-base"
                aria-invalid={!!urlError}
                aria-describedby={urlError ? "url-error" : undefined}
                data-ocid="url-input"
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={!inputUrl}
              className="h-11 px-5 font-display font-semibold shrink-0"
              data-ocid="generate-btn"
            >
              <QrCode className="h-4 w-4 mr-2" />
              Generate
            </Button>
          </div>
          {urlError && (
            <p
              id="url-error"
              className="flex items-center gap-1.5 text-destructive text-sm"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {urlError}
            </p>
          )}
        </div>
      </section>

      {/* ── QR Output + Actions ─────────────────────────────── */}
      {activeUrl ? (
        <section className="bg-background py-10 px-4">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6 items-start">
            {/* QR Preview */}
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-primary" />
                  Your QR Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* QR canvas */}
                <div
                  className="flex items-center justify-center p-6 bg-muted/30 rounded-lg border border-border"
                  ref={qrRef}
                >
                  <div className="p-4 bg-card rounded-xl shadow-md">
                    <QRCodeCanvas
                      value={activeUrl}
                      size={QR_SIZE}
                      level="H"
                      marginSize={2}
                      fgColor={dotColor}
                      bgColor={bgColor}
                      style={{ display: "block" }}
                      imageSettings={
                        logoUrl
                          ? {
                              src: logoUrl,
                              x: undefined,
                              y: undefined,
                              height: LOGO_SIZE,
                              width: LOGO_SIZE,
                              excavate: true,
                            }
                          : undefined
                      }
                    />
                  </div>
                </div>

                {/* URL preview row */}
                <div className="rounded-md bg-muted/40 border border-border px-3 py-2">
                  <p className="text-xs text-muted-foreground font-mono break-all leading-relaxed">
                    <span className="font-semibold text-foreground">URL: </span>
                    {activeUrl}
                  </p>
                </div>

                {/* Edit Style toggle button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStyleEditor((v) => !v)}
                  className="w-full font-display text-sm"
                  data-ocid="edit-style-btn"
                >
                  <Palette className="h-4 w-4 mr-2 text-primary" />
                  Edit Style
                  {showStyleEditor ? (
                    <ChevronUp className="h-4 w-4 ml-auto text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground" />
                  )}
                </Button>

                {/* Style editor — collapsible */}
                {showStyleEditor && (
                  <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-3">
                    {/* Color pickers */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium font-display flex items-center gap-1.5">
                          <Palette className="h-3.5 w-3.5 text-primary" />
                          Dot color
                        </Label>
                        <div className="flex items-center gap-2 border border-border rounded-md px-2 py-1.5 bg-background">
                          <input
                            type="color"
                            value={dotColor}
                            onChange={(e) => {
                              setDotColor(e.target.value);
                              setIsSaved(false);
                            }}
                            className="h-6 w-8 rounded cursor-pointer border-0 bg-transparent p-0"
                            aria-label="QR dot color"
                            data-ocid="dot-color-picker"
                          />
                          <span className="text-xs text-muted-foreground font-mono uppercase">
                            {dotColor}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium font-display flex items-center gap-1.5">
                          <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                          Background
                        </Label>
                        <div className="flex items-center gap-2 border border-border rounded-md px-2 py-1.5 bg-background">
                          <input
                            type="color"
                            value={bgColor}
                            onChange={(e) => {
                              setBgColor(e.target.value);
                              setIsSaved(false);
                            }}
                            className="h-6 w-8 rounded cursor-pointer border-0 bg-transparent p-0"
                            aria-label="QR background color"
                            data-ocid="bg-color-picker"
                          />
                          <span className="text-xs text-muted-foreground font-mono uppercase">
                            {bgColor}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Logo upload */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium font-display flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5 text-primary" />
                        Center logo
                      </Label>
                      {logoUrl ? (
                        <div className="flex items-center gap-2 border border-border rounded-md px-3 py-2 bg-background">
                          <img
                            src={logoUrl}
                            alt="Logo preview"
                            className="h-7 w-7 rounded object-contain bg-card border border-border"
                          />
                          <span className="flex-1 text-xs text-foreground truncate min-w-0">
                            {logoFileName}
                          </span>
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                            aria-label="Remove logo"
                            data-ocid="remove-logo-btn"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => logoInputRef.current?.click()}
                          className="w-full font-display"
                          data-ocid="upload-logo-btn"
                        >
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Upload logo image
                        </Button>
                      )}
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoChange}
                        aria-label="Logo file input"
                      />
                    </div>

                    {/* ── My Presets ──────────────────────────────── */}
                    <div className="space-y-2 pt-2 border-t border-border">
                      <p className="text-xs font-semibold font-display text-foreground flex items-center gap-1.5">
                        <BookmarkIcon className="h-3.5 w-3.5 text-primary" />
                        My Presets
                      </p>

                      <>
                        {/* Save preset row */}
                        <div className="flex gap-2">
                          <Input
                            value={presetName}
                            onChange={(e) =>
                              setPresetName(e.target.value.slice(0, 50))
                            }
                            placeholder="Preset name…"
                            className="flex-1 h-8 text-xs"
                            maxLength={50}
                            data-ocid="preset-name-input"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 shrink-0 font-display text-xs"
                            onClick={handleSavePreset}
                            disabled={
                              savePreset.isPending || !presetName.trim()
                            }
                            data-ocid="save-preset-btn"
                          >
                            <Save className="h-3.5 w-3.5 mr-1" />
                            Save
                          </Button>
                        </div>

                        {/* Saved presets list */}
                        {presets.length > 0 ? (
                          <ul className="space-y-1" data-ocid="presets-list">
                            {presets.map((preset) => (
                              <li
                                key={String(preset.id)}
                                className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5"
                              >
                                {/* Color swatches */}
                                <div className="flex gap-1 shrink-0">
                                  <span
                                    className="h-4 w-4 rounded-sm border border-border"
                                    style={{ background: preset.dotColor }}
                                    title={`Dot: ${preset.dotColor}`}
                                  />
                                  <span
                                    className="h-4 w-4 rounded-sm border border-border"
                                    style={{ background: preset.bgColor }}
                                    title={`BG: ${preset.bgColor}`}
                                  />
                                </div>
                                <span className="flex-1 text-xs text-foreground truncate min-w-0">
                                  {preset.name}
                                </span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs font-display"
                                  onClick={() => handleLoadPreset(preset)}
                                  data-ocid={`load-preset-${preset.id}`}
                                >
                                  Load
                                </Button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePreset(preset.id)}
                                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                                  aria-label={`Delete preset ${preset.name}`}
                                  data-ocid={`delete-preset-${preset.id}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p
                            className="text-xs text-muted-foreground italic"
                            data-ocid="presets-empty"
                          >
                            No presets yet. Save your current style above.
                          </p>
                        )}
                      </>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleDownload}
                    className="flex-1 font-display font-semibold"
                    data-ocid="download-btn"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleShare}
                    className="shrink-0 font-display font-semibold transition-colors"
                    data-ocid="share-btn"
                  >
                    {shareCopied ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2 text-primary" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Save Card */}
            <div className="space-y-4">
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base flex items-center gap-2">
                    <Save className="h-4 w-4 text-primary" />
                    Save to Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="notes-input"
                      className="text-sm font-medium font-display flex justify-between"
                    >
                      <span>Notes</span>
                      <span
                        className={`text-xs tabular-nums ${notes.length > 28 ? "text-destructive" : "text-muted-foreground"}`}
                      >
                        {notes.length}/30
                      </span>
                    </Label>
                    <Textarea
                      id="notes-input"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value.slice(0, 30))}
                      placeholder="Optional note (e.g. Summer Campaign)"
                      maxLength={30}
                      rows={2}
                      className="resize-none text-sm"
                      data-ocid="notes-input"
                    />
                  </div>
                  <Button
                    onClick={handleSave}
                    disabled={saveQr.isPending || isSaved}
                    className="w-full font-display font-semibold"
                    data-ocid="save-btn"
                  >
                    {isSaved ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Saved!
                      </>
                    ) : saveQr.isPending ? (
                      <>
                        <div className="h-4 w-4 mr-2 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save QR Code
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      ) : (
        /* Empty state — prompt user */
        <section className="bg-background flex-1 flex items-center justify-center py-20 px-4">
          <div className="text-center space-y-4 max-w-sm">
            <div className="mx-auto h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <QrCode className="h-10 w-10 text-primary" />
            </div>
            <h2 className="font-display font-semibold text-xl text-foreground">
              Ready to generate
            </h2>
            <p className="text-muted-foreground text-sm">
              Enter a URL above and click{" "}
              <strong className="text-foreground">Generate</strong> to create
              your QR code instantly.
            </p>
          </div>
        </section>
      )}

      {/* ── How it Works ───────────────────────────────────── */}
      <section className="bg-muted/30 border-t border-border py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display font-bold text-lg text-foreground text-center mb-6">
            How it works
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {STEPS.map((step) => (
              <div
                key={step.step}
                className="flex gap-3 bg-card rounded-lg p-4 border border-border"
              >
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display font-bold text-sm shrink-0">
                  {step.step}
                </div>
                <div>
                  <p className="font-display font-semibold text-sm text-foreground">
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const STEPS = [
  {
    step: 1,
    title: "Paste your URL",
    desc: "Enter any website address — product pages, landing pages, social profiles, etc.",
  },
  {
    step: 2,
    title: "Generate instantly",
    desc: "A high-quality QR code is generated on-device in milliseconds. No account needed.",
  },
  {
    step: 3,
    title: "Download & share",
    desc: "Save the PNG to use on flyers, packaging, presentations, or anywhere else.",
  },
];
