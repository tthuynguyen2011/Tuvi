/**
 * Parity tests: the TypeScript engine must reproduce the original Python engine
 * byte-for-byte. Fixtures come from `python3 scripts/gen_golden.py` (see package.json "pretest").
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildChart, type Gender } from "../src/lib/tuvi/engine";
import { analyzeFullReport, analyzePalacesForYear } from "../src/lib/tuvi/analyzer";
import { solarToLunar } from "../src/lib/tuvi/lunar";

interface GoldenCase {
  input: { name: string; gender: Gender; year: number; month: number; day: number; hour_24: number; is_lunar: boolean; is_leap: boolean; view_year: number };
  num_years: number;
  target_year: number;
  chart: unknown;
  report: unknown;
  detail: unknown;
}
const golden = JSON.parse(readFileSync(join(__dirname, "golden.json"), "utf-8")) as {
  cases: GoldenCase[];
  lunar: { solar: [number, number, number]; lunar: [number, number, number, number] }[];
};

describe("lunar calendar parity", () => {
  it(`matches Python for ${golden.lunar.length} random dates`, () => {
    for (const c of golden.lunar) expect(solarToLunar(...c.solar)).toEqual(c.lunar);
  });
});

describe("chart + analysis parity", () => {
  it.each(golden.cases.map((c, i) => [i, c] as const))("case %i", (_i, c) => {
    const chart = buildChart(c.input);
    expect(chart).toEqual(c.chart);
    expect(analyzeFullReport(chart, c.input.view_year, c.num_years)).toEqual(c.report);
    expect(analyzePalacesForYear(chart, c.target_year)).toEqual(c.detail);
  });
});

/* ------------------------------ Thái Ất Thần Kinh ------------------------------ */
import { buildDivinationChart, buildNhanMenhChart, type DivinationInput, type NhanMenhInput } from "../src/lib/thaiat/engine";
import { analyzeDivination, analyzeNhanMenh, type Stance, type Urgency } from "../src/lib/thaiat/analyzer";

const ta = golden as unknown as {
  divination: { input: DivinationInput; opts: { stance: Stance; urgency: Urgency; extra_context: string }; chart: unknown; analysis: unknown }[];
  nhan_menh: { input: NhanMenhInput; chart: unknown; analysis: unknown }[];
};

describe("Thái Ất divination parity", () => {
  it.each(ta.divination.map((c, i) => [i, c] as const))("case %i", (_i, c) => {
    const chart = buildDivinationChart(c.input);
    expect(chart).toEqual(c.chart);
    expect(analyzeDivination(chart, c.opts.stance, c.opts.urgency, c.opts.extra_context)).toEqual(c.analysis);
  });
});

describe("Thái Ất Nhân Mệnh parity", () => {
  it.each(ta.nhan_menh.map((c, i) => [i, c] as const))("case %i", (_i, c) => {
    const chart = buildNhanMenhChart(c.input);
    expect(chart).toEqual(c.chart);
    expect(analyzeNhanMenh(chart)).toEqual(c.analysis);
  });
});
