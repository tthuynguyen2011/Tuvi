// 4x4 Grid mapping: chi_idx -> [row, col] (1-indexed)
const CHI_TO_GRID = {
  5: [1, 1], 6: [1, 2], 7: [1, 3], 8: [1, 4],
  4: [2, 1],                       9: [2, 4],
  3: [3, 1],                       10: [3, 4],
  2: [4, 1], 1: [4, 2], 0: [4, 3], 11: [4, 4],
};

// Inner anchor points (in % of the 2x2 center Thien Ban box) for drawing Tam Hop & Xung Chieu lines
const CHI_TO_ANCHOR = {
  5: [0, 0],       // Ty (top-left corner)
  6: [25, 0],      // Ngo (top-left-mid)
  7: [75, 0],      // Mui (top-right-mid)
  8: [100, 0],     // Than (top-right corner)
  9: [100, 25],    // Dau
  10: [100, 75],   // Tuat
  11: [100, 100],  // Hoi (bottom-right corner)
  0: [75, 100],    // Ty
  1: [25, 100],    // Suu
  2: [0, 100],     // Dan (bottom-left corner)
  3: [0, 75],      // Mao
  4: [0, 25],      // Thin
};

let currentData = null;
let selectedChiIdx = null;

function mdBold(str) {
  return String(str).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function getPayload() {
  return {
    name: document.getElementById("f-name").value,
    gender: document.getElementById("f-gender").value,
    is_lunar: document.getElementById("f-cal").value === "lunar",
    day: parseInt(document.getElementById("f-day").value, 10),
    month: parseInt(document.getElementById("f-month").value, 10),
    year: parseInt(document.getElementById("f-year").value, 10),
    hour_24: parseInt(document.getElementById("f-hour").value, 10),
    view_year: parseInt(document.getElementById("f-view-year").value, 10),
    num_years: parseInt(document.getElementById("f-num-years").value, 10),
  };
}

async function fetchChart() {
  const res = await fetch("/api/chart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(getPayload()),
  });
  const data = await res.json();
  if (data.error) {
    alert("Lỗi: " + data.error);
    return;
  }
  currentData = data;
  selectedChiIdx = data.chart.info.menh_chi_idx;
  renderAll();
}

function renderAll() {
  renderBoard();
  renderInspector(selectedChiIdx);
  renderCachCuc();
  renderAllPalaces();
  renderMilestones();
  renderYearly();
  const targetInput = document.getElementById("f-target-year");
  if (targetInput) {
    fetchYearDetail(parseInt(targetInput.value, 10));
  }
}

let currentYearDetail = null;

async function fetchYearDetail(targetYear) {
  if (!currentData) return;
  const payload = getPayload();
  payload.target_year = targetYear;
  const res = await fetch("/api/year-detail", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (data.error) {
    alert("Lỗi: " + data.error);
    return;
  }
  currentYearDetail = data;
  renderYearDetail(data);
}

function renderYearDetail(data) {
  const sumEl = document.getElementById("year-detail-summary");
  const palEl = document.getElementById("year-detail-palaces");
  const yr = data.year_summary;
  const dvTxt = yr.dai_van
    ? `Đại Vận ${yr.dai_van.tuoi_range} tuổi (${yr.dai_van.palace} - ${yr.dai_van.chi})`
    : "Tiểu Nhi Đồng Hạn";

  sumEl.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
      <h3 style="margin:0;color:var(--accent)">Tổng Quan Cát Hung Năm ${yr.year} (${yr.year_cc} — ${yr.tuoi_mu} tuổi)</h3>
      <span class="score-pill tone-${yr.tone}">${yr.verdict} (${yr.score}/100)</span>
    </div>
    <p style="font-size:13px;color:var(--muted);margin:6px 0 10px">
      ${dvTxt} • Tiểu Hạn tại: <strong>${yr.tieu_han.palace} (${yr.tieu_han.chi})</strong> • Lưu Thái Tuế tại: <strong>${yr.luu_thai_tue.palace} (${yr.luu_thai_tue.chi})</strong> • Ngũ hành năm: <strong>${yr.year_hanh}</strong>
    </p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;">
      <div class="reading-block" style="margin-top:0">
        <h4 class="h-cat">✦ Điềm May Năm ${yr.year}</h4>
        <ul>${yr.diem_may.map((x) => `<li>${mdBold(x)}</li>`).join("")}</ul>
      </div>
      <div class="reading-block" style="margin-top:0">
        <h4 class="h-hung">⚠ Điềm Hung Năm ${yr.year}</h4>
        <ul>${yr.diem_hung.map((x) => `<li>${mdBold(x)}</li>`).join("")}</ul>
      </div>
      <div class="reading-block" style="margin-top:0">
        <h4 class="h-adv">💡 Lời Khuyên Hành Động</h4>
        <ul>${yr.advice.map((x) => `<li>${mdBold(x)}</li>`).join("")}</ul>
      </div>
    </div>
  `;

  const sortMode = document.getElementById("f-yr-sort")?.value || "month";
  const items = [...data.palaces_year];
  if (sortMode === "month") {
    items.sort((a, b) => a.lunar_month - b.lunar_month);
  }

  palEl.innerHTML = items
    .map((py) => {
      const rolesHtml = py.roles.map((r) => `<span class="role-tag">${r}</span>`).join("");
      const luuHtml = py.luu_direct.length
        ? py.luu_direct.map((s) => `<span class="luu-tag">${s}</span>`).join("")
        : `<span style="font-size:11px;color:#94a3b8">Không có sao lưu nhập trực tiếp</span>`;
      const luuXungHtml = py.luu_xung.length
        ? py.luu_xung.map((s) => `<span class="luu-tag">${s}</span>`).join("")
        : `<span style="font-size:11px;color:#94a3b8">Không có</span>`;
      const deltaStr = py.delta > 0 ? `+${py.delta}` : `${py.delta}`;
      return `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
          <h3 style="margin:0;font-size:15px">
            <span class="month-badge">Tháng ${py.lunar_month} ÂL</span>
            ${py.palace_name} (${py.chi})
          </h3>
          <span class="score-pill tone-${py.trend_tone}">${py.trend} (${py.base_score} → ${py.year_score}/100, ${deltaStr})</span>
        </div>
        <div style="margin:6px 0">${rolesHtml}</div>
        <p style="font-size:12px;color:var(--muted);margin:2px 0 6px">${py.domain}</p>
        <div class="xung-box">
          <div><strong>Bản cung:</strong> ${py.ban_chinh.join(", ")}</div>
          <div><strong>Xung chiếu [${py.xung_palace}]:</strong> ${py.xung_chinh.join(", ")}</div>
          <div><strong>Tam hợp:</strong> ${py.tam_hop.join(" • ")}</div>
          <div style="margin-top:3px"><strong>Sao Lưu bản cung:</strong> ${luuHtml} | <strong>Lưu xung chiếu:</strong> ${luuXungHtml}</div>
        </div>
        <div class="reading-block">
          <h4 class="h-cat">✦ Cát khí Tháng ${py.lunar_month} ÂL</h4>
          <ul>${py.cat_notes.map((x) => `<li>${mdBold(x)}</li>`).join("")}</ul>
        </div>
        <div class="reading-block">
          <h4 class="h-hung">⚠ Hung khí / Lưu ý Tháng ${py.lunar_month} ÂL</h4>
          <ul>${py.hung_notes.map((x) => `<li>${mdBold(x)}</li>`).join("")}</ul>
        </div>
        <div class="reading-block">
          <h4 class="h-adv">💡 Diễn biến &amp; Lời khuyên Tháng ${py.lunar_month} ÂL</h4>
          <p style="margin:0;font-size:13px">${mdBold(py.month_advice)}</p>
        </div>
      </div>`;
    })
    .join("");
}

function renderBoard() {
  const board = document.getElementById("tuvi-board");
  const { chart } = currentData;
  const { info, palaces } = chart;
  board.innerHTML = "";

  const relSet = new Set([
    selectedChiIdx,
    (selectedChiIdx + 6) % 12,
    (selectedChiIdx + 4) % 12,
    (selectedChiIdx + 8) % 12,
  ]);

  palaces.forEach((p) => {
    const [r, c] = CHI_TO_GRID[p.chi_idx];
    const cell = document.createElement("div");
    cell.className = "palace-cell";
    if (p.chi_idx === selectedChiIdx) cell.classList.add("selected");
    else if (relSet.has(p.chi_idx)) cell.classList.add("related");
    cell.style.gridRow = r;
    cell.style.gridColumn = c;
    cell.onclick = () => {
      selectedChiIdx = p.chi_idx;
      renderBoard();
      renderInspector(selectedChiIdx);
    };

    const thanHtml = p.is_than ? ` <span class="than-badge">Thân</span>` : "";
    const chinhHtml = p.chinh_tinh.length
      ? p.chinh_tinh
          .map(
            (s) =>
              `<div class="hanh-${s.hanh}">${s.name.toUpperCase()} <span class="bright">(${s.brightness})</span></div>`
          )
          .join("")
      : `<div style="color:#94a3b8;font-size:11px;font-weight:600">Vô Chính Diệu</div>`;

    const catHtml = p.cat_tinh
      .map((s) => `<span class="star-item hanh-${s.hanh} ${s.is_luu ? "luu" : ""}">${s.name}</span>`)
      .join("");
    const satHtml = p.sat_tinh
      .map((s) => `<span class="star-item hanh-${s.hanh} ${s.is_luu ? "luu" : ""}">${s.name}</span>`)
      .join("");

    cell.innerHTML = `
      <div class="p-head">
        <span class="p-canchi hanh-${p.can_hanh}">${p.can_short} ${p.chi}</span>
        <span class="p-name">${p.display_name}${thanHtml}</span>
        <span class="p-daihan">${p.dai_han}</span>
      </div>
      <div class="p-chinh">${chinhHtml}</div>
      <div class="p-stars">
        <div class="p-cat">${catHtml}</div>
        <div class="p-sat">${satHtml}</div>
      </div>
      <div class="p-foot">
        <span>Năm ${p.tieu_han_chi}</span>
        <span class="p-trangsinh">${p.trang_sinh}</span>
        <span>Tháng ${p.nguyet_han}</span>
      </div>
    `;
    board.appendChild(cell);
  });

  // Center 2x2 Thien Ban
  const tb = document.createElement("div");
  tb.className = "thien-ban";

  const p0 = CHI_TO_ANCHOR[selectedChiIdx];
  const pOpp = CHI_TO_ANCHOR[(selectedChiIdx + 6) % 12];
  const pTh1 = CHI_TO_ANCHOR[(selectedChiIdx + 4) % 12];
  const pTh2 = CHI_TO_ANCHOR[(selectedChiIdx + 8) % 12];

  tb.innerHTML = `
    <svg class="thien-ban-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
      <line x1="${p0[0]}" y1="${p0[1]}" x2="${pOpp[0]}" y2="${pOpp[1]}" stroke="#8b1e1e" stroke-width="0.6" stroke-dasharray="2,1.5" opacity="0.65"/>
      <line x1="${p0[0]}" y1="${p0[1]}" x2="${pTh1[0]}" y2="${pTh1[1]}" stroke="#475569" stroke-width="0.55" opacity="0.55"/>
      <line x1="${p0[0]}" y1="${p0[1]}" x2="${pTh2[0]}" y2="${pTh2[1]}" stroke="#475569" stroke-width="0.55" opacity="0.55"/>
      <line x1="${pTh1[0]}" y1="${pTh1[1]}" x2="${pTh2[0]}" y2="${pTh2[1]}" stroke="#94a3b8" stroke-width="0.4" stroke-dasharray="1.5,1.5" opacity="0.5"/>
    </svg>
    <div class="thien-ban-content">
      <div>
        <div class="tb-title">Thiên Bàn Lá Số Tử Vi</div>
        <table class="tb-table">
          <tr><td>Họ tên:</td><td class="val">${info.name}</td></tr>
          <tr><td>Năm sinh:</td><td class="val">${info.s_year} (${info.year_cc})</td></tr>
          <tr><td>Tháng / Ngày:</td><td class="val">DL ${info.solar} | ÂL ${info.lunar}</td></tr>
          <tr><td>Giờ sinh:</td><td class="val">${String(info.hour_24).padStart(2, "0")}:00 (${info.hour_cc})</td></tr>
          <tr><td>Năm xem:</td><td class="val">${info.view_year} (${info.view_year_cc} — ${info.tuoi_mu} tuổi)</td></tr>
          <tr><td>Âm Dương:</td><td class="val">${info.am_duong} • ${info.am_duong_ly}</td></tr>
          <tr><td>Bản Mệnh:</td><td class="val">${info.ban_menh}</td></tr>
          <tr><td>Cục:</td><td class="val">${info.cuc_name} (${info.menh_cuc_rel})</td></tr>
          <tr><td>Thân cư:</td><td class="val">${info.than_cu} (${info.than_chi})</td></tr>
          <tr><td>Mệnh / Thân chủ:</td><td class="val">${info.menh_chu} / ${info.than_chu}</td></tr>
        </table>
      </div>
    </div>
    <div class="tb-footer">Đang soi tam hợp &amp; xung chiếu từ cung: <strong>${palaces[selectedChiIdx].display_name} (${palaces[selectedChiIdx].chi})</strong></div>
  `;
  board.appendChild(tb);

  // Add Tuan / Triet badges on borders between adjacent palaces
  const addBorderBadge = (label, cls, c1, c2) => {
    const [r1, col1] = CHI_TO_GRID[c1];
    const [r2, col2] = CHI_TO_GRID[c2];
    const badge = document.createElement("div");
    badge.className = `tt-badge ${cls}`;
    badge.textContent = label;
    const midR = (r1 + r2) / 2;
    const midC = (col1 + col2) / 2;
    badge.style.top = `${((midR - 0.5) / 4) * 100}%`;
    badge.style.left = `${((midC - 0.5) / 4) * 100}%`;
    badge.style.transform = "translate(-50%, -50%)";
    board.appendChild(badge);
  };

  const tuanPair = palaces.filter((p) => p.tuan).map((p) => p.chi_idx);
  if (tuanPair.length === 2) addBorderBadge("Tuần", "tt-tuan", tuanPair[0], tuanPair[1]);

  const trietPair = palaces.filter((p) => p.triet).map((p) => p.chi_idx);
  if (trietPair.length === 2) addBorderBadge("Triệt", "tt-triet", trietPair[0], trietPair[1]);
}

function scoreToneClass(score) {
  if (score >= 75) return "tone-cat";
  if (score >= 60) return "tone-good";
  if (score >= 45) return "tone-neutral";
  if (score >= 32) return "tone-warn";
  return "tone-hung";
}

function renderInspector(chiIdx) {
  const el = document.getElementById("palace-inspector");
  const pr = currentData.report.palace_readings.find((x) => x.chi_idx === chiIdx);
  if (!pr) return;

  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
      <h3 style="margin:0;color:var(--accent)">Cung ${pr.palace_name} (${pr.chi})</h3>
      <span class="score-pill ${scoreToneClass(pr.score)}">${pr.score}/100 • ${pr.rating}</span>
    </div>
    <p style="font-size:12px;color:var(--muted);margin:4px 0 8px">${pr.domain}</p>
    ${pr.detailed_narrative ? `<div class="ta-verdict-box" style="margin-bottom:8px;">${mdBold(pr.detailed_narrative)}</div>` : ""}
    <div class="reading-block">
      <h4 class="h-cat">✦ Điểm Cát (Thế mạnh &amp; Cơ hội)</h4>
      <ul>${pr.cat_points.map((x) => `<li>${mdBold(x)}</li>`).join("")}</ul>
    </div>
    <div class="reading-block">
      <h4 class="h-hung">⚠ Điểm Hung (Rủi ro cần lưu ý)</h4>
      <ul>${pr.hung_points.map((x) => `<li>${mdBold(x)}</li>`).join("")}</ul>
    </div>
    <div class="reading-block">
      <h4 class="h-adv">💡 Lời khuyên hóa giải</h4>
      <ul>${pr.advice.map((x) => `<li>${mdBold(x)}</li>`).join("")}</ul>
    </div>
  `;
}

function renderCachCuc() {
  const el = document.getElementById("cach-cuc-list");
  const list = currentData.report.cach_cuc;
  if (!list.length) {
    el.innerHTML = `<div class="cc-item">Lá số bình hòa, các bộ sao phân bổ đều, phát triển bền bỉ theo thời vận.</div>`;
  } else {
    el.innerHTML = list
      .map(
        (c) => `
      <div class="cc-item">
        <div><strong>${c.name}</strong> <span class="score-pill tone-good">${c.type}</span></div>
        <p style="margin:4px 0 0;color:var(--muted)">${c.desc}</p>
      </div>`
      )
      .join("");
  }

  const osEl = document.getElementById("tuvi-overall-summary");
  const os = currentData.report.overall_summary;
  if (osEl && os) {
    const pillarsHtml = (os.pillars || []).map((p) => `<li>${mdBold(p)}</li>`).join("");
    osEl.innerHTML = `
      <div class="ta-tong-giai" style="margin-top:8px;">
        <h3>📜 Tổng Luận Lá Số Trọn Đời Cho Đương Số</h3>
        <div class="ta-tg-block ta-tg-narrative" style="margin-bottom:10px;">
          <p>${mdBold(os.narrative)}</p>
          ${os.year_outlook ? `<p style="margin-top:6px;">${mdBold(os.year_outlook)}</p>` : ""}
        </div>
        <div class="ta-tg-block ta-tg-resolution">
          <h4>🧭 Luận Chi Tiết Các Trụ Cột Cuộc Đời</h4>
          <ul>${pillarsHtml}</ul>
        </div>
        <div class="ta-prob-disclaimer" style="margin-top:8px;">⚠ ${os.disclaimer}</div>
      </div>
    `;
  }
}

function renderAllPalaces() {
  const el = document.getElementById("all-palaces-list");
  el.innerHTML = currentData.report.palace_readings
    .map(
      (pr) => `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <h3 style="margin:0;font-size:15px">${pr.palace_name} (${pr.chi})</h3>
        <span class="score-pill ${scoreToneClass(pr.score)}">${pr.score}/100 • ${pr.rating}</span>
      </div>
      <p style="font-size:12px;color:var(--muted);margin:4px 0 8px">${pr.domain}</p>
      ${pr.detailed_narrative ? `<div class="ta-verdict-box" style="margin-bottom:8px;">${mdBold(pr.detailed_narrative)}</div>` : ""}
      <div class="reading-block">
        <h4 class="h-cat">✦ Điểm Cát</h4>
        <ul>${pr.cat_points.map((x) => `<li>${mdBold(x)}</li>`).join("")}</ul>
      </div>
      <div class="reading-block">
        <h4 class="h-hung">⚠ Điểm Hung</h4>
        <ul>${pr.hung_points.map((x) => `<li>${mdBold(x)}</li>`).join("")}</ul>
      </div>
      <div class="reading-block">
        <h4 class="h-adv">💡 Lời khuyên</h4>
        <ul>${pr.advice.map((x) => `<li>${mdBold(x)}</li>`).join("")}</ul>
      </div>
    </div>`
    )
    .join("");
}

function renderMilestones() {
  const el = document.getElementById("milestones-list");
  el.innerHTML = currentData.report.milestones
    .map(
      (ms) => `
    <div class="ms-card ms-${ms.type}">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">
        <strong>Năm ${ms.year} (${ms.year_cc}) — ${ms.tuoi_mu} tuổi</strong>
        <span class="score-pill ${scoreToneClass(ms.score)}">${ms.verdict} (${ms.score}/100)</span>
      </div>
      <p style="margin:4px 0 6px;font-size:13px">${mdBold(ms.summary)}</p>
      <div style="font-size:12px;color:var(--muted)">
        <div><span class="h-cat">▲ May:</span> ${mdBold(ms.diem_may.join(" "))}</div>
        <div><span class="h-hung">▼ Hung:</span> ${mdBold(ms.diem_hung.join(" "))}</div>
      </div>
    </div>`
    )
    .join("");
}

function renderYearly() {
  const el = document.getElementById("yearly-list");
  el.innerHTML = currentData.report.yearly_readings
    .map((yr) => {
      const dvTxt = yr.dai_van
        ? `Đại Vận ${yr.dai_van.tuoi_range} (${yr.dai_van.palace} - ${yr.dai_van.chi})`
        : "Tiểu Nhi Đồng Hạn";
      return `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
          <h3 style="margin:0;font-size:15px">Năm ${yr.year} (${yr.year_cc}) — ${yr.tuoi_mu} tuổi</h3>
          <span class="score-pill tone-${yr.tone}">${yr.verdict} (${yr.score}/100)</span>
        </div>
        <p style="font-size:12px;color:var(--muted);margin:4px 0 8px">
          ${dvTxt} • Tiểu Hạn: <strong>${yr.tieu_han.palace} (${yr.tieu_han.chi})</strong> • Lưu Thái Tuế: <strong>${yr.luu_thai_tue.chi}</strong>
        </p>
        <div class="reading-block">
          <h4 class="h-cat">✦ Điềm May</h4>
          <ul>${yr.diem_may.map((x) => `<li>${mdBold(x)}</li>`).join("")}</ul>
        </div>
        <div class="reading-block">
          <h4 class="h-hung">⚠ Điềm Hung</h4>
          <ul>${yr.diem_hung.map((x) => `<li>${mdBold(x)}</li>`).join("")}</ul>
        </div>
        <div class="reading-block">
          <h4 class="h-adv">💡 Lời khuyên năm ${yr.year}</h4>
          <ul>${yr.advice.map((x) => `<li>${mdBold(x)}</li>`).join("")}</ul>
        </div>
      </div>`;
    })
    .join("");
}

// Tabs
document.querySelectorAll(".tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

// Form submit
document.getElementById("chart-form").addEventListener("submit", (e) => {
  e.preventDefault();
  fetchChart();
});

// Custom year detail controls
document.getElementById("btn-yr-view").addEventListener("click", () => {
  if (!currentData) {
    alert("Vui lòng nhập thông tin đương số và bấm 'Lập Lá Số & Luận Giải' trước.");
    return;
  }
  const yr = parseInt(document.getElementById("f-target-year").value, 10);
  fetchYearDetail(yr);
});
document.getElementById("btn-yr-prev").addEventListener("click", () => {
  const inp = document.getElementById("f-target-year");
  inp.value = parseInt(inp.value, 10) - 1;
  if (currentData) fetchYearDetail(parseInt(inp.value, 10));
});
document.getElementById("btn-yr-next").addEventListener("click", () => {
  const inp = document.getElementById("f-target-year");
  inp.value = parseInt(inp.value, 10) + 1;
  if (currentData) fetchYearDetail(parseInt(inp.value, 10));
});
document.getElementById("btn-yr-apply-board").addEventListener("click", () => {
  const yr = parseInt(document.getElementById("f-target-year").value, 10);
  document.getElementById("f-view-year").value = yr;
  fetchChart();
  document.querySelector('.tab[data-tab="tab-chart"]').click();
});
document.getElementById("f-yr-sort").addEventListener("change", () => {
  if (currentYearDetail) renderYearDetail(currentYearDetail);
});

// Export DOCX
document.getElementById("btn-export-docx").addEventListener("click", async () => {
  if (!currentData) {
    alert("Vui lòng lập lá số trước khi xuất file Word.");
    return;
  }
  const res = await fetch("/api/export-docx", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(getPayload()),
  });
  if (!res.ok) {
    alert("Không thể xuất file DOCX.");
    return;
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `La_So_Tu_Vi_${document.getElementById("f-name").value || "Duong_So"}.docx`;
  a.click();
  URL.revokeObjectURL(url);
});
