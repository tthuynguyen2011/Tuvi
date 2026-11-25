"""
Export Chọn Ngày Tốt, Hướng Xuất Hành & Giờ Tốt report to Word (.docx).
"""
import io
from docx import Document
from docx.shared import Pt, RGBColor


def export_ngay_tot_to_docx_bytes(report: dict, scan_list: list = None) -> bytes:
    doc = Document()
    style = doc.styles["Normal"]
    style.font.name = "Calibri"
    style.font.size = Pt(11)

    title = doc.add_heading("BÁO CÁO CHỌN NGÀY TỐT, HƯỚNG XUẤT HÀNH & GIỜ TỐT", level=0)
    for run in title.runs:
        run.font.color.rgb = RGBColor(120, 40, 20)

    if report:
        doc.add_heading(f"1. Chi tiết ngày {report['solar']} (Âm lịch: {report['lunar']})", level=1)
        doc.add_paragraph(f"Mục đích: {report['purpose_label']} — Đánh giá: {report['score']}/100 ({report['verdict']})")
        cc = report["can_chi"]
        doc.add_paragraph(f"Can Chi: Năm {cc['year']} • Tháng {cc['month']} • Ngày {cc['day']} ({report['nap_am']})")
        doc.add_paragraph(f"Trực: {report['truc']['name']} ({report['truc']['type']}) — {report['truc']['desc']}")
        doc.add_paragraph(f"28 Tú: {report['tu_28']['name']} ({report['tu_28']['type']}) — {report['tu_28']['desc']}")
        doc.add_paragraph(f"Tuổi xung: {report['xung_chi']}" + (f" • {report['age_note']}" if report.get("age_note") else ""))

        d = report["directions"]
        doc.add_heading("2. Hướng Xuất Hành & Sao Đức", level=1)
        doc.add_paragraph(f"• Hỷ Thần (niềm vui, hỷ sự): {d['hy_than']}")
        doc.add_paragraph(f"• Tài Thần (tài lộc, giao dịch): {d['tai_than']}")
        doc.add_paragraph(f"• Thiên Đạo Hành (hướng tốt trong tháng): {d['thien_dao']}")
        doc.add_paragraph(f"• Thiên Đức / Nguyệt Đức: {d['thien_duc']} / {d['nguyet_duc']}")

        doc.add_heading("3. Giờ Hoàng Đạo Trong Ngày", level=1)
        for h in report["hoang_dao_summary"]:
            doc.add_paragraph(f"• Giờ {h}")

        doc.add_heading("4. Yếu Tố Cát & Lưu Ý", level=1)
        for r in report["good_reasons"]:
            doc.add_paragraph(f"+ {r}")
        for r in report["bad_reasons"]:
            doc.add_paragraph(f"- {r}")

    if scan_list:
        doc.add_heading("DANH SÁCH CÁC NGÀY ĐẸP ĐỀ XUẤT", level=1)
        for idx, item in enumerate(scan_list, 1):
            doc.add_paragraph(
                f"{idx}. {item['solar']} (ÂL {item['lunar']}) — {item['can_chi']['day']} | "
                f"Điểm {item['score']}/100 ({item['verdict']}) | "
                f"Tài Thần: {item['directions']['tai_than']} • Hỷ Thần: {item['directions']['hy_than']} | "
                f"Giờ Hoàng Đạo: {', '.join(item['hoang_dao_summary'][:3])}"
            )

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()
