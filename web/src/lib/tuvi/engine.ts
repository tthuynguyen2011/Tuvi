/**
 * Deterministic Tu Vi Dau So An Sao Engine.
 * Faithful port of tuvi-app/tuvi_engine.py — output shape is identical.
 */
import {
  BRIGHTNESS,
  BRIGHTNESS_FULL,
  CAN,
  CAN_HANH,
  CAN_SHORT,
  CAT_STARS,
  CHI,
  CUC_NAME,
  HANH_TO_CUC,
  KHAC,
  KHOI_VIET,
  LOC_TON_POS,
  MENH_CHU,
  NAP_AM,
  PALACE_NAMES,
  SINH,
  STAR_HANH,
  THAN_CHU,
  TRANG_SINH_NAMES,
  TRANG_SINH_START,
  TU_HOA,
} from "./data";
import {
  getDayCanChi,
  getHourCanChi,
  getMonthCanChi,
  getYearCanChi,
  hourToChiIndex,
  lunarToSolar,
  mod,
  solarToLunar,
} from "./lunar";

export type Gender = "Nam" | "Nữ";
export type Brightness = "M" | "V" | "Đ" | "B" | "H";

export interface ChinhStar {
  name: string;
  hanh: string;
  brightness: Brightness;
  brightness_full: string;
}
export interface PhuStar {
  name: string;
  hanh: string;
  is_luu: boolean;
}
export interface Palace {
  chi_idx: number;
  chi: string;
  can: string;
  can_short: string;
  can_hanh: string;
  name: string;
  display_name: string;
  is_menh: boolean;
  is_than: boolean;
  dai_han: number;
  trang_sinh: string;
  tieu_han_chi: string;
  nguyet_han: number;
  chinh_tinh: ChinhStar[];
  cat_tinh: PhuStar[];
  sat_tinh: PhuStar[];
  tuan: boolean;
  triet: boolean;
}
export interface ChartInfo {
  name: string;
  gender: Gender;
  solar: string;
  lunar: string;
  s_day: number;
  s_month: number;
  s_year: number;
  l_day: number;
  l_month: number;
  l_year: number;
  l_leap: boolean;
  hour_24: number;
  year_cc: string;
  month_cc: string;
  day_cc: string;
  hour_cc: string;
  view_year: number;
  view_year_cc: string;
  tuoi_mu: number;
  am_duong: string;
  am_duong_ly: string;
  thuan_chieu: boolean;
  ban_menh: string;
  ban_menh_hanh: string;
  cuc_num: number;
  cuc_name: string;
  cuc_hanh: string;
  menh_cuc_rel: string;
  menh_chi_idx: number;
  menh_chi: string;
  than_chi_idx: number;
  than_chi: string;
  than_cu: string;
  menh_chu: string;
  than_chu: string;
  tieu_han_chi_idx: number;
  dai_van_chi_idx: number | null;
  luu_thai_tue_idx: number;
}
export interface Chart {
  info: ChartInfo;
  palaces: Palace[];
}

type Hanh = keyof typeof SINH;
const CAT_SET = new Set<string>(CAT_STARS);
const pad2 = (n: number) => String(n).padStart(2, "0");

export function napAm(can: string, chi: string): readonly [string, string] {
  return NAP_AM[`${can}|${chi}` as keyof typeof NAP_AM];
}

export function getSinhKhac(h1: string, h2: string): string {
  if (h1 === h2) return "Bình Hòa";
  if (SINH[h1 as Hanh] === h2) return "Sinh";
  if (SINH[h2 as Hanh] === h1) return "Được Sinh";
  if (KHAC[h1 as Hanh] === h2) return "Khắc";
  return "Bị Khắc";
}

function addStar(palaces: Palace[], chiIdx: number, name: string, isChinh = false, isLuu = false) {
  let clean = name.startsWith("L.") ? name.slice(2) : name;
  if (name.startsWith("LN ")) clean = name.slice(3);
  const hanh = (STAR_HANH as Record<string, string>)[clean] ?? "Thổ";
  if (isChinh) {
    const bright = (BRIGHTNESS as Record<string, readonly string[]>)[clean][chiIdx] as Brightness;
    palaces[chiIdx].chinh_tinh.push({
      name,
      hanh,
      brightness: bright,
      brightness_full: BRIGHTNESS_FULL[bright],
    });
  } else {
    const target = CAT_SET.has(clean) ? "cat_tinh" : "sat_tinh";
    palaces[chiIdx][target].push({ name, hanh, is_luu: isLuu });
  }
}

export interface ChartInput {
  name: string;
  gender: Gender;
  year: number;
  month: number;
  day: number;
  hour_24: number;
  is_lunar?: boolean;
  is_leap?: boolean;
  view_year?: number;
}

export function buildChart(input: ChartInput): Chart {
  const { name, gender, year, month, day, hour_24 } = input;
  const isLunar = input.is_lunar ?? false;
  const isLeap = input.is_leap ?? false;
  const viewYear = input.view_year ?? 2026;

  let sDay: number, sMonth: number, sYear: number;
  let lDay: number, lMonth: number, lYear: number, lLeap: number;
  if (isLunar) {
    [lDay, lMonth, lYear, lLeap] = [day, month, year, isLeap ? 1 : 0];
    [sDay, sMonth, sYear] = lunarToSolar(lDay, lMonth, lYear, lLeap);
  } else {
    [sDay, sMonth, sYear] = [day, month, year];
    [lDay, lMonth, lYear, lLeap] = solarToLunar(sDay, sMonth, sYear);
  }

  const y = getYearCanChi(lYear);
  const m = getMonthCanChi(lMonth, lYear);
  const d = getDayCanChi(sDay, sMonth, sYear);
  const hChiIdx = hourToChiIndex(hour_24);
  const h = getHourCanChi(d.canIdx, hChiIdx);
  const yCanIdx = y.canIdx;
  const yChiIdx = y.chiIdx;

  const isDuong = yCanIdx % 2 === 0;
  const amDuongStr = `${isDuong ? "Dương" : "Âm"} ${gender}`;
  const thuanChieu = (isDuong && gender === "Nam") || (!isDuong && gender === "Nữ");

  const menhIdx = mod(2 + (lMonth - 1) - hChiIdx, 12);
  const thanIdx = mod(2 + (lMonth - 1) + hChiIdx, 12);

  const menhDuong = menhIdx % 2 === 0;
  const adLy = menhDuong === isDuong ? "Âm Dương Thuận Lý" : "Âm Dương Nghịch Lý";

  const [banMenhName, banMenhHanh] = napAm(y.can, y.chi);

  const danCanIdx = mod((yCanIdx % 5) * 2 + 2, 10);
  const palaceCans: number[] = [];
  for (let c = 0; c < 12; c++) palaceCans[c] = mod(danCanIdx + mod(c - 2, 12), 10);

  const [, menhPalaceHanh] = napAm(CAN[palaceCans[menhIdx]], CHI[menhIdx]);
  const cucNum = HANH_TO_CUC[menhPalaceHanh as Hanh];
  const [cucName, cucHanh] = CUC_NAME[String(cucNum) as keyof typeof CUC_NAME];

  let menhCucRel: string;
  if (cucHanh === banMenhHanh) menhCucRel = "Mệnh Cục Bình Hòa";
  else if (SINH[cucHanh as Hanh] === banMenhHanh) menhCucRel = "Cục sinh Mệnh";
  else if (SINH[banMenhHanh as Hanh] === cucHanh) menhCucRel = "Mệnh sinh Cục";
  else if (KHAC[cucHanh as Hanh] === banMenhHanh) menhCucRel = "Cục khắc Mệnh";
  else menhCucRel = "Mệnh khắc Cục";

  const palaces: Palace[] = [];
  for (let i = 0; i < 12; i++) {
    const pName = PALACE_NAMES[mod(i - menhIdx, 12)];
    const pDisplay = pName === "PHU THÊ" && gender === "Nữ" ? "PHU QUÂN" : pName;
    const can = CAN[palaceCans[i]];
    palaces.push({
      chi_idx: i,
      chi: CHI[i],
      can,
      can_short: CAN_SHORT[palaceCans[i]],
      can_hanh: CAN_HANH[can as keyof typeof CAN_HANH],
      name: pName,
      display_name: pDisplay,
      is_menh: i === menhIdx,
      is_than: i === thanIdx,
      dai_han: 0,
      trang_sinh: "",
      tieu_han_chi: "",
      nguyet_han: 0,
      chinh_tinh: [],
      cat_tinh: [],
      sat_tinh: [],
      tuan: false,
      triet: false,
    });
  }

  // Dai Han
  for (let k = 0; k < 12; k++) {
    const idx = thuanChieu ? mod(menhIdx + k, 12) : mod(menhIdx - k, 12);
    palaces[idx].dai_han = cucNum + k * 10;
  }

  // Vong Trang Sinh
  const tsStart = TRANG_SINH_START[String(cucNum) as keyof typeof TRANG_SINH_START];
  TRANG_SINH_NAMES.forEach((tsName, k) => {
    const idx = thuanChieu ? mod(tsStart + k, 12) : mod(tsStart - k, 12);
    palaces[idx].trang_sinh = tsName;
  });

  // Tieu Han
  let thStart: number;
  if ([2, 6, 10].includes(yChiIdx)) thStart = 4;
  else if ([8, 0, 4].includes(yChiIdx)) thStart = 10;
  else if ([5, 9, 1].includes(yChiIdx)) thStart = 7;
  else thStart = 1;
  for (let k = 0; k < 12; k++) {
    const chiOfYear = mod(yChiIdx + k, 12);
    const pos = gender === "Nam" ? mod(thStart + k, 12) : mod(thStart - k, 12);
    palaces[pos].tieu_han_chi = CHI[chiOfYear];
  }

  // Tu Vi & 14 Chinh Tinh
  const rem = lDay % cucNum;
  let tuViIdx: number;
  if (rem === 0) {
    const q = Math.floor(lDay / cucNum);
    tuViIdx = mod(2 + q - 1, 12);
  } else {
    const borrow = cucNum - rem;
    const q = Math.floor((lDay + borrow) / cucNum);
    tuViIdx = borrow % 2 === 1 ? mod(2 + q - 1 - borrow, 12) : mod(2 + q - 1 + borrow, 12);
  }
  const thienPhuIdx = mod(4 - tuViIdx, 12);

  const tuViOffsets: [number, string][] = [
    [0, "Tử Vi"], [-1, "Thiên Cơ"], [-3, "Thái Dương"],
    [-4, "Vũ Khúc"], [-5, "Thiên Đồng"], [-8, "Liêm Trinh"],
  ];
  const thienPhuOffsets: [number, string][] = [
    [0, "Thiên Phủ"], [1, "Thái Âm"], [2, "Tham Lang"], [3, "Cự Môn"],
    [4, "Thiên Tướng"], [5, "Thiên Lương"], [6, "Thất Sát"], [10, "Phá Quân"],
  ];
  const starPos: Record<string, number> = {};
  for (const [off, s] of tuViOffsets) {
    const pos = mod(tuViIdx + off, 12);
    starPos[s] = pos;
    addStar(palaces, pos, s, true);
  }
  for (const [off, s] of thienPhuOffsets) {
    const pos = mod(thienPhuIdx + off, 12);
    starPos[s] = pos;
    addStar(palaces, pos, s, true);
  }

  // Vong Thai Tue
  const thaiTueStars = [
    "Thái Tuế", "Thiếu Dương", "Tang Môn", "Thiếu Âm", "Quan Phù", "Tử Phù",
    "Tuế Phá", "Long Đức", "Bạch Hổ", "Phúc Đức", "Điếu Khách", "Trực Phù",
  ];
  thaiTueStars.forEach((s, k) => addStar(palaces, mod(yChiIdx + k, 12), s));

  // Vong Loc Ton & Bac Si
  const locTonIdx = LOC_TON_POS[yCanIdx];
  addStar(palaces, locTonIdx, "Lộc Tồn");
  addStar(palaces, mod(locTonIdx + 1, 12), "Kình Dương");
  addStar(palaces, mod(locTonIdx - 1, 12), "Đà La");

  const bacSiStars = [
    "Bác Sĩ", "Lực Sỹ", "Thanh Long", "Tiểu Hao (BS)", "Tướng Quân", "Tấu Thư",
    "Phi Liêm", "Hỷ Thần", "Bệnh Phù", "Đại Hao (BS)", "Phục Binh", "Quan Phủ",
  ];
  bacSiStars.forEach((s, k) => {
    const pos = thuanChieu ? mod(locTonIdx + k, 12) : mod(locTonIdx - k, 12);
    addStar(palaces, pos, s);
  });

  // Khoi Viet
  const [khoiIdx, vietIdx] = KHOI_VIET[yCanIdx];
  addStar(palaces, khoiIdx, "Thiên Khôi");
  addStar(palaces, vietIdx, "Thiên Việt");

  // Van Xuong, Van Khuc
  const xuongIdx = mod(10 - hChiIdx, 12);
  const khucIdx = mod(4 + hChiIdx, 12);
  starPos["Văn Xương"] = xuongIdx;
  starPos["Văn Khúc"] = khucIdx;
  addStar(palaces, xuongIdx, "Văn Xương");
  addStar(palaces, khucIdx, "Văn Khúc");

  // Ta Phu, Huu Bat
  const taIdx = mod(4 + lMonth - 1, 12);
  const huuIdx = mod(10 - (lMonth - 1), 12);
  starPos["Tả Phụ"] = taIdx;
  starPos["Hữu Bật"] = huuIdx;
  addStar(palaces, taIdx, "Tả Phụ");
  addStar(palaces, huuIdx, "Hữu Bật");

  // Dia Khong, Dia Kiep
  addStar(palaces, mod(11 - hChiIdx, 12), "Địa Không");
  addStar(palaces, mod(11 + hChiIdx, 12), "Địa Kiếp");

  // Hoa Tinh, Linh Tinh
  let hoaBase: number, linhBase: number;
  if ([2, 6, 10].includes(yChiIdx)) [hoaBase, linhBase] = [1, 3];
  else if ([8, 0, 4].includes(yChiIdx)) [hoaBase, linhBase] = [2, 10];
  else if ([5, 9, 1].includes(yChiIdx)) [hoaBase, linhBase] = [3, 10];
  else [hoaBase, linhBase] = [9, 10];
  if (thuanChieu) {
    addStar(palaces, mod(hoaBase + hChiIdx, 12), "Hỏa Tinh");
    addStar(palaces, mod(linhBase - hChiIdx, 12), "Linh Tinh");
  } else {
    addStar(palaces, mod(hoaBase - hChiIdx, 12), "Hỏa Tinh");
    addStar(palaces, mod(linhBase + hChiIdx, 12), "Linh Tinh");
  }

  // Tu Hoa
  const hoaNames = ["Hóa Lộc", "Hóa Quyền", "Hóa Khoa", "Hóa Kỵ"];
  TU_HOA[yCanIdx].forEach((target, i) => {
    if (target in starPos) addStar(palaces, starPos[target], hoaNames[i]);
  });

  // Thien Ma, Dao Hoa, Kiep Sat, Hoa Cai
  let ma: number, dao: number, kiep: number, cai: number;
  if ([2, 6, 10].includes(yChiIdx)) [ma, dao, kiep, cai] = [8, 3, 11, 10];
  else if ([8, 0, 4].includes(yChiIdx)) [ma, dao, kiep, cai] = [2, 9, 5, 4];
  else if ([5, 9, 1].includes(yChiIdx)) [ma, dao, kiep, cai] = [11, 6, 2, 1];
  else [ma, dao, kiep, cai] = [5, 0, 8, 7];
  addStar(palaces, ma, "Thiên Mã");
  addStar(palaces, dao, "Đào Hoa");
  addStar(palaces, kiep, "Kiếp Sát");
  addStar(palaces, cai, "Hoa Cái");

  // Hong Loan, Thien Hy
  const hongIdx = mod(3 - yChiIdx, 12);
  addStar(palaces, hongIdx, "Hồng Loan");
  addStar(palaces, mod(hongIdx + 6, 12), "Thiên Hỷ");

  // Long Tri, Phuong Cac, Giai Than
  addStar(palaces, mod(4 + yChiIdx, 12), "Long Trì");
  const phuongIdx = mod(10 - yChiIdx, 12);
  addStar(palaces, phuongIdx, "Phượng Các");
  addStar(palaces, phuongIdx, "Giải Thần");

  // Thien Khoc, Thien Hu
  addStar(palaces, mod(6 - yChiIdx, 12), "Thiên Khốc");
  addStar(palaces, mod(6 + yChiIdx, 12), "Thiên Hư");

  // Tam Thai, Bat Toa
  addStar(palaces, mod(taIdx + lDay - 1, 12), "Tam Thai");
  addStar(palaces, mod(huuIdx - (lDay - 1), 12), "Bát Tọa");

  // An Quang, Thien Quy
  addStar(palaces, mod(xuongIdx + lDay - 2, 12), "Ân Quang");
  addStar(palaces, mod(khucIdx - (lDay - 2), 12), "Thiên Quý");

  // Thai Phu, Phong Cao
  addStar(palaces, mod(khucIdx + 2, 12), "Thai Phụ");
  addStar(palaces, mod(khucIdx - 2, 12), "Phong Cáo");

  // Thien Hinh, Thien Rieu, Thien Y
  addStar(palaces, mod(9 + lMonth - 1, 12), "Thiên Hình");
  const rieuIdx = mod(1 + lMonth - 1, 12);
  addStar(palaces, rieuIdx, "Thiên Riêu");
  addStar(palaces, rieuIdx, "Thiên Y");

  // Thien Giai, Dia Giai
  addStar(palaces, mod(8 + lMonth - 1, 12), "Thiên Giải");
  addStar(palaces, mod(7 + lMonth - 1, 12), "Địa Giải");

  // Co Than, Qua Tu
  const coMap: Record<number, number> = { 11: 2, 0: 2, 1: 2, 2: 5, 3: 5, 4: 5, 5: 8, 6: 8, 7: 8, 8: 11, 9: 11, 10: 11 };
  const coIdx = coMap[yChiIdx];
  addStar(palaces, coIdx, "Cô Thần");
  addStar(palaces, mod(coIdx - 4, 12), "Quả Tú");

  // Pha Toai
  if ([2, 8, 5, 11].includes(yChiIdx)) addStar(palaces, 9, "Phá Toái");
  else if ([0, 6, 3, 9].includes(yChiIdx)) addStar(palaces, 5, "Phá Toái");
  else addStar(palaces, 1, "Phá Toái");

  // Thien Quan, Thien Phuc
  const quanMap = [7, 4, 5, 2, 3, 9, 11, 9, 10, 6];
  const phucMap = [9, 8, 0, 11, 3, 2, 6, 5, 6, 5];
  addStar(palaces, quanMap[yCanIdx], "Thiên Quan");
  addStar(palaces, phucMap[yCanIdx], "Thiên Phúc");

  // Luu Ha, Thien Tru
  const luuHaMap = [9, 10, 7, 8, 5, 6, 8, 3, 11, 2];
  const truMap = [5, 6, 0, 5, 6, 8, 2, 6, 9, 10];
  addStar(palaces, luuHaMap[yCanIdx], "Lưu Hà");
  addStar(palaces, truMap[yCanIdx], "Thiên Trù");

  // Quoc An, Duong Phu
  addStar(palaces, mod(locTonIdx + 8, 12), "Quốc Ấn");
  addStar(palaces, mod(locTonIdx - 5, 12), "Đường Phù");

  // Thien Khong
  addStar(palaces, mod(yChiIdx + 1, 12), "Thiên Không");

  // Thien Tai, Thien Tho
  addStar(palaces, mod(menhIdx + yChiIdx, 12), "Thiên Tài");
  addStar(palaces, mod(thanIdx + yChiIdx, 12), "Thiên Thọ");

  // Thien Thuong, Thien Su
  addStar(palaces, mod(menhIdx + 5, 12), "Thiên Thương");
  addStar(palaces, mod(menhIdx + 7, 12), "Thiên Sứ");

  // Thien La, Dia Vong
  addStar(palaces, 4, "Thiên La");
  addStar(palaces, 10, "Địa Võng");

  // Thien Duc, Nguyet Duc
  addStar(palaces, mod(9 + yChiIdx, 12), "Thiên Đức");
  addStar(palaces, mod(5 + yChiIdx, 12), "Nguyệt Đức");

  // Dau Quan
  addStar(palaces, mod(yChiIdx - (lMonth - 1) + hChiIdx, 12), "Đẩu Quân");

  // Tuan
  const tuanBase = mod(yChiIdx - yCanIdx - 2, 12);
  palaces[tuanBase].tuan = true;
  palaces[mod(tuanBase + 1, 12)].tuan = true;

  // Triet
  const trietMap: Record<number, [number, number]> = {
    0: [8, 9], 5: [8, 9],
    1: [6, 7], 6: [6, 7],
    2: [4, 5], 7: [4, 5],
    3: [2, 3], 8: [2, 3],
    4: [0, 1], 9: [0, 1],
  };
  const [t1, t2] = trietMap[yCanIdx];
  palaces[t1].triet = true;
  palaces[t2].triet = true;

  // Nguyet Han for view year
  const vy = getYearCanChi(viewYear);
  const thView = palaces.find((p) => p.tieu_han_chi === vy.chi);
  const tieuHanViewIdx = thView ? thView.chi_idx : menhIdx;
  const thang1Idx = mod(tieuHanViewIdx - (lMonth - 1) + hChiIdx, 12);
  for (let mOff = 0; mOff < 12; mOff++) palaces[mod(thang1Idx + mOff, 12)].nguyet_han = mOff + 1;

  // Sao Luu Nien
  for (const [pos, lName] of getLuuNienStars(viewYear)) addStar(palaces, pos, lName, false, true);

  // Current Dai Van
  const tuoiMu = viewYear - lYear + 1;
  let daiVanPalace: number | null = null;
  if (tuoiMu >= cucNum) {
    const p = palaces.find((p) => p.dai_han <= tuoiMu && tuoiMu < p.dai_han + 10);
    if (p) daiVanPalace = p.chi_idx;
  }

  return {
    info: {
      name,
      gender,
      solar: `${pad2(sDay)}/${pad2(sMonth)}/${sYear}`,
      lunar: `${pad2(lDay)}/${pad2(lMonth)}/${lYear}` + (lLeap ? " (Nhuận)" : ""),
      s_day: sDay,
      s_month: sMonth,
      s_year: sYear,
      l_day: lDay,
      l_month: lMonth,
      l_year: lYear,
      l_leap: Boolean(lLeap),
      hour_24,
      year_cc: `${y.can} ${y.chi}`,
      month_cc: `${m.can} ${m.chi}`,
      day_cc: `${d.can} ${d.chi}`,
      hour_cc: `${h.can} ${h.chi}`,
      view_year: viewYear,
      view_year_cc: `${vy.can} ${vy.chi}`,
      tuoi_mu: tuoiMu,
      am_duong: amDuongStr,
      am_duong_ly: adLy,
      thuan_chieu: thuanChieu,
      ban_menh: banMenhName,
      ban_menh_hanh: banMenhHanh,
      cuc_num: cucNum,
      cuc_name: cucName,
      cuc_hanh: cucHanh,
      menh_cuc_rel: menhCucRel,
      menh_chi_idx: menhIdx,
      menh_chi: CHI[menhIdx],
      than_chi_idx: thanIdx,
      than_chi: CHI[thanIdx],
      than_cu: palaces[thanIdx].display_name,
      menh_chu: MENH_CHU[menhIdx],
      than_chu: THAN_CHU[yChiIdx],
      tieu_han_chi_idx: tieuHanViewIdx,
      dai_van_chi_idx: daiVanPalace,
      luu_thai_tue_idx: vy.chiIdx,
    },
    palaces,
  };
}

export function getLuuNienStars(viewYear: number): [number, string][] {
  const { canIdx, chiIdx } = getYearCanChi(viewYear);
  const res: [number, string][] = [
    [chiIdx, "L.Thái Tuế"],
    [mod(chiIdx + 2, 12), "L.Tang Môn"],
    [mod(chiIdx + 8, 12), "L.Bạch Hổ"],
    [mod(6 - chiIdx, 12), "L.Thiên Khốc"],
    [mod(6 + chiIdx, 12), "L.Thiên Hư"],
  ];
  const loc = LOC_TON_POS[canIdx];
  res.push([loc, "L.Lộc Tồn"]);
  res.push([mod(loc + 1, 12), "L.Kình Dương"]);
  res.push([mod(loc - 1, 12), "L.Đà La"]);

  let ma: number, dao: number;
  if ([2, 6, 10].includes(chiIdx)) [ma, dao] = [8, 3];
  else if ([8, 0, 4].includes(chiIdx)) [ma, dao] = [2, 9];
  else if ([5, 9, 1].includes(chiIdx)) [ma, dao] = [11, 6];
  else [ma, dao] = [5, 0];
  res.push([ma, "L.Thiên Mã"]);
  res.push([dao, "L.Đào Hoa"]);

  const hong = mod(3 - chiIdx, 12);
  res.push([hong, "L.Hồng Loan"]);
  res.push([mod(hong + 6, 12), "L.Thiên Hỷ"]);
  return res;
}
