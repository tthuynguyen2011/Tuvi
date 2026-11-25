import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Playfair_Display } from "next/font/google";
import "./globals.css";

const sans = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const serif = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tử Vi Đẩu Số & Thái Ất Thần Kinh",
  description:
    "Lập lá số Tử Vi, luận giải trọn đời và gieo quẻ Thái Ất hỏi việc. Miễn phí, xử lý ngay trên trình duyệt.",
};

export const viewport: Viewport = {
  themeColor: "#17142a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${sans.variable} ${serif.variable} antialiased`}>
      <body className="min-h-dvh bg-paper text-ink font-sans">{children}</body>
    </html>
  );
}
