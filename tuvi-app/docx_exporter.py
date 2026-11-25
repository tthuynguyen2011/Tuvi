"""
Export Tu Vi Chart & Full Interpretation Report to Microsoft Word (.docx).
"""
import io
import docx
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT


def _clean_md(text: str) -> str:
    return text.replace("**", "")


def export_to_docx_bytes(chart: dict, report: dict) -> bytes:
    doc = docx.Document()
    for sec in doc.sections:
        sec.top_margin = Inches(0.6)
        sec.bottom_margin = Inches(0.6)
        sec.left_margin = Inches(0.6)
        sec.right_margin = Inches(0.6)

    info = chart["info"]
    palaces = chart["palaces"]

    title = doc.add_heading(f"LÁ SỐ TỬ VI & LUẬN GIẢI TRỌN ĐỜI: {info['name'].upper()}", level=0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER

    meta = doc.add_paragraph()
    meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
    meta.add_run(
        f"Giới tính: {info['gender']} ({info['am_duong']} - {info['am_duong_ly']}) | "
        f"Sinh DL: {info['solar']} | ÂL: {info['lunar']} | Giờ {info['hour_cc']}\n"
        f"Bản mệnh: {info['ban_menh']} | Cục: {info['cuc_name']} ({info['menh_cuc_rel']}) | "
        f"Thân cư: {info['than_cu']} ({info['than_chi']}) | Năm xem: {info['view_year']} ({info['view_year_cc']}, {info['tuoi_mu']} tuổi)"
    )

    # 1. Ban Do 12 Cung (4x4 Table)
    doc.add_heading("I. BẢN ĐỒ AN CUNG LÁ SỐ TỬ VI", level=1)
    table = doc.add_table(rows=4, cols=4)
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER

    grid_pos = {
        (0, 0): 5, (0, 1): 6, (0, 2): 7, (0, 3): 8,
        (1, 0): 4,                       (1, 3): 9,
        (2, 0): 3,                       (2, 3): 10,
        (3, 0): 2, (3, 1): 1, (3, 2): 0, (3, 3): 11,
    }

    # Merge center 2x2 for Thien Ban
    c_tl = table.cell(1, 1)
    c_br = table.cell(2, 2)
    c_tl.merge(c_br)
    c_tl.text = (
        f"THIÊN BÀN\n"
        f"Họ tên: {info['name']}\n"
        f"Năm: {info['year_cc']} ({info['s_year']})\n"
        f"Tháng: {info['month_cc']} | Ngày: {info['day_cc']}\n"
        f"Giờ: {info['hour_cc']}\n"
        f"Âm Dương: {info['am_duong']}\n"
        f"{info['am_duong_ly']}\n"
        f"Bản Mệnh: {info['ban_menh']}\n"
        f"Cục: {info['cuc_name']}\n"
        f"{info['menh_cuc_rel']}\n"
        f"Mệnh chủ: {info['menh_chu']} | Thân chủ: {info['than_chu']}"
    )
    for p in c_tl.paragraphs:
        for r in p.runs:
            r.font.size = Pt(8.5)

    for (r_idx, c_idx), chi_idx in grid_pos.items():
        pal = palaces[chi_idx]
        cell = table.cell(r_idx, c_idx)
        than_tag = " [THÂN]" if pal["is_than"] else ""
        chinh_str = ", ".join(f"{s['name']} ({s['brightness']})" for s in pal["chinh_tinh"]) or "Vô Chính Diệu"
        cat_str = ", ".join(s["name"] for s in pal["cat_tinh"])
        sat_str = ", ".join(s["name"] for s in pal["sat_tinh"])
        tt_str = "/".join(x for x, f in [("Tuần", pal["tuan"]), ("Triệt", pal["triet"])] if f)
        tt_line = f"\n[{tt_str}]" if tt_str else ""
        cell.text = (
            f"{pal['can_short']} {pal['chi']} | {pal['display_name']}{than_tag} | ĐH {pal['dai_han']}\n"
            f"★ {chinh_str}\n"
            f"+ {cat_str}\n"
            f"- {sat_str}{tt_line}\n"
            f"Năm {pal['tieu_han_chi']} | {pal['trang_sinh']} | T.{pal['nguyet_han']}"
        )
        for p in cell.paragraphs:
            for run in p.runs:
                run.font.size = Pt(7.5)

    # 2. Cach Cuc & Tong Luan
    doc.add_heading("II. CÁC CÁCH CỤC NỔI BẬT & TỔNG LUẬN TRỌN ĐỜI", level=1)
    if report["cach_cuc"]:
        for cc in report["cach_cuc"]:
            p = doc.add_paragraph(style="List Bullet")
            r = p.add_run(f"[{cc['type']}] {cc['name']}: ")
            r.bold = True
            p.add_run(cc["desc"])
    else:
        doc.add_paragraph("Lá số bình hòa, không thiên lệch quá mức về một cách cục cực đoan.")

    os_sum = report.get("overall_summary")
    if os_sum:
        doc.add_paragraph(_clean_md(os_sum["narrative"]))
        if os_sum.get("year_outlook"):
            doc.add_paragraph(_clean_md(os_sum["year_outlook"]))
        for pl in os_sum.get("pillars", []):
            doc.add_paragraph(_clean_md(pl), style="List Bullet")
        doc.add_paragraph(os_sum["disclaimer"])

    # 3. Luan giai 12 cung chinh
    doc.add_heading("III. LUẬN GIẢI CHI TIẾT 12 CUNG CHÍNH (TRỌN ĐỜI)", level=1)
    for pr in report["palace_readings"]:
        h = doc.add_heading(f"{pr['palace_name']} ({pr['chi']}) — Điểm: {pr['score']}/100 ({pr['rating']})", level=2)
        doc.add_paragraph(f"Phạm vi: {pr['domain']}.")
        if pr.get("detailed_narrative"):
            doc.add_paragraph(_clean_md(pr["detailed_narrative"]))
        p_cat = doc.add_paragraph()
        p_cat.add_run("• Điểm Cát (Thế mạnh & Cơ hội): ").bold = True
        p_cat.add_run(" ".join(_clean_md(x) for x in pr["cat_points"]))

        p_hung = doc.add_paragraph()
        p_hung.add_run("• Điểm Hung (Thách thức cần lưu ý): ").bold = True
        p_hung.add_run(" ".join(_clean_md(x) for x in pr["hung_points"]))

        p_adv = doc.add_paragraph()
        p_adv.add_run("• Lời khuyên hóa giải: ").bold = True
        p_adv.add_run(" ".join(pr["advice"]))

    # 4. Cac moc quan trong trong doi
    doc.add_heading("IV. NHỮNG MỐC QUAN TRỌNG TRONG CUỘC ĐỜI", level=1)
    for ms in report["milestones"]:
        p = doc.add_paragraph(style="List Bullet")
        r = p.add_run(f"Năm {ms['year']} ({ms['year_cc']} - {ms['tuoi_mu']} tuổi) [{ms['verdict']}]: ")
        r.bold = True
        p.add_run(ms["summary"])

    # 5. Luan giai tung nam
    doc.add_heading("V. DIỄN TRÌNH VẬN HẠN, ĐIỀM MAY & ĐIỀM HUNG TỪNG NĂM", level=1)
    for yr in report["yearly_readings"]:
        dv_txt = f"Đại Vận {yr['dai_van']['tuoi_range']} ({yr['dai_van']['palace']} - {yr['dai_van']['chi']})" if yr["dai_van"] else "Tiểu Nhi Đồng Hạn"
        doc.add_heading(
            f"Năm {yr['year']} ({yr['year_cc']} - {yr['tuoi_mu']} tuổi) — {yr['verdict']} ({yr['score']}/100)",
            level=2
        )
        doc.add_paragraph(
            f"{dv_txt} | Tiểu Hạn: {yr['tieu_han']['palace']} ({yr['tieu_han']['chi']}) | "
            f"Lưu Thái Tuế: {yr['luu_thai_tue']['palace']} ({yr['luu_thai_tue']['chi']})"
        )
        pm = doc.add_paragraph()
        pm.add_run("• Điềm May: ").bold = True
        pm.add_run(" ".join(_clean_md(x) for x in yr["diem_may"]))

        ph = doc.add_paragraph()
        ph.add_run("• Điềm Hung: ").bold = True
        ph.add_run(" ".join(_clean_md(x) for x in yr["diem_hung"]))

        pa = doc.add_paragraph()
        pa.add_run("• Lời khuyên: ").bold = True
        pa.add_run(" ".join(yr["advice"]))

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()
