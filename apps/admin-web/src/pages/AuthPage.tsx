import type { FormEvent } from "react";
import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  ChevronRight,
  LockKeyhole,
  MapPinned,
  ShieldCheck,
} from "lucide-react";
import { BrandLogo as Logo } from "../components/BrandLogo";
import { FormMessage } from "../components/FormMessage";
import { PasswordField } from "../components/PasswordField";
import type { AppView as View } from "../types";
import "./AuthPage.css";

export function AuthPage({
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
              <PasswordField
                name="password"
                visible={passwordVisible}
                onVisibilityChange={setPasswordVisible}
                autoComplete={isRegister ? "new-password" : "current-password"}
                placeholder="En az 8 karakter"
                minLength={8}
                required
              />
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
            {error && <FormMessage type="error">{error}</FormMessage>}
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
