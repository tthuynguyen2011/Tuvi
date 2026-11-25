"""
Rule-based Tu Vi Interpretation Engine.
Synthesizes lifetime palace readings, yearly lucky/unlucky omens (Diem May / Diem Hung),
and major life milestones grounded in the reference Tu Vi texts.
"""
from lunar_calendar import NAP_AM, get_year_can_chi, hour_to_chi_index
from tuvi_engine import (
    BRIGHTNESS_FULL, SINH, KHAC, get_luu_nien_stars, get_sinh_khac
)

# Core meaning of 14 Chinh Tinh
CHINH_TINH_DESC = {
    "Tử Vi": {
        "role": "Đế Tinh (chủ tôn quý, lãnh đạo, uy quyền, che chở)",
        "cat": "Thông minh, đĩnh đạc, có tố chất quản lý, được quý nhân phò trợ, dễ nắm giữ vị trí chủ chốt.",
        "hung": "Dễ tự cao, bảo thủ; nếu cô độc (thiếu Tả Hữu) hoặc gặp Tuần/Triệt/Không Kiếp thì vất vả, quyền lực bị kiềm tỏa.",
    },
    "Thiên Cơ": {
        "role": "Thiện Tinh, Trí Tinh (chủ mưu lược, cơ biến, kỹ thuật, tham mưu)",
        "cat": "Đầu óc sắc bén, linh hoạt, giỏi tính toán, hợp nghiên cứu, tài chính, công nghệ, tư vấn.",
        "hung": "Hay suy nghĩ nhiều, dễ thay đổi chí hướng, lo âu; hãm địa dễ bôn ba hoặc bất an tâm lý.",
    },
    "Thái Dương": {
        "role": "Quý Tinh (chủ quang minh, công danh, uy tín, người cha/chồng)",
        "cat": "Quang minh chính đại, hào sảng, có tiếng tăm, thuận lợi công danh, ngoại giao, học vấn.",
        "hung": "Hãm địa (ban đêm) dễ lao tâm khổ tứ, hao tổn tinh lực, bất lợi cho mắt hoặc người nam trong nhà.",
    },
    "Vũ Khúc": {
        "role": "Tài Tinh (chủ tiền bạc, quyết đoán, kỷ luật, hành động)",
        "cat": "Thực tế, quyết đoán, có năng lực kiếm tiền và quản lý tài chính mạnh mẽ, hợp kinh doanh, ngân hàng.",
        "hung": "Tính khí cứng rắn, dễ cô độc trong tình cảm (Quả tú tinh), cần mềm mỏng để tránh xung đột.",
    },
    "Thiên Đồng": {
        "role": "Phúc Tinh (chủ phúc đức, ôn hòa, thay đổi, hưởng thụ)",
        "cat": "Hiền hòa, lạc quan, có phúc khí tự nhiên, dễ được giúp đỡ và chuyển hung hóa cát.",
        "hung": "Dễ cả thèm chóng chán, thiếu kiên định; gặp Hóa Kỵ/Sát tinh lưu ý hệ tiêu hóa và thị phi.",
    },
    "Liêm Trinh": {
        "role": "Tù Tinh / Thứ Đào Hoa (chủ nguyên tắc, pháp luật, nhiệt huyết)",
        "cat": "Liêm khiết, thẳng thắn, có khí phách và sức hút, hợp quản trị, pháp lý, nghệ thuật.",
        "hung": "Tính nóng nảy, cố chấp; gặp Sát tinh/Hóa Kỵ dễ vướng tranh chấp, giấy tờ, pháp lý hoặc tổn thương huyết khí.",
    },
    "Thiên Phủ": {
        "role": "Tài Khố Tinh (chủ kho lộc, ổn định, bảo toàn, độ lượng)",
        "cat": "Điềm đạm, giữ chữ tín, có khả năng tích lũy tài sản bền vững và hóa giải tai ách.",
        "hung": "Có xu hướng thủ thành, ngại mạo hiểm; gặp Không Kiếp/Tuần Triệt thì kho lộc dễ bị hao hụt.",
    },
    "Thái Âm": {
        "role": "Phú Tinh (chủ điền sản, tài lộc ngầm, sự tinh tế, người mẹ/vợ)",
        "cat": "Ôn nhu, sâu sắc, giỏi tích lũy bất động sản và tài chính dài hạn, có duyên với nghệ thuật.",
        "hung": "Hãm địa dễ đa sầu đa cảm, vất vả về tình cảm hoặc gia đạo; cần tránh suy nghĩ tiêu cực.",
    },
    "Tham Lang": {
        "role": "Đào Hoa Tinh / Dục Vọng Tinh (chủ giao tế, tham vọng, đa tài)",
        "cat": "Khéo léo, quảng giao, nhiều tài lẻ, nhạy bén thời cuộc; đắc Hỏa/Linh dễ bứt phá bất ngờ.",
        "hung": "Dễ sa đà hưởng thụ hoặc đứng núi này trông núi nọ; cần giữ kỷ luật để tránh hao tài.",
    },
    "Cự Môn": {
        "role": "Ám Tinh / Ngôn Ngữ Tinh (chủ ăn nói, biện luận, nghi kỵ)",
        "cat": "Tư duy phản biện sắc sảo, hùng biện giỏi, hợp giảng dạy, luật sư, truyền thông, thương mại.",
        "hung": "Dễ vướng khẩu thiệt thị phi, hiểu lầm; hãm địa hay đa nghi, cần tiết chế lời nói.",
    },
    "Thiên Tướng": {
        "role": "Ấn Tinh (chủ phò tá, chính trực, trọng nghĩa, ngoại giao)",
        "cat": "Đôn hậu, ngay thẳng, có tinh thần trách nhiệm, được tin cậy giao phó trọng trách.",
        "hung": "Dễ nóng nảy bộc trực; kỵ nhất gặp Triệt hoặc Kình/Hình dễ gãy đổ bất ngờ nếu thiếu khéo léo.",
    },
    "Thiên Lương": {
        "role": "Ấm Tinh / Giải Ách Tinh (chủ che chở, đạo đức, y dược, giáo dục)",
        "cat": "Từ tâm, chững chạc, thích giúp người, có khả năng giải trừ tai họa, sống thọ.",
        "hung": "Hãm địa dễ cô độc, hay lo bao đồng hoặc bị hiểu lầm là khắt khe, nguyên tắc quá mức.",
    },
    "Thất Sát": {
        "role": "Tướng Tinh (chủ uy dũng, khai phá, độc lập, sát phạt)",
        "cat": "Bản lĩnh, quyết liệt, dám nghĩ dám làm, có thể lập nghiệp lớn từ hai bàn tay trắng.",
        "hung": "Cuộc đời nhiều thăng trầm, dễ va chạm hoặc thương tích nếu thiếu sao chế hóa (Tử Vi, Lộc Tồn).",
    },
    "Phá Quân": {
        "role": "Hao Tinh (chủ phá cũ lập mới, cải cách, tiên phong)",
        "cat": "Sáng tạo, đột phá, không ngại gian khó, hợp làm mới, tái cấu trúc hoặc khởi nghiệp.",
        "hung": "Dễ hao tán tiền bạc, thay đổi liên tục, tình duyên trắc trở nếu thiếu Tuần/Triệt hoặc Lộc chế hóa.",
    },
}

PALACE_DOMAIN = {
    "MỆNH": "Bản ngã, tính cách cốt lõi, năng lực tự thân và định hướng cuộc đời",
    "PHỤ MẪU": "Cha mẹ, cấp trên, nền tảng gia đình và sự nâng đỡ từ bậc tiền bối",
    "PHÚC ĐỨC": "Phúc phần dòng họ, đời sống tinh thần, tâm linh và sự may mắn ngầm",
    "ĐIỀN TRẠCH": "Nhà cửa, bất động sản, môi trường sống và tài sản tích lũy lâu dài",
    "QUAN LỘC": "Sự nghiệp, công danh, vị thế xã hội và phương thức làm việc",
    "NÔ BỘC": "Bạn bè, đồng nghiệp, đối tác, nhân sự dưới quyền và các mối quan hệ xã hội",
    "THIÊN DI": "Xuất ngoại, giao tế bên ngoài, cơ hội khi đi xa và hình ảnh trước công chúng",
    "TẬT ÁCH": "Sức khỏe thể chất, tinh thần, các bệnh lý tiềm ẩn và khả năng vượt qua tai ách",
    "TÀI BẠCH": "Tài chính, khả năng kiếm tiền, quản lý dòng tiền và nguồn thu nhập",
    "TỬ TỨC": "Con cái, hậu duệ, học trò và khả năng truyền thừa",
    "PHU THÊ": "Hôn nhân, tình duyên, người bạn đời và sự hòa hợp gia đạo",
    "HUYNH ĐỆ": "Anh chị em, bạn bè thân thiết ngang hàng và sự tương trợ",
}

GOOD_STARS_MEANING = {
    "Lộc Tồn": "Tài lộc tự nhiên, sự ổn định và quý nhân che chở về tiền bạc",
    "Hóa Lộc": "Cơ hội tài chính, duyên làm ăn thuận lợi, nguồn thu dồi dào",
    "Hóa Quyền": "Quyền lực, sự quyết đoán, thăng tiến và tiếng nói có trọng lượng",
    "Hóa Khoa": "Khoa bảng, trí tuệ, uy tín, đệ nhất giải thần hóa giải tai ương",
    "Thiên Khôi": "Quý nhân phù trợ công khai, cơ hội đứng đầu hoặc gặp người nâng đỡ",
    "Thiên Việt": "Quý nhân âm thầm trợ lực, gặp may mắn bất ngờ lúc khó khăn",
    "Tả Phụ": "Có người phụ tá, đồng đội hỗ trợ đắc lực",
    "Hữu Bật": "Quý nhân đồng hành, tăng thêm sức mạnh và cơ hội thành công",
    "Văn Xương": "Năng khiếu học vấn, văn chương, bằng cấp và tư duy mạch lạc",
    "Văn Khúc": "Tài hoa, ăn nói khéo léo, nghệ thuật và sự nhạy bén",
    "Thiên Mã": "Năng động, dịch chuyển, đi xa phát tài hoặc thăng tiến nhanh",
    "Đào Hoa": "Sức hút cá nhân, duyên dáng, thuận lợi giao tiếp và tình cảm",
    "Hồng Loan": "Tin vui hỷ sự, duyên lành, thẩm mỹ và nhân duyên tốt đẹp",
    "Thiên Hỷ": "Niềm vui, tin mừng gia đạo hoặc công việc",
    "Ân Quang": "Phúc lộc trời ban, gặp dữ hóa lành, được người kính trọng",
    "Thiên Quý": "Quý nhân nâng đỡ, trọng nghĩa khí, hóa giải bệnh tật/tai ách",
    "Thiên Giải": "Sao giải ách, giảm nhẹ hung họa và tháo gỡ bế tắc",
    "Địa Giải": "Hóa giải tai ương, chuyển biến tích cực từ khó khăn",
    "Giải Thần": "Giải trừ thị phi, bệnh tật nhẹ và rắc rối nhỏ",
    "Long Trì": "Thanh cao, khéo léo, có duyên với nhà cửa/uy tín",
    "Phượng Các": "Lịch thiệp, quý phái, tin vui về danh vị hoặc nơi ở",
    "Quốc Ấn": "Ấn tín, chức vụ, chứng nhận pháp lý và sự công nhận",
}

BAD_STARS_MEANING = {
    "Hóa Kỵ": "Thị phi, hiểu lầm, áp lực tâm lý hoặc trở ngại giấy tờ/lời nói",
    "Kình Dương": "Xung đột, cạnh tranh gay gắt, nóng vội hoặc va chạm/phẫu thuật",
    "Đà La": "Trì trệ, vướng mắc kéo dài, tiểu nhân ngầm hoặc bệnh dai dẳng",
    "Địa Không": "Biến động bất ngờ, hao hụt kế hoạch, tư duy táo bạo nhưng dễ trắng tay nếu ham quá",
    "Địa Kiếp": "Thử thách đột ngột, rủi ro tài chính hoặc biến cố lớn cần đề phòng",
    "Hỏa Tinh": "Nóng nảy, bộc phát nhanh, áp lực gấp gáp hoặc tai nạn lửa/điện",
    "Linh Tinh": "Lo âu ngầm, bứt rứt, dễ căng thẳng thần kinh hoặc biến động bất ngờ",
    "Thái Tuế": "Áp lực trách nhiệm, tranh luận đúng sai, va chạm luật lệ hoặc thị phi",
    "Tang Môn": "Lo âu, buồn phiền, tang chế hoặc hao tâm tổn sức vì gia đạo",
    "Bạch Hổ": "Áp lực công việc, chuyện buồn, lưu ý xương khớp/huyết khí hoặc giấy tờ",
    "Thiên Khốc": "Ưu tư, muộn phiền, dễ khóc hoặc áp lực tinh thần",
    "Thiên Hư": "Hao tổn, hứa hẹn khó thành, sức khỏe suy giảm hoặc răng/họng",
    "Thiên Hình": "Kỷ luật nghiêm khắc, tranh chấp pháp lý hoặc dao kéo/thương tích",
    "Đại Hao": "Chi tiêu lớn, hao tán tiền bạc (cần chủ động đầu tư/mua sắm hợp lý)",
    "Tiểu Hao": "Chi tiêu lặt vặt nhiều, khó giữ tiền mặt",
    "Tuế Phá": "Bất đồng quan điểm, chống đối, hoặc lưu ý răng miệng/kế hoạch bị phá",
    "Cô Thần": "Cảm giác cô đơn, khép kín, khó chia sẻ trong lòng",
    "Quả Tú": "Khắc khẩu hoặc xa cách tình cảm, tự lập một mình",
    "Phục Binh": "Cẩn trọng người ngầm cản trở, lừa gạt hoặc sự cố bất ngờ",
    "Kiếp Sát": "Va chạm đột ngột, mất mát nhỏ hoặc cảnh giác an toàn đi lại",
    "Bệnh Phù": "Sức khỏe giảm sút, dễ mệt mỏi hoặc ốm vặt",
    "Thiên Không": "Dễ hụt hẫng, bỏ lỡ nếu quá tham vọng vật chất; hợp tu dưỡng/sáng tạo",
}


def _related_indices(chi_idx: int):
    return {
        "ban_cung": chi_idx,
        "xung_chieu": (chi_idx + 6) % 12,
        "tam_hop": [(chi_idx + 4) % 12, (chi_idx + 8) % 12],
        "giap": [(chi_idx - 1) % 12, (chi_idx + 1) % 12],
    }


def _collect_stars(palaces, chi_idx: int):
    rel = _related_indices(chi_idx)
    p = palaces[chi_idx]
    opp = palaces[rel["xung_chieu"]]
    th1 = palaces[rel["tam_hop"][0]]
    th2 = palaces[rel["tam_hop"][1]]
    return {
        "ban_cung": p,
        "xung_chieu": opp,
        "tam_hop": [th1, th2],
        "hoi_chieu_all": [p, opp, th1, th2],
    }


def _score_palace(palaces, chi_idx: int):
    ctx = _collect_stars(palaces, chi_idx)
    p = ctx["ban_cung"]
    opp = ctx["xung_chieu"]
    score = 55

    # Chinh tinh ban cung (hoac xung chieu neu VCD)
    chinh = p["chinh_tinh"]
    is_vcd = (len(chinh) == 0)
    effective_chinh = opp["chinh_tinh"] if is_vcd else chinh
    weight = 0.65 if is_vcd else 1.0

    for s in effective_chinh:
        b = s["brightness"]
        if b == "M":
            score += 14 * weight
        elif b == "V":
            score += 11 * weight
        elif b == "Đ":
            score += 7 * weight
        elif b == "H":
            score -= 10 * weight

    # Cat tinh & Sat tinh ban cung (1.0) va hoi chieu (0.45)
    for idx_group, factor in [([p], 1.0), ([opp, ctx["tam_hop"][0], ctx["tam_hop"][1]], 0.45)]:
        for pal in idx_group:
            for s in pal["cat_tinh"]:
                n = s["name"].replace("L.", "")
                if n in ("Lộc Tồn", "Hóa Lộc", "Hóa Quyền", "Hóa Khoa", "Thiên Khôi", "Thiên Việt", "Tả Phụ", "Hữu Bật"):
                    score += 6 * factor
                elif n in ("Văn Xương", "Văn Khúc", "Thiên Mã", "Ân Quang", "Thiên Quý", "Thiên Giải", "Địa Giải"):
                    score += 4 * factor
                else:
                    score += 2 * factor
            for s in pal["sat_tinh"]:
                n = s["name"].replace("L.", "")
                if n in ("Địa Không", "Địa Kiếp", "Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh", "Hóa Kỵ"):
                    score -= 6 * factor
                elif n in ("Thái Tuế", "Tang Môn", "Bạch Hổ", "Thiên Hình", "Đại Hao", "Phục Binh"):
                    score -= 3.5 * factor
                else:
                    score -= 1.5 * factor

    # Tuan / Triet
    if p["tuan"] or p["triet"]:
        if is_vcd:
            score += 8  # VCD dac Tuan/Triet
        elif any(s["brightness"] in ("M", "V") for s in chinh):
            score -= 8  # Chinh tinh sang bi Tuan/Triet ham bot
        else:
            score += 4  # Chinh tinh ham duoc Tuan/Triet giai bot xau

    return max(15, min(98, round(score)))


def detect_cach_cuc(chart):
    palaces = chart["palaces"]
    info = chart["info"]
    menh_idx = info["menh_chi_idx"]
    ctx = _collect_stars(palaces, menh_idx)

    def has_any(pal, names):
        all_names = {s["name"] for s in pal["chinh_tinh"] + pal["cat_tinh"] + pal["sat_tinh"]}
        return any(n in all_names for n in names)

    def all_hoi_names(idx):
        c = _collect_stars(palaces, idx)
        res = set()
        for pal in c["hoi_chieu_all"]:
            for s in pal["chinh_tinh"] + pal["cat_tinh"] + pal["sat_tinh"]:
                res.add(s["name"])
        return res

    menh_hoi = all_hoi_names(menh_idx)
    menh_p = palaces[menh_idx]
    menh_chinh = {s["name"] for s in menh_p["chinh_tinh"]}
    cach_list = []

    if {"Tử Vi", "Thiên Phủ"}.intersection(menh_chinh) or (
        "Tử Vi" in menh_hoi and "Thiên Phủ" in menh_hoi and "Vũ Khúc" in menh_hoi and "Thiên Tướng" in menh_hoi
    ):
        cach_list.append(("Tử Phủ Vũ Tướng", "Cát", "Bộ đế tinh – tài khố – ấn tinh hội chiếu, chủ uy tín, năng lực quản lý và hậu vận vững vàng."))

    if {"Thất Sát", "Phá Quân", "Tham Lang"}.intersection(menh_chinh):
        cach_list.append(("Sát Phá Tham", "Biến Động", "Cách cục năng động, dám nghĩ dám làm, cuộc đời nhiều bước ngoặt lớn và bứt phá mạnh mẽ."))

    if {"Thiên Cơ", "Thái Âm", "Thiên Đồng", "Thiên Lương"}.issubset(menh_hoi):
        cach_list.append(("Cơ Nguyệt Đồng Lương", "Cát", "Phù hợp công chức, chuyên môn, tham mưu, tài chính, giáo dục; cuộc sống ôn hòa và bền vững."))

    if "Thái Dương" in menh_hoi and "Thái Âm" in menh_hoi:
        if len(menh_p["chinh_tinh"]) == 0:
            cach_list.append(("Nhật Nguyệt Chiếu Hư Không", "Cát", "Cung Vô Chính Diệu được Nhật Nguyệt hội chiếu, sáng sủa thông tuệ, dễ phát triển nhờ môi trường bên ngoài."))
        else:
            cach_list.append(("Nhật Nguyệt Hội Chiếu", "Cát", "Âm Dương điều hòa, chủ trí tuệ, uy tín và khả năng thích nghi tốt."))

    if "Cự Môn" in menh_chinh and "Hóa Kỵ" in menh_hoi and ("Hóa Khoa" in menh_hoi or "Thiên Lương" in menh_hoi):
        cach_list.append(("Thạch Trung Ẩn Ngọc (biến thể)", "Quý", "Cự Môn gặp Kỵ nhưng được Khoa/Lương hóa giải, rèn giũa càng sâu sắc càng tỏa sáng."))

    if "Lộc Tồn" in menh_hoi and "Hóa Lộc" in menh_hoi:
        cach_list.append(("Song Lộc Trùng Phùng", "Đại Cát", "Hai nguồn lộc hội tụ, tài chính dồi dào và cơ hội kinh doanh/tích lũy nổi trội."))

    if "Lộc Tồn" in menh_hoi and "Thiên Mã" in menh_hoi:
        cach_list.append(("Lộc Mã Giao Trì", "Đại Cát", "Đi xa hoặc dịch chuyển công việc càng dễ sinh tài lộc, năng động phát đạt."))

    if {"Hóa Lộc", "Hóa Quyền", "Hóa Khoa"}.issubset(menh_hoi):
        cach_list.append(("Tam Hóa Liên Châu / Khoa Quyền Lộc", "Đại Cát", "Hội đủ Danh – Quyền – Lộc, rất thuận lợi thăng tiến và khẳng định vị thế."))

    if len(menh_p["chinh_tinh"]) == 0 and (menh_p["tuan"] or menh_p["triet"]):
        cach_list.append(("Mệnh Vô Chính Diệu đắc Tuần/Triệt", "Đặc Biệt", "Linh hoạt, khéo thích nghi; nhờ Tuần/Triệt án ngữ mà giữ được sự ổn định và tránh bấp bênh."))

    sat_count = sum(1 for n in ("Địa Không", "Địa Kiếp", "Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh") if n in menh_hoi)
    if sat_count >= 3:
        cach_list.append(("Hội nhiều Sát Tinh tại Tam Hợp Mệnh", "Lưu Ý", "Tính cách quyết liệt, trải nhiều thử thách rèn giũa; cần tiết chế nóng vội và giữ kỷ luật tài chính."))

    return cach_list


def analyze_palace(chart, chi_idx: int):
    palaces = chart["palaces"]
    ctx = _collect_stars(palaces, chi_idx)
    p = ctx["ban_cung"]
    opp = ctx["xung_chieu"]
    score = _score_palace(palaces, chi_idx)

    is_vcd = (len(p["chinh_tinh"]) == 0)
    chinh_list = opp["chinh_tinh"] if is_vcd else p["chinh_tinh"]

    cat_points = []
    hung_points = []
    advice = []

    if is_vcd:
        opp_names = ", ".join(f"{s['name']} ({s['brightness_full']})" for s in opp["chinh_tinh"]) or "Vô Chính Diệu"
        cat_points.append(f"Cung Vô Chính Diệu, mượn chính tinh đối cung [{opp['chi']}] ({opp_names}) chiếu về nên có tính linh hoạt cao.")
        if p["tuan"] or p["triet"]:
            cat_points.append("Có Tuần/Triệt án ngữ giúp cung Vô Chính Diệu vững vàng hơn, giảm sự bấp bênh.")
        else:
            hung_points.append("Cung Vô Chính Diệu không có Tuần/Triệt án ngữ, dễ chịu ảnh hưởng mạnh từ môi trường bên ngoài.")

    for s in chinh_list:
        meta = CHINH_TINH_DESC.get(s["name"], {})
        prefix = "(Từ đối cung) " if is_vcd else ""
        if s["brightness"] in ("M", "V", "Đ"):
            cat_points.append(f"{prefix}**{s['name']} ({s['brightness_full']})**: {meta.get('cat', '')}")
        else:
            hung_points.append(f"{prefix}**{s['name']} ({s['brightness_full']})**: {meta.get('hung', '')}")

    # Phụ tinh bản cung
    for s in p["cat_tinh"]:
        n = s["name"].replace("L.", "")
        if n in GOOD_STARS_MEANING and not s["is_luu"]:
            cat_points.append(f"**{n}**: {GOOD_STARS_MEANING[n]}.")
    for s in p["sat_tinh"]:
        n = s["name"].replace("L.", "")
        if n in BAD_STARS_MEANING and not s["is_luu"]:
            hung_points.append(f"**{n}**: {BAD_STARS_MEANING[n]}.")

    # Tam hợp hội chiếu nổi bật
    hoi_cat = []
    hoi_hung = []
    for pal in [opp] + ctx["tam_hop"]:
        for s in pal["cat_tinh"]:
            n = s["name"].replace("L.", "")
            if n in ("Lộc Tồn", "Hóa Lộc", "Hóa Quyền", "Hóa Khoa", "Thiên Khôi", "Thiên Việt", "Tả Phụ", "Hữu Bật", "Thiên Mã") and not s["is_luu"]:
                hoi_cat.append(f"{n} ({pal['chi']})")
        for s in pal["sat_tinh"]:
            n = s["name"].replace("L.", "")
            if n in ("Địa Không", "Địa Kiếp", "Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh", "Hóa Kỵ") and not s["is_luu"]:
                hoi_hung.append(f"{n} ({pal['chi']})")

    if hoi_cat:
        cat_points.append(f"Tam hợp / Xung chiếu có cát tinh trợ lực: {', '.join(dict.fromkeys(hoi_cat))}.")
    if hoi_hung:
        hung_points.append(f"Tam hợp / Xung chiếu có sát tinh cần lưu tâm: {', '.join(dict.fromkeys(hoi_hung))}.")

    if p["tuan"] or p["triet"]:
        tt = "/".join(x for x, f in [("Tuần", p["tuan"]), ("Triệt", p["triet"])] if f)
        if not is_vcd:
            hung_points.append(f"Có **{tt}** án ngữ tại cung: giai đoạn đầu dễ gặp trở ngại hoặc chậm phát, về sau mới hanh thông.")

    # Lời khuyên
    if score >= 70:
        rating = "Rất Tốt (Cát)"
        advice.append("Phát huy thế mạnh sẵn có, chủ động nắm bắt cơ hội nhưng vẫn giữ sự khiêm tốn và tích đức.")
    elif score >= 52:
        rating = "Khá / Bình Hòa"
        advice.append("Cân bằng giữa cơ hội và thách thức; phát triển từng bước chắc chắn, tránh nóng vội.")
    else:
        rating = "Nhiều Thử Thách"
        advice.append("Cần kiên nhẫn, rèn luyện kỷ luật và tu dưỡng tâm tính; tránh quyết định mạo hiểm khi vận chưa thông.")

    if any(s["name"] in ("Hóa Kỵ", "Cự Môn", "Thái Tuế") for s in p["chinh_tinh"] + p["sat_tinh"]):
        advice.append("Chú trọng lời ăn tiếng nói, văn bản giấy tờ rõ ràng để tránh thị phi hiểu lầm.")
    if any(s["name"] in ("Địa Không", "Địa Kiếp", "Đại Hao", "Phá Quân") for s in p["chinh_tinh"] + p["sat_tinh"]):
        advice.append("Quản trị tài chính chặt chẽ, tránh đầu tư lướt sóng hoặc cho vay thiếu đảm bảo.")

    # Tổng hợp diễn giải bằng lời văn chi tiết cho cung
    info = chart["info"]
    chinh_names = ", ".join(f"{s['name']} ({s['brightness_full']})" for s in chinh_list) if chinh_list else "Vô Chính Diệu"
    rel_cung_menh = get_sinh_khac(p["can_hanh"], info["ban_menh_hanh"])
    if is_vcd:
        chinh_phrase = f"là cung Vô Chính Diệu, mượn chính tinh từ cung xung chiếu {opp['display_name']} ({opp['chi']}) gồm {chinh_names}"
    else:
        chinh_phrase = f"có chính tinh {chinh_names} tọa thủ"

    tt_phrase = ""
    if p["tuan"] or p["triet"]:
        tt = "/".join(x for x, f in [("Tuần", p["tuan"]), ("Triệt", p["triet"])] if f)
        tt_phrase = (
            f" Nhờ có {tt} án ngữ nên cung Vô Chính Diệu được giữ thế ổn định."
            if is_vcd else
            f" Có {tt} đóng tại cung nên giai đoạn tiền vận cần kiên nhẫn rèn giũa, hậu vận mới phát huy rõ."
        )

    detailed_narrative = (
        f"Cung {p['display_name']} đóng tại {p['chi']} (hành {p['can_hanh']}, quan hệ {rel_cung_menh} với Bản Mệnh {info['ban_menh_hanh']}), "
        f"chủ về {PALACE_DOMAIN.get(p['name'], '').lower()}. "
        f"Cung này {chinh_phrase}.{tt_phrase} "
        f"Tổng điểm đánh giá đạt {score}/100 ({rating}). "
        + (f"Nổi bật có cát tinh hội chiếu ({', '.join(dict.fromkeys(hoi_cat[:4]))}) giúp tăng cường thuận lợi. " if hoi_cat else "")
        + (f"Lưu ý thêm các sao gây áp lực ({', '.join(dict.fromkeys(hoi_hung[:4]))}) để chủ động điều tiết và hóa giải. " if hoi_hung else "")
        + advice[0]
    )

    return {
        "chi_idx": chi_idx,
        "chi": p["chi"],
        "palace_name": p["display_name"],
        "domain": PALACE_DOMAIN.get(p["name"], ""),
        "score": score,
        "rating": rating,
        "is_vcd": is_vcd,
        "chinh_tinh": [{"name": s["name"], "brightness": s["brightness_full"]} for s in chinh_list],
        "cat_points": cat_points or ["Bình ổn, không có xung phá lớn."],
        "hung_points": hung_points or ["Không có sát tinh trọng yếu tọa thủ trực tiếp."],
        "advice": advice,
        "detailed_narrative": detailed_narrative,
    }


def analyze_year(chart, target_year: int):
    info = chart["info"]
    palaces = chart["palaces"]
    l_year = info["l_year"]
    tuoi_mu = target_year - l_year + 1
    vy_can, vy_chi, vy_can_idx, vy_chi_idx = get_year_can_chi(target_year)
    _, vy_hanh = NAP_AM[(vy_can, vy_chi)]

    # Tieu Han palace for target_year
    th_idx = next((p["chi_idx"] for p in palaces if p["tieu_han_chi"] == vy_chi), info["menh_chi_idx"])
    th_palace = palaces[th_idx]

    # Dai Van palace
    is_dong_han = tuoi_mu < info["cuc_num"]
    dv_idx = None
    if not is_dong_han:
        for p in palaces:
            if p["dai_han"] <= tuoi_mu < p["dai_han"] + 10:
                dv_idx = p["chi_idx"]
                break

    # Luu Nien stars for target_year
    luu_stars = get_luu_nien_stars(target_year)
    luu_at_th = [name for pos, name in luu_stars if pos == th_idx]
    luu_at_ltt = [name for pos, name in luu_stars if pos == vy_chi_idx]
    luu_at_menh = [name for pos, name in luu_stars if pos == info["menh_chi_idx"]]

    # Base score from Tieu Han palace + Dai Van + Year Hanh + Luu Nien
    score = _score_palace(palaces, th_idx)
    if dv_idx is not None:
        dv_score = _score_palace(palaces, dv_idx)
        score = round(score * 0.65 + dv_score * 0.35)

    # Year Ngu Hanh vs Ban Menh
    rel_hanh = get_sinh_khac(vy_hanh, info["ban_menh_hanh"])
    if rel_hanh in ("Sinh", "Bình Hòa"):
        score += 4
    elif rel_hanh == "Khắc":
        score -= 5

    # Luu Nien impact on Tieu Han & Tam Hop Tieu Han
    th_rel = _related_indices(th_idx)
    th_hoi = {th_idx, th_rel["xung_chieu"], th_rel["tam_hop"][0], th_rel["tam_hop"][1]}

    diem_may = []
    diem_hung = []

    # Check Dai Van transition
    is_dv_transition = (not is_dong_han) and any(p["dai_han"] == tuoi_mu for p in palaces)
    if is_dv_transition:
        diem_may.append(f"Năm bản lề **bước sang Đại Vận mới 10 năm** tại cung {palaces[dv_idx]['display_name']} ({palaces[dv_idx]['chi']}), mở ra chu kỳ vận hội mới.")

    # Check Ban Menh vs Luu Nien
    if rel_hanh == "Sinh":
        diem_may.append(f"Thiên thời tương trợ: Ngũ hành năm {vy_can} {vy_chi} ({vy_hanh}) sinh cho Bản Mệnh ({info['ban_menh_hanh']}).")
    elif rel_hanh == "Khắc":
        diem_hung.append(f"Ngũ hành năm ({vy_hanh}) khắc Bản Mệnh ({info['ban_menh_hanh']}), dễ hao tổn sức lực nếu làm việc quá sức.")

    # Luu Nien stars in Tam Hop Tieu Han
    good_luu = []
    bad_luu = []
    for pos, lname in luu_stars:
        if pos in th_hoi:
            if lname in ("L.Lộc Tồn", "L.Thiên Mã", "L.Đào Hoa", "L.Hồng Loan", "L.Thiên Hỷ"):
                good_luu.append(f"{lname} ({palaces[pos]['chi']})")
                score += 4 if pos == th_idx else 2
            elif lname in ("L.Kình Dương", "L.Đà La", "L.Tang Môn", "L.Bạch Hổ", "L.Thiên Khốc", "L.Thiên Hư"):
                bad_luu.append(f"{lname} ({palaces[pos]['chi']})")
                score -= 4 if pos == th_idx else 2

    if good_luu:
        diem_may.append(f"Các cát tinh lưu niên hội chiếu Tiểu Hạn: {', '.join(good_luu)} — mang lại cơ hội tài lộc, tin vui hoặc dịch chuyển thuận lợi.")
    if bad_luu:
        diem_hung.append(f"Các sao lưu động gây áp lực tại tam hợp Tiểu Hạn: {', '.join(bad_luu)} — cần chú ý sức khỏe, tinh thần và tránh nóng vội.")

    # Fixed stars at Tieu Han
    th_chinh = th_palace["chinh_tinh"]
    if not th_chinh:
        opp_p = palaces[th_rel["xung_chieu"]]
        th_chinh = opp_p["chinh_tinh"]

    for s in th_chinh:
        if s["brightness"] in ("M", "V", "Đ"):
            diem_may.append(f"Chính tinh **{s['name']} ({s['brightness_full']})** chiếu sáng cung hạn: {CHINH_TINH_DESC[s['name']]['cat']}")
        else:
            diem_hung.append(f"Chính tinh **{s['name']} ({s['brightness_full']})** ở vị trí yếu: {CHINH_TINH_DESC[s['name']]['hung']}")

    for s in th_palace["cat_tinh"]:
        n = s["name"].replace("L.", "")
        if n in ("Lộc Tồn", "Hóa Lộc", "Hóa Quyền", "Hóa Khoa", "Thiên Khôi", "Thiên Việt", "Ân Quang", "Thiên Quý", "Thiên Mã") and not s["is_luu"]:
            diem_may.append(f"**{n}** tọa thủ cung Tiểu Hạn: {GOOD_STARS_MEANING[n]}.")
    for s in th_palace["sat_tinh"]:
        n = s["name"].replace("L.", "")
        if n in ("Địa Không", "Địa Kiếp", "Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh", "Hóa Kỵ", "Tang Môn", "Bạch Hổ", "Thiên Hình", "Đại Hao") and not s["is_luu"]:
            diem_hung.append(f"**{n}** tại cung Tiểu Hạn: {BAD_STARS_MEANING[n]}.")

    # Thai Tue trung hoac xung Menh / Tieu Han
    if vy_chi_idx == info["menh_chi_idx"]:
        diem_hung.append("Năm **Trực Thái Tuế** (Lưu Thái Tuế trùng cung Mệnh): tâm lý nhiều biến động, trách nhiệm nặng nề.")
        score -= 4
    elif (vy_chi_idx - info["menh_chi_idx"]) % 12 == 6:
        diem_hung.append("Năm **Xung Thái Tuế** (Lưu Thái Tuế xung chiếu Mệnh): dễ có sự thay đổi môi trường, công việc hoặc đi lại nhiều.")
        score -= 5

    if th_idx == vy_chi_idx:
        diem_may.append("Tiểu Hạn trùng Lưu Thái Tuế: năm có tính quyết định cao, làm việc gì cũng rõ ràng trắng đen.")

    score = max(12, min(98, round(score)))
    if score >= 75:
        verdict = "Đại Cát / Bứt Phá"
        tone = "cat"
    elif score >= 60:
        verdict = "Cát Lành / Thuận Lợi"
        tone = "good"
    elif score >= 45:
        verdict = "Bình Hòa / Đan Xen"
        tone = "neutral"
    elif score >= 32:
        verdict = "Thử Thách / Thận Trọng"
        tone = "warn"
    else:
        verdict = "Hung Hạn / Cần Phòng Tránh"
        tone = "hung"

    # Lời khuyên ngắn gọn
    advice = []
    if tone in ("cat", "good"):
        advice.append("Tận dụng đà thuận lợi để triển khai kế hoạch lớn, mở rộng hợp tác hoặc học nâng cao.")
    else:
        advice.append("Ưu tiên thế thủ, giữ dòng tiền an toàn, hạn chế đầu tư mạo hiểm và chú trọng kiểm tra sức khỏe định kỳ.")
    if any("Kỵ" in x or "Thái Tuế" in x for x in diem_hung):
        advice.append("Giữ hòa khí trong giao tiếp, kiểm tra kỹ hợp đồng/giấy tờ.")

    return {
        "year": target_year,
        "year_cc": f"{vy_can} {vy_chi}",
        "year_hanh": vy_hanh,
        "tuoi_mu": tuoi_mu,
        "is_dong_han": is_dong_han,
        "is_dv_transition": is_dv_transition,
        "dai_van": {
            "chi": palaces[dv_idx]["chi"],
            "palace": palaces[dv_idx]["display_name"],
            "tuoi_range": f"{palaces[dv_idx]['dai_han']}–{palaces[dv_idx]['dai_han']+9}",
        } if dv_idx is not None else None,
        "tieu_han": {
            "chi_idx": th_idx,
            "chi": th_palace["chi"],
            "palace": th_palace["display_name"],
        },
        "luu_thai_tue": {
            "chi_idx": vy_chi_idx,
            "chi": vy_chi,
            "palace": palaces[vy_chi_idx]["display_name"],
        },
        "score": score,
        "verdict": verdict,
        "tone": tone,
        "diem_may": diem_may or ["Vận trình tương đối êm ả, giữ nhịp sống ổn định."],
        "diem_hung": diem_hung or ["Không có hung tinh lớn kích hoạt trực tiếp trong năm."],
        "advice": advice,
    }


def analyze_full_report(chart, start_year: int = 2026, num_years: int = 15):
    info = chart["info"]
    palaces = chart["palaces"]

    cach_cuc = detect_cach_cuc(chart)
    palace_readings = [analyze_palace(chart, i) for i in range(12)]
    # Sort important palaces first for lifetime reading
    order_names = [
        "MỆNH", "PHÚC ĐỨC", "QUAN LỘC", "TÀI BẠCH", "PHU THÊ",
        "TỬ TỨC", "ĐIỀN TRẠCH", "TẬT ÁCH", "THIÊN DI", "PHỤ MẪU", "HUYNH ĐỆ", "NÔ BỘC"
    ]
    palace_readings_ordered = sorted(
        palace_readings,
        key=lambda x: order_names.index(palaces[x["chi_idx"]]["name"])
    )

    yearly_readings = [analyze_year(chart, start_year + k) for k in range(num_years)]

    # Scan lifetime (age 1..85) to find major milestones
    birth_lunar_year = info["l_year"]
    milestones = []
    for age in range(1, 86):
        yr = birth_lunar_year + age - 1
        y_res = analyze_year(chart, yr)
        reasons = []
        m_type = "normal"
        if y_res["is_dv_transition"]:
            reasons.append(f"Bước vào Đại Vận {y_res['dai_van']['tuoi_range']} tuổi tại cung {y_res['dai_van']['palace']} ({y_res['dai_van']['chi']})")
            m_type = "transition"
        if y_res["score"] >= 76:
            reasons.append(f"Năm Đại Cát (điểm {y_res['score']}/100) — cơ hội bứt phá mạnh")
            m_type = "peak" if m_type == "normal" else m_type
        elif y_res["score"] <= 34:
            reasons.append(f"Năm Thử Thách Lớn (điểm {y_res['score']}/100) — cần phòng tránh rủi ro & giữ sức khỏe")
            m_type = "caution" if m_type == "normal" else m_type

        if reasons:
            milestones.append({
                "year": yr,
                "year_cc": y_res["year_cc"],
                "tuoi_mu": age,
                "type": m_type,
                "score": y_res["score"],
                "verdict": y_res["verdict"],
                "summary": " | ".join(reasons),
                "diem_may": y_res["diem_may"][:2],
                "diem_hung": y_res["diem_hung"][:2],
            })

    overall_summary = _build_overall_summary(chart, cach_cuc, palace_readings_ordered, yearly_readings)

    return {
        "cach_cuc": [{"name": n, "type": t, "desc": d} for n, t, d in cach_cuc],
        "overall_summary": overall_summary,
        "palace_readings": palace_readings_ordered,
        "yearly_readings": yearly_readings,
        "milestones": milestones,
    }


def _build_overall_summary(chart, cach_cuc, palace_readings_ordered, yearly_readings) -> dict:
    """Tổng hợp bài luận chi tiết trọn đời & định hướng thực tế cho đương số."""
    info = chart["info"]
    palaces = chart["palaces"]
    by_name = {palaces[pr["chi_idx"]]["name"]: pr for pr in palace_readings_ordered}

    # 1. Âm Dương & Cục - Mệnh
    am_duong_note = (
        f"Đương số thuộc **{info['am_duong']}**, {info['am_duong_ly']} "
        f"(Âm Dương {'thuận hòa, dễ thích nghi hoàn cảnh' if 'Thuận' in info['am_duong_ly'] else 'nghịch lý, cần nỗ lực tự thân nhiều hơn nhưng càng rèn giũa càng bản lĩnh'})."
    )
    cuc_name = info.get("cuc_name", "")
    cuc_hanh = info.get("cuc_hanh", "Thổ")
    cuc_menh_rel = get_sinh_khac(cuc_hanh, info["ban_menh_hanh"])
    if cuc_menh_rel == "Sinh":
        cm_note = f"Cục ({cuc_name}) sinh cho Bản Mệnh ({info['ban_menh']}): được hoàn cảnh và thời vận nâng đỡ."
    elif cuc_menh_rel == "Bình Hòa":
        cm_note = f"Cục ({cuc_name}) và Bản Mệnh ({info['ban_menh']}) bình hòa: nền tảng ổn định, tự chủ."
    else:
        cm_note = f"Cục ({cuc_name}) và Bản Mệnh ({info['ban_menh']}) có thế rèn giũa ({cuc_menh_rel}): thành tựu đến từ sự kiên trì và tích lũy bền bỉ."

    # 2. Thân cư đâu
    than_p = next((p for p in palaces if p.get("is_than")), None)
    than_map = {
        "MỆNH": "Thân Mệnh đồng cung: tính cách nhất quán, tự lực quyết định vận mệnh từ sớm đến hậu vận.",
        "PHÚC ĐỨC": "Thân cư Phúc Đức: hậu vận coi trọng đời sống tinh thần, gia tộc, làm phúc tích đức càng về sau càng an nhiên.",
        "QUAN LỘC": "Thân cư Quan Lộc: hậu vận gắn liền với sự nghiệp, công danh và giá trị đóng góp trong công việc.",
        "THIÊN DI": "Thân cư Thiên Di: càng đi xa, mở rộng giao tế hoặc thay đổi môi trường càng dễ phát triển và gặp quý nhân.",
        "TÀI BẠCH": "Thân cư Tài Bạch: hậu vận xoay quanh tài chính, kinh doanh và quản trị tài sản.",
        "PHU THÊ": "Thân cư Phu Thê: hậu vận gắn bó mật thiết với gia đạo và sự đồng hành của người bạn đời.",
    }
    than_note = than_map.get(than_p["name"], "") if than_p else ""

    # 3. Đánh giá 4 trụ cột: Mệnh, Quan, Tài, Phu Thê
    pillars = []
    for pname, label in [
        ("MỆNH", "Bản Mệnh & Tính Cách"),
        ("QUAN LỘC", "Sự Nghiệp (Quan Lộc)"),
        ("TÀI BẠCH", "Tài Chính (Tài Bạch)"),
        ("PHU THÊ", "Gia Đạo (Phu Thê)"),
        ("PHÚC ĐỨC", "Phúc Phần (Phúc Đức)"),
        ("TẬT ÁCH", "Sức Khỏe (Tật Ách)"),
    ]:
        pr = by_name.get(pname)
        if pr:
            pillars.append(f"**{label}** ({pr['score']}/100 — {pr['rating']}): {pr['detailed_narrative']}")

    # 4. Năm xem hạn đầu tiên
    first_yr = yearly_readings[0] if yearly_readings else None
    yr_note = ""
    if first_yr:
        yr_note = (
            f"Trong năm xem hạn **{first_yr['year']} ({first_yr['year_cc']})** ở tuổi {first_yr['tuoi_mu']} (âm lịch), "
            f"đương số đạt mức **{first_yr['score']}/100 ({first_yr['verdict']})**, đang ở Đại Vận {first_yr['dai_van']['tuoi_range']} tuổi. "
            + (first_yr["advice"][0] if first_yr["advice"] else "")
        )

    cach_names = ", ".join(n for n, _, _ in cach_cuc) if cach_cuc else "Bình hòa ổn định"
    narrative = (
        f"Lá số của đương số **{info['name']}** ({info['gender']}, sinh năm {info['l_year']} {info['year_cc']}) "
        f"nổi bật với cách cục: **{cach_names}**. {am_duong_note} {cm_note} {than_note}"
    )

    return {
        "narrative": narrative,
        "pillars": pillars,
        "year_outlook": yr_note,
        "disclaimer": "Lưu ý: Luận giải Tử Vi phản ánh xu hướng khí số bẩm sinh và vận hạn tham khảo; nỗ lực rèn luyện, đạo đức và quyết định thực tế của đương số vẫn là yếu tố then chốt.",
    }


LUU_STAR_PALACE_EFFECT = {
    "L.Thái Tuế": ("hung", "Kích hoạt áp lực, tranh luận đúng sai hoặc biến động trực tiếp tại cung này."),
    "L.Tang Môn": ("hung", "Mang lại nỗi lo âu, buồn phiền hoặc hao tâm tổn sức liên quan đến phương diện của cung."),
    "L.Bạch Hổ": ("hung", "Gây áp lực, căng thẳng, lưu ý giấy tờ hoặc sức khỏe/huyết khí tại cung này."),
    "L.Thiên Khốc": ("hung", "Dễ có chuyện ưu tư, muộn phiền hoặc trắc trở nhỏ ban đầu."),
    "L.Thiên Hư": ("hung", "Dễ hao hụt kỳ vọng, kế hoạch ở phương diện này cần thực tế hơn."),
    "L.Kình Dương": ("hung", "Tăng tính cạnh tranh, xung đột hoặc va chạm đột ngột tại cung."),
    "L.Đà La": ("hung", "Gây trì trệ, vướng mắc kéo dài hoặc tiểu nhân ngầm cản trở."),
    "L.Lộc Tồn": ("cat", "Mang lại nguồn lộc, sự ổn định và quý nhân che chở cho phương diện của cung."),
    "L.Thiên Mã": ("cat", "Thúc đẩy sự dịch chuyển, thay đổi tích cực, đi lại hoặc mở rộng cơ hội."),
    "L.Đào Hoa": ("cat", "Tăng sức hút, nhân duyên, thuận lợi giao tiếp và các mối quan hệ."),
    "L.Hồng Loan": ("cat", "Báo hiệu tin vui, hỷ sự hoặc sự gắn kết tình cảm tốt đẹp."),
    "L.Thiên Hỷ": ("cat", "Đem đến niềm vui, tinh thần phấn chấn và tin mừng trong năm."),
}


def analyze_palaces_for_year(chart, target_year: int):
    info = chart["info"]
    palaces = chart["palaces"]
    year_summary = analyze_year(chart, target_year)
    luu_stars = get_luu_nien_stars(target_year)

    th_idx = year_summary["tieu_han"]["chi_idx"]
    ltt_idx = year_summary["luu_thai_tue"]["chi_idx"]
    dv_chi = year_summary["dai_van"]["chi"] if year_summary["dai_van"] else None
    dv_idx = next((p["chi_idx"] for p in palaces if p["chi"] == dv_chi), None)

    # Nguyet han (Thang 1..12 AL) cho target_year
    h_chi_idx = hour_to_chi_index(info["hour_24"])
    thang1_idx = (th_idx - (info["l_month"] - 1) + h_chi_idx) % 12

    order_names = [
        "MỆNH", "TÀI BẠCH", "QUAN LỘC", "PHU THÊ", "PHÚC ĐỨC",
        "ĐIỀN TRẠCH", "TẬT ÁCH", "TỬ TỨC", "THIÊN DI", "PHỤ MẪU", "HUYNH ĐỆ", "NÔ BỘC"
    ]

    palaces_year = []
    for i in range(12):
        p = palaces[i]
        lunar_month = ((i - thang1_idx) % 12) + 1
        base_score = _score_palace(palaces, i)
        rel = _related_indices(i)
        opp_p = palaces[rel["xung_chieu"]]
        th1_p = palaces[rel["tam_hop"][0]]
        th2_p = palaces[rel["tam_hop"][1]]
        hoi_set = {rel["xung_chieu"], rel["tam_hop"][0], rel["tam_hop"][1]}

        roles = []
        if i == dv_idx:
            roles.append("Đại Vận 10 năm")
        if i == th_idx:
            roles.append("Tiểu Hạn năm")
        if i == ltt_idx:
            roles.append("Lưu Thái Tuế")

        luu_direct = [lname for pos, lname in luu_stars if pos == i]
        luu_xung = [lname for pos, lname in luu_stars if pos == rel["xung_chieu"]]
        luu_hoi = [f"{lname} ({palaces[pos]['chi']})" for pos, lname in luu_stars if pos in hoi_set]

        # Chinh tinh ban cung & xung chieu
        ban_chinh = [f"{s['name']} ({s['brightness_full']})" for s in p["chinh_tinh"]]
        xung_chinh = [f"{s['name']} ({s['brightness_full']})" for s in opp_p["chinh_tinh"]]

        # Cat/Hung co dinh tai cung xung chieu (quan trong khi soi cung xung cat)
        xung_cat_fixed = [
            s["name"] for s in opp_p["cat_tinh"]
            if not s["is_luu"] and s["name"] in ("Lộc Tồn", "Hóa Lộc", "Hóa Quyền", "Hóa Khoa", "Thiên Khôi", "Thiên Việt", "Tả Phụ", "Hữu Bật", "Thiên Mã", "Ân Quang", "Thiên Quý")
        ]
        xung_hung_fixed = [
            s["name"] for s in opp_p["sat_tinh"]
            if not s["is_luu"] and s["name"] in ("Địa Không", "Địa Kiếp", "Kình Dương", "Đà La", "Hỏa Tinh", "Linh Tinh", "Hóa Kỵ", "Thái Tuế", "Tang Môn", "Bạch Hổ", "Thiên Hình")
        ]

        delta = 0
        cat_notes = []
        hung_notes = []

        if i == th_idx:
            cat_notes.append(f"Cung này là **Tiểu Hạn** của năm {target_year}: mọi sự kiện trọng tâm trong năm đều xoay quanh phương diện **{p['display_name']}**.")
        if i == dv_idx:
            cat_notes.append(f"Đang nằm trong **Đại Vận {year_summary['dai_van']['tuoi_range']} tuổi**, chịu ảnh hưởng nền tảng suốt 10 năm.")

        if xung_chinh:
            cat_notes.append(f"Cung xung chiếu **[{opp_p['display_name']} - {opp_p['chi']}]** có {', '.join(xung_chinh)} chiếu thẳng về.")
        if xung_cat_fixed:
            delta += min(4, len(xung_cat_fixed) * 2)
            cat_notes.append(f"Cát tinh từ cung xung chiếu ({opp_p['chi']}): **{', '.join(xung_cat_fixed)}** hỗ trợ mạnh trong tháng {lunar_month} ÂL.")
        if xung_hung_fixed:
            delta -= min(4, len(xung_hung_fixed) * 2)
            hung_notes.append(f"Sát tinh từ cung xung chiếu ({opp_p['chi']}): **{', '.join(xung_hung_fixed)}** chiếu sang, cần lưu ý va chạm hoặc trở ngại.")

        for lname in luu_direct:
            kind, desc = LUU_STAR_PALACE_EFFECT.get(lname, ("cat", ""))
            if kind == "cat":
                delta += 6
                cat_notes.append(f"**{lname}** nhập bản cung trong tháng {lunar_month} ÂL: {desc}")
            else:
                delta -= 5
                hung_notes.append(f"**{lname}** nhập bản cung trong tháng {lunar_month} ÂL: {desc}")

        for lname in luu_xung:
            kind, _ = LUU_STAR_PALACE_EFFECT.get(lname, ("cat", ""))
            if kind == "cat":
                delta += 3
                cat_notes.append(f"**{lname}** từ cung xung chiếu ({opp_p['chi']}) chiếu thẳng vào bản cung.")
            else:
                delta -= 3
                hung_notes.append(f"**{lname}** từ cung xung chiếu ({opp_p['chi']}) xung phá sang bản cung.")

        good_hoi = [x for x in luu_hoi if any(k in x for k in ("Lộc Tồn", "Thiên Mã", "Đào Hoa", "Hồng Loan", "Thiên Hỷ"))]
        bad_hoi = [x for x in luu_hoi if any(k in x for k in ("Kình Dương", "Đà La", "Tang Môn", "Bạch Hổ", "Thiên Khốc", "Thiên Hư", "Thái Tuế"))]

        if good_hoi:
            delta += min(6, len(good_hoi) * 2)
            cat_notes.append(f"Tam hợp hội chiếu cát tinh lưu niên: {', '.join(good_hoi)}.")
        if bad_hoi:
            delta -= min(6, len(bad_hoi) * 2)
            hung_notes.append(f"Tam hợp hội chiếu sao lưu gây áp lực: {', '.join(bad_hoi)}.")

        year_score = max(12, min(98, base_score + delta))
        if delta >= 4:
            trend = "Khởi sắc (+)"
            trend_tone = "cat"
            month_advice = f"Tháng {lunar_month} ÂL thuận lợi cho phương diện {p['display_name'].lower()}; nên chủ động triển khai việc quan trọng."
        elif delta <= -4:
            trend = "Áp lực (-)"
            trend_tone = "warn"
            month_advice = f"Tháng {lunar_month} ÂL dễ phát sinh áp lực ở cung {p['display_name']}; ưu tiên giữ ổn định, tránh nóng vội hay tranh cãi."
        else:
            trend = "Ổn định"
            trend_tone = "neutral"
            month_advice = f"Tháng {lunar_month} ÂL diễn biến hài hòa, giữ nhịp độ bình thường ở phương diện {p['display_name'].lower()}."

        palaces_year.append({
            "chi_idx": i,
            "chi": p["chi"],
            "lunar_month": lunar_month,
            "palace_name": p["display_name"],
            "base_name": p["name"],
            "domain": PALACE_DOMAIN.get(p["name"], ""),
            "ban_chinh": ban_chinh or ["Vô Chính Diệu"],
            "xung_palace": f"{opp_p['display_name']} ({opp_p['chi']})",
            "xung_chinh": xung_chinh or ["Vô Chính Diệu"],
            "tam_hop": [f"{th1_p['display_name']} ({th1_p['chi']})", f"{th2_p['display_name']} ({th2_p['chi']})"],
            "roles": roles,
            "base_score": base_score,
            "year_score": year_score,
            "delta": delta,
            "trend": trend,
            "trend_tone": trend_tone,
            "luu_direct": luu_direct,
            "luu_xung": luu_xung,
            "cat_notes": cat_notes or ["Không có biến động xấu; giữ trạng thái ổn định theo lá số gốc."],
            "hung_notes": hung_notes or ["Không có hung tinh lưu niên xung phá trực tiếp tại cung này."],
            "month_advice": month_advice,
        })

    palaces_year.sort(key=lambda x: order_names.index(x["base_name"]))
    return {
        "year_summary": year_summary,
        "palaces_year": palaces_year,
    }
