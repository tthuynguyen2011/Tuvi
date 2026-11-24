"use client";

import { useMemo, useState } from "react";
import {
  lifetimeScores,
  type Chart,
  type FullReport,
  type Milestone,
  type PalaceReading,
  type PalaceYear,
  type YearDetail,
  type YearReading,
} from "@/lib/tuvi";
import { BulletBlock, Card, Pill, Rich, ScoreRing, scoreTone, TONE_STYLES } from "./ui";

/* ---------------------------------- Palace ---------------------------------- */

export function PalaceReadingCard({ pr, highlight }: { pr: PalaceReading; highlight?: boolean }) {
  return (
    <Card className={highlight ? "ring-2 ring-gold" : ""}>
      <div className="flex items-start gap-4">
        <ScoreRing score={pr.score} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-serif text-xl font-semibold text-ink">
              Cung {pr.palace_name} <span className="text-base font-normal text-muted">({pr.chi})</span>
            </h3>
            <Pill tone={scoreTone(pr.score)}>{pr.rating}</Pill>
          </div>
          <p className="mt-0.5 text-sm text-muted">{pr.domain}</p>
          {pr.chinh_tinh.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {pr.chinh_tinh.map((s) => (
                <span key={s.name} className="rounded-md bg-paper px-2 py-0.5 text-xs font-medium text-ink ring-1 ring-line">
                  {s.name} · {s.brightness}
                </span>
              ))}
              {pr.is_vcd && <span className="rounded-md px-2 py-0.5 text-xs italic text-muted">(mượn từ đối cung)</span>}
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 space-y-4">
        <BulletBlock kind="cat" title="Điểm cát · Thế mạnh & cơ hội" items={pr.cat_points} />
        <BulletBlock kind="hung" title="Điểm hung · Cần lưu ý" items={pr.hung_points} />
        <BulletBlock kind="advice" title="Lời khuyên hóa giải" items={pr.advice} />
      </div>
    </Card>
  );
}

export function PalaceReadings({ report }: { report: FullReport }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {report.palace_readings.map((pr) => (
        <PalaceReadingCard key={pr.chi_idx} pr={pr} />
      ))}
    </div>
  );
}

/* --------------------------------- Lifetime --------------------------------- */

const LEGEND = (["cat", "good", "neutral", "warn", "hung"] as const).map((t) => ({ tone: t, ...TONE_STYLES[t] }));

export function LifeChart({ chart, onPickYear }: { chart: Chart; onPickYear: (year: number) => void }) {
  const data = useMemo(() => lifetimeScores(chart), [chart]);
  const [hover, setHover] = useState<number | null>(null);
  const currentAge = chart.info.tuoi_mu;
  const daiHanStarts = new Set(chart.palaces.map((p) => p.dai_han));
  const h = hover !== null ? data[hover] : null;

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-semibold">Biểu đồ vận trình trọn đời</h3>
          <p className="text-sm text-muted">Điểm vận hạn từng năm từ 1 đến 85 tuổi · nhấn vào một năm để xem chi tiết</p>
        </div>
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
          {LEGEND.map((l) => (
            <li key={l.tone} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm" style={{ background: l.dot }} />
              {l.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative">
        {/* tooltip */}
        <div
          className={`pointer-events-none absolute top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-night px-3 py-2 text-xs text-white shadow-xl transition-opacity ${h ? "opacity-100" : "opacity-0"}`}
          style={{ left: hover !== null ? `${((hover + 0.5) / data.length) * 100}%` : 0 }}
        >
          {h && (
            <>
              <div className="font-semibold">
                {h.year} · {h.year_cc} · {h.age} tuổi
              </div>
              <div className="text-gold-light">
                {h.verdict} — {h.score}/100
              </div>
            </>
          )}
        </div>

        <div className="relative h-44 border-b border-line">
          {/* 50 reference line */}
          <div className="absolute inset-x-0 border-t border-dashed border-line" style={{ bottom: "50%" }} />
          <span className="absolute -top-1 right-0 text-[10px] text-muted">100</span>
          <span className="absolute right-0 text-[10px] text-muted" style={{ bottom: "50%" }}>50</span>
          <div className="relative flex h-full items-end gap-[2px]" onMouseLeave={() => setHover(null)}>
            {data.map((d, i) => (
              <button
                key={d.age}
                type="button"
                aria-label={`${d.year}, ${d.age} tuổi: ${d.score} điểm, ${d.verdict}`}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                onClick={() => onPickYear(d.year)}
                className="group relative flex h-full flex-1 items-end outline-none"
              >
                <span
                  className={`w-full rounded-t-[3px] transition-opacity ${TONE_STYLES[d.tone].bar} ${
                    hover !== null && hover !== i ? "opacity-45" : ""
                  } ${d.age === currentAge ? "ring-2 ring-night ring-offset-1" : ""}`}
                  style={{ height: `${d.score}%` }}
                />
              </button>
            ))}
          </div>
        </div>
        <div className="relative mt-1 h-4 text-[10px] text-muted">
          {data.map((d, i) =>
            daiHanStarts.has(d.age) ? (
              <span key={d.age} className="absolute -translate-x-1/2" style={{ left: `${((i + 0.5) / data.length) * 100}%` }}>
                {d.age}
              </span>
            ) : null,
          )}
        </div>
        <p className="mt-1 text-[11px] text-muted">Mốc trục ngang: tuổi bắt đầu mỗi Đại Vận 10 năm · Ô viền đậm: năm đang xem ({chart.info.view_year})</p>
      </div>
    </Card>
  );
}

const MS_STYLE: Record<Milestone["type"], { label: string; dot: string }> = {
  transition: { label: "Chuyển Đại Vận", dot: "bg-night" },
  peak: { label: "Năm bứt phá", dot: "bg-tone-cat" },
  caution: { label: "Năm thử thách", dot: "bg-tone-hung" },
  normal: { label: "", dot: "bg-tone-neutral" },
};

export function Milestones({ report, onPickYear }: { report: FullReport; onPickYear: (y: number) => void }) {
  const [filter, setFilter] = useState<"all" | Milestone["type"]>("all");
  const items = report.milestones.filter((m) => filter === "all" || m.type === filter);
  const filters: { v: typeof filter; label: string }[] = [
    { v: "all", label: `Tất cả (${report.milestones.length})` },
    { v: "transition", label: "Chuyển Đại Vận" },
    { v: "peak", label: "Bứt phá" },
    { v: "caution", label: "Thử thách" },
  ];
  return (
    <Card>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl font-semibold">Những mốc quan trọng trong đời</h3>
          <p className="text-sm text-muted">Năm chuyển Đại Vận, năm đại cát bứt phá và năm thử thách lớn</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.v}
              type="button"
              onClick={() => setFilter(f.v)}
              className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${
                filter === f.v ? "bg-night text-white ring-night" : "bg-white text-muted ring-line hover:text-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
      <ol className="relative space-y-4 border-l-2 border-line pl-6">
        {items.map((ms) => (
          <li key={ms.year} className="relative">
            <span className={`absolute -left-[31px] top-1.5 size-3.5 rounded-full ring-4 ring-card ${MS_STYLE[ms.type].dot}`} />
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => onPickYear(ms.year)} className="font-semibold text-ink hover:text-lacquer hover:underline">
                {ms.year} · {ms.year_cc} · {ms.tuoi_mu} tuổi
              </button>
              <span className="text-xs font-medium text-muted">{MS_STYLE[ms.type].label}</span>
              <Pill tone={scoreTone(ms.score)}>
                {ms.verdict} · {ms.score}
              </Pill>
            </div>
            <p className="mt-1 text-sm text-ink/85">{ms.summary}</p>
            <div className="mt-1.5 space-y-0.5 text-[13px] text-muted">
              <p>
                <span className="font-semibold text-emerald-700">▲ May: </span>
                <Rich text={ms.diem_may.join(" ")} />
              </p>
              <p>
                <span className="font-semibold text-red-700">▼ Hung: </span>
                <Rich text={ms.diem_hung.join(" ")} />
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

/* ---------------------------------- Yearly ---------------------------------- */

export function YearHeader({ yr }: { yr: YearReading }) {
  const dv = yr.dai_van ? `Đại Vận ${yr.dai_van.tuoi_range} · ${yr.dai_van.palace} (${yr.dai_van.chi})` : "Tiểu Nhi Đồng Hạn";
  return (
    <div className="flex items-start gap-4">
      <ScoreRing score={yr.score} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-serif text-xl font-semibold">
            Năm {yr.year} <span className="text-base font-normal text-muted">· {yr.year_cc} · {yr.tuoi_mu} tuổi</span>
          </h3>
          <Pill tone={yr.tone}>{yr.verdict}</Pill>
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs">
          <span className="rounded-md bg-night/5 px-2 py-0.5 text-ink/80">{dv}</span>
          <span className="rounded-md bg-night/5 px-2 py-0.5 text-ink/80">
            Tiểu Hạn: {yr.tieu_han.palace} ({yr.tieu_han.chi})
          </span>
          <span className="rounded-md bg-night/5 px-2 py-0.5 text-ink/80">
            Lưu Thái Tuế: {yr.luu_thai_tue.palace} ({yr.luu_thai_tue.chi})
          </span>
          <span className="rounded-md bg-night/5 px-2 py-0.5 text-ink/80">Ngũ hành năm: {yr.year_hanh}</span>
        </div>
      </div>
    </div>
  );
}

export function YearCard({ yr, onPick }: { yr: YearReading; onPick?: () => void }) {
  return (
    <Card>
      <YearHeader yr={yr} />
      <div className="mt-4 space-y-4">
        <BulletBlock kind="cat" title="Điềm may" items={yr.diem_may} />
        <BulletBlock kind="hung" title="Điềm hung" items={yr.diem_hung} />
        <BulletBlock kind="advice" title="Lời khuyên" items={yr.advice} />
      </div>
      {onPick && (
        <button type="button" onClick={onPick} className="mt-4 text-sm font-semibold text-lacquer hover:underline">
          Soi chi tiết 12 cung năm {yr.year} →
        </button>
      )}
    </Card>
  );
}

/* -------------------------------- Year detail ------------------------------- */

function PalaceYearCard({ py }: { py: PalaceYear }) {
  const tone = py.trend_tone === "cat" ? "good" : py.trend_tone === "warn" ? "warn" : "neutral";
  const delta = py.delta > 0 ? `+${py.delta}` : `${py.delta}`;
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="mb-1 inline-block rounded-md bg-lacquer px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
            Tháng {py.lunar_month} ÂL
          </span>
          <h4 className="font-serif text-lg font-semibold">
            {py.palace_name} <span className="text-sm font-normal text-muted">({py.chi})</span>
          </h4>
          <p className="text-xs text-muted">{py.domain}</p>
        </div>
        <div className="shrink-0 text-right">
          <Pill tone={tone}>{py.trend}</Pill>
          <div className="mt-1 text-xs text-muted">
            {py.base_score} → <strong className="text-ink">{py.year_score}</strong> ({delta})
          </div>
        </div>
      </div>
      {py.roles.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {py.roles.map((r) => (
            <span key={r} className="rounded-full bg-night px-2 py-0.5 text-[11px] font-semibold text-gold-light">
              {r}
            </span>
          ))}
        </div>
      )}
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 rounded-xl bg-paper/70 p-3 text-xs ring-1 ring-line">
        <dt className="text-muted">Bản cung</dt>
        <dd className="font-medium text-ink">{py.ban_chinh.join(", ")}</dd>
        <dt className="text-muted">Xung chiếu</dt>
        <dd className="text-ink">
          <span className="font-medium">{py.xung_palace}</span>: {py.xung_chinh.join(", ")}
        </dd>
        <dt className="text-muted">Tam hợp</dt>
        <dd className="text-ink">{py.tam_hop.join(" · ")}</dd>
        <dt className="text-muted">Sao lưu</dt>
        <dd className="flex flex-wrap gap-1">
          {py.luu_direct.length === 0 && py.luu_xung.length === 0 && <span className="text-muted">Không có</span>}
          {py.luu_direct.map((s) => (
            <span key={s} className="rounded-full bg-gold-soft px-2 py-px font-medium text-amber-900 ring-1 ring-gold/30">
              {s}
            </span>
          ))}
          {py.luu_xung.map((s) => (
            <span key={`x-${s}`} className="rounded-full bg-white px-2 py-px text-muted ring-1 ring-line" title="Sao lưu ở cung xung chiếu">
              ↔ {s}
            </span>
          ))}
        </dd>
      </dl>
      <div className="mt-3 space-y-3">
        <BulletBlock kind="cat" title={`Cát khí tháng ${py.lunar_month}`} items={py.cat_notes} />
        <BulletBlock kind="hung" title={`Lưu ý tháng ${py.lunar_month}`} items={py.hung_notes} />
        <BulletBlock kind="advice" title="Diễn biến & lời khuyên" items={[py.month_advice]} />
      </div>
    </Card>
  );
}

export function YearExplorer({ detail }: { detail: YearDetail }) {
  const yr = detail.year_summary;
  const [sort, setSort] = useState<"month" | "palace">("month");
  const items = sort === "month" ? [...detail.palaces_year].sort((a, b) => a.lunar_month - b.lunar_month) : detail.palaces_year;
  return (
    <div className="space-y-5">
      <Card>
        <YearHeader yr={yr} />
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <BulletBlock kind="cat" title={`Điềm may ${yr.year}`} items={yr.diem_may} />
          <BulletBlock kind="hung" title={`Điềm hung ${yr.year}`} items={yr.diem_hung} />
          <BulletBlock kind="advice" title="Lời khuyên hành động" items={yr.advice} />
        </div>
      </Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-serif text-xl font-semibold">Diễn biến 12 cung theo tháng âm lịch</h3>
        <div role="radiogroup" aria-label="Sắp xếp" className="flex rounded-xl border border-line bg-card p-1 text-sm">
          {(
            [
              ["month", "Theo tháng 1 → 12"],
              ["palace", "Theo cung chính"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={sort === v}
              onClick={() => setSort(v)}
              className={`rounded-lg px-3 py-1.5 font-medium transition ${sort === v ? "bg-night text-white" : "text-muted hover:text-ink"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((py) => (
          <PalaceYearCard key={py.chi_idx} py={py} />
        ))}
      </div>
    </div>
  );
}
