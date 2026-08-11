import type { VisitStatus } from "@taskfield/domain";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { ArrowRight, MapPinned, Plus, Users } from "lucide-react";
import { FormMessage } from "../../components/FormMessage";
import { PageHeader } from "../../components/PageHeader";
import type { FieldAgent, VisitAssignment } from "../../types";

const statusLabels: Record<VisitStatus, string> = {
  planned: "Planlandı",
  in_progress: "Sahada",
  completed: "Tamamlandı",
  cancelled: "İptal",
};

export function VisitsManagement({
  onUnauthorized,
}: {
  onUnauthorized: () => void;
}) {
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
      <PageHeader
        eyebrow="ROTA VE ZİYARET YÖNETİMİ"
        title="Ziyaret atamaları"
        description="Her müşteriyi konumu ve zamanı ile ekip üyesine atayın."
        meta={
          <span className="team-count">
            <MapPinned size={17} /> {assignments.length} atama
          </span>
        }
      />
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
              {error && <FormMessage type="error">{error}</FormMessage>}
              {success && <FormMessage type="success">{success}</FormMessage>}
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
