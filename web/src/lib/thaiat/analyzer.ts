/**
 * Thái Ất Thần Kinh interpretation & interactive consultation.
 * Faithful port of tuvi-app/thai_at_analyzer.py — output shape is identical.
 */
import { TA_TOPIC_LABELS } from "../tuvi/data";
import {
  PALACE_DIRECTION,
  PALACE_HANH,
  PALACE_KHI,
  PALACES_16,
  type DivinationChart,
  type NhanMenhChart,
  type TaBoard,
} from "./engine";

const TOPIC_LABELS = TA_TOPIC_LABELS as Record<string, string>;
export const TOPICS = Object.entries(TOPIC_LABELS).map(([value, label]) => ({ value, label }));

const RAT_HOA = [14, 18];
const KHA_HOA = [23, 29, 32, 36];
const HOI_HOA = [12, 16, 21, 27, 34, 38];
const DUONG_TRUNG_TAP = [13, 19, 31, 37];
const AM_TRUNG_TAP = [24, 28];
const DUONG_TRUNG_AM = [11, 17];
const THUAN_DUONG = [33, 39];
const THUAN_AM = [22, 26];

const HANH_SINH: Record<string, string> = { Mộc: "Hỏa", Hỏa: "Thổ", Thổ: "Kim", Kim: "Thủy", Thủy: "Mộc" };
const HANH_KHAC: Record<string, string> = { Mộc: "Thổ", Thổ: "Thủy", Thủy: "Hỏa", Hỏa: "Kim", Kim: "Mộc" };

export type Stance = "auto" | "chu" | "khach";
export type Urgency = "binh_thuong" | "gap" | "dai_han";
export type Severity = "hung" | "canh_bao" | "cat";

export interface ToanEval {
  label: string;
  toan: number;
  level: string;
  score: number;
  desc: string;
  ba_tai_issues: string[];
}

export interface Pattern {
  name: string;
  severity: Severity;
  detail: string;
}

export interface Balance {
  favored: "chu" | "khach" | "can_bang";
  summary: string;
  chu_score: number;
  khach_score: number;
}

export interface Narrative {
  narrative: string;
  resolution: string[];
}

export interface FollowupPrompt {
  id: "stance" | "urgency";
  question: string;
  options: { value: string; label: string }[];
}

export interface DivinationAnalysis {
  topic_label: string;
  chu_eval: ToanEval;
  khach_eval: ToanEval;
  balance: Balance;
  patterns: Pattern[];
  stance: Stance;
  stance_verdict: string;
  direction_advice: string;
  topic_advice: string;
  querent_note: string;
  extra_context_note: string;
  followup_prompts: FollowupPrompt[];
  summary_narrative: Narrative;
}

export function evaluateToan(v: number, label = "Chủ"): ToanEval {
  const issues: string[] = [];
  let level: string, score: number, desc: string;
  if (RAT_HOA.includes(v))
    [level, score, desc] = ["Rất hòa (Thượng hòa)", 3, "Trời đất khánh hội, âm dương giao thông, mưu sự dễ thành, gặp quý nhân trợ lực."];
  else if (KHA_HOA.includes(v))
    [level, score, desc] = ["Khá hòa (Trung hòa)", 2, "Phúc lộc bền vững, ít tai nạn, tiến triển ổn định và thuận lợi."];
  else if (HOI_HOA.includes(v))
    [level, score, desc] = ["Hơi hòa (Hạ hòa)", 1, "Tài lợi đầy đủ, trở ngại nhỏ có thể hóa giải, nên tiến từng bước."];
  else if (DUONG_TRUNG_TAP.includes(v))
    [level, score, desc] = ["Dương trùng tạp", -1, "Khí dương pha tạp, dễ gặp việc dở dang hoặc chậm trễ, cần giữ sự điềm tĩnh."];
  else if (AM_TRUNG_TAP.includes(v))
    [level, score, desc] = ["Âm trùng tạp", -1, "Khí âm pha tạp, dễ hao tổn hoặc việc khó thành ngay, tránh đầu tư mạo hiểm."];
  else if (DUONG_TRUNG_AM.includes(v))
    [level, score, desc] = ["Dương trùng trong âm", -2, "Âm dương lẫn lộn, dễ gặp cản trở hoặc áp lực tinh thần, cần minh bạch."];
  else if (THUAN_DUONG.includes(v))
    [level, score, desc] = ["Thuần dương (Cương quá)", -1, "Thế quá cứng, dễ gãy nếu thiếu mềm dẻo; cẩn trọng tranh chấp trực diện."];
  else if (THUAN_AM.includes(v))
    [level, score, desc] = ["Thuần âm (Nhu quá)", -1, "Thế nhu nhược, thiếu quyết đoán hoặc dễ bị động trước ngoại cảnh."];
  else if (v >= 10)
    [level, score, desc] = ["Toán dài bình hòa", 1, "Toán số đủ dài, lực lượng có hậu thuẫn, tùy cách cục mà hành động."];
  else [level, score, desc] = ["Toán ngắn (Đơn)", -1, "Toán số ngắn, lực mỏng, nên thủ thế và tích lũy thêm trước khi mở rộng."];

  if (v >= 1 && v <= 9) issues.push("Không số Trời (1–9): Thiếu thiên thời/hỗ trợ bề trên, cần tự lực và giữ chính đạo.");
  if ([1, 2, 3, 4].includes(v % 10)) issues.push("Không số Đất (hàng đơn vị 1–4): Nền tảng vật chất/hậu phương chưa vững, tránh dàn trải.");
  if (v % 10 === 0) issues.push("Không số Người (hàng đơn vị 0): Thiếu nhân hòa hoặc người đồng hành, đề phòng hiểu lầm.");

  return { label, toan: v, level, score, desc, ba_tai_issues: issues };
}

export function evaluatePatterns(board: TaBoard): Pattern[] {
  const patterns: Pattern[] = [];
  const at = board.thai_at_cung;
  const vx = board.van_xuong_cung;
  const tk = board.thuy_kich_cung;
  const chuDai = board.chu.dai_tuong_cung;
  const khachDai = board.khach.dai_tuong_cung;
  const iAt = PALACES_16.indexOf(at);
  const iVx = PALACES_16.indexOf(vx);
  const iTk = PALACES_16.indexOf(tk);

  if (tk === at)
    patterns.push({
      name: "Ếm (Yểm)",
      severity: "hung",
      detail: `Thủy Kích đồng cung với Thái Ất tại ${at}: có sự che khuất, trở ngại ngầm hoặc việc khó minh bạch ngay; nên làm phúc đức, kiểm tra kỹ giấy tờ/đối tác.`,
    });

  const dTk = (((iTk - iAt) % 16) + 16) % 16;
  if ([1, 2, 14, 15].includes(dTk)) {
    const kind = dTk === 1 || dTk === 2 ? "Ngoài kích" : "Trong kích";
    patterns.push({
      name: `Thủy Kích (${kind})`,
      severity: "canh_bao",
      detail: `Thủy Kích tại ${tk} áp sát Thái Ất tại ${at}: dễ phát sinh biến động bất ngờ, khẩu thiệt hoặc cạnh tranh gay gắt.`,
    });
  } else if (dTk === 8) {
    patterns.push({
      name: "Cung Kích (Đối xung)",
      severity: "hung",
      detail: `Thủy Kích tại ${tk} đối xung trực diện Thái Ất tại ${at}: thế đối đầu rõ rệt, tránh nóng vội đối kháng trực tiếp.`,
    });
  }

  const dVx = (((iVx - iAt) % 16) + 16) % 16;
  if (vx === at)
    patterns.push({
      name: "Văn Xương đồng cung Thái Ất",
      severity: "cat",
      detail: `Thiên Mục Văn Xương hội cùng Thái Ất tại ${at}: Chủ Mục đắc vị, trí tuệ sáng suốt, thuận lợi cho mưu lược, học hành, văn thư.`,
    });
  else if (dVx === 1 || dVx === 15)
    patterns.push({
      name: "Ép (Bức)",
      severity: "canh_bao",
      detail: `Văn Xương tại ${vx} ép sát Thái Ất tại ${at}: áp lực từ bề trên, quy định hoặc thời hạn gấp; cần mềm mỏng xử lý.`,
    });

  if (chuDai === "Trung" || chuDai === at)
    patterns.push({
      name: "Chủ Đại Tướng Giam / Đóng",
      severity: "canh_bao",
      detail: `Chủ Đại Tướng ở ${chuDai}: phe Chủ bị kìm hãm, chưa phát huy được lực lượng; nên giữ vững vị trí, chờ thời cơ.`,
    });
  if (khachDai === "Trung" || khachDai === at)
    patterns.push({
      name: "Khách Đại Tướng Giam / Đóng",
      severity: "canh_bao",
      detail: `Khách Đại Tướng ở ${khachDai}: phe Khách khó tiến nhanh, nếu chủ động tấn công lúc này dễ gặp cản trở.`,
    });

  if (board.ngu_phuc_cung === at || board.ngu_phuc_cung === chuDai)
    patterns.push({
      name: "Ngũ Phúc lâm vị",
      severity: "cat",
      detail: `Sao Ngũ Phúc tại ${board.ngu_phuc_cung} hộ trợ cho Thái Ất / Chủ Tướng: có quý nhân phù trợ, chuyển hung thành cát.`,
    });

  if (!patterns.length)
    patterns.push({
      name: "Bình Hòa Vô Phá",
      severity: "cat",
      detail: "Các sao chính không phạm Ếm, Kích, Giam nặng; thế cục cân bằng, thuận theo Toán Chủ/Khách mà hành động.",
    });
  return patterns;
}

function compareChuKhach(chu: ToanEval, khach: ToanEval): Balance {
  const c = chu.score + (chu.toan >= 10 ? 1 : 0);
  const k = khach.score + (khach.toan >= 10 ? 1 : 0);
  if (k > c)
    return {
      favored: "khach",
      summary:
        "Thế quẻ **lợi về Khách** (Toán Khách vượng hơn Toán Chủ): thuận lợi cho việc chủ động khởi xướng, xuất phát, đề xuất trước, thay đổi hoặc mở rộng.",
      chu_score: c,
      khach_score: k,
    };
  if (c > k)
    return {
      favored: "chu",
      summary:
        "Thế quẻ **lợi về Chủ** (Toán Chủ vượng hơn Toán Khách): thuận lợi cho việc giữ vững vị trí hiện tại, củng cố nội bộ, chờ đối phương động trước rồi ứng biến.",
      chu_score: c,
      khach_score: k,
    };
  return {
    favored: "can_bang",
    summary: "Thế **Chủ – Khách cân bằng**: hai bên ngang sức, nên lấy hòa làm trọng, đàm phán win-win thay vì đối đầu.",
    chu_score: c,
    khach_score: k,
  };
}

export const FOLLOWUP_PROMPTS: FollowupPrompt[] = [
  {
    id: "stance",
    question: "Trong việc này, vị thế thực tế của bạn là gì?",
    options: [
      { value: "chu", label: "Thế Chủ (giữ vị trí hiện tại, bảo vệ, chờ đợi)" },
      { value: "khach", label: "Thế Khách (chủ động đi xin, mở mới, thay đổi, tiến công)" },
    ],
  },
  {
    id: "urgency",
    question: "Mức độ gấp gáp của quyết định này?",
    options: [
      { value: "gap", label: "Cần quyết định gấp (trong vài ngày tới)" },
      { value: "dai_han", label: "Kế hoạch trung / dài hạn (vài tháng tới)" },
    ],
  },
];

export function analyzeDivination(
  chart: DivinationChart,
  stance: Stance = "auto",
  urgency: Urgency = "binh_thuong",
  extraContext = "",
): DivinationAnalysis {
  const board = chart.board;
  const chuEval = evaluateToan(board.chu.toan, "Chủ");
  const khachEval = evaluateToan(board.khach.toan, "Khách");
  const patterns = evaluatePatterns(board);
  const balance = compareChuKhach(chuEval, khachEval);
  const fav = balance.favored;

  let stanceVerdict: string;
  if (stance === "chu") {
    if (fav === "chu") stanceVerdict = "CÁT — Bạn đang ở thế Chủ và quẻ cũng lợi Chủ: hãy tự tin giữ vững lập trường, bảo toàn thành quả.";
    else if (fav === "khach")
      stanceVerdict =
        "THẬN TRỌNG — Bạn đang ở thế Chủ nhưng quẻ lại lợi Khách: đối phương hoặc hoàn cảnh bên ngoài đang mạnh, cần phòng thủ chắc và tránh sơ hở.";
    else stanceVerdict = "BÌNH HÒA — Thế cân bằng, giữ ổn định và lắng nghe thêm thông tin trước khi quyết định lớn.";
  } else if (stance === "khach") {
    if (fav === "khach") stanceVerdict = "CÁT — Bạn đang ở thế Khách và quẻ lợi Khách: rất thuận để chủ động tiến tới, đề xuất, ký kết hoặc khởi sự.";
    else if (fav === "chu")
      stanceVerdict =
        "CHƯA NÊN VỘI — Bạn đang muốn chủ động (Khách) nhưng quẻ lại lợi Chủ: nếu cưỡng cầu dễ gặp lực cản, nên chuẩn bị kỹ hơn hoặc lùi lại 1 nhịp.";
    else stanceVerdict = "BÌNH HÒA — Tiến hành từng bước thăm dò, dùng sự mềm mỏng để thuyết phục.";
  } else stanceVerdict = balance.summary;

  const at = board.thai_at_cung;
  const atDir = PALACE_DIRECTION[at];
  const atHanh = PALACE_HANH[at];
  const npDir = PALACE_DIRECTION[board.ngu_phuc_cung];

  const topic = chart.topic || "chung";
  const topicLabel = TOPIC_LABELS[topic] ?? TOPIC_LABELS.chung;
  const topicAdvice = buildTopicAdvice(topic, fav, patterns, urgency);

  let querentNote = "";
  if (chart.querent) {
    const q = chart.querent;
    const qh = q.nap_am_hanh;
    if (qh === atHanh)
      querentNote = `Mệnh Nạp Âm của bạn (${q.nap_am} - ${qh}) **đồng hành** với cung Thái Ất (${at} - ${atHanh}): khí lực tương trợ tốt.`;
    else if (HANH_SINH[atHanh] === qh) querentNote = `Cung Thái Ất (${atHanh}) **tương sinh** cho Mệnh của bạn (${qh}): được thời vận nâng đỡ.`;
    else if (HANH_SINH[qh] === atHanh)
      querentNote = `Mệnh của bạn (${qh}) **sinh xuất** cho cung Thái Ất (${atHanh}): cần bỏ công sức nhiều mới thu kết quả.`;
    else if (HANH_KHAC[atHanh] === qh) querentNote = `Cung Thái Ất (${atHanh}) **khắc** Mệnh (${qh}): có áp lực ngoại cảnh, cần kiên nhẫn hóa giải.`;
    else querentNote = `Mệnh của bạn (${qh}) **chế ngự** được cung Thái Ất (${atHanh}): có thể chủ động kiểm soát tình huống.`;
  }

  return {
    topic_label: topicLabel,
    chu_eval: chuEval,
    khach_eval: khachEval,
    balance,
    patterns,
    stance,
    stance_verdict: stanceVerdict,
    direction_advice: `Thái Ất tại ${at} (${atDir}, hành ${atHanh}). Hướng Ngũ Phúc trợ lực: **${npDir}** (${board.ngu_phuc_cung}).`,
    topic_advice: topicAdvice,
    querent_note: querentNote,
    extra_context_note: extraContext ? `Ghi chú ngữ cảnh đã xét: ${extraContext}` : "",
    followup_prompts: FOLLOWUP_PROMPTS,
    summary_narrative: buildDivinationNarrative(chart, chuEval, khachEval, balance, patterns, stance, stanceVerdict, topicAdvice, atDir, npDir, querentNote, urgency),
  };
}

function buildDivinationNarrative(
  chart: DivinationChart,
  chu: ToanEval,
  khach: ToanEval,
  balance: Balance,
  patterns: Pattern[],
  stance: Stance,
  stanceVerdict: string,
  topicAdvice: string,
  atDir: string,
  npDir: string,
  querentNote: string,
  urgency: Urgency,
): Narrative {
  const b = chart.board;
  const qText = chart.question ? `"${chart.question}"` : "vấn đề bạn đang quan tâm";
  const fav = balance.favored;
  const hung = patterns.filter((p) => p.severity === "hung").map((p) => p.name);
  const warn = patterns.filter((p) => p.severity === "canh_bao").map((p) => p.name);
  const cat = patterns.filter((p) => p.severity === "cat").map((p) => p.name);

  const parts = [
    `Với câu hỏi ${qText}, quẻ lập vào ${b.don_type} Cục ${b.cuc} (Nguyên ${b.nguyen}), ` +
      `sao Thái Ất (chủ tể thời vận) đang ngự tại cung ${b.thai_at_cung} (${atDir}).`,
    `Xét tương quan lực lượng: phe Chủ (đại diện cho phía giữ vị trí hiện tại, phòng thủ, nội bộ) có Toán ${chu.toan} — ${chu.level.toLowerCase()}; ` +
      `trong khi phe Khách (đại diện cho phía chủ động khởi xướng, đi xin, thay đổi từ bên ngoài) có Toán ${khach.toan} — ${khach.level.toLowerCase()}.`,
  ];
  if (fav === "khach")
    parts.push("Tổng thể khí số đang nghiêng về phe Khách: tức là người chủ động đề xuất, mở lối đi mới hoặc nắm tiên cơ sẽ có lợi thế hơn.");
  else if (fav === "chu")
    parts.push("Tổng thể khí số đang nghiêng về phe Chủ: tức là giữ nguyên vị thế, củng cố nền tảng hiện có và chờ đối phương lên tiếng trước sẽ có lợi hơn.");
  else parts.push("Thế Chủ và Khách đang ngang bằng nhau, chưa có bên nào áp đảo hoàn toàn.");

  if (hung.length || warn.length)
    parts.push(
      `Tuy nhiên, trên bàn quẻ xuất hiện cách cục cần lưu ý (${[...hung, ...warn].join(", ")}), báo hiệu có lực cản ngầm, áp lực thời gian hoặc sự thiếu minh bạch cần kiểm tra kỹ.`,
    );
  else if (cat.length)
    parts.push(`Điểm sáng của quẻ là có cách cục tốt (${cat.join(", ")}), giúp giảm bớt trở ngại và có quý nhân hoặc cơ hội hỗ trợ.`);
  if (querentNote) parts.push(querentNote.replaceAll("**", ""));

  const steps: string[] = [];
  if (stance === "chu") {
    steps.push(
      fav === "chu"
        ? "1. Giữ vững thế Chủ: Không cần vội nhượng bộ hay thay đổi kế hoạch gốc; hãy để đối tác/hoàn cảnh tự bộc lộ trước rồi mới phản hồi."
        : "1. Củng cố phòng thủ: Bạn đang ở thế Chủ nhưng khí số lại lợi cho bên ngoài (Khách), vì vậy cần rà soát kỹ điều khoản, tránh để lộ điểm yếu hoặc bị cuốn theo nhịp gấp của đối phương.",
    );
  } else if (stance === "khach") {
    steps.push(
      fav === "khach"
        ? "1. Chủ động tiến bước: Thời cơ đang ủng hộ người khởi xướng (thế Khách), bạn nên mạnh dạn đề xuất, liên hệ trước hoặc triển khai kế hoạch đã chuẩn bị."
        : "1. Tiến chậm, thăm dò trước: Bạn muốn chủ động nhưng thế quẻ đang lợi Chủ (bên giữ thế), nếu ép tiến nhanh dễ bị từ chối; hãy dùng cách tiếp cận mềm mỏng hoặc chuẩn bị thêm dữ liệu thuyết phục.",
    );
  } else steps.push(`1. Định vị thế đứng: ${stanceVerdict.replaceAll("**", "")}`);

  steps.push(`2. Hành động theo chủ đề: ${topicAdvice}`);
  if (hung.length || warn.length || chu.ba_tai_issues.length || khach.ba_tai_issues.length)
    steps.push(
      "3. Hóa giải & phòng tránh rủi ro: Kiểm tra kỹ giấy tờ, con số và cam kết bằng văn bản; tránh quyết định nóng vội khi thiếu thông tin" +
        (urgency === "gap" ? " (đặc biệt trong 24–48 giờ tới do việc đang gấp)." : "."),
    );
  else steps.push("3. Tận dụng thời cơ: Có thể triển khai theo lộ trình, giữ thái độ hòa nhã và minh bạch để thu hút sự đồng thuận.");
  steps.push(
    `4. Phương hướng & trợ lực: Ưu tiên giao dịch, xuất hành hoặc bố trí hướng ngồi về phía ${npDir} (cung Ngũ Phúc tại ${b.ngu_phuc_cung}) để tăng cát khí.`,
  );

  return { narrative: parts.join(" "), resolution: steps };
}

function buildTopicAdvice(topic: string, favored: Balance["favored"], patterns: Pattern[], urgency: Urgency): string {
  const hasHung = patterns.some((p) => p.severity === "hung");
  const k = favored === "khach";
  let base: string;
  if (topic === "cong_danh")
    base =
      "Công danh / Sự nghiệp: " +
      (k ? "Thích hợp đề xuất ý tưởng mới, ứng tuyển hoặc mở rộng vai trò." : "Nên củng cố chuyên môn, giữ ổn định vị trí và hoàn thiện hồ sơ trước khi bước tiếp.");
  else if (topic === "tai_loc")
    base =
      "Tài lộc / Kinh doanh: " +
      (k
        ? "Có thể chủ động tiếp cận khách hàng/đối tác mới, nhưng kiểm tra kỹ điều khoản."
        : "Ưu tiên thu hồi công nợ, giữ dòng tiền an toàn, hạn chế rót vốn mới ồ ạt.");
  else if (topic === "tinh_cam")
    base =
      "Hôn nhân / Gia đạo: " +
      (k ? "Chủ động mở lời, hàn gắn hoặc bày tỏ thiện chí sẽ dễ được đón nhận." : "Lấy sự lắng nghe và nhẫn nhịn làm gốc, tránh tranh cãi hơn thua.");
  else if (topic === "suc_khoe")
    base = "Sức khỏe / Bình an: Chú ý nghỉ ngơi điều độ, kiểm tra sức khỏe định kỳ; nếu đang điều trị thì nên theo phác đồ ổn định.";
  else if (topic === "xuat_hanh")
    base =
      "Xuất hành / Mưu sự: " +
      (!hasHung
        ? "Xuất hành thuận lợi, nên đi theo hướng Ngũ Phúc hoặc tránh hướng Thủy Kích."
        : "Nếu không quá gấp thì nên dời lịch hoặc chuẩn bị phương án dự phòng kỹ lưỡng.");
  else
    base =
      "Tổng quát: " +
      (!hasHung ? "Thời cơ đang mở, nên hành động có kế hoạch." : "Quẻ có cách cục cảnh báo, nên thận trọng, làm việc thiện và kiểm soát rủi ro.");
  if (urgency === "gap" && hasHung)
    base += " (Vì việc gấp mà quẻ có dấu hiệu xung/yểm, tuyệt đối tránh quyết định cảm tính trong 24–48 giờ tới.)";
  return base;
}

export interface NhanMenhAnalysis {
  menh_overview: {
    menh_cung: string;
    menh_hanh: string;
    menh_khi: string;
    nap_am: string;
    relation: string;
    am_duong_menh: string;
    chieu_an_cung: string;
  };
  nhat_ke_menh: { chu_eval: ToanEval; khach_eval: ToanEval; patterns: Pattern[] };
  view_year_analysis: {
    year: number;
    can_chi: string;
    cuc: number;
    chu_eval: ToanEval;
    khach_eval: ToanEval;
    balance: Balance;
    patterns: Pattern[];
    hit_note: string;
  };
  summary_narrative: Narrative;
}

export function analyzeNhanMenh(chart: NhanMenhChart): NhanMenhAnalysis {
  const board = chart.board;
  const vb = chart.view_board;
  const menhCung = chart.menh_cung;
  const menhHanh = PALACE_HANH[menhCung];
  const menhKhi = PALACE_KHI[menhCung];
  const namHanh = chart.toan_so.year.nap_am_hanh;
  const namNapAm = chart.toan_so.year.nap_am;

  let rel: string;
  if (menhHanh === namHanh) rel = "Bình hòa (Đồng hành)";
  else if (HANH_SINH[menhHanh] === namHanh) rel = "Cung Mệnh sinh Nạp Âm (Bổn mệnh được bồi dưỡng)";
  else if (HANH_SINH[namHanh] === menhHanh) rel = "Nạp Âm sinh Cung Mệnh (Khí lực dồi dào)";
  else if (HANH_KHAC[menhHanh] === namHanh) rel = "Cung Mệnh khắc Nạp Âm (Tự lực vươn lên, cần kiên trì)";
  else rel = "Nạp Âm khắc Cung Mệnh (Cuộc đời nhiều thử thách rèn giũa)";

  const chuEval = evaluateToan(board.chu.toan, "Chủ (Bổn mệnh)");
  const khachEval = evaluateToan(board.khach.toan, "Khách (Ngoại cảnh)");
  const nhatPatterns = evaluatePatterns(board);

  const vy = chart.view_year;
  const viewChu = evaluateToan(vb.chu.toan, `Chủ năm ${vy}`);
  const viewKhach = evaluateToan(vb.khach.toan, `Khách năm ${vy}`);
  const viewPatterns = evaluatePatterns(vb);
  const viewBalance = compareChuKhach(viewChu, viewKhach);

  const atView = vb.thai_at_cung;
  const hit = Object.entries(chart.cung_12)
    .filter(([, chi]) => chi === atView)
    .map(([p]) => p);
  const hitNote = hit.length
    ? `Thái Ất năm ${vy} đóng tại **${atView}**, trùng với cung **${hit.join(", ")}** trong 12 cung Nhân Mệnh — đây là phương diện trọng tâm biến chuyển mạnh nhất trong năm.`
    : `Thái Ất năm ${vy} đóng tại **${atView}** (Chính cung ${PALACE_DIRECTION[atView]}), tác động gián tiếp lên toàn cục.`;

  return {
    menh_overview: {
      menh_cung: menhCung,
      menh_hanh: menhHanh,
      menh_khi: menhKhi,
      nap_am: `${namNapAm} (${namHanh})`,
      relation: rel,
      am_duong_menh: chart.am_duong_menh,
      chieu_an_cung: chart.is_thuan ? "Đi Thuận" : "Đi Nghịch",
    },
    nhat_ke_menh: { chu_eval: chuEval, khach_eval: khachEval, patterns: nhatPatterns },
    view_year_analysis: {
      year: vy,
      can_chi: chart.view_year_can_chi,
      cuc: vb.cuc,
      chu_eval: viewChu,
      khach_eval: viewKhach,
      balance: viewBalance,
      patterns: viewPatterns,
      hit_note: hitNote,
    },
    summary_narrative: {
      narrative:
        `Đương số ${chart.name ?? ""} (${chart.am_duong_menh}, an 12 cung theo chiều ${chart.is_thuan ? "Thuận" : "Nghịch"}) ` +
        `có Cung Mệnh đóng tại ${menhCung} (hành ${menhHanh}, khí ${menhKhi}), Nạp Âm năm sinh là ${namNapAm} (${namHanh}) — ${rel.toLowerCase()}. ` +
        `Bước sang năm ${vy} (${chart.view_year_can_chi}), Tuế Kế vào Cục ${vb.cuc}, ` +
        `sao Thái Ất ngự tại ${atView}` +
        (hit.length
          ? ` chiếu thẳng vào cung ${hit.join(", ")} trong 12 cung Nhân Mệnh, báo hiệu lĩnh vực này sẽ có chuyển biến rõ rệt nhất.`
          : ", tác động gián tiếp lên toàn cục.") +
        ` ${viewBalance.summary.replaceAll("**", "")}`,
      resolution: [
        `1. Nương theo bản mệnh: Cung Mệnh ở đất ${menhKhi} (hành ${menhHanh}), nên phát huy thế mạnh tự nhiên của hành ${menhHanh} và cân bằng cảm xúc khi gặp áp lực.`,
        `2. Trọng tâm năm ${vy}: ` +
          (hit.length
            ? `Chú ý đặc biệt tới phương diện ${hit.join(", ")} vì có Thái Ất lưu niên đóng tại đó.`
            : "Giữ nhịp độ ổn định ở các cung trọng yếu, tránh thay đổi đột ngột khi chưa đủ nguồn lực."),
        "3. Chiến lược hành động trong năm: " +
          (viewBalance.favored === "khach"
            ? "Có thể chủ động mở rộng, khởi sự hoặc tìm kiếm cơ hội mới (quẻ năm lợi Khách)."
            : "Ưu tiên củng cố nền tảng, giữ tài chính và vị thế hiện tại (quẻ năm lợi Chủ hoặc cân bằng)."),
        `4. Phương hướng cát lợi: Hướng Ngũ Phúc năm ${vy} tại ${vb.ngu_phuc_cung} (${PALACE_DIRECTION[vb.ngu_phuc_cung]}) giúp tăng cường quý nhân và bình an.`,
      ],
    },
  };
}
