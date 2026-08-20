import type { VisitStatus } from "@taskfield/domain";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  MapPinned,
  Plus,
  Search,
  Store,
  Users,
  X,
} from "lucide-react";
import { FormMessage } from "../../components/FormMessage";
import { LocationMap } from "../../components/LocationMap";
import { PageHeader } from "../../components/PageHeader";
import type { Customer, FieldAgent, VisitAssignment } from "../../types";
import "./VisitsManagement.css";

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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [assignments, setAssignments] = useState<VisitAssignment[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedVisitId, setSelectedVisitId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";
  const token = localStorage.getItem("taskfield_token");
  const selectedCustomer = customers.find(
    (customer) => customer.id === selectedCustomerId,
  );
  const selectedVisit = assignments.find(
    (assignment) => assignment.id === selectedVisitId,
  );

  function formatVisitDateTime(value: string | null | undefined) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return new Intl.DateTimeFormat("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  }

  function toDateInputValue(date: Date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const [dateFrom, setDateFrom] = useState(() => toDateInputValue(new Date()));
  const [dateTo, setDateTo] = useState(() => toDateInputValue(new Date()));
  const [pendingDateFrom, setPendingDateFrom] = useState(() =>
    toDateInputValue(new Date()),
  );
  const [pendingDateTo, setPendingDateTo] = useState(() =>
    toDateInputValue(new Date()),
  );

  function handleDateFromChange(value: string) {
    setPendingDateFrom(value);
    if (value && pendingDateTo && value > pendingDateTo) {
      setPendingDateTo(value);
    }
  }

  function handleDateToChange(value: string) {
    setPendingDateTo(value);
    if (value && pendingDateFrom && value < pendingDateFrom) {
      setPendingDateFrom(value);
    }
  }

  function applyDateRangeFilter() {
    setDateFrom(pendingDateFrom);
    setDateTo(pendingDateTo);
  }

  function resetDateRangeToToday() {
    const todayValue = toDateInputValue(new Date());
    setPendingDateFrom(todayValue);
    setPendingDateTo(todayValue);
    setDateFrom(todayValue);
    setDateTo(todayValue);
  }

  const filteredAssignments = assignments.filter((assignment) => {
    const scheduledAt = new Date(assignment.scheduledAt);
    if (dateFrom && scheduledAt < new Date(`${dateFrom}T00:00:00`)) {
      return false;
    }
    if (dateTo && scheduledAt > new Date(`${dateTo}T23:59:59.999`)) {
      return false;
    }
    return true;
  });

  useEffect(() => {
    let active = true;

    const loadAssignmentData = async () => {
      if (!token) {
        onUnauthorized();
        return;
      }
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [teamResponse, customersResponse, visitsResponse] =
          await Promise.all([
            fetch(`${apiUrl}/team`, { headers }),
            fetch(`${apiUrl}/customers`, { headers }),
            fetch(`${apiUrl}/visits`, { headers }),
          ]);
        if (
          teamResponse.status === 401 ||
          teamResponse.status === 403 ||
          customersResponse.status === 401 ||
          customersResponse.status === 403 ||
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
        const customersResult = (await customersResponse.json()) as {
          customers?: Customer[];
          message?: string;
        };
        const visitsResult = (await visitsResponse.json()) as {
          visits?: VisitAssignment[];
          message?: string;
        };
        if (!teamResponse.ok) throw new Error(teamResult.message);
        if (!customersResponse.ok) throw new Error(customersResult.message);
        if (!visitsResponse.ok) throw new Error(visitsResult.message);

        if (!active) return;
        setAgents(teamResult.users ?? []);
        setCustomers(customersResult.customers ?? []);
        setAssignments(visitsResult.visits ?? []);
      } catch (loadError) {
        if (!active) return;
        setError(
          loadError instanceof Error && loadError.message
            ? loadError.message
            : "Ziyaret atamaları yüklenemedi.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    const liveEventsUrl = `${apiUrl}/visits/events${token ? `?token=${encodeURIComponent(token)}` : ""}`;
    const eventSource = new EventSource(liveEventsUrl);
    eventSource.addEventListener("visit-updated", () => {
      void loadAssignmentData();
    });
    eventSource.onerror = () => {
      // EventSource otomatik yeniden bağlanma yapar; kapatmaya gerek yok.
    };

    void loadAssignmentData();

    return () => {
      active = false;
      eventSource.close();
    };
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
          customerId: data.get("customerId"),
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
      setSelectedCustomerId("");
    } catch {
      setError("API'ye ulaşılamadı. Lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelAssignment(visitId: string) {
    if (!token) {
      onUnauthorized();
      return;
    }
    setCancellingId(visitId);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`${apiUrl}/visits/${visitId}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
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
        setError(message ?? "Ziyaret iptal edilemedi.");
        return;
      }
      setAssignments((current) =>
        current.map((assignment) =>
          assignment.id === result.visit!.id ? result.visit! : assignment,
        ),
      );
      setSuccess("Ziyaret iptal edildi.");
    } catch {
      setError("API'ye ulaşılamadı. Lütfen tekrar deneyin.");
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <section className="content visits-content" id="visits">
      <PageHeader
        eyebrow="ROTA VE ZİYARET YÖNETİMİ"
        title="Ziyaret atamaları"
        description="Her müşteriyi konumu ve zamanı ile ekip üyesine atayın."
        meta={
          <button
            type="button"
            className="button button-small"
            onClick={() => setSelectedVisitId(null)}
          >
            <Plus size={16} /> Yeni ziyaret ata
          </button>
        }
      />
      <div className="assignment-grid">
        <section className="panel assignment-list-panel">
          <div className="panel-header">
            <div>
              <h2>Planlanan ziyaretler</h2>
              <p>Saha ekibine gönderilen müşteri ziyaretleri</p>
            </div>
            <span className="team-count">
              <MapPinned size={17} /> {filteredAssignments.length} atama
            </span>
          </div>
          <div className="assignment-filter-bar">
            <div className="assignment-filter-fields">
              <label>
                <span>Başlangıç</span>
                <input
                  type="date"
                  value={pendingDateFrom}
                  max={pendingDateTo || undefined}
                  onChange={(event) => handleDateFromChange(event.target.value)}
                />
              </label>
              <label>
                <span>Bitiş</span>
                <input
                  type="date"
                  value={pendingDateTo}
                  min={pendingDateFrom || undefined}
                  onChange={(event) => handleDateToChange(event.target.value)}
                />
              </label>
              <button
                type="button"
                className="button button-small"
                onClick={applyDateRangeFilter}
              >
                <Search size={14} /> Ara
              </button>
            </div>
            <button
              type="button"
              className="button button-small button-light assignment-filter-today"
              onClick={resetDateRangeToToday}
            >
              Bugün
            </button>
          </div>
          {loading ? (
            <p className="team-empty">Ziyaretler yükleniyor...</p>
          ) : assignments.length === 0 ? (
            <div className="team-empty">
              <MapPinned size={24} />
              <strong>Henüz ziyaret ataması yok</strong>
              <span>İlk müşteri ziyaretini yan taraftan planlayın.</span>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="team-empty">
              <MapPinned size={24} />
              <strong>Bu tarih aralığında ziyaret yok</strong>
              <span>Farklı bir tarih aralığı seçin veya Bugün'e dönün.</span>
            </div>
          ) : (
            <div className="assignment-list">
              {filteredAssignments.map((assignment) => {
                const scheduledAt = new Date(assignment.scheduledAt);
                const isSelected = selectedVisitId === assignment.id;
                return (
                  <article
                    key={assignment.id}
                    className={isSelected ? "assignment-selected" : ""}
                    onClick={() =>
                      setSelectedVisitId((current) =>
                        current === assignment.id ? null : assignment.id,
                      )
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedVisitId((current) =>
                          current === assignment.id ? null : assignment.id,
                        );
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
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
                    <div className="assignment-actions">
                      <span className={`status ${assignment.status}`}>
                        {statusLabels[assignment.status]}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
        <aside className="panel assignment-form-panel">
          {selectedVisit ? (
            <div className="selected-visit-panel">
              <div className="team-form-title">
                <span>
                  <MapPinned size={18} />
                </span>
                <div>
                  <h2>{selectedVisit.customerName}</h2>
                  <p>{selectedVisit.district}</p>
                </div>
              </div>

              <div className="selected-visit-summary selected-visit-meta-grid">
                <div className="meta-card">
                  <strong>Planlanan saat</strong>
                  <span>{formatVisitDateTime(selectedVisit.scheduledAt)}</span>
                </div>
                <div className="meta-card">
                  <strong>Saha çalışanı</strong>
                  <span>
                    {selectedVisit.agentFirstName} {selectedVisit.agentLastName}
                  </span>
                </div>
                <div className="meta-card">
                  <strong>Durum</strong>
                  <span>{statusLabels[selectedVisit.status]}</span>
                </div>
              </div>

              <div className="selected-visit-map-panel">
                {selectedVisit.latitude !== null &&
                selectedVisit.longitude !== null ? (
                  <LocationMap
                    position={{
                      latitude: selectedVisit.latitude,
                      longitude: selectedVisit.longitude,
                    }}
                    markers={[
                      {
                        latitude: selectedVisit.latitude,
                        longitude: selectedVisit.longitude,
                        label: `${selectedVisit.customerName} · müşteri konumu`,
                        color: "#ef4444",
                      },
                      ...(selectedVisit.checkInLatitude !== null &&
                      selectedVisit.checkInLongitude !== null
                        ? [
                            {
                              latitude: selectedVisit.checkInLatitude,
                              longitude: selectedVisit.checkInLongitude,
                              label: `${selectedVisit.customerName} · giriş konumu`,
                              color: "#f59e0b",
                            },
                          ]
                        : []),
                      ...(selectedVisit.checkOutLatitude !== null &&
                      selectedVisit.checkOutLongitude !== null
                        ? [
                            {
                              latitude: selectedVisit.checkOutLatitude,
                              longitude: selectedVisit.checkOutLongitude,
                              label: `${selectedVisit.customerName} · çıkış konumu`,
                              color: "#22c55e",
                            },
                          ]
                        : []),
                    ]}
                    label={`${selectedVisit.customerName} konum haritası`}
                  />
                ) : (
                  <p className="map-missing-location">
                    Bu ziyaret için müşteri konumu tanımlanmadı.
                  </p>
                )}
              </div>

              <div className="selected-visit-summary selected-visit-meta-grid">
                <div className="meta-card">
                  <strong>Giriş zamanı</strong>
                  <span>
                    {selectedVisit.checkInAt
                      ? formatVisitDateTime(selectedVisit.checkInAt)
                      : "Henüz giriş yapılmadı"}
                  </span>
                </div>
                <div className="meta-card">
                  <strong>Çıkış zamanı</strong>
                  <span>
                    {selectedVisit.checkOutAt
                      ? formatVisitDateTime(selectedVisit.checkOutAt)
                      : "Henüz çıkış yapılmadı"}
                  </span>
                </div>
              </div>

              {selectedVisit.status === "planned" && (
                <button
                  type="button"
                  className="button button-small button-danger"
                  disabled={cancellingId === selectedVisit.id}
                  onClick={() => void cancelAssignment(selectedVisit.id)}
                >
                  <X size={16} />
                  {cancellingId === selectedVisit.id
                    ? "İptal ediliyor..."
                    : "Ziyareti iptal et"}
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="team-form-title">
                <span>
                  <Plus size={18} />
                </span>
                <div>
                  <h2>Yeni ziyaret ata</h2>
                  <p>Müşteri ve rota bilgilerini girin</p>
                </div>
              </div>
              {(agents.length === 0 || customers.length === 0) && !loading ? (
                <div className="assignment-no-team">
                  {customers.length === 0 ? (
                    <Store size={20} />
                  ) : (
                    <Users size={20} />
                  )}
                  <strong>
                    {customers.length === 0
                      ? "Önce müşteri tanımlayın"
                      : "Önce saha ekibi oluşturun"}
                  </strong>
                  <p>
                    {customers.length === 0
                      ? "Ziyaret atamak için Müşteriler bölümünden en az bir müşteri ekleyin."
                      : "Ziyaret atamak için en az bir ekip üyesi gereklidir."}
                  </p>
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
                    Müşteri
                    <select
                      name="customerId"
                      required
                      value={selectedCustomerId}
                      onChange={(event) =>
                        setSelectedCustomerId(event.target.value)
                      }
                    >
                      <option value="" disabled>
                        Kayıtlı müşteri seçin
                      </option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} · {customer.district}
                        </option>
                      ))}
                    </select>
                  </label>
                  {selectedCustomer && (
                    <div className="visit-customer-location">
                      <div className="selected-customer-summary">
                        <MapPinned size={15} />
                        <div>
                          <strong>{selectedCustomer.district}</strong>
                          <span>{selectedCustomer.address}</span>
                        </div>
                      </div>
                      {selectedCustomer.latitude !== null &&
                      selectedCustomer.longitude !== null ? (
                        <LocationMap
                          position={{
                            latitude: selectedCustomer.latitude,
                            longitude: selectedCustomer.longitude,
                          }}
                          markers={[
                            {
                              latitude: selectedCustomer.latitude,
                              longitude: selectedCustomer.longitude,
                              label: `${selectedCustomer.name} · müşteri konumu`,
                              color: "#ef4444",
                            },
                          ]}
                          label={`${selectedCustomer.name} müşteri konumu`}
                        />
                      ) : (
                        <p className="map-missing-location">
                          Bu müşteri için konum tanımlanmadı.
                        </p>
                      )}
                    </div>
                  )}
                  <label>
                    Tarih ve saat
                    <input name="scheduledAt" type="datetime-local" required />
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
                  {success && (
                    <FormMessage type="success">{success}</FormMessage>
                  )}
                  <button
                    className="button"
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? "Atanıyor..." : "Ziyareti ekibe ata"}
                    <ArrowRight size={17} />
                  </button>
                </form>
              )}
            </>
          )}
        </aside>
      </div>
    </section>
  );
}
