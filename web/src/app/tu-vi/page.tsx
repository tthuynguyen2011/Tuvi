import type { Metadata } from "next";
import TuviApp from "@/components/TuviApp";

export const metadata: Metadata = {
  title: "Tử Vi Đẩu Số — Lập Lá Số & Luận Giải Trọn Đời",
  description:
    "Lập lá số Tử Vi 12 cung chuẩn truyền thống, luận giải trọn đời, điềm may – điềm hung từng năm và những mốc quan trọng trong cuộc đời. Miễn phí, xử lý ngay trên trình duyệt.",
};

export default function TuViPage() {
  return <TuviApp />;
}
