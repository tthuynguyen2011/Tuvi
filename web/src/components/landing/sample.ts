/**
 * Sample data for the landing page visuals. Everything is computed by the real
 * Tử Vi engine at build time (the page is statically exported), so the board,
 * the lifetime bars and the scores shown are an actual chart, not a mock-up.
 */
import { analyzePalace, analyzeYear, buildChart, computeAll, lifetimeScores, type BirthInput } from "@/lib/tuvi";

const VIEW_YEAR = new Date().getFullYear();

const BASE: BirthInput = {
  name: "Lá số mẫu",
  gender: "Nam",
  calendar: "solar",
  day: 15,
  month: 1,
  year: 1990,
  hour: 8, // giờ Thìn
  isLeap: false,
  viewYear: VIEW_YEAR,
  numYears: 15,
};

/**
 * A hero card that reads "Hung Hạn 27/100" is a poor first impression, so pick —
 * deterministically, from a fixed candidate list — a sample whose current year is
 * favourable and whose Mệnh is reasonably strong. Falls back to the first candidate.
 */
function pickSampleInput(): BirthInput {
  for (let year = 1988; year <= 1998; year++) {
    for (let month = 1; month <= 12; month++) {
      const b = { ...BASE, year, month };
      const chart = buildChart({
        name: b.name, gender: b.gender, year, month, day: b.day, hour_24: b.hour,
        is_lunar: false, is_leap: false, view_year: VIEW_YEAR,
      });
      const menh = chart.palaces.find((p) => p.is_menh);
      if (
        menh?.chinh_tinh.length &&
        analyzeYear(chart, VIEW_YEAR).tone === "cat" &&
        analyzePalace(chart, menh.chi_idx).score >= 60
      )
        return b;
    }
  }
  return BASE;
}

export function buildSample() {
  const input = pickSampleInput();
  const { chart, report } = computeAll(input);
  const { info, palaces } = chart;

  const thisYear = analyzeYear(chart, VIEW_YEAR);
  const nextYear = analyzeYear(chart, VIEW_YEAR + 1);
  const life = lifetimeScores(chart);

  const menh = report.palace_readings.find((r) => r.chi_idx === info.menh_chi_idx);
  const taiBach = report.palace_readings.find((r) => r.palace_name.toLowerCase().includes("tài"));
  const daiVanPalace = thisYear.dai_van && palaces.find((p) => p.chi === thisYear.dai_van!.chi);

  const starCount = palaces.reduce(
    (n, p) => n + p.chinh_tinh.length + p.cat_tinh.length + p.sat_tinh.length,
    0,
  );

  return { input, info, palaces, thisYear, nextYear, life, menh, taiBach, daiVanPalace, starCount };
}

export type Sample = ReturnType<typeof buildSample>;
