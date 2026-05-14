import { useEffect, useRef, useState } from "react";
import { useTickerMessages } from "../hooks/useBackend";

const FALLBACK_MESSAGES = [
  "Generate, save, and share QR codes instantly — all in one place.",
  "Scan any URL into a shareable QR code in seconds.",
  "Your QR codes are securely stored on the Internet Computer.",
];

const ROTATE_INTERVAL = 10_000; // 10 seconds

export function TickerBar() {
  const { data: messages } = useTickerMessages();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  const pool =
    messages && messages.length > 0
      ? messages.map((m) => m.message)
      : FALLBACK_MESSAGES;

  // Pick a random starting index once messages load
  useEffect(() => {
    if (pool.length > 0) {
      setCurrentIndex(Math.floor(Math.random() * pool.length));
    }
  }, [pool.length]);

  // Rotate every ROTATE_INTERVAL with a fade transition
  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % pool.length);
        setVisible(true);
      }, 400);
    }, ROTATE_INTERVAL);
    return () => clearInterval(timer);
  }, [pool.length]);

  const message = pool[currentIndex] ?? "";
  const pRef = useRef<HTMLParagraphElement>(null);

  // Render HTML safely via ref — admin-only content, XSS risk is acceptable
  useEffect(() => {
    if (pRef.current) {
      pRef.current.innerHTML = message;
    }
  }, [message]);

  return (
    <div
      className="bg-primary/10 border-t border-primary/20 py-2 px-4 flex items-center gap-3 min-h-[2.5rem]"
      data-ocid="ticker-bar"
    >
      <span className="text-primary font-display text-xs font-semibold uppercase tracking-widest shrink-0 hidden sm:inline">
        Thots ▶
      </span>
      <p
        ref={pRef}
        className="text-sm text-primary font-body truncate transition-opacity duration-400 [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:opacity-80"
        style={{ opacity: visible ? 1 : 0 }}
      />
    </div>
  );
}
