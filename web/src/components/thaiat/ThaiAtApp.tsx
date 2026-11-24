"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { HOURS, MAX_YEAR, MIN_YEAR, validateBirth, type BirthInput } from "@/lib/tuvi";
import {
  analyzeDivination,
  analyzeNhanMenh,
  FOLLOWUP_PROMPTS,
  TOPICS,
  type Narrative,
  type Pattern,
  type Stance,
  type ToanEval,
  type Urgency,
} from "@/lib/thaiat/analyzer";
import {
  buildDivinationChart,
  buildNhanMenhChart,
  PALACE_DIRECTION,
  type DivinationChart,
  type KeMode,
  type NhanMenhChart,
} from "@/lib/thaiat/engine";
import BirthForm from "../BirthForm";
import SiteNav from "../SiteNav";
import { Card, Rich } from "../ui";
import ThaiAtBoard, { ROLE_STYLE } from "./ThaiAtBoard";

type Mode = "divination" | "nhan_menh";

interface DivForm {
  question: string;
  topic: string;
  keMode: KeMode;
  day: number;
  month: number;
  year: number;
  hour: number;
  birthYear: string;
}

const KE_MODES: { value: KeMode; label: string }[] = [
  { value: "thoi_ke", label: "Thời Kế — theo giờ (72 khối)" },
  { value: "nhat_ke", label: "Nhật Kế — theo ngày" },
  { value: "nguyet_ke", label: "Nguyệt Kế — theo tháng" },
  { value: "tue_ke", label: "Tuế Kế — theo năm" },
];

/** Current date & Chi-hour in Vietnam time (the engine works in UTC+7). */
function nowInVietnam() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Ho_Chi_Minh",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      hourCycle: "h23",
    })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  );
  const h = Number(parts.hour);
  const hour = h === 23 || h === 0 ? 0 : Math.floor((h + 1) / 2) * 2;
  return { day: Number(parts.day), month: Number(parts.month), year: Number(parts.year), hour: hour % 24 };
}

const DEFAULT_DIV: DivForm = { question: "", topic: "chung", keMode: "thoi_ke", day: 1, month: 1, year: 2026, hour: 12, birthYear: "" };
const DEFAULT_NM: BirthInput = {
  name: "",
  gender: "Nữ",
  calendar: "solar",
  day: 1,
  month: 1,
  year: 1995,
  hour: 8,
  isLeap: false,
  viewYear: 2026,
  numYears: 15,
};

const SEVERITY: Record<Pattern["severity"], { box: string; tag: string; label: string }> = {
  hung: { box: "border-red-200 bg-red-50/60", tag: "bg-red-100 text-red-800", label: "Hung" },
  canh_bao: { box: "border-orange-200 bg-orange-50/60", tag: "bg-orange-100 text-orange-800", label: "Cảnh báo" },
  cat: { box: "border-emerald-200 bg-emerald-50/60", tag: "bg-emerald-100 text-emerald-800", label: "Cát" },
};

export default function ThaiAtApp() {
  const [mode, setMode] = useState<Mode>("divination");
  const [div, setDiv] = useState<DivForm>(DEFAULT_DIV);
  const [nm, setNm] = useState<BirthInput>(DEFAULT_NM);
  const [error, setError] = useState<string | null>(null);

  const [divChart, setDivChart] = useState<DivinationChart | null>(null);
  const [stance, setStance] = useState<Stance>("auto");
  const [urgency, setUrgency] = useState<Urgency>("binh_thuong");
  const [ctxDraft, setCtxDraft] = useState("");
  const [ctx, setCtx] = useState("");

  const [nmChart, setNmChart] = useState<NhanMenhChart | null>(null);
  const [nmBoard, setNmBoard] = useState<"birth" | "view">("birth");
  const [selected, setSelected] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Fill "now" (Vietnam time) and reuse the person last entered on the Tử Vi page. Client-only, after hydration.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const now = nowInVietnam();
    setDiv((d) => ({ ...d, ...now }));
    let saved: Partial<BirthInput> | null = null;
    try {
      saved = JSON.parse(localStorage.getItem("tuvi:last-input") ?? "null");
    } catch {}
    setNm((n) => ({ ...n, ...(saved ?? {}), viewYear: now.year }));
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const divAnalysis = useMemo(() => (divChart ? analyzeDivination(divChart, stance, urgency, ctx) : null), [divChart, stance, urgency, ctx]);
  const nmAnalysis = useMemo(() => (nmChart ? analyzeNhanMenh(nmChart) : null), [nmChart]);
  const hasResult = mode === "divination" ? !!divChart : !!nmChart;

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setSelected(null);
  };

  const castDivination = () => {
    const err = validateBirth({ ...DEFAULT_NM, calendar: "solar", day: div.day, month: div.month, year: div.year, hour: div.hour, viewYear: div.year });
    const by = div.birthYear.trim() === "" ? null : Number(div.birthYear);
    if (err) return setError(err.replace("Năm sinh", "Năm gieo quẻ"));
    if (by !== null && (!Number.isInteger(by) || by < MIN_YEAR || by > MAX_YEAR))
      return setError(`Năm sinh người hỏi phải trong khoảng ${MIN_YEAR}–${MAX_YEAR}.`);
    setError(null);
    setStance("auto");
    setUrgency("binh_thuong");
    setCtx("");
    setCtxDraft("");
    setSelected(null);
    setDivChart(
      buildDivinationChart({
        dd: div.day,
        mm: div.month,
        yy: div.year,
        hour_24: div.hour,
        ke_mode: div.keMode,
        question: div.question.trim().slice(0, 200),
        topic: div.topic,
        querent_birth_year: by,
      }),
    );
  };

  const castNhanMenh = () => {
    const err = validateBirth(nm);
    if (err) return setError(err);
    setError(null);
    setSelected(null);
    setNmBoard("birth");
    setNmChart(
      buildNhanMenhChart({
        name: nm.name.trim() || "Đương Số",
        gender: nm.gender,
        dd: nm.day,
        mm: nm.month,
        yy: nm.year,
        hour_24: nm.hour,
        is_lunar: nm.calendar === "lunar",
        is_leap: nm.calendar === "lunar" && nm.isLeap,
        view_year: nm.viewYear,
      }),
    );
  };

  const exportWord = async () => {
    const chart = mode === "divination" ? divChart : nmChart;
    const analysis = mode === "divination" ? divAnalysis : nmAnalysis;
    if (!chart || !analysis) return;
    setExporting(true);
    try {
      const { exportThaiAtDocx } = await import("@/lib/thaiat/docx");
      const blob = await exportThaiAtDocx(chart, analysis);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = mode === "divination" ? "Que_Thai_At_Than_Kinh.docx" : `Thai_At_Nhan_Menh_${(nmChart?.name ?? "").replace(/\s+/g, "_")}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-stars text-white">
        <SiteNav active="thai-at" />
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-5 pb-8 pt-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gold-light">太乙神經 · Thái Ất Thần Kinh</p>
            <h1 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">Gieo quẻ hỏi việc &amp; Nhân Mệnh</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/70">
              Bàn 16 cung, 72 khối Âm/Dương Độn, Toán Chủ – Khách và cách cục Ếm, Kích, Ép, Giam — luận giải tương tác theo đúng hoàn cảnh của bạn.
            </p>
          </div>
          {hasResult && (
            <div className="no-print flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10"
              >
                🖨 <span className="hidden sm:inline">In</span>
              </button>
              <button
                type="button"
                onClick={exportWord}
                disabled={exporting}
                className="whitespace-nowrap rounded-lg bg-gold-light px-3.5 py-2 text-sm font-semibold text-night shadow transition hover:bg-gold-soft disabled:opacity-60"
              >
                {exporting ? "Đang xuất…" : "⬇ Word"}
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-5 px-5 pb-16 pt-6">
        {/* Mode switch */}
        <div role="tablist" className="no-print grid gap-2 sm:grid-cols-2">
          {(
            [
              ["divination", "🔮", "Gieo quẻ hỏi việc", "Hỏi một việc cụ thể tại một thời điểm — Thời / Nhật / Nguyệt / Tuế Kế"],
              ["nhan_menh", "📜", "Thái Ất Nhân Mệnh", "Cung Mệnh, 12 cung, toán số Tứ Trụ và vận hạn năm xem"],
            ] as const
          ).map(([m, icon, title, desc]) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                mode === m ? "border-night bg-night text-white shadow-lg" : "border-line bg-card hover:border-gold"
              }`}
            >
              <span className="text-2xl" aria-hidden>
                {icon}
              </span>
              <span>
                <span className="block font-semibold">{title}</span>
                <span className={`block text-sm ${mode === m ? "text-white/65" : "text-muted"}`}>{desc}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Forms */}
        <Card className="no-print p-5 sm:p-6">
          {mode === "divination" ? (
            <DivinationForm value={div} onChange={setDiv} onSubmit={castDivination} error={error} />
          ) : (
            <BirthForm
              value={nm}
              onChange={setNm}
              onSubmit={castNhanMenh}
              error={error}
              showNumYears={false}
              submitLabel="📜 Lập quẻ Ất Nhân Mệnh"
            />
          )}
        </Card>

        {/* -------------------------- Divination result -------------------------- */}
        {mode === "divination" && divChart && divAnalysis && (
          <>
            <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
              <Card className="min-w-0 p-3 sm:p-4">
                <ThaiAtBoard
                  board={divChart.board}
                  meta={divChart.palace_meta}
                  title={`${divChart.board.don_type} · Cục ${divChart.board.cuc}`}
                  subtitle="Bàn Thái Ất Thần Kinh"
                  centerLines={[
                    ["Thời điểm", `${HOURS.find((h) => h.value === divChart.solar.hour_24)?.chi ?? ""} ${divChart.solar.day}/${divChart.solar.month}/${divChart.solar.year}`],
                    ["Âm lịch", `${divChart.lunar.day}/${divChart.lunar.month}/${divChart.lunar.year}${divChart.lunar.is_leap ? " (nhuận)" : ""}`],
                    ["Tứ trụ", `${divChart.can_chi.year} · ${divChart.can_chi.month} · ${divChart.can_chi.day} · ${divChart.can_chi.hour}`],
                    ["Kế", KE_MODES.find((k) => k.value === divChart.ke_mode)?.label ?? ""],
                    ["Nguyên · Kỷ dư", `Nguyên ${divChart.board.nguyen} · ${divChart.board.ky_du}`],
                    ["Toán Chủ / Khách", `${divChart.board.chu.toan} / ${divChart.board.khach.toan}`],
                  ]}
                  selected={selected}
                  onSelect={(p) => setSelected((s) => (s === p ? null : p))}
                />
              </Card>
              <div className="xl:sticky xl:top-4 xl:max-h-[calc(100dvh-2rem)] xl:overflow-y-auto">
                {selected ? (
                  <PalaceDetail palace={selected} chart={divChart} onBack={() => setSelected(null)} />
                ) : (
                  <Card>
                    <h2 className="font-serif text-xl font-semibold">☯ Kết luận quẻ</h2>
                    <p className="text-sm text-muted">{divAnalysis.topic_label}</p>
                    {divChart.question && <p className="mt-2 text-sm italic text-ink/80">“{divChart.question}”</p>}
                    <div className="mt-3 rounded-xl border-l-4 border-lacquer bg-gold-soft/60 p-3 text-[15px] leading-relaxed">
                      <Rich text={divAnalysis.stance_verdict} />
                    </div>
                    <p className="mt-3 text-sm leading-relaxed">
                      <Rich text={divAnalysis.direction_advice} />
                    </p>
                    {divAnalysis.querent_note && (
                      <p className="mt-2 text-sm leading-relaxed">
                        <Rich text={divAnalysis.querent_note} />
                      </p>
                    )}
                    <div className="mt-3 rounded-xl bg-paper p-3 text-sm leading-relaxed ring-1 ring-line">{divAnalysis.topic_advice}</div>
                    <h3 className="mb-2 mt-4 text-[13px] font-semibold uppercase tracking-wide text-muted">Cách cục Thái Ất</h3>
                    <Patterns items={divAnalysis.patterns} />
                  </Card>
                )}
              </div>
            </div>

            <Card className="no-print">
              <h2 className="font-serif text-xl font-semibold">💬 Hỏi đáp để luận sát hoàn cảnh</h2>
              <p className="text-sm text-muted">Chọn vị thế và mức độ gấp gáp của bạn — lời luận Chủ/Khách và khuyến nghị cập nhật ngay.</p>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {FOLLOWUP_PROMPTS.map((pr) => {
                  const cur = pr.id === "stance" ? stance : urgency;
                  const set = (v: string) => {
                    if (pr.id === "stance") setStance(cur === v ? "auto" : (v as Stance));
                    else setUrgency(cur === v ? "binh_thuong" : (v as Urgency));
                  };
                  return (
                    <div key={pr.id}>
                      <p className="mb-2 text-sm font-semibold">{pr.question}</p>
                      <div className="flex flex-col gap-2">
                        {pr.options.map((op) => (
                          <button
                            key={op.value}
                            type="button"
                            aria-pressed={cur === op.value}
                            onClick={() => set(op.value)}
                            className={`rounded-xl border px-3.5 py-2.5 text-left text-sm transition ${
                              cur === op.value ? "border-lacquer bg-lacquer text-white shadow" : "border-line bg-white hover:border-gold"
                            }`}
                          >
                            {op.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <form
                className="mt-4 flex flex-col gap-2 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  setCtx(ctxDraft.trim().slice(0, 300));
                }}
              >
                <input
                  aria-label="Thêm chi tiết hoàn cảnh"
                  className="field-input flex-1"
                  value={ctxDraft}
                  maxLength={300}
                  onChange={(e) => setCtxDraft(e.target.value)}
                  placeholder="Thêm chi tiết hoàn cảnh (tùy chọn), ví dụ: Đối tác đang muốn ký gấp trong tuần…"
                />
                <button type="submit" className="rounded-xl bg-night px-4 py-2.5 text-sm font-semibold text-white hover:bg-night-2">
                  Cập nhật luận giải
                </button>
              </form>
              {divAnalysis.extra_context_note && <p className="mt-2 text-xs text-muted">{divAnalysis.extra_context_note}</p>}
            </Card>

            <div className="grid gap-5 md:grid-cols-2">
              <ToanCard title="Toán Chủ" ev={divAnalysis.chu_eval} />
              <ToanCard title="Toán Khách" ev={divAnalysis.khach_eval} />
            </div>
            <TongGiai sn={divAnalysis.summary_narrative} />
          </>
        )}

        {/* -------------------------- Nhân Mệnh result -------------------------- */}
        {mode === "nhan_menh" && nmChart && nmAnalysis && (
          <>
            <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
              <Card className="min-w-0 p-3 sm:p-4">
                <div className="no-print mb-3 flex flex-wrap gap-1 rounded-xl border border-line bg-paper p-1 text-sm sm:w-fit">
                  {(
                    [
                      ["birth", "Bàn bản mệnh (Nhật Kế)"],
                      ["view", `Bàn năm ${nmChart.view_year} (Tuế Kế)`],
                    ] as const
                  ).map(([v, label]) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={nmBoard === v}
                      onClick={() => {
                        setNmBoard(v);
                        setSelected(null);
                      }}
                      className={`rounded-lg px-3 py-1.5 font-medium transition ${nmBoard === v ? "bg-white text-lacquer shadow-sm ring-1 ring-line" : "text-muted hover:text-ink"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {nmBoard === "birth" ? (
                  <ThaiAtBoard
                    board={nmChart.board}
                    meta={nmChart.palace_meta}
                    title={nmChart.name}
                    subtitle="Thái Ất Nhân Mệnh"
                    highlight={nmChart.menh_cung}
                    centerLines={[
                      ["Âm Dương", `${nmChart.am_duong_menh} · ${nmAnalysis.menh_overview.chieu_an_cung}`],
                      ["Sinh", `${nmChart.solar.day}/${nmChart.solar.month}/${nmChart.solar.year} (ÂL ${nmChart.lunar.day}/${nmChart.lunar.month}/${nmChart.lunar.year})`],
                      ["Tứ trụ", `${nmChart.can_chi.year} · ${nmChart.can_chi.month} · ${nmChart.can_chi.day} · ${nmChart.can_chi.hour}`],
                      ["Cung Mệnh", `${nmChart.menh_cung} (${nmAnalysis.menh_overview.menh_hanh} · ${nmAnalysis.menh_overview.menh_khi})`],
                      ["Nạp Âm", nmAnalysis.menh_overview.nap_am],
                      ["Kỷ dư · Cục", `${nmChart.days_tich} ngày · Cục ${nmChart.board.cuc}`],
                    ]}
                    selected={selected}
                    onSelect={(p) => setSelected((s) => (s === p ? null : p))}
                  />
                ) : (
                  <ThaiAtBoard
                    board={nmChart.view_board}
                    meta={nmChart.palace_meta}
                    title={`Năm ${nmChart.view_year}`}
                    subtitle={`Tuế Kế · ${nmChart.view_year_can_chi}`}
                    highlight={nmChart.menh_cung}
                    centerLines={[
                      ["Độn · Cục", `${nmChart.view_board.don_type} · Cục ${nmChart.view_board.cuc}`],
                      ["Thái Ất", `${nmChart.view_board.thai_at_cung} (${PALACE_DIRECTION[nmChart.view_board.thai_at_cung]})`],
                      ["Toán Chủ / Khách", `${nmChart.view_board.chu.toan} / ${nmChart.view_board.khach.toan}`],
                      ["Ngũ Phúc", `${nmChart.view_board.ngu_phuc_cung} (${PALACE_DIRECTION[nmChart.view_board.ngu_phuc_cung]})`],
                    ]}
                    selected={selected}
                    onSelect={(p) => setSelected((s) => (s === p ? null : p))}
                  />
                )}
              </Card>
              <div className="xl:sticky xl:top-4 xl:max-h-[calc(100dvh-2rem)] xl:overflow-y-auto">
                {selected ? (
                  <PalaceDetail palace={selected} chart={nmChart} board={nmBoard === "view" ? nmChart.view_board : nmChart.board} onBack={() => setSelected(null)} />
                ) : (
                  <Card>
                    <h2 className="font-serif text-xl font-semibold">📜 Luận Thái Ất Nhân Mệnh</h2>
                    <p className="text-sm text-muted">
                      {nmChart.name} · {nmAnalysis.menh_overview.am_duong_menh} · {nmAnalysis.menh_overview.chieu_an_cung}
                    </p>
                    <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-xl border-l-4 border-lacquer bg-gold-soft/60 p-3 text-sm">
                      <dt className="text-muted">Cung Mệnh</dt>
                      <dd className="font-semibold">
                        {nmAnalysis.menh_overview.menh_cung} · {nmAnalysis.menh_overview.menh_hanh} · {nmAnalysis.menh_overview.menh_khi}
                      </dd>
                      <dt className="text-muted">Nạp Âm</dt>
                      <dd className="font-semibold">{nmAnalysis.menh_overview.nap_am}</dd>
                      <dt className="text-muted">Quan hệ</dt>
                      <dd>{nmAnalysis.menh_overview.relation}</dd>
                    </dl>
                    <h3 className="mt-4 font-semibold">
                      Vận hạn năm {nmAnalysis.view_year_analysis.year} ({nmAnalysis.view_year_analysis.can_chi}) · Cục {nmAnalysis.view_year_analysis.cuc}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed">
                      <Rich text={nmAnalysis.view_year_analysis.hit_note} />
                    </p>
                    <p className="mt-2 text-sm leading-relaxed">
                      <Rich text={nmAnalysis.view_year_analysis.balance.summary} />
                    </p>
                    <div className="mt-3">
                      <Patterns items={nmAnalysis.view_year_analysis.patterns} />
                    </div>
                  </Card>
                )}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Card>
                <h3 className="font-serif text-lg font-semibold">Toán số Tứ Trụ · Tổng {nmChart.toan_so.total}</h3>
                <p className="text-xs text-muted">Nạp Giáp Can + Chi + Nạp Âm (Cuốn VII)</p>
                <table className="mt-3 w-full text-sm">
                  <tbody>
                    {(
                      [
                        ["Năm", nmChart.toan_so.year],
                        ["Tháng", nmChart.toan_so.month],
                        ["Ngày", nmChart.toan_so.day],
                        ["Giờ", nmChart.toan_so.hour],
                      ] as const
                    ).map(([k, n]) => (
                      <tr key={k} className="border-b border-line/70 last:border-0">
                        <td className="py-1.5 text-muted">{k}</td>
                        <td className="py-1.5 font-medium">
                          {n.can} {n.chi}
                        </td>
                        <td className="py-1.5 text-xs text-muted">
                          {n.can_num} + {n.chi_num} + {n.nap_am_num} ({n.nap_am})
                        </td>
                        <td className="py-1.5 text-right font-bold">{n.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2 text-xs text-muted">
                  Ngày + Giờ: {nmChart.toan_so.day_hour_sum} · Giáp Tý sau Đông Chí: {nmChart.giap_ty_date} (Đông Chí {nmChart.dong_chi_date})
                </p>
              </Card>
              <Card>
                <h3 className="font-serif text-lg font-semibold">12 cung Nhân Mệnh · {nmAnalysis.menh_overview.chieu_an_cung}</h3>
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {Object.entries(nmChart.cung_12).map(([k, v]) => (
                    <div key={k} className={`rounded-lg px-2.5 py-1.5 text-sm ring-1 ${k === "Mệnh" ? "bg-night text-white ring-night" : "bg-paper ring-line"}`}>
                      <span className={k === "Mệnh" ? "text-gold-light" : "text-muted"}>{k}</span> <strong>{v}</strong>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <MiniToan ev={nmAnalysis.nhat_ke_menh.chu_eval} />
                  <MiniToan ev={nmAnalysis.nhat_ke_menh.khach_eval} />
                </div>
              </Card>
            </div>
            <TongGiai sn={nmAnalysis.summary_narrative} />
          </>
        )}

        {!hasResult && (
          <p className="text-center text-sm text-muted">
            {mode === "divination"
              ? "Nhập câu hỏi và thời điểm (mặc định là giờ hiện tại theo giờ Việt Nam), rồi bấm Gieo quẻ."
              : "Nhập thông tin đương số để lập quẻ Ất Nhân Mệnh."}
          </p>
        )}
      </main>

      <footer className="no-print border-t border-line bg-card/60">
        <div className="mx-auto max-w-7xl px-5 py-6 text-center text-xs text-muted">
          Luận giải dựa trên các nguyên tắc Thái Ất Thần Kinh, mang tính tham khảo và chiêm nghiệm.
          <br />
          Dữ liệu chỉ được xử lý trên trình duyệt của bạn — không gửi đi đâu cả.
        </div>
      </footer>
    </div>
  );
}

/* --------------------------------- pieces --------------------------------- */

function Field({ label, children, className = "", htmlFor }: { label: string; children: ReactNode; className?: string; htmlFor?: string }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

function DivinationForm({
  value,
  onChange,
  onSubmit,
  error,
}: {
  value: DivForm;
  onChange: (v: DivForm) => void;
  onSubmit: () => void;
  error: string | null;
}) {
  const set = <K extends keyof DivForm>(k: K, v: DivForm[K]) => onChange({ ...value, [k]: v });
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Field label="Câu hỏi / việc muốn xin quẻ" htmlFor="ta-q">
        <input
          id="ta-q"
          className="field-input"
          maxLength={200}
          value={value.question}
          onChange={(e) => set("question", e.target.value)}
          placeholder="Ví dụ: Có nên ký hợp đồng hợp tác tuần này không?"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Chủ đề" htmlFor="ta-topic">
          <select id="ta-topic" className="field-input" value={value.topic} onChange={(e) => set("topic", e.target.value)}>
            {TOPICS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Cấp độ Kế" htmlFor="ta-ke">
          <select id="ta-ke" className="field-input" value={value.keMode} onChange={(e) => set("keMode", e.target.value as KeMode)}>
            {KE_MODES.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-[1.6fr_1fr_1fr]">
        <Field label="Thời điểm gieo quẻ (dương lịch)">
          <div className="grid grid-cols-[1fr_1fr_1.3fr] gap-2">
            <select aria-label="Ngày" className="field-input" value={value.day} onChange={(e) => set("day", Number(e.target.value))}>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select aria-label="Tháng" className="field-input" value={value.month} onChange={(e) => set("month", Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  Th. {m}
                </option>
              ))}
            </select>
            <input
              aria-label="Năm"
              type="number"
              inputMode="numeric"
              className="field-input"
              min={MIN_YEAR}
              max={MAX_YEAR}
              value={Number.isNaN(value.year) ? "" : value.year}
              onChange={(e) => set("year", e.target.value === "" ? NaN : Number(e.target.value))}
            />
          </div>
        </Field>
        <Field label="Giờ" htmlFor="ta-hour">
          <select id="ta-hour" className="field-input" value={value.hour} onChange={(e) => set("hour", Number(e.target.value))}>
            {HOURS.map((h) => (
              <option key={h.value} value={h.value}>
                {h.chi} ({h.range})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Năm sinh người hỏi" htmlFor="ta-by">
          <input
            id="ta-by"
            type="number"
            inputMode="numeric"
            className="field-input"
            placeholder="Tùy chọn, VD 1995"
            min={MIN_YEAR}
            max={MAX_YEAR}
            value={value.birthYear}
            onChange={(e) => set("birthYear", e.target.value)}
          />
        </Field>
      </div>
      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => onChange({ ...value, ...nowInVietnam() })}
          className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-ink transition hover:border-gold"
        >
          ⏱ Giờ hiện tại
        </button>
        <button
          type="submit"
          className="flex-1 rounded-xl bg-lacquer px-6 py-3 text-base font-semibold text-white shadow-lg shadow-lacquer/25 transition hover:bg-lacquer-dark"
        >
          ☯ Gieo quẻ &amp; luận giải
        </button>
      </div>
    </form>
  );
}

function Patterns({ items }: { items: Pattern[] }) {
  return (
    <div className="space-y-2">
      {items.map((p) => (
        <div key={p.name} className={`rounded-xl border p-3 ${SEVERITY[p.severity].box}`}>
          <div className="flex items-center gap-2">
            <strong className="text-sm">{p.name}</strong>
            <span className={`rounded-full px-2 py-px text-[10px] font-bold uppercase ${SEVERITY[p.severity].tag}`}>{SEVERITY[p.severity].label}</span>
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-ink/80">{p.detail}</p>
        </div>
      ))}
    </div>
  );
}

function ToanCard({ title, ev }: { title: string; ev: ToanEval }) {
  return (
    <Card>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-serif text-lg font-semibold">{title}</h3>
        <span className="font-serif text-3xl font-semibold text-lacquer">{ev.toan}</span>
      </div>
      <p className="text-sm font-semibold text-ink">{ev.level}</p>
      <p className="mt-1 text-sm text-ink/80">{ev.desc}</p>
      {ev.ba_tai_issues.map((x) => (
        <p key={x} className="mt-2 rounded-lg bg-orange-50 px-3 py-1.5 text-xs text-orange-900 ring-1 ring-orange-200">
          ⚠ {x}
        </p>
      ))}
    </Card>
  );
}

function MiniToan({ ev }: { ev: ToanEval }) {
  return (
    <div className="rounded-xl bg-paper p-3 ring-1 ring-line">
      <div className="text-xs text-muted">{ev.label}</div>
      <div className="font-semibold">
        Toán {ev.toan} · {ev.level}
      </div>
    </div>
  );
}

function TongGiai({ sn }: { sn: Narrative }) {
  return (
    <Card className="border-gold/40">
      <h2 className="font-serif text-xl font-semibold">📜 Tổng giải quẻ</h2>
      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-amber-800">Diễn giải</h3>
          <p className="text-[15px] leading-relaxed text-ink/90">{sn.narrative}</p>
        </div>
        <div>
          <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-emerald-800">Hướng giải quyết</h3>
          <ol className="space-y-2">
            {sn.resolution.map((s) => (
              <li key={s} className="rounded-lg bg-paper px-3 py-2 text-sm leading-relaxed ring-1 ring-line">
                {s}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Card>
  );
}

function PalaceDetail({
  palace,
  chart,
  board,
  onBack,
}: {
  palace: string;
  chart: DivinationChart | NhanMenhChart;
  board?: DivinationChart["board"];
  onBack: () => void;
}) {
  const m = chart.palace_meta[palace];
  const stars = (board ?? chart.board).stars_by_palace[palace] ?? [];
  return (
    <Card>
      <h2 className="font-serif text-xl font-semibold">Cung {palace}</h2>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted">Loại</dt>
        <dd>{palace === "Trung" ? "Trung Cung (5)" : m.cung_num !== null ? `Chính cung số ${m.cung_num}` : "Gián thần"}</dd>
        <dt className="text-muted">Ngũ hành</dt>
        <dd>{m.hanh}</dd>
        <dt className="text-muted">Khí</dt>
        <dd>{m.khi}</dd>
        <dt className="text-muted">Phương</dt>
        <dd>{m.direction}</dd>
      </dl>
      <h3 className="mb-2 mt-4 text-[13px] font-semibold uppercase tracking-wide text-muted">Sao đóng tại cung</h3>
      {stars.length ? (
        <ul className="space-y-1.5">
          {stars.map((s, i) => (
            <li key={i} className="flex items-center justify-between gap-2 text-sm">
              <span className={`rounded-md px-2 py-0.5 font-medium ring-1 ring-inset ${ROLE_STYLE[s.role].chip}`}>{s.name}</span>
              <span className="text-xs text-muted">{ROLE_STYLE[s.role].label}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">Không có sao chính đóng.</p>
      )}
      <button type="button" onClick={onBack} className="mt-4 text-sm font-semibold text-lacquer hover:underline">
        ← Quay lại luận quẻ tổng quan
      </button>
    </Card>
  );
}
