import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  ClipboardCheck,
  MapPinned,
  Menu,
  Store,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { BrandLogo as Logo } from "../components/BrandLogo";
import type { AppView as View } from "../types";

export function HomePage({ goTo }: { goTo: (view: View) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const features = [
    [
      MapPinned,
      "Sahayı anlık izleyin",
      "Ekiplerin rotalarını, ziyaretlerini ve bölge performansını tek ekranda takip edin.",
    ],
    [
      ClipboardCheck,
      "Operasyonu standartlaştırın",
      "Görev, denetim ve ziyaret adımlarını ekibiniz için ortak bir düzene taşıyın.",
    ],
    [
      BarChart3,
      "Veriyle yönetin",
      "Sipariş, müşteri ve ekip verilerini aksiyona dönüşen raporlarla değerlendirin.",
    ],
  ] as const;

  return (
    <div className="public-page">
      <header className="public-header">
        <Logo onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
        <nav className={menuOpen ? "open" : ""} aria-label="Site menüsü">
          <a href="#solution" onClick={() => setMenuOpen(false)}>
            Çözüm
          </a>
          <a href="#workflow" onClick={() => setMenuOpen(false)}>
            Nasıl çalışır?
          </a>
          <button
            className="nav-login"
            type="button"
            onClick={() => goTo("login")}
          >
            Giriş yap
          </button>
          <button
            className="button button-small"
            type="button"
            onClick={() => goTo("register")}
          >
            Ücretsiz başlayın <ArrowRight size={16} />
          </button>
        </nav>
        <button
          className="menu-button"
          type="button"
          aria-label={menuOpen ? "Menüyü kapat" : "Menüyü aç"}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="kicker">
              <span /> Saha operasyonunun kontrol merkezi
            </p>
            <h1>
              Ekibiniz sahada.
              <br />
              <em>Siz her adıma hakimsiniz.</em>
            </h1>
            <p className="hero-lead">
              Ziyaretlerden siparişlere, rota planından ekip performansına kadar
              tüm saha operasyonunuzu tek merkezden yönetin.
            </p>
            <div className="hero-actions">
              <button
                className="button"
                type="button"
                onClick={() => goTo("register")}
              >
                Bölgenizi oluşturmaya başlayın <ArrowRight size={18} />
              </button>
              <button
                className="text-button"
                type="button"
                onClick={() =>
                  document
                    .querySelector("#workflow")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Nasıl çalıştığını görün <ChevronRight size={17} />
              </button>
            </div>
            <div className="trust-line">
              <span>
                <Check size={15} /> Kurulum gerektirmez
              </span>
              <span>
                <Check size={15} /> 14 gün ücretsiz
              </span>
              <span>
                <Check size={15} /> Kredi kartı gerekmez
              </span>
            </div>
          </div>

          <div
            className="hero-visual"
            aria-label="Taskfield operasyon paneli önizlemesi"
          >
            <div className="photo-layer" />
            <div className="preview-window">
              <div className="preview-bar">
                <span />
                <span />
                <span />
                <strong>Bugünün operasyonu</strong>
              </div>
              <div className="preview-content">
                <div className="mini-stats">
                  <div>
                    <span>Ziyaret</span>
                    <strong>27 / 42</strong>
                    <i className="green-line" />
                  </div>
                  <div>
                    <span>Sahada</span>
                    <strong>6 ekip</strong>
                    <i className="amber-line" />
                  </div>
                  <div>
                    <span>Sipariş</span>
                    <strong>₺184.750</strong>
                    <i className="blue-line" />
                  </div>
                </div>
                <div className="map-preview">
                  <div className="map-route route-one" />
                  <div className="map-route route-two" />
                  <span className="map-pin pin-one">
                    <MapPinned size={18} />
                  </span>
                  <span className="map-pin pin-two">
                    <Store size={17} />
                  </span>
                  <span className="map-pin pin-three">
                    <Users size={17} />
                  </span>
                  <div className="live-card">
                    <span className="live-dot" />
                    <div>
                      <strong>Ece Yılmaz</strong>
                      <small>Kadıköy · Ziyarette</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="floating-metric">
              <span>
                <Check size={16} />
              </span>
              <div>
                <small>Bugünkü tamamlanma</small>
                <strong>
                  %64 <em>+12%</em>
                </strong>
              </div>
            </div>
          </div>
        </section>

        <section className="proof-strip" aria-label="Öne çıkan değerler">
          <div>
            <strong>42</strong>
            <span>planlı ziyaret</span>
          </div>
          <div>
            <strong>%96</strong>
            <span>rota uyumu</span>
          </div>
          <div>
            <strong>18 dk</strong>
            <span>ortalama raporlama</span>
          </div>
          <p>Saha veriniz, ofise gelmeden kararınıza dönüşür.</p>
        </section>

        <section className="solution" id="solution">
          <div className="section-heading">
            <p className="kicker">
              <span /> Tek platform, tam görünürlük
            </p>
            <h2>Sahanın temposuna göre tasarlandı.</h2>
            <p>
              Dağınık tabloları ve mesaj trafiğini geride bırakın. Herkes ne
              yapacağını, siz de ne olduğunu bilin.
            </p>
          </div>
          <div className="feature-grid">
            {features.map(([Icon, title, description], index) => (
              <article key={title}>
                <span className="feature-number">0{index + 1}</span>
                <Icon size={25} />
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="workflow" id="workflow">
          <div>
            <p className="kicker light">
              <span /> Basit başlangıç, güçlü operasyon
            </p>
            <h2>Bölgenizi dakikalar içinde sahaya bağlayın.</h2>
          </div>
          <ol>
            <li>
              <span>01</span>
              <div>
                <strong>Hesabınızı oluşturun</strong>
                <p>Bölge ve şirket bilgilerinizi tanımlayın.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>Ekibinizi davet edin</strong>
                <p>Temsilcileri ve müşteri noktalarını ekleyin.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>Operasyonu başlatın</strong>
                <p>Rotaları planlayın, gelişmeleri canlı izleyin.</p>
              </div>
            </li>
          </ol>
          <button
            className="button button-light"
            type="button"
            onClick={() => goTo("register")}
          >
            Bölge hesabı oluşturun <ArrowRight size={18} />
          </button>
        </section>
      </main>
      <footer>
        <Logo onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
        <p>© 2026 Taskfield. Saha ekipleri için geliştirildi.</p>
        <button type="button" onClick={() => goTo("login")}>
          Bölge müdürü girişi
        </button>
      </footer>
    </div>
  );
}
