/**
 * Export Thái Ất divination & Nhân Mệnh reports to Word (.docx), in the browser.
 * Port of tuvi-app/thai_at_exporter.py.
 */
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import type { DivinationAnalysis, NhanMenhAnalysis } from "./analyzer";
import type { DivinationChart, NhanMenhChart } from "./engine";

const pad2 = (n: number) => String(n).padStart(2, "0");
const clean = (t: string) => t.replaceAll("**", "");
const p = (text: string) => new Paragraph({ children: [new TextRun(clean(text))] });
const h1 = (text: string) => new Paragraph({ heading: HeadingLevel.HEADING_1, text });

export async function exportThaiAtDocx(
  chart: DivinationChart | NhanMenhChart,
  analysis: DivinationAnalysis | NhanMenhAnalysis,
): Promise<Blob> {
  const body: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [
        new TextRun({
          text: chart.mode === "divination" ? "BÁO CÁO QUẺ THÁI ẤT THẦN KINH" : "BÁO CÁO THÁI ẤT NHÂN MỆNH",
          color: "782814",
        }),
      ],
    }),
  ];
  const s = chart.solar;
  const l = chart.lunar;

  if (chart.mode === "divination") {
    const a = analysis as DivinationAnalysis;
    const b = chart.board;
    const cc = chart.can_chi;
    body.push(p(`Chủ đề: ${a.topic_label}`));
    if (chart.question) body.push(p(`Câu hỏi: ${chart.question}`));
    body.push(
      p(
        `Thời điểm gieo quẻ: ${s.hour_24}h ngày ${pad2(s.day)}/${pad2(s.month)}/${s.year} (DL) — ${pad2(l.day)}/${pad2(l.month)}/${l.year} (ÂL)`,
      ),
      p(`Tứ trụ Can Chi: Năm ${cc.year} • Tháng ${cc.month} • Ngày ${cc.day} • Giờ ${cc.hour}`),
      p(`Độn & Cục: ${b.don_type} • Nguyên ${b.nguyen} • Cục ${b.cuc} (Kỷ dư: ${b.ky_du})`),
      h1("1. Tổng quan Thế Chủ – Khách & Số Toán"),
      p(`Toán Chủ: ${b.chu.toan} (${a.chu_eval.level}) — ${a.chu_eval.desc}`),
      p(`Toán Khách: ${b.khach.toan} (${a.khach_eval.level}) — ${a.khach_eval.desc}`),
      p(`Nhận định thế đứng: ${a.stance_verdict}`),
      p(`Phương hướng: ${a.direction_advice}`),
      h1("2. Cách Cục Thái Ất"),
      ...a.patterns.map((x) => p(`• ${x.name}: ${x.detail}`)),
      h1("3. Khuyến nghị hành động"),
      p(a.topic_advice),
    );
    if (a.querent_note) body.push(p(a.querent_note));
    if (a.extra_context_note) body.push(p(a.extra_context_note));
    body.push(h1("4. Tổng Giải (Diễn giải & Hướng giải quyết)"), p(a.summary_narrative.narrative), ...a.summary_narrative.resolution.map(p));
  } else {
    const a = analysis as NhanMenhAnalysis;
    const mo = a.menh_overview;
    const ts = chart.toan_so;
    const va = a.view_year_analysis;
    body.push(
      p(`Đương số: ${chart.name} (${chart.gender} — ${chart.am_duong_menh})`),
      p(`Ngày sinh: ${pad2(s.day)}/${pad2(s.month)}/${s.year} (DL) — ${pad2(l.day)}/${pad2(l.month)}/${l.year} (ÂL), ${s.hour_24}h`),
      h1("1. Tổng quan Cung Mệnh & Toán Số"),
      p(`Cung Mệnh: ${mo.menh_cung} (Hành ${mo.menh_hanh}, Khí ${mo.menh_khi})`),
      p(`Nạp Âm năm sinh: ${mo.nap_am} — ${mo.relation}`),
      p(`Toán số Tứ trụ: Năm ${ts.year.total} + Tháng ${ts.month.total} + Ngày ${ts.day.total} + Giờ ${ts.hour.total} = Tổng ${ts.total}`),
      p(`12 cung Nhân Mệnh (${mo.chieu_an_cung}): ${Object.entries(chart.cung_12).map(([k, v]) => `${k} ${v}`).join(" • ")}`),
      h1(`2. Vận hạn năm ${chart.view_year} (${chart.view_year_can_chi})`),
      p(`Tuế Kế Cục ${va.cuc} — ${va.hit_note}`),
      p(va.balance.summary),
      ...va.patterns.map((x) => p(`• ${x.name}: ${x.detail}`)),
      h1("3. Tổng Giải (Diễn giải & Hướng giải quyết)"),
      p(a.summary_narrative.narrative),
      ...a.summary_narrative.resolution.map(p),
    );
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    sections: [{ children: body }],
  });
  return Packer.toBlob(doc);
}
