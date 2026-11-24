/**
 * Export the chart & full report to a Word (.docx) file, in the browser.
 * Port of tuvi-app/docx_exporter.py using the `docx` npm package.
 */
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { FullReport } from "./analyzer";
import type { Chart, Palace } from "./engine";

const clean = (t: string) => t.replaceAll("**", "");

const GRID: Record<string, number> = {
  "0,0": 5, "0,1": 6, "0,2": 7, "0,3": 8,
  "1,0": 4, "1,3": 9,
  "2,0": 3, "2,3": 10,
  "3,0": 2, "3,1": 1, "3,2": 0, "3,3": 11,
};

const lines = (rows: string[], size: number) =>
  rows.map((r, i) => new Paragraph({ children: [new TextRun({ text: r, size, bold: i === 0 })] }));

function palaceCell(p: Palace) {
  const chinh = p.chinh_tinh.map((s) => `${s.name} (${s.brightness})`).join(", ") || "Vô Chính Diệu";
  const tt = [p.tuan && "Tuần", p.triet && "Triệt"].filter(Boolean).join("/");
  const rows = [
    `${p.can_short} ${p.chi} | ${p.display_name}${p.is_than ? " [THÂN]" : ""} | ĐH ${p.dai_han}`,
    `★ ${chinh}`,
    `+ ${p.cat_tinh.map((s) => s.name).join(", ")}`,
    `- ${p.sat_tinh.map((s) => s.name).join(", ")}`,
    ...(tt ? [`[${tt}]`] : []),
    `Năm ${p.tieu_han_chi} | ${p.trang_sinh} | T.${p.nguyet_han}`,
  ];
  return new TableCell({ children: lines(rows, 15), width: { size: 25, type: WidthType.PERCENTAGE } });
}

const labeled = (label: string, text: string) =>
  new Paragraph({ children: [new TextRun({ text: label, bold: true }), new TextRun(text)] });

const bullet = (label: string, text: string) =>
  new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text: label, bold: true }), new TextRun(text)] });

export async function exportDocx(chart: Chart, report: FullReport): Promise<Blob> {
  const { info, palaces } = chart;

  const center = new TableCell({
    columnSpan: 2,
    rowSpan: 2,
    children: lines(
      [
        "THIÊN BÀN",
        `Họ tên: ${info.name}`,
        `Năm: ${info.year_cc} (${info.s_year})`,
        `Tháng: ${info.month_cc} | Ngày: ${info.day_cc}`,
        `Giờ: ${info.hour_cc}`,
        `Âm Dương: ${info.am_duong}`,
        info.am_duong_ly,
        `Bản Mệnh: ${info.ban_menh}`,
        `Cục: ${info.cuc_name}`,
        info.menh_cuc_rel,
        `Mệnh chủ: ${info.menh_chu} | Thân chủ: ${info.than_chu}`,
      ],
      17,
    ),
  });

  const rows: TableRow[] = [];
  for (let r = 0; r < 4; r++) {
    const cells: TableCell[] = [];
    for (let c = 0; c < 4; c++) {
      const idx = GRID[`${r},${c}`];
      if (idx !== undefined) cells.push(palaceCell(palaces[idx]));
      else if (r === 1 && c === 1) cells.push(center);
      // (1,2), (2,1), (2,2) are covered by the merged center cell
    }
    rows.push(new TableRow({ children: cells }));
  }

  const body: (Paragraph | Table)[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      children: [new TextRun(`LÁ SỐ TỬ VI & LUẬN GIẢI TRỌN ĐỜI: ${info.name.toUpperCase()}`)],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun(
          `Giới tính: ${info.gender} (${info.am_duong} - ${info.am_duong_ly}) | Sinh DL: ${info.solar} | ÂL: ${info.lunar} | Giờ ${info.hour_cc}`,
        ),
        new TextRun({
          break: 1,
          text: `Bản mệnh: ${info.ban_menh} | Cục: ${info.cuc_name} (${info.menh_cuc_rel}) | Thân cư: ${info.than_cu} (${info.than_chi}) | Năm xem: ${info.view_year} (${info.view_year_cc}, ${info.tuoi_mu} tuổi)`,
        }),
      ],
    }),
    new Paragraph({ heading: HeadingLevel.HEADING_1, text: "I. BẢN ĐỒ AN CUNG LÁ SỐ TỬ VI" }),
    new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }),
    new Paragraph({ heading: HeadingLevel.HEADING_1, text: "II. CÁC CÁCH CỤC NỔI BẬT" }),
  ];

  if (report.cach_cuc.length) {
    for (const cc of report.cach_cuc) body.push(bullet(`[${cc.type}] ${cc.name}: `, cc.desc));
  } else {
    body.push(new Paragraph("Lá số bình hòa, không thiên lệch quá mức về một cách cục cực đoan."));
  }

  body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, text: "III. LUẬN GIẢI CHI TIẾT 12 CUNG CHÍNH (TRỌN ĐỜI)" }));
  for (const pr of report.palace_readings) {
    body.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        text: `${pr.palace_name} (${pr.chi}) — Điểm: ${pr.score}/100 (${pr.rating})`,
      }),
      new Paragraph(`Phạm vi: ${pr.domain}.`),
      labeled("• Điểm Cát (Thế mạnh & Cơ hội): ", pr.cat_points.map(clean).join(" ")),
      labeled("• Điểm Hung (Thách thức cần lưu ý): ", pr.hung_points.map(clean).join(" ")),
      labeled("• Lời khuyên hóa giải: ", pr.advice.join(" ")),
    );
  }

  body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, text: "IV. NHỮNG MỐC QUAN TRỌNG TRONG CUỘC ĐỜI" }));
  for (const ms of report.milestones)
    body.push(bullet(`Năm ${ms.year} (${ms.year_cc} - ${ms.tuoi_mu} tuổi) [${ms.verdict}]: `, clean(ms.summary)));

  body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, text: "V. DIỄN TRÌNH VẬN HẠN, ĐIỀM MAY & ĐIỀM HUNG TỪNG NĂM" }));
  for (const yr of report.yearly_readings) {
    const dv = yr.dai_van
      ? `Đại Vận ${yr.dai_van.tuoi_range} (${yr.dai_van.palace} - ${yr.dai_van.chi})`
      : "Tiểu Nhi Đồng Hạn";
    body.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        text: `Năm ${yr.year} (${yr.year_cc} - ${yr.tuoi_mu} tuổi) — ${yr.verdict} (${yr.score}/100)`,
      }),
      new Paragraph(
        `${dv} | Tiểu Hạn: ${yr.tieu_han.palace} (${yr.tieu_han.chi}) | Lưu Thái Tuế: ${yr.luu_thai_tue.palace} (${yr.luu_thai_tue.chi})`,
      ),
      labeled("• Điềm May: ", yr.diem_may.map(clean).join(" ")),
      labeled("• Điềm Hung: ", yr.diem_hung.map(clean).join(" ")),
      labeled("• Lời khuyên: ", yr.advice.join(" ")),
    );
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: "Times New Roman", size: 22 } } } },
    sections: [
      {
        properties: { page: { margin: { top: 860, bottom: 860, left: 860, right: 860 } } },
        children: body,
      },
    ],
  });
  return Packer.toBlob(doc);
}
