import type { VisitStatus } from "@taskfield/domain";
import { useEffect, useState } from "react";
import {
  Ban,
  ChevronRight,
  ClipboardCheck,
  Clock,
  MapPinned,
} from "lucide-react";
import { FormMessage } from "../../components/FormMessage";
import type { VisitAssignment } from "../../types";
import "./Overview.css";

const statusLabels: Record<VisitStatus, string> = {
  planned: "Planlandı",
  in_progress: "Sahada",
  completed: "Tamamlandı",
  cancelled: "İptal",
};

function isToday(value: string) {
  const date = new Date(value);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function formatTime(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Overview({
  onUnauthorized,
  onViewAllVisits,
}: {
  onUnauthorized: () => void;
  onViewAllVisits: () => void;
}) {
  const [visits, setVisits] = useState<VisitAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";
  const token = localStorage.getItem("taskfield_token");

  useEffect(() => {
    let active = true;

    async function loadVisits() {
      if (!token) {
        onUnauthorized();
        return;
      }
      try {
        const response = await fetch(`${apiUrl}/visits`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 401 || response.status === 403) {
          onUnauthorized();
          return;
        }
        const result = (await response.json()) as {
          visits?: VisitAssignment[];
          message?: string;
        };
        if (!response.ok) throw new Error(result.message);
        if (!active) return;
        setVisits(result.visits ?? []);
      } catch (loadError) {
        if (!active) return;
        setError(
          loadError instanceof Error && loadError.message
            ? loadError.message
            : "Ziyaret verileri yüklenemedi.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadVisits();
    return () => {
      active = false;
    };
  }, [apiUrl, onUnauthorized, token]);

  const todaysVisits = visits
    .filter((visit) => isToday(visit.scheduledAt))
    .sort(
      (first, second) =>
        new Date(first.scheduledAt).getTime() -
        new Date(second.scheduledAt).getTime(),
    );
  const completedToday = todaysVisits.filter(
    (visit) => visit.status === "completed",
  ).length;
  const plannedToday = todaysVisits.filter(
    (visit) => visit.status === "planned",
  ).length;
  const cancelledToday = todaysVisits.filter(
    (visit) => visit.status === "cancelled",
  ).length;
  const completionRate = todaysVisits.length
    ? Math.round((completedToday / todaysVisits.length) * 100)
    : 0;

  const inFieldNow = visits
    .filter((visit) => visit.status === "in_progress")
    .sort(
      (first, second) =>
        new Date(second.checkInAt ?? second.scheduledAt).getTime() -
        new Date(first.checkInAt ?? first.scheduledAt).getTime(),
    );
  const districtsInField = new Set(inFieldNow.map((visit) => visit.district))
    .size;

  return (
    <section className="content" id="overview">
      <div className="stat-grid">
        <article>
          <span className="stat-icon green">
            <ClipboardCheck />
          </span>
          <div>
            <p>Tamamlanan ziyaret</p>
            <strong>
              {completedToday}
              <small> / {todaysVisits.length}</small>
            </strong>
            <em>Bugünkü planın %{completionRate}'i</em>
          </div>
        </article>
        <article>
          <span className="stat-icon amber">
            <MapPinned />
          </span>
          <div>
            <p>Şu an sahada</p>
            <strong>{inFieldNow.length}</strong>
            <em>
              {districtsInField > 0
                ? `${districtsInField} farklı bölgede`
                : "Sahada kimse yok"}
            </em>
          </div>
        </article>
        <article>
          <span className="stat-icon blue">
            <Clock />
          </span>
          <div>
            <p>Bekleyen ziyaret</p>
            <strong>{plannedToday}</strong>
            <em>Bugün için planlandı</em>
          </div>
        </article>
        <article>
          <span className="stat-icon red">
            <Ban />
          </span>
          <div>
            <p>İptal edilen</p>
            <strong>{cancelledToday}</strong>
            <em>Bugünkü ziyaretlerden</em>
          </div>
        </article>
      </div>

      <div className="workspace-grid">
        <section className="panel visits-panel">
          <div className="panel-header">
            <div>
              <h2>Bugünün ziyaretleri</h2>
              <p>Planlanan saha hareketleri ve güncel durumları</p>
            </div>
            <button type="button" onClick={onViewAllVisits}>
              Tümünü gör <ChevronRight size={16} />
            </button>
          </div>
          {error && <FormMessage type="error">{error}</FormMessage>}
          <div className="table-wrap">
            {loading ? (
              <p className="team-empty">Ziyaretler yükleniyor...</p>
            ) : todaysVisits.length === 0 ? (
              <p className="team-empty">Bugün için planlanmış ziyaret yok.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Müşteri</th>
                    <th>Temsilci</th>
                    <th>Saat</th>
                    <th>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {todaysVisits.map((visit) => (
                    <tr key={visit.id}>
                      <td>
                        <strong>{visit.customerName}</strong>
                        <span>{visit.district}</span>
                      </td>
                      <td>
                        {visit.agentFirstName} {visit.agentLastName}
                      </td>
                      <td>{formatTime(visit.scheduledAt)}</td>
                      <td>
                        <span className={`status ${visit.status}`}>
                          {statusLabels[visit.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <aside className="panel field-status-panel">
          <div className="panel-header">
            <div>
              <h2>Sahadaki ekip</h2>
              <p>Şu anda ziyarette olan çalışanlar</p>
            </div>
          </div>
          {inFieldNow.length === 0 ? (
            <p className="team-empty">Şu an sahada kimse yok.</p>
          ) : (
            <ul>
              {inFieldNow.map((visit) => (
                <li key={visit.id}>
                  <span className="avatar">
                    {`${visit.agentFirstName[0]}${visit.agentLastName[0]}`.toLocaleUpperCase(
                      "tr-TR",
                    )}
                  </span>
                  <div>
                    <strong>
                      {visit.agentFirstName} {visit.agentLastName}
                    </strong>
                    <p>
                      {visit.customerName} · {visit.district}
                    </p>
                    <time>Giriş: {formatTime(visit.checkInAt)}</time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </section>
  );
}
