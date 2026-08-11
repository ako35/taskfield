import type { DailyVisitSummary, VisitStatus } from "@taskfield/domain";
import {
  AlertTriangle,
  ChevronRight,
  ClipboardCheck,
  MapPinned,
  ShoppingCart,
} from "lucide-react";

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

export function Overview() {
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
  );
}
