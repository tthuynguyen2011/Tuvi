"use client";

import { useMemo, type FormEvent, type ReactNode } from "react";
import { getLeapMonth, HOURS, MAX_YEAR, MIN_YEAR, type BirthInput } from "@/lib/tuvi";

function Segmented<T extends string>({
  value,
  options,
  onChange,
  name,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  name: string;
}) {
  return (
    <div role="radiogroup" aria-label={name} className="grid grid-flow-col auto-cols-fr rounded-xl border border-line bg-paper p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            value === o.value ? "bg-white text-lacquer shadow-sm ring-1 ring-line" : "text-muted hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

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

const num = (v: string) => (v === "" ? NaN : Number(v));

export default function BirthForm({
  value,
  onChange,
  onSubmit,
  error,
  compact,
  submitLabel = "✦ Lập lá số & luận giải",
  showNumYears = true,
}: {
  value: BirthInput;
  onChange: (v: BirthInput) => void;
  onSubmit: () => void;
  error: string | null;
  compact?: boolean;
  submitLabel?: string;
  showNumYears?: boolean;
}) {
  const set = <K extends keyof BirthInput>(k: K, v: BirthInput[K]) => onChange({ ...value, [k]: v });
  const isLunar = value.calendar === "lunar";
  const leapMonth = useMemo(
    () => (isLunar && Number.isInteger(value.year) && value.year >= MIN_YEAR && value.year <= MAX_YEAR ? getLeapMonth(value.year) : 0),
    [isLunar, value.year],
  );
  const canBeLeap = isLunar && leapMonth === value.month;
  const maxDay = isLunar ? 30 : 31;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <Field label="Họ và tên" htmlFor="f-name">
          <input
            id="f-name"
            className="field-input"
            placeholder="Ví dụ: Nguyễn Văn An"
            value={value.name}
            maxLength={80}
            autoComplete="name"
            onChange={(e) => set("name", e.target.value)}
          />
        </Field>
        <Field label="Giới tính">
          <Segmented
            name="Giới tính"
            value={value.gender}
            onChange={(v) => set("gender", v)}
            options={[
              { value: "Nam", label: "♂ Nam" },
              { value: "Nữ", label: "♀ Nữ" },
            ]}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
        <Field label="Lịch">
          <Segmented
            name="Loại lịch"
            value={value.calendar}
            onChange={(v) => onChange({ ...value, calendar: v, isLeap: false })}
            options={[
              { value: "solar", label: "Dương lịch" },
              { value: "lunar", label: "Âm lịch" },
            ]}
          />
        </Field>
        <Field label={`Ngày / tháng / năm sinh (${isLunar ? "âm lịch" : "dương lịch"})`}>
          <div className="grid grid-cols-[1fr_1fr_1.3fr] gap-2">
            <select aria-label="Ngày" className="field-input" value={value.day} onChange={(e) => set("day", num(e.target.value))}>
              {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select aria-label="Tháng" className="field-input" value={value.month} onChange={(e) => set("month", num(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {`Th. ${m}${isLunar && leapMonth === m ? " *" : ""}`}
                </option>
              ))}
            </select>
            <input
              aria-label="Năm sinh"
              className="field-input"
              type="number"
              inputMode="numeric"
              min={MIN_YEAR}
              max={MAX_YEAR}
              placeholder="Năm"
              value={Number.isNaN(value.year) ? "" : value.year}
              onChange={(e) => set("year", num(e.target.value))}
            />
          </div>
          {isLunar && leapMonth > 0 && !canBeLeap && (
            <p className="mt-1.5 text-xs text-muted">* Năm {value.year} có tháng {leapMonth} nhuận.</p>
          )}
          {canBeLeap && (
            <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                className="size-4 accent-lacquer"
                checked={value.isLeap}
                onChange={(e) => set("isLeap", e.target.checked)}
              />
              Sinh vào tháng {value.month} <strong className="text-ink">nhuận</strong>
            </label>
          )}
        </Field>
      </div>

      <div className={`grid gap-4 ${!showNumYears ? "sm:grid-cols-2" : compact ? "sm:grid-cols-3" : "sm:grid-cols-[1.4fr_1fr_1fr]"}`}>
        <Field label="Giờ sinh" htmlFor="f-hour">
          <select id="f-hour" className="field-input" value={value.hour} onChange={(e) => set("hour", num(e.target.value))}>
            {HOURS.map((h) => (
              <option key={h.value} value={h.value}>
                Giờ {h.chi} ({h.range})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Năm xem hạn" htmlFor="f-view">
          <input
            id="f-view"
            className="field-input"
            type="number"
            inputMode="numeric"
            min={MIN_YEAR}
            max={MAX_YEAR}
            value={Number.isNaN(value.viewYear) ? "" : value.viewYear}
            onChange={(e) => set("viewYear", num(e.target.value))}
          />
        </Field>
        {showNumYears && (
        <Field label="Số năm luận giải" htmlFor="f-num">
          <select id="f-num" className="field-input" value={value.numYears} onChange={(e) => set("numYears", num(e.target.value))}>
            {[5, 10, 15, 20, 30, 50].map((n) => (
              <option key={n} value={n}>
                {n} năm
              </option>
            ))}
          </select>
        </Field>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="group relative w-full overflow-hidden rounded-xl bg-lacquer px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-lacquer/25 transition hover:bg-lacquer-dark focus:outline-none focus-visible:ring-4 focus-visible:ring-gold/40"
      >
        <span className="relative z-10">{submitLabel}</span>
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      </button>
    </form>
  );
}
