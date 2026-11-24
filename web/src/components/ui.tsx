import type { ReactNode } from "react";
import type { Tone } from "@/lib/tuvi";

/** Renders text with **bold** markers as <strong>, safely (no HTML injection). */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-ink">
            {p}
          </strong>
        ) : (
          p
        ),
      )}
    </>
  );
}

export type AnyTone = Tone | "neutral";

export const TONE_STYLES: Record<Tone, { pill: string; bar: string; dot: string; label: string }> = {
  cat: { pill: "bg-emerald-50 text-emerald-800 ring-emerald-200", bar: "bg-tone-cat", dot: "#1d7a47", label: "Đại cát" },
  good: { pill: "bg-green-50 text-green-800 ring-green-200", bar: "bg-tone-good", dot: "#6aae84", label: "Cát lành" },
  neutral: { pill: "bg-stone-100 text-stone-700 ring-stone-200", bar: "bg-tone-neutral", dot: "#a8a29e", label: "Bình hòa" },
  warn: { pill: "bg-orange-50 text-orange-800 ring-orange-200", bar: "bg-tone-warn", dot: "#df8a4f", label: "Thận trọng" },
  hung: { pill: "bg-red-50 text-red-800 ring-red-200", bar: "bg-tone-hung", dot: "#b9322a", label: "Hung hạn" },
};

export function scoreTone(score: number): Tone {
  if (score >= 75) return "cat";
  if (score >= 60) return "good";
  if (score >= 45) return "neutral";
  if (score >= 32) return "warn";
  return "hung";
}

export function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${TONE_STYLES[tone].pill}`}
    >
      {children}
    </span>
  );
}

/** Circular score gauge. */
export function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const tone = scoreTone(score);
  const r = 15.9155;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-label={`Điểm ${score}/100`}>
      <svg viewBox="0 0 36 36" className="size-full -rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" stroke="#eee5d6" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke={TONE_STYLES[tone].dot}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${score} 100`}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-sm font-bold text-ink">{score}</span>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-line bg-card p-5 shadow-[0_1px_2px_rgba(31,26,23,.04),0_8px_24px_-12px_rgba(31,26,23,.12)] ${className}`}>
      {children}
    </div>
  );
}

export function BulletBlock({
  title,
  items,
  kind,
}: {
  title: string;
  items: string[];
  kind: "cat" | "hung" | "advice";
}) {
  const style = {
    cat: { icon: "✦", head: "text-emerald-800", marker: "bg-emerald-500" },
    hung: { icon: "⚠", head: "text-red-800", marker: "bg-red-500" },
    advice: { icon: "☯", head: "text-amber-800", marker: "bg-gold" },
  }[kind];
  return (
    <div>
      <h4 className={`mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide ${style.head}`}>
        <span aria-hidden>{style.icon}</span>
        {title}
      </h4>
      <ul className="space-y-1.5">
        {items.map((x, i) => (
          <li key={i} className="flex gap-2 text-[14px] leading-relaxed text-ink/85">
            <span className={`mt-2 size-1.5 shrink-0 rounded-full ${style.marker}`} aria-hidden />
            <span>
              <Rich text={x} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-serif text-2xl font-semibold text-ink">{title}</h2>
      {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
    </div>
  );
}
