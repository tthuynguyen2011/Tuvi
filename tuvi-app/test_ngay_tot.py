"""
Tests for Chọn Ngày Tốt, Hướng Xuất Hành & Giờ Tốt Engine & Exporter.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from ngay_tot_engine import evaluate_day, scan_good_days
from ngay_tot_exporter import export_ngay_tot_to_docx_bytes


def test_book_reference_2000():
    # From "Chon ngay tot trong dan gian" p.92:
    # 5/2/2000 (1/1 Canh Thin) -> Quy Ty, Lieu Binh
    r1 = evaluate_day(5, 2, 2000, purpose="xuat_hanh")
    assert r1["can_chi"]["day"] == "Quý Tỵ"
    assert r1["tu_28"]["name"] == "Liễu"
    assert r1["truc"]["name"] == "Bình"
    assert len(r1["hoang_dao_summary"]) == 6

    # 6/2/2000 (2/1 Canh Thin) -> Giap Ngo, Tinh Dinh
    r2 = evaluate_day(6, 2, 2000, purpose="xuat_hanh")
    assert r2["can_chi"]["day"] == "Giáp Ngọ"
    assert r2["tu_28"]["name"] == "Tinh"
    assert r2["truc"]["name"] == "Định"


def test_scan_and_docx():
    ev = evaluate_day(25, 11, 2026, purpose="xuat_hanh", birth_year=1989)
    assert 10 <= ev["score"] <= 98
    assert len(ev["hours"]) == 12

    days = scan_good_days(25, 11, 2026, 15, 12, 2026, purpose="giao_dich", birth_year=1989, limit=10)
    assert len(days) == 10
    assert days[0]["score"] >= days[-1]["score"] or not days[0]["is_xung_tuoi"]

    docx_bytes = export_ngay_tot_to_docx_bytes(ev, days)
    assert len(docx_bytes) > 5000
    print(f"ALL NGAY TOT TESTS PASSED! Top day={days[0]['solar']} ({days[0]['score']}/100), DOCX={len(docx_bytes)}B")


if __name__ == "__main__":
    test_book_reference_2000()
    test_scan_and_docx()
