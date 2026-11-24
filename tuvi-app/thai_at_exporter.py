"""
Export Thái Ất Thần Kinh divination & Nhân Mệnh reports to Word (.docx).
"""
import io
from docx import Document
from docx.shared import Pt, RGBColor


def export_thai_at_to_docx_bytes(chart: dict, analysis: dict) -> bytes:
    doc = Document()
    style = doc.styles["Normal"]
    style.font.name = "Calibri"
    style.font.size = Pt(11)

    mode = chart.get("mode", "divination")
    title = doc.add_heading(
        "BÁO CÁO QUẺ THÁI ẤT THẦN KINH" if mode == "divination" else "BÁO CÁO THÁI ẤT NHÂN MỆNH",
        level=0,
    )
    for run in title.runs:
        run.font.color.rgb = RGBColor(120, 40, 20)

    if mode == "divination":
        doc.add_paragraph(f"Chủ đề: {analysis.get('topic_label', '')}")
        if chart.get("question"):
            doc.add_paragraph(f"Câu hỏi: {chart['question']}")
        s = chart["solar"]
        l = chart["lunar"]
        cc = chart["can_chi"]
        doc.add_paragraph(
            f"Thời điểm gieo quẻ: {s['hour_24']}h ngày {s['day']:02d}/{s['month']:02d}/{s['year']} (DL) "
            f"— {l['day']:02d}/{l['month']:02d}/{l['year']} (ÂL)"
        )
        doc.add_paragraph(f"Tứ trụ Can Chi: Năm {cc['year']} • Tháng {cc['month']} • Ngày {cc['day']} • Giờ {cc['hour']}")
        b = chart["board"]
        doc.add_paragraph(f"Độn & Cục: {b['don_type']} • Nguyên {b['nguyen']} • Cục {b['cuc']} (Kỷ dư: {b['ky_du']})")

        doc.add_heading("1. Tổng quan Thế Chủ – Khách & Số Toán", level=1)
        doc.add_paragraph(f"Toán Chủ: {b['chu']['toan']} ({analysis['chu_eval']['level']}) — {analysis['chu_eval']['desc']}")
        doc.add_paragraph(f"Toán Khách: {b['khach']['toan']} ({analysis['khach_eval']['level']}) — {analysis['khach_eval']['desc']}")
        doc.add_paragraph(f"Nhận định thế đứng: {analysis['stance_verdict']}")
        doc.add_paragraph(f"Phương hướng: {analysis['direction_advice']}")

        doc.add_heading("2. Cách Cục Thái Ất", level=1)
        for p in analysis["patterns"]:
            doc.add_paragraph(f"• {p['name']}: {p['detail']}")

        doc.add_heading("3. Khuyến nghị hành động", level=1)
        doc.add_paragraph(analysis["topic_advice"])
        if analysis.get("querent_note"):
            doc.add_paragraph(analysis["querent_note"])
        sn = analysis.get("summary_narrative")
        if sn:
            doc.add_heading("4. Tổng Giải (Diễn giải & Hướng giải quyết)", level=1)
            doc.add_paragraph(sn["narrative"])
            for step in sn["resolution"]:
                doc.add_paragraph(step)
    else:
        doc.add_paragraph(f"Đương số: {chart.get('name', '')} ({chart.get('gender', '')} — {chart.get('am_duong_menh', '')})")
        s = chart["solar"]
        l = chart["lunar"]
        doc.add_paragraph(
            f"Ngày sinh: {s['day']:02d}/{s['month']:02d}/{s['year']} (DL) — "
            f"{l['day']:02d}/{l['month']:02d}/{l['year']} (ÂL), {s['hour_24']}h"
        )
        mo = analysis["menh_overview"]
        doc.add_heading("1. Tổng quan Cung Mệnh & Toán Số", level=1)
        doc.add_paragraph(f"Cung Mệnh: {mo['menh_cung']} (Hành {mo['menh_hanh']}, Khí {mo['menh_khi']})")
        doc.add_paragraph(f"Nạp Âm năm sinh: {mo['nap_am']} — {mo['relation']}")
        ts = chart["toan_so"]
        doc.add_paragraph(
            f"Toán số Tứ trụ: Năm {ts['year']['total']} + Tháng {ts['month']['total']} + "
            f"Ngày {ts['day']['total']} + Giờ {ts['hour']['total']} = Tổng {ts['total']}"
        )

        doc.add_heading(f"2. Vận hạn năm {chart['view_year']} ({chart['view_year_can_chi']})", level=1)
        va = analysis["view_year_analysis"]
        doc.add_paragraph(f"Tuế Kế Cục {va['cuc']} — {va['hit_note']}")
        doc.add_paragraph(va["balance"]["summary"])
        for p in va["patterns"]:
            doc.add_paragraph(f"• {p['name']}: {p['detail']}")
        sn = analysis.get("summary_narrative")
        if sn:
            doc.add_heading("3. Tổng Giải (Diễn giải & Hướng giải quyết)", level=1)
            doc.add_paragraph(sn["narrative"])
            for step in sn["resolution"]:
                doc.add_paragraph(step)

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()
