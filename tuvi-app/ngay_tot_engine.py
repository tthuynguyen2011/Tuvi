"""
Chọn Ngày Tốt, Hướng Xuất Hành & Giờ Tốt Engine.
Grounded in "Chọn ngày tốt trong dân gian" (Tăng Cường Ngô - Hồ Lê Minh):
- 12 Trực (Kiến Trừ thập nhị khách)
- 28 Tú (Nhị Thập Bát Tú, calibrated to 2000-02-05 Quý Tỵ = Liễu)
- 12 Giờ Hoàng Đạo / Hắc Đạo & Ngũ Thử Độn Can Chi giờ
- Phương vị Xuất hành: Hỷ Thần, Tài Thần, Thiên Đạo Hành, Thiên Đức, Nguyệt Đức
- Xung kỵ theo Địa Chi, Tam Nương, Nguyệt Kỵ, Ngũ Hành Nạp Âm vs tuổi
"""
import lunar_calendar as lc

CHI_12 = lc.CHI  # Tý..Hợi

PURPOSES = {
    "chung": "Tổng quát / Mọi việc",
    "xuat_hanh": "Xuất hành / Đi xa / Công tác",
    "giao_dich": "Ký hợp đồng / Giao dịch / Tài chính",
    "khai_truong": "Khai trương / Mở hàng / Nhậm chức",
    "cuoi_hoi": "Cưới hỏi / Hỷ sự / Đính hôn",
    "dong_tho": "Động thổ / Sửa chữa / Nhập trạch",
}

# 28 Tú (Nhị Thập Bát Tú)
TU_28 = [
    ("Giác", "Cát", "Tạo tác, hôn nhân, xuất hành, khai trương đều tốt."),
    ("Cang", "Hung", "Kỵ động thổ, cưới gả; việc nhỏ bình thường."),
    ("Đê", "Hung", "Thận trọng giao dịch lớn, xuất hành xa."),
    ("Phòng", "Cát", "Đại cát cho khai trương, xuất hành, nhậm chức, hỷ sự."),
    ("Tâm", "Hung", "Tránh khởi sự lớn, dễ hao tổn hoặc thị phi."),
    ("Vĩ", "Cát", "Tốt cho hỷ sự, ký kết, xây dựng, tích lũy."),
    ("Cơ", "Cát", "Thuận lợi xuất hành, khai trương, cầu tài, giao dịch."),
    ("Đẩu", "Cát", "Tốt cho mở mang, lập kế hoạch, cầu danh, tài lộc."),
    ("Ngưu", "Hung", "Kỵ cưới hỏi, xuất hành xa; nên làm việc nội bộ."),
    ("Nữ", "Hung", "Tránh việc trọng đại, dễ sinh tranh cãi nhỏ."),
    ("Hư", "Hung", "Bất lợi cho khởi sự, khai trương, ký kết mới."),
    ("Nguy", "Hung", "Thận trọng khi đi xa, tránh mạo hiểm."),
    ("Thất", "Cát", "Đại cát cho xây dựng, nhập trạch, cưới hỏi, mở hàng."),
    ("Bích", "Cát", "Rất tốt cho học hành, ký kết, xuất hành, cầu tài."),
    ("Khuê", "Hung", "Kỵ khai trương lớn, dễ gặp cản trở ban đầu."),
    ("Lâu", "Cát", "Tốt cho cầu tài, cưới hỏi, xây dựng, hợp tác."),
    ("Vị", "Cát", "Hanh thông cho giao dịch, khai trương, xuất hành."),
    ("Mão", "Hung", "Tránh kiện tụng, tranh chấp; cẩn trọng giấy tờ."),
    ("Tất", "Cát", "Đại cát cho mọi việc: khai trương, xuất hành, hỷ sự."),
    ("Chủy", "Hung", "Kỵ động thổ, cưới gả; nên thủ thế."),
    ("Sâm", "Cát", "Tốt cho cầu danh, nhậm chức, xuất hành, giao dịch."),
    ("Tỉnh", "Cát", "Thuận lợi cho mở rộng kinh doanh, thủy lợi, đi xa."),
    ("Quỷ", "Hung", "Kỵ xuất hành, cưới hỏi; chỉ hợp việc nhỏ."),
    ("Liễu", "Hung", "Thận trọng lời nói và hợp đồng, tránh nóng vội."),
    ("Tinh", "Hung", "Hợp việc sửa sang nhỏ, kỵ khởi sự lớn."),
    ("Trương", "Cát", "Đại cát cho hỷ sự, khai trương, ký kết, xuất hành."),
    ("Dực", "Hung", "Bình thường cho việc nhỏ, kỵ việc đại sự."),
    ("Chẩn", "Cát", "Tốt cho xuất hành, nhập trạch, giao dịch, cầu tài."),
]

# 12 Trực (Kiến Trừ thập nhị khách)
TRUC_12 = [
    ("Kiến", "Bình", "Tốt cho xuất hành, nhậm chức; kỵ động thổ lớn.", {"xuat_hanh", "khai_truong"}),
    ("Trừ", "Cát", "Tốt cho giải trừ ách, dọn dẹp, chữa bệnh, ký kết thanh lý.", {"chung", "giao_dich"}),
    ("Mãn", "Cát", "Tốt cho khai trương, cầu tài, giao dịch, hỷ sự.", {"khai_truong", "giao_dich", "cuoi_hoi", "xuat_hanh"}),
    ("Bình", "Bình", "Mọi việc bình hòa, ổn định, hợp sửa sang hoặc giao dịch thường.", {"chung", "giao_dich"}),
    ("Định", "Cát", "Rất tốt cho ký hợp đồng, cưới hỏi, nhập trạch, định kế.", {"giao_dich", "cuoi_hoi", "dong_tho", "chung"}),
    ("Chấp", "Bình", "Tốt cho xây dựng, giữ vững vị thế; kỵ xuất hành xa.", {"dong_tho"}),
    ("Phá", "Hung", "Kỵ khai trương, cưới hỏi, ký kết; chỉ hợp phá dỡ cũ.", set()),
    ("Nguy", "Hung", "Thận trọng đi xa, tránh mạo hiểm; hợp cầu an.", set()),
    ("Thành", "Cát", "Đại cát cho khai trương, ký kết, xuất hành, cưới hỏi, nhập trạch.", {"chung", "xuat_hanh", "giao_dich", "khai_truong", "cuoi_hoi", "dong_tho"}),
    ("Thu", "Bình", "Tốt cho thu hồi công nợ, thu hoạch; kỵ khởi sự mới.", {"giao_dich"}),
    ("Khai", "Cát", "Đại cát cho khai trương, xuất hành, cầu tài, nhậm chức.", {"chung", "xuat_hanh", "giao_dich", "khai_truong", "cuoi_hoi"}),
    ("Bế", "Hung", "Bế tắc, kỵ khai trương, xuất hành, ký kết lớn.", set()),
]

# 12 Thần Giờ Hoàng Đạo / Hắc Đạo (khởi Thanh Long tại cung theo Địa Chi ngày)
HOANG_DAO_STARS = [
    ("Thanh Long", True),
    ("Minh Đường", True),
    ("Thiên Hình", False),
    ("Chu Tước", False),
    ("Kim Quỹ", True),
    ("Thiên Đức", True),
    ("Bạch Hổ", False),
    ("Ngọc Đường", True),
    ("Thiên Lao", False),
    ("Huyền Vũ", False),
    ("Tư Mệnh", True),
    ("Câu Trần", False),
]

# Khởi Thanh Long theo Chi ngày:
# Dần/Thân -> Tý (0); Mão/Dậu -> Dần (2); Thìn/Tuất -> Thìn (4); Tỵ/Hợi -> Ngọ (6); Tý/Ngọ -> Thân (8); Sửu/Mùi -> Tuất (10)
THANH_LONG_START = {
    0: 8, 6: 8,
    1: 10, 7: 10,
    2: 0, 8: 0,
    3: 2, 9: 2,
    4: 4, 10: 4,
    5: 6, 11: 6,
}

HOUR_RANGES = [
    "23h–01h", "01h–03h", "03h–05h", "05h–07h", "07h–09h", "09h–11h",
    "11h–13h", "13h–15h", "15h–17h", "17h–19h", "19h–21h", "21h–23h",
]

# Phương vị Hỷ Thần & Tài Thần theo Thiên Can ngày (trang 90-91)
HY_THAN_BY_CAN = {
    "Giáp": "Đông Bắc", "Kỷ": "Đông Bắc",
    "Ất": "Tây Bắc", "Canh": "Tây Bắc",
    "Bính": "Tây Nam", "Tân": "Tây Nam",
    "Đinh": "Chính Nam", "Nhâm": "Chính Nam",
    "Mậu": "Đông Nam", "Quý": "Đông Nam",
}

TAI_THAN_BY_CAN = {
    "Giáp": "Đông Nam", "Ất": "Đông Nam",
    "Bính": "Chính Đông", "Đinh": "Chính Đông",
    "Mậu": "Chính Bắc", "Kỷ": "Chính Bắc",
    "Canh": "Chính Nam", "Tân": "Chính Nam",
    "Nhâm": "Chính Tây", "Quý": "Chính Tây",
}

# Thiên Đạo Hành theo 12 tháng ÂL (trang 86)
THIEN_DAO_BY_MONTH = {
    1: "Chính Nam", 2: "Chính Nam", 3: "Chính Bắc",
    4: "Chính Tây", 5: "Tây Bắc", 6: "Chính Đông",
    7: "Chính Bắc", 8: "Đông Bắc", 9: "Chính Nam",
    10: "Chính Đông", 11: "Đông Nam", 12: "Chính Tây",
}

# Thiên Đức & Nguyệt Đức theo 12 tháng ÂL (trang 91)
THIEN_NGUYET_DUC_BY_MONTH = {
    1: ("Đinh", "Bính"), 2: ("Khôn", "Giáp"), 3: ("Nhâm", "Nhâm"),
    4: ("Tân", "Canh"), 5: ("Càn", "Bính"), 6: ("Giáp", "Giáp"),
    7: ("Quý", "Nhâm"), 8: ("Cấn", "Canh"), 9: ("Bính", "Bính"),
    10: ("Ất", "Giáp"), 11: ("Tốn", "Nhâm"), 12: ("Canh", "Canh"),
}

TAM_NUONG_DAYS = {3, 7, 13, 18, 22, 27}
NGUYET_KY_DAYS = {5, 14, 23}

HANH_SINH = {"Mộc": "Hỏa", "Hỏa": "Thổ", "Thổ": "Kim", "Kim": "Thủy", "Thủy": "Mộc"}
HANH_KHAC = {"Mộc": "Thổ", "Thổ": "Thủy", "Thủy": "Hỏa", "Hỏa": "Kim", "Kim": "Mộc"}


def evaluate_day(dd: int, mm: int, yy: int, purpose: str = "chung", birth_year: int = None) -> dict:
    """Đánh giá chi tiết một ngày: Can Chi, Trực, 28 Tú, Giờ Hoàng Đạo, Hướng Xuất Hành & Chấm điểm."""
    jd = lc.jd_from_date(dd, mm, yy)
    l_day, l_month, l_year, l_leap = lc.solar_to_lunar(dd, mm, yy)

    y_can, y_chi, _, _ = lc.get_year_can_chi(l_year)
    m_can, m_chi, _, m_chi_i = lc.get_month_can_chi(l_month, l_year)
    d_can, d_chi, d_can_i, d_chi_i = lc.get_day_can_chi(dd, mm, yy)
    nap_am_name, nap_am_hanh = lc.NAP_AM.get((d_can, d_chi), ("Không rõ", "Thổ"))

    # 1. Trực (12 Kiến Trừ): Kiến khi day_chi == month_chi
    truc_idx = (d_chi_i - m_chi_i) % 12
    truc_name, truc_type, truc_desc, truc_purposes = TRUC_12[truc_idx]

    # 2. 28 Tú (calibrated: 2000-02-05 JD%28=12 -> Liễu index 23)
    tu_idx = (jd + 11) % 28
    tu_name, tu_type, tu_desc = TU_28[tu_idx]

    # 3. 12 Giờ Hoàng Đạo / Hắc Đạo
    tl_start = THANH_LONG_START[d_chi_i]
    hours = []
    hoang_dao_list = []
    for h_i in range(12):
        star_name, is_hd = HOANG_DAO_STARS[(h_i - tl_start) % 12]
        h_can, h_chi, _, _ = lc.get_hour_can_chi(d_can_i, h_i)
        item = {
            "chi_idx": h_i,
            "chi": h_chi,
            "can_chi": f"{h_can} {h_chi}",
            "range": HOUR_RANGES[h_i],
            "star": star_name,
            "is_hoang_dao": is_hd,
        }
        hours.append(item)
        if is_hd:
            hoang_dao_list.append(f"{h_chi} ({HOUR_RANGES[h_i]} — {star_name})")

    # 4. Phương vị xuất hành & Sao Đức
    xung_chi = CHI_12[(d_chi_i + 6) % 12]
    hy_than = HY_THAN_BY_CAN[d_can]
    tai_than = TAI_THAN_BY_CAN[d_can]
    thien_dao = THIEN_DAO_BY_MONTH[l_month]
    thien_duc, nguyet_duc = THIEN_NGUYET_DUC_BY_MONTH[l_month]

    # 5. Chấm điểm tổng hợp
    score = 55
    good_reasons = []
    bad_reasons = []

    if truc_type == "Cát":
        score += 14
        good_reasons.append(f"Trực {truc_name} (Cát): {truc_desc}")
    elif truc_type == "Hung":
        score -= 16
        bad_reasons.append(f"Trực {truc_name} (Hung): {truc_desc}")
    else:
        good_reasons.append(f"Trực {truc_name} (Bình): {truc_desc}")

    if purpose in truc_purposes:
        score += 8
        good_reasons.append(f"Trực {truc_name} rất hợp mục đích {PURPOSES.get(purpose, '')}.")

    if tu_type == "Cát":
        score += 12
        good_reasons.append(f"Sao {tu_name} (Cát tú): {tu_desc}")
    else:
        score -= 10
        bad_reasons.append(f"Sao {tu_name} (Hung tú): {tu_desc}")

    if d_can == thien_duc or d_can == nguyet_duc:
        score += 8
        good_reasons.append(f"Ngày có Thiên Đức / Nguyệt Đức ({d_can}) chiếu: hóa giải hung sát, tăng phúc khí.")

    if l_day in TAM_NUONG_DAYS:
        score -= 10
        bad_reasons.append(f"Ngày {l_day} ÂL thuộc Tam Nương: dân gian thường tránh khởi sự việc đại sự.")
    if l_day in NGUYET_KY_DAYS:
        score -= 10
        bad_reasons.append(f"Ngày {l_day} ÂL thuộc Nguyệt Kỵ (mồng 5, 14, 23): nên làm việc nhỏ, hạn chế đi xa/khai trương lớn.")

    # Kiểm tra tuổi người xem (nếu có)
    age_note = ""
    is_xung_tuoi = False
    if birth_year:
        b_can, b_chi, _, b_chi_i = lc.get_year_can_chi(int(birth_year))
        _, b_hanh = lc.NAP_AM.get((b_can, b_chi), ("Không rõ", "Thổ"))
        if b_chi == xung_chi:
            score -= 18
            is_xung_tuoi = True
            bad_reasons.append(f"Ngày {d_chi} Lục Xung trực tiếp với tuổi {b_can} {b_chi} ({birth_year}) — không nên dùng cho việc trọng đại của tuổi này.")
            age_note = f"Tuổi {b_can} {b_chi} ({birth_year}, {b_hanh}) bị Lục Xung với ngày {d_chi}."
        elif b_chi_i == d_chi_i:
            score += 4
            age_note = f"Tuổi {b_can} {b_chi} ({birth_year}, {b_hanh}) đồng Chi với ngày {d_chi}."
        else:
            if HANH_SINH.get(nap_am_hanh) == b_hanh:
                score += 6
                good_reasons.append(f"Ngũ hành ngày ({nap_am_hanh}) tương sinh cho tuổi {b_can} {b_chi} ({b_hanh}).")
                age_note = f"Ngày ({nap_am_hanh}) tương sinh tuổi ({b_hanh}) — rất tốt."
            elif HANH_KHAC.get(nap_am_hanh) == b_hanh:
                score -= 4
                age_note = f"Ngày ({nap_am_hanh}) hơi khắc tuổi ({b_hanh}) — nên chọn giờ Hoàng Đạo."
            else:
                age_note = f"Tuổi {b_can} {b_chi} ({b_hanh}) hài hòa với ngày {d_can} {d_chi} ({nap_am_hanh})."

    score = max(10, min(98, score))
    if score >= 75 and not is_xung_tuoi:
        verdict, tier = "Đại Cát (Rất Tốt)", "cat"
    elif score >= 60 and not is_xung_tuoi:
        verdict, tier = "Cát Lành (Khá Tốt)", "good"
    elif score >= 45:
        verdict, tier = "Bình Hòa (Có thể dùng)", "neutral"
    else:
        verdict, tier = "Nên Tránh / Chọn Ngày Khác", "hung"

    return {
        "solar": f"{dd:02d}/{mm:02d}/{yy}",
        "solar_parts": {"day": dd, "month": mm, "year": yy},
        "lunar": f"{l_day:02d}/{l_month:02d}/{l_year}" + (" (nhuận)" if l_leap else ""),
        "can_chi": {
            "year": f"{y_can} {y_chi}",
            "month": f"{m_can} {m_chi}",
            "day": f"{d_can} {d_chi}",
        },
        "nap_am": f"{nap_am_name} ({nap_am_hanh})",
        "truc": {"name": truc_name, "type": truc_type, "desc": truc_desc},
        "tu_28": {"name": tu_name, "type": tu_type, "desc": tu_desc},
        "xung_chi": xung_chi,
        "is_xung_tuoi": is_xung_tuoi,
        "age_note": age_note,
        "directions": {
            "hy_than": hy_than,
            "tai_than": tai_than,
            "thien_dao": thien_dao,
            "thien_duc": thien_duc,
            "nguyet_duc": nguyet_duc,
        },
        "hours": hours,
        "hoang_dao_summary": hoang_dao_list,
        "score": score,
        "verdict": verdict,
        "tier": tier,
        "purpose_label": PURPOSES.get(purpose, PURPOSES["chung"]),
        "good_reasons": good_reasons or ["Ngày bình hòa, có thể tận dụng các khung giờ Hoàng Đạo."],
        "bad_reasons": bad_reasons or ["Không phạm ngày đại kỵ hay xung sát nặng."],
    }


def scan_good_days(
    start_dd: int,
    start_mm: int,
    start_yy: int,
    end_dd: int,
    end_mm: int,
    end_yy: int,
    purpose: str = "chung",
    birth_year: int = None,
    limit: int = 12,
) -> list:
    """Quét khoảng thời gian (tối đa 90 ngày) và trả về danh sách ngày tốt nhất được xếp hạng."""
    jd_start = lc.jd_from_date(start_dd, start_mm, start_yy)
    jd_end = lc.jd_from_date(end_dd, end_mm, end_yy)
    if jd_end < jd_start:
        jd_start, jd_end = jd_end, jd_start
    if jd_end - jd_start > 90:
        jd_end = jd_start + 90

    results = []
    for jd in range(jd_start, jd_end + 1):
        d, m, y = lc.jd_to_date(jd)
        ev = evaluate_day(d, m, y, purpose=purpose, birth_year=birth_year)
        results.append(ev)

    results.sort(key=lambda x: (not x["is_xung_tuoi"], x["score"]), reverse=True)
    return results[:limit]
