import Link from "next/link";

const SERVICES = [
  { href: "/", id: "tuvi", label: "Tử Vi Đẩu Số", glyph: "紫" },
  { href: "/thai-at", id: "thai-at", label: "Thái Ất Thần Kinh", glyph: "☯" },
] as const;

/** Switch between the two services (Tử Vi / Thái Ất). */
export default function SiteNav({ active }: { active: (typeof SERVICES)[number]["id"] }) {
  return (
    <nav aria-label="Chọn dịch vụ" className="no-print mx-auto max-w-7xl px-5">
      <div className="flex gap-1 border-b border-white/10">
        {SERVICES.map((s) => {
          const on = s.id === active;
          return (
            <Link
              key={s.id}
              href={s.href}
              aria-current={on ? "page" : undefined}
              className={`-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition ${
                on ? "border-gold-light text-white" : "border-transparent text-white/55 hover:text-white/90"
              }`}
            >
              <span aria-hidden className={on ? "text-gold-light" : ""}>
                {s.glyph}
              </span>
              {s.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
