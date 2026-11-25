/*
 * Chọn Ngày Tốt, Hướng Xuất Hành & Giờ Tốt Frontend
 */
(function () {
  let lastDayReport = null;
  let lastScanList = null;

  const modeBtns = document.querySelectorAll(".nt-mode-btn");
  const formCheckWrap = document.getElementById("nt-form-check-wrap");
  const formScanWrap = document.getElementById("nt-form-scan-wrap");
  const resultEl = document.getElementById("ngay-tot-result");

  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const m = btn.dataset.ntMode;
      modeBtns.forEach((b) => b.classList.toggle("active", b === btn));
      formCheckWrap.style.display = m === "check" ? "" : "none";
      formScanWrap.style.display = m === "scan" ? "" : "none";
    });
  });

  function isoDate(d) {
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
  }

  function fillDefaults() {
    const now = new Date();
    const end = new Date(now.getTime() + 14 * 86400000);
    document.getElementById("nt-date").value = isoDate(now);
    document.getElementById("nts-start").value = isoDate(now);
    document.getElementById("nts-end").value = isoDate(end);
  }
  fillDefaults();
  document.getElementById("nt-btn-today").addEventListener("click", () => {
    document.getElementById("nt-date").value = isoDate(new Date());
  });

  // Export DOCX hook for Service 3
  const btnExport = document.getElementById("btn-export-docx");
  if (btnExport) {
    btnExport.addEventListener(
      "click",
      async (e) => {
        if (window.__activeService !== "ngay-tot") return;
        e.stopImmediatePropagation();
        if (!lastDayReport && !lastScanList) {
          alert("Vui lòng tra cứu ngày hoặc tìm ngày đẹp trước khi xuất Word.");
          return;
        }
        const resp = await fetch("/api/ngay-tot/export-docx", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ day_report: lastDayReport, days: lastScanList }),
        });
        if (!resp.ok) return alert("Lỗi xuất Word");
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Chon_Ngay_Tot_Xuat_Hanh.docx";
        a.click();
        URL.revokeObjectURL(url);
      },
      true
    );
  }

  document.getElementById("nt-check-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const [yy, mm, dd] = document.getElementById("nt-date").value.split("-").map(Number);
    const resp = await fetch("/api/ngay-tot/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        day: dd,
        month: mm,
        year: yy,
        purpose: document.getElementById("nt-purpose").value,
        birth_year: document.getElementById("nt-birth-year").value || null,
      }),
    });
    const data = await resp.json();
    if (!resp.ok) return alert(data.error || "Lỗi tra cứu");
    lastDayReport = data.day_report;
    lastScanList = null;
    renderDayDetail(data.day_report);
  });

  document.getElementById("nt-scan-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const [sy, sm, sd] = document.getElementById("nts-start").value.split("-").map(Number);
    const [ey, em, ed] = document.getElementById("nts-end").value.split("-").map(Number);
    const resp = await fetch("/api/ngay-tot/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start_day: sd, start_month: sm, start_year: sy,
        end_day: ed, end_month: em, end_year: ey,
        purpose: document.getElementById("nts-purpose").value,
        birth_year: document.getElementById("nts-birth-year").value || null,
      }),
    });
    const data = await resp.json();
    if (!resp.ok) return alert(data.error || "Lỗi quét ngày");
    lastScanList = data.days;
    if (data.days.length) lastDayReport = data.days[0];
    renderScanList(data.days);
  });

  function renderDayDetail(r) {
    const hoursHtml = r.hours
      .map(
        (h) => `
        <div class="nt-hour-pill ${h.is_hoang_dao ? "hd" : "hac"}">
          <strong>${h.chi}</strong> (${h.range})<br>
          <small>${h.can_chi} • ${h.star} ${h.is_hoang_dao ? "★ Hoàng Đạo" : "• Hắc Đạo"}</small>
        </div>`
      )
      .join("");

    resultEl.innerHTML = `
      <div class="nt-header">
        <div>
          <h3 style="margin:0;color:#7c2d12;">📆 Ngày ${r.solar} (Âm lịch: ${r.lunar})</h3>
          <p class="sub" style="margin:4px 0 0;">Năm ${r.can_chi.year} • Tháng ${r.can_chi.month} • Ngày <strong>${r.can_chi.day}</strong> (${r.nap_am})</p>
        </div>
        <span class="score-pill tone-${r.tier === "good" ? "good" : r.tier}">${r.score}/100 • ${r.verdict}</span>
      </div>

      <div class="ta-toan-detail-grid" style="margin-top:12px;">
        <div class="ta-toan-card">
          <h4>🧭 Hướng Xuất Hành &amp; Sao Đức</h4>
          <p>• <strong>Tài Thần</strong> (cầu tài, giao dịch): <strong>${r.directions.tai_than}</strong></p>
          <p>• <strong>Hỷ Thần</strong> (hỷ sự, gặp gỡ): <strong>${r.directions.hy_than}</strong></p>
          <p>• <strong>Thiên Đạo Hành</strong> (hướng tốt trong tháng): <strong>${r.directions.thien_dao}</strong></p>
          <p>• Thiên Đức: <strong>${r.directions.thien_duc}</strong> • Nguyệt Đức: <strong>${r.directions.nguyet_duc}</strong></p>
        </div>
        <div class="ta-toan-card">
          <h4>📜 Trực, 28 Tú &amp; Tuổi Xung</h4>
          <p>• <strong>Trực ${r.truc.name} (${r.truc.type}):</strong> ${r.truc.desc}</p>
          <p>• <strong>Sao ${r.tu_28.name} (${r.tu_28.type}):</strong> ${r.tu_28.desc}</p>
          <p>• <strong>Tuổi xung ngày:</strong> ${r.xung_chi} ${r.age_note ? `<br><small>${r.age_note}</small>` : ""}</p>
        </div>
      </div>

      <div style="margin-top:14px;">
        <h4>⏰ 12 Khung Giờ Trong Ngày (6 Giờ Hoàng Đạo &amp; 6 Giờ Hắc Đạo)</h4>
        <div class="nt-hours-grid">${hoursHtml}</div>
      </div>

      <div class="ta-tg-grid" style="margin-top:14px;">
        <div class="ta-tg-block ta-tg-resolution">
          <h4>✦ Yếu Tố Thuận Lợi</h4>
          <ul>${r.good_reasons.map((x) => `<li>${x}</li>`).join("")}</ul>
        </div>
        <div class="ta-tg-block ta-tg-narrative">
          <h4>⚠ Điểm Cần Lưu Ý</h4>
          <ul>${r.bad_reasons.map((x) => `<li>${x}</li>`).join("")}</ul>
        </div>
      </div>
    `;
  }

  function renderScanList(days) {
    if (!days.length) {
      resultEl.innerHTML = `<div class="empty-state">Không tìm thấy ngày phù hợp trong khoảng thời gian đã chọn.</div>`;
      return;
    }
    const rows = days
      .map(
        (d, idx) => `
        <tr class="tier-${d.tier === "cat" ? "cat" : d.tier === "hung" ? "can_trong" : ""}">
          <td><strong>#${idx + 1}</strong></td>
          <td><strong>${d.solar}</strong><br><small>ÂL ${d.lunar}</small></td>
          <td><strong>${d.can_chi.day}</strong><br><small>${d.nap_am}</small></td>
          <td>Trực ${d.truc.name}<br><small>Tú ${d.tu_28.name}</small></td>
          <td><strong>${d.score}/100</strong><br><small>${d.verdict}</small></td>
          <td>Tài: <strong>${d.directions.tai_than}</strong><br>Hỷ: <strong>${d.directions.hy_than}</strong></td>
          <td><small>${d.hoang_dao_summary.slice(0, 3).join("<br>")}</small></td>
          <td><button type="button" class="btn btn-light nt-pick-btn" data-idx="${idx}">Chi tiết</button></td>
        </tr>`
      )
      .join("");

    resultEl.innerHTML = `
      <h3 style="margin:0 0 8px;color:#7c2d12;">🌟 Top ${days.length} Ngày Đẹp Nhất (${days[0].purpose_label})</h3>
      <table class="ta-cmp-table">
        <thead>
          <tr><th>Hạng</th><th>Ngày</th><th>Can Chi</th><th>Trực / Tú</th><th>Điểm</th><th>Hướng Tốt</th><th>Giờ Hoàng Đạo</th><th></th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
    resultEl.querySelectorAll(".nt-pick-btn").forEach((b) => {
      b.addEventListener("click", () => {
        const picked = days[Number(b.dataset.idx)];
        lastDayReport = picked;
        renderDayDetail(picked);
      });
    });
  }
})();
