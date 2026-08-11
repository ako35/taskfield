import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { ArrowRight, LockKeyhole, Plus, Users, X } from "lucide-react";
import { FormMessage } from "../../components/FormMessage";
import { PageHeader } from "../../components/PageHeader";
import { PasswordField } from "../../components/PasswordField";
import type { FieldAgent } from "../../types";

export function TeamManagement({
  onUnauthorized,
}: {
  onUnauthorized: () => void;
}) {
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
      <PageHeader
        eyebrow="EKİP YÖNETİMİ"
        title="Saha ekibi"
        description="Mobil uygulamaya erişecek çalışan hesaplarını yönetin."
        meta={
          <span className="team-count">
            <Users size={17} /> {agents.length} çalışan
          </span>
        }
      />
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
                  <PasswordField
                    autoFocus
                    value={newAgentPassword}
                    onChange={(event) =>
                      setNewAgentPassword(event.target.value)
                    }
                    visible={newAgentPasswordVisible}
                    onVisibilityChange={setNewAgentPasswordVisible}
                    minLength={8}
                    maxLength={128}
                    required
                    autoComplete="new-password"
                    placeholder="Yeni parola"
                    aria-label={`${passwordAgent.firstName} için yeni parola`}
                    showLabel="Yeni parolayı göster"
                    hideLabel="Yeni parolayı gizle"
                  />
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
              <PasswordField
                name="password"
                visible={passwordVisible}
                onVisibilityChange={setPasswordVisible}
                minLength={8}
                required
                autoComplete="new-password"
                placeholder="En az 8 karakter"
              />
            </label>
            <p className="team-form-note">
              Bu parolayı siz belirlersiniz. Çalışan mobil uygulamaya giriş
              yaptıktan sonra profilinden parolasını değiştirebilir.
            </p>
            {error && <FormMessage type="error">{error}</FormMessage>}
            {success && <FormMessage type="success">{success}</FormMessage>}
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
