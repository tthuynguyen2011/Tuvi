/**
 * Public entry for the app: validated input -> chart + full report.
 * Everything runs client-side; the engine is pure and deterministic.
 */
import { analyzeFullReport, analyzePalacesForYear, analyzeYear } from "./analyzer";
import { buildChart, type Chart, type Gender } from "./engine";
import { getLeapMonth, lunarToSolar, solarToLunar } from "./lunar";

export * from "./analyzer";
export * from "./engine";
export { getLeapMonth } from "./lunar";

export interface BirthInput {
  name: string;
  gender: Gender;
  calendar: "solar" | "lunar";
  day: number;
  month: number;
  year: number;
  /** Representative hour of the Chi (0, 2, 4, ... 22). */
  hour: number;
  isLeap: boolean;
  viewYear: number;
  numYears: number;
}

export const MIN_YEAR = 1900;
export const MAX_YEAR = 2099;

export const HOURS = [
  { value: 0, chi: "Tý", range: "23h – 1h" },
  { value: 2, chi: "Sửu", range: "1h – 3h" },
  { value: 4, chi: "Dần", range: "3h – 5h" },
  { value: 6, chi: "Mão", range: "5h – 7h" },
  { value: 8, chi: "Thìn", range: "7h – 9h" },
  { value: 10, chi: "Tỵ", range: "9h – 11h" },
  { value: 12, chi: "Ngọ", range: "11h – 13h" },
  { value: 14, chi: "Mùi", range: "13h – 15h" },
  { value: 16, chi: "Thân", range: "15h – 17h" },
  { value: 18, chi: "Dậu", range: "17h – 19h" },
  { value: 20, chi: "Tuất", range: "19h – 21h" },
  { value: 22, chi: "Hợi", range: "21h – 23h" },
] as const;

const daysInSolarMonth = (m: number, y: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** Returns a Vietnamese error message, or null when the input is valid. */
export function validateBirth(b: BirthInput): string | null {
  const ints = [b.day, b.month, b.year, b.hour, b.viewYear, b.numYears];
  if (ints.some((n) => !Number.isInteger(n))) return "Vui lòng nhập đầy đủ ngày, tháng, năm sinh.";
  if (b.year < MIN_YEAR || b.year > MAX_YEAR) return `Năm sinh phải trong khoảng ${MIN_YEAR}–${MAX_YEAR}.`;
  if (b.viewYear < MIN_YEAR || b.viewYear > MAX_YEAR) return `Năm xem phải trong khoảng ${MIN_YEAR}–${MAX_YEAR}.`;
  if (b.month < 1 || b.month > 12) return "Tháng phải từ 1 đến 12.";
  if (b.numYears < 1 || b.numYears > 85) return "Số năm luận giải phải từ 1 đến 85.";

  if (b.calendar === "solar") {
    const max = daysInSolarMonth(b.month, b.year);
    if (b.day < 1 || b.day > max) return `Tháng ${b.month}/${b.year} dương lịch chỉ có ${max} ngày.`;
  } else {
    if (b.day < 1 || b.day > 30) return "Ngày âm lịch phải từ 1 đến 30.";
    if (b.isLeap && getLeapMonth(b.year) !== b.month)
      return `Năm âm lịch ${b.year} không có tháng ${b.month} nhuận.`;
    const [sd, sm, sy] = lunarToSolar(b.day, b.month, b.year, b.isLeap ? 1 : 0);
    const [ld, lm, ly, leap] = solarToLunar(sd, sm, sy);
    if (ld !== b.day || lm !== b.month || ly !== b.year || leap !== (b.isLeap ? 1 : 0))
      return `Tháng ${b.month}${b.isLeap ? " nhuận" : ""} năm ${b.year} âm lịch chỉ có 29 ngày.`;
  }
  return null;
}

export function computeAll(b: BirthInput) {
  const chart = buildChart({
    name: b.name.trim() || "Đương Số",
    gender: b.gender,
    year: b.year,
    month: b.month,
    day: b.day,
    hour_24: b.hour,
    is_lunar: b.calendar === "lunar",
    is_leap: b.calendar === "lunar" && b.isLeap,
    view_year: b.viewYear,
  });
  const report = analyzeFullReport(chart, b.viewYear, b.numYears);
  return { chart, report };
}

/** Score of every year of life (age 1..85) for the lifetime chart. */
export function lifetimeScores(chart: Chart) {
  return Array.from({ length: 85 }, (_, i) => {
    const y = analyzeYear(chart, chart.info.l_year + i);
    return { age: i + 1, year: y.year, year_cc: y.year_cc, score: y.score, tone: y.tone, verdict: y.verdict };
  });
}

export { analyzePalacesForYear };
