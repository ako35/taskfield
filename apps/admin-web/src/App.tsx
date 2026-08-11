import type { DailyVisitSummary, VisitStatus } from "@taskfield/domain";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Eye,
  EyeOff,
  LockKeyhole,
  LogOut,
  MapPinned,
  Menu,
  Plus,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingCart,
  Store,
  Users,
  X,
} from "lucide-react";
import "./App.css";

type View = "home" | "login" | "register" | "dashboard";

function Logo({ onClick }: { onClick: () => void }) {
  return (
    <button className="public-brand" type="button" onClick={onClick}>
      <span>TF</span>
      <strong>Taskfield</strong>
    </button>
  );
}

function Home({ goTo }: { goTo: (view: View) => void }) {
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

function Auth({
  mode,
  goTo,
}: {
  mode: "login" | "register";
  goTo: (view: View) => void;
}) {
  const isRegister = mode === "register";
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!event.currentTarget.checkValidity()) {
      setError("Lütfen tüm zorunlu alanları eksiksiz doldurun.");
      return;
    }
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    if (!email.includes("@") || password.length < 8) {
      setError("Geçerli bir e-posta ve en az 8 karakterli parola girin.");
      return;
    }

    const payload = isRegister
      ? {
          firstName: String(data.get("firstName") ?? ""),
          lastName: String(data.get("lastName") ?? ""),
          company: String(data.get("company") ?? ""),
          email,
          password,
        }
      : { email, password };

    setSubmitting(true);
    setError("");
    try {
      const apiUrl =
        import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";
      const response = await fetch(
        `${apiUrl}/auth/${isRegister ? "register" : "login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result = (await response.json()) as {
        message?: string | string[];
        token?: string;
        user?: {
          id: string;
          firstName: string;
          lastName: string;
          email: string;
          role: "regional_manager" | "field_agent";
        };
      };
      if (!response.ok || !result.user || !result.token) {
        const message = Array.isArray(result.message)
          ? result.message.join(" ")
          : result.message;
        setError(message ?? "İşlem tamamlanamadı. Lütfen tekrar deneyin.");
        return;
      }
      if (result.user.role !== "regional_manager") {
        setError("Bu portal yalnız bölge müdürü hesapları içindir.");
        return;
      }
      localStorage.setItem("taskfield_user", JSON.stringify(result.user));
      localStorage.setItem("taskfield_token", result.token);
      goTo("dashboard");
    } catch {
      setError(
        "API'ye ulaşılamadı. Backend servisinin çalıştığından emin olun.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-side">
        <Logo onClick={() => goTo("home")} />
        <div className="auth-side-copy">
          <p className="kicker light">
            <span /> Bölge yönetimi tek merkezde
          </p>
          <h1>
            Sahanın nabzını
            <br />
            her an tutun.
          </h1>
          <p>
            Ekibinizin rotalarını, ziyaretlerini ve satış performansını gerçek
            zamanlı yönetin.
          </p>
          <ul>
            <li>
              <ShieldCheck size={19} /> Güvenli ve rol bazlı erişim
            </li>
            <li>
              <MapPinned size={19} /> Canlı saha görünürlüğü
            </li>
            <li>
              <BarChart3 size={19} /> Bölge bazlı performans raporları
            </li>
          </ul>
        </div>
        <p className="auth-quote">
          “Doğru bilgi, sahaya zamanında ulaştığında sonuç üretir.”
        </p>
      </section>
      <main className="auth-main">
        <button
          className="back-button"
          type="button"
          onClick={() => goTo("home")}
        >
          <ChevronRight size={16} /> Ana sayfaya dön
        </button>
        <div className="auth-card">
          <div className="auth-heading">
            <span className="auth-icon">
              <LockKeyhole size={22} />
            </span>
            <p>BÖLGE MÜDÜRÜ PORTALI</p>
            <h2>
              {isRegister
                ? "Bölge hesabınızı oluşturun"
                : "Tekrar hoş geldiniz"}
            </h2>
            <span>
              {isRegister
                ? "Ekibinizi yönetmeye başlamak için bilgilerinizi girin."
                : "Operasyon panelinize erişmek için giriş yapın."}
            </span>
          </div>
          <form onSubmit={submit} noValidate>
            {isRegister && (
              <div className="field-row">
                <label>
                  Ad
                  <input name="firstName" required placeholder="Ahmet" />
                </label>
                <label>
                  Soyad
                  <input name="lastName" required placeholder="Kaya" />
                </label>
              </div>
            )}
            {isRegister && (
              <label>
                Şirket / Distribütör adı
                <input
                  name="company"
                  required
                  placeholder="Şirket adını girin"
                />
              </label>
            )}
            <label>
              Kurumsal e-posta
              <input
                name="email"
                type="email"
                autoComplete="email"
                placeholder="ad@firma.com"
                required
              />
            </label>
            <label>
              Parola
              <div className="password-field">
                <input
                  name="password"
                  type={passwordVisible ? "text" : "password"}
                  autoComplete={
                    isRegister ? "new-password" : "current-password"
                  }
                  placeholder="En az 8 karakter"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  aria-label={
                    passwordVisible ? "Parolayı gizle" : "Parolayı göster"
                  }
                  onClick={() => setPasswordVisible(!passwordVisible)}
                >
                  {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            {!isRegister && (
              <div className="form-options">
                <label className="checkbox">
                  <input type="checkbox" /> Beni hatırla
                </label>
                <button type="button">Parolamı unuttum</button>
              </div>
            )}
            {isRegister && (
              <label className="checkbox terms">
                <input type="checkbox" required />
                <span>
                  Kullanım koşullarını ve gizlilik politikasını kabul ediyorum.
                </span>
              </label>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button
              className="button auth-submit"
              type="submit"
              disabled={submitting}
            >
              {submitting
                ? "İşleniyor..."
                : isRegister
                  ? "Hesabımı oluştur"
                  : "Giriş yap"}
              <ArrowRight size={18} />
            </button>
          </form>
          <p className="auth-switch">
            {isRegister ? "Zaten hesabınız var mı?" : "Henüz hesabınız yok mu?"}{" "}
            <button
              type="button"
              onClick={() => goTo(isRegister ? "login" : "register")}
            >
              {isRegister ? "Giriş yapın" : "Ücretsiz hesap oluşturun"}
            </button>
          </p>
          <p className="security-note">
            <ShieldCheck size={15} /> Bilgileriniz güvenli bağlantı ile korunur.
          </p>
        </div>
      </main>
    </div>
  );
}

const summary: DailyVisitSummary = {
  planned: 42,
  completed: 27,
  inProgress: 6,
  orderTotal: 184750,
};

const visits: Array<{
  customer: string;
  district: string;
  representative: string;
  time: string;
  status: VisitStatus;
  order: string;
}> = [
  {
    customer: "Pati Dünyası",
    district: "Kadıköy",
    representative: "Ece Yılmaz",
    time: "09:15",
    status: "completed",
    order: "₺12.480",
  },
  {
    customer: "Vetline Klinik",
    district: "Ataşehir",
    representative: "Mert Kaya",
    time: "10:30",
    status: "in_progress",
    order: "Bekleniyor",
  },
  {
    customer: "Can Dostlar Pet",
    district: "Üsküdar",
    representative: "Selin Akın",
    time: "11:00",
    status: "planned",
    order: "Bekleniyor",
  },
  {
    customer: "Pet Gross",
    district: "Maltepe",
    representative: "Can Demir",
    time: "11:45",
    status: "cancelled",
    order: "Sipariş yok",
  },
];

const statusLabels: Record<VisitStatus, string> = {
  planned: "Planlandı",
  in_progress: "Sahada",
  completed: "Tamamlandı",
  cancelled: "İptal",
};

function ProfileMenu({
  profile,
  initials,
  placement,
  onLogout,
}: {
  profile: { firstName: string; lastName: string };
  initials: string;
  placement: "top" | "sidebar";
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeMenu = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      if (
        event instanceof MouseEvent &&
        menuRef.current?.contains(event.target as Node)
      )
        return;
      setOpen(false);
    };
    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", closeMenu);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", closeMenu);
    };
  }, [open]);

  const fullName = `${profile.firstName} ${profile.lastName}`;
  return (
    <div className={`profile-menu profile-menu-${placement}`} ref={menuRef}>
      <button
        className="profile-trigger"
        type="button"
        aria-label={`${fullName} profil menüsü`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen(!open)}
      >
        <span className="avatar">{initials}</span>
        <span className="profile-copy">
          <strong>{fullName}</strong>
          <small>Bölge Müdürü</small>
        </span>
        <ChevronDown className={open ? "rotated" : ""} size={15} />
      </button>
      {open && (
        <div className="profile-dropdown" role="menu">
          <div className="profile-dropdown-heading">
            <span className="avatar">{initials}</span>
            <span>
              <strong>{fullName}</strong>
              <small>Bölge Müdürü</small>
            </span>
          </div>
          <button type="button" role="menuitem" onClick={onLogout}>
            <LogOut size={16} /> Çıkış yap
          </button>
        </div>
      )}
    </div>
  );
}

interface FieldAgent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

interface VisitAssignment {
  id: string;
  fieldAgentId: string;
  agentFirstName: string;
  agentLastName: string;
  customerName: string;
  district: string;
  address: string;
  scheduledAt: string;
  notes: string | null;
  status: VisitStatus;
}

function TeamManagement({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [agents, setAgents] = useState<FieldAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordEditorId, setPasswordEditorId] = useState<string | null>(null);
  const [newAgentPassword, setNewAgentPassword] = useState("");
  const [newAgentPasswordVisible, setNewAgentPasswordVisible] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";
  const token = localStorage.getItem("taskfield_token");
  const passwordAgent = agents.find((agent) => agent.id === passwordEditorId);

  useEffect(() => {
    async function loadTeam() {
      if (!token) {
        onUnauthorized();
        return;
      }
      try {
        const response = await fetch(`${apiUrl}/team`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 401 || response.status === 403) {
          onUnauthorized();
          return;
        }
        const result = (await response.json()) as {
          users?: FieldAgent[];
          message?: string;
        };
        if (!response.ok) throw new Error(result.message);
        setAgents(result.users ?? []);
      } catch (loadError) {
        setError(
          loadError instanceof Error && loadError.message
            ? loadError.message
            : "Saha ekibi yüklenemedi.",
        );
      } finally {
        setLoading(false);
      }
    }
    void loadTeam();
  }, [apiUrl, onUnauthorized, token]);

  async function createAgent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!event.currentTarget.checkValidity() || !token) {
      setError("Tüm alanları eksiksiz doldurun.");
      return;
    }
    const form = event.currentTarget;
    const data = new FormData(form);
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`${apiUrl}/team`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: data.get("firstName"),
          lastName: data.get("lastName"),
          email: data.get("email"),
          password: data.get("password"),
        }),
      });
      if (response.status === 401 || response.status === 403) {
        onUnauthorized();
        return;
      }
      const result = (await response.json()) as {
        user?: FieldAgent;
        message?: string | string[];
      };
      if (!response.ok || !result.user) {
        const message = Array.isArray(result.message)
          ? result.message.join(" ")
          : result.message;
        setError(message ?? "Hesap oluşturulamadı.");
        return;
      }
      setAgents((current) => [result.user!, ...current]);
      setSuccess(`${result.user.firstName} için mobil hesap oluşturuldu.`);
      form.reset();
    } catch {
      setError("API'ye ulaşılamadı. Lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  function openPasswordEditor(agentId: string) {
    setPasswordEditorId(agentId);
    setNewAgentPassword("");
    setNewAgentPasswordVisible(false);
    setPasswordFeedback(null);
  }

  async function resetAgentPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passwordEditorId || !token || newAgentPassword.length < 8) {
      setPasswordFeedback({
        type: "error",
        text: "Yeni parola en az 8 karakter olmalıdır.",
      });
      return;
    }
    setPasswordSaving(true);
    setPasswordFeedback(null);
    try {
      const response = await fetch(
        `${apiUrl}/team/${passwordEditorId}/password`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password: newAgentPassword }),
        },
      );
      if (response.status === 401 || response.status === 403) {
        onUnauthorized();
        return;
      }
      const result = (await response.json()) as {
        message?: string | string[];
      };
      const message = Array.isArray(result.message)
        ? result.message.join(" ")
        : result.message;
      if (!response.ok) {
        setPasswordFeedback({
          type: "error",
          text: message ?? "Parola güncellenemedi.",
        });
        return;
      }
      setNewAgentPassword("");
      setPasswordFeedback({
        type: "success",
        text: message ?? "Parola güncellendi.",
      });
    } catch {
      setPasswordFeedback({
        type: "error",
        text: "API'ye ulaşılamadı. Lütfen tekrar deneyin.",
      });
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <section className="content team-content" id="team">
      <div className="team-heading">
        <div>
          <p className="eyebrow">EKİP YÖNETİMİ</p>
          <h2>Saha ekibi</h2>
          <p>Mobil uygulamaya erişecek çalışan hesaplarını yönetin.</p>
        </div>
        <span className="team-count">
          <Users size={17} /> {agents.length} çalışan
        </span>
      </div>
      <div className="team-grid">
        <section className="panel team-list-panel">
          <div className="panel-header">
            <div>
              <h2>Ekip üyeleri</h2>
              <p>Hesabı oluşturulan saha çalışanları</p>
            </div>
          </div>
          {loading ? (
            <p className="team-empty">Ekip yükleniyor...</p>
          ) : agents.length === 0 ? (
            <div className="team-empty">
              <Users size={24} />
              <strong>Henüz ekip üyesi yok</strong>
              <span>
                İlk mobil kullanıcı hesabını yan taraftaki formdan oluşturun.
              </span>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Çalışan</th>
                    <th>E-posta</th>
                    <th>Parola</th>
                    <th>Rol</th>
                    <th>Oluşturulma</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr key={agent.id}>
                      <td>
                        <strong>
                          {agent.firstName} {agent.lastName}
                        </strong>
                      </td>
                      <td>{agent.email}</td>
                      <td>
                        <div className="agent-password-cell">
                          <span aria-label="Parola güvenlik nedeniyle gizli">
                            ••••••••
                          </span>
                          <button
                            type="button"
                            onClick={() => openPasswordEditor(agent.id)}
                          >
                            <LockKeyhole size={14} /> Değiştir
                          </button>
                        </div>
                      </td>
                      <td>
                        <span className="status completed">Saha çalışanı</span>
                      </td>
                      <td>
                        {new Intl.DateTimeFormat("tr-TR").format(
                          new Date(agent.createdAt),
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {passwordAgent && (
            <div className="password-modal-backdrop">
              <form
                className="password-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="password-modal-title"
                onSubmit={resetAgentPassword}
              >
                <button
                  className="password-modal-close"
                  type="button"
                  aria-label="Parola alanını kapat"
                  onClick={() => setPasswordEditorId(null)}
                >
                  <X size={18} />
                </button>
                <span className="password-modal-icon">
                  <LockKeyhole size={20} />
                </span>
                <div className="password-modal-heading">
                  <strong id="password-modal-title">
                    {passwordAgent.firstName} için yeni parola
                  </strong>
                  <small>
                    Mevcut parola hash olarak saklandığı için görüntülenemez.
                    Buradan yenisini belirleyin.
                  </small>
                </div>
                <div className="password-editor-controls">
                  <div className="password-field">
                    <input
                      autoFocus
                      value={newAgentPassword}
                      onChange={(event) =>
                        setNewAgentPassword(event.target.value)
                      }
                      type={newAgentPasswordVisible ? "text" : "password"}
                      minLength={8}
                      maxLength={128}
                      required
                      autoComplete="new-password"
                      placeholder="Yeni parola"
                      aria-label={`${passwordAgent.firstName} için yeni parola`}
                    />
                    <button
                      type="button"
                      aria-label={
                        newAgentPasswordVisible
                          ? "Yeni parolayı gizle"
                          : "Yeni parolayı göster"
                      }
                      aria-pressed={newAgentPasswordVisible}
                      onClick={() =>
                        setNewAgentPasswordVisible(!newAgentPasswordVisible)
                      }
                    >
                      {newAgentPasswordVisible ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </div>
                  <div className="password-modal-actions">
                    <button
                      className="password-cancel-button"
                      type="button"
                      onClick={() => setPasswordEditorId(null)}
                    >
                      Vazgeç
                    </button>
                    <button
                      className="password-save-button"
                      type="submit"
                      disabled={passwordSaving}
                    >
                      {passwordSaving
                        ? "Kaydediliyor..."
                        : "Yeni parolayı kaydet"}
                    </button>
                  </div>
                </div>
                {passwordFeedback && (
                  <p
                    className={`password-feedback ${passwordFeedback.type}`}
                    role={
                      passwordFeedback.type === "error" ? "alert" : "status"
                    }
                  >
                    {passwordFeedback.text}
                  </p>
                )}
              </form>
            </div>
          )}
        </section>
        <aside className="panel team-form-panel">
          <div className="team-form-title">
            <span>
              <Plus size={18} />
            </span>
            <div>
              <h2>Yeni ekip üyesi</h2>
              <p>Mobil giriş hesabı oluşturun</p>
            </div>
          </div>
          <form onSubmit={createAgent} noValidate>
            <div className="field-row">
              <label>
                Ad
                <input
                  name="firstName"
                  required
                  minLength={2}
                  placeholder="Ece"
                />
              </label>
              <label>
                Soyad
                <input
                  name="lastName"
                  required
                  minLength={2}
                  placeholder="Yılmaz"
                />
              </label>
            </div>
            <label>
              E-posta
              <input
                name="email"
                type="email"
                required
                placeholder="ece@firma.com"
              />
            </label>
            <label>
              İlk giriş parolası
              <div className="password-field">
                <input
                  name="password"
                  type={passwordVisible ? "text" : "password"}
                  minLength={8}
                  required
                  autoComplete="new-password"
                  placeholder="En az 8 karakter"
                />
                <button
                  type="button"
                  aria-label={
                    passwordVisible ? "Parolayı gizle" : "Parolayı göster"
                  }
                  aria-pressed={passwordVisible}
                  onClick={() => setPasswordVisible(!passwordVisible)}
                >
                  {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            <p className="team-form-note">
              Bu parolayı siz belirlersiniz. Çalışan mobil uygulamaya giriş
              yaptıktan sonra profilinden parolasını değiştirebilir.
            </p>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            {success && (
              <p className="form-success" role="status">
                {success}
              </p>
            )}
            <button className="button" type="submit" disabled={submitting}>
              {submitting ? "Oluşturuluyor..." : "Mobil hesabı oluştur"}
              <ArrowRight size={17} />
            </button>
          </form>
        </aside>
      </div>
    </section>
  );
}

function VisitsManagement({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [agents, setAgents] = useState<FieldAgent[]>([]);
  const [assignments, setAssignments] = useState<VisitAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";
  const token = localStorage.getItem("taskfield_token");

  useEffect(() => {
    async function loadAssignmentData() {
      if (!token) {
        onUnauthorized();
        return;
      }
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [teamResponse, visitsResponse] = await Promise.all([
          fetch(`${apiUrl}/team`, { headers }),
          fetch(`${apiUrl}/visits`, { headers }),
        ]);
        if (
          teamResponse.status === 401 ||
          teamResponse.status === 403 ||
          visitsResponse.status === 401 ||
          visitsResponse.status === 403
        ) {
          onUnauthorized();
          return;
        }
        const teamResult = (await teamResponse.json()) as {
          users?: FieldAgent[];
          message?: string;
        };
        const visitsResult = (await visitsResponse.json()) as {
          visits?: VisitAssignment[];
          message?: string;
        };
        if (!teamResponse.ok) throw new Error(teamResult.message);
        if (!visitsResponse.ok) throw new Error(visitsResult.message);
        setAgents(teamResult.users ?? []);
        setAssignments(visitsResult.visits ?? []);
      } catch (loadError) {
        setError(
          loadError instanceof Error && loadError.message
            ? loadError.message
            : "Ziyaret atamaları yüklenemedi.",
        );
      } finally {
        setLoading(false);
      }
    }
    void loadAssignmentData();
  }, [apiUrl, onUnauthorized, token]);

  async function createAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity() || !token) {
      setError("Atama için tüm zorunlu alanları doldurun.");
      return;
    }
    const data = new FormData(form);
    const scheduledValue = String(data.get("scheduledAt") ?? "");
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`${apiUrl}/visits`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fieldAgentId: data.get("fieldAgentId"),
          customerName: data.get("customerName"),
          district: data.get("district"),
          address: data.get("address"),
          scheduledAt: new Date(scheduledValue).toISOString(),
          notes: data.get("notes"),
        }),
      });
      if (response.status === 401 || response.status === 403) {
        onUnauthorized();
        return;
      }
      const result = (await response.json()) as {
        visit?: VisitAssignment;
        message?: string | string[];
      };
      if (!response.ok || !result.visit) {
        const message = Array.isArray(result.message)
          ? result.message.join(" ")
          : result.message;
        setError(message ?? "Ziyaret atanamadı.");
        return;
      }
      setAssignments((current) =>
        [...current, result.visit!].sort(
          (first, second) =>
            new Date(first.scheduledAt).getTime() -
            new Date(second.scheduledAt).getTime(),
        ),
      );
      setSuccess(
        `${result.visit.agentFirstName} için ziyaret ataması oluşturuldu.`,
      );
      form.reset();
    } catch {
      setError("API'ye ulaşılamadı. Lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="content visits-content" id="visits">
      <div className="team-heading">
        <div>
          <p className="eyebrow">ROTA VE ZİYARET YÖNETİMİ</p>
          <h2>Ziyaret atamaları</h2>
          <p>Her müşteriyi konumu ve zamanı ile ekip üyesine atayın.</p>
        </div>
        <span className="team-count">
          <MapPinned size={17} /> {assignments.length} atama
        </span>
      </div>
      <div className="assignment-grid">
        <section className="panel assignment-list-panel">
          <div className="panel-header">
            <div>
              <h2>Planlanan ziyaretler</h2>
              <p>Saha ekibine gönderilen müşteri ziyaretleri</p>
            </div>
          </div>
          {loading ? (
            <p className="team-empty">Ziyaretler yükleniyor...</p>
          ) : assignments.length === 0 ? (
            <div className="team-empty">
              <MapPinned size={24} />
              <strong>Henüz ziyaret ataması yok</strong>
              <span>İlk müşteri ziyaretini yan taraftan planlayın.</span>
            </div>
          ) : (
            <div className="assignment-list">
              {assignments.map((assignment) => {
                const scheduledAt = new Date(assignment.scheduledAt);
                return (
                  <article key={assignment.id}>
                    <div className="assignment-date">
                      <strong>{scheduledAt.getDate()}</strong>
                      <span>
                        {scheduledAt.toLocaleDateString("tr-TR", {
                          month: "short",
                        })}
                      </span>
                      <time>
                        {scheduledAt.toLocaleTimeString("tr-TR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>
                    <div className="assignment-customer">
                      <strong>{assignment.customerName}</strong>
                      <span>
                        <MapPinned size={13} /> {assignment.district} ·{" "}
                        {assignment.address}
                      </span>
                      {assignment.notes && <small>{assignment.notes}</small>}
                    </div>
                    <div className="assignment-agent">
                      <span className="avatar">
                        {`${assignment.agentFirstName[0]}${assignment.agentLastName[0]}`.toLocaleUpperCase(
                          "tr-TR",
                        )}
                      </span>
                      <div>
                        <strong>
                          {assignment.agentFirstName} {assignment.agentLastName}
                        </strong>
                        <small>Saha çalışanı</small>
                      </div>
                    </div>
                    <span className={`status ${assignment.status}`}>
                      {statusLabels[assignment.status]}
                    </span>
                  </article>
                );
              })}
            </div>
          )}
        </section>
        <aside className="panel assignment-form-panel">
          <div className="team-form-title">
            <span>
              <Plus size={18} />
            </span>
            <div>
              <h2>Yeni ziyaret ata</h2>
              <p>Müşteri ve rota bilgilerini girin</p>
            </div>
          </div>
          {agents.length === 0 && !loading ? (
            <div className="assignment-no-team">
              <Users size={20} />
              <strong>Önce saha ekibi oluşturun</strong>
              <p>Ziyaret atamak için en az bir ekip üyesi gereklidir.</p>
            </div>
          ) : (
            <form onSubmit={createAssignment} noValidate>
              <label>
                Saha çalışanı
                <select name="fieldAgentId" required defaultValue="">
                  <option value="" disabled>
                    Ekip üyesi seçin
                  </option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.firstName} {agent.lastName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Müşteri adı
                <input
                  name="customerName"
                  required
                  minLength={2}
                  maxLength={120}
                  placeholder="Pati Dünyası"
                />
              </label>
              <div className="field-row">
                <label>
                  İlçe / Bölge
                  <input
                    name="district"
                    required
                    minLength={2}
                    maxLength={80}
                    placeholder="Kadıköy"
                  />
                </label>
                <label>
                  Tarih ve saat
                  <input name="scheduledAt" type="datetime-local" required />
                </label>
              </div>
              <label>
                Açık adres
                <textarea
                  name="address"
                  required
                  minLength={5}
                  maxLength={300}
                  placeholder="Mahalle, cadde, bina numarası"
                />
              </label>
              <label>
                Ziyaret notu
                <textarea
                  name="notes"
                  maxLength={500}
                  placeholder="Görüşülecek konu veya görev detayı"
                />
              </label>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              {success && (
                <p className="form-success" role="status">
                  {success}
                </p>
              )}
              <button className="button" type="submit" disabled={submitting}>
                {submitting ? "Atanıyor..." : "Ziyareti ekibe ata"}
                <ArrowRight size={17} />
              </button>
            </form>
          )}
        </aside>
      </div>
    </section>
  );
}

function Dashboard({ goTo }: { goTo: (view: View) => void }) {
  const [section, setSection] = useState<"overview" | "visits" | "team">(
    "overview",
  );
  let profile = { firstName: "Ahmet", lastName: "Kaya" };
  try {
    const storedProfile = JSON.parse(
      localStorage.getItem("taskfield_user") ?? "null",
    ) as { firstName?: string; lastName?: string } | null;
    if (storedProfile?.firstName && storedProfile.lastName) {
      profile = {
        firstName: storedProfile.firstName,
        lastName: storedProfile.lastName,
      };
    }
  } catch {
    localStorage.removeItem("taskfield_user");
  }
  const initials =
    `${profile.firstName[0]}${profile.lastName[0]}`.toLocaleUpperCase("tr-TR");
  const logout = () => {
    localStorage.removeItem("taskfield_user");
    localStorage.removeItem("taskfield_token");
    goTo("home");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span>TF</span>
          <strong>Taskfield</strong>
        </div>
        <nav aria-label="Ana menü">
          <a
            className={section === "overview" ? "active" : ""}
            href="#overview"
            onClick={(event) => {
              event.preventDefault();
              setSection("overview");
            }}
          >
            <ClipboardCheck size={19} /> Genel Bakış
          </a>
          <a
            className={section === "visits" ? "active" : ""}
            href="#visits"
            onClick={(event) => {
              event.preventDefault();
              setSection("visits");
            }}
          >
            <MapPinned size={19} /> Ziyaretler
          </a>
          <a href="#customers">
            <Store size={19} /> Müşteriler
          </a>
          <a href="#orders">
            <ShoppingCart size={19} /> Siparişler
          </a>
          <a href="#products">
            <PackageCheck size={19} /> Ürünler
          </a>
          <a
            className={section === "team" ? "active" : ""}
            href="#team"
            onClick={(event) => {
              event.preventDefault();
              setSection("team");
            }}
          >
            <Users size={19} /> Saha Ekibi
          </a>
        </nav>
        <ProfileMenu
          profile={profile}
          initials={initials}
          placement="sidebar"
          onLogout={logout}
        />
      </aside>

      <main>
        <header className="topbar">
          <div>
            <p className="eyebrow">10 Ağustos 2026, Pazartesi</p>
            <h1>Saha operasyonu</h1>
          </div>
          <div className="topbar-actions">
            <label className="search">
              <Search size={18} />
              <input aria-label="Ara" placeholder="Müşteri veya ekip ara" />
            </label>
            <button
              className="icon-button"
              type="button"
              aria-label="Bildirimler"
            >
              <Bell size={20} />
              <span />
            </button>
            <ProfileMenu
              profile={profile}
              initials={initials}
              placement="top"
              onLogout={logout}
            />
          </div>
        </header>

        {section === "team" ? (
          <TeamManagement onUnauthorized={logout} />
        ) : section === "visits" ? (
          <VisitsManagement onUnauthorized={logout} />
        ) : (
          <section className="content" id="overview">
            <div className="stat-grid">
              <article>
                <span className="stat-icon green">
                  <ClipboardCheck />
                </span>
                <div>
                  <p>Tamamlanan ziyaret</p>
                  <strong>
                    {summary.completed}
                    <small> / {summary.planned}</small>
                  </strong>
                  <em>Bugünkü planın %64'ü</em>
                </div>
              </article>
              <article>
                <span className="stat-icon amber">
                  <MapPinned />
                </span>
                <div>
                  <p>Şu an sahada</p>
                  <strong>{summary.inProgress}</strong>
                  <em>4 farklı bölgede</em>
                </div>
              </article>
              <article>
                <span className="stat-icon blue">
                  <ShoppingCart />
                </span>
                <div>
                  <p>Günlük sipariş</p>
                  <strong>₺{summary.orderTotal.toLocaleString("tr-TR")}</strong>
                  <em>Hedefin %72'si</em>
                </div>
              </article>
              <article>
                <span className="stat-icon red">
                  <AlertTriangle />
                </span>
                <div>
                  <p>Aksiyon bekleyen</p>
                  <strong>8</strong>
                  <em>3 kritik stok bildirimi</em>
                </div>
              </article>
            </div>

            <div className="workspace-grid">
              <section className="panel visits-panel" id="visits">
                <div className="panel-header">
                  <div>
                    <h2>Bugünün ziyaretleri</h2>
                    <p>Planlanan saha hareketleri ve sipariş durumu</p>
                  </div>
                  <button type="button">
                    Tümünü gör <ChevronRight size={16} />
                  </button>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Müşteri</th>
                        <th>Temsilci</th>
                        <th>Saat</th>
                        <th>Durum</th>
                        <th>Sipariş</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visits.map((visit) => (
                        <tr key={visit.customer}>
                          <td>
                            <strong>{visit.customer}</strong>
                            <span>{visit.district}</span>
                          </td>
                          <td>{visit.representative}</td>
                          <td>{visit.time}</td>
                          <td>
                            <span className={`status ${visit.status}`}>
                              {statusLabels[visit.status]}
                            </span>
                          </td>
                          <td className="order-value">{visit.order}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <aside className="panel alerts-panel">
                <div className="panel-header">
                  <div>
                    <h2>Saha bildirimleri</h2>
                    <p>Son 2 saat</p>
                  </div>
                </div>
                <ul>
                  <li>
                    <span className="alert-dot critical" />
                    <div>
                      <strong>Stok kritik seviyede</strong>
                      <p>Pet Gross · Somonlu Kedi Maması 3 kg</p>
                      <time>12 dk önce</time>
                    </div>
                  </li>
                  <li>
                    <span className="alert-dot warning" />
                    <div>
                      <strong>Rakip fiyat değişikliği</strong>
                      <p>Vetline Klinik · %8 fiyat farkı</p>
                      <time>34 dk önce</time>
                    </div>
                  </li>
                  <li>
                    <span className="alert-dot info" />
                    <div>
                      <strong>Yeni sipariş alındı</strong>
                      <p>Pati Dünyası · ₺12.480</p>
                      <time>51 dk önce</time>
                    </div>
                  </li>
                </ul>
              </aside>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function App() {
  const [view, setView] = useState<View>("home");
  const goTo = (nextView: View) => {
    setView(nextView);
    window.scrollTo(0, 0);
  };

  if (view === "login" || view === "register") {
    return <Auth key={view} mode={view} goTo={goTo} />;
  }
  if (view === "dashboard") {
    return <Dashboard goTo={goTo} />;
  }
  return <Home goTo={goTo} />;
}

export default App;
