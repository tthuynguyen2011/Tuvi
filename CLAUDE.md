# CLAUDE.md — Cổng Huyền Học Tương Tác (Tử Vi Đẩu Số & Thái Ất Thần Kinh)

Tài liệu tổng hợp kiến trúc, quy tắc nghiệp vụ, cấu trúc mã nguồn và hướng dẫn kiểm thử cho bộ công cụ **Tử Vi Đẩu Số** và **Thái Ất Thần Kinh** (chạy local 100%, không cần API bên ngoài).

---

## 1. Tổng quan Kiến trúc & Chạy Ứng dụng

- **Server:** Python stdlib `ThreadingHTTPServer` tại [tuvi-app/app.py](tuvi-app/app.py), phục vụ tĩnh từ `tuvi-app/static/` trên cổng mặc định `8765` (`http://127.0.0.1:8765`).
- **Khởi chạy nhanh:** Nhấp đúp [Chạy_Tử_Vi.bat](Chạy_Tử_Vi.bat) hoặc chạy `python tuvi-app/app.py`.
- **Thư viện ngoài duy nhất:** `python-docx` (dùng cho xuất báo cáo Word `.docx`).
- **Giao diện 2 dịch vụ riêng biệt:** Thanh chuyển dịch vụ trên topbar cho phép chuyển qua lại giữa **🔮 Tử Vi Đẩu Số** và **☯ Thái Ất Thần Kinh** ([tuvi-app/static/index.html](tuvi-app/static/index.html)).

---

## 2. Cấu trúc Thư mục & Vai trò từng File

### Lõi chung
- [tuvi-app/lunar_calendar.py](tuvi-app/lunar_calendar.py): Thuật toán Âm/Dương lịch Hồ Ngọc Đức (UTC+7), Can Chi, Nạp Âm, Ngũ Hành, Tiết khí (Đông Chí / Hạ Chí xác định Dương Độn / Âm Độn), tìm ngày Giáp Tý đầu tiên sau Đông Chí, và bảng số Nạp Giáp / Nạp Âm Thái Ất (`7, 9, 11, 13, 15`).
- [tuvi-app/app.py](tuvi-app/app.py): HTTP router cho cả hai dịch vụ:
  - Tử Vi: `POST /api/chart`, `POST /api/year-detail`, `POST /api/export-docx`.
  - Thái Ất: `POST /api/thai-at/cast`, `POST /api/thai-at/consult`, `POST /api/thai-at/export-docx`.

### Dịch vụ 1: Tử Vi Đẩu Số
- [tuvi-app/tuvi_engine.py](tuvi-app/tuvi_engine.py): An 12 cung, Thiên Bàn, Cục, Mệnh/Thân, 14 Chính Tinh, Cát/Sát tinh, Tuần/Triệt, Đại Vận, Tiểu Hạn, Lưu Thái Tuế, Sao Lưu.
- [tuvi-app/tuvi_analyzer.py](tuvi-app/tuvi_analyzer.py):
  - `detect_cach_cuc`, `analyze_palace` (kèm `detailed_narrative` diễn giải chi tiết bằng lời văn cho từng cung).
  - `analyze_full_report` (kèm `overall_summary` tổng luận trọn đời: Âm Dương Thuận/Nghịch lý, Cục–Mệnh, Cung Thân, 6 trụ cột cuộc đời, năm xem hạn và lưu ý tham khảo).
  - `analyze_year`, `analyze_palaces_for_year`.
- [tuvi-app/docx_exporter.py](tuvi-app/docx_exporter.py): Xuất lá số & toàn bộ bài luận Tử Vi ra `.docx`.
- [tuvi-app/static/app.js](tuvi-app/static/app.js): Render bàn 4×4, Tam Hợp/Xung Chiếu tương tác, Tổng Luận Trọn Đời và các tab vận hạn.

### Dịch vụ 2: Thái Ất Thần Kinh (theo *Thái Ất Thần Kinh* — Trạng Trình Nguyễn Bỉnh Khiêm)
- [tuvi-app/thai_at_engine.py](tuvi-app/thai_at_engine.py):
  - Bàn 16 Thần + Trung Cung (lưới 5×5) với Cửu Cung Thái Ất (`1=Kiền, 2=Ngọ, 3=Cấn, 4=Mão, 5=Trung, 6=Dậu, 7=Khôn, 8=Tý, 9=Tốn`).
  - 4 cấp độ Kế: **Thời Kế** (72 Khối Âm/Dương), **Nhật Kế**, **Nguyệt Kế**, **Tuế Kế** (Tích niên `10155358 + (year - 1441)`).
  - An Thái Ất, Văn Xương (Thiên Mục), Thủy Kích (Địa Mục), Kế Thần, Chủ/Khách Đại & Tham Tướng, Tam Cơ, Ngũ Phúc, Tứ Thần, Thiên/Địa Ất, Trực Phù, Thái Tuế.
  - Tính **Toán Chủ / Toán Khách** chuẩn quy tắc cung Chính & cung Gián (Cuốn I, mục 18).
  - `build_nhan_menh_chart`: Toán số 4 trụ, Nhật Kế kể ngày từ Giáp Tý sau Đông Chí, an Cung Mệnh & 12 Cung Nhân Mệnh (Cuốn VII).
- [tuvi-app/thai_at_analyzer.py](tuvi-app/thai_at_analyzer.py):
  - Kho quy tắc từ **Cuốn II, III, IV, V, VII**: Số Hòa (`14, 18`, `23, 29, 32, 36`, `12, 16, 21, 27, 34, 38`), Trùng/Tạp, Ba Tài Không Toán, và các cách cục (**Ếm/Yểm, Thủy Kích, Ép/Bức, Giam/Đóng, Xung Đối, Đề Hiệp, Chủ Khách Tướng Phát – Cửa Đủ, Ngũ Phúc**).
  - **Tỷ lệ % thành công theo quẻ (`compute_success_probability`)**: Tính `%` thuận lợi (`15%–92%`) kèm các yếu tố cộng/trừ và lời nhắc soi xét kỹ thực tế.
  - **Tổng hợp diễn giải 5 phần (`structured_report`)**: Thông tin quẻ & Chủ–Khách, Soi kỹ khung giờ khởi tâm (kèm trích dẫn kinh văn), Bảng so sánh 2 mốc thời gian dự kiến (tùy chọn), Luận chi tiết Chủ–Khách, Kết luận & Hướng giải quyết.
  - **Kiểm soát ngôn ngữ (`check_querent_language`)**: Trung thực, chuẩn mực, không đưa lời khuyên tiêu cực; từ chối và dừng tương tác ngay khi người hỏi dùng ngôn từ thiếu chuẩn mực.
- [tuvi-app/thai_at_exporter.py](tuvi-app/thai_at_exporter.py): Xuất báo cáo Thái Ất (Gieo quẻ & Nhân Mệnh) ra `.docx`.
- [tuvi-app/static/thai-at.js](tuvi-app/static/thai-at.js): Giao diện chuyển 2 chế độ Thái Ất, bàn 5×5 tương tác, so sánh 2 mốc thời gian, hỏi đáp tương tác Chủ/Khách và hiển thị Tổng Giải Quẻ.

---

## 3. Kiểm thử (Tests)

Chạy kiểm thử tự động trước khi commit/deploy:

```powershell
python tuvi-app/test_engine.py
python tuvi-app/test_thai_at.py
```

- `test_engine.py`: Kiểm tra lập lá số, mốc cuộc đời, xuất `.docx` Tử Vi.
- `test_thai_at.py`: Đối chiếu công thức Tích niên (1441/1640/1787), 72 Khối Âm Cục 1 & 2, An Cung Mệnh (Dần/Ngọ/Mùi), so sánh 2 mốc ngày, tỷ lệ % thành công, bộ lọc ngôn ngữ và xuất `.docx`.

---

## 4. Quy ước Phát triển

1. Không chỉnh sửa quy tắc an sao đã đối chiếu đúng sách nếu không kiểm tra lại bằng `test_engine.py` và `test_thai_at.py`.
2. Sau khi sửa backend (`app.py`, `*_engine.py`, `*_analyzer.py`, `*_exporter.py`), cần khởi động lại tiến trình server trên cổng `8765` để áp dụng thay đổi.
3. Mọi lời luận giải phải giữ văn phong **trung thực, chuẩn mực, mang tính xây dựng** và luôn kèm lưu ý đây là thông tin tham khảo theo quẻ/lá số.
