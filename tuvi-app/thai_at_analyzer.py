"""
Thái Ất Thần Kinh Interactive Analyzer & Consultation Engine.
Implements interpretation rules from Cuốn II, IV, V, VII:
- Toán Hòa / Không Hòa / Ba Tài Không Toán
- Cách Cục Thái Ất: Ếm (Yểm), Kích, Ép (Bức), Giam (Quan), Đối (Xung), Phát
- Interactive Q&A refinement (Chủ vs Khách stance, urgency, topic-specific advice)
- Thái Ất Nhân Mệnh analysis (Cuốn VII)
"""
from thai_at_engine import PALACES_16_CLOCKWISE, CUNG_NUMBER_MAP, PALACE_HANH, PALACE_KHI, PALACE_DIRECTION

TOAN_RAT_HOA = {14, 18}
TOAN_KHA_HOA = {23, 29, 32, 36}
TOAN_HOI_HOA = {12, 16, 21, 27, 34, 38}
TOAN_DUONG_TRUNG_TAP = {13, 19, 31, 37}
TOAN_AM_TRUNG_TAP = {24, 28}
TOAN_DUONG_TRUNG_AM = {11, 17}
TOAN_THUAN_DUONG = {33, 39}
TOAN_THUAN_AM = {22, 26}

TOPIC_LABELS = {
    "chung": "Tổng quát / Vận khí hiện tại",
    "cong_danh": "Công danh / Sự nghiệp / Thăng tiến",
    "tai_loc": "Kinh doanh / Tài lộc / Đầu tư",
    "tinh_cam": "Hôn nhân / Gia đạo / Nhân duyên",
    "suc_khoe": "Sức khỏe / Tai ách / Bình an",
    "xuat_hanh": "Xuất hành / Giao dịch / Mưu sự",
}

HANH_SINH = {"Mộc": "Hỏa", "Hỏa": "Thổ", "Thổ": "Kim", "Kim": "Thủy", "Thủy": "Mộc"}
HANH_KHAC = {"Mộc": "Thổ", "Thổ": "Thủy", "Thủy": "Hỏa", "Hỏa": "Kim", "Kim": "Mộc"}


def evaluate_toan(toan_val: int, label: str = "Chủ") -> dict:
    """Đánh giá Số Toán theo Cuốn V, Phần I (Số Ất Trời Lẻ Chẵn)."""
    issues = []
    if toan_val in TOAN_RAT_HOA:
        level, score, desc = "Rất hòa (Thượng hòa)", 3, "Trời đất khánh hội, âm dương giao thông, mưu sự dễ thành, gặp quý nhân trợ lực."
    elif toan_val in TOAN_KHA_HOA:
        level, score, desc = "Khá hòa (Trung hòa)", 2, "Phúc lộc bền vững, ít tai nạn, tiến triển ổn định và thuận lợi."
    elif toan_val in TOAN_HOI_HOA:
        level, score, desc = "Hơi hòa (Hạ hòa)", 1, "Tài lợi đầy đủ, trở ngại nhỏ có thể hóa giải, nên tiến từng bước."
    elif toan_val in TOAN_DUONG_TRUNG_TAP:
        level, score, desc = "Dương trùng tạp", -1, "Khí dương pha tạp, dễ gặp việc dở dang hoặc chậm trễ, cần giữ sự điềm tĩnh."
    elif toan_val in TOAN_AM_TRUNG_TAP:
        level, score, desc = "Âm trùng tạp", -1, "Khí âm pha tạp, dễ hao tổn hoặc việc khó thành ngay, tránh đầu tư mạo hiểm."
    elif toan_val in TOAN_DUONG_TRUNG_AM:
        level, score, desc = "Dương trùng trong âm", -2, "Âm dương lẫn lộn, dễ gặp cản trở hoặc áp lực tinh thần, cần minh bạch."
    elif toan_val in TOAN_THUAN_DUONG:
        level, score, desc = "Thuần dương (Cương quá)", -1, "Thế quá cứng, dễ gãy nếu thiếu mềm dẻo; cẩn trọng tranh chấp trực diện."
    elif toan_val in TOAN_THUAN_AM:
        level, score, desc = "Thuần âm (Nhu quá)", -1, "Thế nhu nhược, thiếu quyết đoán hoặc dễ bị động trước ngoại cảnh."
    else:
        if toan_val >= 10:
            level, score, desc = "Toán dài bình hòa", 1, "Toán số đủ dài, lực lượng có hậu thuẫn, tùy cách cục mà hành động."
        else:
            level, score, desc = "Toán ngắn (Đơn)", -1, "Toán số ngắn, lực mỏng, nên thủ thế và tích lũy thêm trước khi mở rộng."

    # Ba Tài Không Toán (Cuốn V, trang 300)
    if 1 <= toan_val <= 9:
        issues.append("Không số Trời (1–9): Thiếu thiên thời/hỗ trợ bề trên, cần tự lực và giữ chính đạo.")
    if toan_val % 10 in (1, 2, 3, 4):
        issues.append("Không số Đất (hàng đơn vị 1–4): Nền tảng vật chất/hậu phương chưa vững, tránh dàn trải.")
    if toan_val % 10 == 0:
        issues.append("Không số Người (hàng đơn vị 0): Thiếu nhân hòa hoặc người đồng hành, đề phòng hiểu lầm.")

    return {
        "label": label,
        "toan": toan_val,
        "level": level,
        "score": score,
        "desc": desc,
        "ba_tai_issues": issues,
    }


def evaluate_patterns(board: dict) -> list:
    """Phát hiện các Cách Cục Thái Ất: Ếm, Kích, Ép, Giam, Đối, Phát."""
    patterns = []
    at_cung = board["thai_at_cung"]
    vx_cung = board["van_xuong_cung"]
    tk_cung = board["thuy_kich_cung"]
    chu_dai = board["chu"]["dai_tuong_cung"]
    khach_dai = board["khach"]["dai_tuong_cung"]

    idx_at = PALACES_16_CLOCKWISE.index(at_cung)
    idx_vx = PALACES_16_CLOCKWISE.index(vx_cung)
    idx_tk = PALACES_16_CLOCKWISE.index(tk_cung)

    # 1. Ếm (Yểm): Thủy Kích tới cùng cung Ất Cả
    if tk_cung == at_cung:
        patterns.append({
            "name": "Ếm (Yểm)",
            "severity": "hung",
            "detail": f"Thủy Kích đồng cung với Thái Ất tại {at_cung}: có sự che khuất, trở ngại ngầm hoặc việc khó minh bạch ngay; nên làm phúc đức, kiểm tra kỹ giấy tờ/đối tác.",
        })

    # 2. Kích: Thủy Kích ở trước/sau (cách 1-2 cung) hoặc đối xung (cách 8 cung) với Ất Cả
    dist_tk = (idx_tk - idx_at) % 16
    if dist_tk in (1, 2, 14, 15):
        kind = "Ngoài kích" if dist_tk in (1, 2) else "Trong kích"
        patterns.append({
            "name": f"Thủy Kích ({kind})",
            "severity": "canh_bao",
            "detail": f"Thủy Kích tại {tk_cung} áp sát Thái Ất tại {at_cung}: dễ phát sinh biến động bất ngờ, khẩu thiệt hoặc cạnh tranh gay gắt.",
        })
    elif dist_tk == 8:
        patterns.append({
            "name": "Cung Kích (Đối xung)",
            "severity": "hung",
            "detail": f"Thủy Kích tại {tk_cung} đối xung trực diện Thái Ất tại {at_cung}: thế đối đầu rõ rệt, tránh nóng vội đối kháng trực tiếp.",
        })

    # 3. Ép (Bức): Văn Xương áp sát Thái Ất
    dist_vx = (idx_vx - idx_at) % 16
    if vx_cung == at_cung:
        patterns.append({
            "name": "Văn Xương đồng cung Thái Ất",
            "severity": "cat",
            "detail": f"Thiên Mục Văn Xương hội cùng Thái Ất tại {at_cung}: Chủ Mục đắc vị, trí tuệ sáng suốt, thuận lợi cho mưu lược, học hành, văn thư.",
        })
    elif dist_vx in (1, 15):
        patterns.append({
            "name": "Ép (Bức)",
            "severity": "canh_bao",
            "detail": f"Văn Xương tại {vx_cung} ép sát Thái Ất tại {at_cung}: áp lực từ bề trên, quy định hoặc thời hạn gấp; cần mềm mỏng xử lý.",
        })

    # 4. Giam (Quan/Tù): Đại Tướng vào Trung Cung (5) hoặc đồng cung Thái Ất
    if chu_dai == "Trung" or chu_dai == at_cung:
        patterns.append({
            "name": "Chủ Đại Tướng Giam / Đóng",
            "severity": "canh_bao",
            "detail": f"Chủ Đại Tướng ở {chu_dai}: phe Chủ bị kìm hãm, chưa phát huy được lực lượng; nên giữ vững vị trí, chờ thời cơ.",
        })
    if khach_dai == "Trung" or khach_dai == at_cung:
        patterns.append({
            "name": "Khách Đại Tướng Giam / Đóng",
            "severity": "canh_bao",
            "detail": f"Khách Đại Tướng ở {khach_dai}: phe Khách khó tiến nhanh, nếu chủ động tấn công lúc này dễ gặp cản trở.",
        })

    # 5. Tam Cơ & Ngũ Phúc trợ lực
    if board["ngu_phuc_cung"] == at_cung or board["ngu_phuc_cung"] == chu_dai:
        patterns.append({
            "name": "Ngũ Phúc lâm vị",
            "severity": "cat",
            "detail": f"Sao Ngũ Phúc tại {board['ngu_phuc_cung']} hộ trợ cho Thái Ất / Chủ Tướng: có quý nhân phù trợ, chuyển hung thành cát.",
        })

    if not patterns:
        patterns.append({
            "name": "Bình Hòa Vô Phá",
            "severity": "cat",
            "detail": "Các sao chính không phạm Ếm, Kích, Giam nặng; thế cục cân bằng, thuận theo Toán Chủ/Khách mà hành động.",
        })

    return patterns


def _compare_chu_khach(chu_eval: dict, khach_eval: dict) -> dict:
    """So sánh thế Chủ và thế Khách."""
    c_score = chu_eval["score"] + (1 if chu_eval["toan"] >= 10 else 0)
    k_score = khach_eval["score"] + (1 if khach_eval["toan"] >= 10 else 0)
    if k_score > c_score:
        favored = "khach"
        summary = "Thế quẻ **lợi về Khách** (Toán Khách vượng hơn Toán Chủ): thuận lợi cho việc chủ động khởi xướng, xuất phát, đề xuất trước, thay đổi hoặc mở rộng."
    elif c_score > k_score:
        favored = "chu"
        summary = "Thế quẻ **lợi về Chủ** (Toán Chủ vượng hơn Toán Khách): thuận lợi cho việc giữ vững vị trí hiện tại, củng cố nội bộ, chờ đối phương động trước rồi ứng biến."
    else:
        favored = "can_bang"
        summary = "Thế **Chủ – Khách cân bằng**: hai bên ngang sức, nên lấy hòa làm trọng, đàm phán win-win thay vì đối đầu."
    return {"favored": favored, "summary": summary, "chu_score": c_score, "khach_score": k_score}


def analyze_divination(
    chart: dict,
    stance: str = "auto",
    urgency: str = "binh_thuong",
    extra_context: str = "",
) -> dict:
    """Luận giải tương tác cho quẻ hỏi việc tức thời."""
    board = chart["board"]
    chu_eval = evaluate_toan(board["chu"]["toan"], "Chủ")
    khach_eval = evaluate_toan(board["khach"]["toan"], "Khách")
    patterns = evaluate_patterns(board)
    balance = _compare_chu_khach(chu_eval, khach_eval)

    # Xác định kết luận cá nhân hóa theo stance của người hỏi
    fav = balance["favored"]
    if stance == "chu":
        if fav == "chu":
            stance_verdict = "CÁT — Bạn đang ở thế Chủ và quẻ cũng lợi Chủ: hãy tự tin giữ vững lập trường, bảo toàn thành quả."
        elif fav == "khach":
            stance_verdict = "THẬN TRỌNG — Bạn đang ở thế Chủ nhưng quẻ lại lợi Khách: đối phương hoặc hoàn cảnh bên ngoài đang mạnh, cần phòng thủ chắc và tránh sơ hở."
        else:
            stance_verdict = "BÌNH HÒA — Thế cân bằng, giữ ổn định và lắng nghe thêm thông tin trước khi quyết định lớn."
    elif stance == "khach":
        if fav == "khach":
            stance_verdict = "CÁT — Bạn đang ở thế Khách và quẻ lợi Khách: rất thuận để chủ động tiến tới, đề xuất, ký kết hoặc khởi sự."
        elif fav == "chu":
            stance_verdict = "CHƯA NÊN VỘI — Bạn đang muốn chủ động (Khách) nhưng quẻ lại lợi Chủ: nếu cưỡng cầu dễ gặp lực cản, nên chuẩn bị kỹ hơn hoặc lùi lại 1 nhịp."
        else:
            stance_verdict = "BÌNH HÒA — Tiến hành từng bước thăm dò, dùng sự mềm mỏng để thuyết phục."
    else:
        stance_verdict = balance["summary"]

    # Phương hướng & Ngũ hành
    at_cung = board["thai_at_cung"]
    at_dir = PALACE_DIRECTION[at_cung]
    at_hanh = PALACE_HANH[at_cung]
    ngu_phuc_dir = PALACE_DIRECTION[board["ngu_phuc_cung"]]

    # Lời khuyên theo chủ đề
    topic = chart.get("topic", "chung")
    topic_label = TOPIC_LABELS.get(topic, TOPIC_LABELS["chung"])
    topic_advice = _build_topic_advice(topic, fav, patterns, urgency)

    # Câu hỏi tương tác gợi mở cho người dùng tinh chỉnh thêm
    followup_prompts = [
        {
            "id": "stance",
            "question": "Trong việc này, vị thế thực tế của bạn là gì?",
            "options": [
                {"value": "chu", "label": "Thế Chủ (giữ vị trí hiện tại, bảo vệ, chờ đợi)"},
                {"value": "khach", "label": "Thế Khách (chủ động đi xin, mở mới, thay đổi, tiến công)"},
            ],
        },
        {
            "id": "urgency",
            "question": "Mức độ gấp gáp của quyết định này?",
            "options": [
                {"value": "gap", "label": "Cần quyết định gấp (trong vài ngày tới)"},
                {"value": "dai_han", "label": "Kế hoạch trung / dài hạn (vài tháng tới)"},
            ],
        },
    ]

    # Đánh giá tương sinh/khắc nếu có năm sinh người hỏi
    querent_note = ""
    if chart.get("querent"):
        q = chart["querent"]
        q_hanh = q["nap_am_hanh"]
        if q_hanh == at_hanh:
            querent_note = f"Mệnh Nạp Âm của bạn ({q['nap_am']} - {q_hanh}) **đồng hành** với cung Thái Ất ({at_cung} - {at_hanh}): khí lực tương trợ tốt."
        elif HANH_SINH.get(at_hanh) == q_hanh:
            querent_note = f"Cung Thái Ất ({at_hanh}) **tương sinh** cho Mệnh của bạn ({q_hanh}): được thời vận nâng đỡ."
        elif HANH_SINH.get(q_hanh) == at_hanh:
            querent_note = f"Mệnh của bạn ({q_hanh}) **sinh xuất** cho cung Thái Ất ({at_hanh}): cần bỏ công sức nhiều mới thu kết quả."
        elif HANH_KHAC.get(at_hanh) == q_hanh:
            querent_note = f"Cung Thái Ất ({at_hanh}) **khắc** Mệnh ({q_hanh}): có áp lực ngoại cảnh, cần kiên nhẫn hóa giải."
        else:
            querent_note = f"Mệnh của bạn ({q_hanh}) **chế ngự** được cung Thái Ất ({at_hanh}): có thể chủ động kiểm soát tình huống."

    return {
        "topic_label": topic_label,
        "chu_eval": chu_eval,
        "khach_eval": khach_eval,
        "balance": balance,
        "patterns": patterns,
        "stance": stance,
        "stance_verdict": stance_verdict,
        "direction_advice": f"Thái Ất tại {at_cung} ({at_dir}, hành {at_hanh}). Hướng Ngũ Phúc trợ lực: **{ngu_phuc_dir}** ({board['ngu_phuc_cung']}).",
        "topic_advice": topic_advice,
        "querent_note": querent_note,
        "extra_context_note": f"Ghi chú ngữ cảnh đã xét: {extra_context}" if extra_context else "",
        "followup_prompts": followup_prompts,
        "summary_narrative": _build_divination_narrative(
            chart, chu_eval, khach_eval, balance, patterns, stance, stance_verdict, topic_advice, at_dir, ngu_phuc_dir, querent_note, urgency
        ),
    }


def _build_divination_narrative(
    chart: dict,
    chu_eval: dict,
    khach_eval: dict,
    balance: dict,
    patterns: list,
    stance: str,
    stance_verdict: str,
    topic_advice: str,
    at_dir: str,
    ngu_phuc_dir: str,
    querent_note: str,
    urgency: str,
) -> dict:
    b = chart["board"]
    q_text = f'"{chart["question"]}"' if chart.get("question") else "vấn đề bạn đang quan tâm"
    fav = balance["favored"]
    hung_list = [p["name"] for p in patterns if p["severity"] == "hung"]
    warn_list = [p["name"] for p in patterns if p["severity"] == "canh_bao"]
    cat_list = [p["name"] for p in patterns if p["severity"] == "cat"]

    # 1. Giải thích bằng lời văn
    parts = [
        f"Với câu hỏi {q_text}, quẻ lập vào {b['don_type']} Cục {b['cuc']} (Nguyên {b['nguyen']}), "
        f"sao Thái Ất (chủ tể thời vận) đang ngự tại cung {b['thai_at_cung']} ({at_dir}).",
        f"Xét tương quan lực lượng: phe Chủ (đại diện cho phía giữ vị trí hiện tại, phòng thủ, nội bộ) có Toán {chu_eval['toan']} — {chu_eval['level'].lower()}; "
        f"trong khi phe Khách (đại diện cho phía chủ động khởi xướng, đi xin, thay đổi từ bên ngoài) có Toán {khach_eval['toan']} — {khach_eval['level'].lower()}.",
    ]
    if fav == "khach":
        parts.append("Tổng thể khí số đang nghiêng về phe Khách: tức là người chủ động đề xuất, mở lối đi mới hoặc nắm tiên cơ sẽ có lợi thế hơn.")
    elif fav == "chu":
        parts.append("Tổng thể khí số đang nghiêng về phe Chủ: tức là giữ nguyên vị thế, củng cố nền tảng hiện có và chờ đối phương lên tiếng trước sẽ có lợi hơn.")
    else:
        parts.append("Thế Chủ và Khách đang ngang bằng nhau, chưa có bên nào áp đảo hoàn toàn.")

    if hung_list or warn_list:
        bad_names = ", ".join(hung_list + warn_list)
        parts.append(f"Tuy nhiên, trên bàn quẻ xuất hiện cách cục cần lưu ý ({bad_names}), báo hiệu có lực cản ngầm, áp lực thời gian hoặc sự thiếu minh bạch cần kiểm tra kỹ.")
    elif cat_list:
        parts.append(f"Điểm sáng của quẻ là có cách cục tốt ({', '.join(cat_list)}), giúp giảm bớt trở ngại và có quý nhân hoặc cơ hội hỗ trợ.")

    if querent_note:
        parts.append(querent_note.replace("**", ""))

    # 2. Hướng giải quyết cụ thể
    steps = []
    if stance == "chu":
        if fav == "chu":
            steps.append("1. Giữ vững thế Chủ: Không cần vội nhượng bộ hay thay đổi kế hoạch gốc; hãy để đối tác/hoàn cảnh tự bộc lộ trước rồi mới phản hồi.")
        else:
            steps.append("1. Củng cố phòng thủ: Bạn đang ở thế Chủ nhưng khí số lại lợi cho bên ngoài (Khách), vì vậy cần rà soát kỹ điều khoản, tránh để lộ điểm yếu hoặc bị cuốn theo nhịp gấp của đối phương.")
    elif stance == "khach":
        if fav == "khach":
            steps.append("1. Chủ động tiến bước: Thời cơ đang ủng hộ người khởi xướng (thế Khách), bạn nên mạnh dạn đề xuất, liên hệ trước hoặc triển khai kế hoạch đã chuẩn bị.")
        else:
            steps.append("1. Tiến chậm, thăm dò trước: Bạn muốn chủ động nhưng thế quẻ đang lợi Chủ (bên giữ thế), nếu ép tiến nhanh dễ bị từ chối; hãy dùng cách tiếp cận mềm mỏng hoặc chuẩn bị thêm dữ liệu thuyết phục.")
    else:
        steps.append(f"1. Định vị thế đứng: {stance_verdict.replace('**', '')}")

    steps.append(f"2. Hành động theo chủ đề: {topic_advice}")

    if hung_list or warn_list or chu_eval["ba_tai_issues"] or khach_eval["ba_tai_issues"]:
        steps.append(
            "3. Hóa giải & phòng tránh rủi ro: Kiểm tra kỹ giấy tờ, con số và cam kết bằng văn bản; tránh quyết định nóng vội khi thiếu thông tin"
            + (" (đặc biệt trong 24–48 giờ tới do việc đang gấp)." if urgency == "gap" else ".")
        )
    else:
        steps.append("3. Tận dụng thời cơ: Có thể triển khai theo lộ trình, giữ thái độ hòa nhã và minh bạch để thu hút sự đồng thuận.")

    steps.append(f"4. Phương hướng & trợ lực: Ưu tiên giao dịch, xuất hành hoặc bố trí hướng ngồi về phía {ngu_phuc_dir} (cung Ngũ Phúc tại {b['ngu_phuc_cung']}) để tăng cát khí.")

    return {
        "narrative": " ".join(parts),
        "resolution": steps,
    }


def _build_topic_advice(topic: str, favored: str, patterns: list, urgency: str) -> str:
    has_hung = any(p["severity"] == "hung" for p in patterns)
    base = ""
    if topic == "cong_danh":
        base = "Công danh / Sự nghiệp: " + (
            "Thích hợp đề xuất ý tưởng mới, ứng tuyển hoặc mở rộng vai trò." if favored == "khach"
            else "Nên củng cố chuyên môn, giữ ổn định vị trí và hoàn thiện hồ sơ trước khi bước tiếp."
        )
    elif topic == "tai_loc":
        base = "Tài lộc / Kinh doanh: " + (
            "Có thể chủ động tiếp cận khách hàng/đối tác mới, nhưng kiểm tra kỹ điều khoản." if favored == "khach"
            else "Ưu tiên thu hồi công nợ, giữ dòng tiền an toàn, hạn chế rót vốn mới ồ ạt."
        )
    elif topic == "tinh_cam":
        base = "Hôn nhân / Gia đạo: " + (
            "Chủ động mở lời, hàn gắn hoặc bày tỏ thiện chí sẽ dễ được đón nhận." if favored == "khach"
            else "Lấy sự lắng nghe và nhẫn nhịn làm gốc, tránh tranh cãi hơn thua."
        )
    elif topic == "suc_khoe":
        base = "Sức khỏe / Bình an: " + (
            "Chú ý nghỉ ngơi điều độ, kiểm tra sức khỏe định kỳ; nếu đang điều trị thì nên theo phác đồ ổn định."
        )
    elif topic == "xuat_hanh":
        base = "Xuất hành / Mưu sự: " + (
            "Xuất hành thuận lợi, nên đi theo hướng Ngũ Phúc hoặc tránh hướng Thủy Kích." if not has_hung
            else "Nếu không quá gấp thì nên dời lịch hoặc chuẩn bị phương án dự phòng kỹ lưỡng."
        )
    else:
        base = "Tổng quát: " + (
            "Thời cơ đang mở, nên hành động có kế hoạch." if not has_hung
            else "Quẻ có cách cục cảnh báo, nên thận trọng, làm việc thiện và kiểm soát rủi ro."
        )

    if urgency == "gap" and has_hung:
        base += " (Vì việc gấp mà quẻ có dấu hiệu xung/yểm, tuyệt đối tránh quyết định cảm tính trong 24–48 giờ tới.)"
    return base


def analyze_nhan_menh(chart: dict) -> dict:
    """Luận giải Thái Ất Nhân Mệnh (Cuốn VII) & Vận hạn năm xem."""
    board = chart["board"]
    view_board = chart["view_board"]
    menh_cung = chart["menh_cung"]
    menh_hanh = PALACE_HANH[menh_cung]
    menh_khi = PALACE_KHI[menh_cung]
    nam_hanh = chart["toan_so"]["year"]["nap_am_hanh"]
    nam_nap_am = chart["toan_so"]["year"]["nap_am"]

    # Đánh giá Cung Mệnh vs Nạp Âm năm sinh
    if menh_hanh == nam_hanh:
        menh_rel = "Bình hòa (Đồng hành)"
    elif HANH_SINH.get(menh_hanh) == nam_hanh:
        menh_rel = "Cung Mệnh sinh Nạp Âm (Bổn mệnh được bồi dưỡng)"
    elif HANH_SINH.get(nam_hanh) == menh_hanh:
        menh_rel = "Nạp Âm sinh Cung Mệnh (Khí lực dồi dào)"
    elif HANH_KHAC.get(menh_hanh) == nam_hanh:
        menh_rel = "Cung Mệnh khắc Nạp Âm (Tự lực vươn lên, cần kiên trì)"
    else:
        menh_rel = "Nạp Âm khắc Cung Mệnh (Cuộc đời nhiều thử thách rèn giũa)"

    chu_eval = evaluate_toan(board["chu"]["toan"], "Chủ (Bổn mệnh)")
    khach_eval = evaluate_toan(board["khach"]["toan"], "Khách (Ngoại cảnh)")
    nhat_patterns = evaluate_patterns(board)

    # Phân tích năm xem hạn
    view_chu = evaluate_toan(view_board["chu"]["toan"], f"Chủ năm {chart['view_year']}")
    view_khach = evaluate_toan(view_board["khach"]["toan"], f"Khách năm {chart['view_year']}")
    view_patterns = evaluate_patterns(view_board)
    view_balance = _compare_chu_khach(view_chu, view_khach)

    # Kiểm tra Thái Ất năm xem có chiếu / trùng cung trọng yếu trong 12 cung Nhân Mệnh không
    at_view = view_board["thai_at_cung"]
    hit_palaces = [pname for pname, chi in chart["cung_12"].items() if chi == at_view]
    if hit_palaces:
        hit_note = f"Thái Ất năm {chart['view_year']} đóng tại **{at_view}**, trùng với cung **{', '.join(hit_palaces)}** trong 12 cung Nhân Mệnh — đây là phương diện trọng tâm biến chuyển mạnh nhất trong năm."
    else:
        hit_note = f"Thái Ất năm {chart['view_year']} đóng tại **{at_view}** (Chính cung {PALACE_DIRECTION[at_view]}), tác động gián tiếp lên toàn cục."

    return {
        "menh_overview": {
            "menh_cung": menh_cung,
            "menh_hanh": menh_hanh,
            "menh_khi": menh_khi,
            "nap_am": f"{nam_nap_am} ({nam_hanh})",
            "relation": menh_rel,
            "am_duong_menh": chart["am_duong_menh"],
            "chieu_an_cung": "Đi Thuận" if chart["is_thuan"] else "Đi Nghịch",
        },
        "nhat_ke_menh": {
            "chu_eval": chu_eval,
            "khach_eval": khach_eval,
            "patterns": nhat_patterns,
        },
        "view_year_analysis": {
            "year": chart["view_year"],
            "can_chi": chart["view_year_can_chi"],
            "cuc": view_board["cuc"],
            "chu_eval": view_chu,
            "khach_eval": view_khach,
            "balance": view_balance,
            "patterns": view_patterns,
            "hit_note": hit_note,
        },
        "summary_narrative": {
            "narrative": (
                f"Đương số {chart.get('name', '')} ({chart['am_duong_menh']}, an 12 cung theo chiều {'Thuận' if chart['is_thuan'] else 'Nghịch'}) "
                f"có Cung Mệnh đóng tại {menh_cung} (hành {menh_hanh}, khí {menh_khi}), Nạp Âm năm sinh là {nam_nap_am} ({nam_hanh}) — {menh_rel.lower()}. "
                f"Bước sang năm {chart['view_year']} ({chart['view_year_can_chi']}), Tuế Kế vào Cục {view_board['cuc']}, "
                f"sao Thái Ất ngự tại {at_view}"
                + (f" chiếu thẳng vào cung {', '.join(hit_palaces)} trong 12 cung Nhân Mệnh, báo hiệu lĩnh vực này sẽ có chuyển biến rõ rệt nhất." if hit_palaces else ", tác động gián tiếp lên toàn cục.")
                + f" {view_balance['summary'].replace('**', '')}"
            ),
            "resolution": [
                f"1. Nương theo bản mệnh: Cung Mệnh ở đất {menh_khi} (hành {menh_hanh}), nên phát huy thế mạnh tự nhiên của hành {menh_hanh} và cân bằng cảm xúc khi gặp áp lực.",
                f"2. Trọng tâm năm {chart['view_year']}: " + (
                    f"Chú ý đặc biệt tới phương diện {', '.join(hit_palaces)} vì có Thái Ất lưu niên đóng tại đó."
                    if hit_palaces else "Giữ nhịp độ ổn định ở các cung trọng yếu, tránh thay đổi đột ngột khi chưa đủ nguồn lực."
                ),
                "3. Chiến lược hành động trong năm: " + (
                    "Có thể chủ động mở rộng, khởi sự hoặc tìm kiếm cơ hội mới (quẻ năm lợi Khách)."
                    if view_balance["favored"] == "khach"
                    else "Ưu tiên củng cố nền tảng, giữ tài chính và vị thế hiện tại (quẻ năm lợi Chủ hoặc cân bằng)."
                ),
                f"4. Phương hướng cát lợi: Hướng Ngũ Phúc năm {chart['view_year']} tại {view_board['ngu_phuc_cung']} ({PALACE_DIRECTION[view_board['ngu_phuc_cung']]}) giúp tăng cường quý nhân và bình an.",
            ],
        },
    }
