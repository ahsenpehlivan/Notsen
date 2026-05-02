"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import styles from "./LandingPage.module.css";

interface LandingPageProps {
  onGetStarted: () => void;
}

/* ─── Data ─────────────────────────────────────────────── */
const TYPEWRITER_WORDS = ["hızlı", "kolay", "ücretsiz", "akıllı", "eğlenceli"];

const FEATURES = [
  { icon: "⚡", title: "Hızlı Görev Takibi",  desc: "Görevlerini saniyeler içinde oluştur, önceliklendir ve tamamla. Ücretsiz to-do list uygulaması ile hiçbir görev gözden kaçmaz." },
  { icon: "🗂️", title: "Kanban Board",        desc: "Sürükle-bırak ile görevlerini sütunlar arasında taşı. Yapılacak, devam eden ve tamamlanan görevleri tek bakışta gör." },
  { icon: "🌙", title: "5 Farklı Tema",       desc: "Gözlerine en uygun temayı seç. Koyu, açık, krem ve daha fazlası — tamamen reklamsız yapılacaklar listesi deneyimi." },
  { icon: "📱", title: "Mobil Uyumlu",        desc: "Telefon, tablet veya bilgisayardan aynı deneyim. Görev yönetim uygulaması her cihazda mükemmel çalışır." },
  { icon: "🔒", title: "Güvenli & Özel",      desc: "Veriler yalnızca sana ait. Supabase altyapısı ile güvenli authentication ve şifreli veri depolama." },
  { icon: "📊", title: "Aktivite Takibi",     desc: "Projelerinde neler değişti? Aktivite geçmişi ile her hareketi takip et ve üretkenliğini ölç." },
];

const STEPS = [
  { n: "01", title: "Ücretsiz kaydol", desc: "Google hesabınla 10 saniyede giriş yap." },
  { n: "02", title: "Board oluştur",   desc: "Proje, ders veya alışveriş — her şey için board." },
  { n: "03", title: "Görevleri yönet",desc: "Sürükle, düzenle, tamamla. Hepsi bu kadar." },
];

const FAQS = [
  { q: "Notsen ücretsiz mi?",       a: "Evet! Temel özellikler tamamen ücretsizdir. Sınırsız görev ve board oluşturabilirsin." },
  { q: "Reklam var mı?",            a: "Hayır. Notsen, dikkat dağıtıcı reklamlar olmadan çalışan reklamsız bir yapılacaklar listesi uygulamasıdır." },
  { q: "Verilerim güvende mi?",     a: "Tüm veriler Supabase üzerinde şifreli olarak saklanır. Kimse verilerine erişemez." },
  { q: "Mobilde çalışıyor mu?",     a: "Evet! Notsen tam mobil uyumludur. iOS ve Android tarayıcılarda sorunsuz çalışır." },
  { q: "Kaç tane board açabilirim?",a: "İstediğin kadar! İş, okul, kişisel projeler — hepsi için ayrı board oluşturabilirsin." },
];

/* ─── Particle system ──────────────────────────────────── */
interface Particle { x: number; y: number; vx: number; vy: number; r: number; o: number; }

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: Particle[] = [];
    const COUNT = 55;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.5 + 0.4,
        o: Math.random() * 0.45 + 0.08,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(230, 57, 70, ${p.o})`;
        ctx.fill();
      });

      // draw connecting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(230, 57, 70, ${0.08 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.particleCanvas} />;
}



/* ─── 3D Tilt card ─────────────────────────────────────── */
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rotX = ((y - cy) / cy) * -8;
    const rotY = ((x - cx) / cx) * 8;
    el.style.transform = `perspective(600px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-6px)`;
    el.style.boxShadow = `0 20px 50px rgba(0,0,0,0.4), 0 0 0 1px rgba(230,57,70,0.15)`;
  }, []);

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(600px) rotateX(0) rotateY(0) translateY(0)";
    el.style.boxShadow = "";
  }, []);

  return (
    <div ref={ref} className={className} onMouseMove={onMove} onMouseLeave={onLeave}
      style={{ transition: "transform 0.15s ease, box-shadow 0.15s ease" }}>
      {children}
    </div>
  );
}

/* ─── Magnetic button ──────────────────────────────────── */
function MagneticBtn({ children, onClick, className, id }: {
  children: React.ReactNode; onClick?: () => void; className?: string; id?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  const onMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
  }, []);

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "translate(0,0)";
  }, []);

  return (
    <button ref={ref} id={id} className={className} onClick={onClick}
      onMouseMove={onMove} onMouseLeave={onLeave}
      style={{ transition: "transform 0.3s cubic-bezier(0.23,1,0.32,1)" }}>
      {children}
    </button>
  );
}

/* ─── Typewriter ───────────────────────────────────────── */
function Typewriter({ words }: { words: string[] }) {
  const [wordIdx, setWordIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [pause, setPause] = useState(false);

  useEffect(() => {
    if (pause) {
      const t = setTimeout(() => setPause(false), 1600);
      return () => clearTimeout(t);
    }
    const word = words[wordIdx];
    if (!deleting) {
      if (displayed.length < word.length) {
        const t = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 80);
        return () => clearTimeout(t);
      } else {
        setPause(true);
        setDeleting(true);
      }
    } else {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 45);
        return () => clearTimeout(t);
      } else {
        setDeleting(false);
        setWordIdx((i) => (i + 1) % words.length);
      }
    }
  }, [displayed, deleting, wordIdx, pause, words]);

  return (
    <span className={styles.typewriter}>
      {displayed}
      <span className={styles.cursor}>|</span>
    </span>
  );
}

/* ─── Main component ───────────────────────────────────── */
export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const [openFaq, setOpenFaq]   = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const spotlightRef = useRef<HTMLDivElement>(null);

  /* scroll progress + nav */
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY;
      const maxScroll = doc.scrollHeight - doc.clientHeight;
      setProgress(maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0);
      setScrolled(scrollTop > 40);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* cursor spotlight */
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const el = spotlightRef.current;
      if (!el) return;
      el.style.left = `${e.clientX}px`;
      el.style.top  = `${e.clientY}px`;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  /* scroll-reveal */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add(styles.visible); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll(`.${styles.fadeUp}`).forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.root}>
      {/* cursor spotlight */}
      <div ref={spotlightRef} className={styles.spotlight} />

      {/* scroll progress bar */}
      <div className={styles.progressBar} style={{ width: `${progress}%` }} />

      {/* ── NAV ── */}
      <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}>
        <div className={styles.navInner}>
          <div className={styles.logo}>
            <Image src="/icon.png" alt="Notsen" width={28} height={28} className={styles.logoImg} />
            <span>Notsen</span>
          </div>
          <div className={styles.navLinks}>
            <a href="#features">Özellikler</a>
            <a href="#how">Nasıl Çalışır</a>
            <a href="#faq">SSS</a>
          </div>
          <MagneticBtn id="nav-cta" className={styles.navCta} onClick={onGetStarted}>
            Ücretsiz Başla
          </MagneticBtn>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <ParticleCanvas />
        <div className={styles.heroBg}>
          <div className={styles.heroOrb1} />
          <div className={styles.heroOrb2} />
          <div className={styles.heroGrid} />
        </div>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} />
            Ücretsiz • Reklamsız • Hızlı
          </div>
          <h1 className={styles.heroTitle}>
            Görevlerini yönetmek<br />
            <Typewriter words={TYPEWRITER_WORDS} />{" "}
            <span className={styles.heroGradient}>olmaktan çıktı</span>
            <br />
            bir uygulama işi.
          </h1>
          <p className={styles.heroDesc}>
            <strong>Hızlı görev takip uygulaması</strong> Notsen ile to-do listenden
            Kanban board'una kadar her şeyi tek yerden yönet.{" "}
            <strong>Ücretsiz to-do list</strong> — reklam yok, karmaşıklık yok.
          </p>
          <div className={styles.heroCtas}>
            <MagneticBtn id="hero-cta-primary" className={styles.ctaPrimary} onClick={onGetStarted}>
              Hemen Başla — Ücretsiz
              <span className={styles.ctaArrow}>→</span>
            </MagneticBtn>
            <a href="#features" className={styles.ctaSecondary}>
              Özellikleri Keşfet
            </a>
          </div>
          <p className={styles.heroNote}>Kredi kartı gerekmez · 10 saniyede kayıt</p>
        </div>

        {/* Mini Kanban Preview */}
        <div className={styles.heroPreview}>
          <div className={styles.previewWindow}>
            <div className={styles.previewBar}>
              <span /><span /><span />
            </div>
            <div className={styles.previewBoard}>
              <div className={styles.previewCol}>
                <div className={styles.previewColHead} style={{ color: "#e63946" }}>
                  📋 Yapılacak <span className={styles.previewCount}>3</span>
                </div>
                <div className={`${styles.previewCard} ${styles.cardAnim1}`}>
                  <div className={styles.cardTag} style={{ background: "rgba(230,57,70,.15)", color: "#e63946" }}>Acil</div>
                  Proje sunumu hazırla
                </div>
                <div className={`${styles.previewCard} ${styles.cardAnim2}`}>
                  <div className={styles.cardTag} style={{ background: "rgba(252,196,25,.15)", color: "#fcc419" }}>Orta</div>
                  Tasarım reviewı
                </div>
                <div className={`${styles.previewCard} ${styles.cardAnim3}`}>
                  <div className={styles.cardTag} style={{ background: "rgba(81,207,102,.15)", color: "#51cf66" }}>Düşük</div>
                  Belgeleri güncelle
                </div>
              </div>
              <div className={styles.previewCol}>
                <div className={styles.previewColHead} style={{ color: "#fcc419" }}>
                  ⚡ Devam Eden <span className={styles.previewCount}>2</span>
                </div>
                <div className={`${styles.previewCard} ${styles.cardAnim1}`}>
                  <div className={styles.cardTag} style={{ background: "rgba(230,57,70,.15)", color: "#e63946" }}>Acil</div>
                  API entegrasyonu
                </div>
                <div className={`${styles.previewCard} ${styles.cardAnim2}`}>
                  <div className={styles.cardTag} style={{ background: "rgba(67,97,238,.15)", color: "#4361EE" }}>Feature</div>
                  Kullanıcı testleri
                </div>
              </div>
              <div className={styles.previewCol}>
                <div className={styles.previewColHead} style={{ color: "#51cf66" }}>
                  ✅ Tamamlandı <span className={styles.previewCount}>4</span>
                </div>
                <div className={`${styles.previewCard} ${styles.cardDone}`}>
                  <div className={styles.cardTag} style={{ background: "rgba(81,207,102,.15)", color: "#51cf66" }}>Done</div>
                  Login sayfası
                </div>
                <div className={`${styles.previewCard} ${styles.cardDone}`}>
                  <div className={styles.cardTag} style={{ background: "rgba(81,207,102,.15)", color: "#51cf66" }}>Done</div>
                  Database kurulumu
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className={styles.features}>
        <div className={styles.sectionHeader}>
          <div className={`${styles.sectionTag} ${styles.fadeUp}`}>Özellikler</div>
          <h2 className={`${styles.sectionTitle} ${styles.fadeUp}`}>Üretkenliğini artıran her şey</h2>
          <p className={`${styles.sectionDesc} ${styles.fadeUp}`}>
            Karmaşık araçlara gerek yok. Notsen, <strong>görev yönetim uygulaması</strong> olarak
            ihtiyacın olan her şeyi basit ve hızlı sunar.
          </p>
        </div>
        <div className={styles.featureGrid}>
          {FEATURES.map((f, i) => (
            <TiltCard
              key={i}
              className={`${styles.featureCard} ${styles.fadeUp}`}
            >
              <div className={styles.featureIconWrap}>
                <span className={styles.featureIconBg} />
                <span className={styles.featureIcon}>{f.icon}</span>
              </div>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </TiltCard>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className={styles.how}>
        <div className={styles.howBg} />
        <div className={styles.sectionHeader}>
          <div className={`${styles.sectionTag} ${styles.fadeUp}`}>Nasıl Çalışır</div>
          <h2 className={`${styles.sectionTitle} ${styles.fadeUp}`}>3 adımda başla</h2>
        </div>
        <div className={styles.steps}>
          {STEPS.map((s, i) => (
            <div key={i} className={`${styles.step} ${styles.fadeUp}`} style={{ transitionDelay: `${i * 100}ms` }}>
              <div className={styles.stepNum}>{s.n}</div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepDesc}>{s.desc}</p>
              </div>
              {i < STEPS.length - 1 && <div className={styles.stepArrow}>→</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section className={styles.ctaBand}>
        <div className={styles.ctaBandInner}>
          <h2 className={`${styles.ctaBandTitle} ${styles.fadeUp}`}>
            Ücretsiz to-do list ile başla.<br />
            <span className={styles.heroGradient}>Bugün.</span>
          </h2>
          <p className={`${styles.ctaBandDesc} ${styles.fadeUp}`}>
            Reklamsız yapılacaklar listesi. Karmaşıklık yok. Sadece üretkenlik.
          </p>
          <MagneticBtn id="cta-band-btn" className={`${styles.ctaPrimary} ${styles.fadeUp}`} onClick={onGetStarted}>
            Ücretsiz Hesap Oluştur
            <span className={styles.ctaArrow}>→</span>
          </MagneticBtn>
        </div>
        <div className={styles.ctaBandOrb} />
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className={styles.faq}>
        <div className={styles.sectionHeader}>
          <div className={`${styles.sectionTag} ${styles.fadeUp}`}>SSS</div>
          <h2 className={`${styles.sectionTitle} ${styles.fadeUp}`}>Sık Sorulan Sorular</h2>
        </div>
        <div className={styles.faqList}>
          {FAQS.map((item, i) => (
            <div key={i} className={`${styles.faqItem} ${styles.fadeUp}`} style={{ transitionDelay: `${i * 60}ms` }}>
              <button
                id={`faq-btn-${i}`}
                className={`${styles.faqQuestion} ${openFaq === i ? styles.faqQuestionOpen : ""}`}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
              >
                {item.q}
                <span className={`${styles.faqChevron} ${openFaq === i ? styles.faqChevronOpen : ""}`}>
                  {openFaq === i ? "−" : "+"}
                </span>
              </button>
              <div className={styles.faqAnswer} style={{ maxHeight: openFaq === i ? "200px" : "0px" }}>
                <p>{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLogo}>
            <Image src="/icon.png" alt="Notsen" width={22} height={22} className={styles.logoImg} />
            <span>Notsen</span>
          </div>
          <p className={styles.footerTagline}>
            Hızlı görev takip uygulaması · Ücretsiz to-do list · Reklamsız yapılacaklar listesi
          </p>
          <p className={styles.footerCopy}>© {new Date().getFullYear()} Notsen. Tüm hakları saklıdır.</p>
          <div className={styles.footerDivider} />
          <div className={styles.madeBy}>
            <span className={styles.madeByLabel}>crafted with</span>
            <span className={styles.madeByHeart}>♥</span>
            <span className={styles.madeByLabel}>by</span>
            <a href="https://www.linkedin.com/in/ahsenpehlivan" target="_blank" rel="noopener noreferrer" className={styles.madeByName}>
              Ahsen Pehlivan
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
