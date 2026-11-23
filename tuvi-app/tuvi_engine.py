"""
Deterministic Tu Vi Dau So An Sao Engine.
Follows Tu Vi Dau So Tan Bien & Tu Vi Khao Luan.
"""
from lunar_calendar import (
    CAN, CAN_SHORT, CHI, NAP_AM, CAN_HANH, CHI_HANH,
    solar_to_lunar, lunar_to_solar,
    get_year_can_chi, get_month_can_chi, get_day_can_chi,
    hour_to_chi_index, get_hour_can_chi,
)

PALACE_NAMES = [
    "MỆNH", "PHỤ MẪU", "PHÚC ĐỨC", "ĐIỀN TRẠCH",
    "QUAN LỘC", "NÔ BỘC", "THIÊN DI", "TẬT ÁCH",
    "TÀI BẠCH", "TỬ TỨC", "PHU THÊ", "HUYNH ĐỆ",
]

CUC_NAME = {
    2: ("Thủy Nhị Cục", "Thủy"),
    3: ("Mộc Tam Cục", "Mộc"),
    4: ("Kim Tứ Cục", "Kim"),
    5: ("Thổ Ngũ Cục", "Thổ"),
    6: ("Hỏa Lục Cục", "Hỏa"),
}

HANH_TO_CUC = {"Thủy": 2, "Mộc": 3, "Kim": 4, "Thổ": 5, "Hỏa": 6}

# Ngu Hanh Sinh Khac
SINH = {"Kim": "Thủy", "Thủy": "Mộc", "Mộc": "Hỏa", "Hỏa": "Thổ", "Thổ": "Kim"}
KHAC = {"Kim": "Mộc", "Mộc": "Thổ", "Thổ": "Thủy", "Thủy": "Hỏa", "Hỏa": "Kim"}

# Star Elements (Ngu Hanh)
STAR_HANH = {
    "Tử Vi": "Thổ", "Thiên Cơ": "Mộc", "Thái Dương": "Hỏa", "Vũ Khúc": "Kim",
    "Thiên Đồng": "Thủy", "Liêm Trinh": "Hỏa", "Thiên Phủ": "Thổ", "Thái Âm": "Thủy",
    "Tham Lang": "Thủy", "Cự Môn": "Thủy", "Thiên Tướng": "Thủy", "Thiên Lương": "Mộc",
    "Thất Sát": "Kim", "Phá Quân": "Thủy",
    # Cat tinh / Trung tinh
    "Lộc Tồn": "Thổ", "Thiên Mã": "Hỏa", "Thiên Khôi": "Hỏa", "Thiên Việt": "Hỏa",
    "Tả Phụ": "Thổ", "Hữu Bật": "Thủy", "Văn Xương": "Kim", "Văn Khúc": "Thủy",
    "Hóa Lộc": "Mộc", "Hóa Quyền": "Mộc", "Hóa Khoa": "Mộc", "Hóa Kỵ": "Thủy",
    "Đào Hoa": "Mộc", "Hồng Loan": "Thủy", "Thiên Hỷ": "Thủy",
    "Long Trì": "Thủy", "Phượng Các": "Thổ", "Giải Thần": "Mộc",
    "Thiên Giải": "Hỏa", "Địa Giải": "Thổ", "Tam Thai": "Thủy", "Bát Tọa": "Mộc",
    "Ân Quang": "Mộc", "Thiên Quý": "Thổ", "Thiên Quan": "Hỏa", "Thiên Phúc": "Thổ",
    "Thiên Tài": "Thổ", "Thiên Thọ": "Thổ", "Quốc Ấn": "Thổ", "Đường Phù": "Mộc",
    "Thai Phụ": "Kim", "Phong Cáo": "Thổ", "Thiên Trù": "Thổ", "Văn Tinh": "Hỏa",
    "Bác Sĩ": "Thủy", "Lực Sỹ": "Hỏa", "Thanh Long": "Thủy", "Tướng Quân": "Mộc",
    "Tấu Thư": "Kim", "Hỷ Thần": "Hỏa", "Thiếu Dương": "Hỏa", "Thiếu Âm": "Thủy",
    "Thiên Đức": "Hỏa", "Nguyệt Đức": "Hỏa", "Long Đức": "Thủy", "Phúc Đức": "Thổ",
    "Thiên Y": "Thủy", "Hoa Cái": "Kim",
    # Sat tinh / Bai tinh / Hung tinh
    "Kình Dương": "Kim", "Đà La": "Kim", "Địa Không": "Hỏa", "Địa Kiếp": "Hỏa",
    "Hỏa Tinh": "Hỏa", "Linh Tinh": "Hỏa", "Thái Tuế": "Hỏa", "Tang Môn": "Mộc",
    "Bạch Hổ": "Kim", "Thiên Khốc": "Thủy", "Thiên Hư": "Thủy", "Thiên Hình": "Hỏa",
    "Thiên Riêu": "Thủy", "Thiên Không": "Hỏa", "Kiếp Sát": "Hỏa", "Phá Toái": "Hỏa",
    "Cô Thần": "Thổ", "Quả Tú": "Thổ", "Đẩu Quân": "Hỏa", "Đại Hao": "Hỏa",
    "Tiểu Hao": "Hỏa", "Phục Binh": "Hỏa", "Quan Phủ": "Hỏa", "Quan Phù": "Hỏa",
    "Tuế Phá": "Hỏa", "Điếu Khách": "Hỏa", "Bệnh Phù": "Thổ", "Tử Phù": "Hỏa",
    "Trực Phù": "Kim", "Tiểu Hao (BS)": "Hỏa", "Đại Hao (BS)": "Hỏa",
    "Phi Liêm": "Hỏa", "Lưu Hà": "Thủy", "Thiên Thương": "Thổ", "Thiên Sứ": "Thủy",
    "Thiên La": "Kim", "Địa Võng": "Kim",
}

CAT_STARS = {
    "Lộc Tồn", "Thiên Mã", "Thiên Khôi", "Thiên Việt", "Tả Phụ", "Hữu Bật",
    "Văn Xương", "Văn Khúc", "Hóa Lộc", "Hóa Quyền", "Hóa Khoa",
    "Đào Hoa", "Hồng Loan", "Thiên Hỷ", "Long Trì", "Phượng Các",
    "Giải Thần", "Thiên Giải", "Địa Giải", "Tam Thai", "Bát Tọa",
    "Ân Quang", "Thiên Quý", "Thiên Quan", "Thiên Phúc", "Thiên Tài", "Thiên Thọ",
    "Quốc Ấn", "Đường Phù", "Thai Phụ", "Phong Cáo", "Thiên Trù", "Văn Tinh",
    "Bác Sĩ", "Lực Sỹ", "Thanh Long", "Tấu Thư", "Hỷ Thần",
    "Thiếu Dương", "Thiếu Âm", "Thiên Đức", "Nguyệt Đức", "Long Đức", "Phúc Đức",
    "Thiên Y", "Hoa Cái",
}

# Do sang 14 Chinh Tinh (index 0=Ty .. 11=Hoi)
BRIGHTNESS = {
    "Tử Vi":      ["B", "Đ", "M", "B", "V", "M", "M", "Đ", "M", "B", "V", "B"],
    "Thiên Cơ":   ["M", "H", "Đ", "M", "M", "V", "M", "H", "Đ", "M", "M", "V"],
    "Thái Dương": ["H", "H", "V", "M", "V", "V", "M", "Đ", "B", "H", "H", "H"],
    "Vũ Khúc":    ["V", "M", "Đ", "B", "M", "B", "V", "M", "Đ", "B", "M", "B"],
    "Thiên Đồng": ["V", "H", "Đ", "M", "B", "M", "H", "H", "V", "B", "B", "M"],
    "Liêm Trinh": ["B", "Đ", "V", "H", "M", "H", "B", "Đ", "V", "H", "M", "H"],
    "Thiên Phủ":  ["M", "M", "M", "B", "V", "Đ", "M", "M", "M", "B", "V", "Đ"],
    "Thái Âm":    ["M", "V", "H", "H", "H", "H", "H", "Đ", "V", "M", "M", "M"],
    "Tham Lang":  ["V", "M", "B", "H", "M", "H", "V", "M", "B", "H", "M", "H"],
    "Cự Môn":     ["V", "H", "M", "M", "B", "H", "V", "H", "M", "M", "B", "H"],
    "Thiên Tướng":["V", "M", "M", "H", "Đ", "Đ", "V", "Đ", "M", "H", "Đ", "Đ"],
    "Thiên Lương":["V", "Đ", "V", "M", "V", "H", "M", "Đ", "V", "H", "M", "H"],
    "Thất Sát":   ["M", "Đ", "M", "H", "B", "B", "V", "M", "M", "H", "Đ", "B"],
    "Phá Quân":   ["M", "V", "H", "B", "Đ", "H", "M", "V", "H", "B", "Đ", "H"],
}

BRIGHTNESS_FULL = {
    "M": "Miếu", "V": "Vượng", "Đ": "Đắc", "B": "Bình", "H": "Hãm"
}

TRANG_SINH_NAMES = [
    "Trường Sinh", "Mộc Dục", "Quan Đới", "Lâm Quan",
    "Đế Vượng", "Suy", "Bệnh", "Tử", "Mộ", "Tuyệt", "Thai", "Dưỡng"
]
TRANG_SINH_START = {2: 8, 3: 11, 4: 5, 5: 8, 6: 2}  # Thuy(Than), Moc(Hoi), Kim(Ty), Tho(Than), Hoa(Dan)

# Tu Hoa by Can index (Giap=0 .. Quy=9) -> (Loc, Quyen, Khoa, Ky)
TU_HOA = {
    0: ("Liêm Trinh", "Phá Quân", "Vũ Khúc", "Thái Dương"),   # Giap
    1: ("Thiên Cơ", "Thiên Lương", "Tử Vi", "Thái Âm"),       # At
    2: ("Thiên Đồng", "Thiên Cơ", "Văn Xương", "Liêm Trinh"), # Binh
    3: ("Thái Âm", "Thiên Đồng", "Thiên Cơ", "Cự Môn"),       # Dinh
    4: ("Tham Lang", "Thái Âm", "Hữu Bật", "Thiên Cơ"),       # Mau
    5: ("Vũ Khúc", "Tham Lang", "Thiên Lương", "Văn Khúc"),   # Ky
    6: ("Thái Dương", "Vũ Khúc", "Thái Âm", "Thiên Đồng"),    # Canh
    7: ("Cự Môn", "Thái Dương", "Văn Khúc", "Văn Xương"),     # Tan
    8: ("Thiên Lương", "Tử Vi", "Tả Phụ", "Vũ Khúc"),         # Nham
    9: ("Phá Quân", "Cự Môn", "Thái Âm", "Tham Lang"),        # Quy
}

LOC_TON_POS = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0]  # Giap->Dan(2) .. Quy->Ty(0)

KHOI_VIET = {
    0: (1, 7), 4: (1, 7), 6: (1, 7),   # Giap Mau Canh -> Suu, Mui
    1: (0, 8), 5: (0, 8),              # At Ky -> Ty, Than
    2: (11, 9), 3: (11, 9),            # Binh Dinh -> Hoi, Dau
    7: (6, 2),                         # Tan -> Ngo, Dan
    8: (3, 5), 9: (3, 5),              # Nham Quy -> Mao, Ty
}

# Menh Chu by Chi of Menh (0=Ty .. 11=Hoi)
MENH_CHU = [
    "Tham Lang", "Cự Môn", "Lộc Tồn", "Văn Khúc", "Liêm Trinh", "Vũ Khúc",
    "Phá Quân", "Vũ Khúc", "Liêm Trinh", "Văn Khúc", "Lộc Tồn", "Cự Môn"
]
# Than Chu by Chi of Birth Year (0=Ty .. 11=Hoi)
THAN_CHU = [
    "Linh Tinh", "Thiên Tướng", "Thiên Lương", "Thiên Đồng", "Văn Xương", "Thiên Cơ",
    "Hỏa Tinh", "Thiên Tướng", "Thiên Lương", "Thiên Đồng", "Văn Xương", "Thiên Cơ"
]


def get_sinh_khac(h1: str, h2: str) -> str:
    if h1 == h2:
        return "Bình Hòa"
    if SINH[h1] == h2:
        return "Sinh"
    if SINH[h2] == h1:
        return "Được Sinh"
    if KHAC[h1] == h2:
        return "Khắc"
    return "Bị Khắc"


def _add_star(palaces, chi_idx: int, name: str, is_chinh: bool = False, is_luu: bool = False):
    clean_name = name[2:] if name.startswith("L.") else name
    if name.startswith("LN "):
        clean_name = name[3:]
    hanh = STAR_HANH.get(clean_name, "Thổ")
    if is_chinh:
        bright = BRIGHTNESS[clean_name][chi_idx]
        palaces[chi_idx]["chinh_tinh"].append({
            "name": name, "hanh": hanh, "brightness": bright, "brightness_full": BRIGHTNESS_FULL[bright]
        })
    else:
        is_cat = clean_name in CAT_STARS
        target = "cat_tinh" if is_cat else "sat_tinh"
        palaces[chi_idx][target].append({
            "name": name, "hanh": hanh, "is_luu": is_luu
        })


def build_chart(
    name: str,
    gender: str,       # "Nam" or "Nữ"
    year: int,
    month: int,
    day: int,
    hour_24: int,
    is_lunar: bool = False,
    is_leap: bool = False,
    view_year: int = 2026,
):
    if is_lunar:
        l_day, l_month, l_year, l_leap = day, month, year, int(is_leap)
        s_day, s_month, s_year = lunar_to_solar(l_day, l_month, l_year, l_leap)
    else:
        s_day, s_month, s_year = day, month, year
        l_day, l_month, l_year, l_leap = solar_to_lunar(s_day, s_month, s_year)

    y_can, y_chi, y_can_idx, y_chi_idx = get_year_can_chi(l_year)
    m_can, m_chi, m_can_idx, m_chi_idx = get_month_can_chi(l_month, l_year)
    d_can, d_chi, d_can_idx, d_chi_idx = get_day_can_chi(s_day, s_month, s_year)
    h_chi_idx = hour_to_chi_index(hour_24)
    h_can, h_chi, h_can_idx, _ = get_hour_can_chi(d_can_idx, h_chi_idx)

    is_duong_nam_nu = (y_can_idx % 2 == 0)
    am_duong_str = f"{'Dương' if is_duong_nam_nu else 'Âm'} {gender}"
    thuan_chieu = (is_duong_nam_nu and gender == "Nam") or (not is_duong_nam_nu and gender == "Nữ")

    # Menh & Than
    menh_idx = (2 + (l_month - 1) - h_chi_idx) % 12
    than_idx = (2 + (l_month - 1) + h_chi_idx) % 12

    # Am Duong Thuan/Nghich ly (Can/Chi Menh cung duong/am voi tuoi)
    menh_duong = (menh_idx % 2 == 0)
    ad_ly = "Âm Dương Thuận Lý" if (menh_duong == is_duong_nam_nu) else "Âm Dương Nghịch Lý"

    # Ban Menh Nap Am
    ban_menh_name, ban_menh_hanh = NAP_AM[(y_can, y_chi)]

    # Can cua 12 cung (Ngu Ho Don theo Can nam sinh, khoi Dan=2)
    dan_can_idx = ((y_can_idx % 5) * 2 + 2) % 10
    palace_cans = {}
    for c_idx in range(12):
        offset_from_dan = (c_idx - 2) % 12
        palace_cans[c_idx] = (dan_can_idx + offset_from_dan) % 10

    # Cuc so dua vao Can & Chi cua cung Menh
    menh_can_name = CAN[palace_cans[menh_idx]]
    menh_chi_name = CHI[menh_idx]
    _, menh_palace_hanh = NAP_AM[(menh_can_name, menh_chi_name)]
    cuc_num = HANH_TO_CUC[menh_palace_hanh]
    cuc_name, cuc_hanh = CUC_NAME[cuc_num]

    # Sinh khac Menh - Cuc
    if cuc_hanh == ban_menh_hanh:
        menh_cuc_rel = "Mệnh Cục Bình Hòa"
    elif SINH[cuc_hanh] == ban_menh_hanh:
        menh_cuc_rel = "Cục sinh Mệnh"
    elif SINH[ban_menh_hanh] == cuc_hanh:
        menh_cuc_rel = "Mệnh sinh Cục"
    elif KHAC[cuc_hanh] == ban_menh_hanh:
        menh_cuc_rel = "Cục khắc Mệnh"
    else:
        menh_cuc_rel = "Mệnh khắc Cục"

    # Khoi tao 12 cung
    palaces = []
    for i in range(12):
        palace_offset = (i - menh_idx) % 12
        p_name = PALACE_NAMES[palace_offset]
        if p_name == "PHU THÊ" and gender == "Nữ":
            p_display = "PHU QUÂN"
        else:
            p_display = p_name
        palaces.append({
            "chi_idx": i,
            "chi": CHI[i],
            "can": CAN[palace_cans[i]],
            "can_short": CAN_SHORT[palace_cans[i]],
            "can_hanh": CAN_HANH[CAN[palace_cans[i]]],
            "name": p_name,
            "display_name": p_display,
            "is_menh": (i == menh_idx),
            "is_than": (i == than_idx),
            "dai_han": 0,
            "trang_sinh": "",
            "tieu_han_chi": "",
            "nguyet_han": 0,
            "chinh_tinh": [],
            "cat_tinh": [],
            "sat_tinh": [],
            "tuan": False,
            "triet": False,
        })

    # Dai Han
    for k in range(12):
        idx = (menh_idx + k) % 12 if thuan_chieu else (menh_idx - k) % 12
        palaces[idx]["dai_han"] = cuc_num + k * 10

    # Vong Trang Sinh
    ts_start = TRANG_SINH_START[cuc_num]
    for k, ts_name in enumerate(TRANG_SINH_NAMES):
        idx = (ts_start + k) % 12 if thuan_chieu else (ts_start - k) % 12
        palaces[idx]["trang_sinh"] = ts_name

    # Tieu Han (khoi theo Tam Hop nam sinh, Nam thuan, Nu nghich)
    # Dan-Ngo-Tuat -> Thin(4); Than-Ty-Thin -> Tuat(10); Ty-Dau-Suu -> Mui(7); Hoi-Mao-Mui -> Suu(1)
    if y_chi_idx in (2, 6, 10):
        th_start = 4
    elif y_chi_idx in (8, 0, 4):
        th_start = 10
    elif y_chi_idx in (5, 9, 1):
        th_start = 7
    else:
        th_start = 1
    for k in range(12):
        chi_of_year = (y_chi_idx + k) % 12
        pos = (th_start + k) % 12 if gender == "Nam" else (th_start - k) % 12
        palaces[pos]["tieu_han_chi"] = CHI[chi_of_year]

    # Tu Vi & 14 Chinh Tinh
    rem = l_day % cuc_num
    if rem == 0:
        q = l_day // cuc_num
        tu_vi_idx = (2 + q - 1) % 12
    else:
        borrow = cuc_num - rem
        q = (l_day + borrow) // cuc_num
        if borrow % 2 == 1:
            tu_vi_idx = (2 + q - 1 - borrow) % 12
        else:
            tu_vi_idx = (2 + q - 1 + borrow) % 12

    thien_phu_idx = (4 - tu_vi_idx) % 12

    tu_vi_offsets = [
        (0, "Tử Vi"), (-1, "Thiên Cơ"), (-3, "Thái Dương"),
        (-4, "Vũ Khúc"), (-5, "Thiên Đồng"), (-8, "Liêm Trinh")
    ]
    thien_phu_offsets = [
        (0, "Thiên Phủ"), (1, "Thái Âm"), (2, "Tham Lang"), (3, "Cự Môn"),
        (4, "Thiên Tướng"), (5, "Thiên Lương"), (6, "Thất Sát"), (10, "Phá Quân")
    ]
    star_pos = {}
    for off, s_name in tu_vi_offsets:
        pos = (tu_vi_idx + off) % 12
        star_pos[s_name] = pos
        _add_star(palaces, pos, s_name, is_chinh=True)
    for off, s_name in thien_phu_offsets:
        pos = (thien_phu_idx + off) % 12
        star_pos[s_name] = pos
        _add_star(palaces, pos, s_name, is_chinh=True)

    # Vong Thai Tue (khoi Chi nam sinh, thuan)
    thai_tue_stars = [
        "Thái Tuế", "Thiếu Dương", "Tang Môn", "Thiếu Âm", "Quan Phù", "Tử Phù",
        "Tuế Phá", "Long Đức", "Bạch Hổ", "Phúc Đức", "Điếu Khách", "Trực Phù"
    ]
    for k, s_name in enumerate(thai_tue_stars):
        _add_star(palaces, (y_chi_idx + k) % 12, s_name)

    # Vong Loc Ton & Bac Si
    loc_ton_idx = LOC_TON_POS[y_can_idx]
    _add_star(palaces, loc_ton_idx, "Lộc Tồn")
    _add_star(palaces, (loc_ton_idx + 1) % 12, "Kình Dương")
    _add_star(palaces, (loc_ton_idx - 1) % 12, "Đà La")

    bac_si_stars = [
        "Bác Sĩ", "Lực Sỹ", "Thanh Long", "Tiểu Hao (BS)", "Tướng Quân", "Tấu Thư",
        "Phi Liêm", "Hỷ Thần", "Bệnh Phù", "Đại Hao (BS)", "Phục Binh", "Quan Phủ"
    ]
    for k, s_name in enumerate(bac_si_stars):
        pos = (loc_ton_idx + k) % 12 if thuan_chieu else (loc_ton_idx - k) % 12
        _add_star(palaces, pos, s_name)

    # Vong Thien Khoi, Thien Viet
    khoi_idx, viet_idx = KHOI_VIET[y_can_idx]
    _add_star(palaces, khoi_idx, "Thiên Khôi")
    _add_star(palaces, viet_idx, "Thiên Việt")

    # Van Xuong (Tuat nghich gio), Van Khuc (Thin thuan gio)
    xuong_idx = (10 - h_chi_idx) % 12
    khuc_idx = (4 + h_chi_idx) % 12
    star_pos["Văn Xương"] = xuong_idx
    star_pos["Văn Khúc"] = khuc_idx
    _add_star(palaces, xuong_idx, "Văn Xương")
    _add_star(palaces, khuc_idx, "Văn Khúc")

    # Ta Phu (Thin thuan thang), Huu Bat (Tuat nghich thang)
    ta_idx = (4 + l_month - 1) % 12
    huu_idx = (10 - (l_month - 1)) % 12
    star_pos["Tả Phụ"] = ta_idx
    star_pos["Hữu Bật"] = huu_idx
    _add_star(palaces, ta_idx, "Tả Phụ")
    _add_star(palaces, huu_idx, "Hữu Bật")

    # Dia Khong (Hoi nghich gio), Dia Kiep (Hoi thuan gio)
    _add_star(palaces, (11 - h_chi_idx) % 12, "Địa Không")
    _add_star(palaces, (11 + h_chi_idx) % 12, "Địa Kiếp")

    # Hoa Tinh, Linh Tinh
    if y_chi_idx in (2, 6, 10):
        hoa_base, linh_base = 1, 3
    elif y_chi_idx in (8, 0, 4):
        hoa_base, linh_base = 2, 10
    elif y_chi_idx in (5, 9, 1):
        hoa_base, linh_base = 3, 10
    else:
        hoa_base, linh_base = 9, 10
    if thuan_chieu:
        _add_star(palaces, (hoa_base + h_chi_idx) % 12, "Hỏa Tinh")
        _add_star(palaces, (linh_base - h_chi_idx) % 12, "Linh Tinh")
    else:
        _add_star(palaces, (hoa_base - h_chi_idx) % 12, "Hỏa Tinh")
        _add_star(palaces, (linh_base + h_chi_idx) % 12, "Linh Tinh")

    # Tu Hoa (Loc, Quyen, Khoa, Ky)
    for hoa_name, target_star in zip(["Hóa Lộc", "Hóa Quyền", "Hóa Khoa", "Hóa Kỵ"], TU_HOA[y_can_idx]):
        if target_star in star_pos:
            _add_star(palaces, star_pos[target_star], hoa_name)

    # Thien Ma, Dao Hoa, Kiep Sat, Hoa Cai (theo Chi nam)
    if y_chi_idx in (2, 6, 10):
        ma, dao, kiep, cai = 8, 3, 11, 10
    elif y_chi_idx in (8, 0, 4):
        ma, dao, kiep, cai = 2, 9, 5, 4
    elif y_chi_idx in (5, 9, 1):
        ma, dao, kiep, cai = 11, 6, 2, 1
    else:
        ma, dao, kiep, cai = 5, 0, 8, 7
    _add_star(palaces, ma, "Thiên Mã")
    _add_star(palaces, dao, "Đào Hoa")
    _add_star(palaces, kiep, "Kiếp Sát")
    _add_star(palaces, cai, "Hoa Cái")

    # Hong Loan (Mao nghich Chi nam), Thien Hy (doi cung Hong Loan)
    hong_idx = (3 - y_chi_idx) % 12
    _add_star(palaces, hong_idx, "Hồng Loan")
    _add_star(palaces, (hong_idx + 6) % 12, "Thiên Hỷ")

    # Long Tri (Thin thuan Chi nam), Phuong Cac & Giai Than (Tuat nghich Chi nam)
    _add_star(palaces, (4 + y_chi_idx) % 12, "Long Trì")
    phuong_idx = (10 - y_chi_idx) % 12
    _add_star(palaces, phuong_idx, "Phượng Các")
    _add_star(palaces, phuong_idx, "Giải Thần")

    # Thien Khoc (Ngo nghich Chi nam), Thien Hu (Ngo thuan Chi nam)
    _add_star(palaces, (6 - y_chi_idx) % 12, "Thiên Khốc")
    _add_star(palaces, (6 + y_chi_idx) % 12, "Thiên Hư")

    # Tam Thai (Ta Phu + ngay - 1), Bat Toa (Huu Bat - (ngay - 1))
    _add_star(palaces, (ta_idx + l_day - 1) % 12, "Tam Thai")
    _add_star(palaces, (huu_idx - (l_day - 1)) % 12, "Bát Tọa")

    # An Quang (Van Xuong + ngay - 2), Thien Quy (Van Khuc - (ngay - 2))
    _add_star(palaces, (xuong_idx + l_day - 2) % 12, "Ân Quang")
    _add_star(palaces, (khuc_idx - (l_day - 2)) % 12, "Thiên Quý")

    # Thai Phu (Van Khuc + 2), Phong Cao (Van Khuc - 2)
    _add_star(palaces, (khuc_idx + 2) % 12, "Thai Phụ")
    _add_star(palaces, (khuc_idx - 2) % 12, "Phong Cáo")

    # Thien Hinh (Dau thuan thang), Thien Rieu & Thien Y (Suu thuan thang)
    _add_star(palaces, (9 + l_month - 1) % 12, "Thiên Hình")
    rieu_idx = (1 + l_month - 1) % 12
    _add_star(palaces, rieu_idx, "Thiên Riêu")
    _add_star(palaces, rieu_idx, "Thiên Y")

    # Thien Giai (Than thuan thang), Dia Giai (Mui thuan thang)
    _add_star(palaces, (8 + l_month - 1) % 12, "Thiên Giải")
    _add_star(palaces, (7 + l_month - 1) % 12, "Địa Giải")

    # Ta/Huu/Xuong/Khuc xong -> Co Than, Qua Tu
    co_map = {11: 2, 0: 2, 1: 2, 2: 5, 3: 5, 4: 5, 5: 8, 6: 8, 7: 8, 8: 11, 9: 11, 10: 11}
    co_idx = co_map[y_chi_idx]
    _add_star(palaces, co_idx, "Cô Thần")
    _add_star(palaces, (co_idx - 4) % 12, "Quả Tú")

    # Pha Toai (Dan-Than-Ty-Hoi -> Dau(9); Ty-Ngo-Mao-Dau -> Ty(5); Thin-Tuat-Suu-Mui -> Suu(1))
    if y_chi_idx in (2, 8, 5, 11):
        _add_star(palaces, 9, "Phá Toái")
    elif y_chi_idx in (0, 6, 3, 9):
        _add_star(palaces, 5, "Phá Toái")
    else:
        _add_star(palaces, 1, "Phá Toái")

    # Thien Quan, Thien Phuc (theo Can nam)
    quan_map = [7, 4, 5, 2, 3, 9, 11, 9, 10, 6]
    phuc_map = [9, 8, 0, 11, 3, 2, 6, 5, 6, 5]
    _add_star(palaces, quan_map[y_can_idx], "Thiên Quan")
    _add_star(palaces, phuc_map[y_can_idx], "Thiên Phúc")

    # Luu Ha, Thien Tru (theo Can nam)
    luu_ha_map = [9, 10, 7, 8, 5, 6, 8, 3, 11, 2]
    tru_map = [5, 6, 0, 5, 6, 8, 2, 6, 9, 10]
    _add_star(palaces, luu_ha_map[y_can_idx], "Lưu Hà")
    _add_star(palaces, tru_map[y_can_idx], "Thiên Trù")

    # Quoc An (Loc Ton + 8), Duong Phu (Loc Ton - 5)
    _add_star(palaces, (loc_ton_idx + 8) % 12, "Quốc Ấn")
    _add_star(palaces, (loc_ton_idx - 5) % 12, "Đường Phù")

    # Thien Khong (truoc Thai Tue 1 cung? Wait: Thien Khong o sau Thai Tue 1 cung = Thieu Duong)
    _add_star(palaces, (y_chi_idx + 1) % 12, "Thiên Không")

    # Thien Tai (Menh thuan Chi nam), Thien Tho (Than thuan Chi nam)
    _add_star(palaces, (menh_idx + y_chi_idx) % 12, "Thiên Tài")
    _add_star(palaces, (than_idx + y_chi_idx) % 12, "Thiên Thọ")

    # Thien Thuong (No Boc), Thien Su (Tat Ach)
    _add_star(palaces, (menh_idx + 5) % 12, "Thiên Thương")
    _add_star(palaces, (menh_idx + 7) % 12, "Thiên Sứ")

    # Thien La (Thin=4), Dia Vong (Tuat=10)
    _add_star(palaces, 4, "Thiên La")
    _add_star(palaces, 10, "Địa Võng")

    # Thien Duc (Dau thuan Chi nam), Nguyet Duc (Ty thuan Chi nam)
    _add_star(palaces, (9 + y_chi_idx) % 12, "Thiên Đức")
    _add_star(palaces, (5 + y_chi_idx) % 12, "Nguyệt Đức")

    # Dau Quan (Thai Tue nghich thang, thuan gio)
    _add_star(palaces, (y_chi_idx - (l_month - 1) + h_chi_idx) % 12, "Đẩu Quân")

    # Tuan & Triet
    # Tuan: tu Giap Ty -> Tuat Hoi; tuong ung (y_chi_idx - y_can_idx) % 12 -> hai cung truoc do
    tuan_base = (y_chi_idx - y_can_idx - 2) % 12
    palaces[tuan_base]["tuan"] = True
    palaces[(tuan_base + 1) % 12]["tuan"] = True

    # Triet: theo Can nam sinh
    triet_map = {
        0: (8, 9), 5: (8, 9),   # Giap Ky -> Than Dau
        1: (6, 7), 6: (6, 7),   # At Canh -> Ngo Mui
        2: (4, 5), 7: (4, 5),   # Binh Tan -> Thin Ty
        3: (2, 3), 8: (2, 3),   # Dinh Nham -> Dan Mao
        4: (0, 1), 9: (0, 1),   # Mau Quy -> Ty Suu
    }
    t1, t2 = triet_map[y_can_idx]
    palaces[t1]["triet"] = True
    palaces[t2]["triet"] = True

    # Nguyet Han cho nam xem (Thai Tue nam xem nghich thang sinh, thuan gio sinh -> Thang 1)
    vy_can, vy_chi, vy_can_idx, vy_chi_idx = get_year_can_chi(view_year)
    tieu_han_view_idx = next(
        (p["chi_idx"] for p in palaces if p["tieu_han_chi"] == vy_chi),
        menh_idx
    )
    thang1_idx = (tieu_han_view_idx - (l_month - 1) + h_chi_idx) % 12
    for m_off in range(12):
        palaces[(thang1_idx + m_off) % 12]["nguyet_han"] = m_off + 1

    # Sao Luu Nien cho view_year
    luu_stars = get_luu_nien_stars(view_year)
    for pos, l_name in luu_stars:
        _add_star(palaces, pos, l_name, is_luu=True)

    # Xac dinh Dai Van hien tai cho view_year
    tuoi_mu = view_year - l_year + 1
    dai_van_palace = None
    if tuoi_mu >= cuc_num:
        for p in palaces:
            if p["dai_han"] <= tuoi_mu < p["dai_han"] + 10:
                dai_van_palace = p["chi_idx"]
                break

    return {
        "info": {
            "name": name,
            "gender": gender,
            "solar": f"{s_day:02d}/{s_month:02d}/{s_year}",
            "lunar": f"{l_day:02d}/{l_month:02d}/{l_year}" + (" (Nhuận)" if l_leap else ""),
            "s_day": s_day, "s_month": s_month, "s_year": s_year,
            "l_day": l_day, "l_month": l_month, "l_year": l_year, "l_leap": bool(l_leap),
            "hour_24": hour_24,
            "year_cc": f"{y_can} {y_chi}",
            "month_cc": f"{m_can} {m_chi}",
            "day_cc": f"{d_can} {d_chi}",
            "hour_cc": f"{h_can} {h_chi}",
            "view_year": view_year,
            "view_year_cc": f"{vy_can} {vy_chi}",
            "tuoi_mu": tuoi_mu,
            "am_duong": am_duong_str,
            "am_duong_ly": ad_ly,
            "thuan_chieu": thuan_chieu,
            "ban_menh": ban_menh_name,
            "ban_menh_hanh": ban_menh_hanh,
            "cuc_num": cuc_num,
            "cuc_name": cuc_name,
            "cuc_hanh": cuc_hanh,
            "menh_cuc_rel": menh_cuc_rel,
            "menh_chi_idx": menh_idx,
            "menh_chi": CHI[menh_idx],
            "than_chi_idx": than_idx,
            "than_chi": CHI[than_idx],
            "than_cu": palaces[than_idx]["display_name"],
            "menh_chu": MENH_CHU[menh_idx],
            "than_chu": THAN_CHU[y_chi_idx],
            "tieu_han_chi_idx": tieu_han_view_idx,
            "dai_van_chi_idx": dai_van_palace,
            "luu_thai_tue_idx": vy_chi_idx,
        },
        "palaces": palaces,
    }


def get_luu_nien_stars(view_year: int):
    _, _, vy_can_idx, vy_chi_idx = get_year_can_chi(view_year)
    res = [
        (vy_chi_idx, "L.Thái Tuế"),
        ((vy_chi_idx + 2) % 12, "L.Tang Môn"),
        ((vy_chi_idx + 8) % 12, "L.Bạch Hổ"),
        ((6 - vy_chi_idx) % 12, "L.Thiên Khốc"),
        ((6 + vy_chi_idx) % 12, "L.Thiên Hư"),
    ]
    loc = LOC_TON_POS[vy_can_idx]
    res.append((loc, "L.Lộc Tồn"))
    res.append(((loc + 1) % 12, "L.Kình Dương"))
    res.append(((loc - 1) % 12, "L.Đà La"))

    # L.Thien Ma, L.Dao Hoa
    if vy_chi_idx in (2, 6, 10):
        ma, dao = 8, 3
    elif vy_chi_idx in (8, 0, 4):
        ma, dao = 2, 9
    elif vy_chi_idx in (5, 9, 1):
        ma, dao = 11, 6
    else:
        ma, dao = 5, 0
    res.append((ma, "L.Thiên Mã"))
    res.append((dao, "L.Đào Hoa"))

    hong = (3 - vy_chi_idx) % 12
    res.append((hong, "L.Hồng Loan"))
    res.append(((hong + 6) % 12, "L.Thiên Hỷ"))
    return res
