"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  analyzePalacesForYear,
  computeAll,
  HOURS,
  MAX_YEAR,
  MIN_YEAR,
  validateBirth,
  type BirthInput,
} from "@/lib/tuvi";
import BirthForm from "./BirthForm";
import SiteNav from "./SiteNav";
import ChartBoard from "./ChartBoard";
import { LifeChart, Milestones, PalaceReadingCard, PalaceReadings, YearCard, YearExplorer } from "./Readings";
import { Card, Pill } from "./ui";

const STORAGE_KEY = "tuvi:last-input";

const DEFAULT_INPUT: BirthInput = {
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

/* ---- URL (shareable link) <-> input ---- */
function toParams(b: BirthInput) {
  const p = new URLSearchParams({
    n: b.name,
    g: b.gender === "Nam" ? "m" : "f",
    c: b.calendar === "lunar" ? "l" : "s",
    d: String(b.day),
    m: String(b.month),
    y: String(b.year),
    h: String(b.hour),
    v: String(b.viewYear),
    k: String(b.numYears),
  });
  if (b.isLeap) p.set("leap", "1");
  return p;
}
function fromParams(p: URLSearchParams): BirthInput | null {
  if (!p.has("y") || !p.has("m") || !p.has("d")) return null;
  const int = (k: string, def: number) => {
    const n = Number(p.get(k));
    return p.has(k) && Number.isInteger(n) ? n : def;
  };
  const hour = int("h", 8);
  return {
    name: (p.get("n") ?? "").slice(0, 80),
    gender: p.get("g") === "m" ? "Nam" : "Nữ",
    calendar: p.get("c") === "l" ? "lunar" : "solar",
    day: int("d", 1),
    month: int("m", 1),
    year: int("y", 1995),
    hour: HOURS.some((x) => x.value === hour) ? hour : 8,
    isLeap: p.get("leap") === "1",
    viewYear: int("v", new Date().getFullYear()),
    numYears: Math.min(85, Math.max(1, int("k", 15))),
  };
}

const TABS = [
  { id: "chart", label: "Lá số", icon: "☰" },
  { id: "palaces", label: "Luận 12 cung", icon: "✧" },
  { id: "life", label: "Mốc cuộc đời", icon: "⛰" },
  { id: "yearly", label: "Vận hạn từng năm", icon: "☾" },
  { id: "year", label: "Soi một năm", icon: "◎" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function TuviApp() {
  const [input, setInput] = useState<BirthInput>(DEFAULT_INPUT);
  const [submitted, setSubmitted] = useState<BirthInput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("chart");
  const [selected, setSelected] = useState<number | null>(null);
  const [targetYear, setTargetYear] = useState(2026);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const result = useMemo(() => (submitted ? computeAll(submitted) : null), [submitted]);
  const detail = useMemo(
    () => (result && targetYear >= MIN_YEAR && targetYear <= MAX_YEAR ? analyzePalacesForYear(result.chart, targetYear) : null),
    [result, targetYear],
  );

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  };

  const run = useCallback((b: BirthInput, opts: { keepTab?: boolean } = {}) => {
    const err = validateBirth(b);
    setError(err);
    if (err) return false;
    setSubmitted(b);
    setEditing(false);
    setSelected(null);
    if (!opts.keepTab) setTab("chart");
    window.history.replaceState(null, "", `?${toParams(b).toString()}`);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(b));
    } catch {}
    return true;
  }, []);

  // Restore from a shared link or the last session. This must run after hydration
  // (URL/localStorage are unavailable during prerender), so setState here is intended.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const thisYear = new Date().getFullYear();
    const fromUrl = fromParams(new URLSearchParams(window.location.search));
    if (fromUrl) {
      setInput(fromUrl);
      setTargetYear(fromUrl.viewYear);
      run(fromUrl);
      return;
    }
    let saved: BirthInput | null = null;
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    } catch {}
    setInput(saved ? { ...DEFAULT_INPUT, ...saved, viewYear: thisYear } : { ...DEFAULT_INPUT, viewYear: thisYear });
    setTargetYear(thisYear);
  }, [run]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const goHome = () => {
    setSubmitted(null);
    setEditing(false);
    setError(null);
    window.history.replaceState(null, "", "/");
  };

  const onSubmit = () => {
    if (run(input)) {
      setTargetYear(input.viewYear);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const pickYear = (y: number) => {
    setTargetYear(y);
    setTab("year");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const applyYearToBoard = () => {
    const next = { ...input, viewYear: targetYear };
    setInput(next);
    run(next);
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      flash("Đã sao chép đường dẫn lá số");
    } catch {
      flash("Không thể sao chép — hãy sao chép địa chỉ trên thanh trình duyệt");
    }
  };

  const exportWord = async () => {
    if (!result) return;
    setExporting(true);
    try {
      const { exportDocx } = await import("@/lib/tuvi/docx");
      const blob = await exportDocx(result.chart, result.report);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `La_So_Tu_Vi_${(result.chart.info.name || "Duong_So").replace(/\s+/g, "_")}_${result.chart.info.view_year}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      flash("Đã tải file Word");
    } catch {
      flash("Xuất file Word thất bại, vui lòng thử lại");
    } finally {
      setExporting(false);
    }
  };

  const info = result?.chart.info;
  const sel = selected ?? info?.menh_chi_idx ?? 0;
  const selReading = result?.report.palace_readings.find((p) => p.chi_idx === sel);

  return (
    <div className="flex min-h-dvh flex-col">
      {/* ------------------------------ Header ------------------------------ */}
      <header className="bg-stars text-white">
        <SiteNav active="tuvi" />
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <button type="button" onClick={goHome} className="flex items-center gap-3 text-left" aria-label="Trang chủ Tử Vi Đẩu Số">
            <span className="grid size-10 place-items-center rounded-xl border border-gold-light/60 bg-lacquer font-serif text-lg text-gold-light shadow-lg shadow-black/30">
              紫
            </span>
            <span>
              <span className="block font-serif text-lg font-semibold leading-tight">Tử Vi Đẩu Số</span>
              <span className="hidden text-xs text-white/60 sm:block">Lập lá số · Luận giải trọn đời</span>
            </span>
          </button>
          {result && (
            <div className="no-print flex items-center gap-2">
              <HeaderButton onClick={share} label="Chia sẻ" icon="🔗" />
              <HeaderButton onClick={() => window.print()} label="In" icon="🖨" />
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

        {!result && (
          <div className="mx-auto max-w-7xl px-5 pb-28 pt-10 sm:pt-14">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gold-light">紫微斗數 · Tử Vi Đẩu Số</p>
            <h1 className="mt-3 max-w-2xl font-serif text-4xl font-semibold leading-tight sm:text-5xl">
              Lá số của bạn,{" "}
              <span className="bg-gradient-to-r from-gold-light to-[#f3d9a4] bg-clip-text text-transparent">luận giải trọn đời</span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/70">
              An sao 12 cung chuẩn truyền thống, luận giải cát hung từng cung, vận hạn từng năm và những mốc quan trọng từ 1 đến 85 tuổi.
            </p>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-5 pb-16">
        {/* ------------------------- Landing: the form ------------------------- */}
        {!result && (
          <div className="-mt-20 grid gap-8 lg:grid-cols-[1.25fr_1fr]">
            <Card className="p-6 sm:p-8">
              <h2 className="mb-1 font-serif text-2xl font-semibold">Thông tin đương số</h2>
              <p className="mb-6 text-sm text-muted">Chỉ cần ngày, tháng, năm và giờ sinh. Mọi tính toán diễn ra ngay trên trình duyệt của bạn.</p>
              <BirthForm value={input} onChange={setInput} onSubmit={onSubmit} error={error} />
            </Card>
            <div className="space-y-4 lg:pt-24">
              {[
                ["☰", "Bản đồ 12 cung", "Thiên Bàn, Ngũ Hành, Tuần/Triệt, đường Tam Hợp & Xung Chiếu tương tác."],
                ["✧", "Luận giải trọn đời", "Điểm cát, điểm hung và lời khuyên cho từng cung Mệnh, Tài, Quan, Phu Thê…"],
                ["⛰", "Mốc cuộc đời", "Biểu đồ vận trình 85 năm, năm chuyển Đại Vận, năm bứt phá và năm thử thách."],
                ["⬇", "Xuất Word & in ấn", "Tải báo cáo .docx đầy đủ hoặc in lá số, chia sẻ bằng đường dẫn."],
              ].map(([icon, title, desc]) => (
                <div key={title} className="flex gap-4 rounded-2xl border border-line/70 bg-card/60 p-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold-soft text-lg text-lacquer">{icon}</span>
                  <div>
                    <h3 className="font-semibold text-ink">{title}</h3>
                    <p className="text-sm text-muted">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------ Results ------------------------------ */}
        {result && info && (
          <>
            <section className="no-print mt-6">
              <Card className="p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="truncate font-serif text-2xl font-semibold">{info.name}</h1>
                    <p className="text-sm text-muted">
                      {info.gender} · Sinh {info.solar} (ÂL {info.lunar}) · Giờ {info.hour_cc}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditing((e) => !e)}
                    className="rounded-lg border border-line bg-white px-3.5 py-2 text-sm font-semibold text-ink transition hover:border-gold"
                  >
                    {editing ? "Đóng" : "✎ Đổi thông tin"}
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Chip k="Năm" v={info.year_cc} />
                  <Chip k="Bản Mệnh" v={info.ban_menh} />
                  <Chip k="Cục" v={info.cuc_name} />
                  <Chip k="Mệnh tại" v={info.menh_chi} />
                  <Chip k="Thân cư" v={info.than_cu} />
                  <Chip k="Âm Dương" v={info.am_duong_ly} />
                  <Chip k={`Năm ${info.view_year}`} v={`${info.tuoi_mu} tuổi`} />
                </div>
                {editing && (
                  <div className="mt-5 border-t border-line pt-5">
                    <BirthForm value={input} onChange={setInput} onSubmit={onSubmit} error={error} compact />
                  </div>
                )}
              </Card>
            </section>

            <nav className="no-print sticky top-0 z-30 -mx-5 mt-4 bg-paper/85 px-5 py-2 backdrop-blur-md">
              <div role="tablist" className="flex gap-1 overflow-x-auto rounded-xl border border-line bg-card p-1 shadow-sm">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={tab === t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                      tab === t.id ? "bg-night text-white shadow" : "text-muted hover:bg-paper hover:text-ink"
                    }`}
                  >
                    <span aria-hidden className={tab === t.id ? "text-gold-light" : ""}>
                      {t.icon}
                    </span>
                    {t.label}
                  </button>
                ))}
              </div>
            </nav>

            <div className="mt-4">
              <section data-tab-panel hidden={tab !== "chart"} className="space-y-5">
                <div className="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
                  <Card className="min-w-0 p-3 sm:p-4">
                    <p className="no-print mb-2 text-center text-xs text-muted md:hidden">← Vuốt ngang để xem toàn bộ lá số →</p>
                    <ChartBoard chart={result.chart} selected={sel} onSelect={setSelected} />
                    <p className="no-print mt-3 text-center text-xs text-muted">
                      Nhấn vào một cung để xem luận giải và đường Tam Hợp / Xung Chiếu · Sao in nghiêng là sao lưu niên năm {info.view_year}
                    </p>
                  </Card>
                  <div className="no-print xl:sticky xl:top-20 xl:max-h-[calc(100dvh-6rem)] xl:overflow-y-auto">
                    {selReading && <PalaceReadingCard pr={selReading} highlight />}
                  </div>
                </div>
                <Card>
                  <h3 className="mb-3 font-serif text-xl font-semibold">Cách cục nổi bật</h3>
                  {result.report.cach_cuc.length ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {result.report.cach_cuc.map((cc) => (
                        <div key={cc.name} className="rounded-xl border border-line bg-paper/60 p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <strong className="text-ink">{cc.name}</strong>
                            <Pill tone={cc.type === "Lưu Ý" ? "warn" : cc.type === "Biến Động" || cc.type === "Đặc Biệt" ? "neutral" : "cat"}>
                              {cc.type}
                            </Pill>
                          </div>
                          <p className="mt-1 text-sm text-ink/80">{cc.desc}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted">Lá số bình hòa, không thiên lệch quá mức về một cách cục cực đoan.</p>
                  )}
                </Card>
              </section>

              <section data-tab-panel hidden={tab !== "palaces"} className="print-break">
                <PalaceReadings report={result.report} />
              </section>

              <section data-tab-panel hidden={tab !== "life"} className="print-break space-y-5">
                <LifeChart chart={result.chart} onPickYear={pickYear} />
                <Milestones report={result.report} onPickYear={pickYear} />
              </section>

              <section data-tab-panel hidden={tab !== "yearly"} className="print-break">
                <div className="grid gap-5 lg:grid-cols-2">
                  {result.report.yearly_readings.map((yr) => (
                    <YearCard key={yr.year} yr={yr} onPick={() => pickYear(yr.year)} />
                  ))}
                </div>
              </section>

              <section data-tab-panel hidden={tab !== "year"} className="no-print space-y-5">
                <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-2">
                    <StepButton onClick={() => setTargetYear((y) => y - 1)} label="Năm trước">‹</StepButton>
                    <input
                      aria-label="Năm muốn xem"
                      type="number"
                      min={MIN_YEAR}
                      max={MAX_YEAR}
                      value={targetYear}
                      onChange={(e) => setTargetYear(Number(e.target.value))}
                      className="field-input w-28 text-center text-lg font-semibold"
                    />
                    <StepButton onClick={() => setTargetYear((y) => y + 1)} label="Năm sau">›</StepButton>
                    <button
                      type="button"
                      onClick={() => setTargetYear(new Date().getFullYear())}
                      className="ml-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-muted hover:text-ink"
                    >
                      Năm nay
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={applyYearToBoard}
                    disabled={!detail || targetYear === info.view_year}
                    className="rounded-lg bg-night px-4 py-2 text-sm font-semibold text-white transition hover:bg-night-2 disabled:opacity-40"
                  >
                    Đưa sao lưu năm {targetYear} lên lá số
                  </button>
                </Card>
                {detail ? (
                  <YearExplorer detail={detail} />
                ) : (
                  <Card>
                    <p className="text-sm text-muted">Vui lòng chọn năm trong khoảng {MIN_YEAR}–{MAX_YEAR}.</p>
                  </Card>
                )}
              </section>
            </div>
          </>
        )}
      </main>

      <footer className="no-print border-t border-line bg-card/60">
        <div className="mx-auto max-w-7xl px-5 py-6 text-center text-xs text-muted">
          Kết quả luận giải dựa trên các nguyên tắc Tử Vi Đẩu Số truyền thống, mang tính tham khảo và chiêm nghiệm.
          <br />
          Dữ liệu chỉ được xử lý trên trình duyệt của bạn — không gửi đi đâu cả.
        </div>
      </footer>

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-night px-5 py-2.5 text-sm text-white shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}

function Chip({ k, v }: { k: string; v: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-paper px-2.5 py-1 text-xs ring-1 ring-line">
      <span className="text-muted">{k}</span>
      <span className="font-semibold text-ink">{v}</span>
    </span>
  );
}

function HeaderButton({ onClick, label, icon }: { onClick: () => void; label: string; icon: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10"
    >
      <span aria-hidden>{icon}</span> <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function StepButton({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-10 place-items-center rounded-lg border border-line bg-white text-xl text-ink transition hover:border-gold"
    >
      {children}
    </button>
  );
}
