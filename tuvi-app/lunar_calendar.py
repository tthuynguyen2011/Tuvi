"""
Vietnamese Lunar Calendar (Ho Ngoc Duc algorithm, UTC+7) & Can-Chi utilities.
"""
import math

CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"]
CAN_SHORT = ["G.", "Â.", "B.", "Đ.", "M.", "K.", "C.", "T.", "N.", "Q."]
CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"]

CAN_HANH = {
    "Giáp": "Mộc", "Ất": "Mộc",
    "Bính": "Hỏa", "Đinh": "Hỏa",
    "Mậu": "Thổ", "Kỷ": "Thổ",
    "Canh": "Kim", "Tân": "Kim",
    "Nhâm": "Thủy", "Quý": "Thủy",
}

CHI_HANH = {
    "Tý": "Thủy", "Hợi": "Thủy",
    "Dần": "Mộc", "Mão": "Mộc",
    "Tỵ": "Hỏa", "Ngọ": "Hỏa",
    "Thân": "Kim", "Dậu": "Kim",
    "Thìn": "Thổ", "Tuất": "Thổ", "Sửu": "Thổ", "Mùi": "Thổ",
}

NAP_AM = {
    ("Giáp", "Tý"): ("Hải Trung Kim", "Kim"), ("Ất", "Sửu"): ("Hải Trung Kim", "Kim"),
    ("Bính", "Dần"): ("Lư Trung Hỏa", "Hỏa"), ("Đinh", "Mão"): ("Lư Trung Hỏa", "Hỏa"),
    ("Mậu", "Thìn"): ("Đại Lâm Mộc", "Mộc"), ("Kỷ", "Tỵ"): ("Đại Lâm Mộc", "Mộc"),
    ("Canh", "Ngọ"): ("Lộ Bàng Thổ", "Thổ"), ("Tân", "Mùi"): ("Lộ Bàng Thổ", "Thổ"),
    ("Nhâm", "Thân"): ("Kiếm Phong Kim", "Kim"), ("Quý", "Dậu"): ("Kiếm Phong Kim", "Kim"),
    ("Giáp", "Tuất"): ("Sơn Đầu Hỏa", "Hỏa"), ("Ất", "Hợi"): ("Sơn Đầu Hỏa", "Hỏa"),
    ("Bính", "Tý"): ("Giản Hạ Thủy", "Thủy"), ("Đinh", "Sửu"): ("Giản Hạ Thủy", "Thủy"),
    ("Mậu", "Dần"): ("Thành Đầu Thổ", "Thổ"), ("Kỷ", "Mão"): ("Thành Đầu Thổ", "Thổ"),
    ("Canh", "Thìn"): ("Bạch Lạp Kim", "Kim"), ("Tân", "Tỵ"): ("Bạch Lạp Kim", "Kim"),
    ("Nhâm", "Ngọ"): ("Dương Liễu Mộc", "Mộc"), ("Quý", "Mùi"): ("Dương Liễu Mộc", "Mộc"),
    ("Giáp", "Thân"): ("Tuyền Trung Thủy", "Thủy"), ("Ất", "Dậu"): ("Tuyền Trung Thủy", "Thủy"),
    ("Bính", "Tuất"): ("Ốc Thượng Thổ", "Thổ"), ("Đinh", "Hợi"): ("Ốc Thượng Thổ", "Thổ"),
    ("Mậu", "Tý"): ("Tích Lịch Hỏa", "Hỏa"), ("Kỷ", "Sửu"): ("Tích Lịch Hỏa", "Hỏa"),
    ("Canh", "Dần"): ("Tùng Bách Mộc", "Mộc"), ("Tân", "Mão"): ("Tùng Bách Mộc", "Mộc"),
    ("Nhâm", "Thìn"): ("Trường Lưu Thủy", "Thủy"), ("Quý", "Tỵ"): ("Trường Lưu Thủy", "Thủy"),
    ("Giáp", "Ngọ"): ("Sa Trung Kim", "Kim"), ("Ất", "Mùi"): ("Sa Trung Kim", "Kim"),
    ("Bính", "Thân"): ("Sơn Hạ Hỏa", "Hỏa"), ("Đinh", "Dậu"): ("Sơn Hạ Hỏa", "Hỏa"),
    ("Mậu", "Tuất"): ("Bình Địa Mộc", "Mộc"), ("Kỷ", "Hợi"): ("Bình Địa Mộc", "Mộc"),
    ("Canh", "Tý"): ("Bích Thượng Thổ", "Thổ"), ("Tân", "Sửu"): ("Bích Thượng Thổ", "Thổ"),
    ("Nhâm", "Dần"): ("Kim Bạch Kim", "Kim"), ("Quý", "Mão"): ("Kim Bạch Kim", "Kim"),
    ("Giáp", "Thìn"): ("Phú Đăng Hỏa", "Hỏa"), ("Ất", "Tỵ"): ("Phú Đăng Hỏa", "Hỏa"),
    ("Bính", "Ngọ"): ("Thiên Hà Thủy", "Thủy"), ("Đinh", "Mùi"): ("Thiên Hà Thủy", "Thủy"),
    ("Mậu", "Thân"): ("Đại Trạch Thổ", "Thổ"), ("Kỷ", "Dậu"): ("Đại Trạch Thổ", "Thổ"),
    ("Canh", "Tuất"): ("Thoa Xuyến Kim", "Kim"), ("Tân", "Hợi"): ("Thoa Xuyến Kim", "Kim"),
    ("Nhâm", "Tý"): ("Tang Đố Mộc", "Mộc"), ("Quý", "Sửu"): ("Tang Đố Mộc", "Mộc"),
    ("Giáp", "Dần"): ("Đại Khê Thủy", "Thủy"), ("Ất", "Mão"): ("Đại Khê Thủy", "Thủy"),
    ("Bính", "Thìn"): ("Sa Trung Thổ", "Thổ"), ("Đinh", "Tỵ"): ("Sa Trung Thổ", "Thổ"),
    ("Mậu", "Ngọ"): ("Thiên Thượng Hỏa", "Hỏa"), ("Kỷ", "Mùi"): ("Thiên Thượng Hỏa", "Hỏa"),
    ("Canh", "Thân"): ("Thạch Lựu Mộc", "Mộc"), ("Tân", "Dậu"): ("Thạch Lựu Mộc", "Mộc"),
    ("Nhâm", "Tuất"): ("Đại Hải Thủy", "Thủy"), ("Quý", "Hợi"): ("Đại Hải Thủy", "Thủy"),
}


def jd_from_date(dd: int, mm: int, yy: int) -> int:
    a = (14 - mm) // 12
    y = yy + 4800 - a
    m = mm + 12 * a - 3
    jd = dd + (153 * m + 2) // 5 + 365 * y + y // 4 - y // 100 + y // 400 - 32045
    if jd < 2299161:
        jd = dd + (153 * m + 2) // 5 + 365 * y + y // 4 - 32083
    return jd


def jd_to_date(jd: int):
    if jd > 2299160:
        a = jd + 32044
        b = (4 * a + 3) // 146097
        c = a - (b * 146097) // 4
    else:
        b = 0
        c = jd + 32082
    d = (4 * c + 3) // 1461
    e = c - (1461 * d) // 4
    m = (5 * e + 2) // 153
    day = e - (153 * m + 2) // 5 + 1
    month = m + 3 - 12 * (m // 10)
    year = b * 100 + d - 4800 + m // 10
    return day, month, year


def new_moon(k: int) -> float:
    T = k / 1236.85
    T2 = T * T
    T3 = T2 * T
    dr = math.pi / 180.0
    Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3
    Jd1 += 0.00033 * math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr)
    M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3
    Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3
    F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3
    C1 = (0.1734 - 0.000393 * T) * math.sin(M * dr) + 0.0021 * math.sin(2 * dr * M)
    C1 -= 0.4068 * math.sin(Mpr * dr) + 0.0161 * math.sin(dr * 2 * Mpr)
    C1 -= 0.0004 * math.sin(dr * 3 * Mpr)
    C1 += 0.0104 * math.sin(dr * 2 * F) - 0.0051 * math.sin(dr * (M + Mpr))
    C1 -= 0.0074 * math.sin(dr * (M - Mpr)) + 0.0004 * math.sin(dr * (2 * F + M))
    C1 -= 0.0004 * math.sin(dr * (2 * F - M)) - 0.0006 * math.sin(dr * (2 * F + Mpr))
    C1 += 0.0010 * math.sin(dr * (2 * F - Mpr)) + 0.0005 * math.sin(dr * (2 * Mpr + M))
    if T < -11:
        deltat = 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
    else:
        deltat = -0.000278 + 0.000265 * T + 0.000262 * T2
    return Jd1 + C1 - deltat


def get_new_moon_day(k: int, time_zone: float = 7.0) -> int:
    return int(math.floor(new_moon(k) + 0.5 + time_zone / 24.0))


def sun_longitude(jdn: float) -> float:
    T = (jdn - 2451545.0) / 36525.0
    T2 = T * T
    dr = math.pi / 180.0
    M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2
    L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2
    DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * math.sin(dr * M)
    DL += (0.019993 - 0.000101 * T) * math.sin(dr * 2 * M) + 0.000290 * math.sin(dr * 3 * M)
    L = L0 + DL
    L = L * dr
    L = L - math.pi * 2 * math.floor(L / (math.pi * 2))
    return L


def get_sun_longitude(day_number: int, time_zone: float = 7.0) -> int:
    return int(math.floor(sun_longitude(day_number - 0.5 - time_zone / 24.0) / math.pi * 6))


def get_lunar_month_11(yy: int, time_zone: float = 7.0) -> int:
    off = jd_from_date(31, 12, yy) - 2415021
    k = int(math.floor(off / 29.530588853))
    nm = get_new_moon_day(k, time_zone)
    sun_long = get_sun_longitude(nm, time_zone)
    if sun_long >= 9:
        nm = get_new_moon_day(k - 1, time_zone)
    return nm


def get_leap_month_offset(a11: int, time_zone: float = 7.0) -> int:
    k = int(math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5))
    last = 0
    i = 1
    arc = get_sun_longitude(get_new_moon_day(k + i, time_zone), time_zone)
    while True:
        last = arc
        i += 1
        arc = get_sun_longitude(get_new_moon_day(k + i, time_zone), time_zone)
        if not (arc != last and i < 14):
            break
    return i - 1


def solar_to_lunar(dd: int, mm: int, yy: int, time_zone: float = 7.0):
    day_number = jd_from_date(dd, mm, yy)
    k = int(math.floor((day_number - 2415021.076998695) / 29.530588853))
    month_start = get_new_moon_day(k + 1, time_zone)
    if month_start > day_number:
        month_start = get_new_moon_day(k, time_zone)
    a11 = get_lunar_month_11(yy, time_zone)
    b11 = a11
    if a11 >= month_start:
        lunar_year = yy
        a11 = get_lunar_month_11(yy - 1, time_zone)
    else:
        lunar_year = yy + 1
        b11 = get_lunar_month_11(yy + 1, time_zone)
    lunar_day = day_number - month_start + 1
    diff = int(math.floor((month_start - a11) / 29.0))
    lunar_leap = 0
    lunar_month = diff + 11
    if b11 - a11 > 365:
        leap_month_diff = get_leap_month_offset(a11, time_zone)
        if diff >= leap_month_diff:
            lunar_month = diff + 10
            if diff == leap_month_diff:
                lunar_leap = 1
    if lunar_month > 12:
        lunar_month = lunar_month - 12
    if lunar_month >= 11 and diff < 4:
        lunar_year -= 1
    return lunar_day, lunar_month, lunar_year, lunar_leap


def lunar_to_solar(lunar_day: int, lunar_month: int, lunar_year: int, lunar_leap: int = 0, time_zone: float = 7.0):
    if lunar_month < 11:
        a11 = get_lunar_month_11(lunar_year - 1, time_zone)
        b11 = get_lunar_month_11(lunar_year, time_zone)
    else:
        a11 = get_lunar_month_11(lunar_year, time_zone)
        b11 = get_lunar_month_11(lunar_year + 1, time_zone)
    off = lunar_month - 11
    if off < 0:
        off += 12
    if b11 - a11 > 365:
        leap_off = get_leap_month_offset(a11, time_zone)
        leap_month = leap_off - 2
        if leap_month < 0:
            leap_month += 12
        if lunar_leap != 0 and lunar_month != leap_month:
            return 0, 0, 0
        elif lunar_leap != 0 or off >= leap_off:
            off += 1
    k = int(math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853))
    month_start = get_new_moon_day(k + off, time_zone)
    return jd_to_date(month_start + lunar_day - 1)


def get_year_can_chi(lunar_year: int):
    can_idx = (lunar_year + 6) % 10
    chi_idx = (lunar_year + 8) % 12
    return CAN[can_idx], CHI[chi_idx], can_idx, chi_idx


def get_month_can_chi(lunar_month: int, lunar_year: int):
    year_can_idx = (lunar_year + 6) % 10
    # Thang 1 (Dan): Giap/Ky -> Binh Dan (can=2), At/Canh -> Mau Dan (4), ...
    can_idx = ((year_can_idx % 5) * 2 + 2 + (lunar_month - 1)) % 10
    chi_idx = (lunar_month + 1) % 12  # Thang 1 -> Dan (2)
    return CAN[can_idx], CHI[chi_idx], can_idx, chi_idx


def get_day_can_chi(dd: int, mm: int, yy: int):
    jd = jd_from_date(dd, mm, yy)
    can_idx = (jd + 9) % 10
    chi_idx = (jd + 1) % 12
    return CAN[can_idx], CHI[chi_idx], can_idx, chi_idx


def hour_to_chi_index(hour_24: int) -> int:
    # 23:00-00:59 -> Ty (0), 01:00-02:59 -> Suu (1), ..., 17:00-18:59 -> Dau (9)
    return ((hour_24 + 1) // 2) % 12


def get_hour_can_chi(day_can_idx: int, hour_chi_idx: int):
    # Ngu Thu Don: Giap/Ky -> Giap Ty (0), At/Canh -> Binh Ty (2), ...
    can_idx = ((day_can_idx % 5) * 2 + hour_chi_idx) % 10
    return CAN[can_idx], CHI[hour_chi_idx], can_idx, hour_chi_idx


# ============================================================
# Solar Terms (Tiet Khi) & Thai At Nap Giap / Nap Am Helpers
# ============================================================

NAP_GIAP_CAN = {
    "Nhâm": ("Thủy", 7), "Quý": ("Thủy", 7),
    "Bính": ("Hỏa", 9), "Đinh": ("Hỏa", 9),
    "Giáp": ("Mộc", 11), "Ất": ("Mộc", 11),
    "Canh": ("Kim", 13), "Tân": ("Kim", 13),
    "Mậu": ("Thổ", 15), "Kỷ": ("Thổ", 15),
}

NAP_GIAP_CHI = {
    "Hợi": ("Thủy", 7), "Tý": ("Thủy", 7),
    "Tỵ": ("Hỏa", 9), "Ngọ": ("Hỏa", 9),
    "Dần": ("Mộc", 11), "Mão": ("Mộc", 11),
    "Thân": ("Kim", 13), "Dậu": ("Kim", 13),
    "Sửu": ("Thổ", 15), "Mùi": ("Thổ", 15), "Thìn": ("Thổ", 15), "Tuất": ("Thổ", 15),
}

HANH_TO_THAI_AT_NUM = {
    "Thủy": 7,
    "Hỏa": 9,
    "Mộc": 11,
    "Kim": 13,
    "Thổ": 15,
}


def get_solar_longitude_deg(dd: int, mm: int, yy: int, hour_24: float = 12.0, time_zone: float = 7.0) -> float:
    """Return apparent sun longitude in degrees [0, 360) for a given local date/hour."""
    jdn = jd_from_date(dd, mm, yy) + (hour_24 - 12.0 - time_zone) / 24.0
    rad = sun_longitude(jdn)
    return (rad * 180.0 / math.pi) % 360.0


def find_solstice_jd(yy: int, is_winter: bool = True, time_zone: float = 7.0) -> int:
    """Find the local Julian Day Number of Winter Solstice (270 deg) or Summer Solstice (90 deg) in year yy."""
    approx_month = 12 if is_winter else 6
    target_deg = 270.0 if is_winter else 90.0
    jd_est = jd_from_date(21, approx_month, yy)
    for offset in range(-5, 6):
        jd = jd_est + offset
        dd, mm, y2 = jd_to_date(jd)
        lon0 = get_solar_longitude_deg(dd, mm, y2, 0.0, time_zone)
        dd_n, mm_n, y2_n = jd_to_date(jd + 1)
        lon1 = get_solar_longitude_deg(dd_n, mm_n, y2_n, 0.0, time_zone)
        # Check crossing target_deg
        d0 = (lon0 - target_deg + 180.0) % 360.0 - 180.0
        d1 = (lon1 - target_deg + 180.0) % 360.0 - 180.0
        if d0 <= 0 <= d1:
            return jd
    return jd_est


def get_don_type(dd: int, mm: int, yy: int, hour_24: float = 12.0, time_zone: float = 7.0) -> str:
    """Return 'Dương Độn' (after Đông Chí, before Hạ Chí) or 'Âm Độn' (after Hạ Chí, before Đông Chí)."""
    lon = get_solar_longitude_deg(dd, mm, yy, hour_24, time_zone)
    if 90.0 <= lon < 270.0:
        return "Âm Độn"
    return "Dương Độn"


def get_first_giap_ty_after_dong_chi(dd: int, mm: int, yy: int, time_zone: float = 7.0):
    """Find the most recent Đông Chí whose first Giáp Tý day is <= (dd, mm, yy), and inclusive day count."""
    target_jd = jd_from_date(dd, mm, yy)
    dc_year = yy
    dc_jd = find_solstice_jd(dc_year, is_winter=True, time_zone=time_zone)
    if dc_jd > target_jd:
        dc_year -= 1
        dc_jd = find_solstice_jd(dc_year, is_winter=True, time_zone=time_zone)

    def _first_gt(start_jd: int) -> int:
        for i in range(60):
            cand = start_jd + i
            if (cand + 9) % 10 == 0 and (cand + 1) % 12 == 0:
                return cand
        return start_jd

    giap_ty_jd = _first_gt(dc_jd)
    if giap_ty_jd > target_jd:
        dc_year -= 1
        dc_jd = find_solstice_jd(dc_year, is_winter=True, time_zone=time_zone)
        giap_ty_jd = _first_gt(dc_jd)

    days_inclusive = (target_jd - giap_ty_jd) + 1
    return jd_to_date(giap_ty_jd), days_inclusive, jd_to_date(dc_jd)


def get_thai_at_can_chi_numbers(can: str, chi: str) -> dict:
    """Compute Thái Ất Nạp Giáp & Nạp Âm numbers (Cuốn VII, trang 490-492)."""
    can_hanh, can_num = NAP_GIAP_CAN[can]
    chi_hanh, chi_num = NAP_GIAP_CHI[chi]
    nap_am_name, nap_am_hanh = NAP_AM.get((can, chi), ("Không rõ", "Thổ"))
    nap_am_num = HANH_TO_THAI_AT_NUM[nap_am_hanh]
    total = can_num + chi_num + nap_am_num
    return {
        "can": can,
        "chi": chi,
        "can_num": can_num,
        "chi_num": chi_num,
        "nap_am": nap_am_name,
        "nap_am_hanh": nap_am_hanh,
        "nap_am_num": nap_am_num,
        "total": total,
    }
