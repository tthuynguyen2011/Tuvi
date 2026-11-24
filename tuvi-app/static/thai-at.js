/*
 * Thái Ất Thần Kinh Interactive Frontend & Dual-Service Switcher
 */
(function () {
  let activeService = "tuvi";
  let activeTaMode = "divination";
  let currentTaData = null; // { chart, analysis }
  let currentStance = "auto";
  let currentUrgency = "binh_thuong";
  let currentExtraContext = "";

  // ==================== SERVICE SWITCHER ====================
  const svcBtns = document.querySelectorAll(".svc-btn");
  const paneTuvi = document.getElementById("service-tuvi");
  const paneThaiAt = document.getElementById("service-thai-at");
  const portalTitle = document.getElementById("portal-title");
  const portalSub = document.getElementById("portal-subtitle");
  const btnExport = document.getElementById("btn-export-docx");

  svcBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.service;
      activeService = target;
      svcBtns.forEach((b) => b.classList.toggle("active", b === btn));
      paneTuvi.classList.toggle("active", target === "tuvi");
      paneThaiAt.classList.toggle("active", target === "thai-at");

      if (target === "thai-at") {
        portalTitle.textContent = "Thái Ất Thần Kinh";
        portalSub.textContent = "Gieo quẻ hỏi việc 72 Khối Âm/Dương • Thái Ất Nhân Mệnh & Luận quẻ tương tác";
      } else {
        portalTitle.textContent = "Tử Vi Đẩu Số Toàn Thư";
        portalSub.textContent = "Lập lá số bản đồ an cung • Luận giải trọn đời • Điềm may/hung từng năm & Mốc cuộc đời";
      }
    });
  });

  // Override export button when in Thái Ất service (capture phase so it intercepts cleanly)
  if (btnExport) {
    btnExport.addEventListener(
      "click",
      async (e) => {
        if (activeService !== "thai-at") return;
        e.stopImmediatePropagation();
        if (!currentTaData) {
          alert("Vui lòng gieo quẻ hoặc lập quẻ Thái Ất trước khi xuất báo cáo.");
          return;
        }
        try {
          const resp = await fetch("/api/thai-at/export-docx", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(currentTaData),
          });
          if (!resp.ok) throw new Error("Không thể xuất file Word");
          const blob = await resp.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "Que_Thai_At_Than_Kinh.docx";
          a.click();
          URL.revokeObjectURL(url);
        } catch (err) {
          alert("Lỗi xuất Word: " + err.message);
        }
      },
      true
    );
  }

  // ==================== THAI AT MODE SWITCH ====================
  const modeBtns = document.querySelectorAll(".ta-mode-btn");
  const formDivWrap = document.getElementById("ta-form-divination-wrap");
  const formMenhWrap = document.getElementById("ta-form-menh-wrap");

  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      activeTaMode = btn.dataset.taMode;
      modeBtns.forEach((b) => b.classList.toggle("active", b === btn));
      formDivWrap.style.display = activeTaMode === "divination" ? "" : "none";
      formMenhWrap.style.display = activeTaMode === "nhan_menh" ? "" : "none";
    });
  });

  // ==================== SET CURRENT DATE/TIME ====================
  function fillNow() {
    const now = new Date();
    document.getElementById("ta-day").value = now.getDate();
    document.getElementById("ta-month").value = now.getMonth() + 1;
    document.getElementById("ta-year").value = now.getFullYear();
    const h = now.getHours();
    const chiHour = h === 23 || h === 0 ? 0 : Math.floor((h + 1) / 2) * 2;
    document.getElementById("ta-hour").value = String(chiHour % 24);
  }
  fillNow();
  document.getElementById("ta-btn-now").addEventListener("click", fillNow);

  // ==================== SUBMIT DIVINATION ====================
  document.getElementById("ta-divination-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    currentStance = "auto";
    currentUrgency = "binh_thuong";
    currentExtraContext = "";
    const payload = {
      mode: "divination",
      question: document.getElementById("ta-question").value,
      topic: document.getElementById("ta-topic").value,
      ke_mode: document.getElementById("ta-ke-mode").value,
      day: Number(document.getElementById("ta-day").value),
      month: Number(document.getElementById("ta-month").value),
      year: Number(document.getElementById("ta-year").value),
      hour_24: Number(document.getElementById("ta-hour").value),
      querent_birth_year: document.getElementById("ta-birth-year").value || null,
      stance: currentStance,
      urgency: currentUrgency,
    };
    await castThaiAt(payload);
  });

  // ==================== SUBMIT NHAN MENH ====================
  document.getElementById("ta-menh-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      mode: "nhan_menh",
      name: document.getElementById("tam-name").value,
      gender: document.getElementById("tam-gender").value,
      is_lunar: document.getElementById("tam-cal").value === "lunar",
      day: Number(document.getElementById("tam-day").value),
      month: Number(document.getElementById("tam-month").value),
      year: Number(document.getElementById("tam-year").value),
      hour_24: Number(document.getElementById("tam-hour").value),
      view_year: Number(document.getElementById("tam-view-year").value),
    };
    await castThaiAt(payload);
  });

  async function castThaiAt(payload) {
    try {
      const resp = await fetch("/api/thai-at/cast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Lỗi lập quẻ Thái Ất");
      currentTaData = data;
      renderThaiAtBoard(data.chart);
      renderInspectorAndConsult(data.chart, data.analysis);
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  }

  // ==================== RENDER 5x5 BOARD ====================
  const ROLE_CLASS = {
    chu_te: "star-chu-te",
    chu: "star-chu",
    khach: "star-khach",
    co: "star-co",
    phuc: "star-phuc",
    than: "star-than",
    tue: "star-tue",
    nhan_menh: "star-nm",
  };

  function renderThaiAtBoard(chart) {
    const boardEl = document.getElementById("thai-at-board");
    const board = chart.board;
    const meta = chart.palace_meta;
    const order16 = [
      "Tốn", "Tỵ", "Ngọ", "Mùi", "Khôn",
      "Thìn", "Thân",
      "Mão", "Dậu",
      "Dần", "Tuất",
      "Cấn", "Sửu", "Tý", "Hợi", "Kiền",
    ];

    let html = "";
    order16.forEach((pName) => {
      const m = meta[pName];
      const [r, c] = m.grid;
      const stars = board.stars_by_palace[pName] || [];
      const isAt = pName === board.thai_at_cung;
      const isMenh = chart.mode === "nhan_menh" && pName === chart.menh_cung;
      const numBadge = m.cung_num ? `<span class="ta-cung-num">${m.cung_num}</span>` : `<span class="ta-gian">Gián</span>`;

      const starsHtml = stars
        .map((s) => `<span class="ta-star ${ROLE_CLASS[s.role] || ""}">${escapeHtml(s.name)}</span>`)
        .join("");

      html += `
        <div class="ta-cell hanh-${m.hanh.toLowerCase()} ${isAt ? "is-thai-at" : ""} ${isMenh ? "is-menh" : ""}"
             style="grid-row:${r + 1};grid-column:${c + 1};"
             data-palace="${pName}">
          <div class="ta-cell-head">
            <strong>${pName}</strong>
            ${numBadge}
          </div>
          <div class="ta-cell-sub">${m.hanh} • ${m.khi}</div>
          <div class="ta-stars">${starsHtml || '<span class="ta-empty">—</span>'}</div>
        </div>
      `;
    });

    // Center 3x3 (rows 2..4, cols 2..4)
    const cc = chart.can_chi;
    const s = chart.solar;
    const l = chart.lunar;
    const centerStars = (board.stars_by_palace["Trung"] || [])
      .map((st) => `<span class="ta-star ${ROLE_CLASS[st.role] || ""}">${escapeHtml(st.name)}</span>`)
      .join(" ");

    html += `
      <div class="ta-center" style="grid-row:2 / 5;grid-column:2 / 5;">
        <div class="ta-center-title">${chart.mode === "nhan_menh" ? "THÁI ẤT NHÂN MỆNH" : "BÀN THÁI ẤT THẦN KINH"}</div>
        <div class="ta-center-meta">
          <div><strong>${board.don_type}</strong> • Nguyên ${board.nguyen} • <strong>Cục ${board.cuc}</strong></div>
          <div>${s.hour_24}h • ${s.day}/${s.month}/${s.year} DL (${l.day}/${l.month}/${l.year} ÂL)</div>
          <div>Năm ${cc.year} • Tháng ${cc.month} • Ngày ${cc.day} • Giờ ${cc.hour}</div>
        </div>
        <div class="ta-toan-box">
          <div class="ta-toan-pill chu">Toán Chủ: <strong>${board.chu.toan}</strong></div>
          <div class="ta-toan-pill khach">Toán Khách: <strong>${board.khach.toan}</strong></div>
        </div>
        ${centerStars ? `<div class="ta-center-stars">Trung Cung: ${centerStars}</div>` : ""}
      </div>
    `;

    boardEl.innerHTML = html;
    boardEl.querySelectorAll(".ta-cell").forEach((cell) => {
      cell.addEventListener("click", () => {
        boardEl.querySelectorAll(".ta-cell").forEach((c) => c.classList.remove("selected"));
        cell.classList.add("selected");
        showPalaceDetail(chart, cell.dataset.palace);
      });
    });
  }

  function showPalaceDetail(chart, pName) {
    const m = chart.palace_meta[pName];
    const stars = chart.board.stars_by_palace[pName] || [];
    const insp = document.getElementById("thai-at-inspector");
    const detailHtml = `
      <div class="ta-palace-detail">
        <h3>Cung ${pName} ${m.cung_num ? `(Số ${m.cung_num})` : "(Gián Thần)"}</h3>
        <p><strong>Ngũ Hành:</strong> ${m.hanh} • <strong>Khí:</strong> ${m.khi} • <strong>Phương hướng:</strong> ${m.direction}</p>
        <div style="margin:8px 0;"><strong>Các sao &amp; cung đóng tại đây:</strong></div>
        <div class="ta-stars" style="margin-bottom:10px;">
          ${stars.length ? stars.map((s) => `<span class="ta-star ${ROLE_CLASS[s.role] || ""}">${escapeHtml(s.name)}</span>`).join("") : "Không có sao chính đóng."}
        </div>
        <button type="button" id="ta-back-consult" class="btn btn-light" style="width:auto;">← Quay lại Luận Quẻ Tổng Quan</button>
      </div>
    `;
    insp.innerHTML = detailHtml;
    document.getElementById("ta-back-consult").addEventListener("click", () => {
      renderInspectorAndConsult(currentTaData.chart, currentTaData.analysis);
    });
  }

  // ==================== RENDER INSPECTOR & INTERACTIVE CONSULTATION ====================
  function renderInspectorAndConsult(chart, analysis) {
    const insp = document.getElementById("thai-at-inspector");
    const panel = document.getElementById("thai-at-consult-panel");
    panel.style.display = "";

    if (chart.mode === "divination") {
      const patternsHtml = analysis.patterns
        .map(
          (p) => `
          <div class="ta-pattern sev-${p.severity}">
            <strong>${escapeHtml(p.name)}</strong>
            <p>${escapeHtml(p.detail)}</p>
          </div>`
        )
        .join("");

      insp.innerHTML = `
        <h3>☯ Kết Luận Quẻ Tương Tác</h3>
        <p class="sub">${escapeHtml(analysis.topic_label)}</p>
        <div class="ta-verdict-box">${formatMdBold(analysis.stance_verdict)}</div>
        <p style="margin:8px 0;">${formatMdBold(analysis.direction_advice)}</p>
        ${analysis.querent_note ? `<p style="margin:8px 0;">${formatMdBold(analysis.querent_note)}</p>` : ""}
        <div class="ta-advice-box">${escapeHtml(analysis.topic_advice)}</div>
        <h4 style="margin-top:12px;">Cách Cục Thái Ất</h4>
        ${patternsHtml}
      `;

      // Interactive Q&A Panel below
      const promptsHtml = analysis.followup_prompts
        .map((pr) => {
          const curVal = pr.id === "stance" ? currentStance : currentUrgency;
          const opts = pr.options
            .map(
              (op) => `
              <button type="button" class="ta-opt-btn ${curVal === op.value ? "active" : ""}"
                      data-prompt-id="${pr.id}" data-val="${op.value}">
                ${escapeHtml(op.label)}
              </button>`
            )
            .join("");
          return `<div class="ta-prompt-group"><label><strong>${escapeHtml(pr.question)}</strong></label><div class="ta-opt-row">${opts}</div></div>`;
        })
        .join("");

      panel.innerHTML = `
        <h3>💬 Hỏi Đáp Tương Tác Để Luận Sát Ngữ Cảnh</h3>
        <p class="sub">Chọn vị thế thực tế và mức độ gấp gáp của bạn — hệ thống sẽ cập nhật ngay lời luận Chủ/Khách &amp; khuyến nghị hành động.</p>
        ${promptsHtml}
        <div class="ta-prompt-group" style="margin-top:10px;">
          <label for="ta-extra-ctx"><strong>Thêm chi tiết hoàn cảnh (tùy chọn):</strong></label>
          <div style="display:flex;gap:8px;margin-top:4px;">
            <input id="ta-extra-ctx" type="text" value="${escapeHtml(currentExtraContext)}" placeholder="Ví dụ: Đối tác đang muốn ký gấp trong tuần..." style="flex:1;padding:8px;border:1px solid #cbd5e1;border-radius:6px;" />
            <button type="button" id="ta-btn-refine" class="btn btn-primary" style="width:auto;">Cập nhật luận giải</button>
          </div>
        </div>
        <div class="ta-toan-detail-grid" style="margin-top:14px;">
          <div class="ta-toan-card">
            <h4>Toán Chủ: ${analysis.chu_eval.toan} — ${escapeHtml(analysis.chu_eval.level)}</h4>
            <p>${escapeHtml(analysis.chu_eval.desc)}</p>
            ${analysis.chu_eval.ba_tai_issues.map((x) => `<p class="ta-warn">⚠ ${escapeHtml(x)}</p>`).join("")}
          </div>
          <div class="ta-toan-card">
            <h4>Toán Khách: ${analysis.khach_eval.toan} — ${escapeHtml(analysis.khach_eval.level)}</h4>
            <p>${escapeHtml(analysis.khach_eval.desc)}</p>
            ${analysis.khach_eval.ba_tai_issues.map((x) => `<p class="ta-warn">⚠ ${escapeHtml(x)}</p>`).join("")}
          </div>
        </div>
        ${renderSummaryNarrativeHtml(analysis.summary_narrative)}
      `;

      panel.querySelectorAll(".ta-opt-btn").forEach((btn) => {
        btn.addEventListener("click", async () => {
          if (btn.dataset.promptId === "stance") currentStance = btn.dataset.val;
          if (btn.dataset.promptId === "urgency") currentUrgency = btn.dataset.val;
          await refineConsultation();
        });
      });
      document.getElementById("ta-btn-refine").addEventListener("click", async () => {
        currentExtraContext = document.getElementById("ta-extra-ctx").value.trim();
        await refineConsultation();
      });
    } else {
      // NHAN MENH
      const mo = analysis.menh_overview;
      const va = analysis.view_year_analysis;
      insp.innerHTML = `
        <h3>📜 Luận Thái Ất Nhân Mệnh</h3>
        <p><strong>Đương số:</strong> ${escapeHtml(chart.name)} (${escapeHtml(mo.am_duong_menh)} • ${escapeHtml(mo.chieu_an_cung)})</p>
        <div class="ta-verdict-box">
          <div><strong>Cung Mệnh:</strong> ${mo.menh_cung} (Hành ${mo.menh_hanh} • ${mo.menh_khi})</div>
          <div><strong>Nạp Âm:</strong> ${escapeHtml(mo.nap_am)}</div>
          <div><strong>Quan hệ Mệnh – Nạp Âm:</strong> ${escapeHtml(mo.relation)}</div>
        </div>
        <h4 style="margin-top:12px;">Vận Hạn Năm ${va.year} (${escapeHtml(va.can_chi)}) — Cục ${va.cuc}</h4>
        <p style="margin:6px 0;">${formatMdBold(va.hit_note)}</p>
        <p style="margin:6px 0;">${formatMdBold(va.balance.summary)}</p>
        ${va.patterns.map((p) => `<div class="ta-pattern sev-${p.severity}"><strong>${escapeHtml(p.name)}</strong><p>${escapeHtml(p.detail)}</p></div>`).join("")}
      `;

      const ts = chart.toan_so;
      const c12Html = Object.entries(chart.cung_12)
        .map(([k, v]) => `<span class="ta-c12-chip"><strong>${k}:</strong> ${v}</span>`)
        .join("");

      panel.innerHTML = `
        <h3>📊 Toán Số Tứ Trụ &amp; 12 Cung Nhân Mệnh</h3>
        <p class="sub">Ngày Giáp Tý sau Đông Chí: ${chart.giap_ty_date} • Số ngày tích (Kỷ Dư): ${chart.days_tich} (Cục ${chart.board.cuc})</p>
        <div class="ta-toan-detail-grid">
          <div class="ta-toan-card">
            <h4>Toán Số Nạp Giáp &amp; Nạp Âm (Tổng: ${ts.total})</h4>
            <p>Năm ${ts.year.can} ${ts.year.chi}: <strong>${ts.year.total}</strong> (${ts.year.nap_am})</p>
            <p>Tháng ${ts.month.can} ${ts.month.chi}: <strong>${ts.month.total}</strong></p>
            <p>Ngày ${ts.day.can} ${ts.day.chi}: <strong>${ts.day.total}</strong></p>
            <p>Giờ ${ts.hour.can} ${ts.hour.chi}: <strong>${ts.hour.total}</strong> (Ngày+Giờ: ${ts.day_hour_sum})</p>
          </div>
          <div class="ta-toan-card">
            <h4>12 Cung Nhân Mệnh (${mo.chieu_an_cung})</h4>
            <div class="ta-c12-grid">${c12Html}</div>
          </div>
        </div>
        ${renderSummaryNarrativeHtml(analysis.summary_narrative)}
      `;
    }
  }

  function renderSummaryNarrativeHtml(sn) {
    if (!sn) return "";
    const stepsHtml = (sn.resolution || [])
      .map((s) => `<li>${escapeHtml(s)}</li>`)
      .join("");
    return `
      <div class="ta-tong-giai">
        <h3>📜 Tổng Giải Quẻ — Diễn Giải &amp; Hướng Giải Quyết</h3>
        <div class="ta-tg-grid">
          <div class="ta-tg-block ta-tg-narrative">
            <h4>📖 Giải thích bằng lời văn</h4>
            <p>${escapeHtml(sn.narrative || "")}</p>
          </div>
          <div class="ta-tg-block ta-tg-resolution">
            <h4>🧭 Hướng giải quyết cụ thể</h4>
            <ul>${stepsHtml}</ul>
          </div>
        </div>
      </div>
    `;
  }

  async function refineConsultation() {
    if (!currentTaData) return;
    const resp = await fetch("/api/thai-at/consult", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chart: currentTaData.chart,
        stance: currentStance,
        urgency: currentUrgency,
        extra_context: currentExtraContext,
      }),
    });
    const data = await resp.json();
    if (resp.ok) {
      currentTaData.analysis = data.analysis;
      renderInspectorAndConsult(currentTaData.chart, data.analysis);
    }
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatMdBold(str) {
    return escapeHtml(str).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  }
})();
