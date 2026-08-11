import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Store,
} from "lucide-react";
import { FormMessage } from "../../components/FormMessage";
import { PageHeader } from "../../components/PageHeader";
import type { Customer } from "../../types";

export function CustomersManagement({
  onUnauthorized,
}: {
  onUnauthorized: () => void;
}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";
  const token = localStorage.getItem("taskfield_token");
  const normalizedQuery = query.trim().toLocaleLowerCase("tr-TR");
  const filteredCustomers = normalizedQuery
    ? customers.filter((customer) =>
        [
          customer.name,
          customer.contactName,
          customer.district,
          customer.phone,
          customer.email ?? "",
        ].some((value) =>
          value.toLocaleLowerCase("tr-TR").includes(normalizedQuery),
        ),
      )
    : customers;

  useEffect(() => {
    async function loadCustomers() {
      if (!token) {
        onUnauthorized();
        return;
      }
      try {
        const response = await fetch(`${apiUrl}/customers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 401 || response.status === 403) {
          onUnauthorized();
          return;
        }
        const result = (await response.json()) as {
          customers?: Customer[];
          message?: string;
        };
        if (!response.ok) throw new Error(result.message);
        setCustomers(result.customers ?? []);
      } catch (loadError) {
        setError(
          loadError instanceof Error && loadError.message
            ? loadError.message
            : "Müşteriler yüklenemedi.",
        );
      } finally {
        setLoading(false);
      }
    }
    void loadCustomers();
  }, [apiUrl, onUnauthorized, token]);

  async function createCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity() || !token) {
      setError("Zorunlu müşteri bilgilerini eksiksiz doldurun.");
      return;
    }
    const data = new FormData(form);
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`${apiUrl}/customers`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.get("name"),
          contactName: data.get("contactName"),
          phone: data.get("phone"),
          email: data.get("email"),
          district: data.get("district"),
          address: data.get("address"),
          notes: data.get("notes"),
        }),
      });
      if (response.status === 401 || response.status === 403) {
        onUnauthorized();
        return;
      }
      const result = (await response.json()) as {
        customer?: Customer;
        message?: string | string[];
      };
      if (!response.ok || !result.customer) {
        const message = Array.isArray(result.message)
          ? result.message.join(" ")
          : result.message;
        setError(message ?? "Müşteri tanımlanamadı.");
        return;
      }
      setCustomers((current) =>
        [...current, result.customer!].sort((first, second) =>
          first.name.localeCompare(second.name, "tr-TR"),
        ),
      );
      setSuccess(`${result.customer.name} müşteri olarak tanımlandı.`);
      form.reset();
    } catch {
      setError("API'ye ulaşılamadı. Lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="content customers-content" id="customers">
      <PageHeader
        eyebrow="MÜŞTERİ YÖNETİMİ"
        title="Müşteriler"
        description="Ziyaret ve saha operasyonlarında kullanılacak müşteri noktalarını tanımlayın."
        meta={
          <span className="team-count">
            <Store size={17} /> {customers.length} müşteri
          </span>
        }
      />
      <div className="customer-grid">
        <section className="panel customer-list-panel">
          <div className="panel-header customer-panel-header">
            <div>
              <h2>Müşteri listesi</h2>
              <p>Bölgenize tanımlı satış ve ziyaret noktaları</p>
            </div>
            <label className="customer-search">
              <Search size={16} />
              <input
                aria-label="Müşterilerde ara"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Müşteri, yetkili veya ilçe ara"
              />
            </label>
          </div>
          {loading ? (
            <p className="team-empty">Müşteriler yükleniyor...</p>
          ) : customers.length === 0 ? (
            <div className="team-empty">
              <Store size={24} />
              <strong>Henüz müşteri tanımlanmadı</strong>
              <span>İlk müşteri noktasını yan taraftaki formdan ekleyin.</span>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="team-empty customer-no-result">
              <Search size={22} />
              <strong>Aramanızla eşleşen müşteri yok</strong>
              <span>Farklı bir müşteri adı, yetkili veya ilçe deneyin.</span>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="customer-table">
                <thead>
                  <tr>
                    <th>Müşteri</th>
                    <th>Yetkili</th>
                    <th>İletişim</th>
                    <th>Konum</th>
                    <th>Tanımlanma</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <strong>{customer.name}</strong>
                        {customer.notes && <span>{customer.notes}</span>}
                      </td>
                      <td>{customer.contactName}</td>
                      <td>
                        <span className="customer-detail">
                          <Phone size={12} /> {customer.phone}
                        </span>
                        {customer.email && (
                          <span className="customer-detail">
                            <Mail size={12} /> {customer.email}
                          </span>
                        )}
                      </td>
                      <td>
                        <strong className="customer-location">
                          <MapPin size={12} /> {customer.district}
                        </strong>
                        <span>{customer.address}</span>
                      </td>
                      <td>
                        {new Intl.DateTimeFormat("tr-TR").format(
                          new Date(customer.createdAt),
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <aside className="panel assignment-form-panel customer-form-panel">
          <div className="team-form-title">
            <span>
              <Plus size={18} />
            </span>
            <div>
              <h2>Yeni müşteri</h2>
              <p>Müşteri ve iletişim bilgilerini girin</p>
            </div>
          </div>
          <form onSubmit={createCustomer} noValidate>
            <label>
              Müşteri / işletme adı
              <input
                name="name"
                required
                minLength={2}
                maxLength={120}
                placeholder="Pati Dünyası"
              />
            </label>
            <div className="field-row">
              <label>
                Yetkili kişi
                <input
                  name="contactName"
                  required
                  minLength={2}
                  maxLength={120}
                  placeholder="Ece Yılmaz"
                />
              </label>
              <label>
                Telefon
                <input
                  name="phone"
                  type="tel"
                  required
                  minLength={7}
                  maxLength={30}
                  placeholder="0532 111 22 33"
                />
              </label>
            </div>
            <div className="field-row">
              <label>
                E-posta
                <input
                  name="email"
                  type="email"
                  maxLength={254}
                  placeholder="yetkili@firma.com"
                />
              </label>
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
              Müşteri notu
              <textarea
                name="notes"
                maxLength={500}
                placeholder="Çalışma saatleri veya önemli bilgiler"
              />
            </label>
            {error && <FormMessage type="error">{error}</FormMessage>}
            {success && <FormMessage type="success">{success}</FormMessage>}
            <button className="button" type="submit" disabled={submitting}>
              {submitting ? "Tanımlanıyor..." : "Müşteriyi tanımla"}
              <ArrowRight size={17} />
            </button>
          </form>
        </aside>
      </div>
    </section>
  );
}
