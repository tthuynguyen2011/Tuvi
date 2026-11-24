/**
 * Rule-based Tu Vi Interpretation Engine.
 * Faithful port of tuvi-app/tuvi_analyzer.py — output shape is identical.
 */
import {
  BAD_STARS_MEANING,
  CHINH_TINH_DESC,
  GOOD_STARS_MEANING,
  LUU_STAR_PALACE_EFFECT,
  PALACE_DOMAIN,
} from "./data";
import { getLuuNienStars, getSinhKhac, napAm, type Chart, type Palace } from "./engine";
import { getYearCanChi, hourToChiIndex, mod, pyRound } from "./lunar";

const GOOD = GOOD_STARS_MEANING as Record<string, string>;
const BAD = BAD_STARS_MEANING as Record<string, string>;
const CHINH_DESC = CHINH_TINH_DESC as Record<string, { role: string; cat: string; hung: string }>;
const DOMAIN = PALACE_DOMAIN as Record<string, string>;
const LUU_EFFECT = LUU_STAR_PALACE_EFFECT as Record<string, readonly [string, string]>;

const strip = (n: string) => n.replaceAll("L.", "");
const uniq = <T,>(xs: T[]) => [...new Set(xs)];

export type Tone = "cat" | "good" | "neutral" | "warn" | "hung";

export interface PalaceReading {
  chi_idx: number;
  chi: string;
  palace_name: string;
  domain: string;
  score: number;
  rating: string;
  is_vcd: boolean;
  chinh_tinh: { name: string; brightness: string }[];
  cat_points: string[];
  hung_points: string[];
  advice: string[];
}

export interface YearReading {
  year: number;
  year_cc: string;
  year_hanh: string;
  tuoi_mu: number;
  is_dong_han: boolean;
  is_dv_transition: boolean;
  dai_van: { chi: string; palace: string; tuoi_range: string } | null;
  tieu_han: { chi_idx: number; chi: string; palace: string };
  luu_thai_tue: { chi_idx: number; chi: string; palace: string };
  score: number;
  verdict: string;
  tone: Tone;
  diem_may: string[];
  diem_hung: string[];
  advice: string[];
}

export interface Milestone {
  year: number;
  year_cc: string;
  tuoi_mu: number;
  type: "normal" | "transition" | "peak" | "caution";
  score: number;
  verdict: string;
  summary: string;
  diem_may: string[];
  diem_hung: string[];
}

export interface CachCuc {
  name: string;
  type: string;
  desc: string;
}

export interface FullReport {
  cach_cuc: CachCuc[];
  palace_readings: PalaceReading[];
  yearly_readings: YearReading[];
  milestones: Milestone[];
}

export interface PalaceYear {
  chi_idx: number;
  chi: string;
  lunar_month: number;
  palace_name: string;
  base_name: string;
  domain: string;
  ban_chinh: string[];
  xung_palace: string;
  xung_chinh: string[];
  tam_hop: [string, string];
  roles: string[];
  base_score: number;
  year_score: number;
  delta: number;
  trend: string;
  trend_tone: "cat" | "warn" | "neutral";
  luu_direct: string[];
  luu_xung: string[];
  cat_notes: string[];
  hung_notes: string[];
  month_advice: string;
}

export interface YearDetail {
  year_summary: YearReading;
  palaces_year: PalaceYear[];
}

function relatedIndices(chiIdx: number) {
  return {
    ban_cung: chiIdx,
    xung_chieu: mod(chiIdx + 6, 12),
    tam_hop: [mod(chiIdx + 4, 12), mod(chiIdx + 8, 12)] as [number, number],
    giap: [mod(chiIdx - 1, 12), mod(chiIdx + 1, 12)] as [number, number],
  };
}

function collectStars(palaces: Palace[], chiIdx: number) {
  const rel = relatedIndices(chiIdx);
  const p = palaces[chiIdx];
  const opp = palaces[rel.xung_chieu];
  const th1 = palaces[rel.tam_hop[0]];
  const th2 = palaces[rel.tam_hop[1]];
  return { ban_cung: p, xung_chieu: opp, tam_hop: [th1, th2] as [Palace, Palace], hoi_chieu_all: [p, opp, th1, th2] };
}

const TOP_CAT = ["Lộc Tồn", "Hóa Lộc", "Hóa Quyền", "Hóa Khoa", "Thiên Khôi", "Thiên Việt", "Tả Phụ", "Hữu Bật"];
const MID_CAT = ["Văn Xương", "Văn Khúc", "Thiên Mã", "Ân Quang", "Thiên Quý", "Thiên Giải", "Địa Giải"];
const TOP_SAT = ["Địa Không", "Địa Kiếp", "Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh", "Hóa Kỵ"];
const MID_SAT = ["Thái Tuế", "Tang Môn", "Bạch Hổ", "Thiên Hình", "Đại Hao", "Phục Binh"];

export function scorePalace(palaces: Palace[], chiIdx: number): number {
  const ctx = collectStars(palaces, chiIdx);
  const p = ctx.ban_cung;
  const opp = ctx.xung_chieu;
  let score = 55;

  const chinh = p.chinh_tinh;
  const isVcd = chinh.length === 0;
  const effective = isVcd ? opp.chinh_tinh : chinh;
  const weight = isVcd ? 0.65 : 1.0;

  for (const s of effective) {
    const b = s.brightness;
    if (b === "M") score += 14 * weight;
    else if (b === "V") score += 11 * weight;
    else if (b === "Đ") score += 7 * weight;
    else if (b === "H") score -= 10 * weight;
  }

  const groups: [Palace[], number][] = [
    [[p], 1.0],
    [[opp, ctx.tam_hop[0], ctx.tam_hop[1]], 0.45],
  ];
  for (const [group, factor] of groups) {
    for (const pal of group) {
      for (const s of pal.cat_tinh) {
        const n = strip(s.name);
        if (TOP_CAT.includes(n)) score += 6 * factor;
        else if (MID_CAT.includes(n)) score += 4 * factor;
        else score += 2 * factor;
      }
      for (const s of pal.sat_tinh) {
        const n = strip(s.name);
        if (TOP_SAT.includes(n)) score -= 6 * factor;
        else if (MID_SAT.includes(n)) score -= 3.5 * factor;
        else score -= 1.5 * factor;
      }
    }
  }

  if (p.tuan || p.triet) {
    if (isVcd) score += 8;
    else if (chinh.some((s) => s.brightness === "M" || s.brightness === "V")) score -= 8;
    else score += 4;
  }

  return Math.max(15, Math.min(98, pyRound(score)));
}

export function detectCachCuc(chart: Chart): [string, string, string][] {
  const { palaces, info } = chart;
  const menhIdx = info.menh_chi_idx;

  const allHoiNames = (idx: number) => {
    const res = new Set<string>();
    for (const pal of collectStars(palaces, idx).hoi_chieu_all)
      for (const s of [...pal.chinh_tinh, ...pal.cat_tinh, ...pal.sat_tinh]) res.add(s.name);
    return res;
  };

  const menhHoi = allHoiNames(menhIdx);
  const menhP = palaces[menhIdx];
  const menhChinh = new Set(menhP.chinh_tinh.map((s) => s.name));
  const hasChinh = (names: string[]) => names.some((n) => menhChinh.has(n));
  const hoiAll = (names: string[]) => names.every((n) => menhHoi.has(n));
  const list: [string, string, string][] = [];

  if (hasChinh(["Tử Vi", "Thiên Phủ"]) || hoiAll(["Tử Vi", "Thiên Phủ", "Vũ Khúc", "Thiên Tướng"]))
    list.push(["Tử Phủ Vũ Tướng", "Cát", "Bộ đế tinh – tài khố – ấn tinh hội chiếu, chủ uy tín, năng lực quản lý và hậu vận vững vàng."]);

  if (hasChinh(["Thất Sát", "Phá Quân", "Tham Lang"]))
    list.push(["Sát Phá Tham", "Biến Động", "Cách cục năng động, dám nghĩ dám làm, cuộc đời nhiều bước ngoặt lớn và bứt phá mạnh mẽ."]);

  if (hoiAll(["Thiên Cơ", "Thái Âm", "Thiên Đồng", "Thiên Lương"]))
    list.push(["Cơ Nguyệt Đồng Lương", "Cát", "Phù hợp công chức, chuyên môn, tham mưu, tài chính, giáo dục; cuộc sống ôn hòa và bền vững."]);

  if (menhHoi.has("Thái Dương") && menhHoi.has("Thái Âm")) {
    if (menhP.chinh_tinh.length === 0)
      list.push(["Nhật Nguyệt Chiếu Hư Không", "Cát", "Cung Vô Chính Diệu được Nhật Nguyệt hội chiếu, sáng sủa thông tuệ, dễ phát triển nhờ môi trường bên ngoài."]);
    else list.push(["Nhật Nguyệt Hội Chiếu", "Cát", "Âm Dương điều hòa, chủ trí tuệ, uy tín và khả năng thích nghi tốt."]);
  }

  if (menhChinh.has("Cự Môn") && menhHoi.has("Hóa Kỵ") && (menhHoi.has("Hóa Khoa") || menhHoi.has("Thiên Lương")))
    list.push(["Thạch Trung Ẩn Ngọc (biến thể)", "Quý", "Cự Môn gặp Kỵ nhưng được Khoa/Lương hóa giải, rèn giũa càng sâu sắc càng tỏa sáng."]);

  if (menhHoi.has("Lộc Tồn") && menhHoi.has("Hóa Lộc"))
    list.push(["Song Lộc Trùng Phùng", "Đại Cát", "Hai nguồn lộc hội tụ, tài chính dồi dào và cơ hội kinh doanh/tích lũy nổi trội."]);

  if (menhHoi.has("Lộc Tồn") && menhHoi.has("Thiên Mã"))
    list.push(["Lộc Mã Giao Trì", "Đại Cát", "Đi xa hoặc dịch chuyển công việc càng dễ sinh tài lộc, năng động phát đạt."]);

  if (hoiAll(["Hóa Lộc", "Hóa Quyền", "Hóa Khoa"]))
    list.push(["Tam Hóa Liên Châu / Khoa Quyền Lộc", "Đại Cát", "Hội đủ Danh – Quyền – Lộc, rất thuận lợi thăng tiến và khẳng định vị thế."]);

  if (menhP.chinh_tinh.length === 0 && (menhP.tuan || menhP.triet))
    list.push(["Mệnh Vô Chính Diệu đắc Tuần/Triệt", "Đặc Biệt", "Linh hoạt, khéo thích nghi; nhờ Tuần/Triệt án ngữ mà giữ được sự ổn định và tránh bấp bênh."]);

  const satCount = ["Địa Không", "Địa Kiếp", "Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh"].filter((n) => menhHoi.has(n)).length;
  if (satCount >= 3)
    list.push(["Hội nhiều Sát Tinh tại Tam Hợp Mệnh", "Lưu Ý", "Tính cách quyết liệt, trải nhiều thử thách rèn giũa; cần tiết chế nóng vội và giữ kỷ luật tài chính."]);

  return list;
}

const HOI_CAT = ["Lộc Tồn", "Hóa Lộc", "Hóa Quyền", "Hóa Khoa", "Thiên Khôi", "Thiên Việt", "Tả Phụ", "Hữu Bật", "Thiên Mã"];

export function analyzePalace(chart: Chart, chiIdx: number): PalaceReading {
  const { palaces } = chart;
  const ctx = collectStars(palaces, chiIdx);
  const p = ctx.ban_cung;
  const opp = ctx.xung_chieu;
  const score = scorePalace(palaces, chiIdx);

  const isVcd = p.chinh_tinh.length === 0;
  const chinhList = isVcd ? opp.chinh_tinh : p.chinh_tinh;

  const cat: string[] = [];
  const hung: string[] = [];
  const advice: string[] = [];

  if (isVcd) {
    const oppNames = opp.chinh_tinh.map((s) => `${s.name} (${s.brightness_full})`).join(", ") || "Vô Chính Diệu";
    cat.push(`Cung Vô Chính Diệu, mượn chính tinh đối cung [${opp.chi}] (${oppNames}) chiếu về nên có tính linh hoạt cao.`);
    if (p.tuan || p.triet) cat.push("Có Tuần/Triệt án ngữ giúp cung Vô Chính Diệu vững vàng hơn, giảm sự bấp bênh.");
    else hung.push("Cung Vô Chính Diệu không có Tuần/Triệt án ngữ, dễ chịu ảnh hưởng mạnh từ môi trường bên ngoài.");
  }

  for (const s of chinhList) {
    const meta = CHINH_DESC[s.name] ?? { cat: "", hung: "" };
    const prefix = isVcd ? "(Từ đối cung) " : "";
    if (s.brightness === "M" || s.brightness === "V" || s.brightness === "Đ")
      cat.push(`${prefix}**${s.name} (${s.brightness_full})**: ${meta.cat ?? ""}`);
    else hung.push(`${prefix}**${s.name} (${s.brightness_full})**: ${meta.hung ?? ""}`);
  }

  for (const s of p.cat_tinh) {
    const n = strip(s.name);
    if (n in GOOD && !s.is_luu) cat.push(`**${n}**: ${GOOD[n]}.`);
  }
  for (const s of p.sat_tinh) {
    const n = strip(s.name);
    if (n in BAD && !s.is_luu) hung.push(`**${n}**: ${BAD[n]}.`);
  }

  const hoiCat: string[] = [];
  const hoiHung: string[] = [];
  for (const pal of [opp, ...ctx.tam_hop]) {
    for (const s of pal.cat_tinh) {
      const n = strip(s.name);
      if (HOI_CAT.includes(n) && !s.is_luu) hoiCat.push(`${n} (${pal.chi})`);
    }
    for (const s of pal.sat_tinh) {
      const n = strip(s.name);
      if (TOP_SAT.includes(n) && !s.is_luu) hoiHung.push(`${n} (${pal.chi})`);
    }
  }
  if (hoiCat.length) cat.push(`Tam hợp / Xung chiếu có cát tinh trợ lực: ${uniq(hoiCat).join(", ")}.`);
  if (hoiHung.length) hung.push(`Tam hợp / Xung chiếu có sát tinh cần lưu tâm: ${uniq(hoiHung).join(", ")}.`);

  if (p.tuan || p.triet) {
    const tt = (
      [
        ["Tuần", p.tuan],
        ["Triệt", p.triet],
      ] as const
    )
      .filter(([, f]) => f)
      .map(([x]) => x)
      .join("/");
    if (!isVcd) hung.push(`Có **${tt}** án ngữ tại cung: giai đoạn đầu dễ gặp trở ngại hoặc chậm phát, về sau mới hanh thông.`);
  }

  let rating: string;
  if (score >= 70) {
    rating = "Rất Tốt (Cát)";
    advice.push("Phát huy thế mạnh sẵn có, chủ động nắm bắt cơ hội nhưng vẫn giữ sự khiêm tốn và tích đức.");
  } else if (score >= 52) {
    rating = "Khá / Bình Hòa";
    advice.push("Cân bằng giữa cơ hội và thách thức; phát triển từng bước chắc chắn, tránh nóng vội.");
  } else {
    rating = "Nhiều Thử Thách";
    advice.push("Cần kiên nhẫn, rèn luyện kỷ luật và tu dưỡng tâm tính; tránh quyết định mạo hiểm khi vận chưa thông.");
  }

  const names = [...p.chinh_tinh, ...p.sat_tinh].map((s) => s.name);
  if (names.some((n) => ["Hóa Kỵ", "Cự Môn", "Thái Tuế"].includes(n)))
    advice.push("Chú trọng lời ăn tiếng nói, văn bản giấy tờ rõ ràng để tránh thị phi hiểu lầm.");
  if (names.some((n) => ["Địa Không", "Địa Kiếp", "Đại Hao", "Phá Quân"].includes(n)))
    advice.push("Quản trị tài chính chặt chẽ, tránh đầu tư lướt sóng hoặc cho vay thiếu đảm bảo.");

  return {
    chi_idx: chiIdx,
    chi: p.chi,
    palace_name: p.display_name,
    domain: DOMAIN[p.name] ?? "",
    score,
    rating,
    is_vcd: isVcd,
    chinh_tinh: chinhList.map((s) => ({ name: s.name, brightness: s.brightness_full })),
    cat_points: cat.length ? cat : ["Bình ổn, không có xung phá lớn."],
    hung_points: hung.length ? hung : ["Không có sát tinh trọng yếu tọa thủ trực tiếp."],
    advice,
  };
}

const LUU_GOOD = ["L.Lộc Tồn", "L.Thiên Mã", "L.Đào Hoa", "L.Hồng Loan", "L.Thiên Hỷ"];
const LUU_BAD = ["L.Kình Dương", "L.Đà La", "L.Tang Môn", "L.Bạch Hổ", "L.Thiên Khốc", "L.Thiên Hư"];
const TH_CAT = ["Lộc Tồn", "Hóa Lộc", "Hóa Quyền", "Hóa Khoa", "Thiên Khôi", "Thiên Việt", "Ân Quang", "Thiên Quý", "Thiên Mã"];
const TH_SAT = ["Địa Không", "Địa Kiếp", "Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh", "Hóa Kỵ", "Tang Môn", "Bạch Hổ", "Thiên Hình", "Đại Hao"];

export function analyzeYear(chart: Chart, targetYear: number): YearReading {
  const { info, palaces } = chart;
  const tuoiMu = targetYear - info.l_year + 1;
  const vy = getYearCanChi(targetYear);
  const [, vyHanh] = napAm(vy.can, vy.chi);

  const thFound = palaces.find((p) => p.tieu_han_chi === vy.chi);
  const thIdx = thFound ? thFound.chi_idx : info.menh_chi_idx;
  const thPalace = palaces[thIdx];

  const isDongHan = tuoiMu < info.cuc_num;
  let dvIdx: number | null = null;
  if (!isDongHan) {
    const p = palaces.find((p) => p.dai_han <= tuoiMu && tuoiMu < p.dai_han + 10);
    if (p) dvIdx = p.chi_idx;
  }

  const luuStars = getLuuNienStars(targetYear);

  let score = scorePalace(palaces, thIdx);
  if (dvIdx !== null) {
    const dvScore = scorePalace(palaces, dvIdx);
    score = pyRound(score * 0.65 + dvScore * 0.35);
  }

  const relHanh = getSinhKhac(vyHanh, info.ban_menh_hanh);
  if (relHanh === "Sinh" || relHanh === "Bình Hòa") score += 4;
  else if (relHanh === "Khắc") score -= 5;

  const thRel = relatedIndices(thIdx);
  const thHoi = new Set([thIdx, thRel.xung_chieu, thRel.tam_hop[0], thRel.tam_hop[1]]);

  const may: string[] = [];
  const hung: string[] = [];

  const isDvTransition = !isDongHan && palaces.some((p) => p.dai_han === tuoiMu);
  if (isDvTransition) {
    // dvIdx is always set when a transition happens (dai_han == tuoi_mu falls in that range)
    const dv = palaces[dvIdx as number];
    may.push(`Năm bản lề **bước sang Đại Vận mới 10 năm** tại cung ${dv.display_name} (${dv.chi}), mở ra chu kỳ vận hội mới.`);
  }

  if (relHanh === "Sinh")
    may.push(`Thiên thời tương trợ: Ngũ hành năm ${vy.can} ${vy.chi} (${vyHanh}) sinh cho Bản Mệnh (${info.ban_menh_hanh}).`);
  else if (relHanh === "Khắc")
    hung.push(`Ngũ hành năm (${vyHanh}) khắc Bản Mệnh (${info.ban_menh_hanh}), dễ hao tổn sức lực nếu làm việc quá sức.`);

  const goodLuu: string[] = [];
  const badLuu: string[] = [];
  for (const [pos, lname] of luuStars) {
    if (!thHoi.has(pos)) continue;
    if (LUU_GOOD.includes(lname)) {
      goodLuu.push(`${lname} (${palaces[pos].chi})`);
      score += pos === thIdx ? 4 : 2;
    } else if (LUU_BAD.includes(lname)) {
      badLuu.push(`${lname} (${palaces[pos].chi})`);
      score -= pos === thIdx ? 4 : 2;
    }
  }
  if (goodLuu.length)
    may.push(`Các cát tinh lưu niên hội chiếu Tiểu Hạn: ${goodLuu.join(", ")} — mang lại cơ hội tài lộc, tin vui hoặc dịch chuyển thuận lợi.`);
  if (badLuu.length)
    hung.push(`Các sao lưu động gây áp lực tại tam hợp Tiểu Hạn: ${badLuu.join(", ")} — cần chú ý sức khỏe, tinh thần và tránh nóng vội.`);

  let thChinh = thPalace.chinh_tinh;
  if (!thChinh.length) thChinh = palaces[thRel.xung_chieu].chinh_tinh;
  for (const s of thChinh) {
    if (s.brightness === "M" || s.brightness === "V" || s.brightness === "Đ")
      may.push(`Chính tinh **${s.name} (${s.brightness_full})** chiếu sáng cung hạn: ${CHINH_DESC[s.name].cat}`);
    else hung.push(`Chính tinh **${s.name} (${s.brightness_full})** ở vị trí yếu: ${CHINH_DESC[s.name].hung}`);
  }

  for (const s of thPalace.cat_tinh) {
    const n = strip(s.name);
    if (TH_CAT.includes(n) && !s.is_luu) may.push(`**${n}** tọa thủ cung Tiểu Hạn: ${GOOD[n]}.`);
  }
  for (const s of thPalace.sat_tinh) {
    const n = strip(s.name);
    if (TH_SAT.includes(n) && !s.is_luu) hung.push(`**${n}** tại cung Tiểu Hạn: ${BAD[n]}.`);
  }

  if (vy.chiIdx === info.menh_chi_idx) {
    hung.push("Năm **Trực Thái Tuế** (Lưu Thái Tuế trùng cung Mệnh): tâm lý nhiều biến động, trách nhiệm nặng nề.");
    score -= 4;
  } else if (mod(vy.chiIdx - info.menh_chi_idx, 12) === 6) {
    hung.push("Năm **Xung Thái Tuế** (Lưu Thái Tuế xung chiếu Mệnh): dễ có sự thay đổi môi trường, công việc hoặc đi lại nhiều.");
    score -= 5;
  }

  if (thIdx === vy.chiIdx) may.push("Tiểu Hạn trùng Lưu Thái Tuế: năm có tính quyết định cao, làm việc gì cũng rõ ràng trắng đen.");

  score = Math.max(12, Math.min(98, pyRound(score)));
  let verdict: string;
  let tone: Tone;
  if (score >= 75) [verdict, tone] = ["Đại Cát / Bứt Phá", "cat"];
  else if (score >= 60) [verdict, tone] = ["Cát Lành / Thuận Lợi", "good"];
  else if (score >= 45) [verdict, tone] = ["Bình Hòa / Đan Xen", "neutral"];
  else if (score >= 32) [verdict, tone] = ["Thử Thách / Thận Trọng", "warn"];
  else [verdict, tone] = ["Hung Hạn / Cần Phòng Tránh", "hung"];

  const advice: string[] = [];
  if (tone === "cat" || tone === "good")
    advice.push("Tận dụng đà thuận lợi để triển khai kế hoạch lớn, mở rộng hợp tác hoặc học nâng cao.");
  else advice.push("Ưu tiên thế thủ, giữ dòng tiền an toàn, hạn chế đầu tư mạo hiểm và chú trọng kiểm tra sức khỏe định kỳ.");
  if (hung.some((x) => x.includes("Kỵ") || x.includes("Thái Tuế"))) advice.push("Giữ hòa khí trong giao tiếp, kiểm tra kỹ hợp đồng/giấy tờ.");

  return {
    year: targetYear,
    year_cc: `${vy.can} ${vy.chi}`,
    year_hanh: vyHanh,
    tuoi_mu: tuoiMu,
    is_dong_han: isDongHan,
    is_dv_transition: isDvTransition,
    dai_van:
      dvIdx !== null
        ? {
            chi: palaces[dvIdx].chi,
            palace: palaces[dvIdx].display_name,
            tuoi_range: `${palaces[dvIdx].dai_han}–${palaces[dvIdx].dai_han + 9}`,
          }
        : null,
    tieu_han: { chi_idx: thIdx, chi: thPalace.chi, palace: thPalace.display_name },
    luu_thai_tue: { chi_idx: vy.chiIdx, chi: vy.chi, palace: palaces[vy.chiIdx].display_name },
    score,
    verdict,
    tone,
    diem_may: may.length ? may : ["Vận trình tương đối êm ả, giữ nhịp sống ổn định."],
    diem_hung: hung.length ? hung : ["Không có hung tinh lớn kích hoạt trực tiếp trong năm."],
    advice,
  };
}

const LIFETIME_ORDER = [
  "MỆNH", "PHÚC ĐỨC", "QUAN LỘC", "TÀI BẠCH", "PHU THÊ",
  "TỬ TỨC", "ĐIỀN TRẠCH", "TẬT ÁCH", "THIÊN DI", "PHỤ MẪU", "HUYNH ĐỆ", "NÔ BỘC",
];

export function analyzeFullReport(chart: Chart, startYear = 2026, numYears = 15): FullReport {
  const { info, palaces } = chart;
  const cachCuc = detectCachCuc(chart);
  const palaceReadings = Array.from({ length: 12 }, (_, i) => analyzePalace(chart, i)).sort(
    (a, b) => LIFETIME_ORDER.indexOf(palaces[a.chi_idx].name) - LIFETIME_ORDER.indexOf(palaces[b.chi_idx].name),
  );
  const yearlyReadings = Array.from({ length: numYears }, (_, k) => analyzeYear(chart, startYear + k));

  const milestones: Milestone[] = [];
  for (let age = 1; age < 86; age++) {
    const yr = info.l_year + age - 1;
    const y = analyzeYear(chart, yr);
    const reasons: string[] = [];
    let type: Milestone["type"] = "normal";
    if (y.is_dv_transition && y.dai_van) {
      reasons.push(`Bước vào Đại Vận ${y.dai_van.tuoi_range} tuổi tại cung ${y.dai_van.palace} (${y.dai_van.chi})`);
      type = "transition";
    }
    if (y.score >= 76) {
      reasons.push(`Năm Đại Cát (điểm ${y.score}/100) — cơ hội bứt phá mạnh`);
      if (type === "normal") type = "peak";
    } else if (y.score <= 34) {
      reasons.push(`Năm Thử Thách Lớn (điểm ${y.score}/100) — cần phòng tránh rủi ro & giữ sức khỏe`);
      if (type === "normal") type = "caution";
    }
    if (reasons.length) {
      milestones.push({
        year: yr,
        year_cc: y.year_cc,
        tuoi_mu: age,
        type,
        score: y.score,
        verdict: y.verdict,
        summary: reasons.join(" | "),
        diem_may: y.diem_may.slice(0, 2),
        diem_hung: y.diem_hung.slice(0, 2),
      });
    }
  }

  return {
    cach_cuc: cachCuc.map(([name, type, desc]) => ({ name, type, desc })),
    palace_readings: palaceReadings,
    yearly_readings: yearlyReadings,
    milestones,
  };
}

const YEAR_ORDER = [
  "MỆNH", "TÀI BẠCH", "QUAN LỘC", "PHU THÊ", "PHÚC ĐỨC",
  "ĐIỀN TRẠCH", "TẬT ÁCH", "TỬ TỨC", "THIÊN DI", "PHỤ MẪU", "HUYNH ĐỆ", "NÔ BỘC",
];
const HOI_GOOD_KEYS = ["Lộc Tồn", "Thiên Mã", "Đào Hoa", "Hồng Loan", "Thiên Hỷ"];
const HOI_BAD_KEYS = ["Kình Dương", "Đà La", "Tang Môn", "Bạch Hổ", "Thiên Khốc", "Thiên Hư", "Thái Tuế"];

const XUNG_CAT_FIXED = ["Lộc Tồn", "Hóa Lộc", "Hóa Quyền", "Hóa Khoa", "Thiên Khôi", "Thiên Việt", "Tả Phụ", "Hữu Bật", "Thiên Mã", "Ân Quang", "Thiên Quý"];
const XUNG_HUNG_FIXED = ["Địa Không", "Địa Kiếp", "Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh", "Hóa Kỵ", "Thái Tuế", "Tang Môn", "Bạch Hổ", "Thiên Hình"];

export function analyzePalacesForYear(chart: Chart, targetYear: number): YearDetail {
  const { info, palaces } = chart;
  const summary = analyzeYear(chart, targetYear);
  const luuStars = getLuuNienStars(targetYear);

  const thIdx = summary.tieu_han.chi_idx;
  const lttIdx = summary.luu_thai_tue.chi_idx;
  const dvChi = summary.dai_van ? summary.dai_van.chi : null;
  const dvIdx = palaces.find((p) => p.chi === dvChi)?.chi_idx ?? null;

  // Nguyệt hạn (tháng 1..12 ÂL) for the target year
  const thang1Idx = mod(thIdx - (info.l_month - 1) + hourToChiIndex(info.hour_24), 12);

  const out: PalaceYear[] = [];
  for (let i = 0; i < 12; i++) {
    const p = palaces[i];
    const lunarMonth = mod(i - thang1Idx, 12) + 1;
    const baseScore = scorePalace(palaces, i);
    const rel = relatedIndices(i);
    const opp = palaces[rel.xung_chieu];
    const th1 = palaces[rel.tam_hop[0]];
    const th2 = palaces[rel.tam_hop[1]];
    const hoiSet = new Set([rel.xung_chieu, rel.tam_hop[0], rel.tam_hop[1]]);

    const roles: string[] = [];
    if (i === dvIdx) roles.push("Đại Vận 10 năm");
    if (i === thIdx) roles.push("Tiểu Hạn năm");
    if (i === lttIdx) roles.push("Lưu Thái Tuế");

    const luuDirect = luuStars.filter(([pos]) => pos === i).map(([, n]) => n);
    const luuXung = luuStars.filter(([pos]) => pos === rel.xung_chieu).map(([, n]) => n);
    const luuHoi = luuStars.filter(([pos]) => hoiSet.has(pos)).map(([pos, n]) => `${n} (${palaces[pos].chi})`);

    const banChinh = p.chinh_tinh.map((s) => `${s.name} (${s.brightness_full})`);
    const xungChinh = opp.chinh_tinh.map((s) => `${s.name} (${s.brightness_full})`);
    const xungCat = opp.cat_tinh.filter((s) => !s.is_luu && XUNG_CAT_FIXED.includes(s.name)).map((s) => s.name);
    const xungHung = opp.sat_tinh.filter((s) => !s.is_luu && XUNG_HUNG_FIXED.includes(s.name)).map((s) => s.name);

    let delta = 0;
    const cat: string[] = [];
    const hung: string[] = [];

    if (i === thIdx)
      cat.push(`Cung này là **Tiểu Hạn** của năm ${targetYear}: mọi sự kiện trọng tâm trong năm đều xoay quanh phương diện **${p.display_name}**.`);
    if (i === dvIdx && summary.dai_van)
      cat.push(`Đang nằm trong **Đại Vận ${summary.dai_van.tuoi_range} tuổi**, chịu ảnh hưởng nền tảng suốt 10 năm.`);

    if (xungChinh.length) cat.push(`Cung xung chiếu **[${opp.display_name} - ${opp.chi}]** có ${xungChinh.join(", ")} chiếu thẳng về.`);
    if (xungCat.length) {
      delta += Math.min(4, xungCat.length * 2);
      cat.push(`Cát tinh từ cung xung chiếu (${opp.chi}): **${xungCat.join(", ")}** hỗ trợ mạnh trong tháng ${lunarMonth} ÂL.`);
    }
    if (xungHung.length) {
      delta -= Math.min(4, xungHung.length * 2);
      hung.push(`Sát tinh từ cung xung chiếu (${opp.chi}): **${xungHung.join(", ")}** chiếu sang, cần lưu ý va chạm hoặc trở ngại.`);
    }

    for (const lname of luuDirect) {
      const [kind, desc] = LUU_EFFECT[lname] ?? ["cat", ""];
      if (kind === "cat") {
        delta += 6;
        cat.push(`**${lname}** nhập bản cung trong tháng ${lunarMonth} ÂL: ${desc}`);
      } else {
        delta -= 5;
        hung.push(`**${lname}** nhập bản cung trong tháng ${lunarMonth} ÂL: ${desc}`);
      }
    }
    for (const lname of luuXung) {
      const [kind] = LUU_EFFECT[lname] ?? ["cat", ""];
      if (kind === "cat") {
        delta += 3;
        cat.push(`**${lname}** từ cung xung chiếu (${opp.chi}) chiếu thẳng vào bản cung.`);
      } else {
        delta -= 3;
        hung.push(`**${lname}** từ cung xung chiếu (${opp.chi}) xung phá sang bản cung.`);
      }
    }

    const goodHoi = luuHoi.filter((x) => HOI_GOOD_KEYS.some((k) => x.includes(k)));
    const badHoi = luuHoi.filter((x) => HOI_BAD_KEYS.some((k) => x.includes(k)));
    if (goodHoi.length) {
      delta += Math.min(6, goodHoi.length * 2);
      cat.push(`Tam hợp hội chiếu cát tinh lưu niên: ${goodHoi.join(", ")}.`);
    }
    if (badHoi.length) {
      delta -= Math.min(6, badHoi.length * 2);
      hung.push(`Tam hợp hội chiếu sao lưu gây áp lực: ${badHoi.join(", ")}.`);
    }

    const yearScore = Math.max(12, Math.min(98, baseScore + delta));
    let trend: string, trendTone: PalaceYear["trend_tone"], monthAdvice: string;
    const lname = p.display_name.toLowerCase();
    if (delta >= 4) {
      [trend, trendTone] = ["Khởi sắc (+)", "cat"];
      monthAdvice = `Tháng ${lunarMonth} ÂL thuận lợi cho phương diện ${lname}; nên chủ động triển khai việc quan trọng.`;
    } else if (delta <= -4) {
      [trend, trendTone] = ["Áp lực (-)", "warn"];
      monthAdvice = `Tháng ${lunarMonth} ÂL dễ phát sinh áp lực ở cung ${p.display_name}; ưu tiên giữ ổn định, tránh nóng vội hay tranh cãi.`;
    } else {
      [trend, trendTone] = ["Ổn định", "neutral"];
      monthAdvice = `Tháng ${lunarMonth} ÂL diễn biến hài hòa, giữ nhịp độ bình thường ở phương diện ${lname}.`;
    }

    out.push({
      chi_idx: i,
      chi: p.chi,
      lunar_month: lunarMonth,
      palace_name: p.display_name,
      base_name: p.name,
      domain: DOMAIN[p.name] ?? "",
      ban_chinh: banChinh.length ? banChinh : ["Vô Chính Diệu"],
      xung_palace: `${opp.display_name} (${opp.chi})`,
      xung_chinh: xungChinh.length ? xungChinh : ["Vô Chính Diệu"],
      tam_hop: [`${th1.display_name} (${th1.chi})`, `${th2.display_name} (${th2.chi})`],
      roles,
      base_score: baseScore,
      year_score: yearScore,
      delta,
      trend,
      trend_tone: trendTone,
      luu_direct: luuDirect,
      luu_xung: luuXung,
      cat_notes: cat.length ? cat : ["Không có biến động xấu; giữ trạng thái ổn định theo lá số gốc."],
      hung_notes: hung.length ? hung : ["Không có hung tinh lưu niên xung phá trực tiếp tại cung này."],
      month_advice: monthAdvice,
    });
  }
  out.sort((a, b) => YEAR_ORDER.indexOf(a.base_name) - YEAR_ORDER.indexOf(b.base_name));
  return { year_summary: summary, palaces_year: out };
}
