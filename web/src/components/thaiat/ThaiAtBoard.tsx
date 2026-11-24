"use client";

import type { PalaceMeta, StarRole, TaBoard } from "@/lib/thaiat/engine";

export const ROLE_STYLE: Record<StarRole, { chip: string; label: string }> = {
  chu_te: { chip: "bg-lacquer text-white ring-lacquer", label: "Thái Ất (chủ tể)" },
  chu: { chip: "bg-sky-50 text-sky-900 ring-sky-200", label: "Phe Chủ" },
  khach: { chip: "bg-rose-50 text-rose-900 ring-rose-200", label: "Phe Khách" },
  than: { chip: "bg-violet-50 text-violet-900 ring-violet-200", label: "Thần / Phù" },
  co: { chip: "bg-teal-50 text-teal-900 ring-teal-200", label: "Tam Cơ" },
  phuc: { chip: "bg-emerald-100 text-emerald-900 ring-emerald-300", label: "Ngũ Phúc" },
  tue: { chip: "bg-amber-100 text-amber-900 ring-amber-300", label: "Thái Tuế" },
  nhan_menh: { chip: "bg-night text-gold-light ring-night", label: "12 cung Nhân Mệnh" },
};

const HANH_TEXT: Record<string, string> = {
  Kim: "text-kim",
  Mộc: "text-moc",
  Thủy: "text-thuy",
  Hỏa: "text-hoa",
  Thổ: "text-tho",
};

function Star({ name, role }: { name: string; role: StarRole }) {
  return (
    <span className={`inline-block rounded-md px-1.5 py-px text-[10.5px] font-medium leading-snug ring-1 ring-inset ${ROLE_STYLE[role].chip}`}>
      {name}
    </span>
  );
}

export default function ThaiAtBoard({
  board,
  meta,
  title,
  subtitle,
  centerLines,
  highlight,
  selected,
  onSelect,
}: {
  board: TaBoard;
  meta: Record<string, PalaceMeta>;
  title: string;
  subtitle: string;
  centerLines: [string, string][];
  /** Palace to mark (e.g. Cung Mệnh). */
  highlight?: string;
  selected: string | null;
  onSelect: (palace: string) => void;
}) {
  const rim = Object.entries(meta).filter(([, m]) => m.grid !== null);
  const trung = board.stars_by_palace["Trung"] ?? [];

  return (
    <div className="-mx-5 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
      <div className="grid min-w-[720px] grid-cols-5 grid-rows-[repeat(5,minmax(118px,auto))] gap-px overflow-hidden rounded-xl border border-ink/15 bg-ink/15">
        {rim.map(([p, m]) => {
          const [r, c] = m.grid as [number, number];
          const isSel = p === selected;
          const isAt = p === board.thai_at_cung;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onSelect(p)}
              aria-pressed={isSel}
              aria-label={`Cung ${p}`}
              style={{ gridRow: r + 1, gridColumn: c + 1 }}
              className={`flex flex-col gap-1 p-2 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-lacquer ${
                isSel ? "z-10 bg-gold-soft ring-2 ring-inset ring-gold" : isAt ? "bg-[#fdf0ec]" : m.is_gian ? "bg-paper" : "bg-card hover:bg-paper"
              }`}
            >
              <div className="flex items-baseline justify-between gap-1">
                <span className={`text-[13px] font-bold ${HANH_TEXT[m.hanh] ?? "text-ink"} ${p === highlight ? "underline decoration-lacquer decoration-2 underline-offset-2" : ""}`}>
                  {p}
                  {p === highlight && <span className="ml-1 rounded bg-lacquer px-1 text-[9px] uppercase text-white no-underline">Mệnh</span>}
                </span>
                {m.cung_num !== null ? (
                  <span className="grid size-5 place-items-center rounded-full bg-night text-[10px] font-bold text-gold-light">{m.cung_num}</span>
                ) : (
                  <span className="text-[9px] uppercase tracking-wide text-muted">Gián</span>
                )}
              </div>
              <div className="text-[10px] text-muted">
                {m.hanh} · {m.khi}
              </div>
              <div className="flex flex-wrap gap-1">
                {board.stars_by_palace[p].map((s, i) => (
                  <Star key={i} name={s.name} role={s.role} />
                ))}
              </div>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onSelect("Trung")}
          aria-pressed={selected === "Trung"}
          className={`col-start-2 col-end-5 row-start-2 row-end-5 flex flex-col items-center justify-center gap-2 p-5 text-center outline-none ${
            selected === "Trung" ? "bg-gold-soft ring-2 ring-inset ring-gold" : "bg-[radial-gradient(circle_at_center,#fffaf0,#f6ecd8)]"
          }`}
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold">{subtitle}</span>
          <span className="font-serif text-2xl font-semibold text-ink">{title}</span>
          <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 rounded-lg bg-white/70 px-4 py-2.5 text-left text-[11.5px]">
            {centerLines.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-muted">{k}</dt>
                <dd className="font-semibold text-ink">{v}</dd>
              </div>
            ))}
          </dl>
          {trung.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-1">
              <span className="text-[11px] font-semibold text-muted">Trung Cung (5):</span>
              {trung.map((s, i) => (
                <Star key={i} name={s.name} role={s.role} />
              ))}
            </div>
          )}
        </button>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] text-muted">
        {(Object.keys(ROLE_STYLE) as StarRole[]).map((r) => (
          <li key={r} className="flex items-center gap-1.5">
            <span className={`size-3 rounded ring-1 ring-inset ${ROLE_STYLE[r].chip}`} />
            {ROLE_STYLE[r].label}
          </li>
        ))}
      </ul>
    </div>
  );
}
