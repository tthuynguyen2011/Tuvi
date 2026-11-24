"""
Thái Ất Thần Kinh Calculation Engine.
Implements:
- 16-Thần / 9-Cung Thái Ất board (5x5 layout from Cuốn IV & VII)
- Tuế Kế, Nguyệt Kế, Nhật Kế, Thời Kế (72 Khối Dương Độn / 72 Khối Âm Độn)
- Star placements: Thái Ất, Thiên Mục (Văn Xương), Địa Mục (Thủy Kích),
  Kế Thần, Định Kế, Chủ/Khách Đại Tướng & Tham Tướng, Tam Cơ, Ngũ Phúc,
  Tứ Thần, Thiên Ất, Địa Ất, Trực Phù, Thái Tuế
- Thái Ất Nhân Mệnh (Cuốn VII): Toán số Năm/Tháng/Ngày/Giờ, An Mệnh & 12 Cung
"""
from datetime import datetime
import lunar_calendar as lc

# 16 Thần clockwise order starting from Tốn (top-left) -> Tỵ -> Ngọ -> ... -> Thìn
PALACES_16_CLOCKWISE = [
    "Tốn", "Tỵ", "Ngọ", "Mùi", "Khôn", "Thân", "Dậu", "Tuất",
    "Kiền", "Hợi", "Tý", "Sửu", "Cấn", "Dần", "Mão", "Thìn",
]

# 12 Địa Chi order
CHI_12 = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"]

# 8 Chính Cung (excluding Trung Cung 5) and their Thái Ất Cửu Cung numbers
CUNG_NUMBER_MAP = {
    "Kiền": 1,
    "Ngọ": 2,
    "Cấn": 3,
    "Mão": 4,
    "Trung": 5,
    "Dậu": 6,
    "Khôn": 7,
    "Tý": 8,
    "Tốn": 9,
}

NUMBER_TO_CUNG = {v: k for k, v in CUNG_NUMBER_MAP.items()}

# Gián Thần (8 intermediate palaces) and the Chính Cung they belong to for counting
GIAN_THAN = {"Hợi", "Sửu", "Dần", "Thìn", "Tỵ", "Mùi", "Thân", "Tuất"}

# 5x5 grid coordinates (row, col) for each of the 16 palaces (center 3x3 is Trung Cung)
GRID_POS = {
    "Tốn": (0, 0), "Tỵ": (0, 1), "Ngọ": (0, 2), "Mùi": (0, 3), "Khôn": (0, 4),
    "Thìn": (1, 0),                                              "Thân": (1, 4),
    "Mão": (2, 0),                                               "Dậu": (2, 4),
    "Dần": (3, 0),                                               "Tuất": (3, 4),
    "Cấn": (4, 0), "Sửu": (4, 1), "Tý": (4, 2), "Hợi": (4, 3),  "Kiền": (4, 4),
}

PALACE_HANH = {
    "Tốn": "Mộc", "Tỵ": "Hỏa", "Ngọ": "Hỏa", "Mùi": "Thổ", "Khôn": "Thổ",
    "Thìn": "Thổ", "Thân": "Kim",
    "Mão": "Mộc", "Dậu": "Kim",
    "Dần": "Mộc", "Tuất": "Thổ",
    "Cấn": "Thổ", "Sửu": "Thổ", "Tý": "Thủy", "Hợi": "Thủy", "Kiền": "Kim",
    "Trung": "Thổ",
}

PALACE_KHI = {
    "Tốn": "Tuyệt dương", "Tỵ": "Tạp dương", "Ngọ": "Thuần dương", "Mùi": "Thuần âm", "Khôn": "Tạp âm",
    "Thìn": "Thuần dương", "Thân": "Tạp âm",
    "Mão": "Dương tạp", "Dậu": "Thuần âm",
    "Dần": "Thuần dương", "Tuất": "Tạp âm",
    "Cấn": "Thuần dương", "Sửu": "Dương tạp", "Tý": "Dương tạp", "Hợi": "Thuần âm", "Kiền": "Âm tuyệt",
    "Trung": "Trung hòa",
}

PALACE_DIRECTION = {
    "Tốn": "Đông Nam", "Tỵ": "Đông Nam", "Ngọ": "Chính Nam", "Mùi": "Tây Nam", "Khôn": "Tây Nam",
    "Thìn": "Đông Nam", "Thân": "Tây Nam",
    "Mão": "Chính Đông", "Dậu": "Chính Tây",
    "Dần": "Đông Bắc", "Tuất": "Tây Bắc",
    "Cấn": "Đông Bắc", "Sửu": "Đông Bắc", "Tý": "Chính Bắc", "Hợi": "Tây Bắc", "Kiền": "Tây Bắc",
    "Trung": "Trung Cung",
}

NHAN_MENH_12_PALACES = [
    "Mệnh", "Huynh", "Thê/Phu", "Tử", "Tài", "Điền",
    "Quan", "Nô", "Tật", "Phúc", "Tướng", "Phụ",
]

# 8-palace ring order for Thái Ất movement (skipping 5)
THAI_AT_RING_DUONG = [1, 2, 3, 4, 6, 7, 8, 9]
THAI_AT_RING_AM = [9, 8, 7, 6, 4, 3, 2, 1]


def _count_steps_16(start_palace: str, steps: int, double_on: set, clockwise: bool = True) -> str:
    """Walk `steps` (1-based: steps=1 stays on start_palace) along 16-Thần ring,
    counting 2 steps when passing through `double_on` palaces (Kiền/Khôn or Cấn/Tốn)."""
    idx = PALACES_16_CLOCKWISE.index(start_palace)
    direction = 1 if clockwise else -1
    rem = steps
    while rem > 0:
        palace = PALACES_16_CLOCKWISE[idx]
        cost = 2 if palace in double_on else 1
        if rem <= cost:
            return palace
        rem -= cost
        idx = (idx + direction) % 16
    return PALACES_16_CLOCKWISE[idx]


def _dist_16_clockwise(start_palace: str, target_palace: str) -> int:
    """Return 1-based step distance clockwise from start_palace to target_palace on 16-Thần ring."""
    i0 = PALACES_16_CLOCKWISE.index(start_palace)
    i1 = PALACES_16_CLOCKWISE.index(target_palace)
    return ((i1 - i0) % 16) + 1


def _calc_toan(muc_palace: str, thai_at_palace: str) -> dict:
    """Tính Toán Chủ / Toán Khách từ vị trí Mục (Thiên Mục / Địa Mục) đến trước cung Thái Ất (Cuốn I, mục 18).
    - Nếu Mục ở cung Chính: chỉ cộng số các cung Chính, bỏ qua mọi cung Gián.
    - Nếu Mục ở cung Gián: lấy 1 số cho cung Gián khởi đầu đó, các cung Gián khác đều không dùng.
    """
    idx = PALACES_16_CLOCKWISE.index(muc_palace)
    total = 0
    visited = []
    for step in range(16):
        pal = PALACES_16_CLOCKWISE[idx]
        if pal == thai_at_palace:
            break
        if pal in GIAN_THAN:
            val = 1 if step == 0 else 0
        else:
            val = CUNG_NUMBER_MAP[pal]
        if val > 0:
            total += val
            visited.append((pal, val))
        idx = (idx + 1) % 16
    if total == 0:
        total = 1
    dai_tuong_num = total % 10
    if dai_tuong_num == 0:
        dai_tuong_num = total // 10 if total >= 10 else 1
    if dai_tuong_num == 5:
        dai_tuong_num = 5  # Ở Trung Cung (đóng)
    tham_tuong_num = (dai_tuong_num * 3) % 10
    return {
        "toan": total,
        "dai_tuong_num": dai_tuong_num,
        "dai_tuong_cung": NUMBER_TO_CUNG.get(dai_tuong_num, "Trung"),
        "tham_tuong_num": tham_tuong_num,
        "tham_tuong_cung": NUMBER_TO_CUNG.get(tham_tuong_num, "Trung") if tham_tuong_num != 0 else "Trung",
        "visited": visited,
    }


def _place_stars_from_tich(tich_so: int, don_type: str = "Dương Độn") -> dict:
    """Core star-placement engine given `tich_so` (Tích niên / Kỷ dư / Cục số) and `don_type`."""
    ky_du = tich_so % 360
    if ky_du == 0:
        ky_du = 360
    nguyen = ((ky_du - 1) // 72) + 1
    cuc = ((ky_du - 1) % 72) + 1

    is_am = (don_type == "Âm Độn")

    # 1. Thái Ất (Ất Cả): 3 toán 1 cung, 8 cung (1..4, 6..9)
    rem_24 = ky_du % 24
    if rem_24 == 0:
        rem_24 = 24
    step_at = (rem_24 - 1) // 3  # 0..7
    thai_at_num = THAI_AT_RING_AM[step_at] if is_am else THAI_AT_RING_DUONG[step_at]
    thai_at_cung = NUMBER_TO_CUNG[thai_at_num]

    # 2. Kế Thần: Dương khởi Dần đi nghịch 12 chi; Âm khởi Thân đi nghịch 12 chi
    rem_12 = ky_du % 12
    if rem_12 == 0:
        rem_12 = 12
    start_ke = "Thân" if is_am else "Dần"
    ke_idx = (CHI_12.index(start_ke) - (rem_12 - 1)) % 12
    ke_than_cung = CHI_12[ke_idx]

    # 3. Thiên Mục (Văn Xương / Chủ Mục): trừ 18
    rem_18 = ky_du % 18
    if rem_18 == 0:
        rem_18 = 18
    if is_am:
        van_xuong_cung = _count_steps_16("Dần", rem_18, {"Cấn", "Tốn"}, clockwise=True)
    else:
        van_xuong_cung = _count_steps_16("Thân", rem_18, {"Kiền", "Khôn"}, clockwise=True)

    # 4. Địa Mục (Thủy Kích / Khách Mục): từ Kế Thần khởi Cấn đếm tới Văn Xương
    dist_vx = _dist_16_clockwise(ke_than_cung, van_xuong_cung)
    cns_idx = PALACES_16_CLOCKWISE.index("Cấn")
    thuy_kich_cung = PALACES_16_CLOCKWISE[(cns_idx + dist_vx - 1) % 16]

    # 5. Toán Chủ & Toán Khách, Đại Tướng & Tham Tướng
    chu = _calc_toan(van_xuong_cung, thai_at_cung)
    khach = _calc_toan(thuy_kich_cung, thai_at_cung)

    # 6. Tam Cơ (Quân Cơ, Thần Cơ, Dân Cơ) - Cuốn I mục 25-27
    # Dùng (tich_so + 250) % 360 hoặc quy chuẩn theo tich_so
    tam_co_tich = (tich_so + 250)
    quan_co_rem = (tam_co_tich % 360) // 30
    quan_co_cung = CHI_12[(CHI_12.index("Ngọ") + quan_co_rem) % 12]
    than_co_rem = (tam_co_tich % 36) // 3
    than_co_cung = CHI_12[(CHI_12.index("Ngọ") + than_co_rem) % 12]
    dan_co_rem = tam_co_tich % 12
    dan_co_cung = CHI_12[(CHI_12.index("Tuất") + dan_co_rem) % 12]

    # 7. Ngũ Phúc (1 Kiền, 2 Cấn, 3 Tốn, 4 Khôn, 5 Trung) - 45 toán 1 cung
    ngu_phuc_ring = ["Kiền", "Cấn", "Tốn", "Khôn", "Trung"]
    np_idx = (((tich_so + 115) % 225) // 45) % 5
    ngu_phuc_cung = ngu_phuc_ring[np_idx]

    # 8. Tứ Thần, Thiên Ất, Địa Ất, Trực Phù (3 toán 1 cung, 12 vị thuận)
    tu_than_ring = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "Tỵ", "Thân", "Dần"]
    tu_than_idx = ((tich_so % 36) // 3) % 12
    def _ring_to_palace(pos_label: str) -> str:
        if pos_label.isdigit():
            return NUMBER_TO_CUNG[int(pos_label)]
        return pos_label

    tu_than_cung = _ring_to_palace(tu_than_ring[tu_than_idx])
    thien_at_cung = _ring_to_palace(tu_than_ring[(tu_than_idx + 5) % 12])
    truc_phu_cung = _ring_to_palace(tu_than_ring[(tu_than_idx + 4) % 12])
    dia_at_cung = _ring_to_palace(tu_than_ring[(tu_than_idx + 8) % 12])

    stars_by_palace = {p: [] for p in PALACES_16_CLOCKWISE + ["Trung"]}
    stars_by_palace[thai_at_cung].append({"name": "Thái Ất (Ất Cả)", "role": "chu_te"})
    stars_by_palace[van_xuong_cung].append({"name": "Văn Xương (Thiên Mục)", "role": "chu"})
    stars_by_palace[thuy_kich_cung].append({"name": "Thủy Kích (Địa Mục)", "role": "khach"})
    stars_by_palace[ke_than_cung].append({"name": "Kế Thần", "role": "than"})
    stars_by_palace[chu["dai_tuong_cung"]].append({"name": f"Chủ Đại Tướng ({chu['dai_tuong_num']})", "role": "chu"})
    stars_by_palace[chu["tham_tuong_cung"]].append({"name": f"Chủ Tham Tướng ({chu['tham_tuong_num']})", "role": "chu"})
    stars_by_palace[khach["dai_tuong_cung"]].append({"name": f"Khách Đại Tướng ({khach['dai_tuong_num']})", "role": "khach"})
    stars_by_palace[khach["tham_tuong_cung"]].append({"name": f"Khách Tham Tướng ({khach['tham_tuong_num']})", "role": "khach"})
    stars_by_palace[quan_co_cung].append({"name": "Quân Cơ", "role": "co"})
    stars_by_palace[than_co_cung].append({"name": "Thần Cơ", "role": "co"})
    stars_by_palace[dan_co_cung].append({"name": "Dân Cơ", "role": "co"})
    stars_by_palace[ngu_phuc_cung].append({"name": "Ngũ Phúc", "role": "phuc"})
    stars_by_palace[tu_than_cung].append({"name": "Tứ Thần", "role": "than"})
    stars_by_palace[thien_at_cung].append({"name": "Thiên Ất", "role": "than"})
    stars_by_palace[dia_at_cung].append({"name": "Địa Ất", "role": "than"})
    stars_by_palace[truc_phu_cung].append({"name": "Trực Phù", "role": "than"})

    return {
        "ky_du": ky_du,
        "nguyen": nguyen,
        "cuc": cuc,
        "don_type": don_type,
        "thai_at_cung": thai_at_cung,
        "thai_at_num": thai_at_num,
        "ke_than_cung": ke_than_cung,
        "van_xuong_cung": van_xuong_cung,
        "thuy_kich_cung": thuy_kich_cung,
        "chu": chu,
        "khach": khach,
        "quan_co_cung": quan_co_cung,
        "than_co_cung": than_co_cung,
        "dan_co_cung": dan_co_cung,
        "ngu_phuc_cung": ngu_phuc_cung,
        "tu_than_cung": tu_than_cung,
        "thien_at_cung": thien_at_cung,
        "dia_at_cung": dia_at_cung,
        "truc_phu_cung": truc_phu_cung,
        "stars_by_palace": stars_by_palace,
    }


def build_divination_chart(
    dd: int,
    mm: int,
    yy: int,
    hour_24: int,
    ke_mode: str = "thoi_ke",
    question: str = "",
    topic: str = "chung",
    querent_birth_year: int = None,
) -> dict:
    """Lập Bàn Quẻ Thái Ất hỏi việc tức thời theo Thời Kế / Nhật Kế / Nguyệt Kế / Tuế Kế."""
    lunar_day, lunar_month, lunar_year, lunar_leap = lc.solar_to_lunar(dd, mm, yy)
    y_can, y_chi, y_can_i, y_chi_i = lc.get_year_can_chi(lunar_year)
    m_can, m_chi, m_can_i, m_chi_i = lc.get_month_can_chi(lunar_month, lunar_year)
    d_can, d_chi, d_can_i, d_chi_i = lc.get_day_can_chi(dd, mm, yy)
    h_chi_i = lc.hour_to_chi_index(hour_24)
    h_can, h_chi, h_can_i, _ = lc.get_hour_can_chi(d_can_i, h_chi_i)

    don_type = lc.get_don_type(dd, mm, yy, float(hour_24))
    tich_nien = 10155358 + (lunar_year - 1441)
    _, days_since_gt, dc_date = lc.get_first_giap_ty_after_dong_chi(dd, mm, yy)

    if ke_mode == "tue_ke":
        tich_so = tich_nien
        used_don = "Dương Độn"
    elif ke_mode == "nguyet_ke":
        ky_du_year = tich_nien % 360
        tich_so = ky_du_year * 12 + lunar_month
        used_don = "Dương Độn"
    elif ke_mode == "nhat_ke":
        tich_so = days_since_gt
        used_don = "Dương Độn"
    else:
        # Thời kế: 12 giờ/ngày từ ngày Giáp Tý sau Đông Chí (hoặc Hạ Chí)
        tich_so = (days_since_gt - 1) * 12 + (h_chi_i + 1)
        used_don = don_type

    board = _place_stars_from_tich(tich_so, used_don)

    # Thêm Thái Tuế (Tuế Cả) vào cung Chi năm
    if y_chi in board["stars_by_palace"]:
        board["stars_by_palace"][y_chi].append({"name": f"Thái Tuế ({y_chi})", "role": "tue"})

    # Nếu có năm sinh người hỏi, tính Nạp Âm & Mệnh đối chiếu
    querent_info = None
    if querent_birth_year:
        q_can, q_chi, _, _ = lc.get_year_can_chi(querent_birth_year)
        querent_info = lc.get_thai_at_can_chi_numbers(q_can, q_chi)
        querent_info["birth_year"] = querent_birth_year

    return {
        "mode": "divination",
        "ke_mode": ke_mode,
        "solar": {"day": dd, "month": mm, "year": yy, "hour_24": hour_24},
        "lunar": {"day": lunar_day, "month": lunar_month, "year": lunar_year, "is_leap": bool(lunar_leap)},
        "can_chi": {
            "year": f"{y_can} {y_chi}",
            "month": f"{m_can} {m_chi}",
            "day": f"{d_can} {d_chi}",
            "hour": f"{h_can} {h_chi}",
        },
        "tich_nien": tich_nien,
        "days_since_giap_ty": days_since_gt,
        "dong_chi_date": f"{dc_date[0]:02d}/{dc_date[1]:02d}/{dc_date[2]}",
        "question": question,
        "topic": topic,
        "querent": querent_info,
        "board": board,
        "palace_meta": {
            p: {
                "hanh": PALACE_HANH[p],
                "khi": PALACE_KHI[p],
                "direction": PALACE_DIRECTION[p],
                "cung_num": CUNG_NUMBER_MAP.get(p),
                "is_gian": p in GIAN_THAN,
                "grid": GRID_POS.get(p),
            }
            for p in PALACES_16_CLOCKWISE + ["Trung"]
        },
    }


def build_nhan_menh_chart(
    name: str,
    gender: str,
    dd: int,
    mm: int,
    yy: int,
    hour_24: int,
    is_lunar: bool = False,
    is_leap: bool = False,
    view_year: int = 2026,
) -> dict:
    """Lập Bảng Quẻ Ất Nhân Mệnh & Thái Ất Kể Ngày (Cuốn VII, trang 488-496)."""
    if is_lunar:
        lunar_day, lunar_month, lunar_year = dd, mm, yy
        s_dd, s_mm, s_yy = lc.lunar_to_solar(dd, mm, yy, 1 if is_leap else 0)
    else:
        s_dd, s_mm, s_yy = dd, mm, yy
        lunar_day, lunar_month, lunar_year, is_leap_num = lc.solar_to_lunar(dd, mm, yy)
        is_leap = bool(is_leap_num)

    y_can, y_chi, y_can_i, y_chi_i = lc.get_year_can_chi(lunar_year)
    m_can, m_chi, _, _ = lc.get_month_can_chi(lunar_month, lunar_year)
    d_can, d_chi, d_can_i, _ = lc.get_day_can_chi(s_dd, s_mm, s_yy)
    h_chi_i = lc.hour_to_chi_index(hour_24)
    h_can, h_chi, _, _ = lc.get_hour_can_chi(d_can_i, h_chi_i)

    # 1. Toán số Năm Tháng Ngày Giờ (Cuốn VII, mục II)
    n_year = lc.get_thai_at_can_chi_numbers(y_can, y_chi)
    n_month = lc.get_thai_at_can_chi_numbers(m_can, m_chi)
    n_day = lc.get_thai_at_can_chi_numbers(d_can, d_chi)
    n_hour = lc.get_thai_at_can_chi_numbers(h_can, h_chi)
    total_toan_so = n_year["total"] + n_month["total"] + n_day["total"] + n_hour["total"]

    # 2. Thái Ất Kể Ngày vào Cục - Nguyên (Cuốn VII, mục III)
    giap_ty_date, days_tich, dc_date = lc.get_first_giap_ty_after_dong_chi(s_dd, s_mm, s_yy)
    nhat_board = _place_stars_from_tich(days_tich, "Dương Độn")
    if y_chi in nhat_board["stars_by_palace"]:
        nhat_board["stars_by_palace"][y_chi].append({"name": f"Thái Tuế Sinh ({y_chi})", "role": "tue"})

    # 3. An Cung Mệnh & 12 Cung Nhân Mệnh (Cuốn VII, mục IV, trang 495-496)
    is_duong_year = (y_can_i % 2 == 0)
    is_male = (gender == "Nam")
    is_thuan = (is_duong_year and is_male) or ((not is_duong_year) and (not is_male))
    direction = 1 if is_thuan else -1

    # Tháng Giêng = Dần (chi_idx=2), gia lên Chi năm sinh, đếm thuận/nghịch tới Chi giờ sinh
    # Tức: tại Chi năm sinh đặt tháng sinh (chi tháng), đếm từ tháng Giêng (Dần=2) tới giờ sinh (h_chi_i)
    # Bước dịch = (h_chi_i - 2) % 12 theo chiều thuận/nghịch tính từ Chi năm sinh
    # Wait: theo ví dụ trang 495:
    # Giáp Tý (năm Tý=0), tháng Giêng (Dần=2), giờ Thìn (4): đặt Dần tại Tý, Mão tại Sửu, Thìn tại Dần -> Mệnh tại Dần!
    # Giáp Tý (năm Tý=0), tháng Giêng (Dần=2), giờ Thân (8): Dần(Tý), Mão(Sửu), Thìn(Dần), Tỵ(Mão), Ngọ(Thìn), Mùi(Tỵ), Thân(Ngọ) -> Mệnh tại Ngọ!
    # Ất Sửu (năm Sửu=1, Âm Nam đi nghịch), tháng Giêng (Dần=2), giờ Thân (8):
    # Dần(Sửu), Mão(Tý), Thìn(Hợi), Tỵ(Tuất), Ngọ(Dậu), Mùi(Thân), Thân(Mùi) -> Mệnh tại Mùi (Vị)!
    # Công thức tổng quát: từ Chi năm sinh, dịch `steps = (h_chi_i - m_chi_idx) % 12` bước?
    # Không, trong ví dụ: tháng Giêng = Dần (2), giờ Thìn (4) -> 4 - 2 = 2 bước từ Tý -> Dần (2)!
    # Với tháng m (1..12), Chi tháng = (m + 1) % 12. Đặt Chi tháng lên Chi năm, đếm từ Chi tháng tới Chi giờ?
    # Nếu tháng Giêng đặt lên Chi năm, đếm từ Dần tới giờ: steps = (h_chi_i - 2) % 12; cộng thêm (lunar_month - 1) nếu tính tháng.
    steps_from_dan = (h_chi_i - 2) % 12
    menh_chi_idx = (y_chi_i + direction * (steps_from_dan + (lunar_month - 1))) % 12
    menh_cung = CHI_12[menh_chi_idx]

    cung_12 = {}
    for i, cname in enumerate(NHAN_MENH_12_PALACES):
        c_idx = (menh_chi_idx + direction * i) % 12
        c_chi = CHI_12[c_idx]
        cung_12[cname] = c_chi
        nhat_board["stars_by_palace"][c_chi].append({"name": cname, "role": "nhan_menh"})

    # 4. Vận hạn năm xem (Tuế Kế năm view_year)
    tich_view = 10155358 + (view_year - 1441)
    view_board = _place_stars_from_tich(tich_view, "Dương Độn")
    v_can, v_chi, _, _ = lc.get_year_can_chi(view_year)
    if v_chi in view_board["stars_by_palace"]:
        view_board["stars_by_palace"][v_chi].append({"name": f"Thái Tuế {view_year} ({v_chi})", "role": "tue"})

    return {
        "mode": "nhan_menh",
        "name": name,
        "gender": gender,
        "is_thuan": is_thuan,
        "am_duong_menh": ("Dương " if is_duong_year else "Âm ") + ("Nam" if is_male else "Nữ"),
        "solar": {"day": s_dd, "month": s_mm, "year": s_yy, "hour_24": hour_24},
        "lunar": {"day": lunar_day, "month": lunar_month, "year": lunar_year, "is_leap": is_leap},
        "can_chi": {
            "year": f"{y_can} {y_chi}",
            "month": f"{m_can} {m_chi}",
            "day": f"{d_can} {d_chi}",
            "hour": f"{h_can} {h_chi}",
        },
        "toan_so": {
            "year": n_year,
            "month": n_month,
            "day": n_day,
            "hour": n_hour,
            "day_hour_sum": n_day["total"] + n_hour["total"],
            "total": total_toan_so,
        },
        "days_tich": days_tich,
        "giap_ty_date": f"{giap_ty_date[0]:02d}/{giap_ty_date[1]:02d}/{giap_ty_date[2]}",
        "dong_chi_date": f"{dc_date[0]:02d}/{dc_date[1]:02d}/{dc_date[2]}",
        "menh_cung": menh_cung,
        "cung_12": cung_12,
        "board": nhat_board,
        "view_year": view_year,
        "view_year_can_chi": f"{v_can} {v_chi}",
        "view_board": view_board,
        "palace_meta": {
            p: {
                "hanh": PALACE_HANH[p],
                "khi": PALACE_KHI[p],
                "direction": PALACE_DIRECTION[p],
                "cung_num": CUNG_NUMBER_MAP.get(p),
                "is_gian": p in GIAN_THAN,
                "grid": GRID_POS.get(p),
            }
            for p in PALACES_16_CLOCKWISE + ["Trung"]
        },
    }
