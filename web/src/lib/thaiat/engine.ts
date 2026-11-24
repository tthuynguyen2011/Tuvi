/**
 * Thái Ất Thần Kinh calculation engine.
 * Faithful port of tuvi-app/thai_at_engine.py — output shape is identical
 * (verified by tests/parity.test.ts against the Python engine).
 */
import {
  CHI,
  TA_CUNG_NUMBER_MAP,
  TA_GIAN_THAN,
  TA_GRID_POS,
  TA_NHAN_MENH_12,
  TA_PALACE_DIRECTION,
  TA_PALACE_HANH,
  TA_PALACE_KHI,
  TA_PALACES_16,
} from "../tuvi/data";
import {
  getDayCanChi,
  getDonType,
  getFirstGiapTyAfterDongChi,
  getHourCanChi,
  getMonthCanChi,
  getThaiAtCanChiNumbers,
  getYearCanChi,
  hourToChiIndex,
  lunarToSolar,
  mod,
  solarToLunar,
  type ThaiAtCanChiNumbers,
} from "../tuvi/lunar";

export type DonType = "Dương Độn" | "Âm Độn";
export type KeMode = "thoi_ke" | "nhat_ke" | "nguyet_ke" | "tue_ke";
export type StarRole = "chu_te" | "chu" | "khach" | "than" | "co" | "phuc" | "tue" | "nhan_menh";

export interface TaStar {
  name: string;
  role: StarRole;
}

export const PALACES_16 = TA_PALACES_16 as readonly string[];
const CUNG_NUMBER = TA_CUNG_NUMBER_MAP as Record<string, number>;
const NUMBER_TO_CUNG: Record<number, string> = Object.fromEntries(Object.entries(CUNG_NUMBER).map(([k, v]) => [v, k]));
const GIAN = new Set<string>(TA_GIAN_THAN);
export const PALACE_HANH = TA_PALACE_HANH as Record<string, string>;
export const PALACE_KHI = TA_PALACE_KHI as Record<string, string>;
export const PALACE_DIRECTION = TA_PALACE_DIRECTION as Record<string, string>;
const GRID = TA_GRID_POS as Record<string, readonly [number, number]>;

const RING_DUONG = [1, 2, 3, 4, 6, 7, 8, 9];
const RING_AM = [9, 8, 7, 6, 4, 3, 2, 1];
const TICH_NIEN_BASE = 10155358; // Tích niên of 1441 (Cuốn I)

function countSteps16(start: string, steps: number, doubleOn: Set<string>, clockwise = true): string {
  let idx = PALACES_16.indexOf(start);
  const dir = clockwise ? 1 : -1;
  let rem = steps;
  while (rem > 0) {
    const palace = PALACES_16[idx];
    const cost = doubleOn.has(palace) ? 2 : 1;
    if (rem <= cost) return palace;
    rem -= cost;
    idx = mod(idx + dir, 16);
  }
  return PALACES_16[idx];
}

function dist16(start: string, target: string): number {
  return mod(PALACES_16.indexOf(target) - PALACES_16.indexOf(start), 16) + 1;
}

export interface Toan {
  toan: number;
  dai_tuong_num: number;
  dai_tuong_cung: string;
  tham_tuong_num: number;
  tham_tuong_cung: string;
  visited: [string, number][];
}

function calcToan(muc: string, thaiAt: string): Toan {
  let idx = PALACES_16.indexOf(muc);
  let total = 0;
  const visited: [string, number][] = [];
  for (let step = 0; step < 16; step++) {
    const pal = PALACES_16[idx];
    if (pal === thaiAt) break;
    const val = GIAN.has(pal) ? (step === 0 ? 1 : 0) : CUNG_NUMBER[pal];
    if (val > 0) {
      total += val;
      visited.push([pal, val]);
    }
    idx = mod(idx + 1, 16);
  }
  if (total === 0) total = 1;
  let dai = total % 10;
  if (dai === 0) dai = total >= 10 ? Math.floor(total / 10) : 1;
  const tham = (dai * 3) % 10;
  return {
    toan: total,
    dai_tuong_num: dai,
    dai_tuong_cung: NUMBER_TO_CUNG[dai] ?? "Trung",
    tham_tuong_num: tham,
    tham_tuong_cung: tham !== 0 ? (NUMBER_TO_CUNG[tham] ?? "Trung") : "Trung",
    visited,
  };
}

export interface TaBoard {
  ky_du: number;
  nguyen: number;
  cuc: number;
  don_type: DonType;
  thai_at_cung: string;
  thai_at_num: number;
  ke_than_cung: string;
  van_xuong_cung: string;
  thuy_kich_cung: string;
  chu: Toan;
  khach: Toan;
  quan_co_cung: string;
  than_co_cung: string;
  dan_co_cung: string;
  ngu_phuc_cung: string;
  tu_than_cung: string;
  thien_at_cung: string;
  dia_at_cung: string;
  truc_phu_cung: string;
  stars_by_palace: Record<string, TaStar[]>;
}

export function placeStarsFromTich(tichSo: number, donType: DonType = "Dương Độn"): TaBoard {
  let kyDu = tichSo % 360;
  if (kyDu === 0) kyDu = 360;
  const nguyen = Math.floor((kyDu - 1) / 72) + 1;
  const cuc = ((kyDu - 1) % 72) + 1;
  const isAm = donType === "Âm Độn";

  // 1. Thái Ất: 3 toán 1 cung over 8 cung
  let rem24 = kyDu % 24;
  if (rem24 === 0) rem24 = 24;
  const stepAt = Math.floor((rem24 - 1) / 3);
  const thaiAtNum = (isAm ? RING_AM : RING_DUONG)[stepAt];
  const thaiAtCung = NUMBER_TO_CUNG[thaiAtNum];

  // 2. Kế Thần
  let rem12 = kyDu % 12;
  if (rem12 === 0) rem12 = 12;
  const keIdx = mod(CHI.indexOf(isAm ? "Thân" : "Dần") - (rem12 - 1), 12);
  const keThanCung = CHI[keIdx];

  // 3. Thiên Mục (Văn Xương)
  let rem18 = kyDu % 18;
  if (rem18 === 0) rem18 = 18;
  const vanXuongCung = isAm
    ? countSteps16("Dần", rem18, new Set(["Cấn", "Tốn"]), true)
    : countSteps16("Thân", rem18, new Set(["Kiền", "Khôn"]), true);

  // 4. Địa Mục (Thủy Kích)
  const dVx = dist16(keThanCung, vanXuongCung);
  const thuyKichCung = PALACES_16[mod(PALACES_16.indexOf("Cấn") + dVx - 1, 16)];

  // 5. Toán Chủ & Khách
  const chu = calcToan(vanXuongCung, thaiAtCung);
  const khach = calcToan(thuyKichCung, thaiAtCung);

  // 6. Tam Cơ
  const tamCoTich = tichSo + 250;
  const quanCoCung = CHI[mod(CHI.indexOf("Ngọ") + Math.floor((tamCoTich % 360) / 30), 12)];
  const thanCoCung = CHI[mod(CHI.indexOf("Ngọ") + Math.floor((tamCoTich % 36) / 3), 12)];
  const danCoCung = CHI[mod(CHI.indexOf("Tuất") + (tamCoTich % 12), 12)];

  // 7. Ngũ Phúc
  const nguPhucRing = ["Kiền", "Cấn", "Tốn", "Khôn", "Trung"];
  const nguPhucCung = nguPhucRing[Math.floor(((tichSo + 115) % 225) / 45) % 5];

  // 8. Tứ Thần, Thiên Ất, Địa Ất, Trực Phù
  const tuThanRing = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "Tỵ", "Thân", "Dần"];
  const toPalace = (label: string) => (/^\d+$/.test(label) ? NUMBER_TO_CUNG[Number(label)] : label);
  const tuThanIdx = Math.floor((tichSo % 36) / 3) % 12;
  const tuThanCung = toPalace(tuThanRing[tuThanIdx]);
  const thienAtCung = toPalace(tuThanRing[(tuThanIdx + 5) % 12]);
  const trucPhuCung = toPalace(tuThanRing[(tuThanIdx + 4) % 12]);
  const diaAtCung = toPalace(tuThanRing[(tuThanIdx + 8) % 12]);

  const sbp: Record<string, TaStar[]> = Object.fromEntries([...PALACES_16, "Trung"].map((p) => [p, []]));
  const add = (p: string, name: string, role: StarRole) => sbp[p].push({ name, role });
  add(thaiAtCung, "Thái Ất (Ất Cả)", "chu_te");
  add(vanXuongCung, "Văn Xương (Thiên Mục)", "chu");
  add(thuyKichCung, "Thủy Kích (Địa Mục)", "khach");
  add(keThanCung, "Kế Thần", "than");
  add(chu.dai_tuong_cung, `Chủ Đại Tướng (${chu.dai_tuong_num})`, "chu");
  add(chu.tham_tuong_cung, `Chủ Tham Tướng (${chu.tham_tuong_num})`, "chu");
  add(khach.dai_tuong_cung, `Khách Đại Tướng (${khach.dai_tuong_num})`, "khach");
  add(khach.tham_tuong_cung, `Khách Tham Tướng (${khach.tham_tuong_num})`, "khach");
  add(quanCoCung, "Quân Cơ", "co");
  add(thanCoCung, "Thần Cơ", "co");
  add(danCoCung, "Dân Cơ", "co");
  add(nguPhucCung, "Ngũ Phúc", "phuc");
  add(tuThanCung, "Tứ Thần", "than");
  add(thienAtCung, "Thiên Ất", "than");
  add(diaAtCung, "Địa Ất", "than");
  add(trucPhuCung, "Trực Phù", "than");

  return {
    ky_du: kyDu,
    nguyen,
    cuc,
    don_type: donType,
    thai_at_cung: thaiAtCung,
    thai_at_num: thaiAtNum,
    ke_than_cung: keThanCung,
    van_xuong_cung: vanXuongCung,
    thuy_kich_cung: thuyKichCung,
    chu,
    khach,
    quan_co_cung: quanCoCung,
    than_co_cung: thanCoCung,
    dan_co_cung: danCoCung,
    ngu_phuc_cung: nguPhucCung,
    tu_than_cung: tuThanCung,
    thien_at_cung: thienAtCung,
    dia_at_cung: diaAtCung,
    truc_phu_cung: trucPhuCung,
    stars_by_palace: sbp,
  };
}

export interface PalaceMeta {
  hanh: string;
  khi: string;
  direction: string;
  cung_num: number | null;
  is_gian: boolean;
  grid: readonly [number, number] | null;
}

function palaceMeta(): Record<string, PalaceMeta> {
  return Object.fromEntries(
    [...PALACES_16, "Trung"].map((p) => [
      p,
      {
        hanh: PALACE_HANH[p],
        khi: PALACE_KHI[p],
        direction: PALACE_DIRECTION[p],
        cung_num: CUNG_NUMBER[p] ?? null,
        is_gian: GIAN.has(p),
        grid: GRID[p] ? [GRID[p][0], GRID[p][1]] : null,
      },
    ]),
  );
}

const pad2 = (n: number) => String(n).padStart(2, "0");
const fmtDate = ([d, m, y]: [number, number, number]) => `${pad2(d)}/${pad2(m)}/${y}`;

interface CanChi4 {
  year: string;
  month: string;
  day: string;
  hour: string;
}

export interface DivinationChart {
  mode: "divination";
  ke_mode: KeMode;
  solar: { day: number; month: number; year: number; hour_24: number };
  lunar: { day: number; month: number; year: number; is_leap: boolean };
  can_chi: CanChi4;
  tich_nien: number;
  days_since_giap_ty: number;
  dong_chi_date: string;
  question: string;
  topic: string;
  querent: (ThaiAtCanChiNumbers & { birth_year: number }) | null;
  board: TaBoard;
  palace_meta: Record<string, PalaceMeta>;
}

export interface DivinationInput {
  dd: number;
  mm: number;
  yy: number;
  hour_24: number;
  ke_mode?: KeMode;
  question?: string;
  topic?: string;
  querent_birth_year?: number | null;
}

export function buildDivinationChart(input: DivinationInput): DivinationChart {
  const { dd, mm, yy, hour_24 } = input;
  const keMode = input.ke_mode ?? "thoi_ke";
  const [lDay, lMonth, lYear, lLeap] = solarToLunar(dd, mm, yy);
  const y = getYearCanChi(lYear);
  const m = getMonthCanChi(lMonth, lYear);
  const d = getDayCanChi(dd, mm, yy);
  const hChiI = hourToChiIndex(hour_24);
  const h = getHourCanChi(d.canIdx, hChiI);

  const donType = getDonType(dd, mm, yy, hour_24);
  const tichNien = TICH_NIEN_BASE + (lYear - 1441);
  const [, daysSinceGt, dcDate] = getFirstGiapTyAfterDongChi(dd, mm, yy);

  let tichSo: number;
  let usedDon: DonType = "Dương Độn";
  if (keMode === "tue_ke") tichSo = tichNien;
  else if (keMode === "nguyet_ke") tichSo = (tichNien % 360) * 12 + lMonth;
  else if (keMode === "nhat_ke") tichSo = daysSinceGt;
  else {
    tichSo = (daysSinceGt - 1) * 12 + (hChiI + 1);
    usedDon = donType;
  }

  const board = placeStarsFromTich(tichSo, usedDon);
  if (y.chi in board.stars_by_palace) board.stars_by_palace[y.chi].push({ name: `Thái Tuế (${y.chi})`, role: "tue" });

  let querent: DivinationChart["querent"] = null;
  if (input.querent_birth_year) {
    const q = getYearCanChi(input.querent_birth_year);
    querent = { ...getThaiAtCanChiNumbers(q.can, q.chi), birth_year: input.querent_birth_year };
  }

  return {
    mode: "divination",
    ke_mode: keMode,
    solar: { day: dd, month: mm, year: yy, hour_24 },
    lunar: { day: lDay, month: lMonth, year: lYear, is_leap: Boolean(lLeap) },
    can_chi: {
      year: `${y.can} ${y.chi}`,
      month: `${m.can} ${m.chi}`,
      day: `${d.can} ${d.chi}`,
      hour: `${h.can} ${h.chi}`,
    },
    tich_nien: tichNien,
    days_since_giap_ty: daysSinceGt,
    dong_chi_date: fmtDate(dcDate),
    question: input.question ?? "",
    topic: input.topic ?? "chung",
    querent,
    board,
    palace_meta: palaceMeta(),
  };
}

export interface NhanMenhChart {
  mode: "nhan_menh";
  name: string;
  gender: string;
  is_thuan: boolean;
  am_duong_menh: string;
  solar: { day: number; month: number; year: number; hour_24: number };
  lunar: { day: number; month: number; year: number; is_leap: boolean };
  can_chi: CanChi4;
  toan_so: {
    year: ThaiAtCanChiNumbers;
    month: ThaiAtCanChiNumbers;
    day: ThaiAtCanChiNumbers;
    hour: ThaiAtCanChiNumbers;
    day_hour_sum: number;
    total: number;
  };
  days_tich: number;
  giap_ty_date: string;
  dong_chi_date: string;
  menh_cung: string;
  cung_12: Record<string, string>;
  board: TaBoard;
  view_year: number;
  view_year_can_chi: string;
  view_board: TaBoard;
  palace_meta: Record<string, PalaceMeta>;
}

export interface NhanMenhInput {
  name: string;
  gender: "Nam" | "Nữ";
  dd: number;
  mm: number;
  yy: number;
  hour_24: number;
  is_lunar?: boolean;
  is_leap?: boolean;
  view_year?: number;
}

export function buildNhanMenhChart(input: NhanMenhInput): NhanMenhChart {
  const { name, gender, dd, mm, yy, hour_24 } = input;
  const viewYear = input.view_year ?? 2026;
  let sD: number, sM: number, sY: number, lDay: number, lMonth: number, lYear: number;
  let isLeap = input.is_leap ?? false;
  if (input.is_lunar) {
    [lDay, lMonth, lYear] = [dd, mm, yy];
    [sD, sM, sY] = lunarToSolar(dd, mm, yy, isLeap ? 1 : 0);
  } else {
    [sD, sM, sY] = [dd, mm, yy];
    let leapNum: number;
    [lDay, lMonth, lYear, leapNum] = solarToLunar(dd, mm, yy);
    isLeap = Boolean(leapNum);
  }

  const y = getYearCanChi(lYear);
  const m = getMonthCanChi(lMonth, lYear);
  const d = getDayCanChi(sD, sM, sY);
  const hChiI = hourToChiIndex(hour_24);
  const h = getHourCanChi(d.canIdx, hChiI);

  const nYear = getThaiAtCanChiNumbers(y.can, y.chi);
  const nMonth = getThaiAtCanChiNumbers(m.can, m.chi);
  const nDay = getThaiAtCanChiNumbers(d.can, d.chi);
  const nHour = getThaiAtCanChiNumbers(h.can, h.chi);

  const [giapTyDate, daysTich, dcDate] = getFirstGiapTyAfterDongChi(sD, sM, sY);
  const board = placeStarsFromTich(daysTich, "Dương Độn");
  if (y.chi in board.stars_by_palace) board.stars_by_palace[y.chi].push({ name: `Thái Tuế Sinh (${y.chi})`, role: "tue" });

  const isDuongYear = y.canIdx % 2 === 0;
  const isMale = gender === "Nam";
  const isThuan = (isDuongYear && isMale) || (!isDuongYear && !isMale);
  const dir = isThuan ? 1 : -1;
  const stepsFromDan = mod(hChiI - 2, 12);
  const menhChiIdx = mod(y.chiIdx + dir * (stepsFromDan + (lMonth - 1)), 12);
  const menhCung = CHI[menhChiIdx];

  const cung12: Record<string, string> = {};
  TA_NHAN_MENH_12.forEach((cname, i) => {
    const cChi = CHI[mod(menhChiIdx + dir * i, 12)];
    cung12[cname] = cChi;
    board.stars_by_palace[cChi].push({ name: cname, role: "nhan_menh" });
  });

  const viewBoard = placeStarsFromTich(TICH_NIEN_BASE + (viewYear - 1441), "Dương Độn");
  const v = getYearCanChi(viewYear);
  if (v.chi in viewBoard.stars_by_palace) viewBoard.stars_by_palace[v.chi].push({ name: `Thái Tuế ${viewYear} (${v.chi})`, role: "tue" });

  return {
    mode: "nhan_menh",
    name,
    gender,
    is_thuan: isThuan,
    am_duong_menh: (isDuongYear ? "Dương " : "Âm ") + (isMale ? "Nam" : "Nữ"),
    solar: { day: sD, month: sM, year: sY, hour_24 },
    lunar: { day: lDay, month: lMonth, year: lYear, is_leap: isLeap },
    can_chi: {
      year: `${y.can} ${y.chi}`,
      month: `${m.can} ${m.chi}`,
      day: `${d.can} ${d.chi}`,
      hour: `${h.can} ${h.chi}`,
    },
    toan_so: {
      year: nYear,
      month: nMonth,
      day: nDay,
      hour: nHour,
      day_hour_sum: nDay.total + nHour.total,
      total: nYear.total + nMonth.total + nDay.total + nHour.total,
    },
    days_tich: daysTich,
    giap_ty_date: fmtDate(giapTyDate),
    dong_chi_date: fmtDate(dcDate),
    menh_cung: menhCung,
    cung_12: cung12,
    board,
    view_year: viewYear,
    view_year_can_chi: `${v.can} ${v.chi}`,
    view_board: viewBoard,
    palace_meta: palaceMeta(),
  };
}
