"""
Lightweight Python Web Server for the Tu Vi Web App.
Uses only Python stdlib + python-docx (no external web framework needed).
"""
import json
import os
import urllib.parse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

from tuvi_engine import build_chart
from tuvi_analyzer import analyze_full_report, analyze_palaces_for_year
from docx_exporter import export_to_docx_bytes

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")


class TuViHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=STATIC_DIR, **kwargs)

    def _read_json(self):
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length)
        return json.loads(raw.decode("utf-8"))

    def _send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        try:
            payload = self._read_json()
            name = payload.get("name", "Đương Số").strip() or "Đương Số"
            gender = payload.get("gender", "Nữ")
            year = int(payload.get("year", 1989))
            month = int(payload.get("month", 8))
            day = int(payload.get("day", 9))
            hour_24 = int(payload.get("hour_24", 8))
            is_lunar = bool(payload.get("is_lunar", False))
            is_leap = bool(payload.get("is_leap", False))
            view_year = int(payload.get("view_year", 2026))
            num_years = max(1, min(85, int(payload.get("num_years", 15))))

            chart = build_chart(
                name=name, gender=gender, year=year, month=month, day=day,
                hour_24=hour_24, is_lunar=is_lunar, is_leap=is_leap, view_year=view_year
            )
            if self.path == "/api/chart":
                report = analyze_full_report(chart, start_year=view_year, num_years=num_years)
                self._send_json({"chart": chart, "report": report})
            elif self.path == "/api/year-detail":
                target_year = int(payload.get("target_year", view_year))
                detail = analyze_palaces_for_year(chart, target_year)
                self._send_json(detail)
            elif self.path == "/api/export-docx":
                report = analyze_full_report(chart, start_year=view_year, num_years=num_years)
                docx_bytes = export_to_docx_bytes(chart, report)
                safe_name = urllib.parse.quote(f"La_So_Tu_Vi_{name}_{view_year}.docx")
                self.send_response(200)
                self.send_header(
                    "Content-Type",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                )
                self.send_header("Content-Disposition", f"attachment; filename*=UTF-8''{safe_name}")
                self.send_header("Content-Length", str(len(docx_bytes)))
                self.end_headers()
                self.wfile.write(docx_bytes)
            else:
                self._send_json({"error": "Not found"}, status=404)
        except Exception as exc:
            self._send_json({"error": str(exc)}, status=500)


def main():
    port = int(os.environ.get("TUVI_PORT", 8765))
    server = ThreadingHTTPServer(("127.0.0.1", port), TuViHandler)
    print(f"Tu Vi Web App running at http://127.0.0.1:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
