import type { Metadata } from "next";
import Link from "next/link";
import { Noto_Serif_SC } from "next/font/google";
import { HOURS, type Palace, type Tone } from "@/lib/tuvi";
import { buildSample } from "@/components/landing/sample";
import LegacyShareRedirect from "@/components/landing/LegacyShareRedirect";
import s from "./landing.module.css";

/** Only for the decorative Hán characters; Google serves it in unicode-range slices. */
const han = Noto_Serif_SC({ variable: "--font-han", weight: ["500", "700"], preload: false, display: "swap" });

export const metadata: Metadata = {
  title: "Tử Vi Đẩu Số & Thái Ất Thần Kinh — Lập lá số, gieo quẻ miễn phí",
  description:
    "Lập lá số Tử Vi 12 cung chuẩn truyền thống, luận giải trọn đời và vận hạn từng năm; gieo quẻ Thái Ất Thần Kinh hỏi việc, chọn thời. Miễn phí, kết quả tức thì, không cần đăng ký.",
};

const TU_VI = "/tu-vi";
const THAI_AT = "/thai-at";

const HANH_CLASS: Record<string, string> = { Kim: s.hKim, Mộc: s.hMoc, Thủy: s.hThuy, Hỏa: s.hHoa, Thổ: s.hTho };

const TONE_COLOR: Record<Tone, string> = {
  cat: "var(--color-tone-cat)",
  good: "var(--color-tone-good)",
  neutral: "var(--color-tone-neutral)",
  warn: "var(--color-tone-warn)",
  hung: "var(--color-tone-hung)",
};

/** chi_idx -> [row, col] in the traditional 4x4 layout (Tỵ top-left, Hợi bottom-right). */
const GRID: Record<number, [number, number]> = {
  5: [1, 1], 6: [1, 2], 7: [1, 3], 8: [1, 4],
  4: [2, 1], 9: [2, 4],
  3: [3, 1], 10: [3, 4],
  2: [4, 1], 1: [4, 2], 0: [4, 3], 11: [4, 4],
};

/** Earthly branches around the ring, starting at Tý (top) going clockwise. */
const RING = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

export default function Home() {
  const sm = buildSample();
  const { info } = sm;
  const daiVan = sm.thisYear.dai_van;

  return (
    <div className={`${s.page} ${han.variable}`}>
      <LegacyShareRedirect to={TU_VI} />

      {/* ============================ HERO ============================ */}
      <header className={s.hero}>
        <div className={s.stars} aria-hidden />
        <div className={s.wrap}>
          <nav className={s.nav} aria-label="Điều hướng chính">
            <Link href="/" className={s.brand}>
              <span className={`${s.seal} ${s.han}`} aria-hidden>紫</span>
              <span>
                <span className={s.brandName}>Tử Vi · Thái Ất</span>
                <span className={s.brandSub}>Huyền học Đông phương · Luận giải hiện đại</span>
              </span>
            </Link>
            <div className={s.links}>
              <Link href={TU_VI}>Tử Vi Đẩu Số</Link>
              <Link href={THAI_AT}>Gieo quẻ Thái Ất</Link>
              <a href="#cach-hoat-dong">Cách hoạt động</a>
              <a href="#hoi-dap">Hỏi đáp</a>
            </div>
            <Link href={TU_VI} className={`${s.btn} ${s.btnGold} ${s.navCta}`}>
              Lập lá số miễn phí →
            </Link>
          </nav>

          <div className={s.heroGrid}>
            <div>
              <span className={s.eyebrow}>
                <span className={s.dot} aria-hidden />
                Miễn phí · Tức thì · Không cần đăng ký
              </span>
              <h1 className={s.h1}>
                Hiểu mệnh để <em>chủ động</em> vận, hỏi quẻ để quyết đúng thời.
              </h1>
              <p className={s.lead}>
                Lập lá số Tử Vi Đẩu Số chuẩn truyền thống, luận giải trọn đời 12 cung — và gieo quẻ Thái Ất Thần
                Kinh để xin lời giải cho từng việc hệ trọng: khởi sự, đầu tư, cưới hỏi, xuất hành.
              </p>
              <div className={s.ctas}>
                <Link href={TU_VI} className={`${s.btn} ${s.btnRed} ${s.btnLg}`}>
                  ✦ Lập lá số Tử Vi
                </Link>
                <Link href={THAI_AT} className={`${s.btn} ${s.btnGhost} ${s.btnLg}`}>
                  ☯ Gieo quẻ Thái Ất
                </Link>
              </div>
              <ul className={s.assure}>
                <li>Chỉ cần ngày &amp; giờ sinh</li>
                <li>Tính ngay trên trình duyệt</li>
                <li>Xuất Word .docx</li>
              </ul>
            </div>

            <div className={s.visual} aria-label="Ví dụ một lá số Tử Vi" role="img">
              <div className={s.ring} aria-hidden />
              <div className={`${s.ring} ${s.ring2}`} aria-hidden />
              <svg className={s.zodiac} viewBox="0 0 600 600" aria-hidden>
                <g className={s.han} fontSize="17" fill="#e4c27a" fillOpacity=".55" textAnchor="middle">
                  {RING.map((c, i) => {
                    const a = (i / 12) * 2 * Math.PI;
                    return (
                      <text key={c} x={300 + 290 * Math.sin(a)} y={306 - 290 * Math.cos(a)}>
                        {c}
                      </text>
                    );
                  })}
                </g>
              </svg>

              <div className={s.board} aria-hidden>
                {sm.palaces.map((p) => (
                  <BoardCell key={p.chi_idx} p={p} />
                ))}
                <div className={s.center}>
                  <div className={`${s.big} ${s.han}`}>命</div>
                  <div className={s.t}>Lá số mẫu</div>
                  <div className={s.m}>
                    {info.year_cc} · {info.ban_menh}
                    <br />
                    {info.am_duong} · {info.cuc_name}
                    <br />
                    Giờ {HOURS.find((h) => h.value === sm.input.hour)?.chi} · {info.solar}
                  </div>
                </div>
              </div>

              <div className={`${s.float} ${s.f1}`}>
                <div className={s.k}>
                  Vận hạn {sm.thisYear.year} · {sm.thisYear.year_cc}
                </div>
                <div className={s.v}>{sm.thisYear.verdict}</div>
                <div className={s.bar}>
                  <i style={{ width: `${sm.thisYear.score}%`, background: TONE_COLOR[sm.thisYear.tone] }} />
                </div>
                <div className={s.row}>
                  <span>Điểm vận hạn</span>
                  <span style={{ color: TONE_COLOR[sm.thisYear.tone], fontWeight: 600 }}>{sm.thisYear.score}/100</span>
                </div>
              </div>

              <div className={`${s.float} ${s.f2}`}>
                <div className={s.k}>
                  <span>☯ Quẻ Thái Ất</span>
                  <small>VÍ DỤ</small>
                </div>
                <div className={s.q}>“Tháng này có nên mở rộng kinh doanh?”</div>
                <div className={s.ans}>
                  <span className={s.pill}>CÁT</span>
                  <span>Chủ thắng Khách · nên tiến</span>
                </div>
              </div>

              {daiVan && (
                <div className={`${s.float} ${s.f3}`}>
                  <span className={s.han} style={{ color: "var(--color-gold)", fontSize: 16 }}>運</span>
                  Đại Vận <b>{daiVan.tuoi_range}</b>
                  {sm.daiVanPalace && <> · cung {sm.daiVanPalace.name}</>}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ============================ STATS ============================ */}
      <div className={s.strip}>
        <div className={s.wrap}>
          <dl className={s.stripIn}>
            <Stat value="12 cung" label="An sao đầy đủ, Tam Hợp & Xung Chiếu tương tác" />
            <Stat value={`${Math.floor(sm.starCount / 10) * 10}+ sao`} label="Chính tinh, phụ tinh, Tứ Hoá, sát tinh trên mỗi lá số" />
            <Stat value="85 năm" label="Biểu đồ vận trình, Đại Vận & Tiểu Hạn từng năm" />
            <Stat value="Tức thì" label="Tính toán ngay trên máy bạn — không gửi dữ liệu đi đâu" />
          </dl>
        </div>
      </div>

      <main>
        {/* ============================ SERVICES ============================ */}
        <section id="dich-vu" className={s.section}>
          <div className={s.wrap}>
            <div className={s.centerHead}>
              <div className={s.kicker}>Hai bộ môn · Một nền tảng</div>
              <h2 className={s.h2}>
                Biết <em>mệnh</em> của mình, chọn <em>thời</em> để hành động
              </h2>
              <p className={s.sub}>
                Tử Vi cho bạn bức tranh trọn đời. Thái Ất cho bạn lời đáp cho từng quyết định. Dùng riêng hoặc kết
                hợp — đều miễn phí.
              </p>
            </div>

            <div className={s.services}>
              <article className={`${s.svc} ${s.svcTv}`}>
                <div className={`${s.wm} ${s.han}`} aria-hidden>紫</div>
                <span className={s.tag}>Luận mệnh trọn đời</span>
                <h3>Tử Vi Đẩu Số</h3>
                <div className={`${s.hz} ${s.han}`}>紫微斗數</div>
                <p className={s.desc}>
                  Từ ngày, giờ sinh, hệ thống an sao 12 cung chuẩn truyền thống và luận giải chi tiết tính cách, sự
                  nghiệp, tài lộc, tình duyên, sức khoẻ.
                </p>
                <ul className={s.feat}>
                  <Feature icon="☰" title="Lá số 12 cung tương tác" text="Thiên Bàn, Ngũ Hành, Tuần/Triệt, Tam Hợp — chạm để xem chi tiết" />
                  <Feature icon="✧" title="Luận giải từng cung" text="Điểm cát hung & lời khuyên cho Mệnh, Tài, Quan, Phu Thê…" />
                  <Feature icon="⛰" title="Mốc cuộc đời 1–85 tuổi" text="Năm chuyển Đại Vận, năm bứt phá và năm thử thách" />
                  <Feature icon="⬇" title="Xuất báo cáo Word" text="Tải .docx đầy đủ, in lá số, chia sẻ bằng đường dẫn" />
                </ul>
                <div className={s.svcFoot}>
                  <Link href={TU_VI} className={`${s.btn} ${s.btnRed}`}>
                    ✦ Lập lá số ngay
                  </Link>
                  <span className={s.note}>Chỉ mất khoảng 30 giây</span>
                </div>
              </article>

              <article className={`${s.svc} ${s.svcTa}`}>
                <div className={`${s.wm} ${s.han}`} aria-hidden>乙</div>
                <span className={s.tag}>Hỏi việc · Chọn thời</span>
                <h3>Thái Ất Thần Kinh</h3>
                <div className={`${s.hz} ${s.han}`}>太乙神經</div>
                <p className={s.desc}>
                  Một trong Tam Thức cổ (Thái Ất · Kỳ Môn · Lục Nhâm). Lập quẻ theo thời điểm để luận thế Chủ —
                  Khách, thời cơ và cát hung cho việc bạn đang cân nhắc.
                </p>
                <ul className={s.feat}>
                  <Feature icon="☯" title="Gieo quẻ hỏi việc" text="Nhập câu hỏi & thời điểm — mặc định giờ hiện tại Việt Nam" />
                  <Feature icon="◎" title="Bàn 16 cung & Cách cục" text="Toán Chủ – Khách, các cách cục cát hung, luận giải tương tác" />
                  <Feature icon="📜" title="Quẻ Ất Nhân Mệnh" text="Luận vận mệnh cá nhân theo phép Thái Ất" />
                  <Feature icon="✔" title="Kết luận rõ ràng" text="Nên tiến hay lùi, thời điểm thuận — kèm tổng giải chi tiết" />
                </ul>
                <div className={s.svcFoot}>
                  <Link href={THAI_AT} className={`${s.btn} ${s.btnGold}`}>
                    ☯ Gieo quẻ ngay
                  </Link>
                  <span className={s.note}>Mỗi câu hỏi một quẻ</span>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ============================ STEPS ============================ */}
        <section id="cach-hoat-dong" className={s.section}>
          <div className={s.wrap}>
            <div className={s.centerHead}>
              <div className={s.kicker}>Cách hoạt động</div>
              <h2 className={s.h2}>Ba bước, chưa đầy một phút</h2>
            </div>
            <ol className={s.steps}>
              <Step n={1} han="一" title="Nhập thông tin" text="Ngày, tháng, năm & giờ sinh (dương hoặc âm lịch) — hoặc câu hỏi bạn muốn xin quẻ." />
              <Step n={2} han="二" title="Lập lá số / quẻ" text="Hệ thống an sao, tính Đại Vận, Tiểu Hạn hoặc lập bàn Thái Ất ngay trên trình duyệt." />
              <Step n={3} han="三" title="Đọc luận giải" text="Nhận luận giải chi tiết, biểu đồ vận trình và lời khuyên — tải về Word để lưu giữ." />
            </ol>
          </div>
        </section>

        {/* ============================ PREVIEW ============================ */}
        <section className={s.section}>
          <div className={`${s.wrap} ${s.preview}`}>
            <div>
              <div className={s.kicker}>Bạn sẽ nhận được</div>
              <h2 className={s.h2}>
                Không chỉ lá số — là <em>bản đồ</em> cho cả cuộc đời
              </h2>
              <p className={s.sub}>Mỗi kết quả được trình bày trực quan, dễ hiểu kể cả khi bạn chưa từng xem Tử Vi.</p>
              <ul className={s.checks}>
                <li>Biểu đồ vận trình 85 năm — thấy ngay giai đoạn thăng, trầm</li>
                <li>Luận giải từng năm cho 1–85 năm tới, theo Đại Vận, Tiểu Hạn &amp; Lưu Niên</li>
                <li>Điểm cát / hung rõ ràng cho từng cung, kèm lời khuyên hành động</li>
                <li>Báo cáo .docx đầy đủ để lưu giữ hoặc gửi người thân</li>
              </ul>
              <div style={{ marginTop: 34 }}>
                <Link href={TU_VI} className={`${s.btn} ${s.btnRed} ${s.btnLg}`}>
                  Xem lá số của tôi →
                </Link>
              </div>
            </div>

            <div className={s.pv}>
              <div className={s.pvHead}>
                <b>Biểu đồ vận trình trọn đời</b>
                <div className={s.legend}>
                  <span><i style={{ background: TONE_COLOR.cat }} />Cát</span>
                  <span><i style={{ background: TONE_COLOR.neutral }} />Bình hòa</span>
                  <span><i style={{ background: TONE_COLOR.warn }} />Thận trọng</span>
                  <span><i style={{ background: TONE_COLOR.hung }} />Hung</span>
                </div>
              </div>
              <div className={s.pvSub}>
                Dữ liệu thật từ lá số mẫu · {sm.input.gender}, sinh {info.solar} · trục ngang: tuổi khởi Đại Vận
              </div>
              <LifeBars life={sm.life} daiHanStarts={sm.palaces.map((p) => p.dai_han)} currentAge={info.tuoi_mu} />
              <div className={s.pvCards}>
                {sm.menh && (
                  <Mini
                    k="Cung Mệnh"
                    v={sm.menh.chinh_tinh.map((c) => c.name).join(" · ") || "Vô Chính Diệu"}
                    t={`${sm.menh.rating} · ${sm.menh.score}`}
                    color={TONE_COLOR[sm.menh.score >= 70 ? "cat" : sm.menh.score >= 52 ? "good" : "warn"]}
                  />
                )}
                {sm.taiBach && (
                  <Mini
                    k="Tài Bạch"
                    v={sm.taiBach.chinh_tinh.map((c) => c.name).join(" · ") || "Vô Chính Diệu"}
                    t={`${sm.taiBach.rating} · ${sm.taiBach.score}`}
                    color={TONE_COLOR[sm.taiBach.score >= 70 ? "cat" : sm.taiBach.score >= 52 ? "good" : "warn"]}
                  />
                )}
                <Mini
                  k={`Năm ${sm.nextYear.year}`}
                  v={sm.nextYear.year_cc}
                  t={`${sm.nextYear.verdict} · ${sm.nextYear.score}`}
                  color={TONE_COLOR[sm.nextYear.tone]}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ============================ FAQ ============================ */}
        <section id="hoi-dap" className={s.section}>
          <div className={`${s.wrap} ${s.faq}`}>
            <div>
              <div className={s.kicker}>Hỏi đáp</div>
              <h2 className={s.h2}>Câu hỏi thường gặp</h2>
              <p className={s.sub}>Chưa thấy câu trả lời? Cứ thử lập lá số — mọi thứ đều miễn phí.</p>
            </div>
            <div>
              {FAQ.map((f, i) => (
                <details key={f.q} className={s.qa} open={i === 0}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ============================ FINAL CTA ============================ */}
        <div className={s.wrap}>
          <div className={s.final}>
            <div className={`${s.finalBg} ${s.han}`} aria-hidden>命</div>
            <div style={{ position: "relative" }}>
              <div className={s.kicker}>Bắt đầu ngay hôm nay</div>
              <h2 className={s.h2}>
                Lá số của bạn đã <em>sẵn sàng</em> từ ngày bạn sinh ra.
              </h2>
              <p className={s.finalP}>Chỉ cần 30 giây để mở nó ra. Miễn phí, riêng tư, không cần đăng ký.</p>
            </div>
            <div className={s.acts}>
              <Link href={TU_VI} className={`${s.btn} ${s.btnGold} ${s.btnLg}`}>
                ✦ Lập lá số Tử Vi miễn phí
              </Link>
              <Link href={THAI_AT} className={`${s.btn} ${s.btnGhost} ${s.btnLg}`}>
                ☯ Gieo một quẻ Thái Ất
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className={s.footer}>
        <div className={`${s.wrap} ${s.fgrid}`}>
          <div className={s.brand}>
            <span className={`${s.seal} ${s.han}`} style={{ width: 36, height: 36, fontSize: 18 }} aria-hidden>紫</span>
            <span>
              <span className={s.brandName}>Tử Vi · Thái Ất</span>
              <span className={s.brandSub}>Huyền học Đông phương</span>
            </span>
          </div>
          <div>Nội dung mang tính tham khảo — vận mệnh do chính bạn làm chủ.</div>
          <nav className={s.flinks} aria-label="Liên kết cuối trang">
            <Link href={TU_VI}>Tử Vi</Link>
            <Link href={THAI_AT}>Thái Ất</Link>
            <a href="#hoi-dap">Hỏi đáp</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/* --------------------------------- Pieces --------------------------------- */

const FAQ = [
  {
    q: "Có thật sự miễn phí không?",
    a: "Có. Lập lá số, luận giải trọn đời, gieo quẻ Thái Ất và xuất file Word đều miễn phí, không cần tạo tài khoản.",
  },
  {
    q: "Thông tin ngày sinh của tôi có được gửi đi đâu không?",
    a: "Không. Mọi tính toán chạy ngay trên trình duyệt của bạn. Lần nhập gần nhất chỉ được lưu trong trình duyệt trên máy bạn để tiện mở lại; đường dẫn chia sẻ chỉ được tạo khi bạn chủ động sao chép.",
  },
  {
    q: "Tôi không nhớ chính xác giờ sinh thì sao?",
    a: "Giờ sinh quyết định vị trí cung Mệnh nên ảnh hưởng nhiều đến lá số. Nếu không chắc, hãy thử các giờ lân cận và đối chiếu phần luận giải với tính cách, những sự kiện đã qua để chọn giờ phù hợp nhất.",
  },
  {
    q: "Tử Vi và Thái Ất khác nhau thế nào?",
    a: "Tử Vi Đẩu Số dựa trên ngày giờ sinh để luận vận mệnh trọn đời và vận hạn từng năm. Thái Ất Thần Kinh lập quẻ theo thời điểm hỏi để xem cát hung, thế Chủ – Khách cho một việc cụ thể — và có thêm phép Ất Nhân Mệnh để luận mệnh cá nhân.",
  },
  {
    q: "Kết quả có chính xác tuyệt đối không?",
    a: "Huyền học là kho tri thức để tham khảo và tự chiêm nghiệm, không phải lời phán định. Hãy dùng luận giải như một góc nhìn để hiểu mình hơn — quyết định cuối cùng vẫn là của bạn.",
  },
];

function BoardCell({ p }: { p: Palace }) {
  const [r, c] = GRID[p.chi_idx];
  const sub = [...p.cat_tinh, ...p.sat_tinh].slice(0, 1);
  return (
    <div className={`${s.cell} ${p.is_menh ? s.menh : ""}`} style={{ gridRow: r, gridColumn: c }}>
      <span className={s.p}>{p.name}</span>
      {p.chinh_tinh.map((st) => (
        <span key={st.name} className={`${s.s} ${HANH_CLASS[st.hanh] ?? ""}`}>
          {st.name}
        </span>
      ))}
      {sub.map((st) => (
        <span key={st.name} className={s.c}>
          {st.name}
        </span>
      ))}
      <span className={s.br}>{p.chi}</span>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className={s.stat}>
      <dt className="sr-only">{label}</dt>
      <dd>
        <b>{value}</b>
        <span>{label}</span>
      </dd>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <li>
      <span className={s.ic} aria-hidden>{icon}</span>
      <div>
        <b>{title}</b>
        <small>{text}</small>
      </div>
    </li>
  );
}

function Step({ n, han, title, text }: { n: number; han: string; title: string; text: string }) {
  return (
    <li className={s.step}>
      <div className={`${s.num} ${s.han}`} aria-hidden>
        {han}
        <small>{n}</small>
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
    </li>
  );
}

function Mini({ k, v, t, color }: { k: string; v: string; t: string; color: string }) {
  return (
    <div className={s.mini}>
      <div className={s.k}>{k}</div>
      <div className={s.v}>{v}</div>
      <div className={s.t} style={{ color }}>{t}</div>
    </div>
  );
}

/** Lifetime scores (age 1..85) as tone-coloured bars — the same encoding as the app's LifeChart. */
function LifeBars({
  life,
  daiHanStarts,
  currentAge,
}: {
  life: { age: number; score: number; tone: Tone }[];
  daiHanStarts: number[];
  currentAge: number;
}) {
  const W = 560, H = 246, L = 6, R = 554, T = 44, B = 216;
  const slot = (R - L) / life.length;
  const x = (age: number) => L + (age - 1) * slot;
  const bh = (score: number) => (score / 100) * (B - T);

  // Childhood years swing a lot and say little; call out the adult peak and low.
  const adult = life.filter((d) => d.age >= 18);
  const peak = adult.reduce((a, b) => (b.score > a.score ? b : a));
  const low = adult.reduce((a, b) => (b.score < a.score ? b : a));
  // Pill centres, clamped to the chart and pushed apart if the two would overlap.
  const PILL = 116;
  const clampX = (v: number) => Math.min(Math.max(v, L + PILL / 2), R - PILL / 2);
  const barX = (age: number) => x(age) + slot / 2;
  let [peakX, lowX] = [clampX(barX(peak.age)), clampX(barX(low.age))];
  const gap = PILL + 6 - Math.abs(peakX - lowX);
  if (gap > 0) {
    const dir = peakX >= lowX ? 1 : -1;
    peakX = clampX(peakX + (dir * gap) / 2);
    lowX = clampX(lowX - (dir * gap) / 2);
    // One pill hit the chart edge: place the other one fully beside it.
    if (Math.abs(peakX - lowX) < PILL + 6) {
      if (dir > 0) lowX = peakX - PILL - 6;
      else peakX = lowX - PILL - 6;
    }
  }
  const label = (d: { age: number; score: number }, cx: number, text: string, color: string) => {
    const bx = barX(d.age);
    return (
      <g fontSize="11.5" fontWeight="600">
        <line x1={bx} x2={bx} y1={T - 8} y2={B - bh(d.score) - 2} stroke={color} strokeWidth="1" strokeDasharray="2 2" />
        <rect x={cx - PILL / 2} y={T - 30} width={PILL} height="22" rx="11" fill={color} />
        <text x={cx} y={T - 14.5} fill="#fff" textAnchor="middle">{text}</text>
      </g>
    );
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label="Điểm vận hạn từng năm từ 1 đến 85 tuổi của lá số mẫu"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <line x1={L} x2={R} y1={B - bh(50)} y2={B - bh(50)} stroke="#e6dac6" strokeDasharray="4 4" />
      {life.map((d) => (
        <rect
          key={d.age}
          x={x(d.age) + 0.6}
          y={B - bh(d.score)}
          width={slot - 1.2}
          height={bh(d.score)}
          rx="1.5"
          fill={TONE_COLOR[d.tone]}
          stroke={d.age === currentAge ? "#17142a" : "none"}
          strokeWidth="1.5"
        />
      ))}
      <line x1={L} x2={R} y1={B} y2={B} stroke="#e6dac6" />
      {label(peak, peakX, `Đỉnh cao · ${peak.age} tuổi`, "#1d7a47")}
      {low.age !== peak.age && label(low, lowX, `Thử thách · ${low.age} tuổi`, "#b9322a")}
      <g fontSize="10.5" fill="#6b6159" textAnchor="middle">
        {daiHanStarts.filter((a) => a >= 1 && a <= 85).sort((a, b) => a - b).map((a) => (
          <text key={a} x={x(a) + slot / 2} y={B + 18}>{a}</text>
        ))}
      </g>
    </svg>
  );
}
