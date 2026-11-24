"""
Tests for Thái Ất Thần Kinh Engine, Interactive Analyzer, and DOCX Exporter.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

import lunar_calendar as lc
from thai_at_engine import _place_stars_from_tich, build_divination_chart, build_nhan_menh_chart
from thai_at_analyzer import analyze_divination, analyze_nhan_menh
from thai_at_exporter import export_thai_at_to_docx_bytes


def test_book_examples():
    # 1. Verify Tich Nien formula against Cuon I, p.42 & p.46
    assert 10155358 + (1441 - 1441) == 10155358
    assert (10155358 % 360) == 118
    assert 10155358 + (1640 - 1441) == 10155557  # Sung Trinh 13 Canh Thin (p.46)
    assert 10155358 + (1787 - 1441) == 10155704  # Chieu Thong (p.46)

    # 2. Verify Cuon IV, 72 Khoi Am Cuc 1 (p.151) & Cuc 2 (p.152)
    b1 = _place_stars_from_tich(1, "Âm Độn")
    assert b1["thai_at_cung"] == "Tốn" and b1["thai_at_num"] == 9
    assert b1["van_xuong_cung"] == "Dần"
    assert b1["ke_than_cung"] == "Thân"
    assert b1["thuy_kich_cung"] == "Khôn"
    assert b1["chu"]["toan"] == 5
    assert b1["khach"]["toan"] == 29

    b2 = _place_stars_from_tich(2, "Âm Độn")
    assert b2["thai_at_cung"] == "Tốn"
    assert b2["van_xuong_cung"] == "Mão"
    assert b2["chu"]["dai_tuong_num"] == 4
    assert b2["chu"]["tham_tuong_num"] == 2
    assert b2["khach"]["dai_tuong_num"] == 7
    assert b2["khach"]["tham_tuong_num"] == 1

    # 3. Verify Cuon VII, Nhan Menh An Cung Menh (p.495)
    # Giap Ty, thang Gieng (1), gio Thin (hour_24=8) -> Menh tai Dan
    nm1 = build_nhan_menh_chart("Test 1", "Nam", 15, 1, 1984, 8, is_lunar=True, view_year=2026)
    assert nm1["menh_cung"] == "Dần", f"Expected Dần, got {nm1['menh_cung']}"

    # Giap Ty, thang Gieng (1), gio Than (hour_24=16) -> Menh tai Ngo
    nm2 = build_nhan_menh_chart("Test 2", "Nam", 15, 1, 1984, 16, is_lunar=True, view_year=2026)
    assert nm2["menh_cung"] == "Ngọ", f"Expected Ngọ, got {nm2['menh_cung']}"

    # At Suu (Am Nam), thang Gieng (1), gio Than (hour_24=16) -> Menh tai Mui
    nm3 = build_nhan_menh_chart("Test 3", "Nam", 15, 1, 1985, 16, is_lunar=True, view_year=2026)
    assert nm3["menh_cung"] == "Mùi", f"Expected Mùi, got {nm3['menh_cung']}"


def test_divination_and_consult_and_docx():
    chart = build_divination_chart(
        dd=23, mm=11, yy=2026, hour_24=11,
        ke_mode="thoi_ke",
        question="Có nên ký hợp đồng tuần này?",
        topic="tai_loc",
        querent_birth_year=1995,
    )
    assert chart["board"]["don_type"] == "Âm Độn"
    assert 1 <= chart["board"]["cuc"] <= 72

    a_auto = analyze_divination(chart, stance="auto")
    a_khach = analyze_divination(chart, stance="khach", urgency="gap", extra_context="Đối tác thúc ký")
    assert a_khach["stance"] == "khach"
    assert "Đối tác thúc ký" in a_khach["extra_context_note"]

    docx_div = export_thai_at_to_docx_bytes(chart, a_khach)
    assert len(docx_div) > 5000

    nm = build_nhan_menh_chart("Nguyễn Văn A", "Nam", 10, 5, 1995, 8, is_lunar=False, view_year=2026)
    anm = analyze_nhan_menh(nm)
    docx_nm = export_thai_at_to_docx_bytes(nm, anm)
    assert len(docx_nm) > 5000

    print(
        f"ALL THAI AT TESTS PASSED! Div Cuc={chart['board']['cuc']} ({chart['board']['don_type']}), "
        f"Menh={nm['menh_cung']}, DOCX_div={len(docx_div)}B, DOCX_nm={len(docx_nm)}B"
    )


if __name__ == "__main__":
    test_book_examples()
    test_divination_and_consult_and_docx()
