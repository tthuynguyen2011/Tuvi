"use client";

import type { Chart, Palace } from "@/lib/tuvi";

/** chi_idx -> [row, col] in the traditional 4x4 layout (Tỵ top-left, Hợi bottom-right). */
const GRID: Record<number, [number, number]> = {
  5: [1, 1], 6: [1, 2], 7: [1, 3], 8: [1, 4],
  4: [2, 1], 9: [2, 4],
  3: [3, 1], 10: [3, 4],
  2: [4, 1], 1: [4, 2], 0: [4, 3], 11: [4, 4],
};

/** Anchor points of each palace on the edge of the center box (percent). */
const ANCHOR: Record<number, [number, number]> = {
  5: [0, 0], 6: [25, 0], 7: [75, 0], 8: [100, 0],
  9: [100, 25], 10: [100, 75], 11: [100, 100],
  0: [75, 100], 1: [25, 100], 2: [0, 100], 3: [0, 75], 4: [0, 25],
};

const HANH_TEXT: Record<string, string> = {
  Kim: "text-kim",
  Mộc: "text-moc",
  Thủy: "text-thuy",
  Hỏa: "text-hoa",
  Thổ: "text-tho",
};
const hanh = (h: string) => HANH_TEXT[h] ?? "text-ink";

function Cell({
  p,
  selected,
  related,
  activeRoles,
  onSelect,
}: {
  p: Palace;
  selected: boolean;
  related: boolean;
  activeRoles: string[];
  onSelect: () => void;
}) {
  const [r, c] = GRID[p.chi_idx];
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{ gridRow: r, gridColumn: c }}
      aria-pressed={selected}
      aria-label={`Cung ${p.display_name} (${p.chi})`}
      className={`group relative flex min-h-[200px] flex-col gap-1 px-2 pb-2 pt-2.5 text-left text-[11px] leading-tight transition outline-none
        ${selected ? "z-10 bg-gold-soft ring-2 ring-gold ring-inset" : related ? "bg-gold-softer" : "bg-card hover:bg-paper"}
        focus-visible:ring-2 focus-visible:ring-lacquer focus-visible:ring-inset`}
    >
      <div className="flex items-start justify-between gap-1">
        <span className={`font-semibold ${hanh(p.can_hanh)}`}>
          {p.can_short} {p.chi}
        </span>
        <span className="flex flex-col items-center">
          <span className={`text-[12px] font-bold tracking-wide ${p.is_menh ? "text-lacquer" : "text-ink"}`}>{p.display_name}</span>
          {p.is_than && <span className="mt-0.5 rounded bg-lacquer px-1 text-[9px] font-bold uppercase text-white">Thân</span>}
        </span>
        <span className="font-semibold text-muted">{p.dai_han}</span>
      </div>

      <div className="min-h-[30px] text-center">
        {p.chinh_tinh.length ? (
          p.chinh_tinh.map((s) => (
            <div key={s.name} className={`text-[12.5px] font-bold uppercase ${hanh(s.hanh)}`}>
              {s.name} <span className="text-[10px] font-semibold opacity-70">({s.brightness})</span>
            </div>
          ))
        ) : (
          <div className="pt-1 text-[11px] font-medium italic text-muted/70">Vô Chính Diệu</div>
        )}
      </div>

      <div className="grid flex-1 grid-cols-2 gap-x-1.5">
        <div className="space-y-px">
          {p.cat_tinh.map((s, i) => (
            <div key={i} className={`${hanh(s.hanh)} ${s.is_luu ? "italic opacity-75" : ""}`}>
              {s.name}
            </div>
          ))}
        </div>
        <div className="space-y-px text-right">
          {p.sat_tinh.map((s, i) => (
            <div key={i} className={`${hanh(s.hanh)} ${s.is_luu ? "italic opacity-75" : ""}`}>
              {s.name}
            </div>
          ))}
        </div>
      </div>

      {activeRoles.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1">
          {activeRoles.map((role) => (
            <span key={role} className="rounded-full bg-night px-1.5 py-px text-[9px] font-semibold text-gold-light">
              {role}
            </span>
          ))}
        </div>
      )}

      <div className="flex justify-between border-t border-dashed border-line pt-1 text-[10px] text-muted">
        <span>Năm {p.tieu_han_chi}</span>
        <span className="font-semibold text-ink/70">{p.trang_sinh}</span>
        <span>Th.{p.nguyet_han}</span>
      </div>
    </button>
  );
}

export default function ChartBoard({
  chart,
  selected,
  onSelect,
}: {
  chart: Chart;
  selected: number;
  onSelect: (chiIdx: number) => void;
}) {
  const { info, palaces } = chart;
  const opp = (selected + 6) % 12;
  const th1 = (selected + 4) % 12;
  const th2 = (selected + 8) % 12;
  const related = new Set([opp, th1, th2]);

  const roles = (i: number) => {
    const r: string[] = [];
    if (i === info.dai_van_chi_idx) r.push("Đại Vận");
    if (i === info.tieu_han_chi_idx) r.push("Tiểu Hạn");
    if (i === info.luu_thai_tue_idx) r.push("L.Thái Tuế");
    return r;
  };

  const pair = (key: "tuan" | "triet") => palaces.filter((p) => p[key]).map((p) => p.chi_idx);
  const badge = (label: string, ids: number[], cls: string) => {
    if (ids.length !== 2) return null;
    const [r1, c1] = GRID[ids[0]];
    const [r2, c2] = GRID[ids[1]];
    const top = (((r1 + r2) / 2 - 0.5) / 4) * 100;
    const left = (((c1 + c2) / 2 - 0.5) / 4) * 100;
    return (
      <span
        className={`pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded px-1.5 text-[9px] font-bold uppercase leading-[13px] tracking-wider shadow ${cls}`}
        style={{ top: `${top}%`, left: `${left}%` }}
      >
        {label}
      </span>
    );
  };

  const [x0, y0] = ANCHOR[selected];
  const line = (to: number, props: React.SVGProps<SVGLineElement>) => (
    <line x1={x0} y1={y0} x2={ANCHOR[to][0]} y2={ANCHOR[to][1]} vectorEffect="non-scaling-stroke" {...props} />
  );

  const rows: [string, string][] = [
    ["Năm sinh", `${info.s_year} · ${info.year_cc}`],
    ["Dương lịch", info.solar],
    ["Âm lịch", info.lunar],
    ["Giờ sinh", info.hour_cc],
    ["Âm Dương", `${info.am_duong} · ${info.am_duong_ly}`],
    ["Bản Mệnh", info.ban_menh],
    ["Cục", `${info.cuc_name} · ${info.menh_cuc_rel}`],
    ["Thân cư", `${info.than_cu} (${info.than_chi})`],
    ["Mệnh chủ", info.menh_chu],
    ["Thân chủ", info.than_chu],
    ["Năm xem", `${info.view_year} · ${info.view_year_cc} · ${info.tuoi_mu} tuổi`],
  ];

  return (
    <div className="-mx-5 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
      <div className="relative grid min-w-[760px] grid-cols-4 grid-rows-4 gap-px overflow-hidden rounded-xl border border-ink/15 bg-ink/15">
        {palaces.map((p) => (
          <Cell
            key={p.chi_idx}
            p={p}
            selected={p.chi_idx === selected}
            related={related.has(p.chi_idx)}
            activeRoles={roles(p.chi_idx)}
            onSelect={() => onSelect(p.chi_idx)}
          />
        ))}

        <div className="relative col-start-2 col-end-4 row-start-2 row-end-4 overflow-hidden bg-[radial-gradient(circle_at_center,#fffaf0,#f6ecd8)]">
          <svg className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            {line(opp, { stroke: "#9b1c1c", strokeWidth: 1.5, strokeDasharray: "6 4", opacity: 0.7 })}
            {line(th1, { stroke: "#b8862b", strokeWidth: 1.5, opacity: 0.8 })}
            {line(th2, { stroke: "#b8862b", strokeWidth: 1.5, opacity: 0.8 })}
            <line
              x1={ANCHOR[th1][0]} y1={ANCHOR[th1][1]} x2={ANCHOR[th2][0]} y2={ANCHOR[th2][1]}
              stroke="#b8862b" strokeWidth={1} strokeDasharray="3 3" opacity={0.6} vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div className="relative flex h-full flex-col items-center justify-center px-8 py-5 text-center">
            <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold">Thiên Bàn</div>
            <div className="mt-1 font-serif text-2xl font-semibold text-ink">{info.name}</div>
            <div className="mb-3 text-xs text-muted">{info.gender} · {info.am_duong}</div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 rounded-lg bg-white/70 px-4 py-2.5 text-left text-[11.5px] backdrop-blur-sm">
              {rows.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted">{k}</dt>
                  <dd className="font-semibold text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 text-[11px] text-muted">
              Đang soi từ cung <strong className="text-lacquer">{palaces[selected].display_name} ({palaces[selected].chi})</strong>
              <span className="ml-2 inline-flex items-center gap-1"><i className="inline-block h-0.5 w-4 bg-gold" /> Tam hợp</span>
              <span className="ml-2 inline-flex items-center gap-1"><i className="inline-block h-0.5 w-4 border-t-2 border-dashed border-lacquer" /> Xung chiếu</span>
            </div>
          </div>
        </div>

        {badge("Tuần", pair("tuan"), "bg-night text-gold-light")}
        {badge("Triệt", pair("triet"), "bg-lacquer text-white")}
      </div>
    </div>
  );
}
