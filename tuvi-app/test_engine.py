import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from tuvi_engine import build_chart
from tuvi_analyzer import analyze_full_report
from docx_exporter import export_to_docx_bytes

# 1. Nguyen Diep Thao (from uploaded image)
c1 = build_chart("Nguyễn Diệp Thảo", "Nữ", 2018, 7, 25, 18, is_lunar=False, view_year=2020)
i1 = c1["info"]
assert i1["lunar"] == "13/06/2018", i1["lunar"]
assert i1["year_cc"] == "Mậu Tuất"
assert i1["am_duong"] == "Dương Nữ"
assert i1["am_duong_ly"] == "Âm Dương Thuận Lý"
assert i1["ban_menh"] == "Bình Địa Mộc"
assert i1["cuc_name"] == "Thủy Nhị Cục"
assert i1["menh_cuc_rel"] == "Cục sinh Mệnh"
assert i1["menh_chi"] == "Tuất"
assert i1["than_cu"] == "THIÊN DI"
assert i1["menh_chu"] == "Lộc Tồn"
assert i1["than_chu"] == "Văn Xương"

r1 = analyze_full_report(c1, start_year=2020, num_years=15)
assert len(r1["palace_readings"]) == 12
assert len(r1["yearly_readings"]) == 15
assert len(r1["milestones"]) > 0
docx_bytes = export_to_docx_bytes(c1, r1)
assert len(docx_bytes) > 10000

# 2. Nguyen Thi Cam Van (from docx)
c2 = build_chart("Nguyễn Thị Cẩm Vân", "Nữ", 1989, 8, 9, 8, is_lunar=True, view_year=2026)
assert c2["info"]["year_cc"] == "Kỷ Tỵ"
assert c2["info"]["cuc_name"] == "Mộc Tam Cục"
assert c2["info"]["menh_chi"] == "Tỵ"
assert c2["info"]["than_cu"] == "TÀI BẠCH"
r2 = analyze_full_report(c2, start_year=2026, num_years=10)
assert r2["yearly_readings"][0]["tieu_han"]["chi"] == "Ngọ"

# 3. Hoang Tran Long (from docx)
c3 = build_chart("Hoàng Trần Long", "Nam", 1987, 11, 12, 22, is_lunar=False, view_year=2026)
assert c3["info"]["year_cc"] == "Đinh Mão"
assert c3["info"]["ban_menh"] == "Lư Trung Hỏa"
assert c3["info"]["cuc_name"] == "Kim Tứ Cục"
assert c3["info"]["menh_chi"] == "Hợi"
assert c3["info"]["than_cu"] == "PHU THÊ"
r3 = analyze_full_report(c3, start_year=2026, num_years=5)
assert r3["yearly_readings"][0]["tieu_han"]["chi"] == "Thìn"

print("ALL TESTS PASSED! Milestones for Thảo:", len(r1["milestones"]), "| DOCX bytes:", len(docx_bytes))
