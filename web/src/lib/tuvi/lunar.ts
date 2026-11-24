/**
 * Vietnamese Lunar Calendar (Ho Ngoc Duc algorithm, UTC+7) & Can-Chi utilities.
 * Faithful port of tuvi-app/lunar_calendar.py.
 */
import { CAN, CHI, HANH_TO_THAI_AT_NUM, NAP_AM, NAP_GIAP_CAN, NAP_GIAP_CHI } from "./data";

/** Python-style floor modulo (result has the sign of the divisor). */
export const mod = (a: number, n: number) => ((a % n) + n) % n;
/** Python-style integer floor division. */
export const fdiv = (a: number, b: number) => Math.floor(a / b);
/** Python 3 round() for floats: round half to even. */
export function pyRound(x: number): number {
  const r = Math.round(x);
  if (Math.abs(x % 1) === 0.5) return 2 * Math.round(x / 2);
  return r;
}

export function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = fdiv(14 - mm, 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd = dd + fdiv(153 * m + 2, 5) + 365 * y + fdiv(y, 4) - fdiv(y, 100) + fdiv(y, 400) - 32045;
  if (jd < 2299161) {
    jd = dd + fdiv(153 * m + 2, 5) + 365 * y + fdiv(y, 4) - 32083;
  }
  return jd;
}

export function jdToDate(jd: number): [number, number, number] {
  let b: number, c: number;
  if (jd > 2299160) {
    const a = jd + 32044;
    b = fdiv(4 * a + 3, 146097);
    c = a - fdiv(b * 146097, 4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  const d = fdiv(4 * c + 3, 1461);
  const e = c - fdiv(1461 * d, 4);
  const m = fdiv(5 * e + 2, 153);
  const day = e - fdiv(153 * m + 2, 5) + 1;
  const month = m + 3 - 12 * fdiv(m, 10);
  const year = b * 100 + d - 4800 + fdiv(m, 10);
  return [day, month, year];
}

function newMoon(k: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = Math.PI / 180.0;
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 -= 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 -= 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 += 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 -= 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 -= 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 += 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  let deltat: number;
  if (T < -11) {
    deltat = 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3;
  } else {
    deltat = -0.000278 + 0.000265 * T + 0.000262 * T2;
  }
  return Jd1 + C1 - deltat;
}

function getNewMoonDay(k: number, tz = 7.0): number {
  return Math.floor(newMoon(k) + 0.5 + tz / 24.0);
}

export function sunLongitude(jdn: number): number {
  const T = (jdn - 2451545.0) / 36525.0;
  const T2 = T * T;
  const dr = Math.PI / 180.0;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  let L = L0 + DL;
  L = L * dr;
  L = L - Math.PI * 2 * Math.floor(L / (Math.PI * 2));
  return L;
}

function getSunLongitude(dayNumber: number, tz = 7.0): number {
  return Math.floor((sunLongitude(dayNumber - 0.5 - tz / 24.0) / Math.PI) * 6);
}

function getLunarMonth11(yy: number, tz = 7.0): number {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = Math.floor(off / 29.530588853);
  let nm = getNewMoonDay(k, tz);
  const sunLong = getSunLongitude(nm, tz);
  if (sunLong >= 9) nm = getNewMoonDay(k - 1, tz);
  return nm;
}

function getLeapMonthOffset(a11: number, tz = 7.0): number {
  const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last = 0;
  let i = 1;
  let arc = getSunLongitude(getNewMoonDay(k + i, tz), tz);
  for (;;) {
    last = arc;
    i += 1;
    arc = getSunLongitude(getNewMoonDay(k + i, tz), tz);
    if (!(arc !== last && i < 14)) break;
  }
  return i - 1;
}

/** Returns [lunarDay, lunarMonth, lunarYear, isLeap(0|1)]. */
export function solarToLunar(dd: number, mm: number, yy: number, tz = 7.0): [number, number, number, number] {
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1, tz);
  if (monthStart > dayNumber) monthStart = getNewMoonDay(k, tz);
  let a11 = getLunarMonth11(yy, tz);
  let b11 = a11;
  let lunarYear: number;
  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = getLunarMonth11(yy - 1, tz);
  } else {
    lunarYear = yy + 1;
    b11 = getLunarMonth11(yy + 1, tz);
  }
  const lunarDay = dayNumber - monthStart + 1;
  const diff = Math.floor((monthStart - a11) / 29.0);
  let lunarLeap = 0;
  let lunarMonth = diff + 11;
  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11, tz);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) lunarLeap = 1;
    }
  }
  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;
  return [lunarDay, lunarMonth, lunarYear, lunarLeap];
}

/** Returns [day, month, year]; [0,0,0] when the leap month is invalid. */
export function lunarToSolar(
  lunarDay: number,
  lunarMonth: number,
  lunarYear: number,
  lunarLeap = 0,
  tz = 7.0,
): [number, number, number] {
  let a11: number, b11: number;
  if (lunarMonth < 11) {
    a11 = getLunarMonth11(lunarYear - 1, tz);
    b11 = getLunarMonth11(lunarYear, tz);
  } else {
    a11 = getLunarMonth11(lunarYear, tz);
    b11 = getLunarMonth11(lunarYear + 1, tz);
  }
  let off = lunarMonth - 11;
  if (off < 0) off += 12;
  if (b11 - a11 > 365) {
    const leapOff = getLeapMonthOffset(a11, tz);
    let leapMonth = leapOff - 2;
    if (leapMonth < 0) leapMonth += 12;
    if (lunarLeap !== 0 && lunarMonth !== leapMonth) return [0, 0, 0];
    else if (lunarLeap !== 0 || off >= leapOff) off += 1;
  }
  const k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  const monthStart = getNewMoonDay(k + off, tz);
  return jdToDate(monthStart + lunarDay - 1);
}

/** The leap month (1..12) of a lunar year, or 0 if that year has none. */
export function getLeapMonth(lunarYear: number): number {
  for (let m = 1; m <= 12; m++) {
    const [d, mo, y] = lunarToSolar(1, m, lunarYear, 1);
    if (d !== 0) {
      const [, lm, ly, leap] = solarToLunar(d, mo, y);
      if (leap === 1 && lm === m && ly === lunarYear) return m;
    }
  }
  return 0;
}

export function getYearCanChi(lunarYear: number) {
  const canIdx = mod(lunarYear + 6, 10);
  const chiIdx = mod(lunarYear + 8, 12);
  return { can: CAN[canIdx], chi: CHI[chiIdx], canIdx, chiIdx };
}

export function getMonthCanChi(lunarMonth: number, lunarYear: number) {
  const yearCanIdx = mod(lunarYear + 6, 10);
  const canIdx = mod((yearCanIdx % 5) * 2 + 2 + (lunarMonth - 1), 10);
  const chiIdx = mod(lunarMonth + 1, 12);
  return { can: CAN[canIdx], chi: CHI[chiIdx], canIdx, chiIdx };
}

export function getDayCanChi(dd: number, mm: number, yy: number) {
  const jd = jdFromDate(dd, mm, yy);
  const canIdx = mod(jd + 9, 10);
  const chiIdx = mod(jd + 1, 12);
  return { can: CAN[canIdx], chi: CHI[chiIdx], canIdx, chiIdx };
}

export function hourToChiIndex(hour24: number): number {
  return mod(fdiv(hour24 + 1, 2), 12);
}

export function getHourCanChi(dayCanIdx: number, hourChiIdx: number) {
  const canIdx = mod((dayCanIdx % 5) * 2 + hourChiIdx, 10);
  return { can: CAN[canIdx], chi: CHI[hourChiIdx], canIdx, chiIdx: hourChiIdx };
}

/* ============================================================
 * Solar terms (Tiết Khí) & Thái Ất Nạp Giáp / Nạp Âm helpers.
 * Port of the additions to tuvi-app/lunar_calendar.py.
 * ============================================================ */

/** Apparent sun longitude in degrees [0, 360) for a local date/hour. */
export function getSolarLongitudeDeg(dd: number, mm: number, yy: number, hour24 = 12.0, tz = 7.0): number {
  const jdn = jdFromDate(dd, mm, yy) + (hour24 - 12.0 - tz) / 24.0;
  const rad = sunLongitude(jdn);
  return mod((rad * 180.0) / Math.PI, 360.0);
}

/** Local Julian Day Number of the Winter (270°) or Summer (90°) Solstice in year yy. */
export function findSolsticeJd(yy: number, isWinter = true, tz = 7.0): number {
  const target = isWinter ? 270.0 : 90.0;
  const jdEst = jdFromDate(21, isWinter ? 12 : 6, yy);
  for (let off = -5; off < 6; off++) {
    const jd = jdEst + off;
    const lon0 = getSolarLongitudeDeg(...jdToDate(jd), 0.0, tz);
    const lon1 = getSolarLongitudeDeg(...jdToDate(jd + 1), 0.0, tz);
    const d0 = mod(lon0 - target + 180.0, 360.0) - 180.0;
    const d1 = mod(lon1 - target + 180.0, 360.0) - 180.0;
    if (d0 <= 0 && 0 <= d1) return jd;
  }
  return jdEst;
}

/** "Dương Độn" (Đông Chí → Hạ Chí) or "Âm Độn" (Hạ Chí → Đông Chí). */
export function getDonType(dd: number, mm: number, yy: number, hour24 = 12.0, tz = 7.0): "Dương Độn" | "Âm Độn" {
  const lon = getSolarLongitudeDeg(dd, mm, yy, hour24, tz);
  return lon >= 90.0 && lon < 270.0 ? "Âm Độn" : "Dương Độn";
}

/** Most recent Đông Chí whose first Giáp Tý day is <= the date; returns [giapTyDate, daysInclusive, dongChiDate]. */
export function getFirstGiapTyAfterDongChi(
  dd: number,
  mm: number,
  yy: number,
  tz = 7.0,
): [[number, number, number], number, [number, number, number]] {
  const targetJd = jdFromDate(dd, mm, yy);
  let dcYear = yy;
  let dcJd = findSolsticeJd(dcYear, true, tz);
  if (dcJd > targetJd) {
    dcYear -= 1;
    dcJd = findSolsticeJd(dcYear, true, tz);
  }
  const firstGiapTy = (start: number) => {
    for (let i = 0; i < 60; i++) {
      const c = start + i;
      if (mod(c + 9, 10) === 0 && mod(c + 1, 12) === 0) return c;
    }
    return start;
  };
  let gt = firstGiapTy(dcJd);
  if (gt > targetJd) {
    dcYear -= 1;
    dcJd = findSolsticeJd(dcYear, true, tz);
    gt = firstGiapTy(dcJd);
  }
  return [jdToDate(gt), targetJd - gt + 1, jdToDate(dcJd)];
}

export interface ThaiAtCanChiNumbers {
  can: string;
  chi: string;
  can_num: number;
  chi_num: number;
  nap_am: string;
  nap_am_hanh: string;
  nap_am_num: number;
  total: number;
}

/** Thái Ất Nạp Giáp & Nạp Âm numbers (Cuốn VII, trang 490-492). */
export function getThaiAtCanChiNumbers(can: string, chi: string): ThaiAtCanChiNumbers {
  const [, canNum] = NAP_GIAP_CAN[can as keyof typeof NAP_GIAP_CAN];
  const [, chiNum] = NAP_GIAP_CHI[chi as keyof typeof NAP_GIAP_CHI];
  const [napAmName, napAmHanh] = (NAP_AM as Record<string, readonly [string, string]>)[`${can}|${chi}`] ?? ["Không rõ", "Thổ"];
  const napAmNum = HANH_TO_THAI_AT_NUM[napAmHanh as keyof typeof HANH_TO_THAI_AT_NUM];
  return {
    can,
    chi,
    can_num: canNum,
    chi_num: chiNum,
    nap_am: napAmName,
    nap_am_hanh: napAmHanh,
    nap_am_num: napAmNum,
    total: canNum + chiNum + napAmNum,
  };
}
