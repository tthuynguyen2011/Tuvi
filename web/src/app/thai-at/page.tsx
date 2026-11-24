import type { Metadata } from "next";
import ThaiAtApp from "@/components/thaiat/ThaiAtApp";

export const metadata: Metadata = {
  title: "Thái Ất Thần Kinh — Gieo quẻ hỏi việc & Nhân Mệnh",
  description:
    "Gieo quẻ Thái Ất hỏi việc theo Thời/Nhật/Nguyệt/Tuế Kế, bàn 16 cung, Toán Chủ – Khách, cách cục và luận giải tương tác; lập quẻ Thái Ất Nhân Mệnh.",
};

export default function ThaiAtPage() {
  return <ThaiAtApp />;
}
