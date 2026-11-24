"""
Generate golden fixtures from the original Python engine for parity testing
of the TypeScript port.  Run from repo root:  python3 web/scripts/gen_golden.py
"""
import json
import os
import random
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, "tuvi-app"))

from tuvi_engine import build_chart  # noqa: E402
from tuvi_analyzer import analyze_full_report, analyze_palaces_for_year  # noqa: E402

N = int(os.environ.get("GOLDEN_N", 400))
rng = random.Random(20261124)
cases = []

# Known reference cases from test_engine.py
fixed = [
    dict(name="Nguyễn Diệp Thảo", gender="Nữ", year=2018, month=7, day=25, hour_24=18, is_lunar=False, is_leap=False, view_year=2020),
    dict(name="Nguyễn Thị Cẩm Vân", gender="Nữ", year=1989, month=8, day=9, hour_24=8, is_lunar=True, is_leap=False, view_year=2026),
    dict(name="Hoàng Trần Long", gender="Nam", year=1987, month=11, day=12, hour_24=22, is_lunar=False, is_leap=False, view_year=2026),
]

inputs = list(fixed)
while len(inputs) < N:
    is_lunar = rng.random() < 0.35
    inputs.append(dict(
        name="Test",
        gender=rng.choice(["Nam", "Nữ"]),
        year=rng.randint(1920, 2030),
        month=rng.randint(1, 12),
        day=rng.randint(1, 29 if is_lunar else 28),
        hour_24=rng.choice(list(range(0, 24))),
        is_lunar=is_lunar,
        is_leap=False,
        view_year=rng.randint(1990, 2060),
    ))

for inp in inputs:
    num_years = rng.randint(1, 12)
    target_year = rng.randint(1950, 2080)
    try:
        chart = build_chart(**inp)
        report = analyze_full_report(chart, start_year=inp["view_year"], num_years=num_years)
        detail = analyze_palaces_for_year(chart, target_year)
    except Exception as exc:  # invalid lunar dates etc.
        print("skip", inp, exc)
        continue
    cases.append({
        "input": inp, "num_years": num_years, "target_year": target_year,
        "chart": chart, "report": report, "detail": detail,
    })

# Pure lunar-calendar checks across a wide date range
import lunar_calendar as lc  # noqa: E402
lunar = []
for _ in range(3000):
    y = rng.randint(1900, 2099)
    m = rng.randint(1, 12)
    d = rng.randint(1, 28)
    lunar.append({"solar": [d, m, y], "lunar": list(lc.solar_to_lunar(d, m, y))})

# ---------------- Thái Ất Thần Kinh ----------------
from thai_at_engine import build_divination_chart, build_nhan_menh_chart  # noqa: E402
from thai_at_analyzer import analyze_divination, analyze_nhan_menh  # noqa: E402

KE = ["thoi_ke", "nhat_ke", "nguyet_ke", "tue_ke"]
TOPICS = ["chung", "cong_danh", "tai_loc", "tinh_cam", "suc_khoe", "xuat_hanh"]
divination = []
for i in range(600):
    inp = dict(
        dd=rng.randint(1, 28), mm=rng.randint(1, 12), yy=rng.randint(1950, 2060),
        hour_24=rng.choice(range(0, 24, 2)), ke_mode=KE[i % 4],
        question=rng.choice(["", "Có nên ký hợp đồng không?"]), topic=rng.choice(TOPICS),
        querent_birth_year=rng.choice([None, rng.randint(1940, 2015)]),
    )
    # dates around the winter solstice / first Giáp Tý are the tricky ones
    if i % 5 == 0:
        inp["mm"], inp["dd"] = rng.choice([(12, rng.randint(15, 31)), (1, rng.randint(1, 31)), (2, rng.randint(1, 28))])
    opts = dict(stance=rng.choice(["auto", "chu", "khach"]), urgency=rng.choice(["binh_thuong", "gap", "dai_han"]),
                extra_context=rng.choice(["", "Đối tác thúc ký"]))
    chart = build_divination_chart(**inp)
    divination.append({"input": inp, "opts": opts, "chart": chart, "analysis": analyze_divination(chart, **opts)})

nhan_menh = []
for _ in range(400):
    is_lunar = rng.random() < 0.35
    inp = dict(name="Test", gender=rng.choice(["Nam", "Nữ"]), dd=rng.randint(1, 29 if is_lunar else 28),
               mm=rng.randint(1, 12), yy=rng.randint(1920, 2030), hour_24=rng.choice(range(0, 24, 2)),
               is_lunar=is_lunar, is_leap=False, view_year=rng.randint(1990, 2060))
    chart = build_nhan_menh_chart(**inp)
    nhan_menh.append({"input": inp, "chart": chart, "analysis": analyze_nhan_menh(chart)})

dest = os.path.join(ROOT, "web", "tests", "golden.json")
os.makedirs(os.path.dirname(dest), exist_ok=True)
with open(dest, "w", encoding="utf-8") as f:
    json.dump({"cases": cases, "lunar": lunar, "divination": divination, "nhan_menh": nhan_menh}, f, ensure_ascii=False)
print(f"wrote {len(cases)} Tử Vi cases, {len(lunar)} lunar checks, {len(divination)} Thái Ất divinations, {len(nhan_menh)} Nhân Mệnh charts to {dest}")
