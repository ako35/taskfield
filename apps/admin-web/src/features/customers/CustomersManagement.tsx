import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Store,
  X,
} from "lucide-react";
import { AddressAutocomplete } from "../../components/AddressAutocomplete";
import { FormMessage } from "../../components/FormMessage";
import { LocationMap, type MapPosition } from "../../components/LocationMap";
import { PageHeader } from "../../components/PageHeader";
import { geocodeAddress } from "../../services/googleMaps";
import type { Customer } from "../../types";
import "./CustomersManagement.css";

export function CustomersManagement({
  onUnauthorized,
}: {
  onUnauthorized: () => void;
}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(
    null,
  );
  const [query, setQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [position, setPosition] = useState<MapPosition | null>(null);
  const [locationError, setLocationError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";
  const token = localStorage.getItem("taskfield_token");
  const formRef = useRef<HTMLFormElement>(null);
  const editingCustomer = customers.find(
    (customer) => customer.id === editingCustomerId,
  );
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

  async function saveCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const address = String(data.get("address") ?? "").trim();
    if (!form.checkValidity() || !token || !position || address.length < 5) {
      setError("Zorunlu müşteri bilgilerini eksiksiz doldurun.");
      if (!position) {
        setLocationError("Müşterinin konumunu haritada işaretleyin.");
      }
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(
        editingCustomerId
          ? `${apiUrl}/customers/${editingCustomerId}`
          : `${apiUrl}/customers`,
        {
          method: editingCustomerId ? "PATCH" : "POST",
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
            latitude: position.latitude,
            longitude: position.longitude,
            notes: data.get("notes"),
          }),
        },
      );
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
        (editingCustomerId
          ? current.map((customer) =>
              customer.id === editingCustomerId ? result.customer! : customer,
            )
          : [...current, result.customer!]
        ).sort((first, second) =>
          first.name.localeCompare(second.name, "tr-TR"),
        ),
      );
      setSuccess(
        editingCustomerId
          ? `${result.customer.name} bilgileri güncellendi.`
          : `${result.customer.name} müşteri olarak tanımlandı.`,
      );
      resetForm();
    } catch {
      setError("API'ye ulaşılamadı. Lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  function editCustomer(customer: Customer) {
    setSelectedCustomerId(customer.id);
    setEditingCustomerId(customer.id);
    setPosition(
      customer.latitude !== null && customer.longitude !== null
        ? {
            latitude: customer.latitude,
            longitude: customer.longitude,
          }
        : null,
    );
    setError("");
    setSuccess("");
    setLocationError("");
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function resetForm() {
    setSelectedCustomerId(null);
    setEditingCustomerId(null);
    setPosition(null);
    setLocationError("");
    formRef.current?.reset();
  }

  async function locateAddress() {
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    const address = String(data.get("address") ?? "").trim();
    const district = String(data.get("district") ?? "").trim();
    if (address.length < 5 || district.length < 2) {
      setLocationError("Önce ilçe ve açık adresi girin.");
      return;
    }
    setLocating(true);
    setLocationError("");
    try {
      const result = await geocodeAddress(`${address}, ${district}, Türkiye`);
      if (!result) {
        setLocationError(
          "Adres haritada bulunamadı. Harita üzerinde noktayı seçin.",
        );
        return;
      }
      setPosition(result);
    } catch (geocodeError) {
      setLocationError(
        geocodeError instanceof Error
          ? geocodeError.message
          : "Google Geocoding servisine ulaşılamadı.",
      );
    } finally {
      setLocating(false);
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
            <>
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
                      <tr
                        key={customer.id}
                        className={
                          customer.id ===
                          (selectedCustomerId ?? editingCustomerId)
                            ? "selected"
                            : ""
                        }
                        tabIndex={0}
                        aria-label={`${customer.name} müşterisini düzenle`}
                        onClick={() => editCustomer(customer)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            editCustomer(customer);
                          }
                        }}
                      >
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
            </>
          )}
        </section>
        <aside className="panel assignment-form-panel customer-form-panel">
          <div className="team-form-title">
            <span>
              {editingCustomer ? <Store size={18} /> : <Plus size={18} />}
            </span>
            <div>
              <h2>{editingCustomer ? "Müşteriyi düzenle" : "Yeni müşteri"}</h2>
              <p>
                {editingCustomer
                  ? `${editingCustomer.name} bilgilerini güncelleyin`
                  : "Müşteri ve iletişim bilgilerini girin"}
              </p>
            </div>
            {editingCustomer && (
              <button
                className="customer-edit-close"
                type="button"
                aria-label="Düzenlemeyi kapat"
                onClick={resetForm}
              >
                <X size={17} />
              </button>
            )}
          </div>
          <form
            key={editingCustomerId ?? "new"}
            ref={formRef}
            onSubmit={saveCustomer}
            noValidate
          >
            <label>
              Müşteri / işletme adı
              <input
                name="name"
                required
                minLength={2}
                maxLength={120}
                placeholder="Pati Dünyası"
                defaultValue={editingCustomer?.name ?? ""}
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
                  defaultValue={editingCustomer?.contactName ?? ""}
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
                  defaultValue={editingCustomer?.phone ?? ""}
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
                  defaultValue={editingCustomer?.email ?? ""}
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
                  defaultValue={editingCustomer?.district ?? ""}
                />
              </label>
            </div>
            <AddressAutocomplete
              initialAddress={editingCustomer?.address ?? ""}
              onSelect={({ district, position: nextPosition }) => {
                const districtInput =
                  formRef.current?.elements.namedItem("district");
                if (district && districtInput instanceof HTMLInputElement) {
                  districtInput.value = district;
                }
                setPosition(nextPosition);
                setLocationError("");
              }}
              onError={setLocationError}
            />
            <div className="map-picker-heading">
              <div>
                <strong>Harita konumu</strong>
                <span>Adresi bulun veya haritada noktaya tıklayın.</span>
              </div>
              <button type="button" onClick={locateAddress} disabled={locating}>
                <MapPin size={14} />
                {locating ? "Aranıyor..." : "Haritada bul"}
              </button>
            </div>
            <LocationMap
              position={position}
              onPositionChange={(nextPosition) => {
                setPosition(nextPosition);
                setLocationError("");
              }}
              label="Müşteri konumunu seçin"
            />
            <p className="map-coordinate-status" role="status">
              {position
                ? `${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}`
                : "Henüz konum seçilmedi"}
            </p>
            {locationError && (
              <FormMessage type="error">{locationError}</FormMessage>
            )}
            <label>
              Müşteri notu
              <textarea
                name="notes"
                maxLength={500}
                placeholder="Çalışma saatleri veya önemli bilgiler"
                defaultValue={editingCustomer?.notes ?? ""}
              />
            </label>
            {error && <FormMessage type="error">{error}</FormMessage>}
            {success && <FormMessage type="success">{success}</FormMessage>}
            <div className="customer-form-actions">
              {editingCustomer && (
                <button
                  className="password-cancel-button"
                  type="button"
                  onClick={resetForm}
                >
                  Vazgeç
                </button>
              )}
              <button className="button" type="submit" disabled={submitting}>
                {submitting
                  ? "Kaydediliyor..."
                  : editingCustomer
                    ? "Değişiklikleri kaydet"
                    : "Müşteriyi tanımla"}
                <ArrowRight size={17} />
              </button>
            </div>
          </form>
        </aside>
      </div>
    </section>
  );
}
